import { useAuth } from "@/hooks/useAuth";
import { useQuery, useMutation } from "@tanstack/react-query";
import { useToast } from "@/hooks/use-toast";
import { queryClient, apiRequest } from "@/lib/queryClient";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Checkbox } from "@/components/ui/checkbox";
import { Slider } from "@/components/ui/slider";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { CheckCircle2, XCircle, Clock, Users, UserCheck, UserX, Shield, Map, Check, X, FileQuestion, MapPin, List, Euro, Compass, Award, TrendingDown, Filter, LogOut } from "lucide-react";
import type { User, TourWithGuide, ServiceWithProvider } from "@shared/schema";
import { useTranslation } from 'react-i18next';
import { LanguageSwitcher } from '@/components/language-switcher';
import { Link } from 'wouter';
import { Logo } from '@/components/logo';
import { MapContainer, TileLayer, Marker, Popup } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import { useState } from 'react';

// Fix for default markers in React-Leaflet
delete (L.Icon.Default.prototype as any)._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon-2x.png',
  iconUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon.png',
  shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png',
});

// Custom orange marker icon for community tours
const communityIcon = new L.Icon({
  iconUrl: 'https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-2x-orange.png',
  shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png',
  iconSize: [25, 41],
  iconAnchor: [12, 41],
  popupAnchor: [1, -34],
  shadowSize: [41, 41]
});

// Standard blue marker for regular tours
const regularIcon = new L.Icon({
  iconUrl: 'https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-2x-blue.png',
  shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png',
  iconSize: [25, 41],
  iconAnchor: [12, 41],
  popupAnchor: [1, -34],
  shadowSize: [41, 41]
});

export default function SupervisorDashboard() {
  const { user, isAuthenticated } = useAuth();
  const { toast } = useToast();
  const { t } = useTranslation();

  // View mode and filters state
  const [viewMode, setViewMode] = useState<'list' | 'map'>('list');
  const [filters, setFilters] = useState({
    communityOnly: false,
    hasParticipants: false,
    minPrice: 0,
    maxPrice: 500,
    difficulty: 'all' as 'all' | 'easy' | 'moderate' | 'challenging' | 'expert',
  });

  const { data: pendingUsers, isLoading } = useQuery<User[]>({
    queryKey: ['/api/supervisor/pending-users'],
    enabled: isAuthenticated && user?.role === 'supervisor',
  });

  const { data: allUsers, isLoading: isLoadingAllUsers } = useQuery<User[]>({
    queryKey: ['/api/supervisor/users'],
    enabled: isAuthenticated && user?.role === 'supervisor',
  });

  const { data: pendingTours, isLoading: isLoadingTours } = useQuery<TourWithGuide[]>({
    queryKey: ['/api/supervisor/pending-tours'],
    enabled: isAuthenticated && user?.role === 'supervisor',
  });

  const { data: pendingServices, isLoading: isLoadingServices } = useQuery<ServiceWithProvider[]>({
    queryKey: ['/api/supervisor/pending-services'],
    enabled: isAuthenticated && user?.role === 'supervisor',
  });

  // Filter tours based on selected criteria
  const filteredTours = pendingTours?.filter((tour) => {
    // Community tours only filter
    if (filters.communityOnly && !tour.communityMode) return false;
    
    // Has participants filter
    if (filters.hasParticipants && (!tour.currentParticipants || tour.currentParticipants === 0)) return false;
    
    // Price range filter
    const price = parseFloat(tour.price || '0');
    if (price < filters.minPrice || price > filters.maxPrice) return false;
    
    // Difficulty filter
    if (filters.difficulty !== 'all' && tour.difficulty !== filters.difficulty) return false;
    
    return true;
  }) || [];

  const approveMutation = useMutation({
    mutationFn: async (userId: string) => {
      return await apiRequest('POST', `/api/supervisor/approve-user/${userId}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/supervisor/pending-users'] });
      toast({
        title: t('dashboards.supervisor.userApproved'),
        description: t('dashboards.supervisor.userApprovedDesc'),
      });
    },
    onError: () => {
      toast({
        title: t('common.error'),
        description: t('dashboards.supervisor.approveUserError'),
        variant: "destructive",
      });
    },
  });

  const rejectMutation = useMutation({
    mutationFn: async (userId: string) => {
      return await apiRequest('POST', `/api/supervisor/reject-user/${userId}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/supervisor/pending-users'] });
      toast({
        title: t('dashboards.supervisor.userRejected'),
        description: t('dashboards.supervisor.userRejectedDesc'),
      });
    },
    onError: () => {
      toast({
        title: t('common.error'),
        description: t('dashboards.supervisor.rejectUserError'),
        variant: "destructive",
      });
    },
  });

  const promoteToSupervisorMutation = useMutation({
    mutationFn: async (userId: string) => {
      return await apiRequest('POST', `/api/supervisor/promote-to-supervisor/${userId}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/supervisor/users'] });
      toast({
        title: t('dashboards.supervisor.userPromoted'),
        description: t('dashboards.supervisor.userPromotedDesc'),
      });
    },
    onError: (error: any) => {
      toast({
        title: t('common.error'),
        description: error?.message || t('dashboards.supervisor.promoteUserError'),
        variant: "destructive",
      });
    },
  });

  const approveTourMutation = useMutation({
    mutationFn: async (tourId: string) => {
      return await apiRequest('POST', `/api/supervisor/approve-tour/${tourId}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/supervisor/pending-tours'] });
      toast({
        title: t('dashboards.supervisor.tourApproved'),
        description: t('dashboards.supervisor.tourApprovedDesc'),
      });
    },
    onError: () => {
      toast({
        title: t('common.error'),
        description: t('dashboards.supervisor.approveTourError'),
        variant: "destructive",
      });
    },
  });

  const rejectTourMutation = useMutation({
    mutationFn: async (tourId: string) => {
      return await apiRequest('POST', `/api/supervisor/reject-tour/${tourId}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/supervisor/pending-tours'] });
      toast({
        title: t('dashboards.supervisor.tourRejected'),
        description: t('dashboards.supervisor.tourRejectedDesc'),
      });
    },
    onError: () => {
      toast({
        title: t('common.error'),
        description: t('dashboards.supervisor.rejectTourError'),
        variant: "destructive",
      });
    },
  });

  const approveServiceMutation = useMutation({
    mutationFn: async (serviceId: string) => {
      return await apiRequest('POST', `/api/supervisor/approve-service/${serviceId}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/supervisor/pending-services'] });
      toast({
        title: t('dashboards.supervisor.serviceApproved'),
        description: t('dashboards.supervisor.serviceApprovedDesc'),
      });
    },
    onError: () => {
      toast({
        title: t('common.error'),
        description: t('dashboards.supervisor.approveServiceError'),
        variant: "destructive",
      });
    },
  });

  const rejectServiceMutation = useMutation({
    mutationFn: async (serviceId: string) => {
      return await apiRequest('POST', `/api/supervisor/reject-service/${serviceId}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/supervisor/pending-services'] });
      toast({
        title: t('dashboards.supervisor.serviceRejected'),
        description: t('dashboards.supervisor.serviceRejectedDesc'),
      });
    },
    onError: () => {
      toast({
        title: t('common.error'),
        description: t('dashboards.supervisor.rejectServiceError'),
        variant: "destructive",
      });
    },
  });

  // Calculate dynamic price based on discount rules
  const calculateDynamicPrice = (tour: TourWithGuide) => {
    const basePrice = parseFloat(tour.price || '0');
    if (!tour.discountRules || tour.discountRules.length === 0 || !tour.currentParticipants) {
      return { price: basePrice, discount: 0 };
    }

    const applicableDiscounts = tour.discountRules.filter(
      (rule: any) => tour.currentParticipants! >= rule.threshold
    );
    
    if (applicableDiscounts.length === 0) {
      return { price: basePrice, discount: 0 };
    }

    const highestDiscount = Math.max(...applicableDiscounts.map((rule: any) => rule.discount));
    const discountedPrice = basePrice * (1 - highestDiscount / 100);

    return {
      price: discountedPrice,
      discount: highestDiscount,
      originalPrice: basePrice
    };
  };

  const handleLogout = async () => {
    try {
      const response = await fetch('/api/logout', { method: 'POST' });
      
      if (!response.ok) {
        throw new Error('Logout failed');
      }
      
      toast({
        title: t('auth.logoutSuccess'),
        description: t('auth.logoutSuccessDesc'),
      });
      
      setTimeout(() => {
        window.location.href = '/admin/login';
      }, 1000);
    } catch (error) {
      toast({
        title: t('common.error'),
        description: t('auth.logoutError'),
        variant: 'destructive',
      });
    }
  };

  if (user?.role !== 'supervisor') {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <Card className="p-8 text-center">
          <XCircle className="w-16 h-16 mx-auto text-destructive mb-4" />
          <h2 className="text-2xl font-semibold mb-2">{t('system.accessDenied')}</h2>
          <p className="text-muted-foreground">{t('dashboards.supervisor.accessDeniedDesc')}</p>
        </Card>
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
                <a className="text-sm font-medium hover:text-primary transition-colors" data-testid="link-dashboard">
                  {t('navigation.dashboard')}
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
            <Button
              variant="ghost"
              size="sm"
              onClick={handleLogout}
              className="flex items-center gap-2"
              aria-label={t('navigation.logout')}
            >
              <LogOut className="w-4 h-4" />
              <span className="hidden md:inline">{t('navigation.logout')}</span>
            </Button>
          </div>
        </div>
      </header>

      <div className="bg-gradient-to-r from-primary/90 to-primary text-primary-foreground py-12 px-4">
        <div className="max-w-7xl mx-auto">
          <div>
            <h2 className="text-4xl font-serif font-bold mb-2">{t('dashboards.supervisor.title')}</h2>
            <p className="text-primary-foreground/90">{t('dashboards.supervisor.subtitle')}</p>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto py-8 px-4">
        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          <Card className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground mb-1">{t('dashboards.supervisor.stats.pendingApproval')}</p>
                <p className="text-3xl font-bold">{pendingUsers?.length || 0}</p>
              </div>
              <Clock className="w-12 h-12 text-orange-500" />
            </div>
          </Card>

          <Card className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground mb-1">{t('dashboards.supervisor.stats.totalUsers')}</p>
                <p className="text-3xl font-bold">-</p>
              </div>
              <Users className="w-12 h-12 text-blue-500" />
            </div>
          </Card>

          <Card className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground mb-1">{t('dashboards.supervisor.stats.approvedToday')}</p>
                <p className="text-3xl font-bold">-</p>
              </div>
              <UserCheck className="w-12 h-12 text-green-500" />
            </div>
          </Card>
        </div>

        {/* Management Tabs */}
        <Tabs defaultValue="pending" className="space-y-6">
          <TabsList className="grid w-full max-w-4xl grid-cols-4">
            <TabsTrigger value="pending" data-testid="tab-pending">
              <Clock className="w-4 h-4 mr-2" />
              {t('dashboards.supervisor.tabs.pendingApprovals')}
            </TabsTrigger>
            <TabsTrigger value="users" data-testid="tab-users">
              <Users className="w-4 h-4 mr-2" />
              {t('dashboards.supervisor.tabs.userManagement')}
            </TabsTrigger>
            <TabsTrigger value="tours" data-testid="tab-tours">
              <Map className="w-4 h-4 mr-2" />
              {t('dashboards.supervisor.tabs.tourModeration')}
            </TabsTrigger>
            <TabsTrigger value="services" data-testid="tab-services">
              <Shield className="w-4 h-4 mr-2" />
              {t('dashboards.supervisor.tabs.serviceModeration')}
            </TabsTrigger>
          </TabsList>

          <TabsContent value="pending">
            <Card className="p-6">
              <h2 className="text-2xl font-semibold mb-6">{t('dashboards.supervisor.tabs.pendingApprovals')}</h2>

              {isLoading ? (
                <div className="text-center py-12">
                  <div className="animate-spin w-12 h-12 border-4 border-primary border-t-transparent rounded-full mx-auto" />
                  <p className="text-muted-foreground mt-4">{t('dashboards.supervisor.loadingUsers')}</p>
                </div>
              ) : pendingUsers && pendingUsers.length > 0 ? (
                <div className="space-y-4">
                  {pendingUsers.map((pendingUser) => (
                    <Card key={pendingUser.id} className="p-4">
                      <div className="flex items-center justify-between gap-4">
                        <div className="flex items-center gap-4 flex-1">
                          <Avatar className="w-12 h-12">
                            <AvatarFallback>
                              {pendingUser.firstName?.[0]}{pendingUser.lastName?.[0]}
                            </AvatarFallback>
                          </Avatar>

                          <div className="flex-1">
                            <h3 className="font-semibold" data-testid={`text-user-name-${pendingUser.id}`}>
                              {pendingUser.firstName} {pendingUser.lastName}
                            </h3>
                            <p className="text-sm text-muted-foreground">{pendingUser.email}</p>
                            <div className="flex items-center gap-2 mt-1">
                              <Badge variant="secondary" data-testid={`badge-role-${pendingUser.id}`}>
                                {t(`roles.${pendingUser.role}`)}
                              </Badge>
                              <Badge variant="outline" className="bg-orange-100 text-orange-800 border-orange-300">
                                <Clock className="w-3 h-3 mr-1" />
                                {t('status.pending')}
                              </Badge>
                            </div>
                            <p className="text-xs text-muted-foreground mt-1">
                              {t('dashboards.supervisor.registered')}: {new Date(pendingUser.createdAt).toLocaleDateString()}
                            </p>
                          </div>
                        </div>

                        <div className="flex gap-2">
                          <Button
                            onClick={() => approveMutation.mutate(pendingUser.id)}
                            disabled={approveMutation.isPending || rejectMutation.isPending}
                            variant="default"
                            data-testid={`button-approve-${pendingUser.id}`}
                          >
                            <CheckCircle2 className="w-4 h-4 mr-2" />
                            {t('common.approve')}
                          </Button>
                          <Button
                            onClick={() => rejectMutation.mutate(pendingUser.id)}
                            disabled={approveMutation.isPending || rejectMutation.isPending}
                            variant="destructive"
                            data-testid={`button-reject-${pendingUser.id}`}
                          >
                            <XCircle className="w-4 h-4 mr-2" />
                            {t('common.reject')}
                          </Button>
                        </div>
                      </div>
                    </Card>
                  ))}
                </div>
              ) : (
                <div className="text-center py-12">
                  <UserCheck className="w-16 h-16 mx-auto text-muted-foreground/50 mb-4" />
                  <h3 className="text-lg font-semibold mb-2">{t('dashboards.supervisor.noPending')}</h3>
                  <p className="text-muted-foreground">{t('dashboards.supervisor.noPendingDesc')}</p>
                </div>
              )}
            </Card>
          </TabsContent>

          <TabsContent value="users">
            <Card className="p-6">
              <h2 className="text-2xl font-semibold mb-6">{t('dashboards.supervisor.tabs.userManagement')}</h2>

              {isLoadingAllUsers ? (
                <div className="text-center py-12">
                  <div className="animate-spin w-12 h-12 border-4 border-primary border-t-transparent rounded-full mx-auto" />
                  <p className="text-muted-foreground mt-4">{t('dashboards.supervisor.loadingUsers')}</p>
                </div>
              ) : allUsers && allUsers.length > 0 ? (
                <div className="space-y-4">
                  {allUsers.map((u) => (
                    <Card key={u.id} className="p-4">
                      <div className="flex items-center justify-between gap-4">
                        <div className="flex items-center gap-4 flex-1">
                          <Avatar className="w-12 h-12">
                            <AvatarFallback>
                              {u.firstName?.[0]}{u.lastName?.[0]}
                            </AvatarFallback>
                          </Avatar>

                          <div className="flex-1">
                            <h3 className="font-semibold" data-testid={`text-user-name-${u.id}`}>
                              {u.firstName} {u.lastName}
                            </h3>
                            <p className="text-sm text-muted-foreground">{u.email}</p>
                            <div className="flex items-center gap-2 mt-1">
                              <Badge 
                                variant={u.role === 'supervisor' ? 'default' : 'secondary'}
                                data-testid={`badge-role-${u.id}`}
                              >
                                {u.role ? t(`roles.${u.role}`) : t('dashboards.supervisor.noRole')}
                              </Badge>
                              {u.approvalStatus && (
                                <Badge 
                                  variant="outline" 
                                  className={
                                    u.approvalStatus === 'approved' 
                                      ? 'bg-green-100 text-green-800 border-green-300'
                                      : u.approvalStatus === 'pending'
                                      ? 'bg-orange-100 text-orange-800 border-orange-300'
                                      : 'bg-red-100 text-red-800 border-red-300'
                                  }
                                >
                                  {t(`status.${u.approvalStatus}`)}
                                </Badge>
                              )}
                            </div>
                            <p className="text-xs text-muted-foreground mt-1">
                              {t('dashboards.supervisor.registered')}: {new Date(u.createdAt).toLocaleDateString()}
                            </p>
                          </div>
                        </div>

                        <div className="flex gap-2">
                          {u.role !== 'supervisor' && u.role !== null && (
                            <Button
                              onClick={() => promoteToSupervisorMutation.mutate(u.id)}
                              disabled={promoteToSupervisorMutation.isPending}
                              variant="outline"
                              data-testid={`button-promote-${u.id}`}
                            >
                              <Shield className="w-4 h-4 mr-2" />
                              {t('dashboards.supervisor.promoteToSupervisor')}
                            </Button>
                          )}
                          {u.role === 'supervisor' && (
                            <Badge variant="default" className="px-4 py-2">
                              <Shield className="w-4 h-4 mr-2" />
                              {t('roles.supervisor')}
                            </Badge>
                          )}
                        </div>
                      </div>
                    </Card>
                  ))}
                </div>
              ) : (
                <div className="text-center py-12">
                  <Users className="w-16 h-16 mx-auto text-muted-foreground/50 mb-4" />
                  <h3 className="text-lg font-semibold mb-2">{t('dashboards.supervisor.noUsers')}</h3>
                  <p className="text-muted-foreground">{t('dashboards.supervisor.noUsersDesc')}</p>
                </div>
              )}
            </Card>
          </TabsContent>

          <TabsContent value="tours">
            <Card className="p-6">
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-2xl font-semibold">{t('dashboards.supervisor.tabs.tourModeration')}</h2>
                
                {/* View Mode Toggle */}
                <div className="flex items-center gap-2">
                  <Button
                    variant={viewMode === 'list' ? 'default' : 'outline'}
                    size="sm"
                    onClick={() => setViewMode('list')}
                    className="flex items-center gap-2"
                  >
                    <List className="w-4 h-4" />
                    {t('common.listView') || 'List View'}
                  </Button>
                  <Button
                    variant={viewMode === 'map' ? 'default' : 'outline'}
                    size="sm"
                    onClick={() => setViewMode('map')}
                    className="flex items-center gap-2"
                  >
                    <MapPin className="w-4 h-4" />
                    {t('common.mapView') || 'Map View'}
                  </Button>
                </div>
              </div>

              {/* Filters */}
              <Card className="p-4 mb-6 bg-muted/50">
                <div className="flex items-center gap-2 mb-4">
                  <Filter className="w-5 h-5 text-[#FF6600]" />
                  <h3 className="font-semibold">{t('common.filter') || 'Filters'}</h3>
                </div>
                
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                  {/* Community Tours Only */}
                  <div className="flex items-center space-x-2">
                    <Checkbox
                      id="community-only"
                      checked={filters.communityOnly}
                      onCheckedChange={(checked) => 
                        setFilters({ ...filters, communityOnly: checked as boolean })
                      }
                    />
                    <label
                      htmlFor="community-only"
                      className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
                    >
                      {t('filters.communityToursOnly') || 'Community Tours Only'}
                    </label>
                  </div>

                  {/* Has Participants */}
                  <div className="flex items-center space-x-2">
                    <Checkbox
                      id="has-participants"
                      checked={filters.hasParticipants}
                      onCheckedChange={(checked) => 
                        setFilters({ ...filters, hasParticipants: checked as boolean })
                      }
                    />
                    <label
                      htmlFor="has-participants"
                      className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
                    >
                      {t('filters.hasParticipants') || 'Has Participants'}
                    </label>
                  </div>

                  {/* Difficulty Filter */}
                  <div className="space-y-2">
                    <label className="text-sm font-medium">
                      {t('filters.difficulty') || 'Difficulty'}
                    </label>
                    <Select
                      value={filters.difficulty}
                      onValueChange={(value: any) => 
                        setFilters({ ...filters, difficulty: value })
                      }
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="all">{t('common.all') || 'All'}</SelectItem>
                        <SelectItem value="easy">{t('tours.difficulty.easy') || 'Easy'}</SelectItem>
                        <SelectItem value="moderate">{t('tours.difficulty.moderate') || 'Moderate'}</SelectItem>
                        <SelectItem value="challenging">{t('tours.difficulty.challenging') || 'Challenging'}</SelectItem>
                        <SelectItem value="expert">{t('tours.difficulty.expert') || 'Expert'}</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  {/* Price Range */}
                  <div className="space-y-2">
                    <label className="text-sm font-medium flex items-center gap-2">
                      <Euro className="w-4 h-4" />
                      {t('filters.priceRange') || 'Price Range'}: €{filters.minPrice} - €{filters.maxPrice}
                    </label>
                    <Slider
                      min={0}
                      max={500}
                      step={10}
                      value={[filters.minPrice, filters.maxPrice]}
                      onValueChange={([min, max]) => 
                        setFilters({ ...filters, minPrice: min, maxPrice: max })
                      }
                      className="w-full"
                    />
                  </div>
                </div>
              </Card>

              {isLoadingTours ? (
                <div className="text-center py-12">
                  <div className="animate-spin w-12 h-12 border-4 border-primary border-t-transparent rounded-full mx-auto" />
                  <p className="text-muted-foreground mt-4">{t('dashboards.supervisor.loadingTours')}</p>
                </div>
              ) : viewMode === 'map' ? (
                /* Map View */
                filteredTours.length > 0 ? (
                  <div className="h-[600px] rounded-lg overflow-hidden border">
                    <MapContainer
                      center={[41.9028, 12.4964]}
                      zoom={6}
                      style={{ height: '100%', width: '100%' }}
                    >
                      <TileLayer
                        url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                        attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
                      />
                      {filteredTours.map((tour) => (
                        tour.latitude && tour.longitude ? (
                          <Marker
                            key={tour.id}
                            position={[tour.latitude, tour.longitude]}
                            icon={tour.communityMode ? communityIcon : regularIcon}
                          >
                            <Popup className="min-w-[300px]">
                              <div className="p-2">
                                <h3 className="font-semibold text-lg mb-2">{tour.title}</h3>
                                
                                <div className="flex flex-wrap gap-2 mb-3">
                                  {tour.communityMode && (
                                    <Badge className="bg-[#FF6600] text-white">
                                      <Award className="w-3 h-3 mr-1" />
                                      {t('tours.communityMode') || 'Community Tour'}
                                    </Badge>
                                  )}
                                  <Badge variant="secondary">
                                    {t(`categories.${tour.category}`) || tour.category}
                                  </Badge>
                                  {tour.difficulty && (
                                    <Badge variant="outline">
                                      <Compass className="w-3 h-3 mr-1" />
                                      {t(`tours.difficulty.${tour.difficulty}`) || tour.difficulty}
                                    </Badge>
                                  )}
                                </div>

                                {tour.communityMode && tour.currentParticipants !== undefined && (
                                  <div className="mb-3 p-2 bg-muted rounded text-sm">
                                    <div className="flex items-center justify-between mb-1">
                                      <span className="font-medium">
                                        <Users className="w-4 h-4 inline mr-1" />
                                        {t('tours.participants') || 'Participants'}:
                                      </span>
                                      <span>{tour.currentParticipants} / {tour.maxGroupSize}</span>
                                    </div>
                                  </div>
                                )}

                                <div className="flex items-center justify-between gap-2 mt-3">
                                  <Button
                                    onClick={() => approveTourMutation.mutate(tour.id)}
                                    disabled={approveTourMutation.isPending}
                                    variant="default"
                                    size="sm"
                                  >
                                    <CheckCircle2 className="w-4 h-4 mr-1" />
                                    {t('common.approve')}
                                  </Button>
                                  <Button
                                    onClick={() => rejectTourMutation.mutate(tour.id)}
                                    disabled={rejectTourMutation.isPending}
                                    variant="destructive"
                                    size="sm"
                                  >
                                    <XCircle className="w-4 h-4 mr-1" />
                                    {t('common.reject')}
                                  </Button>
                                </div>
                              </div>
                            </Popup>
                          </Marker>
                        ) : null
                      ))}
                    </MapContainer>
                  </div>
                ) : (
                  <div className="text-center py-12">
                    <MapPin className="w-16 h-16 mx-auto text-muted-foreground/50 mb-4" />
                    <h3 className="text-lg font-semibold mb-2">{t('dashboards.supervisor.noToursMatch')}</h3>
                    <p className="text-muted-foreground">{t('dashboards.supervisor.adjustFilters')}</p>
                  </div>
                )
              ) : (
                /* List View */
                filteredTours.length > 0 ? (
                  <div className="space-y-4">
                    {filteredTours.map((tour) => {
                      const pricing = calculateDynamicPrice(tour);
                      
                      return (
                        <Card key={tour.id} className="p-4">
                          <div className="flex items-start justify-between gap-4">
                            <div className="flex-1">
                              <div className="flex items-start justify-between mb-2">
                                <h3 className="font-semibold text-lg" data-testid={`text-tour-title-${tour.id}`}>
                                  {tour.title}
                                </h3>
                                {tour.communityMode && (
                                  <Badge className="bg-[#FF6600] text-white ml-2">
                                    <Award className="w-3 h-3 mr-1" />
                                    {t('tours.communityMode') || 'Community Tour'}
                                  </Badge>
                                )}
                              </div>
                              
                              <p className="text-sm text-muted-foreground mt-1">
                                {t('dashboards.supervisor.by')} {tour.guide?.firstName} {tour.guide?.lastName}
                              </p>
                              
                              <div className="flex flex-wrap items-center gap-2 mt-2">
                                <Badge variant="secondary" data-testid={`badge-category-${tour.id}`}>
                                  {t(`categories.${tour.category}`) || tour.category}
                                </Badge>
                                <Badge variant="outline" className="bg-orange-100 text-orange-800 border-orange-300">
                                  <Clock className="w-3 h-3 mr-1" />
                                  {t('status.pending')}
                                </Badge>
                                {tour.difficulty && (
                                  <Badge variant="outline">
                                    <Compass className="w-3 h-3 mr-1" />
                                    {t(`tours.difficulty.${tour.difficulty}`) || tour.difficulty}
                                  </Badge>
                                )}
                                <span className="text-sm text-muted-foreground">
                                  €{tour.price}
                                </span>
                                <span className="text-sm text-muted-foreground">•</span>
                                <span className="text-sm text-muted-foreground">
                                  {tour.duration} {t('common.minutes')}
                                </span>
                              </div>

                              {/* Community Tour Details */}
                              {tour.communityMode && (
                                <div className="mt-3 p-3 bg-muted/50 rounded-lg space-y-2">
                                  {/* Participants */}
                                  <div className="flex items-center justify-between text-sm">
                                    <span className="flex items-center gap-2 font-medium">
                                      <Users className="w-4 h-4" />
                                      {t('tours.participants') || 'Participants'}:
                                    </span>
                                    <span>
                                      {tour.currentParticipants || 0} / {tour.maxGroupSize}
                                      {tour.minParticipants && ` (min: ${tour.minParticipants})`}
                                    </span>
                                  </div>

                                  {/* Discount Rules */}
                                  {tour.discountRules && tour.discountRules.length > 0 && (
                                    <div className="text-sm">
                                      <span className="flex items-center gap-2 font-medium mb-1">
                                        <TrendingDown className="w-4 h-4 text-green-600" />
                                        {t('tours.discountRules') || 'Discount Rules'}:
                                      </span>
                                      <div className="ml-6 space-y-1">
                                        {tour.discountRules.map((rule: any, idx: number) => (
                                          <div key={idx} className="text-muted-foreground">
                                            {rule.threshold}+ {t('tours.participants') || 'participants'}: {rule.discount}% {t('common.off') || 'off'}
                                          </div>
                                        ))}
                                      </div>
                                      {pricing.discount > 0 && (
                                        <div className="mt-2 p-2 bg-green-100 text-green-800 rounded">
                                          {t('tours.currentPrice') || 'Current Price'}: €{pricing.price.toFixed(2)} 
                                          <span className="line-through ml-2 text-muted-foreground">€{pricing.originalPrice}</span>
                                          <Badge className="ml-2 bg-green-600">{pricing.discount}% {t('common.off')}</Badge>
                                        </div>
                                      )}
                                    </div>
                                  )}

                                  {/* Add-ons */}
                                  {tour.addons && tour.addons.length > 0 && (
                                    <div className="text-sm">
                                      <span className="font-medium flex items-center gap-2 mb-1">
                                        <Award className="w-4 h-4" />
                                        {t('tours.addons') || 'Add-ons'}:
                                      </span>
                                      <div className="ml-6 space-y-1">
                                        {tour.addons.map((addon: any) => (
                                          <div key={addon.id} className="text-muted-foreground">
                                            {addon.name} - €{addon.price}
                                          </div>
                                        ))}
                                      </div>
                                    </div>
                                  )}
                                </div>
                              )}
                              
                              <p className="text-xs text-muted-foreground mt-2">
                                {t('dashboards.supervisor.created')}: {new Date(tour.createdAt).toLocaleDateString()}
                              </p>
                            </div>

                            <div className="flex gap-2">
                              <Button
                                onClick={() => approveTourMutation.mutate(tour.id)}
                                disabled={approveTourMutation.isPending || rejectTourMutation.isPending}
                                variant="default"
                                data-testid={`button-approve-tour-${tour.id}`}
                              >
                                <CheckCircle2 className="w-4 h-4 mr-2" />
                                {t('common.approve')}
                              </Button>
                              <Button
                                onClick={() => rejectTourMutation.mutate(tour.id)}
                                disabled={approveTourMutation.isPending || rejectTourMutation.isPending}
                                variant="destructive"
                                data-testid={`button-reject-tour-${tour.id}`}
                              >
                                <XCircle className="w-4 h-4 mr-2" />
                                {t('common.reject')}
                              </Button>
                            </div>
                          </div>
                        </Card>
                      );
                    })}
                  </div>
                ) : (
                  <div className="text-center py-12">
                    <Map className="w-16 h-16 mx-auto text-muted-foreground/50 mb-4" />
                    <h3 className="text-lg font-semibold mb-2">
                      {pendingTours && pendingTours.length > 0 
                        ? t('dashboards.supervisor.noToursMatch') 
                        : t('dashboards.supervisor.noPendingTours')}
                    </h3>
                    <p className="text-muted-foreground">
                      {pendingTours && pendingTours.length > 0 
                        ? t('dashboards.supervisor.adjustFilters') 
                        : t('dashboards.supervisor.noPendingToursDesc')}
                    </p>
                  </div>
                )
              )}
            </Card>
          </TabsContent>

          <TabsContent value="services">
            <Card className="p-6">
              <h2 className="text-2xl font-semibold mb-6">{t('dashboards.supervisor.tabs.serviceModeration')}</h2>

              {isLoadingServices ? (
                <div className="text-center py-12">
                  <div className="animate-spin w-12 h-12 border-4 border-primary border-t-transparent rounded-full mx-auto" />
                  <p className="text-muted-foreground mt-4">{t('dashboards.supervisor.loadingServices')}</p>
                </div>
              ) : pendingServices && pendingServices.length > 0 ? (
                <div className="space-y-4">
                  {pendingServices.map((service) => (
                    <Card key={service.id} className="p-4">
                      <div className="flex items-start justify-between gap-4">
                        <div className="flex-1">
                          <h3 className="font-semibold text-lg">
                            {service.title}
                          </h3>
                          <p className="text-sm text-muted-foreground mt-1">
                            {t('dashboards.supervisor.by')} {service.provider?.firstName} {service.provider?.lastName}
                          </p>
                          <div className="flex flex-wrap items-center gap-2 mt-2">
                            <Badge variant="secondary">
                              {service.category}
                            </Badge>
                            <Badge variant="outline" className="bg-orange-100 text-orange-800 border-orange-300">
                              <Clock className="w-3 h-3 mr-1" />
                              {t('status.pending')}
                            </Badge>
                            <span className="text-sm text-muted-foreground">
                              ${service.price}
                            </span>
                          </div>
                          <p className="text-xs text-muted-foreground mt-2">
                            {t('dashboards.supervisor.created')}: {new Date(service.createdAt).toLocaleDateString()}
                          </p>
                          {service.description && (
                            <p className="text-sm mt-2 line-clamp-2">{service.description}</p>
                          )}
                        </div>

                        <div className="flex gap-2">
                          <Button
                            onClick={() => approveServiceMutation.mutate(service.id)}
                            disabled={approveServiceMutation.isPending}
                            variant="default"
                            size="sm"
                            className="bg-green-600 hover:bg-green-700"
                          >
                            <Check className="w-4 h-4 mr-1" />
                            {t('dashboards.supervisor.approve')}
                          </Button>
                          <Button
                            onClick={() => rejectServiceMutation.mutate(service.id)}
                            disabled={rejectServiceMutation.isPending}
                            variant="destructive"
                            size="sm"
                          >
                            <X className="w-4 h-4 mr-1" />
                            {t('dashboards.supervisor.reject')}
                          </Button>
                        </div>
                      </div>
                    </Card>
                  ))}
                </div>
              ) : (
                <div className="text-center py-12">
                  <FileQuestion className="w-16 h-16 text-muted-foreground mx-auto mb-4" />
                  <h3 className="text-xl font-semibold mb-2">{t('dashboards.supervisor.noServicesTitle')}</h3>
                  <p className="text-muted-foreground">{t('dashboards.supervisor.noServicesDesc')}</p>
                </div>
              )}
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}
