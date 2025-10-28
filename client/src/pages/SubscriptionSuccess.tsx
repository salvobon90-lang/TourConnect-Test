import { useEffect } from 'react';
import { useLocation } from 'wouter';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { CheckCircle } from 'lucide-react';
import { queryClient } from '@/lib/queryClient';

export default function SubscriptionSuccess() {
  const [, setLocation] = useLocation();
  
  useEffect(() => {
    // Invalidate subscription status to fetch updated data
    queryClient.invalidateQueries({ queryKey: ['/api/subscriptions/status'] });
    queryClient.invalidateQueries({ queryKey: ['/api/auth/user'] });
  }, []);
  
  return (
    <div className="container max-w-2xl mx-auto p-8">
      <Card className="p-12 text-center">
        <CheckCircle className="h-16 w-16 text-green-500 mx-auto mb-4" />
        <h1 className="text-3xl font-bold mb-4">Welcome to Premium!</h1>
        <p className="text-lg text-muted-foreground mb-8">
          Your subscription has been activated successfully. You now have access to all premium features.
        </p>
        <div className="flex gap-4 justify-center">
          <Button onClick={() => setLocation('/subscriptions')} variant="outline" data-testid="button-view-subscription">
            View Subscription
          </Button>
          <Button onClick={() => setLocation('/')} data-testid="button-go-dashboard">
            Go to Dashboard
          </Button>
        </div>
      </Card>
    </div>
  );
}
