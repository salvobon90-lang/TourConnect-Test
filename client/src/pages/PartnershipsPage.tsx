import { PartnershipDashboard } from '@/components/partnerships/PartnershipDashboard';
import { AnalyticsPanel } from '@/components/partnerships/AnalyticsPanel';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useAuth } from '@/hooks/useAuth';

export default function PartnershipsPage() {
  const { user } = useAuth();

  if (!user) return null;

  if (user.role !== 'guide' && user.role !== 'provider') {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="text-center py-12">
          <h2 className="text-2xl font-bold mb-2">Partnerships Unavailable</h2>
          <p className="text-muted-foreground">
            Partnerships are only available for guides and service providers.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <Tabs defaultValue="dashboard" className="space-y-6">
        <TabsList>
          <TabsTrigger value="dashboard">Dashboard</TabsTrigger>
          <TabsTrigger value="analytics">Analytics</TabsTrigger>
        </TabsList>

        <TabsContent value="dashboard">
          <PartnershipDashboard />
        </TabsContent>

        <TabsContent value="analytics">
          <AnalyticsPanel userId={user.id} />
        </TabsContent>
      </Tabs>
    </div>
  );
}
