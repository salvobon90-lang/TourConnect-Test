import { useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { useAuth } from '@/hooks/useAuth';
import { useToast } from '@/hooks/use-toast';
import { useQuery, useMutation } from '@tanstack/react-query';
import { queryClient, apiRequest } from '@/lib/queryClient';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Plus, MapPin, DollarSign, Star, Users, Calendar, Edit2, Trash2 } from 'lucide-react';
import type { Tour } from '@shared/schema';
import { Skeleton } from '@/components/ui/skeleton';
import { Link, useLocation } from 'wouter';
import { LanguageSwitcher } from '@/components/language-switcher';

export default function GuideDashboard() {
  const { t } = useTranslation();
  const { user, isAuthenticated, isLoading: authLoading } = useAuth();
  const { toast } = useToast();
  const [, navigate] = useLocation();

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

  const { data: tours, isLoading: toursLoading } = useQuery<Tour[]>({
    queryKey: ['/api/my-tours'],
    enabled: isAuthenticated,
  });

  const { data: stats } = useQuery<{ totalBookings: number; totalRevenue: number; avgRating: number }>({
    queryKey: ['/api/guide/stats'],
    enabled: isAuthenticated,
  });

  const deleteTourMutation = useMutation({
    mutationFn: async (tourId: string) => {
      const response = await apiRequest('DELETE', `/api/tours/${tourId}`);
      return response.json();
    },
    onSuccess: (_, tourId) => {
      toast({
        title: t('common.success'),
        description: t('system.deleteTourSuccess'),
      });
      // Invalidate all tour-related queries
      queryClient.invalidateQueries({ queryKey: ['/api/my-tours'] });
      queryClient.invalidateQueries({ queryKey: ['/api/tours'] });
      queryClient.invalidateQueries({ queryKey: ['/api/tours', tourId] });
    },
    onError: (error: any) => {
      toast({
        title: t('common.error'),
        description: error.message || t('system.deleteTourError'),
        variant: 'destructive',
      });
    },
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
            <h1 className="text-2xl font-serif font-semibold">{t('common.appName')}</h1>
            <nav className="hidden md:flex gap-6">
              <Link href="/">
                <a className="text-sm font-medium hover:text-primary transition-colors" data-testid="link-my-tours">
                  {t('navigation.myTours')}
                </a>
              </Link>
              <Link href="/bookings">
                <a className="text-sm font-medium hover:text-primary transition-colors" data-testid="link-bookings">
                  {t('navigation.bookings')}
                </a>
              </Link>
              <Link href="/analytics">
                <a className="text-sm font-medium hover:text-primary transition-colors" data-testid="link-analytics">
                  {t('navigation.analytics')}
                </a>
              </Link>
            </nav>
          </div>
          <div className="flex items-center gap-2">
            <span className="text-sm text-muted-foreground">
              {user?.firstName || user?.email}
            </span>
            <LanguageSwitcher />
            <a href="/api/logout">
              <Button variant="outline" size="sm" data-testid="button-logout">
                {t('navigation.logout')}
              </Button>
            </a>
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <section className="relative h-80 flex items-center justify-center overflow-hidden">
        <div 
          className="absolute inset-0 bg-cover bg-center"
          style={{
            backgroundImage: 'linear-gradient(rgba(0, 0, 0, 0.4), rgba(0, 0, 0, 0.4)), url(https://images.unsplash.com/photo-1504674900247-0877df9cc836?q=80&w=2940)',
          }}
        />
        <div className="relative z-10 text-center max-w-4xl mx-auto px-4">
          <h2 className="text-4xl md:text-5xl font-serif font-bold text-white mb-4">
            {t('dashboards.guide.welcomeMessage', { name: user?.firstName || t('roles.guide') })}
          </h2>
          <p className="text-xl text-white/90 mb-6">
            {t('dashboards.guide.subtitle')}
          </p>
          <Link href="/create-tour">
            <Button size="lg" className="bg-white/10 backdrop-blur-md border-white/20 border hover:bg-white/20" data-testid="button-create-tour">
              <Plus className="w-5 h-5 mr-2" />
              {t('navigation.createTour')}
            </Button>
          </Link>
        </div>
      </section>

      {/* Stats Section */}
      <section className="py-8 px-4 bg-card border-b">
        <div className="max-w-7xl mx-auto grid grid-cols-2 md:grid-cols-4 gap-4">
          <Card className="p-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center">
                <MapPin className="w-5 h-5 text-primary" />
              </div>
              <div>
                <p className="text-2xl font-semibold">{tours?.length || 0}</p>
                <p className="text-sm text-muted-foreground">{t('dashboards.guide.stats.activeTours')}</p>
              </div>
            </div>
          </Card>
          <Card className="p-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center">
                <Calendar className="w-5 h-5 text-primary" />
              </div>
              <div>
                <p className="text-2xl font-semibold">{stats?.totalBookings || 0}</p>
                <p className="text-sm text-muted-foreground">{t('dashboards.guide.stats.bookings')}</p>
              </div>
            </div>
          </Card>
          <Card className="p-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center">
                <Star className="w-5 h-5 text-primary" />
              </div>
              <div>
                <p className="text-2xl font-semibold">{stats?.avgRating?.toFixed(1) || '5.0'}</p>
                <p className="text-sm text-muted-foreground">{t('dashboards.guide.stats.avgRating')}</p>
              </div>
            </div>
          </Card>
          <Card className="p-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center">
                <DollarSign className="w-5 h-5 text-primary" />
              </div>
              <div>
                <p className="text-2xl font-semibold">${stats?.totalRevenue || 0}</p>
                <p className="text-sm text-muted-foreground">{t('dashboards.guide.stats.revenue')}</p>
              </div>
            </div>
          </Card>
        </div>
      </section>

      {/* Tours Section */}
      <section className="py-12 px-4">
        <div className="max-w-7xl mx-auto">
          <div className="flex items-center justify-between mb-8">
            <h2 className="text-3xl font-serif font-semibold">{t('dashboards.guide.myTours')}</h2>
            <Link href="/create-tour">
              <Button data-testid="button-create-new-tour">
                <Plus className="w-4 h-4 mr-2" />
                {t('dashboards.guide.createNewTour')}
              </Button>
            </Link>
          </div>

          {toursLoading ? (
            <div className="grid grid-cols-1 gap-4">
              {[1, 2, 3].map((i) => (
                <Card key={i} className="p-6">
                  <div className="flex gap-4">
                    <Skeleton className="w-32 h-32 rounded-lg" />
                    <div className="flex-1 space-y-3">
                      <Skeleton className="h-6 w-3/4" />
                      <Skeleton className="h-4 w-full" />
                      <Skeleton className="h-4 w-1/2" />
                    </div>
                  </div>
                </Card>
              ))}
            </div>
          ) : tours && tours.length > 0 ? (
            <div className="grid grid-cols-1 gap-4">
              {tours.map((tour) => (
                <Card key={tour.id} className="p-6 hover-elevate" data-testid={`my-tour-${tour.id}`}>
                  <div className="flex gap-6">
                    <div className="w-32 h-32 rounded-lg overflow-hidden flex-shrink-0">
                      <img
                        src={tour.images[0] || 'https://images.unsplash.com/photo-1469854523086-cc02fe5d8800?q=80&w=2021'}
                        alt={tour.title}
                        className="w-full h-full object-cover"
                      />
                    </div>
                    <div className="flex-1">
                      <div className="flex items-start justify-between mb-2">
                        <div>
                          <h3 className="text-xl font-semibold mb-1">{tour.title}</h3>
                          <div className="flex items-center gap-2 flex-wrap">
                            <Badge variant="secondary">{tour.category}</Badge>
                            <Badge variant={tour.isActive ? 'default' : 'secondary'}>
                              {tour.isActive ? t('status.active') : t('status.inactive')}
                            </Badge>
                            <Badge 
                              variant="outline"
                              className={
                                tour.approvalStatus === 'approved' 
                                  ? 'bg-green-100 text-green-800 border-green-300 dark:bg-green-900/30 dark:text-green-300'
                                  : tour.approvalStatus === 'pending'
                                  ? 'bg-orange-100 text-orange-800 border-orange-300 dark:bg-orange-900/30 dark:text-orange-300'
                                  : 'bg-red-100 text-red-800 border-red-300 dark:bg-red-900/30 dark:text-red-300'
                              }
                              data-testid={`badge-approval-${tour.id}`}
                            >
                              {tour.approvalStatus === 'approved' ? `✓ ${t('status.approved')}` : tour.approvalStatus === 'pending' ? `⏱ ${t('status.pending')}` : `✗ ${t('status.rejected')}`}
                            </Badge>
                          </div>
                        </div>
                        <div className="text-right">
                          <p className="text-2xl font-semibold">${tour.price}</p>
                          <p className="text-sm text-muted-foreground">per person</p>
                        </div>
                      </div>
                      <p className="text-muted-foreground mb-4 line-clamp-2">
                        {tour.description}
                      </p>
                      <div className="flex items-center gap-6 text-sm text-muted-foreground mb-4">
                        <div className="flex items-center gap-1">
                          <Users className="w-4 h-4" />
                          Max {tour.maxGroupSize} people
                        </div>
                        <div className="flex items-center gap-1">
                          <MapPin className="w-4 h-4" />
                          {tour.meetingPoint}
                        </div>
                      </div>
                      <div className="flex gap-2">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => navigate(`/edit-tour/${tour.id}`)}
                          data-testid={`button-edit-${tour.id}`}
                        >
                          <Edit2 className="w-4 h-4 mr-1" />
                          {t('common.edit')}
                        </Button>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => {
                            if (confirm(t('dashboards.guide.deleteTourConfirm'))) {
                              deleteTourMutation.mutate(tour.id);
                            }
                          }}
                          disabled={deleteTourMutation.isPending}
                          data-testid={`button-delete-${tour.id}`}
                        >
                          <Trash2 className="w-4 h-4 mr-1" />
                          {t('common.delete')}
                        </Button>
                      </div>
                    </div>
                  </div>
                </Card>
              ))}
            </div>
          ) : (
            <Card className="p-12 text-center">
              <MapPin className="w-16 h-16 text-muted-foreground mx-auto mb-4" />
              <h3 className="text-xl font-semibold mb-2">{t('dashboards.guide.noTours')}</h3>
              <p className="text-muted-foreground mb-6">
                {t('dashboards.guide.noToursDesc')}
              </p>
              <Link href="/create-tour">
                <Button data-testid="button-create-first-tour">
                  <Plus className="w-4 h-4 mr-2" />
                  {t('dashboards.guide.createFirstTour')}
                </Button>
              </Link>
            </Card>
          )}
        </div>
      </section>
    </div>
  );
}
