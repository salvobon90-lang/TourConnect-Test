import { useState, useMemo } from 'react';
import { useQuery } from '@tanstack/react-query';
import { useAuth } from '@/hooks/useAuth';
import { useLocation } from 'wouter';
import { Helmet } from 'react-helmet-async';
import { Header } from '@/components/layout/Header';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Skeleton } from '@/components/ui/skeleton';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { RefreshCw, Eye, MousePointerClick, ShoppingCart, Euro, ArrowUpDown } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { queryClient } from '@/lib/queryClient';
import {
  ResponsiveContainer,
  LineChart,
  Line,
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  PieChart,
  Pie,
  Cell,
  BarChart,
  Bar
} from 'recharts';

// Period type
type Period = '7d' | '30d' | '90d' | 'all';

// Helper to calculate date range from period
function getDateRange(period: Period): { startDate?: string; endDate?: string } {
  const now = new Date();
  const endDate = now.toISOString();
  
  if (period === 'all') {
    return {}; // No date filter
  }
  
  const daysMap = {
    '7d': 7,
    '30d': 30,
    '90d': 90
  };
  
  const days = daysMap[period];
  const startDate = new Date(now.getTime() - days * 24 * 60 * 60 * 1000).toISOString();
  
  return { startDate, endDate };
}

// KPI Cards Grid Component
function AnalyticsKPIGrid({ analytics }: { analytics: any }) {
  const kpis = [
    {
      title: 'Visualizzazioni',
      value: analytics.views || 0,
      icon: Eye,
      color: 'text-blue-500',
      testId: 'kpi-views'
    },
    {
      title: 'Click',
      value: analytics.clicks || 0,
      icon: MousePointerClick,
      color: 'text-green-500',
      testId: 'kpi-clicks'
    },
    {
      title: 'Conversioni',
      value: analytics.conversions || 0,
      icon: ShoppingCart,
      color: 'text-purple-500',
      testId: 'kpi-conversions'
    },
    {
      title: 'Ricavi',
      value: analytics.revenue || 0,
      icon: Euro,
      color: 'text-primary',
      testId: 'kpi-revenue',
      format: (v: number) => `€${v.toFixed(2)}`
    }
  ];
  
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
      {kpis.map((kpi) => {
        const Icon = kpi.icon;
        const displayValue = kpi.format 
          ? kpi.format(kpi.value) 
          : kpi.value.toLocaleString();
        
        return (
          <Card key={kpi.testId} data-testid={kpi.testId}>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">
                {kpi.title}
              </CardTitle>
              <Icon className={`h-4 w-4 ${kpi.color}`} />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{displayValue}</div>
            </CardContent>
          </Card>
        );
      })}
    </div>
  );
}

// Time Series Charts Component
function AnalyticsTimeSeries({ analytics }: { analytics: any }) {
  // Transform timeSeriesData to array format
  const timeSeriesArray = analytics.timeSeriesData 
    ? Object.entries(analytics.timeSeriesData).map(([date, data]: [string, any]) => ({
        date,
        views: data.views || 0,
        clicks: data.clicks || 0,
        conversions: data.conversions || 0,
        revenue: data.revenue || 0
      })).sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime())
    : [];
  
  // Empty state
  if (timeSeriesArray.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Andamento nel Tempo</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-muted-foreground">Nessun dato disponibile</p>
        </CardContent>
      </Card>
    );
  }
  
  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
      {/* Views/Clicks/Conversions Line Chart */}
      <Card data-testid="chart-time-series">
        <CardHeader>
          <CardTitle>Metriche nel Tempo</CardTitle>
          <CardDescription>Visualizzazioni, Click e Conversioni</CardDescription>
        </CardHeader>
        <CardContent>
          <ResponsiveContainer width="100%" height={300}>
            <LineChart data={timeSeriesArray}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis 
                dataKey="date" 
                tickFormatter={(value) => new Date(value).toLocaleDateString('it-IT', { month: 'short', day: 'numeric' })}
              />
              <YAxis />
              <Tooltip 
                labelFormatter={(value) => new Date(value).toLocaleDateString('it-IT')}
              />
              <Legend />
              <Line type="monotone" dataKey="views" stroke="#3b82f6" name="Visualizzazioni" />
              <Line type="monotone" dataKey="clicks" stroke="#10b981" name="Click" />
              <Line type="monotone" dataKey="conversions" stroke="#8b5cf6" name="Conversioni" />
            </LineChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>
      
      {/* Revenue Area Chart */}
      <Card data-testid="chart-revenue">
        <CardHeader>
          <CardTitle>Ricavi nel Tempo</CardTitle>
          <CardDescription>Andamento dei ricavi</CardDescription>
        </CardHeader>
        <CardContent>
          <ResponsiveContainer width="100%" height={300}>
            <AreaChart data={timeSeriesArray}>
              <defs>
                <linearGradient id="colorRevenue" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#f97316" stopOpacity={0.8}/>
                  <stop offset="95%" stopColor="#f97316" stopOpacity={0}/>
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis 
                dataKey="date" 
                tickFormatter={(value) => new Date(value).toLocaleDateString('it-IT', { month: 'short', day: 'numeric' })}
              />
              <YAxis />
              <Tooltip 
                labelFormatter={(value) => new Date(value).toLocaleDateString('it-IT')}
                formatter={(value: number) => [`€${value.toFixed(2)}`, 'Ricavi']}
              />
              <Area 
                type="monotone" 
                dataKey="revenue" 
                stroke="#f97316" 
                fillOpacity={1}
                fill="url(#colorRevenue)" 
                name="Ricavi"
              />
            </AreaChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>
    </div>
  );
}

// Entity Performance Tables Component
function AnalyticsEntityTables({ analytics, userRole }: { analytics: any; userRole: string }) {
  const [, navigate] = useLocation();
  
  // Transform stats to arrays
  const tourData = analytics.tourStats 
    ? Object.entries(analytics.tourStats).map(([id, stats]: [string, any]) => ({
        id,
        name: stats.title || `Tour ${id.substring(0, 8)}`,
        views: stats.views || 0,
        clicks: stats.clicks || 0,
        conversions: stats.conversions || 0,
        revenue: stats.revenue || 0,
        ctr: stats.views > 0 ? ((stats.clicks / stats.views) * 100).toFixed(1) : '0',
        cvr: stats.clicks > 0 ? ((stats.conversions / stats.clicks) * 100).toFixed(1) : '0'
      }))
    : [];
  
  const serviceData = analytics.serviceStats 
    ? Object.entries(analytics.serviceStats).map(([id, stats]: [string, any]) => ({
        id,
        name: stats.name || `Servizio ${id.substring(0, 8)}`,
        views: stats.views || 0,
        clicks: stats.clicks || 0,
        conversions: stats.conversions || 0,
        revenue: stats.revenue || 0,
        ctr: stats.views > 0 ? ((stats.clicks / stats.views) * 100).toFixed(1) : '0',
        cvr: stats.clicks > 0 ? ((stats.conversions / stats.clicks) * 100).toFixed(1) : '0'
      }))
    : [];
  
  // Show tours for guides, services for providers
  const data = userRole === 'guide' ? tourData : serviceData;
  const entityType = userRole === 'guide' ? 'tours' : 'services';
  
  // Sorting
  const [sortKey, setSortKey] = useState<string>('views');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('desc');
  
  const sortedData = useMemo(() => {
    return [...data].sort((a, b) => {
      const aVal = a[sortKey as keyof typeof a];
      const bVal = b[sortKey as keyof typeof b];
      
      if (typeof aVal === 'number' && typeof bVal === 'number') {
        return sortOrder === 'asc' ? aVal - bVal : bVal - aVal;
      }
      
      if (typeof aVal === 'string' && typeof bVal === 'string') {
        return sortOrder === 'asc' 
          ? aVal.localeCompare(bVal) 
          : bVal.localeCompare(aVal);
      }
      
      return 0;
    });
  }, [data, sortKey, sortOrder]);
  
  const handleSort = (key: string) => {
    if (sortKey === key) {
      setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc');
    } else {
      setSortKey(key);
      setSortOrder('desc');
    }
  };
  
  if (data.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Performance {userRole === 'guide' ? 'Tour' : 'Servizi'}</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-muted-foreground">
            Nessun dato disponibile. Crea {userRole === 'guide' ? 'tour' : 'servizi'} per vedere le statistiche.
          </p>
        </CardContent>
      </Card>
    );
  }
  
  return (
    <Card data-testid={`table-${entityType}`}>
      <CardHeader>
        <CardTitle>Performance {userRole === 'guide' ? 'Tour' : 'Servizi'}</CardTitle>
        <CardDescription>Statistiche dettagliate per ogni entità</CardDescription>
      </CardHeader>
      <CardContent>
        <div className="overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead onClick={() => handleSort('name')} className="cursor-pointer hover-elevate">
                  Nome <ArrowUpDown className="inline h-4 w-4 ml-1" />
                </TableHead>
                <TableHead onClick={() => handleSort('views')} className="cursor-pointer hover-elevate">
                  Visualizzazioni <ArrowUpDown className="inline h-4 w-4 ml-1" />
                </TableHead>
                <TableHead onClick={() => handleSort('clicks')} className="cursor-pointer hover-elevate">
                  Click <ArrowUpDown className="inline h-4 w-4 ml-1" />
                </TableHead>
                <TableHead onClick={() => handleSort('conversions')} className="cursor-pointer hover-elevate">
                  Conversioni <ArrowUpDown className="inline h-4 w-4 ml-1" />
                </TableHead>
                <TableHead onClick={() => handleSort('revenue')} className="cursor-pointer hover-elevate">
                  Ricavi <ArrowUpDown className="inline h-4 w-4 ml-1" />
                </TableHead>
                <TableHead>CTR %</TableHead>
                <TableHead>CVR %</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {sortedData.map((row) => (
                <TableRow 
                  key={row.id} 
                  data-testid={`row-entity-${row.id}`}
                  className="cursor-pointer hover-elevate"
                  onClick={() => navigate(`/${entityType}/${row.id}`)}
                >
                  <TableCell className="font-medium">{row.name}</TableCell>
                  <TableCell>{row.views.toLocaleString()}</TableCell>
                  <TableCell>{row.clicks.toLocaleString()}</TableCell>
                  <TableCell>{row.conversions.toLocaleString()}</TableCell>
                  <TableCell>€{row.revenue.toFixed(2)}</TableCell>
                  <TableCell>{row.ctr}%</TableCell>
                  <TableCell>{row.cvr}%</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      </CardContent>
    </Card>
  );
}

// Breakdown Charts Component
function AnalyticsBreakdown({ analytics, userRole }: { analytics: any; userRole: string }) {
  // Get top 5 entities by conversions for Pie chart
  const statsKey = userRole === 'guide' ? 'tourStats' : 'serviceStats';
  const stats = analytics[statsKey] || {};
  
  const topEntities = Object.entries(stats)
    .map(([id, data]: [string, any]) => ({
      id,
      name: data.title || data.name || `${id.substring(0, 8)}`,
      conversions: data.conversions || 0,
      revenue: data.revenue || 0
    }))
    .sort((a, b) => b.conversions - a.conversions)
    .slice(0, 5);
  
  // Colors for charts
  const COLORS = ['#3b82f6', '#10b981', '#f97316', '#8b5cf6', '#ec4899'];
  
  if (topEntities.length === 0) {
    return null; // Don't show breakdown if no data
  }
  
  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
      {/* Pie Chart - Conversions */}
      <Card data-testid="chart-conversions-pie">
        <CardHeader>
          <CardTitle>Conversioni per Entità</CardTitle>
          <CardDescription>Top 5 {userRole === 'guide' ? 'tour' : 'servizi'}</CardDescription>
        </CardHeader>
        <CardContent>
          <ResponsiveContainer width="100%" height={300}>
            <PieChart>
              <Pie
                data={topEntities}
                dataKey="conversions"
                nameKey="name"
                cx="50%"
                cy="50%"
                outerRadius={100}
                label
              >
                {topEntities.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                ))}
              </Pie>
              <Tooltip />
              <Legend />
            </PieChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>
      
      {/* Bar Chart - Revenue */}
      <Card data-testid="chart-revenue-bar">
        <CardHeader>
          <CardTitle>Ricavi per Entità</CardTitle>
          <CardDescription>Top 5 {userRole === 'guide' ? 'tour' : 'servizi'}</CardDescription>
        </CardHeader>
        <CardContent>
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={topEntities}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="name" />
              <YAxis />
              <Tooltip formatter={(value: number) => [`€${value.toFixed(2)}`, 'Ricavi']} />
              <Bar dataKey="revenue" fill="#f97316" name="Ricavi" />
            </BarChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>
    </div>
  );
}

// Main Analytics Page Component
export default function Analytics() {
  const { user } = useAuth();
  const { toast } = useToast();
  
  // Redirect if not guide or provider
  if (!user || (user.role !== 'guide' && user.role !== 'provider')) {
    return (
      <div className="min-h-screen bg-background">
        <Helmet>
          <title>Accesso Negato | TourConnect</title>
        </Helmet>
        <Header />
        <div className="container mx-auto p-6 max-w-4xl">
          <Card className="mt-6">
            <CardHeader>
              <CardTitle>Accesso Negato</CardTitle>
              <CardDescription>
                Solo guide e provider possono accedere all'Analytics Dashboard.
              </CardDescription>
            </CardHeader>
          </Card>
        </div>
      </div>
    );
  }
  
  // Period state (default 30d)
  const [period, setPeriod] = useState<Period>('30d');
  
  // Get date range for API call
  const { startDate, endDate } = getDateRange(period);
  
  // Determine which endpoint to use based on role
  const endpoint = user.role === 'guide' 
    ? '/api/analytics/dashboard/guide' 
    : '/api/analytics/dashboard/provider';
  
  // Build query params
  const queryParams = new URLSearchParams();
  if (startDate) queryParams.append('startDate', startDate);
  if (endDate) queryParams.append('endDate', endDate);
  const queryString = queryParams.toString();
  
  // Fetch analytics data
  const { data: analytics, isLoading, isError } = useQuery({
    queryKey: [endpoint, period],
    queryFn: async () => {
      const url = queryString ? `${endpoint}?${queryString}` : endpoint;
      const res = await fetch(url, {
        credentials: 'include'
      });
      if (!res.ok) throw new Error('Failed to fetch analytics');
      return res.json();
    },
    enabled: !!user
  });
  
  const handleRefresh = async () => {
    await queryClient.invalidateQueries({ 
      queryKey: [endpoint],
      exact: false
    });
    toast({ title: 'Dati aggiornati!' });
  };
  
  return (
    <div className="min-h-screen bg-background">
      <Helmet>
        <title>Analytics Dashboard | TourConnect</title>
        <meta name="description" content="Visualizza le performance dei tuoi tour e servizi con statistiche dettagliate" />
      </Helmet>
      
      <Header />
      
      <div className="container mx-auto p-6 max-w-7xl">
        {/* Hero Section with Period Selector */}
        <div className="flex flex-col md:flex-row md:justify-between md:items-center mb-6 gap-4">
          <div>
            <h1 className="text-4xl font-bold">Analytics Dashboard</h1>
            <p className="text-muted-foreground mt-2">
              Performance delle tue {user.role === 'guide' ? 'tour' : 'servizi'}
            </p>
          </div>
          
          <div className="flex gap-3">
            {/* Period Selector */}
            <Tabs value={period} onValueChange={(v) => setPeriod(v as Period)}>
              <TabsList data-testid="period-selector">
                <TabsTrigger value="7d">7 giorni</TabsTrigger>
                <TabsTrigger value="30d">30 giorni</TabsTrigger>
                <TabsTrigger value="90d">90 giorni</TabsTrigger>
                <TabsTrigger value="all">Tutto</TabsTrigger>
              </TabsList>
            </Tabs>
            
            {/* Refresh Button */}
            <Button
              variant="ghost"
              size="icon"
              onClick={handleRefresh}
              data-testid="button-refresh"
            >
              <RefreshCw className="h-4 w-4" />
            </Button>
          </div>
        </div>
        
        {/* Loading State */}
        {isLoading && (
          <div className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
              {[1, 2, 3, 4].map(i => (
                <Card key={i}>
                  <CardHeader>
                    <Skeleton className="h-4 w-20" />
                  </CardHeader>
                  <CardContent>
                    <Skeleton className="h-8 w-16" />
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>
        )}
        
        {/* Error State */}
        {isError && (
          <Card>
            <CardHeader>
              <CardTitle>Errore</CardTitle>
              <CardDescription>
                Impossibile caricare i dati analytics.
              </CardDescription>
            </CardHeader>
          </Card>
        )}
        
        {/* Main Content */}
        {analytics && (
          <div className="space-y-6">
            {/* KPI Cards */}
            <AnalyticsKPIGrid analytics={analytics} />
            
            {/* Time Series Charts */}
            <AnalyticsTimeSeries analytics={analytics} />
            
            {/* Entity Performance Tables */}
            <AnalyticsEntityTables 
              analytics={analytics} 
              userRole={user.role}
            />
            
            {/* Breakdown Charts */}
            <AnalyticsBreakdown analytics={analytics} userRole={user.role} />
          </div>
        )}
      </div>
    </div>
  );
}
