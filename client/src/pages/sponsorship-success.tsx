import { useEffect, useState } from 'react';
import { useLocation } from 'wouter';
import { useMutation, useQuery } from '@tanstack/react-query';
import { apiRequest } from '@/lib/queryClient';
import { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Sparkles, CheckCircle, Calendar, Clock, DollarSign, Home } from 'lucide-react';
import { Skeleton } from '@/components/ui/skeleton';
import { useAuth } from '@/hooks/useAuth';
import type { Sponsorship } from '@shared/schema';

export default function SponsorshipSuccess() {
  const [, navigate] = useLocation();
  const { user } = useAuth();
  const [sponsorshipId, setSponsorshipId] = useState<string | null>(null);
  const [activationAttempted, setActivationAttempted] = useState(false);

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const id = params.get('sponsorshipId');
    if (id) {
      setSponsorshipId(id);
    } else {
      // No sponsorship ID, redirect to dashboard
      setTimeout(() => {
        navigate('/');
      }, 2000);
    }
  }, [navigate]);

  const activateMutation = useMutation({
    mutationFn: async (id: string) => {
      const response = await apiRequest('POST', `/api/sponsorships/activate/${id}`);
      return response.json();
    },
  });

  const { data: sponsorship, isLoading } = useQuery<Sponsorship>({
    queryKey: ['/api/sponsorships', sponsorshipId],
    enabled: !!sponsorshipId,
  });

  useEffect(() => {
    if (sponsorshipId && !activationAttempted && sponsorship?.status === 'pending') {
      setActivationAttempted(true);
      activateMutation.mutate(sponsorshipId);
    }
  }, [sponsorshipId, activationAttempted, sponsorship, activateMutation]);

  const handleReturnToDashboard = () => {
    navigate('/');
  };

  if (!sponsorshipId) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center p-4">
        <Card className="max-w-md">
          <CardContent className="pt-6">
            <p className="text-center text-muted-foreground">
              Redirecting to dashboard...
            </p>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (isLoading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center p-4">
        <Card className="max-w-2xl w-full">
          <CardHeader>
            <Skeleton className="h-8 w-3/4 mb-2" />
            <Skeleton className="h-4 w-1/2" />
          </CardHeader>
          <CardContent className="space-y-4">
            <Skeleton className="h-20 w-full" />
            <Skeleton className="h-20 w-full" />
            <Skeleton className="h-20 w-full" />
          </CardContent>
        </Card>
      </div>
    );
  }

  if (!sponsorship) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center p-4">
        <Card className="max-w-md">
          <CardHeader>
            <CardTitle className="text-destructive">Sponsorship Not Found</CardTitle>
            <CardDescription>
              We couldn't find the sponsorship details.
            </CardDescription>
          </CardHeader>
          <CardFooter>
            <Button onClick={handleReturnToDashboard} className="w-full" data-testid="button-return-dashboard">
              <Home className="w-4 h-4 mr-2" />
              Return to Dashboard
            </Button>
          </CardFooter>
        </Card>
      </div>
    );
  }

  const isActive = sponsorship.status === 'active' || activateMutation.isSuccess;
  const duration = sponsorship.duration === 'weekly' ? 'Weekly' : 'Monthly';
  const days = sponsorship.duration === 'weekly' ? 7 : 30;

  return (
    <div className="min-h-screen bg-background">
      {/* Hero Section */}
      <section className="relative py-16 px-4 bg-gradient-to-b from-primary/5 to-background">
        <div className="max-w-2xl mx-auto text-center">
          <div className="w-20 h-20 rounded-full bg-primary/10 flex items-center justify-center mx-auto mb-6">
            <CheckCircle className="w-10 h-10 text-primary" data-testid="icon-success" />
          </div>
          <h1 className="text-4xl font-serif font-bold mb-4" data-testid="text-success-title">
            Payment Successful!
          </h1>
          <p className="text-xl text-muted-foreground" data-testid="text-success-subtitle">
            Your promotion is now {isActive ? 'active' : 'being activated'}
          </p>
        </div>
      </section>

      {/* Details Section */}
      <section className="py-12 px-4">
        <div className="max-w-2xl mx-auto">
          <Card data-testid="card-sponsorship-details">
            <CardHeader>
              <div className="flex items-center justify-between gap-4 flex-wrap">
                <div className="flex items-center gap-3">
                  <Sparkles className="w-6 h-6 text-primary" />
                  <CardTitle data-testid="text-promotion-title">Promotion Details</CardTitle>
                </div>
                <Badge 
                  variant={isActive ? 'default' : 'secondary'}
                  data-testid="badge-status"
                >
                  {isActive ? 'Active' : sponsorship.status}
                </Badge>
              </div>
            </CardHeader>
            <CardContent className="space-y-6">
              {/* Duration Info */}
              <div className="flex items-start gap-4 p-4 bg-muted/50 rounded-lg">
                <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center flex-shrink-0">
                  <Clock className="w-5 h-5 text-primary" />
                </div>
                <div className="flex-1">
                  <h3 className="font-semibold mb-1" data-testid="text-duration-type">
                    {duration} Promotion
                  </h3>
                  <p className="text-sm text-muted-foreground" data-testid="text-duration-days">
                    {days} days of premium visibility
                  </p>
                </div>
              </div>

              {/* Expiration Info */}
              {sponsorship.expiresAt && (
                <div className="flex items-start gap-4 p-4 bg-muted/50 rounded-lg">
                  <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center flex-shrink-0">
                    <Calendar className="w-5 h-5 text-primary" />
                  </div>
                  <div className="flex-1">
                    <h3 className="font-semibold mb-1">Expires On</h3>
                    <p className="text-sm text-muted-foreground" data-testid="text-expires-at">
                      {new Date(sponsorship.expiresAt).toLocaleDateString('en-US', {
                        weekday: 'long',
                        year: 'numeric',
                        month: 'long',
                        day: 'numeric',
                      })}
                    </p>
                  </div>
                </div>
              )}

              {/* Price Info */}
              <div className="flex items-start gap-4 p-4 bg-muted/50 rounded-lg">
                <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center flex-shrink-0">
                  <DollarSign className="w-5 h-5 text-primary" />
                </div>
                <div className="flex-1">
                  <h3 className="font-semibold mb-1">Amount Paid</h3>
                  <p className="text-sm text-muted-foreground" data-testid="text-price-paid">
                    ${sponsorship.price}
                  </p>
                </div>
              </div>

              {/* Benefits List */}
              <div className="pt-4 border-t">
                <h3 className="font-semibold mb-4">What You Get:</h3>
                <div className="space-y-3">
                  <div className="flex items-start gap-3">
                    <Sparkles className="w-5 h-5 text-primary flex-shrink-0 mt-0.5" />
                    <div>
                      <p className="font-medium">Top Placement</p>
                      <p className="text-sm text-muted-foreground">
                        Your {sponsorship.tourId ? 'tour' : 'service'} appears at the top of search results
                      </p>
                    </div>
                  </div>
                  <div className="flex items-start gap-3">
                    <Sparkles className="w-5 h-5 text-primary flex-shrink-0 mt-0.5" />
                    <div>
                      <p className="font-medium">Special Badge</p>
                      <p className="text-sm text-muted-foreground">
                        A "Promoted" badge helps you stand out from competitors
                      </p>
                    </div>
                  </div>
                  <div className="flex items-start gap-3">
                    <Sparkles className="w-5 h-5 text-primary flex-shrink-0 mt-0.5" />
                    <div>
                      <p className="font-medium">Increased Visibility</p>
                      <p className="text-sm text-muted-foreground">
                        Get more views and bookings from tourists searching in your area
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            </CardContent>
            <CardFooter className="flex flex-col sm:flex-row gap-3">
              <Button 
                onClick={handleReturnToDashboard} 
                className="w-full sm:flex-1"
                data-testid="button-dashboard"
              >
                <Home className="w-4 h-4 mr-2" />
                Return to Dashboard
              </Button>
            </CardFooter>
          </Card>

          {/* Additional Info */}
          <div className="mt-6 p-4 bg-muted/50 rounded-lg">
            <p className="text-sm text-muted-foreground text-center">
              A confirmation email has been sent to {user?.email}. You can view all your promotions in your dashboard.
            </p>
          </div>
        </div>
      </section>
    </div>
  );
}
