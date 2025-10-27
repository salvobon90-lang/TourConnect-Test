import { useState } from 'react';
import { useMutation } from '@tanstack/react-query';
import { useTranslation } from 'react-i18next';
import { apiRequest } from '@/lib/queryClient';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from '@/components/ui/dialog';
import { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Clock, DollarSign, Sparkles, Calendar } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

interface SponsorshipModalProps {
  tourId?: string;
  serviceId?: string;
  itemTitle: string;
  onClose: () => void;
}

export function SponsorshipModal({ tourId, serviceId, itemTitle, onClose }: SponsorshipModalProps) {
  const { t } = useTranslation();
  const { toast } = useToast();
  const [selectedDuration, setSelectedDuration] = useState<'weekly' | 'monthly' | null>(null);

  const createCheckoutMutation = useMutation({
    mutationFn: async (duration: 'weekly' | 'monthly') => {
      const response = await apiRequest('POST', '/api/sponsorships/create-checkout', {
        tourId,
        serviceId,
        duration,
      });
      return response.json();
    },
    onSuccess: (data: { url: string }) => {
      window.location.href = data.url;
    },
    onError: (error: any) => {
      toast({
        title: t('common.error'),
        description: error.message || t('sponsorship.sponsorshipError'),
        variant: 'destructive',
      });
      setSelectedDuration(null);
    },
  });

  const handleSelectPlan = (duration: 'weekly' | 'monthly') => {
    setSelectedDuration(duration);
    createCheckoutMutation.mutate(duration);
  };

  const plans = [
    {
      duration: 'weekly' as const,
      title: t('sponsorship.weeklyPromotion'),
      price: 49,
      days: 7,
      description: t('sponsorship.boostVisibility'),
      icon: Clock,
      badge: t('sponsorship.popularBadge'),
    },
    {
      duration: 'monthly' as const,
      title: t('sponsorship.monthlyPromotion'),
      price: 149,
      days: 30,
      description: t('sponsorship.extendedPromotion'),
      icon: Calendar,
      badge: t('sponsorship.bestValueBadge'),
    },
  ];

  return (
    <Dialog open onOpenChange={onClose}>
      <DialogContent className="max-w-3xl" data-testid="dialog-sponsorship">
        <DialogHeader>
          <DialogTitle className="text-2xl flex items-center gap-2" data-testid="text-sponsorship-title">
            <Sparkles className="w-6 h-6 text-primary" />
            {tourId ? t('sponsorship.promoteYourTour') : t('sponsorship.promoteYourService')}
          </DialogTitle>
          <DialogDescription data-testid="text-item-title">
            {itemTitle}
          </DialogDescription>
        </DialogHeader>

        <div className="py-4">
          <p className="text-sm text-muted-foreground mb-6">
            {t('sponsorship.promoteSubtitle')}
          </p>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {plans.map((plan) => (
              <Card 
                key={plan.duration} 
                className="relative overflow-visible"
                data-testid={`card-plan-${plan.duration}`}
              >
                {plan.badge && (
                  <div className="absolute -top-3 left-1/2 -translate-x-1/2 z-10">
                    <Badge variant="default" data-testid={`badge-${plan.duration}`}>
                      {plan.badge}
                    </Badge>
                  </div>
                )}
                
                <CardHeader className="text-center pb-4">
                  <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center mx-auto mb-3">
                    <plan.icon className="w-6 h-6 text-primary" />
                  </div>
                  <CardTitle className="text-xl" data-testid={`text-plan-title-${plan.duration}`}>
                    {plan.title}
                  </CardTitle>
                  <CardDescription data-testid={`text-plan-description-${plan.duration}`}>
                    {plan.description}
                  </CardDescription>
                </CardHeader>

                <CardContent className="text-center space-y-3 pb-4">
                  <div className="flex items-baseline justify-center gap-1">
                    <DollarSign className="w-5 h-5 text-muted-foreground" />
                    <span className="text-4xl font-bold" data-testid={`text-price-${plan.duration}`}>
                      {plan.price}
                    </span>
                  </div>
                  
                  <div className="text-sm text-muted-foreground">
                    <div className="flex items-center justify-center gap-2">
                      <Clock className="w-4 h-4" />
                      <span data-testid={`text-duration-${plan.duration}`}>
                        {plan.days} {t('sponsorship.daysOfPromotion')}
                      </span>
                    </div>
                  </div>

                  <div className="pt-2 space-y-2 text-sm text-muted-foreground text-left">
                    <div className="flex items-start gap-2">
                      <Sparkles className="w-4 h-4 mt-0.5 text-primary flex-shrink-0" />
                      <span>{t('sponsorship.topPlacement')}</span>
                    </div>
                    <div className="flex items-start gap-2">
                      <Sparkles className="w-4 h-4 mt-0.5 text-primary flex-shrink-0" />
                      <span>{t('sponsorship.specialBadge')}</span>
                    </div>
                    <div className="flex items-start gap-2">
                      <Sparkles className="w-4 h-4 mt-0.5 text-primary flex-shrink-0" />
                      <span>{t('sponsorship.increasedVisibility')}</span>
                    </div>
                  </div>
                </CardContent>

                <CardFooter>
                  <Button
                    className="w-full"
                    onClick={() => handleSelectPlan(plan.duration)}
                    disabled={createCheckoutMutation.isPending}
                    data-testid={`button-select-${plan.duration}`}
                  >
                    {createCheckoutMutation.isPending && selectedDuration === plan.duration
                      ? t('sponsorship.processingPayment')
                      : t('sponsorship.selectPlan')}
                  </Button>
                </CardFooter>
              </Card>
            ))}
          </div>

          <div className="mt-6 p-4 bg-muted/50 rounded-lg">
            <p className="text-xs text-muted-foreground text-center">
              Secure payment powered by Stripe. You'll be redirected to complete your purchase.
            </p>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
