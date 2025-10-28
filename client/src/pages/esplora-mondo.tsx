import { useState } from 'react';
import { useLocation } from 'wouter';
import { Canvas } from '@react-three/fiber';
import { OrbitControls } from '@react-three/drei';
import { Header } from '@/components/layout/Header';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Globe, Markers } from '@/components/3d/GlobeScene';
import { useGlobeData } from '@/hooks/useGlobeData';
import type { GlobeMarker } from '@/lib/geolocation';
import { Globe as GlobeIcon, MapPin, UtensilsCrossed, Calendar, Loader2 } from 'lucide-react';
import { Helmet } from 'react-helmet-async';

export default function EsploraMondo() {
  const [, navigate] = useLocation();
  const { markers, isLoading } = useGlobeData();
  
  const [selectedMarker, setSelectedMarker] = useState<GlobeMarker | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [visibleTypes, setVisibleTypes] = useState<Set<'tour' | 'service' | 'event'>>(
    new Set(['tour', 'service', 'event'] as const)
  );
  
  // Filter markers by search
  const filteredMarkers = markers.filter(m =>
    m.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
    m.location.toLowerCase().includes(searchQuery.toLowerCase())
  );
  
  // Toggle visibility
  const toggleType = (type: 'tour' | 'service' | 'event') => {
    const newSet = new Set(visibleTypes);
    if (newSet.has(type)) {
      newSet.delete(type);
    } else {
      newSet.add(type);
    }
    setVisibleTypes(newSet);
  };
  
  const handleMarkerClick = (marker: GlobeMarker) => {
    setSelectedMarker(marker);
  };
  
  const handleViewDetails = () => {
    if (!selectedMarker) return;
    if (selectedMarker.type === 'tour') {
      navigate(`/tours/${selectedMarker.id}`);
    } else if (selectedMarker.type === 'service') {
      navigate(`/services/${selectedMarker.id}`);
    } else {
      navigate(`/events/${selectedMarker.id}`);
    }
  };
  
  return (
    <div className="h-screen flex flex-col">
      <Helmet>
        <title>Esplora Mondo 3D | TourConnect</title>
        <meta name="description" content="Esplora tour, servizi ed eventi in tutto il mondo con il nostro globo 3D interattivo" />
      </Helmet>
      
      <Header />
      
      <div className="flex-1 relative">
        {/* Loading State */}
        {isLoading && (
          <div className="absolute inset-0 flex items-center justify-center bg-background/80 z-10">
            <div className="text-center">
              <Loader2 className="h-12 w-12 animate-spin mx-auto mb-4 text-primary" />
              <p className="text-muted-foreground">Caricamento globo...</p>
            </div>
          </div>
        )}
        
        {/* Globe Canvas */}
        {!isLoading && (
          <div className="absolute inset-0" data-testid="globe-canvas">
            <Canvas camera={{ position: [0, 0, 5], fov: 45 }}>
              {/* Lighting */}
              <ambientLight intensity={0.5} />
              <pointLight position={[10, 10, 10]} intensity={1} />
              
              {/* Globe */}
              <Globe />
              
              {/* Markers */}
              <Markers 
                markers={filteredMarkers}
                onMarkerClick={handleMarkerClick}
                selectedMarkerId={selectedMarker?.id}
                visibleTypes={visibleTypes}
              />
              
              {/* Controls */}
              <OrbitControls 
                enablePan={false}
                minDistance={3}
                maxDistance={10}
                autoRotate={false}
              />
            </Canvas>
          </div>
        )}
        
        {/* UI Overlays */}
        <div className="absolute top-4 left-4 z-10 space-y-4">
          {/* Title Card */}
          <Card className="w-80">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <GlobeIcon className="h-5 w-5 text-primary" />
                Esplora Mondo 3D
              </CardTitle>
              <CardDescription>
                {markers.length} destinazioni in tutto il mondo
              </CardDescription>
            </CardHeader>
          </Card>
          
          {/* Search */}
          <Card className="w-80">
            <CardContent className="pt-6">
              <Input
                placeholder="Cerca destinazione..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                data-testid="input-search"
              />
            </CardContent>
          </Card>
          
          {/* Type Toggles */}
          <Card className="w-80">
            <CardHeader>
              <CardTitle className="text-sm">Filtra per Tipo</CardTitle>
            </CardHeader>
            <CardContent className="flex flex-wrap gap-2">
              <Badge
                variant={visibleTypes.has('tour') ? 'default' : 'outline'}
                className="cursor-pointer toggle-elevate"
                onClick={() => toggleType('tour')}
                data-testid="toggle-tours"
              >
                <MapPin className="h-3 w-3 mr-1" />
                Tours
              </Badge>
              <Badge
                variant={visibleTypes.has('service') ? 'default' : 'outline'}
                className="cursor-pointer toggle-elevate"
                onClick={() => toggleType('service')}
                data-testid="toggle-services"
              >
                <UtensilsCrossed className="h-3 w-3 mr-1" />
                Servizi
              </Badge>
              <Badge
                variant={visibleTypes.has('event') ? 'default' : 'outline'}
                className="cursor-pointer toggle-elevate"
                onClick={() => toggleType('event')}
                data-testid="toggle-events"
              >
                <Calendar className="h-3 w-3 mr-1" />
                Eventi
              </Badge>
            </CardContent>
          </Card>
        </div>
        
        {/* Selected Marker Detail Panel */}
        {selectedMarker && (
          <div className="absolute bottom-4 right-4 z-10">
            <Card className="w-96" data-testid="card-marker-detail">
              <CardHeader>
                <CardTitle>{selectedMarker.title}</CardTitle>
                <CardDescription>{selectedMarker.location}</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                {selectedMarker.images && selectedMarker.images[0] && (
                  <img 
                    src={selectedMarker.images[0]} 
                    alt={selectedMarker.title}
                    className="w-full h-48 object-cover rounded"
                  />
                )}
                {selectedMarker.price && (
                  <div className="text-lg font-semibold">
                    €{selectedMarker.price.toFixed(2)}
                  </div>
                )}
                <div className="flex gap-2">
                  <Button 
                    onClick={handleViewDetails}
                    className="flex-1"
                    data-testid="button-view-details"
                  >
                    Vedi Dettagli
                  </Button>
                  <Button 
                    variant="outline"
                    onClick={() => setSelectedMarker(null)}
                    data-testid="button-close-detail"
                  >
                    Chiudi
                  </Button>
                </div>
              </CardContent>
            </Card>
          </div>
        )}
      </div>
    </div>
  );
}
