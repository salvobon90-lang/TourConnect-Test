import { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useAuth } from '@/hooks/useAuth';
import { useToast } from '@/hooks/use-toast';
import { useQuery, useMutation } from '@tanstack/react-query';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Plus, Store, DollarSign, Star, ShoppingBag, Calendar, Megaphone, Sparkles, Clock, MessageSquare, Eye, Edit, Trash2 } from 'lucide-react';
import type { Service, Sponsorship } from '@shared/schema';
import { Skeleton } from '@/components/ui/skeleton';
import { Link } from 'wouter';
import { SponsorshipModal } from '@/components/sponsorship-modal';
import { Header } from '@/components/layout/Header';

export default function ProviderDashboard() {
  const { t } = useTranslation();
  const { user, isAuthenticated, isLoading: authLoading } = useAuth();
  const { toast } = useToast();
  const [sponsorshipModal, setSponsorshipModal] = useState<{ serviceId: string; name: string } | null>(null);

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

  const { data: services, isLoading: servicesLoading, refetch: refetchServices } = useQuery<Service[]>({
    queryKey: ['/api/user/services'],
    queryFn: async () => {
      const res = await fetch('/api/user/services');
      if (!res.ok) throw new Error('Failed to fetch services');
      return res.json();
    },
    enabled: isAuthenticated,
  });

  const { data: stats } = useQuery<{ totalOrders: number; totalRevenue: number; avgRating: number }>({
    queryKey: ['/api/provider/stats'],
    enabled: isAuthenticated,
  });

  const { data: sponsorships, isLoading: sponsorshipsLoading } = useQuery<Sponsorship[]>({
    queryKey: ['/api/sponsorships/my-sponsorships'],
    enabled: isAuthenticated,
  });

  const { data: activeServiceIds = [] } = useQuery<string[]>({
    queryKey: ['/api/sponsorships/active-services'],
    enabled: isAuthenticated,
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      const res = await fetch(`/api/services/${id}`, { method: 'DELETE' });
      if (!res.ok) throw new Error('Failed to delete service');
      return res.json();
    },
    onSuccess: () => {
      refetchServices();
      toast({
        title: t('provider.deleteSuccess'),
        description: t('provider.serviceDeleted'),
      });
    },
    onError: () => {
      toast({
        title: t('common.error'),
        description: t('provider.deleteFailed'),
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
      <Header />

      {/* Hero Section */}
      <section className="relative h-80 flex items-center justify-center overflow-hidden">
        <div 
          className="absolute inset-0 bg-cover bg-center"
          style={{
            backgroundImage: 'linear-gradient(rgba(0, 0, 0, 0.4), rgba(0, 0, 0, 0.4)), url(https://images.unsplash.com/photo-1517248135467-4c7edcad34c4?q=80&w=2940)',
          }}
        />
        <div className="relative z-10 text-center max-w-4xl mx-auto px-4">
          <h2 className="text-4xl md:text-5xl font-serif font-bold text-white mb-4">
            {t('dashboards.provider.welcomeMessage', { name: user?.firstName || t('roles.provider') })}
          </h2>
          <p className="text-xl text-white/90 mb-6">
            {t('dashboards.provider.subtitle')}
          </p>
          <Link href="/create-service">
            <Button size="lg" className="bg-white/10 backdrop-blur-md border-white/20 border hover:bg-white/20" data-testid="button-add-service">
              <Plus className="w-5 h-5 mr-2" />
              {t('dashboards.provider.addNewService')}
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
                <Store className="w-5 h-5 text-primary" />
              </div>
              <div>
                <p className="text-2xl font-semibold">{services?.length || 0}</p>
                <p className="text-sm text-muted-foreground">{t('dashboards.provider.stats.services')}</p>
              </div>
            </div>
          </Card>
          <Card className="p-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center">
                <ShoppingBag className="w-5 h-5 text-primary" />
              </div>
              <div>
                <p className="text-2xl font-semibold">{stats?.totalOrders || 0}</p>
                <p className="text-sm text-muted-foreground">{t('dashboards.provider.stats.orders')}</p>
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
                <p className="text-sm text-muted-foreground">{t('dashboards.provider.stats.avgRating')}</p>
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
                <p className="text-sm text-muted-foreground">{t('dashboards.provider.stats.revenue')}</p>
              </div>
            </div>
          </Card>
        </div>
      </section>

      {/* My Promotions Section */}
      <section className="py-12 px-4 bg-muted/30">
        <div className="max-w-7xl mx-auto">
          <h2 className="text-3xl font-serif font-semibold mb-6">{t('sponsorship.myPromotions')}</h2>
          {sponsorshipsLoading ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {[1, 2, 3].map((i) => (
                <Card key={i} className="p-6">
                  <Skeleton className="h-6 w-3/4 mb-3" />
                  <Skeleton className="h-4 w-1/2 mb-2" />
                  <Skeleton className="h-4 w-2/3" />
                </Card>
              ))}
            </div>
          ) : sponsorships && sponsorships.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {sponsorships.map((sponsorship) => {
                const service = services?.find(s => s.id === sponsorship.serviceId);
                return (
                  <Card key={sponsorship.id} data-testid={`sponsorship-${sponsorship.id}`}>
                    <CardHeader className="pb-3">
                      <div className="flex items-center justify-between gap-2 flex-wrap">
                        <div className="flex items-center gap-2">
                          <Sparkles className="w-5 h-5 text-primary" />
                          <CardTitle className="text-lg">{service?.name || 'Service'}</CardTitle>
                        </div>
                        <Badge 
                          variant={sponsorship.status === 'active' ? 'default' : 'secondary'}
                          data-testid={`badge-status-${sponsorship.id}`}
                        >
                          {sponsorship.status === 'active' ? t('sponsorship.statusActive') : 
                           sponsorship.status === 'pending' ? t('sponsorship.statusPending') :
                           sponsorship.status === 'expired' ? t('sponsorship.statusExpired') :
                           t('sponsorship.statusCancelled')}
                        </Badge>
                      </div>
                    </CardHeader>
                    <CardContent className="space-y-3">
                      <div className="flex items-center gap-2 text-sm">
                        <Clock className="w-4 h-4 text-muted-foreground" />
                        <span className="text-muted-foreground">
                          {sponsorship.duration === 'weekly' ? `${t('sponsorship.weeklyPromotion')} (${t('sponsorship.days7')})` : `${t('sponsorship.monthlyPromotion')} (${t('sponsorship.days30')})`}
                        </span>
                      </div>
                      {sponsorship.expiresAt && (
                        <div className="flex items-center gap-2 text-sm">
                          <Calendar className="w-4 h-4 text-muted-foreground" />
                          <span className="text-muted-foreground" data-testid={`text-expires-${sponsorship.id}`}>
                            {t('sponsorship.expiresOn')}: {new Date(sponsorship.expiresAt).toLocaleDateString()}
                          </span>
                        </div>
                      )}
                      <div className="flex items-center gap-2 text-sm">
                        <DollarSign className="w-4 h-4 text-muted-foreground" />
                        <span className="font-semibold" data-testid={`text-price-${sponsorship.id}`}>
                          ${sponsorship.price}
                        </span>
                      </div>
                    </CardContent>
                  </Card>
                );
              })}
            </div>
          ) : (
            <Card className="p-8 text-center">
              <Sparkles className="w-12 h-12 text-muted-foreground mx-auto mb-3" />
              <p className="text-muted-foreground">
                {t('sponsorship.noPromotions')}. {t('sponsorship.startPromotingServices')}
              </p>
            </Card>
          )}
        </div>
      </section>

      {/* Services Section */}
      <section className="py-12 px-4">
        <div className="max-w-7xl mx-auto">
          <div className="flex items-center justify-between mb-8">
            <h2 className="text-3xl font-serif font-semibold">{t('dashboards.provider.myServices')}</h2>
            <Link href="/create-service">
              <Button data-testid="button-add-new-service">
                <Plus className="w-4 h-4 mr-2" />
                {t('dashboards.provider.addService')}
              </Button>
            </Link>
          </div>

          {servicesLoading ? (
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
          ) : services && services.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {services.map((service) => (
                <Card key={service.id} className="overflow-hidden hover-elevate" data-testid={`service-card-${service.id}`}>
                  <div className="relative h-48 overflow-hidden">
                    <img
                      src={service.images[0] || 'https://images.unsplash.com/photo-1414235077428-338989a2e8c0?q=80&w=2940'}
                      alt={service.name}
                      className="w-full h-full object-cover"
                    />
                    {service.specialOffer && (
                      <div className="absolute top-3 right-3">
                        <Badge className="bg-destructive text-destructive-foreground">
                          {t('dashboards.provider.specialOffer')}
                        </Badge>
                      </div>
                    )}
                  </div>
                  <div className="p-4">
                    <div className="flex items-center gap-2 mb-2 flex-wrap">
                      <Badge variant="secondary">{service.type}</Badge>
                      <Badge variant={service.isActive ? 'default' : 'secondary'}>
                        {service.isActive ? t('status.active') : t('status.inactive')}
                      </Badge>
                      {activeServiceIds.includes(service.id) && (
                        <Badge 
                          variant="default"
                          className="bg-primary/20 text-primary border-primary/30"
                          data-testid={`badge-sponsored-${service.id}`}
                        >
                          <Sparkles className="w-3 h-3 mr-1" />
                          {t('sponsorship.sponsored')}
                        </Badge>
                      )}
                    </div>
                    <h3 className="text-xl font-semibold mb-2">{service.name}</h3>
                    <p className="text-sm text-muted-foreground mb-4 line-clamp-2">
                      {service.description}
                    </p>
                    <div className="flex items-center justify-between mb-4">
                      <span className="text-sm text-muted-foreground">
                        {service.priceRange || 'N/A'}
                      </span>
                      <div className="flex items-center gap-1">
                        <Star className="w-4 h-4 fill-yellow-400 text-yellow-400" />
                        <span className="text-sm font-medium">5.0</span>
                      </div>
                    </div>
                    <div className="space-y-2">
                      <div className="flex gap-2">
                        <Link href={`/services/${service.id}`} className="flex-1">
                          <Button variant="outline" size="sm" className="w-full">
                            <Eye className="w-4 h-4 mr-1" />
                            {t('common.view')}
                          </Button>
                        </Link>
                        <Link href={`/provider/services/${service.id}/edit`} className="flex-1">
                          <Button variant="outline" size="sm" className="w-full">
                            <Edit className="w-4 h-4 mr-1" />
                            {t('common.edit')}
                          </Button>
                        </Link>
                        <Button
                          variant="outline"
                          size="sm"
                          className="flex-1"
                          onClick={() => {
                            if (confirm(t('provider.confirmDelete'))) {
                              deleteMutation.mutate(service.id);
                            }
                          }}
                        >
                          <Trash2 className="w-4 h-4 mr-1 text-destructive" />
                          {t('common.delete')}
                        </Button>
                      </div>
                      {!activeServiceIds.includes(service.id) && (
                        <Button
                          variant="default"
                          size="sm"
                          onClick={() => setSponsorshipModal({ serviceId: service.id, name: service.name })}
                          data-testid={`button-promote-${service.id}`}
                          className="w-full"
                        >
                          <Megaphone className="w-4 h-4 mr-1" />
                          {t('sponsorship.promote')}
                        </Button>
                      )}
                    </div>
                  </div>
                </Card>
              ))}
            </div>
          ) : (
            <Card className="p-12 text-center">
              <Store className="w-16 h-16 text-muted-foreground mx-auto mb-4" />
              <h3 className="text-xl font-semibold mb-2">{t('dashboards.provider.noServices')}</h3>
              <p className="text-muted-foreground mb-6">
                {t('dashboards.provider.noServicesDesc')}
              </p>
              <Link href="/create-service">
                <Button data-testid="button-add-first-service">
                  <Plus className="w-4 h-4 mr-2" />
                  {t('dashboards.provider.addFirstService')}
                </Button>
              </Link>
            </Card>
          )}
        </div>
      </section>

      {/* Sponsorship Modal */}
      {sponsorshipModal && (
        <SponsorshipModal
          serviceId={sponsorshipModal.serviceId}
          itemTitle={sponsorshipModal.name}
          onClose={() => setSponsorshipModal(null)}
        />
      )}
    </div>
  );
}
