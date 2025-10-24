import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useQuery } from '@tanstack/react-query';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { ArrowLeft, MapPin, Star } from 'lucide-react';
import type { TourWithGuide, ServiceWithProvider } from '@shared/schema';
import { Link } from 'wouter';

export default function MapView() {
  const { t } = useTranslation();
  const [selectedType, setSelectedType] = useState<'tours' | 'services'>('tours');

  const { data: tours } = useQuery<TourWithGuide[]>({
    queryKey: ['/api/tours'],
    enabled: selectedType === 'tours',
  });

  const { data: services } = useQuery<ServiceWithProvider[]>({
    queryKey: ['/api/services'],
    enabled: selectedType === 'services',
  });

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
        {/* Map placeholder */}
        <div className="flex-1 relative bg-muted">
          <div className="absolute inset-0 flex items-center justify-center">
            <div className="text-center">
              <MapPin className="w-16 h-16 text-muted-foreground mx-auto mb-4" />
              <p className="text-lg text-muted-foreground">
                Interactive map view
              </p>
              <p className="text-sm text-muted-foreground">
                Showing {selectedType === 'tours' ? tours?.length || 0 : services?.length || 0} locations
              </p>
            </div>
          </div>
        </div>

        {/* Side panel */}
        <div className="w-96 border-l bg-card overflow-y-auto">
          <div className="p-4">
            <h3 className="font-semibold mb-4">
              {selectedType === 'tours' ? 'Nearby Tours' : 'Nearby Services'}
            </h3>
            
            <div className="space-y-4">
              {selectedType === 'tours' && tours?.map((tour) => (
                <Card key={tour.id} className="p-4 hover-elevate cursor-pointer" data-testid={`map-tour-${tour.id}`}>
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
                <Card key={service.id} className="p-4 hover-elevate cursor-pointer" data-testid={`map-service-${service.id}`}>
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
