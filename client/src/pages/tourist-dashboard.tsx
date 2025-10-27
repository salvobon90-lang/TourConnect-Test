import { useEffect, useState, useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import { useAuth } from '@/hooks/useAuth';
import { useToast } from '@/hooks/use-toast';
import { useQuery } from '@tanstack/react-query';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Search, MapPin, Star, Clock, Users, Heart, Calendar, Map as MapIcon, Navigation, Sparkles } from 'lucide-react';
import type { TourWithGuide } from '@shared/schema';
import { Skeleton } from '@/components/ui/skeleton';
import { Link } from 'wouter';
import { useUserLocation } from '@/hooks/use-location';
import { calculateDistance, formatDistance } from '@/lib/geolocation';
import { LanguageSwitcher } from '@/components/language-switcher';
import { Logo } from '@/components/logo';

type TourWithDistance = TourWithGuide & { distance?: number };

export default function TouristDashboard() {
  const { t } = useTranslation();
  const { user, isAuthenticated, isLoading: authLoading } = useAuth();
  const { toast } = useToast();
  const [searchTerm, setSearchTerm] = useState('');
  const [category, setCategory] = useState<string>('');
  const [priceFilter, setPriceFilter] = useState<string>('');
  const [proximityFilter, setProximityFilter] = useState<string>('');
  const { location, loading: locationLoading, error: locationError, requestLocation, hasLocation } = useUserLocation();

  useEffect(() => {
    if (!authLoading && !isAuthenticated) {
      toast({
        title: t('system.unauthorized'),
        description: t('system.unauthorizedDesc'),
        variant: 'destructive',
      });
      setTimeout(() => {
        window.location.href = '/api/login';
      }, 500);
    }
  }, [isAuthenticated, authLoading, toast, t]);

  const queryParams = new URLSearchParams();
  if (searchTerm) queryParams.append('search', searchTerm);
  if (category) queryParams.append('category', category);
  if (priceFilter === 'low') queryParams.append('maxPrice', '50');
  if (priceFilter === 'medium') {
    queryParams.append('minPrice', '50');
    queryParams.append('maxPrice', '100');
  }
  if (priceFilter === 'high') queryParams.append('minPrice', '100');

  const queryString = queryParams.toString();
  const queryUrl = queryString ? `/api/tours?${queryString}` : '/api/tours';
  
  const { data: tours, isLoading: toursLoading } = useQuery<TourWithGuide[]>({
    queryKey: [queryUrl],
    enabled: isAuthenticated,
  });

  const { data: bookingsCount } = useQuery<{ count: number }>({
    queryKey: ['/api/bookings/count'],
    enabled: isAuthenticated,
  });

  // Fetch active sponsored tour IDs
  const { data: sponsoredTourIds, isLoading: sponsoredLoading } = useQuery<string[]>({
    queryKey: ['/api/sponsorships/active-tours'],
  });

  // Create a Set of sponsored tour IDs for quick lookup
  const sponsoredIdsSet = useMemo(() => {
    return new Set(sponsoredTourIds || []);
  }, [sponsoredTourIds]);

  // Helper function to check if a tour is sponsored
  const isSponsoredTour = (tourId: string) => {
    return sponsoredIdsSet.has(tourId);
  };

  // Calculate distances and filter by proximity
  const toursWithDistance = useMemo<TourWithDistance[] | undefined>(() => {
    if (!tours || !location) return tours;
    
    return tours.map(tour => ({
      ...tour,
      distance: calculateDistance(
        location.latitude,
        location.longitude,
        tour.latitude,
        tour.longitude
      ),
    }));
  }, [tours, location]);

  const filteredTours = useMemo<TourWithDistance[]>(() => {
    if (!toursWithDistance) return [];
    
    let filtered = [...toursWithDistance];
    
    // Apply proximity filter
    if (proximityFilter && location) {
      const maxDistance = parseInt(proximityFilter);
      filtered = filtered.filter(tour => tour.distance && tour.distance <= maxDistance);
    }
    
    // Sort by distance if location is available
    if (location) {
      filtered.sort((a, b) => (a.distance || 999) - (b.distance || 999));
    }
    
    return filtered;
  }, [toursWithDistance, proximityFilter, location]);

  // Get nearby tours (within 20km)
  const nearbyTours = useMemo<TourWithDistance[]>(() => {
    if (!toursWithDistance || !location) return [];
    return toursWithDistance.filter(tour => tour.distance && tour.distance <= 20).slice(0, 6);
  }, [toursWithDistance, location]);

  // Get featured tours (sponsored tours, limit to 6)
  const featuredTours = useMemo<TourWithDistance[]>(() => {
    if (!toursWithDistance || sponsoredIdsSet.size === 0) return [];
    return toursWithDistance
      .filter(tour => isSponsoredTour(tour.id))
      .slice(0, 6);
  }, [toursWithDistance, sponsoredIdsSet, isSponsoredTour]);

  if (authLoading || !isAuthenticated) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin w-8 h-8 border-4 border-primary border-t-transparent rounded-full" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="border-b bg-card sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 py-4 flex items-center justify-between">
          <div className="flex items-center gap-8">
            <Logo className="h-8" />
            <nav className="hidden md:flex gap-6">
              <Link href="/">
                <a className="text-sm font-medium hover:text-primary transition-colors" data-testid="link-discover">
                  {t('navigation.discover')}
                </a>
              </Link>
              <Link href="/bookings">
                <a className="text-sm font-medium hover:text-primary transition-colors" data-testid="link-bookings">
                  {t('navigation.myBookings')}
                </a>
              </Link>
              <Link href="/saved">
                <a className="text-sm font-medium hover:text-primary transition-colors" data-testid="link-saved">
                  {t('navigation.saved')}
                </a>
              </Link>
              <Link href="/map">
                <a className="text-sm font-medium hover:text-primary transition-colors" data-testid="link-map">
                  {t('navigation.map')}
                </a>
              </Link>
              <Link href="/profile">
                <a className="text-sm font-medium hover:text-primary transition-colors" data-testid="link-profile">
                  {t('navigation.profile')}
                </a>
              </Link>
            </nav>
          </div>
          <div className="flex items-center gap-2">
            <span className="text-sm text-muted-foreground">
              {user?.firstName || user?.email}
            </span>
            <LanguageSwitcher />
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <section className="relative h-96 flex items-center justify-center overflow-hidden">
        <div 
          className="absolute inset-0 bg-cover bg-center"
          style={{
            backgroundImage: 'linear-gradient(rgba(0, 0, 0, 0.4), rgba(0, 0, 0, 0.4)), url(https://images.unsplash.com/photo-1500835556837-99ac94a94552?q=80&w=2787)',
          }}
        />
        <div className="relative z-10 text-center max-w-4xl mx-auto px-4">
          <h2 className="text-4xl md:text-5xl font-serif font-bold text-white mb-4">
            {t('common.welcomeBack', { name: user?.firstName || t('roles.tourist') })}
          </h2>
          <p className="text-xl text-white/90 mb-8">
            {t('dashboards.tourist.title')}
          </p>
          
          {/* Search Bar */}
          <Card className="p-4 bg-white/95 backdrop-blur-md">
            <div className="flex flex-col gap-3">
              <div className="flex flex-col md:flex-row gap-3">
                <div className="flex-1 relative">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
                  <Input
                    placeholder={t('dashboards.tourist.searchPlaceholder')}
                    className="pl-10"
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    data-testid="input-search"
                  />
                </div>
                <Button onClick={() => {}} data-testid="button-search-submit">
                  <Search className="w-4 h-4 mr-2" />
                  {t('common.search')}
                </Button>
              </div>
              
              {/* Filters */}
              <div className="flex flex-wrap gap-2">
                <Select value={category || "all"} onValueChange={(value) => setCategory(value === "all" ? "" : value)}>
                  <SelectTrigger className="w-40" data-testid="select-category">
                    <SelectValue placeholder={t('dashboards.tourist.filters.category')} />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">{t('categories.all')}</SelectItem>
                    <SelectItem value="walking">{t('categories.walking')}</SelectItem>
                    <SelectItem value="food">{t('categories.food')}</SelectItem>
                    <SelectItem value="adventure">{t('categories.adventure')}</SelectItem>
                    <SelectItem value="cultural">{t('categories.cultural')}</SelectItem>
                    <SelectItem value="historical">{t('categories.historical')}</SelectItem>
                    <SelectItem value="nature">{t('categories.nature')}</SelectItem>
                    <SelectItem value="art">{t('categories.art')}</SelectItem>
                    <SelectItem value="nightlife">{t('categories.nightlife')}</SelectItem>
                  </SelectContent>
                </Select>
                
                <Select value={priceFilter || "all"} onValueChange={(value) => setPriceFilter(value === "all" ? "" : value)}>
                  <SelectTrigger className="w-40" data-testid="select-price">
                    <SelectValue placeholder={t('dashboards.tourist.filters.priceRange')} />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">{t('dashboards.tourist.filters.allPrices')}</SelectItem>
                    <SelectItem value="low">{t('dashboards.tourist.filters.under50')}</SelectItem>
                    <SelectItem value="medium">{t('dashboards.tourist.filters.range50to100')}</SelectItem>
                    <SelectItem value="high">{t('dashboards.tourist.filters.over100')}</SelectItem>
                  </SelectContent>
                </Select>
                
                <Select value={proximityFilter || "all"} onValueChange={(value) => setProximityFilter(value === "all" ? "" : value)}>
                  <SelectTrigger className="w-40" data-testid="select-proximity">
                    <SelectValue placeholder={t('dashboards.tourist.filters.distance')} />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">{t('dashboards.tourist.filters.anyDistance')}</SelectItem>
                    <SelectItem value="5">{t('dashboards.tourist.filters.within5km')}</SelectItem>
                    <SelectItem value="10">{t('dashboards.tourist.filters.within10km')}</SelectItem>
                    <SelectItem value="20">{t('dashboards.tourist.filters.within20km')}</SelectItem>
                    <SelectItem value="50">{t('dashboards.tourist.filters.within50km')}</SelectItem>
                  </SelectContent>
                </Select>
                
                {!hasLocation && (
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={requestLocation}
                    disabled={locationLoading}
                    data-testid="button-enable-location"
                  >
                    <Navigation className="w-4 h-4 mr-2" />
                    {locationLoading ? t('dashboards.tourist.getLocation') : t('dashboards.tourist.enableLocation')}
                  </Button>
                )}
                
                {(searchTerm || category || priceFilter || proximityFilter) && (
                  <Button 
                    variant="outline" 
                    size="sm"
                    onClick={() => {
                      setSearchTerm('');
                      setCategory('');
                      setPriceFilter('');
                      setProximityFilter('');
                    }}
                    data-testid="button-clear-filters"
                  >
                    {t('common.clearFilters')}
                  </Button>
                )}
              </div>
            </div>
          </Card>
        </div>
      </section>

      {/* Stats Section */}
      <section className="py-8 px-4 bg-card border-b">
        <div className="max-w-7xl mx-auto grid grid-cols-2 md:grid-cols-4 gap-4">
          <Card className="p-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center">
                <Calendar className="w-5 h-5 text-primary" />
              </div>
              <div>
                <p className="text-2xl font-semibold">{bookingsCount?.count || 0}</p>
                <p className="text-sm text-muted-foreground">{t('dashboards.tourist.stats.bookings')}</p>
              </div>
            </div>
          </Card>
          <Card className="p-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center">
                <Heart className="w-5 h-5 text-primary" />
              </div>
              <div>
                <p className="text-2xl font-semibold">0</p>
                <p className="text-sm text-muted-foreground">{t('dashboards.tourist.stats.favorites')}</p>
              </div>
            </div>
          </Card>
          <Card className="p-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center">
                <Star className="w-5 h-5 text-primary" />
              </div>
              <div>
                <p className="text-2xl font-semibold">0</p>
                <p className="text-sm text-muted-foreground">{t('dashboards.tourist.stats.reviews')}</p>
              </div>
            </div>
          </Card>
          <Card className="p-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center">
                <MapIcon className="w-5 h-5 text-primary" />
              </div>
              <div>
                <p className="text-2xl font-semibold">0</p>
                <p className="text-sm text-muted-foreground">{t('dashboards.tourist.stats.points')}</p>
              </div>
            </div>
          </Card>
        </div>
      </section>

      {/* Featured Tours Section */}
      {featuredTours.length > 0 && (
        <section className="py-12 px-4 bg-gradient-to-br from-amber-50/50 to-orange-50/50 dark:from-amber-950/20 dark:to-orange-950/20" data-testid="section-featured-tours">
          <div className="max-w-7xl mx-auto">
            <div className="flex items-center justify-between mb-8">
              <div>
                <div className="flex items-center gap-2 mb-2">
                  <Sparkles className="w-6 h-6 text-amber-600 dark:text-amber-400" />
                  <h2 className="text-3xl font-serif font-semibold">{t('sponsorship.featuredTours')}</h2>
                </div>
                <p className="text-muted-foreground">{t('sponsorship.promotedByGuides')}</p>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {featuredTours.map((tour) => (
                <Link key={tour.id} href={`/tours/${tour.id}`}>
                  <Card className="overflow-hidden hover-elevate cursor-pointer border-amber-200 dark:border-amber-800 shadow-md shadow-amber-100/50 dark:shadow-amber-900/20" data-testid={`featured-tour-card-${tour.id}`}>
                    <div className="relative h-48 overflow-hidden">
                      <img
                        src={tour.images[0] || 'https://images.unsplash.com/photo-1469854523086-cc02fe5d8800?q=80&w=2021'}
                        alt={tour.title}
                        className="w-full h-full object-cover"
                      />
                      <div className="absolute top-3 right-3 flex flex-col gap-2">
                        <Badge className="bg-gradient-to-r from-amber-500 to-orange-500 text-white border-0" data-testid={`badge-featured-${tour.id}`}>
                          <Sparkles className="w-3 h-3 mr-1" />
                          {t('sponsorship.featured')}
                        </Badge>
                        <Badge className="bg-white/90 text-foreground">
                          ${tour.price}
                        </Badge>
                      </div>
                      {tour.distance && (
                        <div className="absolute top-3 left-3">
                          <Badge variant="secondary" className="bg-primary/90 text-primary-foreground">
                            <Navigation className="w-3 h-3 mr-1" />
                            {formatDistance(tour.distance)}
                          </Badge>
                        </div>
                      )}
                    </div>
                    <div className="p-4">
                      <div className="flex items-center gap-2 mb-2">
                        <Badge variant="secondary">{tour.category}</Badge>
                      </div>
                      <h3 className="text-xl font-semibold mb-2 line-clamp-1">{tour.title}</h3>
                      <p className="text-sm text-muted-foreground mb-4 line-clamp-2">
                        {tour.description}
                      </p>
                      <div className="flex items-center justify-between text-sm text-muted-foreground mb-4">
                        <div className="flex items-center gap-1">
                          <Clock className="w-4 h-4" />
                          {Math.floor(Number(tour.duration) / 60)}h {Number(tour.duration) % 60}m
                        </div>
                        <div className="flex items-center gap-1">
                          <Users className="w-4 h-4" />
                          Max {tour.maxGroupSize}
                        </div>
                        <div className="flex items-center gap-1">
                          <Star className="w-4 h-4 fill-yellow-400 text-yellow-400" />
                          5.0
                        </div>
                      </div>
                      <Button className="w-full" data-testid={`button-book-featured-${tour.id}`}>
                        {t('book')}
                      </Button>
                    </div>
                  </Card>
                </Link>
              ))}
            </div>
          </div>
        </section>
      )}

      {/* Near You Section */}
      {nearbyTours.length > 0 && (
        <section className="py-12 px-4 bg-muted/30">
          <div className="max-w-7xl mx-auto">
            <div className="flex items-center justify-between mb-8">
              <div>
                <h2 className="text-3xl font-serif font-semibold">{t('dashboards.tourist.nearYou')}</h2>
                <p className="text-muted-foreground mt-2">{t('dashboards.tourist.nearYouDesc')}</p>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {nearbyTours.map((tour) => (
                <Link key={tour.id} href={`/tours/${tour.id}`}>
                  <Card className={`overflow-hidden hover-elevate cursor-pointer ${isSponsoredTour(tour.id) ? 'border-amber-200 dark:border-amber-800 shadow-md shadow-amber-100/50 dark:shadow-amber-900/20' : ''}`} data-testid={`nearby-tour-card-${tour.id}`}>
                    <div className="relative h-48 overflow-hidden">
                      <img
                        src={tour.images[0] || 'https://images.unsplash.com/photo-1469854523086-cc02fe5d8800?q=80&w=2021'}
                        alt={tour.title}
                        className="w-full h-full object-cover"
                      />
                      <div className="absolute top-3 right-3 flex flex-col gap-2">
                        {isSponsoredTour(tour.id) && (
                          <Badge className="bg-gradient-to-r from-amber-500 to-orange-500 text-white border-0" data-testid={`badge-featured-nearby-${tour.id}`}>
                            <Sparkles className="w-3 h-3 mr-1" />
                            {t('sponsorship.featured')}
                          </Badge>
                        )}
                        <Badge className="bg-white/90 text-foreground">
                          ${tour.price}
                        </Badge>
                      </div>
                      {tour.distance && (
                        <div className="absolute top-3 left-3">
                          <Badge variant="secondary" className="bg-primary/90 text-primary-foreground">
                            <Navigation className="w-3 h-3 mr-1" />
                            {formatDistance(tour.distance)}
                          </Badge>
                        </div>
                      )}
                    </div>
                    <div className="p-4">
                      <div className="flex items-center gap-2 mb-2">
                        <Badge variant="secondary">{tour.category}</Badge>
                      </div>
                      <h3 className="text-xl font-semibold mb-2 line-clamp-1">{tour.title}</h3>
                      <p className="text-sm text-muted-foreground mb-4 line-clamp-2">
                        {tour.description}
                      </p>
                      <div className="flex items-center justify-between text-sm text-muted-foreground mb-4">
                        <div className="flex items-center gap-1">
                          <Clock className="w-4 h-4" />
                          {Math.floor(Number(tour.duration) / 60)}h {Number(tour.duration) % 60}m
                        </div>
                        <div className="flex items-center gap-1">
                          <Users className="w-4 h-4" />
                          Max {tour.maxGroupSize}
                        </div>
                        <div className="flex items-center gap-1">
                          <Star className="w-4 h-4 fill-yellow-400 text-yellow-400" />
                          5.0
                        </div>
                      </div>
                      <Button className="w-full" data-testid={`button-book-nearby-${tour.id}`}>
                        {t('book')}
                      </Button>
                    </div>
                  </Card>
                </Link>
              ))}
            </div>
          </div>
        </section>
      )}

      {/* Tours Section */}
      <section className="py-12 px-4">
        <div className="max-w-7xl mx-auto">
          <div className="flex items-center justify-between mb-8">
            <h2 className="text-3xl font-serif font-semibold">{t('dashboards.tourist.popularTours')}</h2>
            <Button variant="outline" data-testid="button-view-all">{t('common.viewAll')}</Button>
          </div>

          {toursLoading ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {[1, 2, 3].map((i) => (
                <Card key={i} className="overflow-hidden">
                  <Skeleton className="w-full h-48" />
                  <div className="p-4 space-y-3">
                    <Skeleton className="h-6 w-3/4" />
                    <Skeleton className="h-4 w-full" />
                    <Skeleton className="h-4 w-1/2" />
                  </div>
                </Card>
              ))}
            </div>
          ) : filteredTours && filteredTours.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {filteredTours.slice(0, 6).map((tour) => (
                <Link key={tour.id} href={`/tours/${tour.id}`}>
                  <Card className={`overflow-hidden hover-elevate cursor-pointer ${isSponsoredTour(tour.id) ? 'border-amber-200 dark:border-amber-800 shadow-md shadow-amber-100/50 dark:shadow-amber-900/20' : ''}`} data-testid={`tour-card-${tour.id}`}>
                    <div className="relative h-48 overflow-hidden">
                      <img
                        src={tour.images[0] || 'https://images.unsplash.com/photo-1469854523086-cc02fe5d8800?q=80&w=2021'}
                        alt={tour.title}
                        className="w-full h-full object-cover"
                      />
                      <div className="absolute top-3 right-3 flex flex-col gap-2">
                        {isSponsoredTour(tour.id) && (
                          <Badge className="bg-gradient-to-r from-amber-500 to-orange-500 text-white border-0" data-testid={`badge-featured-tour-${tour.id}`}>
                            <Sparkles className="w-3 h-3 mr-1" />
                            {t('sponsorship.featured')}
                          </Badge>
                        )}
                        <Badge className="bg-white/90 text-foreground">
                          ${tour.price}
                        </Badge>
                      </div>
                      {tour.distance && (
                        <div className="absolute top-3 left-3">
                          <Badge variant="secondary" className="bg-primary/90 text-primary-foreground">
                            <Navigation className="w-3 h-3 mr-1" />
                            {formatDistance(tour.distance)}
                          </Badge>
                        </div>
                      )}
                    </div>
                    <div className="p-4">
                      <div className="flex items-center gap-2 mb-2">
                        <Badge variant="secondary">{tour.category}</Badge>
                      </div>
                      <h3 className="text-xl font-semibold mb-2 line-clamp-1">{tour.title}</h3>
                      <p className="text-sm text-muted-foreground mb-4 line-clamp-2">
                        {tour.description}
                      </p>
                      <div className="flex items-center justify-between text-sm text-muted-foreground mb-4">
                        <div className="flex items-center gap-1">
                          <Clock className="w-4 h-4" />
                          {Math.floor(Number(tour.duration) / 60)}h {Number(tour.duration) % 60}m
                        </div>
                        <div className="flex items-center gap-1">
                          <Users className="w-4 h-4" />
                          Max {tour.maxGroupSize}
                        </div>
                        <div className="flex items-center gap-1">
                          <Star className="w-4 h-4 fill-yellow-400 text-yellow-400" />
                          5.0
                        </div>
                      </div>
                      <Button className="w-full" data-testid={`button-book-${tour.id}`}>
                        {t('book')}
                      </Button>
                    </div>
                  </Card>
                </Link>
              ))}
            </div>
          ) : (
            <Card className="p-12 text-center">
              <MapPin className="w-16 h-16 text-muted-foreground mx-auto mb-4" />
              <h3 className="text-xl font-semibold mb-2">{t('dashboards.tourist.noToursFound')}</h3>
              <p className="text-muted-foreground">
                {t('dashboards.tourist.tryDifferentFilters')}
              </p>
            </Card>
          )}
        </div>
      </section>
    </div>
  );
}
