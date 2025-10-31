import { useState, useEffect, useCallback } from 'react';
import { MapContainer, TileLayer, Marker, Popup, useMap } from 'react-leaflet';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useTranslation } from 'react-i18next';
import { useUserLocation } from '@/hooks/use-location';
import { useWebSocket } from '@/hooks/useWebSocket';
import type { WSMessage } from '@/hooks/useWebSocket';
import { Header } from '@/components/layout/Header';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Slider } from '@/components/ui/slider';
import { Skeleton } from '@/components/ui/skeleton';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { JoinGroupModal } from '@/components/JoinGroupModal';
import { GroupStatusBadge } from '@/components/GroupStatusBadge';
import { GroupProgressBar } from '@/components/GroupProgressBar';
import { MapPin, Filter, X, Users, Compass, Euro, TrendingDown, Award } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { SEO } from '@/components/seo';
import { useToast } from '@/hooks/use-toast';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';

// Fix for default markers in React-Leaflet
delete (L.Icon.Default.prototype as any)._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon-2x.png',
  iconUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon.png',
  shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png',
});

// Custom orange marker icon for smart groups
const orangeIcon = new L.Icon({
  iconUrl: 'https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-2x-orange.png',
  shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png',
  iconSize: [25, 41],
  iconAnchor: [12, 41],
  popupAnchor: [1, -34],
  shadowSize: [41, 41]
});

// Custom blue marker icon for community tours
const blueIcon = new L.Icon({
  iconUrl: 'https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-2x-blue.png',
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

interface CommunityTour {
  id: string;
  title: string;
  description: string;
  category: string;
  difficulty: 'easy' | 'moderate' | 'challenging' | 'expert';
  price: string;
  currentParticipants: number;
  maxGroupSize: number;
  status: 'draft' | 'pending' | 'active' | 'confirmed' | 'closed' | 'cancelled';
  latitude: number;
  longitude: number;
  discountRules: Array<{
    threshold: number;
    discount: number;
  }>;
  guideId: string;
  guideName?: string;
}

type ViewMode = 'groups' | 'tours';

// Calculate dynamic price based on current participants and discount rules
function calculateDynamicPrice(basePrice: string, currentParticipants: number, discountRules: Array<{ threshold: number; discount: number }>) {
  const price = parseFloat(basePrice);
  if (isNaN(price) || !discountRules || discountRules.length === 0) {
    return { price, discount: 0 };
  }

  // Find the highest applicable discount
  const applicableDiscounts = discountRules.filter(rule => currentParticipants >= rule.threshold);
  if (applicableDiscounts.length === 0) {
    return { price, discount: 0 };
  }

  const highestDiscount = Math.max(...applicableDiscounts.map(rule => rule.discount));
  const discountedPrice = price * (1 - highestDiscount / 100);

  return {
    price: discountedPrice,
    discount: highestDiscount,
    originalPrice: price
  };
}

// Tour Status Badge Component
function TourStatusBadge({ status }: { status: string }) {
  const { t } = useTranslation();
  
  const statusStyles: Record<string, string> = {
    draft: 'bg-gray-400 text-white',
    pending: 'bg-yellow-500 text-white',
    active: 'bg-green-500 text-white',
    confirmed: 'bg-blue-500 text-white',
    closed: 'bg-red-500 text-white',
    cancelled: 'bg-gray-500 text-white',
  };

  const statusLabels: Record<string, string> = {
    draft: t('tours.status.draft'),
    pending: t('tours.status.pending'),
    active: t('tours.status.active'),
    confirmed: t('tours.status.confirmed'),
    closed: t('tours.status.closed'),
    cancelled: t('tours.status.cancelled'),
  };

  return (
    <Badge className={statusStyles[status] || statusStyles.draft}>
      {statusLabels[status] || status}
    </Badge>
  );
}

// Difficulty Badge Component
function DifficultyBadge({ difficulty }: { difficulty: string }) {
  const { t } = useTranslation();
  
  const difficultyStyles: Record<string, string> = {
    easy: 'bg-green-100 text-green-800 border-green-300',
    moderate: 'bg-yellow-100 text-yellow-800 border-yellow-300',
    challenging: 'bg-orange-100 text-orange-800 border-orange-300',
    expert: 'bg-red-100 text-red-800 border-red-300',
  };

  const difficultyLabels: Record<string, string> = {
    easy: t('tours.difficulty.easy'),
    moderate: t('tours.difficulty.moderate'),
    challenging: t('tours.difficulty.challenging'),
    expert: t('tours.difficulty.expert'),
  };

  return (
    <Badge variant="outline" className={difficultyStyles[difficulty] || difficultyStyles.easy}>
      <Compass className="w-3 h-3 mr-1" />
      {difficultyLabels[difficulty] || difficulty}
    </Badge>
  );
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
  const { toast } = useToast();
  const { location, requestLocation, loading: locationLoading } = useUserLocation();
  const [showFilters, setShowFilters] = useState(true);
  const [selectedGroupId, setSelectedGroupId] = useState<string | null>(null);
  const [selectedTourId, setSelectedTourId] = useState<string | null>(null);
  const [viewMode, setViewMode] = useState<ViewMode>('groups');
  const [filters, setFilters] = useState({
    category: 'all' as 'all' | 'tours' | 'services',
    status: 'all' as 'all' | 'active' | 'almostFull',
    radius: 50,
    difficulty: 'all' as 'all' | 'easy' | 'moderate' | 'challenging' | 'expert',
    minPrice: 0,
    maxPrice: 500,
    minSpots: 0,
  });

  // Default to Rome if no location
  const mapCenter: [number, number] = location
    ? [location.latitude, location.longitude]
    : [41.9028, 12.4964];

  const { data: groups = [], isLoading: groupsLoading } = useQuery<SmartGroup[]>({
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

  const { data: tours = [], isLoading: toursLoading } = useQuery<CommunityTour[]>({
    queryKey: ['/api/community-tours', location?.latitude, location?.longitude, filters.radius],
    queryFn: async () => {
      const params = new URLSearchParams({
        lat: (location?.latitude || 41.9028).toString(),
        lng: (location?.longitude || 12.4964).toString(),
        radius: filters.radius.toString(),
      });
      const res = await fetch(`/api/community-tours?${params}`, {
        credentials: 'include',
      });
      if (!res.ok) {
        throw new Error('Failed to fetch community tours');
      }
      return res.json();
    },
    enabled: !!location || true,
  });

  const isLoading = viewMode === 'groups' ? groupsLoading : toursLoading;

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

  // Filter tours based on selected filters
  const filteredTours = tours.filter((tour) => {
    if (filters.difficulty !== 'all' && tour.difficulty !== filters.difficulty) return false;
    
    const pricing = calculateDynamicPrice(tour.price, tour.currentParticipants, tour.discountRules || []);
    if (pricing.price < filters.minPrice || pricing.price > filters.maxPrice) return false;
    
    const availableSpots = tour.maxGroupSize - tour.currentParticipants;
    if (availableSpots < filters.minSpots) return false;
    
    return true;
  });

  const queryClient = useQueryClient();
  
  const joinTourMutation = useMutation({
    mutationFn: async (tourId: string) => {
      const res = await fetch('/api/bookings', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ tourId }),
      });

      if (!res.ok) {
        const error = await res.json();
        throw new Error(error.message || 'Failed to join tour');
      }

      return res.json();
    },
    onSuccess: () => {
      toast({
        title: t('booking.success'),
        description: t('communityTours.joinSuccess'),
      });

      // Invalidate queries to refresh participant counts and pricing
      queryClient.invalidateQueries({ 
        queryKey: ['/api/community-tours', location?.latitude, location?.longitude, filters.radius] 
      });
      queryClient.invalidateQueries({ 
        queryKey: ['/api/tours'] 
      });

      setSelectedTourId(null);
    },
    onError: (error: any) => {
      toast({
        title: t('common.error'),
        description: error.message,
        variant: 'destructive',
      });
    },
  });

  const handleJoinTour = (tourId: string) => {
    joinTourMutation.mutate(tourId);
  };

  // WebSocket event handling for real-time updates
  const handleWebSocketMessage = useCallback((message: WSMessage) => {
    try {
      if (message.type === 'tour_participant_joined') {
        console.log('[CommunityMap] Tour participant joined event received:', message);
        
        // Invalidate community tours cache to refetch with updated data
        queryClient.invalidateQueries({ 
          queryKey: ['/api/community-tours'] 
        });
        
        // Show toast notification
        const userName = message.userName || t('communityMap.anonymousUser');
        const tourTitle = message.tourTitle;
        const newPrice = message.newPrice || 0;
        const discount = message.discount || 0;
        
        // Use fallback when tourTitle is missing
        let description = tourTitle 
          ? t('communityMap.userJoined', { userName, tourTitle })
          : t('communityMap.userJoinedFallback', { userName });
          
        if (discount > 0) {
          description += ` ${t('communityTours.newPrice', { price: newPrice.toFixed(2), discount })}`;
        } else {
          description += ` ${t('communityTours.newPriceNoDiscount', { price: newPrice.toFixed(2) })}`;
        }
        
        toast({
          title: t('communityTours.newParticipant'),
          description,
          duration: 5000,
        });
      } else if (message.type === 'tour_status_changed') {
        console.log('[CommunityMap] Tour status changed event received:', message);
        
        // Invalidate community tours cache
        queryClient.invalidateQueries({ 
          queryKey: ['/api/community-tours'] 
        });
        
        toast({
          title: t('communityTours.statusChanged'),
          description: t('communityTours.statusUpdated', { status: message.status }),
          duration: 4000,
        });
      }
    } catch (error) {
      console.error('[CommunityMap] Error handling WebSocket message:', error);
    }
  }, [queryClient, toast, t]);

  // Connect to WebSocket for real-time updates
  const { isConnected } = useWebSocket(handleWebSocketMessage);

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
          {/* View Mode Toggle */}
          <div className="absolute top-4 right-4 z-[1000]">
            <Card className="p-2 shadow-lg">
              <Tabs value={viewMode} onValueChange={(value) => setViewMode(value as ViewMode)}>
                <TabsList className="grid w-full grid-cols-2">
                  <TabsTrigger value="groups" className="flex items-center gap-2">
                    <Users className="w-4 h-4" />
                    {t('communityMap.viewToggle.smartGroups')}
                  </TabsTrigger>
                  <TabsTrigger value="tours" className="flex items-center gap-2">
                    <MapPin className="w-4 h-4" />
                    {t('communityMap.viewToggle.communityTours')}
                  </TabsTrigger>
                </TabsList>
              </Tabs>
            </Card>
          </div>

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
                    {/* Smart Groups Filters */}
                    {viewMode === 'groups' && (
                      <>
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
                      </>
                    )}

                    {/* Community Tours Filters */}
                    {viewMode === 'tours' && (
                      <>
                        {/* Difficulty Filter */}
                        <div>
                          <label className="text-sm font-medium mb-2 block">
                            {t('tours.difficulty.label')}
                          </label>
                          <div className="space-y-2">
                            {(['all', 'easy', 'moderate', 'challenging', 'expert'] as const).map((diff) => (
                              <Button
                                key={diff}
                                variant={filters.difficulty === diff ? 'default' : 'outline'}
                                className={`w-full justify-start ${
                                  filters.difficulty === diff ? 'bg-[#FF6600] hover:bg-[#FF6600]/90' : ''
                                }`}
                                onClick={() => setFilters({ ...filters, difficulty: diff })}
                              >
                                {diff === 'all' ? t('common.all') : t(`tours.difficulty.${diff}`)}
                              </Button>
                            ))}
                          </div>
                        </div>

                        {/* Price Range Filter */}
                        <div>
                          <label className="text-sm font-medium mb-2 block">
                            {t('tours.priceRange')}: €{filters.minPrice} - €{filters.maxPrice}
                          </label>
                          <div className="space-y-4">
                            <div>
                              <label className="text-xs text-muted-foreground">{t('tours.minPrice')}</label>
                              <Slider
                                value={[filters.minPrice]}
                                onValueChange={([value]) => setFilters({ ...filters, minPrice: value })}
                                min={0}
                                max={500}
                                step={10}
                                className="mt-2"
                              />
                            </div>
                            <div>
                              <label className="text-xs text-muted-foreground">{t('tours.maxPrice')}</label>
                              <Slider
                                value={[filters.maxPrice]}
                                onValueChange={([value]) => setFilters({ ...filters, maxPrice: value })}
                                min={0}
                                max={500}
                                step={10}
                                className="mt-2"
                              />
                            </div>
                          </div>
                        </div>

                        {/* Min Available Spots Filter */}
                        <div>
                          <label className="text-sm font-medium mb-2 block">
                            {t('communityTours.minSpots')}: {filters.minSpots}
                          </label>
                          <Slider
                            value={[filters.minSpots]}
                            onValueChange={([value]) => setFilters({ ...filters, minSpots: value })}
                            min={0}
                            max={20}
                            step={1}
                            className="mt-2"
                          />
                        </div>
                      </>
                    )}

                    {/* Distance Slider (common) */}
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
                        {viewMode === 'groups' 
                          ? `${filteredGroups.length} ${t('smartGroups.nearbyGroups').toLowerCase()}`
                          : `${filteredTours.length} ${t('communityTours.nearbyTours')}`
                        }
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
                      <p className="text-sm text-muted-foreground">{t('common.you')}</p>
                    </div>
                  </Popup>
                </Marker>
              )}

              {/* Smart Group Markers */}
              {viewMode === 'groups' && filteredGroups.map((group) => {
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

              {/* Community Tour Markers */}
              {viewMode === 'tours' && filteredTours.map((tour) => {
                if (!tour.latitude || !tour.longitude) return null;

                const availableSpots = tour.maxGroupSize - tour.currentParticipants;
                const pricing = calculateDynamicPrice(tour.price, tour.currentParticipants, tour.discountRules || []);
                const progressPercent = (tour.currentParticipants / tour.maxGroupSize) * 100;

                return (
                  <Marker
                    key={tour.id}
                    position={[tour.latitude, tour.longitude]}
                    icon={blueIcon}
                  >
                    <Popup className="custom-popup" maxWidth={300}>
                      <div className="w-72 space-y-3">
                        {/* Header with title and status */}
                        <div className="flex items-start justify-between gap-2">
                          <h3 className="font-semibold text-base flex-1">{tour.title}</h3>
                          <TourStatusBadge status={tour.status} />
                        </div>

                        {/* Category and difficulty badges */}
                        <div className="flex items-center gap-2 flex-wrap">
                          <Badge variant="outline" className="text-xs">
                            {tour.category}
                          </Badge>
                          <DifficultyBadge difficulty={tour.difficulty} />
                        </div>

                        {/* Description */}
                        <p className="text-sm text-muted-foreground line-clamp-2">
                          {tour.description}
                        </p>

                        {/* Participants and progress */}
                        <div className="space-y-2">
                          <div className="flex items-center justify-between text-sm">
                            <span className="flex items-center gap-1">
                              <Users className="w-4 h-4" />
                              {tour.currentParticipants} / {tour.maxGroupSize}
                            </span>
                            <span className="text-muted-foreground">
                              {t('communityMap.spotsLeft', { count: availableSpots })}
                            </span>
                          </div>
                          <Progress value={progressPercent} className="h-2" />
                        </div>

                        {/* Dynamic Pricing */}
                        <div className="bg-muted p-3 rounded-lg">
                          <div className="flex items-center justify-between">
                            <div className="flex items-center gap-2">
                              <Euro className="w-4 h-4 text-[#FF6600]" />
                              <div>
                                <p className="font-semibold text-lg">
                                  €{pricing.price.toFixed(2)}
                                </p>
                                {pricing.discount > 0 && (
                                  <p className="text-xs text-muted-foreground line-through">
                                    €{pricing.originalPrice?.toFixed(2)}
                                  </p>
                                )}
                              </div>
                            </div>
                            {pricing.discount > 0 && (
                              <Badge className="bg-green-500 text-white flex items-center gap-1">
                                <TrendingDown className="w-3 h-3" />
                                {pricing.discount}% {t('tours.discount')}
                              </Badge>
                            )}
                          </div>
                          {pricing.discount > 0 && (
                            <p className="text-xs text-muted-foreground mt-1">
                              {t('communityTours.groupDiscount')}
                            </p>
                          )}
                        </div>

                        {/* Join button */}
                        <Button
                          onClick={() => handleJoinTour(tour.id)}
                          className="w-full bg-[#FF6600] hover:bg-[#FF6600]/90"
                          size="sm"
                          disabled={
                            availableSpots === 0 || 
                            tour.status === 'closed' || 
                            tour.status === 'cancelled' || 
                            joinTourMutation.isPending
                          }
                        >
                          <Award className="w-4 h-4 mr-2" />
                          {joinTourMutation.isPending 
                            ? t('common.loading') 
                            : `${t('communityTours.joinTour')} (+30 pts)`
                          }
                        </Button>
                      </div>
                    </Popup>
                  </Marker>
                );
              })}
            </MapContainer>
          )}

          {/* No Results Message */}
          {!isLoading && (
            (viewMode === 'groups' && filteredGroups.length === 0) ||
            (viewMode === 'tours' && filteredTours.length === 0)
          ) && (
            <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
              <Card className="p-8 text-center pointer-events-auto">
                <MapPin className="w-12 h-12 mx-auto mb-4 text-muted-foreground" />
                <h3 className="text-lg font-semibold mb-2">
                  {viewMode === 'groups' 
                    ? t('smartGroups.noGroupsNearby')
                    : t('communityTours.noToursNearby')
                  }
                </h3>
                <p className="text-muted-foreground mb-4">
                  {viewMode === 'groups'
                    ? t('smartGroups.createFirstGroup')
                    : t('communityTours.adjustFilters')
                  }
                </p>
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
