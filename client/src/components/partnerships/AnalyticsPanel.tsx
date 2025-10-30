import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Eye, MousePointerClick, TrendingUp, Heart, Star } from 'lucide-react';
import { useAnalytics } from '@/hooks/partnershipQueries';

export function AnalyticsPanel({ userId }: { userId: string }) {
  const { data, isLoading } = useAnalytics(userId);

  if (isLoading) {
    return <div>Loading analytics...</div>;
  }

  if (!data || data.tier !== 'pro') {
    return (
      <Card>
        <CardContent className="p-6">
          <p className="text-center text-muted-foreground">
            Analytics are only available for Pro tier partners. Upgrade to access detailed insights!
          </p>
        </CardContent>
      </Card>
    );
  }

  const analytics = data.analytics || {};

  const stats = [
    { label: 'Profile Views', value: analytics.profileViews || 0, icon: Eye, color: 'text-blue-600' },
    { label: 'Tour Views', value: analytics.tourViews || 0, icon: MousePointerClick, color: 'text-green-600' },
    { label: 'Service Views', value: analytics.serviceViews || 0, icon: TrendingUp, color: 'text-purple-600' },
    { label: 'Total Clicks', value: analytics.clicks || 0, icon: MousePointerClick, color: 'text-orange-600' },
    { label: 'Conversions', value: analytics.conversions || 0, icon: TrendingUp, color: 'text-red-600' },
    { label: 'Likes Received', value: analytics.likes || 0, icon: Heart, color: 'text-pink-600' },
    { label: 'Reviews', value: analytics.reviews || 0, icon: Star, color: 'text-yellow-600' },
  ];

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold mb-2">Analytics Dashboard</h2>
        <p className="text-muted-foreground">Your performance metrics</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {stats.map((stat) => (
          <Card key={stat.label}>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">{stat.label}</CardTitle>
              <stat.icon className={`h-4 w-4 ${stat.color}`} />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stat.value}</div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}
