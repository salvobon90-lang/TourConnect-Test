import { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useAuth } from '@/hooks/useAuth';
import { useToast } from '@/hooks/use-toast';
import { useQuery } from '@tanstack/react-query';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Search, MapPin, Star, Clock, Users, Heart, Calendar, Map as MapIcon } from 'lucide-react';
import type { TourWithGuide } from '@shared/schema';
import { Skeleton } from '@/components/ui/skeleton';
import { Link } from 'wouter';

export default function TouristDashboard() {
  const { t } = useTranslation();
  const { user, isAuthenticated, isLoading: authLoading } = useAuth();
  const { toast } = useToast();
  const [searchTerm, setSearchTerm] = useState('');
  const [category, setCategory] = useState<string>('');
  const [priceFilter, setPriceFilter] = useState<string>('');

  useEffect(() => {
    if (!authLoading && !isAuthenticated) {
      toast({
        title: 'Unauthorized',
        description: 'You are logged out. Logging in again...',
        variant: 'destructive',
      });
      setTimeout(() => {
        window.location.href = '/api/login';
      }, 500);
    }
  }, [isAuthenticated, authLoading, toast]);

  const { data: tours, isLoading: toursLoading } = useQuery<TourWithGuide[]>({
    queryKey: ['/api/tours'],
    enabled: isAuthenticated,
  });

  const { data: bookingsCount } = useQuery<{ count: number }>({
    queryKey: ['/api/bookings/count'],
    enabled: isAuthenticated,
  });

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
            <h1 className="text-2xl font-serif font-semibold">TourConnect</h1>
            <nav className="hidden md:flex gap-6">
              <Link href="/">
                <a className="text-sm font-medium hover:text-primary transition-colors" data-testid="link-discover">
                  {t('discover')}
                </a>
              </Link>
              <Link href="/bookings">
                <a className="text-sm font-medium hover:text-primary transition-colors" data-testid="link-bookings">
                  {t('myBookings')}
                </a>
              </Link>
              <Link href="/saved">
                <a className="text-sm font-medium hover:text-primary transition-colors" data-testid="link-saved">
                  {t('saved')}
                </a>
              </Link>
              <Link href="/map">
                <a className="text-sm font-medium hover:text-primary transition-colors" data-testid="link-map">
                  {t('map')}
                </a>
              </Link>
            </nav>
          </div>
          <div className="flex items-center gap-4">
            <span className="text-sm text-muted-foreground">
              {user?.firstName || user?.email}
            </span>
            <a href="/api/logout">
              <Button variant="outline" size="sm" data-testid="button-logout">
                {t('logout')}
              </Button>
            </a>
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
            Welcome back, {user?.firstName || 'Explorer'}!
          </h2>
          <p className="text-xl text-white/90 mb-8">
            Discover your next adventure
          </p>
          
          {/* Search Bar */}
          <Card className="p-4 bg-white/95 backdrop-blur-md">
            <div className="flex flex-col md:flex-row gap-3">
              <div className="flex-1 relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
                <Input
                  placeholder="Search tours, places, or activities..."
                  className="pl-10"
                  data-testid="input-search"
                />
              </div>
              <Button data-testid="button-search-submit">
                <Search className="w-4 h-4 mr-2" />
                Search
              </Button>
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
                <p className="text-sm text-muted-foreground">Bookings</p>
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
                <p className="text-sm text-muted-foreground">Favorites</p>
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
                <p className="text-sm text-muted-foreground">Reviews</p>
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
                <p className="text-sm text-muted-foreground">Points</p>
              </div>
            </div>
          </Card>
        </div>
      </section>

      {/* Tours Section */}
      <section className="py-12 px-4">
        <div className="max-w-7xl mx-auto">
          <div className="flex items-center justify-between mb-8">
            <h2 className="text-3xl font-serif font-semibold">Popular Tours</h2>
            <Button variant="outline" data-testid="button-view-all">View All</Button>
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
          ) : tours && tours.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {tours.slice(0, 6).map((tour) => (
                <Link key={tour.id} href={`/tours/${tour.id}`}>
                  <Card className="overflow-hidden hover-elevate cursor-pointer" data-testid={`tour-card-${tour.id}`}>
                    <div className="relative h-48 overflow-hidden">
                      <img
                        src={tour.images[0] || 'https://images.unsplash.com/photo-1469854523086-cc02fe5d8800?q=80&w=2021'}
                        alt={tour.title}
                        className="w-full h-full object-cover"
                      />
                      <div className="absolute top-3 right-3">
                        <Badge className="bg-white/90 text-foreground">
                          ${tour.price}
                        </Badge>
                      </div>
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
              <h3 className="text-xl font-semibold mb-2">No tours available yet</h3>
              <p className="text-muted-foreground">
                Check back soon for exciting new tours and experiences!
              </p>
            </Card>
          )}
        </div>
      </section>
    </div>
  );
}
