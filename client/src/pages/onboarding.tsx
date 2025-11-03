import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Logo } from '@/components/logo';
import { apiRequest } from '@/lib/queryClient';
import { useToast } from '@/hooks/use-toast';
import { 
  Compass, 
  Map, 
  Store, 
  Search, 
  PlusCircle, 
  Megaphone, 
  CreditCard, 
  Star, 
  MapPin,
  Check,
  Users,
  Calendar,
  BarChart,
  Package,
  TrendingUp,
  Tag
} from 'lucide-react';
import type { UserRole } from '@shared/schema';

const TOTAL_STEPS = 3;

export default function Onboarding() {
  const { t } = useTranslation();
  const [currentStep, setCurrentStep] = useState(1);
  const [selectedRole, setSelectedRole] = useState<UserRole | null>(null);
  const queryClient = useQueryClient();
  const { toast } = useToast();

  const mutation = useMutation({
    mutationFn: async (role: UserRole) => {
      return await apiRequest('POST', '/api/auth/set-role', { role });
    },
    onSuccess: () => {
      localStorage.setItem('onboardingCompleted', 'true');
      queryClient.invalidateQueries({ queryKey: ['/api/auth/user'] });
    },
    onError: () => {
      toast({
        title: t('common.error'),
        description: t('onboarding.errors.roleSetError'),
        variant: 'destructive',
      });
    },
  });

  const handleSkip = () => {
    localStorage.setItem('onboardingCompleted', 'true');
    window.location.reload();
  };

  const handleNext = () => {
    if (currentStep < TOTAL_STEPS) {
      setCurrentStep(currentStep + 1);
    }
  };

  const handleComplete = () => {
    if (selectedRole) {
      mutation.mutate(selectedRole);
    }
  };

  const roles = [
    {
      value: 'tourist' as UserRole,
      icon: Compass,
      titleKey: 'onboarding.chooseRole.tourist.title',
      descKey: 'onboarding.chooseRole.tourist.desc',
      features: [
        t('onboarding.chooseRole.tourist.feature1'),
        t('onboarding.chooseRole.tourist.feature2'),
        t('onboarding.chooseRole.tourist.feature3'),
      ],
    },
    {
      value: 'guide' as UserRole,
      icon: Map,
      titleKey: 'onboarding.chooseRole.guide.title',
      descKey: 'onboarding.chooseRole.guide.desc',
      features: [
        t('onboarding.chooseRole.guide.feature1'),
        t('onboarding.chooseRole.guide.feature2'),
        t('onboarding.chooseRole.guide.feature3'),
      ],
    },
    {
      value: 'provider' as UserRole,
      icon: Store,
      titleKey: 'onboarding.chooseRole.provider.title',
      descKey: 'onboarding.chooseRole.provider.desc',
      features: [
        t('onboarding.chooseRole.provider.feature1'),
        t('onboarding.chooseRole.provider.feature2'),
        t('onboarding.chooseRole.provider.feature3'),
      ],
    },
  ];

  const touristFeatures = [
    {
      icon: Search,
      titleKey: 'onboarding.howItWorks.tourist.search.title',
      descKey: 'onboarding.howItWorks.tourist.search.desc',
    },
    {
      icon: Users,
      titleKey: 'onboarding.howItWorks.tourist.community.title',
      descKey: 'onboarding.howItWorks.tourist.community.desc',
    },
    {
      icon: Calendar,
      titleKey: 'onboarding.howItWorks.tourist.booking.title',
      descKey: 'onboarding.howItWorks.tourist.booking.desc',
    },
    {
      icon: MapPin,
      titleKey: 'onboarding.howItWorks.tourist.maps.title',
      descKey: 'onboarding.howItWorks.tourist.maps.desc',
    },
    {
      icon: Star,
      titleKey: 'onboarding.howItWorks.tourist.reviews.title',
      descKey: 'onboarding.howItWorks.tourist.reviews.desc',
    },
    {
      icon: CreditCard,
      titleKey: 'onboarding.howItWorks.tourist.payment.title',
      descKey: 'onboarding.howItWorks.tourist.payment.desc',
    },
  ];

  const guideFeatures = [
    {
      icon: PlusCircle,
      titleKey: 'onboarding.howItWorks.guide.create.title',
      descKey: 'onboarding.howItWorks.guide.create.desc',
    },
    {
      icon: Users,
      titleKey: 'onboarding.howItWorks.guide.community.title',
      descKey: 'onboarding.howItWorks.guide.community.desc',
    },
    {
      icon: Calendar,
      titleKey: 'onboarding.howItWorks.guide.manage.title',
      descKey: 'onboarding.howItWorks.guide.manage.desc',
    },
    {
      icon: Star,
      titleKey: 'onboarding.howItWorks.guide.reviews.title',
      descKey: 'onboarding.howItWorks.guide.reviews.desc',
    },
    {
      icon: BarChart,
      titleKey: 'onboarding.howItWorks.guide.analytics.title',
      descKey: 'onboarding.howItWorks.guide.analytics.desc',
    },
    {
      icon: CreditCard,
      titleKey: 'onboarding.howItWorks.guide.earnings.title',
      descKey: 'onboarding.howItWorks.guide.earnings.desc',
    },
  ];

  const providerFeatures = [
    {
      icon: Megaphone,
      titleKey: 'onboarding.howItWorks.provider.promote.title',
      descKey: 'onboarding.howItWorks.provider.promote.desc',
    },
    {
      icon: Package,
      titleKey: 'onboarding.howItWorks.provider.packages.title',
      descKey: 'onboarding.howItWorks.provider.packages.desc',
    },
    {
      icon: Calendar,
      titleKey: 'onboarding.howItWorks.provider.bookings.title',
      descKey: 'onboarding.howItWorks.provider.bookings.desc',
    },
    {
      icon: TrendingUp,
      titleKey: 'onboarding.howItWorks.provider.analytics.title',
      descKey: 'onboarding.howItWorks.provider.analytics.desc',
    },
    {
      icon: Tag,
      titleKey: 'onboarding.howItWorks.provider.coupons.title',
      descKey: 'onboarding.howItWorks.provider.coupons.desc',
    },
    {
      icon: CreditCard,
      titleKey: 'onboarding.howItWorks.provider.payments.title',
      descKey: 'onboarding.howItWorks.provider.payments.desc',
    },
  ];

  const features = selectedRole === 'tourist' 
    ? touristFeatures 
    : selectedRole === 'guide' 
    ? guideFeatures 
    : providerFeatures;

  return (
    <div className="min-h-screen bg-gradient-to-br from-primary/10 via-background to-secondary/10 flex flex-col">
      {/* Skip Button */}
      <div className="absolute top-6 right-6 z-10">
        <Button 
          variant="ghost" 
          onClick={handleSkip}
          data-testid="button-skip-onboarding"
        >
          {t('onboarding.skip')}
        </Button>
      </div>

      {/* Progress Indicator */}
      <div className="flex justify-center items-center gap-2 pt-8 pb-4">
        {[1, 2, 3].map((step) => (
          <div
            key={step}
            className={`h-2 rounded-full transition-all duration-300 ${
              step === currentStep
                ? 'w-8 bg-primary'
                : step < currentStep
                ? 'w-2 bg-primary/60'
                : 'w-2 bg-muted'
            }`}
            data-testid={`progress-dot-${step}`}
          />
        ))}
      </div>

      <div className="flex-1 flex items-center justify-center p-4">
        <div className="w-full max-w-6xl">
          {/* Step 1: Welcome */}
          {currentStep === 1 && (
            <div 
              className="animate-in fade-in duration-500"
              data-testid="onboarding-step-1"
            >
              <div className="text-center max-w-3xl mx-auto">
                <div className="flex justify-center mb-8">
                  <Logo className="h-20" />
                </div>
                
                <h1 className="text-4xl md:text-5xl lg:text-6xl font-serif font-semibold text-foreground mb-6">
                  {t('onboarding.welcome.title')}
                </h1>
                
                <p className="text-lg md:text-xl text-muted-foreground mb-12 max-w-2xl mx-auto">
                  {t('onboarding.welcome.subtitle')}
                </p>

                <div className="relative rounded-2xl overflow-hidden mb-12 shadow-2xl">
                  <div className="aspect-video bg-gradient-to-br from-primary/20 to-secondary/20 flex items-center justify-center">
                    <div className="text-center p-8">
                      <Compass className="w-24 h-24 text-primary mx-auto mb-4" />
                      <p className="text-2xl font-semibold text-foreground">
                        {t('onboarding.welcome.heroText')}
                      </p>
                    </div>
                  </div>
                </div>

                <Button 
                  size="lg" 
                  onClick={handleNext}
                  className="min-w-48"
                  data-testid="button-start-onboarding"
                >
                  {t('onboarding.welcome.cta')}
                </Button>

                <p className="text-sm text-muted-foreground mt-4">
                  {t('onboarding.progress', { current: 1, total: TOTAL_STEPS })}
                </p>
              </div>
            </div>
          )}

          {/* Step 2: Choose Role */}
          {currentStep === 2 && (
            <div 
              className="animate-in fade-in duration-500"
              data-testid="onboarding-step-2"
            >
              <div className="text-center mb-12">
                <h2 className="text-3xl md:text-4xl lg:text-5xl font-serif font-semibold text-foreground mb-4">
                  {t('onboarding.chooseRole.title')}
                </h2>
                <p className="text-lg text-muted-foreground">
                  {t('onboarding.chooseRole.subtitle')}
                </p>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-12">
                {roles.map((role) => {
                  const Icon = role.icon;
                  const isSelected = selectedRole === role.value;
                  
                  return (
                    <Card
                      key={role.value}
                      className={`p-6 cursor-pointer transition-all hover-elevate active-elevate-2 ${
                        isSelected ? 'border-primary border-2 bg-primary/5' : ''
                      }`}
                      onClick={() => setSelectedRole(role.value)}
                      data-testid={`role-card-${role.value}`}
                    >
                      <div className="flex flex-col h-full">
                        <div className="flex items-center justify-center w-16 h-16 rounded-full bg-primary/10 mb-4">
                          <Icon className="w-8 h-8 text-primary" />
                        </div>
                        
                        <h3 className="text-xl font-semibold text-foreground mb-2">
                          {t(role.titleKey)}
                        </h3>
                        
                        <p className="text-muted-foreground mb-4 text-sm">
                          {t(role.descKey)}
                        </p>

                        <div className="mt-auto space-y-2">
                          {role.features.map((feature, index) => (
                            <div key={index} className="flex items-start gap-2">
                              <Check className="w-4 h-4 text-primary mt-0.5 flex-shrink-0" />
                              <span className="text-sm text-foreground">{feature}</span>
                            </div>
                          ))}
                        </div>

                        {isSelected && (
                          <div className="mt-4 pt-4 border-t">
                            <div className="flex items-center justify-center gap-2 text-primary">
                              <Check className="w-5 h-5" />
                              <span className="font-semibold">{t('onboarding.chooseRole.selected')}</span>
                            </div>
                          </div>
                        )}
                      </div>
                    </Card>
                  );
                })}
              </div>

              <div className="flex justify-center">
                <Button 
                  size="lg" 
                  onClick={handleNext}
                  disabled={!selectedRole}
                  className="min-w-48"
                  data-testid="button-continue-onboarding"
                >
                  {t('onboarding.chooseRole.cta')}
                </Button>
              </div>

              <p className="text-sm text-muted-foreground mt-4 text-center">
                {t('onboarding.progress', { current: 2, total: TOTAL_STEPS })}
              </p>
            </div>
          )}

          {/* Step 3: How It Works */}
          {currentStep === 3 && (
            <div 
              className="animate-in fade-in duration-500"
              data-testid="onboarding-step-3"
            >
              <div className="text-center mb-12">
                <h2 className="text-3xl md:text-4xl lg:text-5xl font-serif font-semibold text-foreground mb-4">
                  {t('onboarding.howItWorks.title')}
                </h2>
                <p className="text-lg text-muted-foreground">
                  {t('onboarding.howItWorks.subtitle')}
                </p>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-12">
                {features.map((feature, index) => {
                  const Icon = feature.icon;
                  
                  return (
                    <Card 
                      key={index} 
                      className="p-6 hover-elevate"
                      data-testid={`feature-card-${index}`}
                    >
                      <div className="flex flex-col items-center text-center h-full">
                        <div className="w-14 h-14 rounded-full bg-primary/10 flex items-center justify-center mb-4">
                          <Icon className="w-7 h-7 text-primary" />
                        </div>
                        
                        <h3 className="text-lg font-semibold text-foreground mb-2">
                          {t(feature.titleKey)}
                        </h3>
                        
                        <p className="text-sm text-muted-foreground">
                          {t(feature.descKey)}
                        </p>
                      </div>
                    </Card>
                  );
                })}
              </div>

              <div className="flex justify-center">
                <Button 
                  size="lg" 
                  onClick={handleComplete}
                  disabled={mutation.isPending}
                  className="min-w-48"
                  data-testid="button-complete-onboarding"
                >
                  {mutation.isPending 
                    ? t('common.loading') 
                    : t('onboarding.howItWorks.cta')
                  }
                </Button>
              </div>

              <p className="text-sm text-muted-foreground mt-4 text-center">
                {t('onboarding.progress', { current: 3, total: TOTAL_STEPS })}
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
