import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useTranslation } from 'react-i18next';
import { useLocation } from 'wouter';
import { useAuth } from '@/hooks/useAuth';
import { useToast } from '@/hooks/use-toast';
import { getQueryFn } from '@/lib/queryClient';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Textarea } from '@/components/ui/textarea';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from '@/components/ui/alert-dialog';
import { 
  LayoutDashboard, 
  Package, 
  Ticket, 
  Users, 
  TrendingUp, 
  Wallet, 
  CreditCard, 
  Link2, 
  User,
  Plus,
  Search,
  Edit,
  Trash2,
  Download,
  RefreshCw,
  CheckCircle,
  XCircle,
  AlertCircle,
  DollarSign,
  ShoppingBag,
  Calendar,
  BarChart3,
  PieChart,
  LineChart,
  ExternalLink,
  Trophy,
  Award
} from 'lucide-react';
import { LineChart as RechartsLine, Line, BarChart as RechartsBar, Bar, PieChart as RechartsPie, Pie, Cell, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import { format } from 'date-fns';

const COLORS = ['#FF6600', '#FF8833', '#FFAA66', '#FFCC99'];

// TypeScript interfaces for rewards
interface UserReward {
  points: number;
  trustLevel: string;
  badges: string[];
}

interface RewardLog {
  id: string;
  actionType: string;
  pointsAwarded: number;
  metadata?: {
    description?: string;
  };
  createdAt: string;
}

// Typed query helper for partner portal
const usePartnerQuery = <T,>(endpoint: string, options = {}) => {
  return useQuery<T>({
    queryKey: [endpoint],
    queryFn: async () => {
      const res = await fetch(endpoint, { credentials: 'include' });
      if (!res.ok) throw new Error(`Failed to fetch ${endpoint}`);
      return res.json();
    },
    ...options,
  });
};

// Helper functions for rewards
const getActionLabel = (actionType: string, t: any): string => {
  const labels: Record<string, string> = {
    partner_sale: t('partnerPortal.rewards.actions.partnerSale'),
    package_created: t('partnerPortal.rewards.actions.packageCreated'),
    affiliate_conversion: t('partnerPortal.rewards.actions.affiliateConversion'),
    post_created: t('partnerPortal.rewards.actions.postCreated'),
    review_received: t('partnerPortal.rewards.actions.reviewReceived'),
    tour_completed: t('partnerPortal.rewards.actions.tourCompleted'),
  };
  return labels[actionType] || actionType;
};

const getBadgeVariant = (trustLevel?: string): "default" | "secondary" | "outline" | "destructive" | null | undefined => {
  switch (trustLevel) {
    case 'Expert': return 'default';
    case 'Advanced': return 'secondary';
    case 'Intermediate': return 'outline';
    default: return 'outline';
  }
};

export default function PartnerPortal() {
  const { t } = useTranslation();
  const { user, isAuthenticated } = useAuth();
  const [, setLocation] = useLocation();
  const { toast } = useToast();
  const [activeTab, setActiveTab] = useState('dashboard');

  if (!isAuthenticated) {
    return (
      <div className="container mx-auto px-4 py-16">
        <Alert>
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>
            {t('partnerPortal.errors.unauthorized')}
          </AlertDescription>
        </Alert>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8 max-w-7xl">
      <div className="mb-8">
        <h1 className="text-3xl font-bold mb-2">{t('partnerPortal.title')}</h1>
        <p className="text-muted-foreground">{t('partnerPortal.subtitle')}</p>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
        <TabsList className="grid grid-cols-3 md:grid-cols-5 lg:grid-cols-9 w-full">
          <TabsTrigger value="dashboard" className="flex items-center gap-2">
            <LayoutDashboard className="h-4 w-4" />
            <span className="hidden sm:inline">{t('partnerPortal.tabs.dashboard')}</span>
          </TabsTrigger>
          <TabsTrigger value="packages" className="flex items-center gap-2">
            <Package className="h-4 w-4" />
            <span className="hidden sm:inline">{t('partnerPortal.tabs.packages')}</span>
          </TabsTrigger>
          <TabsTrigger value="coupons" className="flex items-center gap-2">
            <Ticket className="h-4 w-4" />
            <span className="hidden sm:inline">{t('partnerPortal.tabs.coupons')}</span>
          </TabsTrigger>
          <TabsTrigger value="affiliates" className="flex items-center gap-2">
            <Users className="h-4 w-4" />
            <span className="hidden sm:inline">{t('partnerPortal.tabs.affiliates')}</span>
          </TabsTrigger>
          <TabsTrigger value="analytics" className="flex items-center gap-2">
            <TrendingUp className="h-4 w-4" />
            <span className="hidden sm:inline">{t('partnerPortal.tabs.analytics')}</span>
          </TabsTrigger>
          <TabsTrigger value="payouts" className="flex items-center gap-2">
            <Wallet className="h-4 w-4" />
            <span className="hidden sm:inline">{t('partnerPortal.tabs.payouts')}</span>
          </TabsTrigger>
          <TabsTrigger value="billing" className="flex items-center gap-2">
            <CreditCard className="h-4 w-4" />
            <span className="hidden sm:inline">{t('partnerPortal.tabs.billing')}</span>
          </TabsTrigger>
          <TabsTrigger value="connectors" className="flex items-center gap-2">
            <Link2 className="h-4 w-4" />
            <span className="hidden sm:inline">{t('partnerPortal.tabs.connectors')}</span>
          </TabsTrigger>
          <TabsTrigger value="profile" className="flex items-center gap-2">
            <User className="h-4 w-4" />
            <span className="hidden sm:inline">{t('partnerPortal.tabs.profile')}</span>
          </TabsTrigger>
        </TabsList>

        <TabsContent value="dashboard">
          <DashboardTab />
        </TabsContent>

        <TabsContent value="packages">
          <PackagesTab />
        </TabsContent>

        <TabsContent value="coupons">
          <CouponsTab />
        </TabsContent>

        <TabsContent value="affiliates">
          <AffiliatesTab />
        </TabsContent>

        <TabsContent value="analytics">
          <AnalyticsTab />
        </TabsContent>

        <TabsContent value="payouts">
          <PayoutsTab />
        </TabsContent>

        <TabsContent value="billing">
          <BillingTab />
        </TabsContent>

        <TabsContent value="connectors">
          <ConnectorsTab />
        </TabsContent>

        <TabsContent value="profile">
          <ProfileTab />
        </TabsContent>
      </Tabs>
    </div>
  );
}

function DashboardTab() {
  const { t } = useTranslation();
  const { user } = useAuth();

  const { data: stats, isLoading } = useQuery({
    queryKey: ['partner', 'dashboard', 'stats'],
    queryFn: getQueryFn({ on401: 'returnNull' }),
  });

  const { data: recentBookings } = useQuery({
    queryKey: ['partner', 'bookings', 'recent'],
    queryFn: getQueryFn({ on401: 'returnNull' }),
  });

  const { data: rewards } = usePartnerQuery<UserReward>('/api/rewards/my');
  const { data: rewardLogs } = usePartnerQuery<RewardLog[]>('/api/rewards/logs?limit=10');

  if (isLoading) {
    return (
      <div className="space-y-6">
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
          {[1, 2, 3, 4].map((i) => (
            <Skeleton key={i} className="h-32" />
          ))}
        </div>
      </div>
    );
  }

  const statsData = stats as any || {};
  const bookingsData = Array.isArray(recentBookings) ? recentBookings : [];

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold mb-1">{t('partnerPortal.dashboard.title')}</h2>
        <p className="text-muted-foreground">{t('partnerPortal.dashboard.welcome', { name: user?.firstName || 'Partner' })}</p>
      </div>

      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              {t('partnerPortal.dashboard.stats.totalRevenue')}
            </CardTitle>
            <DollarSign className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">${statsData?.revenue?.thisMonth?.toFixed(2) || '0.00'}</div>
            <p className="text-xs text-muted-foreground">
              {t('partnerPortal.dashboard.stats.thisMonth')}
            </p>
            <p className="text-xs text-muted-foreground mt-1">
              {t('partnerPortal.dashboard.stats.allTime')}: ${statsData?.revenue?.allTime?.toFixed(2) || '0.00'}
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              {t('partnerPortal.dashboard.stats.activePackages')}
            </CardTitle>
            <Package className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{statsData?.activePackages || 0}</div>
            <p className="text-xs text-muted-foreground">
              {t('partnerPortal.dashboard.stats.totalBookings')}: {statsData?.totalBookings || 0}
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              {t('partnerPortal.dashboard.stats.totalBookings')}
            </CardTitle>
            <ShoppingBag className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{statsData?.bookings?.total || 0}</div>
            <div className="flex gap-2 mt-1 text-xs">
              <span className="text-yellow-600">{t('partnerPortal.dashboard.stats.pending')}: {statsData?.bookings?.pending || 0}</span>
              <span className="text-green-600">{t('partnerPortal.dashboard.stats.confirmed')}: {statsData?.bookings?.confirmed || 0}</span>
              <span className="text-blue-600">{t('partnerPortal.dashboard.stats.completed')}: {statsData?.bookings?.completed || 0}</span>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              {t('partnerPortal.dashboard.stats.activeCoupons')} / {t('partnerPortal.dashboard.stats.activeAffiliates')}
            </CardTitle>
            <Ticket className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{statsData?.activeCoupons || 0} / {statsData?.activeAffiliates || 0}</div>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>{t('partnerPortal.dashboard.recentBookings.title')}</CardTitle>
        </CardHeader>
        <CardContent>
          {bookingsData.length === 0 ? (
            <p className="text-muted-foreground text-center py-8">{t('partnerPortal.dashboard.recentBookings.noBookings')}</p>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>{t('partnerPortal.dashboard.recentBookings.customer')}</TableHead>
                  <TableHead>{t('partnerPortal.dashboard.recentBookings.package')}</TableHead>
                  <TableHead>{t('partnerPortal.dashboard.recentBookings.date')}</TableHead>
                  <TableHead>{t('partnerPortal.dashboard.recentBookings.amount')}</TableHead>
                  <TableHead>{t('partnerPortal.dashboard.recentBookings.status')}</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {bookingsData.slice(0, 10).map((booking: any) => (
                  <TableRow key={booking.id}>
                    <TableCell>{booking.customerName || 'N/A'}</TableCell>
                    <TableCell>{booking.packageName || 'N/A'}</TableCell>
                    <TableCell>{booking.date ? format(new Date(booking.date), 'MMM dd, yyyy') : 'N/A'}</TableCell>
                    <TableCell>${booking.amount?.toFixed(2) || '0.00'}</TableCell>
                    <TableCell>
                      <Badge variant={booking.status === 'confirmed' ? 'default' : 'secondary'}>
                        {booking.status}
                      </Badge>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>{t('partnerPortal.dashboard.quickActions.title')}</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex flex-wrap gap-4">
            <Button>
              <Plus className="h-4 w-4 mr-2" />
              {t('partnerPortal.dashboard.quickActions.createPackage')}
            </Button>
            <Button variant="outline">
              <Plus className="h-4 w-4 mr-2" />
              {t('partnerPortal.dashboard.quickActions.createCoupon')}
            </Button>
            <Button variant="outline">
              <TrendingUp className="h-4 w-4 mr-2" />
              {t('partnerPortal.dashboard.quickActions.viewAnalytics')}
            </Button>
          </div>
        </CardContent>
      </Card>

      <div className="grid gap-6 md:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Trophy className="w-5 h-5 text-orange-600" />
              {t('partnerPortal.rewards.title')}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="flex justify-between items-center">
                <span className="text-sm text-muted-foreground">
                  {t('partnerPortal.rewards.totalPoints')}
                </span>
                <span className="text-3xl font-bold text-orange-600">
                  {rewards?.points || 0}
                </span>
              </div>
              
              <div className="flex justify-between items-center">
                <span className="text-sm text-muted-foreground">
                  {t('partnerPortal.rewards.trustLevel')}
                </span>
                <Badge variant={getBadgeVariant(rewards?.trustLevel)}>
                  {rewards?.trustLevel || 'Novice'}
                </Badge>
              </div>
              
              {rewards?.badges && rewards.badges.length > 0 && (
                <div>
                  <span className="text-sm text-muted-foreground block mb-2">
                    {t('partnerPortal.rewards.badges')}
                  </span>
                  <div className="flex flex-wrap gap-2">
                    {rewards.badges.map((badge, idx) => (
                      <Badge key={idx} variant="outline">
                        {badge}
                      </Badge>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>{t('partnerPortal.rewards.recentActivity')}</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {rewardLogs?.map((log) => (
                <div key={log.id} className="flex justify-between items-center border-b pb-2 last:border-0">
                  <div>
                    <p className="text-sm font-medium">
                      {getActionLabel(log.actionType, t)}
                    </p>
                    <p className="text-xs text-muted-foreground">
                      {log.metadata?.description || ''}
                    </p>
                  </div>
                  <div className="text-right">
                    <p className="text-sm font-bold text-green-600">
                      +{log.pointsAwarded}
                    </p>
                    <p className="text-xs text-muted-foreground">
                      {new Date(log.createdAt).toLocaleDateString()}
                    </p>
                  </div>
                </div>
              ))}
              {(!rewardLogs || rewardLogs.length === 0) && (
                <p className="text-sm text-muted-foreground text-center py-4">
                  {t('partnerPortal.rewards.noActivity')}
                </p>
              )}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

function PackagesTab() {
  const { t } = useTranslation();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [searchQuery, setSearchQuery] = useState('');
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const [editingPackage, setEditingPackage] = useState<any>(null);

  const { data: packages, isLoading } = useQuery({
    queryKey: ['partner', 'packages'],
    queryFn: async () => {
      const res = await fetch('/api/packages/my', { credentials: 'include' });
      if (!res.ok) throw new Error('Failed to fetch');
      return res.json();
    },
  });

  const createMutation = useMutation({
    mutationFn: async (data: any) => {
      const res = await fetch('/api/packages/create', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
        credentials: 'include',
      });
      if (!res.ok) throw new Error('Failed to create');
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['partner', 'packages'] });
      toast({ title: t('partnerPortal.packages.success.created') });
      setIsCreateDialogOpen(false);
    },
    onError: () => {
      toast({ title: t('partnerPortal.packages.errors.createFailed'), variant: 'destructive' });
    },
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: number) => {
      const res = await fetch(`/api/packages/${id}`, {
        method: 'DELETE',
        credentials: 'include',
      });
      if (!res.ok) throw new Error('Failed to delete');
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['partner', 'packages'] });
      toast({ title: t('partnerPortal.packages.success.deleted') });
    },
    onError: () => {
      toast({ title: t('partnerPortal.packages.errors.deleteFailed'), variant: 'destructive' });
    },
  });

  const filteredPackages = packages?.filter((pkg: any) =>
    pkg.title?.toLowerCase().includes(searchQuery.toLowerCase())
  ) || [];

  if (isLoading) {
    return <Skeleton className="h-96" />;
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-bold">{t('partnerPortal.packages.title')}</h2>
        <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
          <DialogTrigger asChild>
            <Button>
              <Plus className="h-4 w-4 mr-2" />
              {t('partnerPortal.packages.createNew')}
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>{t('partnerPortal.packages.createNew')}</DialogTitle>
            </DialogHeader>
            <PackageForm
              onSubmit={(data) => createMutation.mutate(data)}
              isLoading={createMutation.isPending}
            />
          </DialogContent>
        </Dialog>
      </div>

      <div className="flex items-center gap-4">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder={t('partnerPortal.packages.search')}
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-10"
          />
        </div>
      </div>

      {filteredPackages.length === 0 ? (
        <Card>
          <CardContent className="py-12 text-center">
            <Package className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
            <h3 className="text-lg font-semibold mb-2">{t('partnerPortal.packages.noPackages')}</h3>
            <p className="text-muted-foreground">{t('partnerPortal.packages.noPackagesDesc')}</p>
          </CardContent>
        </Card>
      ) : (
        <Card>
          <CardContent className="p-0">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>{t('partnerPortal.packages.table.title')}</TableHead>
                  <TableHead>{t('partnerPortal.packages.table.pricing')}</TableHead>
                  <TableHead>{t('partnerPortal.packages.table.discount')}</TableHead>
                  <TableHead>{t('partnerPortal.packages.table.bookings')}</TableHead>
                  <TableHead>{t('partnerPortal.packages.table.status')}</TableHead>
                  <TableHead>{t('partnerPortal.packages.table.actions')}</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredPackages.map((pkg: any) => (
                  <TableRow key={pkg.id}>
                    <TableCell className="font-medium">{pkg.title}</TableCell>
                    <TableCell>${pkg.pricing || '0.00'}</TableCell>
                    <TableCell>{pkg.discount || 0}%</TableCell>
                    <TableCell>{pkg.bookings || 0}</TableCell>
                    <TableCell>
                      <Badge variant={pkg.status === 'active' ? 'default' : 'secondary'}>
                        {pkg.status || 'inactive'}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <div className="flex gap-2">
                        <Button variant="ghost" size="sm">
                          <Edit className="h-4 w-4" />
                        </Button>
                        <AlertDialog>
                          <AlertDialogTrigger asChild>
                            <Button variant="ghost" size="sm">
                              <Trash2 className="h-4 w-4 text-destructive" />
                            </Button>
                          </AlertDialogTrigger>
                          <AlertDialogContent>
                            <AlertDialogHeader>
                              <AlertDialogTitle>{t('partnerPortal.packages.delete.title')}</AlertDialogTitle>
                              <AlertDialogDescription>
                                {t('partnerPortal.packages.delete.message')}
                              </AlertDialogDescription>
                            </AlertDialogHeader>
                            <AlertDialogFooter>
                              <AlertDialogCancel>{t('partnerPortal.packages.delete.cancel')}</AlertDialogCancel>
                              <AlertDialogAction onClick={() => deleteMutation.mutate(pkg.id)}>
                                {t('partnerPortal.packages.delete.confirm')}
                              </AlertDialogAction>
                            </AlertDialogFooter>
                          </AlertDialogContent>
                        </AlertDialog>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      )}
    </div>
  );
}

function PackageForm({ onSubmit, isLoading, initialData }: { onSubmit: (data: any) => void; isLoading: boolean; initialData?: any }) {
  const { t } = useTranslation();
  const [formData, setFormData] = useState(initialData || {
    title: '',
    description: '',
    pricing: '',
    discountType: 'percentage',
    discountValue: '',
    cancellationPolicy: '',
    maxParticipants: '',
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSubmit(formData);
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div>
        <Label htmlFor="title">{t('partnerPortal.packages.form.title')}</Label>
        <Input
          id="title"
          value={formData.title}
          onChange={(e) => setFormData({ ...formData, title: e.target.value })}
          placeholder={t('partnerPortal.packages.form.titlePlaceholder')}
          required
        />
      </div>
      <div>
        <Label htmlFor="description">{t('partnerPortal.packages.form.description')}</Label>
        <Textarea
          id="description"
          value={formData.description}
          onChange={(e) => setFormData({ ...formData, description: e.target.value })}
          placeholder={t('partnerPortal.packages.form.descriptionPlaceholder')}
          rows={3}
        />
      </div>
      <div className="grid grid-cols-2 gap-4">
        <div>
          <Label htmlFor="pricing">{t('partnerPortal.packages.form.pricing')}</Label>
          <Input
            id="pricing"
            type="number"
            value={formData.pricing}
            onChange={(e) => setFormData({ ...formData, pricing: e.target.value })}
            placeholder="0.00"
          />
        </div>
        <div>
          <Label htmlFor="maxParticipants">{t('partnerPortal.packages.form.maxParticipants')}</Label>
          <Input
            id="maxParticipants"
            type="number"
            value={formData.maxParticipants}
            onChange={(e) => setFormData({ ...formData, maxParticipants: e.target.value })}
            placeholder="10"
          />
        </div>
      </div>
      <div className="grid grid-cols-2 gap-4">
        <div>
          <Label htmlFor="discountType">{t('partnerPortal.packages.form.discountType')}</Label>
          <Select value={formData.discountType} onValueChange={(value) => setFormData({ ...formData, discountType: value })}>
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="percentage">{t('partnerPortal.packages.form.percentage')}</SelectItem>
              <SelectItem value="earlyBird">{t('partnerPortal.packages.form.earlyBird')}</SelectItem>
              <SelectItem value="group">{t('partnerPortal.packages.form.group')}</SelectItem>
            </SelectContent>
          </Select>
        </div>
        <div>
          <Label htmlFor="discountValue">{t('partnerPortal.packages.form.discountValue')}</Label>
          <Input
            id="discountValue"
            type="number"
            value={formData.discountValue}
            onChange={(e) => setFormData({ ...formData, discountValue: e.target.value })}
            placeholder="10"
          />
        </div>
      </div>
      <div>
        <Label htmlFor="cancellationPolicy">{t('partnerPortal.packages.form.cancellationPolicy')}</Label>
        <Textarea
          id="cancellationPolicy"
          value={formData.cancellationPolicy}
          onChange={(e) => setFormData({ ...formData, cancellationPolicy: e.target.value })}
          placeholder={t('partnerPortal.packages.form.cancellationPlaceholder')}
          rows={2}
        />
      </div>
      <DialogFooter>
        <Button type="submit" disabled={isLoading}>
          {isLoading ? t('partnerPortal.packages.form.creating') : t('partnerPortal.packages.form.create')}
        </Button>
      </DialogFooter>
    </form>
  );
}

function CouponsTab() {
  const { t } = useTranslation();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [searchQuery, setSearchQuery] = useState('');
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);

  const { data: coupons, isLoading } = useQuery({
    queryKey: ['partner', 'coupons'],
    queryFn: async () => {
      const res = await fetch('/api/coupons/my', { credentials: 'include' });
      if (!res.ok) throw new Error('Failed to fetch');
      return res.json();
    },
  });

  const createMutation = useMutation({
    mutationFn: async (data: any) => {
      const res = await fetch('/api/coupons/create', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
        credentials: 'include',
      });
      if (!res.ok) throw new Error('Failed to create');
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['partner', 'coupons'] });
      toast({ title: t('partnerPortal.coupons.success.created') });
      setIsCreateDialogOpen(false);
    },
    onError: () => {
      toast({ title: t('partnerPortal.coupons.errors.createFailed'), variant: 'destructive' });
    },
  });

  const deactivateMutation = useMutation({
    mutationFn: async (id: number) => {
      const res = await fetch(`/api/coupons/${id}/deactivate`, {
        method: 'POST',
        credentials: 'include',
      });
      if (!res.ok) throw new Error('Failed to deactivate');
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['partner', 'coupons'] });
      toast({ title: t('partnerPortal.coupons.success.deactivated') });
    },
    onError: () => {
      toast({ title: t('partnerPortal.coupons.errors.deactivateFailed'), variant: 'destructive' });
    },
  });

  const filteredCoupons = coupons?.filter((coupon: any) =>
    coupon.code?.toLowerCase().includes(searchQuery.toLowerCase())
  ) || [];

  if (isLoading) {
    return <Skeleton className="h-96" />;
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-bold">{t('partnerPortal.coupons.title')}</h2>
        <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
          <DialogTrigger asChild>
            <Button>
              <Plus className="h-4 w-4 mr-2" />
              {t('partnerPortal.coupons.createNew')}
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>{t('partnerPortal.coupons.createNew')}</DialogTitle>
            </DialogHeader>
            <CouponForm
              onSubmit={(data) => createMutation.mutate(data)}
              isLoading={createMutation.isPending}
            />
          </DialogContent>
        </Dialog>
      </div>

      <div className="flex items-center gap-4">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder={t('partnerPortal.coupons.search')}
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-10"
          />
        </div>
      </div>

      {filteredCoupons.length === 0 ? (
        <Card>
          <CardContent className="py-12 text-center">
            <Ticket className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
            <h3 className="text-lg font-semibold mb-2">{t('partnerPortal.coupons.noCoupons')}</h3>
            <p className="text-muted-foreground">{t('partnerPortal.coupons.noCouponsDesc')}</p>
          </CardContent>
        </Card>
      ) : (
        <Card>
          <CardContent className="p-0">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>{t('partnerPortal.coupons.table.code')}</TableHead>
                  <TableHead>{t('partnerPortal.coupons.table.type')}</TableHead>
                  <TableHead>{t('partnerPortal.coupons.table.value')}</TableHead>
                  <TableHead>{t('partnerPortal.coupons.table.validFrom')}</TableHead>
                  <TableHead>{t('partnerPortal.coupons.table.validTo')}</TableHead>
                  <TableHead>{t('partnerPortal.coupons.table.used')}</TableHead>
                  <TableHead>{t('partnerPortal.coupons.table.status')}</TableHead>
                  <TableHead>{t('partnerPortal.coupons.table.actions')}</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredCoupons.map((coupon: any) => (
                  <TableRow key={coupon.id}>
                    <TableCell className="font-mono font-bold">{coupon.code}</TableCell>
                    <TableCell>{coupon.type}</TableCell>
                    <TableCell>{coupon.type === 'percentage' ? `${coupon.value}%` : `$${coupon.value}`}</TableCell>
                    <TableCell>{coupon.validFrom ? format(new Date(coupon.validFrom), 'MMM dd, yyyy') : 'N/A'}</TableCell>
                    <TableCell>{coupon.validTo ? format(new Date(coupon.validTo), 'MMM dd, yyyy') : 'N/A'}</TableCell>
                    <TableCell>{coupon.used || 0} / {coupon.limit || '∞'}</TableCell>
                    <TableCell>
                      <Badge variant={coupon.status === 'active' ? 'default' : 'secondary'}>
                        {coupon.status}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <AlertDialog>
                        <AlertDialogTrigger asChild>
                          <Button variant="ghost" size="sm" disabled={coupon.status !== 'active'}>
                            <XCircle className="h-4 w-4" />
                          </Button>
                        </AlertDialogTrigger>
                        <AlertDialogContent>
                          <AlertDialogHeader>
                            <AlertDialogTitle>{t('partnerPortal.coupons.deactivate.title')}</AlertDialogTitle>
                            <AlertDialogDescription>
                              {t('partnerPortal.coupons.deactivate.message')}
                            </AlertDialogDescription>
                          </AlertDialogHeader>
                          <AlertDialogFooter>
                            <AlertDialogCancel>{t('partnerPortal.coupons.deactivate.cancel')}</AlertDialogCancel>
                            <AlertDialogAction onClick={() => deactivateMutation.mutate(coupon.id)}>
                              {t('partnerPortal.coupons.deactivate.confirm')}
                            </AlertDialogAction>
                          </AlertDialogFooter>
                        </AlertDialogContent>
                      </AlertDialog>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      )}
    </div>
  );
}

function CouponForm({ onSubmit, isLoading }: { onSubmit: (data: any) => void; isLoading: boolean }) {
  const { t } = useTranslation();
  const [formData, setFormData] = useState({
    code: '',
    type: 'percentage',
    value: '',
    validFrom: '',
    validTo: '',
    usageLimit: '',
    minOrderAmount: '',
  });

  const generateCode = () => {
    const code = 'COUPON' + Math.random().toString(36).substring(2, 8).toUpperCase();
    setFormData({ ...formData, code });
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSubmit(formData);
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div>
        <Label htmlFor="code">{t('partnerPortal.coupons.form.code')}</Label>
        <div className="flex gap-2">
          <Input
            id="code"
            value={formData.code}
            onChange={(e) => setFormData({ ...formData, code: e.target.value.toUpperCase() })}
            placeholder={t('partnerPortal.coupons.form.codePlaceholder')}
            required
          />
          <Button type="button" variant="outline" onClick={generateCode}>
            {t('partnerPortal.coupons.form.generate')}
          </Button>
        </div>
      </div>
      <div className="grid grid-cols-2 gap-4">
        <div>
          <Label htmlFor="type">{t('partnerPortal.coupons.form.type')}</Label>
          <Select value={formData.type} onValueChange={(value) => setFormData({ ...formData, type: value })}>
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="percentage">{t('partnerPortal.coupons.form.percentage')}</SelectItem>
              <SelectItem value="fixed">{t('partnerPortal.coupons.form.fixed')}</SelectItem>
            </SelectContent>
          </Select>
        </div>
        <div>
          <Label htmlFor="value">{t('partnerPortal.coupons.form.value')}</Label>
          <Input
            id="value"
            type="number"
            value={formData.value}
            onChange={(e) => setFormData({ ...formData, value: e.target.value })}
            placeholder={t('partnerPortal.coupons.form.valuePlaceholder')}
            required
          />
        </div>
      </div>
      <div className="grid grid-cols-2 gap-4">
        <div>
          <Label htmlFor="validFrom">{t('partnerPortal.coupons.form.validFrom')}</Label>
          <Input
            id="validFrom"
            type="date"
            value={formData.validFrom}
            onChange={(e) => setFormData({ ...formData, validFrom: e.target.value })}
          />
        </div>
        <div>
          <Label htmlFor="validTo">{t('partnerPortal.coupons.form.validTo')}</Label>
          <Input
            id="validTo"
            type="date"
            value={formData.validTo}
            onChange={(e) => setFormData({ ...formData, validTo: e.target.value })}
          />
        </div>
      </div>
      <div className="grid grid-cols-2 gap-4">
        <div>
          <Label htmlFor="usageLimit">{t('partnerPortal.coupons.form.usageLimit')}</Label>
          <Input
            id="usageLimit"
            type="number"
            value={formData.usageLimit}
            onChange={(e) => setFormData({ ...formData, usageLimit: e.target.value })}
            placeholder={t('partnerPortal.coupons.form.usageLimitPlaceholder')}
          />
        </div>
        <div>
          <Label htmlFor="minOrderAmount">{t('partnerPortal.coupons.form.minOrderAmount')}</Label>
          <Input
            id="minOrderAmount"
            type="number"
            value={formData.minOrderAmount}
            onChange={(e) => setFormData({ ...formData, minOrderAmount: e.target.value })}
            placeholder={t('partnerPortal.coupons.form.minOrderPlaceholder')}
          />
        </div>
      </div>
      <DialogFooter>
        <Button type="submit" disabled={isLoading}>
          {isLoading ? t('partnerPortal.coupons.form.creating') : t('partnerPortal.coupons.form.create')}
        </Button>
      </DialogFooter>
    </form>
  );
}

function AffiliatesTab() {
  const { t } = useTranslation();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);

  const { data: affiliates, isLoading } = useQuery({
    queryKey: ['partner', 'affiliates'],
    queryFn: async () => {
      const res = await fetch('/api/affiliates/partner/my', { credentials: 'include' });
      if (!res.ok) throw new Error('Failed to fetch');
      return res.json();
    },
  });

  const createMutation = useMutation({
    mutationFn: async (data: any) => {
      const res = await fetch('/api/affiliates/create', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
        credentials: 'include',
      });
      if (!res.ok) throw new Error('Failed to create');
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['partner', 'affiliates'] });
      toast({ title: t('partnerPortal.affiliates.success.created') });
      setIsCreateDialogOpen(false);
    },
    onError: () => {
      toast({ title: t('partnerPortal.affiliates.errors.createFailed'), variant: 'destructive' });
    },
  });

  if (isLoading) {
    return <Skeleton className="h-96" />;
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-bold">{t('partnerPortal.affiliates.title')}</h2>
        <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
          <DialogTrigger asChild>
            <Button>
              <Plus className="h-4 w-4 mr-2" />
              {t('partnerPortal.affiliates.createNew')}
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>{t('partnerPortal.affiliates.createNew')}</DialogTitle>
            </DialogHeader>
            <AffiliateForm
              onSubmit={(data) => createMutation.mutate(data)}
              isLoading={createMutation.isPending}
            />
          </DialogContent>
        </Dialog>
      </div>

      {!affiliates || affiliates.length === 0 ? (
        <Card>
          <CardContent className="py-12 text-center">
            <Users className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
            <h3 className="text-lg font-semibold mb-2">{t('partnerPortal.affiliates.noAffiliates')}</h3>
            <p className="text-muted-foreground">{t('partnerPortal.affiliates.noAffiliatesDesc')}</p>
          </CardContent>
        </Card>
      ) : (
        <Card>
          <CardContent className="p-0">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>{t('partnerPortal.affiliates.table.code')}</TableHead>
                  <TableHead>{t('partnerPortal.affiliates.table.commission')}</TableHead>
                  <TableHead>{t('partnerPortal.affiliates.table.clicks')}</TableHead>
                  <TableHead>{t('partnerPortal.affiliates.table.conversions')}</TableHead>
                  <TableHead>{t('partnerPortal.affiliates.table.revenue')}</TableHead>
                  <TableHead>{t('partnerPortal.affiliates.table.status')}</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {affiliates.map((affiliate: any) => (
                  <TableRow key={affiliate.id}>
                    <TableCell className="font-mono font-bold">{affiliate.code}</TableCell>
                    <TableCell>{affiliate.commission}%</TableCell>
                    <TableCell>{affiliate.clicks || 0}</TableCell>
                    <TableCell>{affiliate.conversions || 0}</TableCell>
                    <TableCell>${affiliate.revenue?.toFixed(2) || '0.00'}</TableCell>
                    <TableCell>
                      <Badge variant={affiliate.status === 'active' ? 'default' : 'secondary'}>
                        {affiliate.status}
                      </Badge>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      )}
    </div>
  );
}

function AffiliateForm({ onSubmit, isLoading }: { onSubmit: (data: any) => void; isLoading: boolean }) {
  const { t } = useTranslation();
  const [formData, setFormData] = useState({
    code: '',
    commission: '',
    targetUrl: '',
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSubmit(formData);
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div>
        <Label htmlFor="code">{t('partnerPortal.affiliates.form.code')}</Label>
        <Input
          id="code"
          value={formData.code}
          onChange={(e) => setFormData({ ...formData, code: e.target.value.toUpperCase() })}
          placeholder={t('partnerPortal.affiliates.form.codePlaceholder')}
          required
        />
      </div>
      <div>
        <Label htmlFor="commission">{t('partnerPortal.affiliates.form.commission')}</Label>
        <Input
          id="commission"
          type="number"
          value={formData.commission}
          onChange={(e) => setFormData({ ...formData, commission: e.target.value })}
          placeholder={t('partnerPortal.affiliates.form.commissionPlaceholder')}
          required
        />
      </div>
      <div>
        <Label htmlFor="targetUrl">{t('partnerPortal.affiliates.form.targetUrl')}</Label>
        <Input
          id="targetUrl"
          type="url"
          value={formData.targetUrl}
          onChange={(e) => setFormData({ ...formData, targetUrl: e.target.value })}
          placeholder={t('partnerPortal.affiliates.form.targetUrlPlaceholder')}
          required
        />
      </div>
      <DialogFooter>
        <Button type="submit" disabled={isLoading}>
          {isLoading ? t('partnerPortal.affiliates.form.creating') : t('partnerPortal.affiliates.form.create')}
        </Button>
      </DialogFooter>
    </form>
  );
}

function AnalyticsTab() {
  const { t } = useTranslation();
  const [timePeriod, setTimePeriod] = useState('last30Days');

  const { data: analytics, isLoading } = useQuery({
    queryKey: ['partner', 'analytics', timePeriod],
    queryFn: async () => {
      const res = await fetch(`/api/partners/analytics/dashboard?period=${timePeriod}`, { credentials: 'include' });
      if (!res.ok) throw new Error('Failed to fetch');
      return res.json();
    },
  });

  const handleExport = async (format: string) => {
    try {
      const res = await fetch(`/api/partners/analytics/export?format=${format}`, { credentials: 'include' });
      if (!res.ok) throw new Error('Failed to export');
      const blob = await res.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `analytics-${new Date().toISOString()}.${format}`;
      a.click();
    } catch (error) {
      console.error('Export failed:', error);
    }
  };

  if (isLoading) {
    return <Skeleton className="h-96" />;
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-2xl font-bold">{t('partnerPortal.analytics.title')}</h2>
          <p className="text-muted-foreground">{t('partnerPortal.analytics.subtitle')}</p>
        </div>
        <div className="flex gap-2">
          <Select value={timePeriod} onValueChange={setTimePeriod}>
            <SelectTrigger className="w-40">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="last7Days">{t('partnerPortal.analytics.last7Days')}</SelectItem>
              <SelectItem value="last30Days">{t('partnerPortal.analytics.last30Days')}</SelectItem>
              <SelectItem value="last90Days">{t('partnerPortal.analytics.last90Days')}</SelectItem>
              <SelectItem value="thisYear">{t('partnerPortal.analytics.thisYear')}</SelectItem>
            </SelectContent>
          </Select>
          <Button variant="outline" onClick={() => handleExport('csv')}>
            <Download className="h-4 w-4 mr-2" />
            {t('partnerPortal.analytics.exportCSV')}
          </Button>
        </div>
      </div>

      <div className="grid gap-6 md:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>{t('partnerPortal.analytics.topPerforming.title')}</CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <RechartsBar data={analytics?.topProducts || []}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="name" />
                <YAxis />
                <Tooltip />
                <Legend />
                <Bar dataKey="revenue" fill="#FF6600" />
              </RechartsBar>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>{t('partnerPortal.analytics.breakdown.title')}</CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <RechartsPie>
                <Pie
                  data={analytics?.breakdown || []}
                  cx="50%"
                  cy="50%"
                  labelLine={false}
                  label={(entry) => entry.name}
                  outerRadius={80}
                  fill="#8884d8"
                  dataKey="value"
                >
                  {(analytics?.breakdown || []).map((entry: any, index: number) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip />
              </RechartsPie>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>{t('partnerPortal.analytics.trends.title')}</CardTitle>
        </CardHeader>
        <CardContent>
          <ResponsiveContainer width="100%" height={400}>
            <RechartsLine data={analytics?.trends || []}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="month" />
              <YAxis />
              <Tooltip />
              <Legend />
              <Line type="monotone" dataKey="bookings" stroke="#FF6600" strokeWidth={2} />
              <Line type="monotone" dataKey="revenue" stroke="#82ca9d" strokeWidth={2} />
            </RechartsLine>
          </ResponsiveContainer>
        </CardContent>
      </Card>
    </div>
  );
}

function PayoutsTab() {
  const { t } = useTranslation();

  const { data: payouts, isLoading } = useQuery({
    queryKey: ['partner', 'payouts'],
    queryFn: async () => {
      const res = await fetch('/api/billing/payouts', { credentials: 'include' });
      if (!res.ok) throw new Error('Failed to fetch');
      return res.json();
    },
  });

  const { data: stripeStatus } = useQuery({
    queryKey: ['partner', 'stripe', 'status'],
    queryFn: async () => {
      const res = await fetch('/api/billing/connect/status', { credentials: 'include' });
      if (!res.ok) throw new Error('Failed to fetch');
      return res.json();
    },
  });

  if (isLoading) {
    return <Skeleton className="h-96" />;
  }

  return (
    <div className="space-y-6">
      <h2 className="text-2xl font-bold">{t('partnerPortal.payouts.title')}</h2>

      <div className="grid gap-6 md:grid-cols-3">
        <Card>
          <CardHeader>
            <CardTitle>{t('partnerPortal.payouts.currentBalance')}</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold">${payouts?.balance?.toFixed(2) || '0.00'}</div>
            <p className="text-sm text-muted-foreground">{t('partnerPortal.payouts.pendingPayout')}</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>{t('partnerPortal.payouts.revenue.title')}</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            <div className="flex justify-between">
              <span className="text-sm">{t('partnerPortal.payouts.revenue.gross')}</span>
              <span className="font-semibold">${payouts?.revenue?.gross?.toFixed(2) || '0.00'}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-sm">{t('partnerPortal.payouts.revenue.fees')}</span>
              <span className="font-semibold text-red-600">-${payouts?.revenue?.fees?.toFixed(2) || '0.00'}</span>
            </div>
            <div className="flex justify-between pt-2 border-t">
              <span className="text-sm font-bold">{t('partnerPortal.payouts.revenue.net')}</span>
              <span className="font-bold">${payouts?.revenue?.net?.toFixed(2) || '0.00'}</span>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>{t('partnerPortal.payouts.stripeStatus.title')}</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              <div className="flex justify-between">
                <span className="text-sm">{t('partnerPortal.payouts.stripeStatus.connected')}</span>
                {stripeStatus?.connected ? (
                  <CheckCircle className="h-5 w-5 text-green-600" />
                ) : (
                  <XCircle className="h-5 w-5 text-red-600" />
                )}
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>{t('partnerPortal.payouts.history.title')}</CardTitle>
        </CardHeader>
        <CardContent>
          {!payouts?.history || payouts.history.length === 0 ? (
            <p className="text-muted-foreground text-center py-8">{t('partnerPortal.payouts.history.noPayouts')}</p>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>{t('partnerPortal.payouts.history.date')}</TableHead>
                  <TableHead>{t('partnerPortal.payouts.history.amount')}</TableHead>
                  <TableHead>{t('partnerPortal.payouts.history.status')}</TableHead>
                  <TableHead>{t('partnerPortal.payouts.history.period')}</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {payouts.history.map((payout: any) => (
                  <TableRow key={payout.id}>
                    <TableCell>{payout.date ? format(new Date(payout.date), 'MMM dd, yyyy') : 'N/A'}</TableCell>
                    <TableCell className="font-semibold">${payout.amount?.toFixed(2) || '0.00'}</TableCell>
                    <TableCell>
                      <Badge variant={payout.status === 'paid' ? 'default' : 'secondary'}>
                        {payout.status}
                      </Badge>
                    </TableCell>
                    <TableCell>{payout.period || 'N/A'}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

function BillingTab() {
  const { t } = useTranslation();
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const { data: stripeStatus, isLoading } = useQuery({
    queryKey: ['partner', 'stripe', 'status'],
    queryFn: async () => {
      const res = await fetch('/api/billing/connect/status', { credentials: 'include' });
      if (!res.ok) throw new Error('Failed to fetch');
      return res.json();
    },
  });

  const onboardMutation = useMutation({
    mutationFn: async () => {
      const res = await fetch('/api/billing/connect/onboard', {
        method: 'POST',
        credentials: 'include',
      });
      if (!res.ok) throw new Error('Failed to start onboarding');
      return res.json();
    },
    onSuccess: (data) => {
      if (data.url) {
        window.location.href = data.url;
      }
    },
    onError: () => {
      toast({ title: t('partnerPortal.billing.errors.onboardFailed'), variant: 'destructive' });
    },
  });

  const refreshStatus = () => {
    queryClient.invalidateQueries({ queryKey: ['partner', 'stripe', 'status'] });
    toast({ title: 'Status refreshed' });
  };

  if (isLoading) {
    return <Skeleton className="h-96" />;
  }

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold">{t('partnerPortal.billing.title')}</h2>
        <p className="text-muted-foreground">{t('partnerPortal.billing.subtitle')}</p>
      </div>

      {!stripeStatus?.connected ? (
        <Card>
          <CardHeader>
            <CardTitle>{t('partnerPortal.billing.onboarding.title')}</CardTitle>
            <CardDescription>{t('partnerPortal.billing.onboarding.description')}</CardDescription>
          </CardHeader>
          <CardContent>
            <Button onClick={() => onboardMutation.mutate()} disabled={onboardMutation.isPending}>
              <ExternalLink className="h-4 w-4 mr-2" />
              {onboardMutation.isPending ? t('partnerPortal.billing.onboarding.processing') : t('partnerPortal.billing.onboarding.startSetup')}
            </Button>
          </CardContent>
        </Card>
      ) : (
        <Card>
          <CardHeader>
            <div className="flex justify-between items-center">
              <div>
                <CardTitle>{t('partnerPortal.billing.connected.title')}</CardTitle>
                <CardDescription>{t('partnerPortal.billing.connected.description')}</CardDescription>
              </div>
              <Button variant="outline" size="sm" onClick={refreshStatus}>
                <RefreshCw className="h-4 w-4 mr-2" />
                {t('partnerPortal.billing.refreshStatus')}
              </Button>
            </div>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <div className="flex justify-between items-center">
                <span>{t('partnerPortal.billing.status.connected')}</span>
                {stripeStatus.connected ? (
                  <Badge variant="default"><CheckCircle className="h-3 w-3 mr-1" />{t('partnerPortal.billing.status.yes')}</Badge>
                ) : (
                  <Badge variant="secondary"><XCircle className="h-3 w-3 mr-1" />{t('partnerPortal.billing.status.no')}</Badge>
                )}
              </div>
              <div className="flex justify-between items-center">
                <span>{t('partnerPortal.billing.status.onboardingComplete')}</span>
                {stripeStatus.onboardingComplete ? (
                  <Badge variant="default"><CheckCircle className="h-3 w-3 mr-1" />{t('partnerPortal.billing.status.yes')}</Badge>
                ) : (
                  <Badge variant="secondary"><XCircle className="h-3 w-3 mr-1" />{t('partnerPortal.billing.status.no')}</Badge>
                )}
              </div>
              <div className="flex justify-between items-center">
                <span>{t('partnerPortal.billing.status.chargesEnabled')}</span>
                {stripeStatus.chargesEnabled ? (
                  <Badge variant="default"><CheckCircle className="h-3 w-3 mr-1" />{t('partnerPortal.billing.status.yes')}</Badge>
                ) : (
                  <Badge variant="secondary"><XCircle className="h-3 w-3 mr-1" />{t('partnerPortal.billing.status.no')}</Badge>
                )}
              </div>
            </div>
            {stripeStatus.accountId && (
              <div className="pt-4 border-t">
                <p className="text-sm text-muted-foreground">{t('partnerPortal.billing.connected.accountId')}</p>
                <p className="font-mono text-sm">{stripeStatus.accountId}</p>
              </div>
            )}
          </CardContent>
        </Card>
      )}
    </div>
  );
}

function ConnectorsTab() {
  const { t } = useTranslation();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);

  const { data: connectors, isLoading } = useQuery({
    queryKey: ['partner', 'connectors'],
    queryFn: async () => {
      const res = await fetch('/api/connectors/my', { credentials: 'include' });
      if (!res.ok) throw new Error('Failed to fetch');
      return res.json();
    },
  });

  const createMutation = useMutation({
    mutationFn: async (data: any) => {
      const res = await fetch('/api/connectors/ota/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
        credentials: 'include',
      });
      if (!res.ok) throw new Error('Failed to create');
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['partner', 'connectors'] });
      toast({ title: t('partnerPortal.connectors.success.created') });
      setIsCreateDialogOpen(false);
    },
    onError: () => {
      toast({ title: t('partnerPortal.connectors.errors.createFailed'), variant: 'destructive' });
    },
  });

  const syncMutation = useMutation({
    mutationFn: async (id: number) => {
      const res = await fetch(`/api/connectors/ota/push-availability`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ connectorId: id }),
        credentials: 'include',
      });
      if (!res.ok) throw new Error('Failed to sync');
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['partner', 'connectors'] });
      toast({ title: t('partnerPortal.connectors.success.synced') });
    },
    onError: () => {
      toast({ title: t('partnerPortal.connectors.errors.syncFailed'), variant: 'destructive' });
    },
  });

  if (isLoading) {
    return <Skeleton className="h-96" />;
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-2xl font-bold">{t('partnerPortal.connectors.title')}</h2>
          <p className="text-muted-foreground">{t('partnerPortal.connectors.subtitle')}</p>
        </div>
        <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
          <DialogTrigger asChild>
            <Button>
              <Plus className="h-4 w-4 mr-2" />
              {t('partnerPortal.connectors.createNew')}
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>{t('partnerPortal.connectors.createNew')}</DialogTitle>
            </DialogHeader>
            <ConnectorForm
              onSubmit={(data) => createMutation.mutate(data)}
              isLoading={createMutation.isPending}
            />
          </DialogContent>
        </Dialog>
      </div>

      {!connectors || connectors.length === 0 ? (
        <Card>
          <CardContent className="py-12 text-center">
            <Link2 className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
            <h3 className="text-lg font-semibold mb-2">{t('partnerPortal.connectors.noConnectors')}</h3>
            <p className="text-muted-foreground">{t('partnerPortal.connectors.noConnectorsDesc')}</p>
          </CardContent>
        </Card>
      ) : (
        <Card>
          <CardContent className="p-0">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>{t('partnerPortal.connectors.table.name')}</TableHead>
                  <TableHead>{t('partnerPortal.connectors.table.type')}</TableHead>
                  <TableHead>{t('partnerPortal.connectors.table.status')}</TableHead>
                  <TableHead>{t('partnerPortal.connectors.table.lastSync')}</TableHead>
                  <TableHead>{t('partnerPortal.connectors.table.actions')}</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {connectors.map((connector: any) => (
                  <TableRow key={connector.id}>
                    <TableCell className="font-medium">{connector.name}</TableCell>
                    <TableCell><Badge variant="outline">{connector.type}</Badge></TableCell>
                    <TableCell>
                      <Badge variant={connector.status === 'active' ? 'default' : 'secondary'}>
                        {connector.status}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      {connector.lastSync ? format(new Date(connector.lastSync), 'MMM dd, yyyy HH:mm') : 'Never'}
                    </TableCell>
                    <TableCell>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => syncMutation.mutate(connector.id)}
                        disabled={syncMutation.isPending}
                      >
                        <RefreshCw className={`h-4 w-4 ${syncMutation.isPending ? 'animate-spin' : ''}`} />
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      )}
    </div>
  );
}

function ConnectorForm({ onSubmit, isLoading }: { onSubmit: (data: any) => void; isLoading: boolean }) {
  const { t } = useTranslation();
  const [formData, setFormData] = useState({
    name: '',
    type: 'ota',
    apiKey: '',
    credentials: '',
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSubmit(formData);
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div>
        <Label htmlFor="name">{t('partnerPortal.connectors.form.name')}</Label>
        <Input
          id="name"
          value={formData.name}
          onChange={(e) => setFormData({ ...formData, name: e.target.value })}
          placeholder={t('partnerPortal.connectors.form.namePlaceholder')}
          required
        />
      </div>
      <div>
        <Label htmlFor="type">{t('partnerPortal.connectors.form.type')}</Label>
        <Select value={formData.type} onValueChange={(value) => setFormData({ ...formData, type: value })}>
          <SelectTrigger>
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="ota">{t('partnerPortal.connectors.form.ota')}</SelectItem>
            <SelectItem value="dmo">{t('partnerPortal.connectors.form.dmo')}</SelectItem>
            <SelectItem value="custom">{t('partnerPortal.connectors.form.custom')}</SelectItem>
          </SelectContent>
        </Select>
      </div>
      <div>
        <Label htmlFor="apiKey">{t('partnerPortal.connectors.form.apiKey')}</Label>
        <Input
          id="apiKey"
          type="password"
          value={formData.apiKey}
          onChange={(e) => setFormData({ ...formData, apiKey: e.target.value })}
          placeholder={t('partnerPortal.connectors.form.apiKeyPlaceholder')}
          required
        />
      </div>
      <DialogFooter>
        <Button type="submit" disabled={isLoading}>
          {isLoading ? t('partnerPortal.connectors.form.creating') : t('partnerPortal.connectors.form.create')}
        </Button>
      </DialogFooter>
    </form>
  );
}

function ProfileTab() {
  const { t } = useTranslation();
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const { data: profile, isLoading } = useQuery({
    queryKey: ['partner', 'profile'],
    queryFn: async () => {
      const res = await fetch('/api/partners/me', { credentials: 'include' });
      if (!res.ok) throw new Error('Failed to fetch');
      return res.json();
    },
  });

  const updateMutation = useMutation({
    mutationFn: async (data: any) => {
      const res = await fetch('/api/partners/me', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
        credentials: 'include',
      });
      if (!res.ok) throw new Error('Failed to update');
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['partner', 'profile'] });
      toast({ title: t('partnerPortal.profile.success.updated') });
    },
    onError: () => {
      toast({ title: t('partnerPortal.profile.errors.updateFailed'), variant: 'destructive' });
    },
  });

  const [formData, setFormData] = useState({
    businessName: '',
    businessType: '',
    description: '',
    contactEmail: '',
    contactPhone: '',
    website: '',
    facebook: '',
    instagram: '',
    twitter: '',
    linkedin: '',
  });

  if (isLoading) {
    return <Skeleton className="h-96" />;
  }

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    updateMutation.mutate(formData);
  };

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold">{t('partnerPortal.profile.title')}</h2>
        <p className="text-muted-foreground">{t('partnerPortal.profile.subtitle')}</p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        <Card>
          <CardHeader>
            <CardTitle>{t('partnerPortal.profile.basicInfo.title')}</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <Label htmlFor="businessName">{t('partnerPortal.profile.basicInfo.businessName')}</Label>
              <Input
                id="businessName"
                value={formData.businessName}
                onChange={(e) => setFormData({ ...formData, businessName: e.target.value })}
                placeholder={t('partnerPortal.profile.basicInfo.businessNamePlaceholder')}
              />
            </div>
            <div>
              <Label htmlFor="businessType">{t('partnerPortal.profile.basicInfo.businessType')}</Label>
              <Select value={formData.businessType} onValueChange={(value) => setFormData({ ...formData, businessType: value })}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="tourOperator">{t('partnerPortal.profile.basicInfo.tourOperator')}</SelectItem>
                  <SelectItem value="travelAgency">{t('partnerPortal.profile.basicInfo.travelAgency')}</SelectItem>
                  <SelectItem value="hotelPartner">{t('partnerPortal.profile.basicInfo.hotelPartner')}</SelectItem>
                  <SelectItem value="activityProvider">{t('partnerPortal.profile.basicInfo.activityProvider')}</SelectItem>
                  <SelectItem value="other">{t('partnerPortal.profile.basicInfo.other')}</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label htmlFor="description">{t('partnerPortal.profile.basicInfo.description')}</Label>
              <Textarea
                id="description"
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                placeholder={t('partnerPortal.profile.basicInfo.descriptionPlaceholder')}
                rows={4}
              />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="contactEmail">{t('partnerPortal.profile.basicInfo.contactEmail')}</Label>
                <Input
                  id="contactEmail"
                  type="email"
                  value={formData.contactEmail}
                  onChange={(e) => setFormData({ ...formData, contactEmail: e.target.value })}
                />
              </div>
              <div>
                <Label htmlFor="contactPhone">{t('partnerPortal.profile.basicInfo.contactPhone')}</Label>
                <Input
                  id="contactPhone"
                  value={formData.contactPhone}
                  onChange={(e) => setFormData({ ...formData, contactPhone: e.target.value })}
                />
              </div>
            </div>
            <div>
              <Label htmlFor="website">{t('partnerPortal.profile.basicInfo.website')}</Label>
              <Input
                id="website"
                type="url"
                value={formData.website}
                onChange={(e) => setFormData({ ...formData, website: e.target.value })}
                placeholder={t('partnerPortal.profile.basicInfo.websitePlaceholder')}
              />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>{t('partnerPortal.profile.social.title')}</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="facebook">{t('partnerPortal.profile.social.facebook')}</Label>
                <Input
                  id="facebook"
                  value={formData.facebook}
                  onChange={(e) => setFormData({ ...formData, facebook: e.target.value })}
                />
              </div>
              <div>
                <Label htmlFor="instagram">{t('partnerPortal.profile.social.instagram')}</Label>
                <Input
                  id="instagram"
                  value={formData.instagram}
                  onChange={(e) => setFormData({ ...formData, instagram: e.target.value })}
                />
              </div>
              <div>
                <Label htmlFor="twitter">{t('partnerPortal.profile.social.twitter')}</Label>
                <Input
                  id="twitter"
                  value={formData.twitter}
                  onChange={(e) => setFormData({ ...formData, twitter: e.target.value })}
                />
              </div>
              <div>
                <Label htmlFor="linkedin">{t('partnerPortal.profile.social.linkedin')}</Label>
                <Input
                  id="linkedin"
                  value={formData.linkedin}
                  onChange={(e) => setFormData({ ...formData, linkedin: e.target.value })}
                />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>{t('partnerPortal.profile.verification.title')}</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center justify-between">
              <div>
                <p className="font-medium">{t('partnerPortal.profile.verification.status')}</p>
                <p className="text-sm text-muted-foreground">
                  {profile?.verified ? t('partnerPortal.profile.verification.verified') : t('partnerPortal.profile.verification.notVerified')}
                </p>
              </div>
              <Badge variant={profile?.verified ? 'default' : 'secondary'}>
                {profile?.verified ? (
                  <><CheckCircle className="h-3 w-3 mr-1" />{t('partnerPortal.profile.verification.verified')}</>
                ) : (
                  <><AlertCircle className="h-3 w-3 mr-1" />{t('partnerPortal.profile.verification.notVerified')}</>
                )}
              </Badge>
            </div>
          </CardContent>
        </Card>

        {profile?.verified && (
          <div className="bg-green-50 dark:bg-green-900/20 p-4 rounded-lg border border-green-200 dark:border-green-800">
            <div className="flex items-center gap-2 text-green-700 dark:text-green-400">
              <Award className="w-5 h-5" />
              <span className="font-medium">
                {t('partnerPortal.rewards.verifiedBoost')}
              </span>
            </div>
            <p className="text-sm text-muted-foreground mt-1">
              {t('partnerPortal.rewards.verifiedBoostDesc')}
            </p>
          </div>
        )}

        <Button type="submit" disabled={updateMutation.isPending}>
          {updateMutation.isPending ? t('partnerPortal.profile.saving') : t('partnerPortal.profile.save')}
        </Button>
      </form>
    </div>
  );
}
