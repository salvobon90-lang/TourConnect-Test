import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Crown, TrendingUp, Sparkles } from 'lucide-react';
import { usePartnership, useCancelSubscription } from '@/hooks/partnershipQueries';
import { PartnerBadge } from './PartnerBadge';
import { SubscriptionUpgradeModal } from './SubscriptionUpgradeModal';
import { useState } from 'react';
import { format } from 'date-fns';

export function PartnershipDashboard() {
  const { data, isLoading } = usePartnership();
  const cancelMutation = useCancelSubscription();
  const [showUpgradeModal, setShowUpgradeModal] = useState(false);

  if (isLoading) {
    return <div className="text-center py-8">Loading...</div>;
  }

  const partnership = data?.partnership;
  const tiers = data?.tiers || {};

  const daysRemaining = partnership?.endDate
    ? Math.max(0, Math.ceil((new Date(partnership.endDate).getTime() - Date.now()) / (1000 * 60 * 60 * 24)))
    : 0;

  const isActive = partnership?.status === 'active';

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold mb-2">Partnership & Promotions</h1>
        <p className="text-muted-foreground">Manage your subscription and boost your visibility</p>
      </div>

      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle>Current Plan</CardTitle>
              <CardDescription>Your partnership status and benefits</CardDescription>
            </div>
            {partnership && <PartnerBadge tier={partnership.tier} />}
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          {!partnership ? (
            <Alert>
              <Sparkles className="h-4 w-4" />
              <AlertDescription>
                You don't have an active partnership. Upgrade to boost your visibility and get more bookings!
              </AlertDescription>
            </Alert>
          ) : (
            <div className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                  <p className="text-sm text-muted-foreground">Status</p>
                  <Badge variant={isActive ? 'default' : 'secondary'}>
                    {partnership.status}
                  </Badge>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Days Remaining</p>
                  <p className="text-2xl font-bold">{daysRemaining}</p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">End Date</p>
                  <p className="font-medium">
                    {partnership.endDate ? format(new Date(partnership.endDate), 'MMM dd, yyyy') : 'N/A'}
                  </p>
                </div>
              </div>

              {partnership.endDate && (
                <div>
                  <div className="flex justify-between text-sm mb-2">
                    <span>Time remaining</span>
                    <span>{daysRemaining} days</span>
                  </div>
                  <Progress value={(daysRemaining / 30) * 100} className="h-2" />
                </div>
              )}

              <div className="flex gap-2">
                <Button onClick={() => setShowUpgradeModal(true)}>
                  <TrendingUp className="h-4 w-4 mr-2" />
                  Upgrade Plan
                </Button>
                <Button
                  variant="outline"
                  onClick={() => cancelMutation.mutate()}
                  disabled={cancelMutation.isPending || !isActive}
                >
                  Cancel Subscription
                </Button>
              </div>
            </div>
          )}

          {!partnership && (
            <Button className="w-full" onClick={() => setShowUpgradeModal(true)}>
              <Crown className="h-4 w-4 mr-2" />
              Get Started with a Partnership
            </Button>
          )}
        </CardContent>
      </Card>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {Object.entries(tiers).map(([key, tier]: [string, any]) => (
          <Card key={key} className={key === 'pro' ? 'border-orange-500 border-2' : ''}>
            <CardHeader>
              <CardTitle className="flex items-center justify-between">
                {tier.name}
                {key === 'pro' && <Badge className="bg-orange-600">Most Popular</Badge>}
              </CardTitle>
              <CardDescription>
                <span className="text-3xl font-bold">€{tier.priceMonthly}</span>
                <span className="text-sm text-muted-foreground">/month</span>
              </CardDescription>
            </CardHeader>
            <CardContent>
              <ul className="space-y-2">
                {tier.features.map((feature: string, i: number) => (
                  <li key={i} className="flex items-center gap-2 text-sm">
                    <span className="h-1.5 w-1.5 rounded-full bg-orange-600" />
                    {feature}
                  </li>
                ))}
              </ul>
            </CardContent>
          </Card>
        ))}
      </div>

      <SubscriptionUpgradeModal
        open={showUpgradeModal}
        onClose={() => setShowUpgradeModal(false)}
        tiers={tiers}
      />
    </div>
  );
}
