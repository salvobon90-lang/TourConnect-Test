import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Crown, Loader2 } from 'lucide-react';
import { useUpgradeSubscription } from '@/hooks/partnershipQueries';
import { useState } from 'react';

interface SubscriptionUpgradeModalProps {
  open: boolean;
  onClose: () => void;
  tiers: any;
}

export function SubscriptionUpgradeModal({ open, onClose, tiers }: SubscriptionUpgradeModalProps) {
  const [selectedTier, setSelectedTier] = useState<'standard' | 'premium' | 'pro' | null>(null);
  const upgradeMutation = useUpgradeSubscription();

  const handleUpgrade = () => {
    if (selectedTier) {
      upgradeMutation.mutate(selectedTier);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Choose Your Partnership Tier</DialogTitle>
          <DialogDescription>
            Select a plan that fits your needs and boost your visibility on TourConnect
          </DialogDescription>
        </DialogHeader>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-4">
          {Object.entries(tiers).map(([key, tier]: [string, any]) => (
            <Card
              key={key}
              className={`cursor-pointer transition-all ${
                selectedTier === key
                  ? 'border-orange-500 border-2 shadow-lg'
                  : 'hover:border-orange-300'
              }`}
              onClick={() => setSelectedTier(key as any)}
            >
              <CardHeader>
                <CardTitle className="flex items-center justify-between">
                  {tier.name}
                  {key === 'pro' && <Badge className="bg-orange-600">Best Value</Badge>}
                </CardTitle>
                <div>
                  <span className="text-3xl font-bold">€{tier.priceMonthly}</span>
                  <span className="text-sm text-muted-foreground">/month</span>
                </div>
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

        <div className="flex justify-end gap-2 mt-6">
          <Button variant="outline" onClick={onClose}>
            Cancel
          </Button>
          <Button
            onClick={handleUpgrade}
            disabled={!selectedTier || upgradeMutation.isPending}
            className="bg-orange-600 hover:bg-orange-700"
          >
            {upgradeMutation.isPending ? (
              <>
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                Processing...
              </>
            ) : (
              <>
                <Crown className="h-4 w-4 mr-2" />
                Continue to Payment
              </>
            )}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
