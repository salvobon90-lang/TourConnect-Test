import { useLocation } from 'wouter';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { XCircle } from 'lucide-react';

export default function SubscriptionCancel() {
  const [, setLocation] = useLocation();
  
  return (
    <div className="container max-w-2xl mx-auto p-8">
      <Card className="p-12 text-center">
        <XCircle className="h-16 w-16 text-muted-foreground mx-auto mb-4" />
        <h1 className="text-3xl font-bold mb-4">Subscription Cancelled</h1>
        <p className="text-lg text-muted-foreground mb-8">
          Your subscription setup was cancelled. You can try again anytime.
        </p>
        <div className="flex gap-4 justify-center">
          <Button onClick={() => setLocation('/subscriptions')} data-testid="button-view-plans">
            View Plans
          </Button>
          <Button onClick={() => setLocation('/')} variant="outline" data-testid="button-go-dashboard">
            Go to Dashboard
          </Button>
        </div>
      </Card>
    </div>
  );
}
