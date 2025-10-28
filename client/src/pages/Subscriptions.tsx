import { useState } from 'react';
import { useQuery, useMutation } from '@tanstack/react-query';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Check, Crown, Sparkles, Zap } from 'lucide-react';
import { apiRequest, queryClient } from '@/lib/queryClient';
import { useToast } from '@/hooks/use-toast';
import { useAuth } from '@/hooks/useAuth';
import { loadStripe } from '@stripe/stripe-js';

const stripePromise = loadStripe(import.meta.env.VITE_STRIPE_PUBLIC_KEY);

const PLANS = [
  {
    tier: 'free',
    displayName: 'Free',
    price: 0,
    priceLabel: 'Free',
    description: 'Perfect for occasional travelers',
    features: [
      'Browse tours and services',
      'Book tours',
      'Write reviews',
      'Basic messaging',
      'Standard search'
    ],
    icon: Sparkles,
    color: 'text-muted-foreground'
  },
  {
    tier: 'tourist-premium',
    displayName: 'Tourist Premium',
    price: 9.99,
    priceLabel: '$9.99/month',
    description: 'Enhanced experience for frequent travelers',
    features: [
      'All Free features',
      'Priority booking',
      'Advanced search filters',
      'Premium support',
      'Exclusive tour discounts',
      'Premium Partner badge',
      'No booking fees'
    ],
    icon: Crown,
    color: 'text-primary',
    popular: true
  },
  {
    tier: 'guide-pro',
    displayName: 'Guide Pro',
    price: 19.99,
    priceLabel: '$19.99/month',
    description: 'Professional tools for tour guides',
    features: [
      'All Tourist Premium features',
      'Unlimited tour listings',
      'Analytics dashboard',
      'Priority support',
      'Featured guide placement',
      'Guide Pro badge',
      'Reduced commission (5%)'
    ],
    icon: Zap,
    color: 'text-primary'
  }
];

export default function Subscriptions() {
  const { user } = useAuth();
  const { toast } = useToast();
  const [loading, setLoading] = useState<string | null>(null);
  
  // Fetch current subscription status
  const { data: subscription, isLoading } = useQuery<{
    tier: string;
    status: string;
    currentPeriodEnd?: string;
  }>({
    queryKey: ['/api/subscriptions/status'],
    enabled: !!user
  });
  
  const currentTier = subscription?.tier || 'free';
  
  // Create checkout session
  const createCheckoutMutation = useMutation({
    mutationFn: async (tier: string) => {
      setLoading(tier);
      const response = await apiRequest('POST', '/api/subscriptions/create-checkout', { tier });
      return response.json();
    },
    onSuccess: async (data: { url: string }) => {
      // Redirect to Stripe Checkout
      const stripe = await stripePromise;
      if (stripe && data.url) {
        window.location.href = data.url;
      }
    },
    onError: (error: any) => {
      toast({
        title: 'Checkout failed',
        description: error.message,
        variant: 'destructive'
      });
      setLoading(null);
    }
  });
  
  // Cancel subscription
  const cancelMutation = useMutation({
    mutationFn: async () => {
      const response = await apiRequest('POST', '/api/subscriptions/cancel', {});
      return response.json();
    },
    onSuccess: () => {
      toast({ title: 'Subscription cancelled' });
      queryClient.invalidateQueries({ queryKey: ['/api/subscriptions/status'] });
      queryClient.invalidateQueries({ queryKey: ['/api/auth/user'] });
    },
    onError: (error: any) => {
      toast({
        title: 'Failed to cancel',
        description: error.message,
        variant: 'destructive'
      });
    }
  });
  
  const handleSubscribe = (tier: string) => {
    createCheckoutMutation.mutate(tier);
  };
  
  if (isLoading) {
    return <div className="p-8">Loading...</div>;
  }
  
  return (
    <div className="container max-w-6xl mx-auto p-8">
      {/* Header */}
      <div className="text-center mb-12">
        <h1 className="text-4xl font-bold mb-4">Choose Your Plan</h1>
        <p className="text-xl text-muted-foreground">
          Unlock premium features and enhance your TourConnect experience
        </p>
      </div>
      
      {/* Current Subscription Status */}
      {subscription && currentTier !== 'free' && (
        <Card className="p-6 mb-8 border-primary">
          <div className="flex items-center justify-between gap-4">
            <div>
              <h3 className="text-lg font-semibold mb-1">
                Current Plan: {PLANS.find(p => p.tier === currentTier)?.displayName || currentTier}
              </h3>
              <p className="text-sm text-muted-foreground">
                Status: {subscription.status}
                {subscription.currentPeriodEnd && (
                  <> • Renews on {new Date(subscription.currentPeriodEnd).toLocaleDateString()}</>
                )}
              </p>
            </div>
            <Button
              variant="outline"
              onClick={() => cancelMutation.mutate()}
              disabled={cancelMutation.isPending}
              data-testid="button-cancel-subscription"
            >
              {cancelMutation.isPending ? 'Cancelling...' : 'Cancel Subscription'}
            </Button>
          </div>
        </Card>
      )}
      
      {/* Pricing Cards */}
      <div className="grid md:grid-cols-3 gap-6">
        {PLANS.map((plan) => {
          const Icon = plan.icon;
          const isCurrentPlan = currentTier === plan.tier;
          const canSubscribe = !isCurrentPlan && plan.tier !== 'free';
          
          return (
            <Card
              key={plan.tier}
              className={`p-6 relative ${
                plan.popular ? 'border-primary shadow-lg' : ''
              } ${isCurrentPlan ? 'bg-accent/50' : ''}`}
              data-testid={`plan-${plan.tier}`}
            >
              {plan.popular && (
                <Badge className="absolute -top-3 left-1/2 -translate-x-1/2">
                  Most Popular
                </Badge>
              )}
              
              {isCurrentPlan && (
                <Badge variant="outline" className="absolute -top-3 right-4">
                  Current Plan
                </Badge>
              )}
              
              <div className="text-center mb-6">
                <Icon className={`h-12 w-12 mx-auto mb-4 ${plan.color}`} />
                <h3 className="text-2xl font-bold mb-2">{plan.displayName}</h3>
                <div className="mb-2">
                  <span className="text-4xl font-bold">{plan.priceLabel}</span>
                </div>
                <p className="text-sm text-muted-foreground">{plan.description}</p>
              </div>
              
              <ul className="space-y-3 mb-6">
                {plan.features.map((feature, idx) => (
                  <li key={idx} className="flex items-start gap-2">
                    <Check className="h-5 w-5 text-primary shrink-0 mt-0.5" />
                    <span className="text-sm">{feature}</span>
                  </li>
                ))}
              </ul>
              
              <Button
                className="w-full"
                variant={plan.popular ? 'default' : 'outline'}
                disabled={isCurrentPlan || !canSubscribe || loading !== null}
                onClick={() => handleSubscribe(plan.tier)}
                data-testid={`button-subscribe-${plan.tier}`}
              >
                {isCurrentPlan
                  ? 'Current Plan'
                  : loading === plan.tier
                  ? 'Loading...'
                  : plan.tier === 'free'
                  ? 'Free Forever'
                  : 'Subscribe Now'}
              </Button>
            </Card>
          );
        })}
      </div>
      
      {/* FAQ / Info */}
      <div className="mt-12 text-center text-sm text-muted-foreground">
        <p>All plans include a 30-day money-back guarantee.</p>
        <p className="mt-2">You can cancel or change your plan at any time.</p>
      </div>
    </div>
  );
}
