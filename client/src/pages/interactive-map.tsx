import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useQuery } from '@tanstack/react-query';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { ArrowLeft, MapPin, Star } from 'lucide-react';
import type { TourWithGuide, ServiceWithProvider } from '@shared/schema';
import { Link, useLocation } from 'wouter';
import { MapContainer, TileLayer, Marker, Popup } from 'react-leaflet';
import 'leaflet/dist/leaflet.css';

// Fix leaflet default icon issue
import L from 'leaflet';
import iconRetinaUrl from 'leaflet/dist/images/marker-icon-2x.png';
import iconUrl from 'leaflet/dist/images/marker-icon.png';
import shadowUrl from 'leaflet/dist/images/marker-shadow.png';

delete (L.Icon.Default.prototype as any)._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl,
  iconUrl,
  shadowUrl,
});

export default function InteractiveMap() {
  const { t } = useTranslation();
  const [, setLocation] = useLocation();
  const [selectedType, setSelectedType] = useState<'tours' | 'services'>('tours');
  const [selectedItem, setSelectedItem] = useState<TourWithGuide | ServiceWithProvider | null>(null);

  const { data: tours } = useQuery<TourWithGuide[]>({
    queryKey: ['/api/tours'],
    enabled: selectedType === 'tours',
  });

  const { data: services } = useQuery<ServiceWithProvider[]>({
    queryKey: ['/api/services'],
    enabled: selectedType === 'services',
  });

  const items = selectedType === 'tours' ? tours : services;
  const defaultCenter: [number, number] = [41.9028, 12.4964]; // Rome coordinates

  return (
    <div className="min-h-screen bg-background">
      <header className="border-b bg-card sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 py-4 flex items-center gap-4">
          <Link href="/">
            <Button variant="ghost" size="icon" data-testid="button-back">
              <ArrowLeft className="w-5 h-5" />
            </Button>
          </Link>
          <h1 className="text-2xl font-serif font-semibold">{t('map')}</h1>
          <div className="ml-auto flex gap-2">
            <Button 
              variant={selectedType === 'tours' ? 'default' : 'outline'} 
              size="sm"
              onClick={() => setSelectedType('tours')}
              data-testid="button-filter-tours"
            >
              Tours
            </Button>
            <Button 
              variant={selectedType === 'services' ? 'default' : 'outline'} 
              size="sm"
              onClick={() => setSelectedType('services')}
              data-testid="button-filter-services"
            >
              Services
            </Button>
          </div>
        </div>
      </header>

      <div className="flex h-[calc(100vh-73px)]">
        {/* Interactive Map */}
        <div className="flex-1 relative">
          <MapContainer
            center={defaultCenter}
            zoom={13}
            style={{ height: '100%', width: '100%' }}
            data-testid="interactive-map"
          >
            <TileLayer
              attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
              url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
            />
            {items?.map((item) => {
              const isTour = 'guideId' in item;
              const lat = item.latitude;
              const lng = item.longitude;
              
              if (!lat || !lng) return null;

              return (
                <Marker 
                  key={item.id} 
                  position={[lat, lng]}
                  eventHandlers={{
                    click: () => setSelectedItem(item),
                  }}
                >
                  <Popup>
                    <div className="p-2">
                      <h4 className="font-semibold mb-1">
                        {isTour ? (item as TourWithGuide).title : (item as ServiceWithProvider).name}
                      </h4>
                      <p className="text-sm text-muted-foreground mb-2">
                        {isTour ? (item as TourWithGuide).category : (item as ServiceWithProvider).type}
                      </p>
                      <Button 
                        size="sm" 
                        onClick={() => {
                          if (isTour) {
                            setLocation(`/tours/${item.id}`);
                          }
                        }}
                      >
                        View Details
                      </Button>
                    </div>
                  </Popup>
                </Marker>
              );
            })}
          </MapContainer>
        </div>

        {/* Side panel */}
        <div className="w-96 border-l bg-card overflow-y-auto">
          <div className="p-4">
            <h3 className="font-semibold mb-4">
              {selectedType === 'tours' ? 'Nearby Tours' : 'Nearby Services'} ({items?.length || 0})
            </h3>
            
            <div className="space-y-4">
              {selectedType === 'tours' && tours?.map((tour) => (
                <Card 
                  key={tour.id} 
                  className={`p-4 hover-elevate cursor-pointer ${selectedItem?.id === tour.id ? 'border-primary border-2' : ''}`}
                  onClick={() => setLocation(`/tours/${tour.id}`)}
                  data-testid={`map-tour-${tour.id}`}
                >
                  <div className="flex gap-3">
                    <img
                      src={tour.images[0] || 'https://images.unsplash.com/photo-1469854523086-cc02fe5d8800?q=80&w=2021'}
                      alt={tour.title}
                      className="w-20 h-20 rounded-lg object-cover"
                    />
                    <div className="flex-1 min-w-0">
                      <h4 className="font-semibold text-sm mb-1 line-clamp-1">{tour.title}</h4>
                      <div className="flex items-center gap-1 mb-2">
                        <Star className="w-3 h-3 fill-yellow-400 text-yellow-400" />
                        <span className="text-xs">5.0</span>
                      </div>
                      <div className="flex items-center justify-between">
                        <Badge variant="secondary" className="text-xs">{tour.category}</Badge>
                        <span className="text-sm font-semibold">${tour.price}</span>
                      </div>
                    </div>
                  </div>
                </Card>
              ))}

              {selectedType === 'services' && services?.map((service) => (
                <Card 
                  key={service.id} 
                  className={`p-4 hover-elevate cursor-pointer ${selectedItem?.id === service.id ? 'border-primary border-2' : ''}`}
                  onClick={() => setSelectedItem(service)}
                  data-testid={`map-service-${service.id}`}
                >
                  <div className="flex gap-3">
                    <img
                      src={service.images[0] || 'https://images.unsplash.com/photo-1414235077428-338989a2e8c0?q=80&w=2940'}
                      alt={service.name}
                      className="w-20 h-20 rounded-lg object-cover"
                    />
                    <div className="flex-1 min-w-0">
                      <h4 className="font-semibold text-sm mb-1 line-clamp-1">{service.name}</h4>
                      <div className="flex items-center gap-1 mb-2">
                        <Star className="w-3 h-3 fill-yellow-400 text-yellow-400" />
                        <span className="text-xs">5.0</span>
                      </div>
                      <div className="flex items-center justify-between">
                        <Badge variant="secondary" className="text-xs">{service.type}</Badge>
                        <span className="text-xs text-muted-foreground">{service.priceRange}</span>
                      </div>
                    </div>
                  </div>
                </Card>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
