import { useState, useEffect } from 'react';
import { MapContainer, TileLayer, Marker, Popup, useMap } from 'react-leaflet';
import { useQuery } from '@tanstack/react-query';
import { useTranslation } from 'react-i18next';
import { useUserLocation } from '@/hooks/use-location';
import { Header } from '@/components/layout/Header';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Slider } from '@/components/ui/slider';
import { Skeleton } from '@/components/ui/skeleton';
import { JoinGroupModal } from '@/components/JoinGroupModal';
import { GroupStatusBadge } from '@/components/GroupStatusBadge';
import { GroupProgressBar } from '@/components/GroupProgressBar';
import { MapPin, Filter, X, Users } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { SEO } from '@/components/seo';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';

// Fix for default markers in React-Leaflet
delete (L.Icon.Default.prototype as any)._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon-2x.png',
  iconUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon.png',
  shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png',
});

// Custom orange marker icon
const orangeIcon = new L.Icon({
  iconUrl: 'https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-2x-orange.png',
  shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png',
  iconSize: [25, 41],
  iconAnchor: [12, 41],
  popupAnchor: [1, -34],
  shadowSize: [41, 41]
});

interface SmartGroup {
  id: string;
  name: string;
  description?: string;
  tourId?: string;
  serviceId?: string;
  tourName?: string;
  serviceName?: string;
  currentParticipants: number;
  targetParticipants: number;
  status: 'active' | 'full' | 'expired' | 'completed';
  latitude?: number;
  longitude?: number;
  distance?: number;
}

function MapController({ center }: { center: [number, number] }) {
  const map = useMap();
  useEffect(() => {
    map.setView(center, 13);
  }, [center, map]);
  return null;
}

export default function CommunityMapPage() {
  const { t } = useTranslation();
  const { location, requestLocation, loading: locationLoading } = useUserLocation();
  const [showFilters, setShowFilters] = useState(true);
  const [selectedGroupId, setSelectedGroupId] = useState<string | null>(null);
  const [filters, setFilters] = useState({
    category: 'all' as 'all' | 'tours' | 'services',
    status: 'all' as 'all' | 'active' | 'almostFull',
    radius: 50,
  });

  // Default to Rome if no location
  const mapCenter: [number, number] = location
    ? [location.latitude, location.longitude]
    : [41.9028, 12.4964];

  const { data: groups = [], isLoading } = useQuery<SmartGroup[]>({
    queryKey: ['/api/smart-groups/nearby', location?.latitude, location?.longitude, filters.radius],
    queryFn: async () => {
      const params = new URLSearchParams({
        lat: (location?.latitude || 41.9028).toString(),
        lng: (location?.longitude || 12.4964).toString(),
        radius: filters.radius.toString(),
      });
      const res = await fetch(`/api/smart-groups/nearby?${params}`, {
        credentials: 'include',
      });
      if (!res.ok) {
        throw new Error('Failed to fetch nearby groups');
      }
      return res.json();
    },
    enabled: !!location || true,
  });

  // Filter groups based on selected filters
  const filteredGroups = groups.filter((group) => {
    if (filters.category !== 'all') {
      if (filters.category === 'tours' && !group.tourId) return false;
      if (filters.category === 'services' && !group.serviceId) return false;
    }
    if (filters.status === 'active' && group.status !== 'active') return false;
    if (filters.status === 'almostFull') {
      const spotsLeft = group.targetParticipants - group.currentParticipants;
      if (spotsLeft > 2 || group.status !== 'active') return false;
    }
    return true;
  });

  useEffect(() => {
    if (!location) {
      requestLocation();
    }
  }, []);

  return (
    <>
      <SEO
        title={t('smartGroups.communityMap')}
        description={t('smartGroups.findGroupsNearYou')}
      />
      <div className="min-h-screen bg-background">
        <Header />

        <div className="relative h-[calc(100vh-4rem)]">
          {/* Filters Sidebar */}
          <AnimatePresence>
            {showFilters && (
              <motion.div
                className="absolute top-4 left-4 z-[1000] w-80 max-h-[calc(100vh-8rem)] overflow-y-auto"
                initial={{ x: -320, opacity: 0 }}
                animate={{ x: 0, opacity: 1 }}
                exit={{ x: -320, opacity: 0 }}
                transition={{ type: 'spring', damping: 20 }}
              >
                <Card className="p-6 shadow-lg">
                  <div className="flex items-center justify-between mb-4">
                    <div className="flex items-center gap-2">
                      <Filter className="w-5 h-5 text-[#FF6600]" />
                      <h2 className="text-lg font-semibold">{t('common.filter')}</h2>
                    </div>
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => setShowFilters(false)}
                      className="lg:hidden"
                    >
                      <X className="w-4 h-4" />
                    </Button>
                  </div>

                  <div className="space-y-6">
                    {/* Category Filter */}
                    <div>
                      <label className="text-sm font-medium mb-2 block">
                        {t('tours.category')}
                      </label>
                      <div className="space-y-2">
                        {(['all', 'tours', 'services'] as const).map((cat) => (
                          <Button
                            key={cat}
                            variant={filters.category === cat ? 'default' : 'outline'}
                            className={`w-full justify-start ${
                              filters.category === cat ? 'bg-[#FF6600] hover:bg-[#FF6600]/90' : ''
                            }`}
                            onClick={() => setFilters({ ...filters, category: cat })}
                          >
                            {t(`smartGroups.filters.${cat}`)}
                          </Button>
                        ))}
                      </div>
                    </div>

                    {/* Status Filter */}
                    <div>
                      <label className="text-sm font-medium mb-2 block">
                        {t('booking.status')}
                      </label>
                      <div className="space-y-2">
                        {(['all', 'active', 'almostFull'] as const).map((status) => (
                          <Button
                            key={status}
                            variant={filters.status === status ? 'default' : 'outline'}
                            className={`w-full justify-start ${
                              filters.status === status ? 'bg-[#FF6600] hover:bg-[#FF6600]/90' : ''
                            }`}
                            onClick={() => setFilters({ ...filters, status })}
                          >
                            {t(`smartGroups.filters.${status}`)}
                          </Button>
                        ))}
                      </div>
                    </div>

                    {/* Distance Slider */}
                    <div>
                      <label className="text-sm font-medium mb-2 block">
                        {t('smartGroups.distance', { distance: filters.radius })}
                      </label>
                      <Slider
                        value={[filters.radius]}
                        onValueChange={([value]) => setFilters({ ...filters, radius: value })}
                        min={1}
                        max={50}
                        step={1}
                        className="mt-2"
                      />
                      <div className="flex justify-between text-xs text-muted-foreground mt-1">
                        <span>1 km</span>
                        <span>50 km</span>
                      </div>
                    </div>

                    {/* Results Count */}
                    <div className="pt-4 border-t">
                      <p className="text-sm text-muted-foreground">
                        {filteredGroups.length} {t('smartGroups.nearbyGroups').toLowerCase()}
                      </p>
                    </div>
                  </div>
                </Card>
              </motion.div>
            )}
          </AnimatePresence>

          {/* Toggle Filters Button (Mobile) */}
          {!showFilters && (
            <motion.div
              className="absolute top-4 left-4 z-[1000]"
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
            >
              <Button
                onClick={() => setShowFilters(true)}
                className="bg-[#FF6600] hover:bg-[#FF6600]/90 shadow-lg"
                size="icon"
              >
                <Filter className="w-5 h-5" />
              </Button>
            </motion.div>
          )}

          {/* Map */}
          {isLoading || locationLoading ? (
            <div className="w-full h-full flex items-center justify-center bg-muted">
              <div className="text-center space-y-4">
                <Skeleton className="h-8 w-64 mx-auto" />
                <Skeleton className="h-4 w-48 mx-auto" />
              </div>
            </div>
          ) : (
            <MapContainer
              center={mapCenter}
              zoom={13}
              className="w-full h-full"
              zoomControl={true}
            >
              <MapController center={mapCenter} />
              <TileLayer
                attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
                url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
              />

              {/* User Location Marker */}
              {location && (
                <Marker position={[location.latitude, location.longitude]}>
                  <Popup>
                    <div className="text-center">
                      <p className="font-semibold">{t('discover.nearYou')}</p>
                      <p className="text-sm text-muted-foreground">{t('common.you') || 'You are here'}</p>
                    </div>
                  </Popup>
                </Marker>
              )}

              {/* Group Markers */}
              {filteredGroups.map((group) => {
                if (!group.latitude || !group.longitude) return null;

                return (
                  <Marker
                    key={group.id}
                    position={[group.latitude, group.longitude]}
                    icon={orangeIcon}
                  >
                    <Popup className="custom-popup">
                      <div className="w-64 space-y-3">
                        <div className="flex items-start justify-between gap-2">
                          <h3 className="font-semibold text-base">{group.name}</h3>
                          <GroupStatusBadge status={group.status} />
                        </div>

                        <div className="flex items-center gap-2 text-sm text-muted-foreground">
                          <MapPin className="w-4 h-4" />
                          <span>{group.tourName || group.serviceName}</span>
                        </div>

                        <GroupProgressBar
                          current={group.currentParticipants}
                          target={group.targetParticipants}
                        />

                        {group.distance && (
                          <p className="text-xs text-muted-foreground">
                            {t('smartGroups.distance', { distance: group.distance.toFixed(1) })}
                          </p>
                        )}

                        <Button
                          onClick={() => setSelectedGroupId(group.id)}
                          className="w-full bg-[#FF6600] hover:bg-[#FF6600]/90"
                          size="sm"
                          disabled={group.status === 'full' || group.status === 'expired'}
                        >
                          <Users className="w-4 h-4 mr-2" />
                          {t('smartGroups.joinGroup')}
                        </Button>
                      </div>
                    </Popup>
                  </Marker>
                );
              })}
            </MapContainer>
          )}

          {/* No Groups Message */}
          {!isLoading && filteredGroups.length === 0 && (
            <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
              <Card className="p-8 text-center pointer-events-auto">
                <MapPin className="w-12 h-12 mx-auto mb-4 text-muted-foreground" />
                <h3 className="text-lg font-semibold mb-2">{t('smartGroups.noGroupsNearby')}</h3>
                <p className="text-muted-foreground mb-4">{t('smartGroups.createFirstGroup')}</p>
              </Card>
            </div>
          )}
        </div>

        {/* Join Group Modal */}
        {selectedGroupId && (
          <JoinGroupModal
            groupId={selectedGroupId}
            isOpen={!!selectedGroupId}
            onClose={() => setSelectedGroupId(null)}
          />
        )}
      </div>
    </>
  );
}
