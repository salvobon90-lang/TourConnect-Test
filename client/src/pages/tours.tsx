import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useQuery } from '@tanstack/react-query';
import { Card } from '@/components/ui/card';
import { AnimatedCard } from '@/components/ui/animated-card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Search, Clock, Users, Star, MapPin, BadgeCheck } from 'lucide-react';
import type { TourWithGuide } from '@shared/schema';
import { Skeleton } from '@/components/ui/skeleton';
import { Link } from 'wouter';
import { Logo } from '@/components/logo';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { SEO } from '@/components/seo';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { BadgeDisplay } from '@/components/badges/BadgeDisplay';
import { TrustLevel } from '@/components/badges/TrustLevel';
import { getLocalizedContent } from '@/lib/i18n-content';

export default function Tours() {
  const { t, i18n } = useTranslation();
  const [searchTerm, setSearchTerm] = useState('');
  const [category, setCategory] = useState<string>('');
  const [priceFilter, setPriceFilter] = useState<string>('');

  // Build query parameters for filtering
  const queryParams = new URLSearchParams();
  if (searchTerm) queryParams.append('search', searchTerm);
  if (category) queryParams.append('category', category);
  if (priceFilter === 'low') queryParams.append('maxPrice', '50');
  if (priceFilter === 'medium') {
    queryParams.append('minPrice', '50');
    queryParams.append('maxPrice', '100');
  }
  if (priceFilter === 'high') queryParams.append('minPrice', '100');
  
  // Add language parameter
  queryParams.append('language', i18n.language);

  const queryString = queryParams.toString();
  const queryUrl = `/api/tours?${queryString}`;

  const { data: tours, isLoading } = useQuery<TourWithGuide[]>({
    queryKey: ['tours', i18n.language, searchTerm, category, priceFilter],
    queryFn: () => fetch(queryUrl, { credentials: 'include' }).then(r => r.json())
  });

  return (
    <>
      <SEO 
        title={t('seo.tours.title')}
        description={t('seo.tours.description')}
      />
      <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="border-b bg-card sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 py-4 flex items-center justify-between">
          <Link href="/" data-testid="link-logo">
            <Logo className="h-8" />
          </Link>
          <Button asChild>
            <a href="/api/login" data-testid="button-login">
              {t('navigation.login')}
            </a>
          </Button>
        </div>
      </header>

      {/* Hero Section with Search */}
      <section className="relative h-80 flex items-center justify-center overflow-hidden">
        <div 
          className="absolute inset-0 bg-cover bg-center"
          style={{
            backgroundImage: 'linear-gradient(rgba(0, 0, 0, 0.5), rgba(0, 0, 0, 0.5)), url(https://images.unsplash.com/photo-1488646953014-85cb44e25828?q=80&w=2835)',
            backgroundPosition: 'center',
          }}
        />
        <div className="relative z-10 text-center max-w-4xl mx-auto px-4">
          <h1 className="text-4xl md:text-5xl font-serif font-bold text-white mb-4">
            {t('tours.title')}
          </h1>
          <p className="text-xl text-white/90 mb-8">
            {t('landing.heroSubtitle')}
          </p>
          
          {/* Search Bar */}
          <Card className="p-4 bg-white/95 backdrop-blur-md">
            <div className="flex flex-col gap-3">
              <div className="flex flex-col md:flex-row gap-3">
                <div className="flex-1 relative">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
                  <Input
                    placeholder={t('tours.searchPlaceholder')}
                    className="pl-10"
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    data-testid="input-search"
                  />
                </div>
              </div>
              
              {/* Filters */}
              <div className="flex flex-wrap gap-2">
                <Select value={category || "all"} onValueChange={(value) => setCategory(value === "all" ? "" : value)}>
                  <SelectTrigger className="w-40" data-testid="select-category">
                    <SelectValue placeholder={t('tours.category')} />
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
                    <SelectValue placeholder={t('tours.price')} />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">{t('dashboards.tourist.filters.allPrices')}</SelectItem>
                    <SelectItem value="low">{t('dashboards.tourist.filters.under50')}</SelectItem>
                    <SelectItem value="medium">{t('dashboards.tourist.filters.range50to100')}</SelectItem>
                    <SelectItem value="high">{t('dashboards.tourist.filters.over100')}</SelectItem>
                  </SelectContent>
                </Select>
                
                {(searchTerm || category || priceFilter) && (
                  <Button 
                    variant="outline" 
                    size="sm"
                    onClick={() => {
                      setSearchTerm('');
                      setCategory('');
                      setPriceFilter('');
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

      {/* Tours Grid Section */}
      <section className="py-12 px-4">
        <div className="max-w-7xl mx-auto">
          <div className="flex items-center justify-between mb-8">
            <div>
              <h2 className="text-3xl font-serif font-semibold">{t('tours.title')}</h2>
              <p className="text-muted-foreground mt-2">
                {tours ? `${tours.length} ${t('navigation.tours').toLowerCase()}` : t('common.loading')}
              </p>
            </div>
          </div>

          {/* Loading State */}
          {isLoading && (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {[1, 2, 3, 4, 5, 6].map((i) => (
                <Card key={i} className="overflow-hidden">
                  <Skeleton className="h-48 w-full" />
                  <div className="p-4 space-y-3">
                    <Skeleton className="h-6 w-3/4" />
                    <Skeleton className="h-4 w-full" />
                    <Skeleton className="h-4 w-full" />
                    <Skeleton className="h-10 w-full" />
                  </div>
                </Card>
              ))}
            </div>
          )}

          {/* Empty State */}
          {!isLoading && tours?.length === 0 && (
            <Card className="p-12 text-center">
              <MapPin className="w-16 h-16 mx-auto mb-4 text-muted-foreground" />
              <h3 className="text-2xl font-semibold mb-2">{t('dashboards.tourist.noToursFound')}</h3>
              <p className="text-muted-foreground mb-6">
                {t('dashboards.tourist.tryDifferentFilters')}
              </p>
              <Button 
                onClick={() => {
                  setSearchTerm('');
                  setCategory('');
                  setPriceFilter('');
                }}
                data-testid="button-clear-all"
              >
                {t('common.clearFilters')}
              </Button>
            </Card>
          )}

          {/* Tours Grid */}
          {!isLoading && tours && tours.length > 0 && (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {tours.map((tour) => {
                // Apply localized content
                const localizedTour = getLocalizedContent(tour, i18n.language);
                
                return (
                <AnimatedCard key={tour.id} className="overflow-hidden hover-elevate" data-testid={`tour-card-${tour.id}`} enableTilt>
                  <div className="relative h-48 overflow-hidden">
                    <img
                      src={tour.images[0] || 'https://images.unsplash.com/photo-1469854523086-cc02fe5d8800?q=80&w=2021'}
                      alt={localizedTour.title}
                      className="w-full h-full object-cover"
                      loading="lazy"
                    />
                    <div className="absolute top-3 right-3">
                      <Badge className="bg-white/90 text-foreground">
                        ${tour.price}
                      </Badge>
                    </div>
                  </div>
                  <div className="p-4">
                    <div className="flex items-center gap-2 mb-2">
                      <Badge variant="secondary" data-testid={`badge-category-${tour.id}`}>
                        {tour.category}
                      </Badge>
                    </div>
                    <h3 className="text-xl font-semibold mb-2 line-clamp-1" data-testid={`text-title-${tour.id}`}>
                      {localizedTour.title}
                    </h3>
                    <p className="text-sm text-muted-foreground mb-3 line-clamp-2" data-testid={`text-description-${tour.id}`}>
                      {localizedTour.description}
                    </p>
                    <div className="flex items-center gap-2 mb-3">
                      <Avatar className="h-8 w-8">
                        <AvatarImage src={tour.guide?.profileImageUrl || undefined} />
                        <AvatarFallback>
                          {tour.guide?.firstName?.[0]}{tour.guide?.lastName?.[0]}
                        </AvatarFallback>
                      </Avatar>
                      
                      <div className="flex-1 min-w-0">
                        <Link href={`/guide/${tour.guide?.id}`}>
                          <button 
                            className="text-sm font-medium truncate hover:text-orange-600 hover:underline transition-colors cursor-pointer text-left w-full"
                            onClick={(e) => e.stopPropagation()}
                            data-testid={`text-guide-${tour.id}`}
                            aria-label={`View ${tour.guide?.firstName} ${tour.guide?.lastName}'s profile`}
                          >
                            {tour.guide?.firstName} {tour.guide?.lastName}
                          </button>
                        </Link>
                        <div className="flex items-center gap-2">
                          {tour.guide?.trustLevel !== undefined && tour.guide.trustLevel !== null && tour.guide.trustLevel > 0 && (
                            <TrustLevel level={tour.guide.trustLevel} variant="badge" showLabel={false} />
                          )}
                          {tour.guide?.badges && tour.guide.badges.length > 0 && (
                            <BadgeDisplay badges={tour.guide.badges} size="sm" maxVisible={2} />
                          )}
                        </div>
                      </div>
                    </div>
                    <div className="flex items-center justify-between text-sm text-muted-foreground mb-4">
                      <div className="flex items-center gap-1" data-testid={`text-duration-${tour.id}`}>
                        <Clock className="w-4 h-4" />
                        {Math.floor(Number(tour.duration) / 60)}h {Number(tour.duration) % 60}m
                      </div>
                      <div className="flex items-center gap-1" data-testid={`text-group-size-${tour.id}`}>
                        <Users className="w-4 h-4" />
                        Max {tour.maxGroupSize}
                      </div>
                      <div className="flex items-center gap-1">
                        <Star className="w-4 h-4 fill-yellow-400 text-yellow-400" />
                        <span>{tour.averageRating?.toFixed(1) || '5.0'}</span>
                      </div>
                    </div>
                    <Link href={`/tours/${tour.id}`}>
                      <Button className="w-full" data-testid={`button-view-details-${tour.id}`}>
                        {t('common.viewDetails')}
                      </Button>
                    </Link>
                  </div>
                </AnimatedCard>
              );
              })}
            </div>
          )}
        </div>
      </section>
    </div>
    </>
  );
}
