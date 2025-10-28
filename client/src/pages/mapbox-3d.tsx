import { useState, useEffect, useRef } from 'react';
import { useTranslation } from 'react-i18next';
import { useQuery } from '@tanstack/react-query';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Slider } from '@/components/ui/slider';
import { ArrowLeft, Box, Flame, Layers, MapPin, Star, X } from 'lucide-react';
import type { TourWithGuide, ServiceWithProvider } from '@shared/schema';
import { Link, useLocation } from 'wouter';
import mapboxgl from 'mapbox-gl';
import 'mapbox-gl/dist/mapbox-gl.css';

const MAPBOX_TOKEN = import.meta.env.VITE_MAPBOX_TOKEN || 'pk.eyJ1IjoibWFwYm94IiwiYSI6ImNpejY4NXVycTA2emYycXBndHRqcmZ3N3gifQ.rJcFIG214AriISLbB6B5aw';
mapboxgl.accessToken = MAPBOX_TOKEN;

interface Filters {
  type: 'all' | 'tours' | 'services';
  category: string;
  priceMin: number;
  priceMax: number;
  ratingMin: number;
}

export default function MapboxMap3D() {
  const { t } = useTranslation();
  const [, setLocation] = useLocation();
  const mapContainerRef = useRef<HTMLDivElement>(null);
  const mapRef = useRef<mapboxgl.Map | null>(null);
  const [mapLoaded, setMapLoaded] = useState(false);
  const [is3D, setIs3D] = useState(true);
  const [showHeatmap, setShowHeatmap] = useState(false);
  const [showFilters, setShowFilters] = useState(true);
  const [filters, setFilters] = useState<Filters>({
    type: 'all',
    category: 'all',
    priceMin: 0,
    priceMax: 1000,
    ratingMin: 0,
  });

  const { data: tours, isLoading: toursLoading } = useQuery<TourWithGuide[]>({
    queryKey: ['/api/tours'],
  });

  const { data: services, isLoading: servicesLoading } = useQuery<ServiceWithProvider[]>({
    queryKey: ['/api/services'],
  });

  const defaultCenter: [number, number] = [12.4964, 41.9028];

  const filteredTours = tours?.filter(tour => {
    if (filters.type === 'services') return false;
    if (filters.category !== 'all' && tour.category !== filters.category) return false;
    const price = parseFloat(tour.price || '0');
    if (price < filters.priceMin || price > filters.priceMax) return false;
    
    if (tour.averageRating !== null && tour.averageRating !== undefined && tour.averageRating < filters.ratingMin) {
      return false;
    }
    
    return true;
  }) || [];

  const filteredServices = services?.filter(service => {
    if (filters.type === 'tours') return false;
    if (filters.category !== 'all' && service.type !== filters.category) return false;
    
    if (service.averageRating !== null && service.averageRating !== undefined && service.averageRating < filters.ratingMin) {
      return false;
    }
    
    return true;
  }) || [];

  useEffect(() => {
    if (!mapContainerRef.current || mapRef.current) return;

    const map = new mapboxgl.Map({
      container: mapContainerRef.current,
      style: 'mapbox://styles/mapbox/streets-v12',
      center: defaultCenter,
      zoom: 12,
      pitch: 45,
      bearing: 0,
      antialias: true,
    });

    map.on('load', () => {
      const style = map.getStyle();
      const layers = style?.layers;
      const labelLayerId = layers?.find(
        (layer) => layer.type === 'symbol' && layer.layout && 'text-field' in layer.layout
      )?.id;

      map.addLayer(
        {
          id: '3d-buildings',
          source: 'composite',
          'source-layer': 'building',
          filter: ['==', 'extrude', 'true'],
          type: 'fill-extrusion',
          minzoom: 15,
          paint: {
            'fill-extrusion-color': '#aaa',
            'fill-extrusion-height': ['get', 'height'],
            'fill-extrusion-base': ['get', 'min_height'],
            'fill-extrusion-opacity': 0.6,
          },
        },
        labelLayerId
      );

      map.addSource('tours', {
        type: 'geojson',
        data: {
          type: 'FeatureCollection',
          features: [],
        },
        cluster: true,
        clusterMaxZoom: 14,
        clusterRadius: 50,
      });

      map.addSource('services', {
        type: 'geojson',
        data: {
          type: 'FeatureCollection',
          features: [],
        },
        cluster: true,
        clusterMaxZoom: 14,
        clusterRadius: 50,
      });

      map.addSource('tours-heatmap', {
        type: 'geojson',
        data: {
          type: 'FeatureCollection',
          features: [],
        },
      });

      map.addSource('services-heatmap', {
        type: 'geojson',
        data: {
          type: 'FeatureCollection',
          features: [],
        },
      });

      map.addLayer({
        id: 'tours-clusters',
        type: 'circle',
        source: 'tours',
        filter: ['has', 'point_count'],
        paint: {
          'circle-color': '#FF6600',
          'circle-radius': [
            'step',
            ['get', 'point_count'],
            20,
            10, 25,
            30, 30,
          ],
          'circle-stroke-width': 2,
          'circle-stroke-color': '#fff',
        },
      });

      map.addLayer({
        id: 'tours-cluster-count',
        type: 'symbol',
        source: 'tours',
        filter: ['has', 'point_count'],
        layout: {
          'text-field': '{point_count_abbreviated}',
          'text-size': 14,
          'text-font': ['DIN Offc Pro Medium', 'Arial Unicode MS Bold'],
        },
        paint: {
          'text-color': '#ffffff',
        },
      });

      map.addLayer({
        id: 'tours-unclustered',
        type: 'circle',
        source: 'tours',
        filter: ['!', ['has', 'point_count']],
        paint: {
          'circle-color': '#FF6600',
          'circle-radius': 10,
          'circle-stroke-width': 2,
          'circle-stroke-color': '#fff',
        },
      });

      map.addLayer({
        id: 'services-clusters',
        type: 'circle',
        source: 'services',
        filter: ['has', 'point_count'],
        paint: {
          'circle-color': '#0080FF',
          'circle-radius': [
            'step',
            ['get', 'point_count'],
            20,
            10, 25,
            30, 30,
          ],
          'circle-stroke-width': 2,
          'circle-stroke-color': '#fff',
        },
      });

      map.addLayer({
        id: 'services-cluster-count',
        type: 'symbol',
        source: 'services',
        filter: ['has', 'point_count'],
        layout: {
          'text-field': '{point_count_abbreviated}',
          'text-size': 14,
          'text-font': ['DIN Offc Pro Medium', 'Arial Unicode MS Bold'],
        },
        paint: {
          'text-color': '#ffffff',
        },
      });

      map.addLayer({
        id: 'services-unclustered',
        type: 'circle',
        source: 'services',
        filter: ['!', ['has', 'point_count']],
        paint: {
          'circle-color': '#0080FF',
          'circle-radius': 10,
          'circle-stroke-width': 2,
          'circle-stroke-color': '#fff',
        },
      });

      map.addLayer({
        id: 'tours-heat',
        type: 'heatmap',
        source: 'tours-heatmap',
        maxzoom: 15,
        layout: {
          visibility: 'none',
        },
        paint: {
          'heatmap-weight': 1,
          'heatmap-intensity': 1,
          'heatmap-color': [
            'interpolate',
            ['linear'],
            ['heatmap-density'],
            0, 'rgba(0, 0, 255, 0)',
            0.2, 'rgb(0, 255, 255)',
            0.4, 'rgb(0, 255, 0)',
            0.6, 'rgb(255, 255, 0)',
            0.8, 'rgb(255, 128, 0)',
            1, 'rgb(255, 0, 0)',
          ],
          'heatmap-radius': 30,
          'heatmap-opacity': 0.7,
        },
      });

      map.addLayer({
        id: 'services-heat',
        type: 'heatmap',
        source: 'services-heatmap',
        maxzoom: 15,
        layout: {
          visibility: 'none',
        },
        paint: {
          'heatmap-weight': 1,
          'heatmap-intensity': 1,
          'heatmap-color': [
            'interpolate',
            ['linear'],
            ['heatmap-density'],
            0, 'rgba(0, 0, 255, 0)',
            0.2, 'rgb(0, 255, 255)',
            0.4, 'rgb(0, 255, 0)',
            0.6, 'rgb(255, 255, 0)',
            0.8, 'rgb(255, 128, 0)',
            1, 'rgb(255, 0, 0)',
          ],
          'heatmap-radius': 30,
          'heatmap-opacity': 0.7,
        },
      });

      map.on('click', 'tours-clusters', (e) => {
        const features = map.queryRenderedFeatures(e.point, { layers: ['tours-clusters'] });
        const clusterId = features[0]?.properties?.cluster_id;
        if (!clusterId) return;
        
        const source = map.getSource('tours') as mapboxgl.GeoJSONSource;
        source.getClusterExpansionZoom(clusterId, (err, zoom) => {
          if (err || !features[0].geometry || features[0].geometry.type !== 'Point') return;
          map.easeTo({
            center: features[0].geometry.coordinates as [number, number],
            zoom: zoom || 14,
          });
        });
      });

      map.on('click', 'services-clusters', (e) => {
        const features = map.queryRenderedFeatures(e.point, { layers: ['services-clusters'] });
        const clusterId = features[0]?.properties?.cluster_id;
        if (!clusterId) return;
        
        const source = map.getSource('services') as mapboxgl.GeoJSONSource;
        source.getClusterExpansionZoom(clusterId, (err, zoom) => {
          if (err || !features[0].geometry || features[0].geometry.type !== 'Point') return;
          map.easeTo({
            center: features[0].geometry.coordinates as [number, number],
            zoom: zoom || 14,
          });
        });
      });

      map.on('click', 'tours-unclustered', (e) => {
        const features = e.features;
        if (!features || !features[0] || features[0].geometry.type !== 'Point') return;
        
        const coordinates = features[0].geometry.coordinates.slice() as [number, number];
        const props = features[0].properties;
        
        new mapboxgl.Popup()
          .setLngLat(coordinates)
          .setHTML(`
            <div class="mapbox-popup-content">
              <h3 class="font-semibold text-base mb-1">${props?.title || ''}</h3>
              <p class="text-sm text-muted-foreground mb-2">${props?.category || ''}</p>
              <div class="flex items-center justify-between">
                <span class="font-semibold text-primary">€${props?.price || '0'}</span>
                <button 
                  class="text-sm text-primary hover-elevate px-3 py-1 rounded-md bg-primary/10" 
                  onclick="window.location.href='/tours/${props?.id}'"
                  data-testid="button-tour-details-${props?.id}"
                >
                  View Details
                </button>
              </div>
            </div>
          `)
          .addTo(map);
      });

      map.on('click', 'services-unclustered', (e) => {
        const features = e.features;
        if (!features || !features[0] || features[0].geometry.type !== 'Point') return;
        
        const coordinates = features[0].geometry.coordinates.slice() as [number, number];
        const props = features[0].properties;
        
        new mapboxgl.Popup()
          .setLngLat(coordinates)
          .setHTML(`
            <div class="mapbox-popup-content">
              <h3 class="font-semibold text-base mb-1">${props?.name || ''}</h3>
              <p class="text-sm text-muted-foreground mb-2">${props?.type || ''}</p>
              <div class="flex items-center">
                <span class="text-sm">${props?.priceRange || ''}</span>
              </div>
            </div>
          `)
          .addTo(map);
      });

      map.on('mouseenter', 'tours-clusters', () => {
        map.getCanvas().style.cursor = 'pointer';
      });
      map.on('mouseleave', 'tours-clusters', () => {
        map.getCanvas().style.cursor = '';
      });
      map.on('mouseenter', 'services-clusters', () => {
        map.getCanvas().style.cursor = 'pointer';
      });
      map.on('mouseleave', 'services-clusters', () => {
        map.getCanvas().style.cursor = '';
      });
      map.on('mouseenter', 'tours-unclustered', () => {
        map.getCanvas().style.cursor = 'pointer';
      });
      map.on('mouseleave', 'tours-unclustered', () => {
        map.getCanvas().style.cursor = '';
      });
      map.on('mouseenter', 'services-unclustered', () => {
        map.getCanvas().style.cursor = 'pointer';
      });
      map.on('mouseleave', 'services-unclustered', () => {
        map.getCanvas().style.cursor = '';
      });

      setMapLoaded(true);
    });

    mapRef.current = map;

    return () => {
      map.remove();
      mapRef.current = null;
    };
  }, []);

  useEffect(() => {
    if (!mapRef.current || !mapLoaded) return;

    const toursGeoJSON: GeoJSON.FeatureCollection = {
      type: 'FeatureCollection',
      features: filteredTours.map(tour => ({
        type: 'Feature',
        geometry: {
          type: 'Point',
          coordinates: [tour.longitude, tour.latitude],
        },
        properties: {
          id: tour.id,
          title: tour.title,
          category: tour.category,
          price: tour.price,
        },
      })),
    };

    const servicesGeoJSON: GeoJSON.FeatureCollection = {
      type: 'FeatureCollection',
      features: filteredServices.map(service => ({
        type: 'Feature',
        geometry: {
          type: 'Point',
          coordinates: [service.longitude, service.latitude],
        },
        properties: {
          id: service.id,
          name: service.name,
          type: service.type,
          priceRange: service.priceRange,
        },
      })),
    };

    const toursSource = mapRef.current.getSource('tours') as mapboxgl.GeoJSONSource;
    const servicesSource = mapRef.current.getSource('services') as mapboxgl.GeoJSONSource;
    const toursHeatmapSource = mapRef.current.getSource('tours-heatmap') as mapboxgl.GeoJSONSource;
    const servicesHeatmapSource = mapRef.current.getSource('services-heatmap') as mapboxgl.GeoJSONSource;

    if (toursSource) toursSource.setData(toursGeoJSON);
    if (servicesSource) servicesSource.setData(servicesGeoJSON);
    if (toursHeatmapSource) toursHeatmapSource.setData(toursGeoJSON);
    if (servicesHeatmapSource) servicesHeatmapSource.setData(servicesGeoJSON);
  }, [filteredTours, filteredServices, mapLoaded]);

  const toggle3D = () => {
    if (!mapRef.current) return;
    const newPitch = is3D ? 0 : 45;
    mapRef.current.easeTo({ pitch: newPitch, duration: 1000 });
    setIs3D(!is3D);
  };

  const toggleHeatmap = () => {
    if (!mapRef.current) return;
    const newVisibility = showHeatmap ? 'none' : 'visible';
    mapRef.current.setLayoutProperty('tours-heat', 'visibility', newVisibility);
    mapRef.current.setLayoutProperty('services-heat', 'visibility', newVisibility);
    
    const clustersVisibility = showHeatmap ? 'visible' : 'none';
    mapRef.current.setLayoutProperty('tours-clusters', 'visibility', clustersVisibility);
    mapRef.current.setLayoutProperty('tours-cluster-count', 'visibility', clustersVisibility);
    mapRef.current.setLayoutProperty('tours-unclustered', 'visibility', clustersVisibility);
    mapRef.current.setLayoutProperty('services-clusters', 'visibility', clustersVisibility);
    mapRef.current.setLayoutProperty('services-cluster-count', 'visibility', clustersVisibility);
    mapRef.current.setLayoutProperty('services-unclustered', 'visibility', clustersVisibility);
    
    setShowHeatmap(!showHeatmap);
  };

  const categories = Array.from(new Set([
    ...(tours?.map(t => t.category) || []),
    ...(services?.map(s => s.type) || [])
  ]));

  return (
    <div className="min-h-screen bg-background relative">
      <header className="absolute top-0 left-0 right-0 z-50 bg-card/80 backdrop-blur-md border-b">
        <div className="max-w-7xl mx-auto px-4 py-4 flex items-center gap-4">
          <Link href="/">
            <Button variant="ghost" size="icon" data-testid="button-back">
              <ArrowLeft className="w-5 h-5" />
            </Button>
          </Link>
          <h1 className="text-2xl font-serif font-semibold">Mappa 3D Interattiva</h1>
          <Badge variant="secondary" className="ml-2">Mapbox GL</Badge>
        </div>
      </header>

      <div className="h-screen pt-[73px] relative">
        <div ref={mapContainerRef} className="w-full h-full" data-testid="mapbox-3d-container" />

        {showFilters && (
          <Card className="absolute left-4 top-20 w-80 p-4 shadow-lg z-40">
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-semibold">Filtri</h3>
              <Button
                variant="ghost"
                size="icon"
                onClick={() => setShowFilters(false)}
                data-testid="button-close-filters"
              >
                <X className="w-4 h-4" />
              </Button>
            </div>

            <div className="space-y-4">
              <div>
                <label className="text-sm font-medium mb-2 block">Tipo</label>
                <Select value={filters.type} onValueChange={(v) => setFilters({...filters, type: v as any})}>
                  <SelectTrigger data-testid="select-map-type">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Tutti</SelectItem>
                    <SelectItem value="tours">Solo Tour</SelectItem>
                    <SelectItem value="services">Solo Servizi</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div>
                <label className="text-sm font-medium mb-2 block">Categoria</label>
                <Select value={filters.category} onValueChange={(v) => setFilters({...filters, category: v})}>
                  <SelectTrigger data-testid="select-category">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Tutte</SelectItem>
                    {categories.map(cat => (
                      <SelectItem key={cat} value={cat}>{cat}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div>
                <label className="text-sm font-medium mb-2 block">
                  Prezzo: €{filters.priceMin} - €{filters.priceMax}
                </label>
                <Slider
                  min={0}
                  max={1000}
                  step={10}
                  value={[filters.priceMin, filters.priceMax]}
                  onValueChange={([min, max]) => setFilters({...filters, priceMin: min, priceMax: max})}
                  data-testid="slider-price-range"
                />
              </div>

              <div>
                <label className="text-sm font-medium mb-2 block">
                  Rating minimo: {filters.ratingMin}⭐
                </label>
                <Slider
                  min={0}
                  max={5}
                  step={0.5}
                  value={[filters.ratingMin]}
                  onValueChange={([val]) => setFilters({...filters, ratingMin: val})}
                  data-testid="slider-rating-min"
                />
              </div>

              <Button
                variant="outline"
                className="w-full"
                onClick={() => setFilters({type: 'all', category: 'all', priceMin: 0, priceMax: 1000, ratingMin: 0})}
                data-testid="button-reset-filters"
              >
                Reset Filtri
              </Button>
            </div>
          </Card>
        )}

        {!showFilters && (
          <Button
            variant="secondary"
            size="icon"
            className="absolute left-4 top-20 z-40"
            onClick={() => setShowFilters(true)}
            data-testid="button-show-filters"
          >
            <Layers className="w-4 h-4" />
          </Button>
        )}

        <div className="absolute right-4 top-20 flex flex-col gap-2 z-40">
          <Button
            size="icon"
            variant="secondary"
            onClick={toggle3D}
            data-testid="button-toggle-3d"
            className={is3D ? 'bg-primary text-primary-foreground' : ''}
          >
            <Box className="w-4 h-4" />
          </Button>

          <Button
            size="icon"
            variant="secondary"
            onClick={toggleHeatmap}
            data-testid="button-toggle-heatmap"
            className={showHeatmap ? 'bg-primary text-primary-foreground' : ''}
          >
            <Flame className="w-4 h-4" />
          </Button>
        </div>

        <Card className="absolute bottom-4 left-4 p-3 shadow-lg z-40">
          <div className="flex items-center gap-4 text-sm">
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 rounded-full bg-[#FF6600]" />
              <span>Tour</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 rounded-full bg-[#0080FF]" />
              <span>Servizi</span>
            </div>
          </div>
        </Card>

        <Card className="absolute bottom-4 right-4 px-3 py-2 shadow-lg z-40">
          <div className="text-xs text-muted-foreground">
            {filteredTours.length} tour · {filteredServices.length} servizi
          </div>
        </Card>

        {(toursLoading || servicesLoading) && (
          <div className="absolute inset-0 bg-background/50 backdrop-blur-sm flex items-center justify-center z-50">
            <div className="text-center">
              <div className="animate-spin w-8 h-8 border-4 border-primary border-t-transparent rounded-full mx-auto mb-2" />
              <p className="text-sm">Caricamento mappa...</p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
