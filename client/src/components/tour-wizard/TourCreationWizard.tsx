import { useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { useLocation } from 'wouter';
import { useTranslation } from 'react-i18next';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { Form } from '@/components/ui/form';
import { useToast } from '@/hooks/use-toast';
import { apiRequest } from '@/lib/queryClient';
import { insertTourSchema, type InsertTour } from '@shared/schema';
import { TourWizardProvider, useTourWizard } from './TourWizardContext';
import { ArrowLeft, ArrowRight, Check } from 'lucide-react';
import Step1BasicInfo from './Step1BasicInfo';
import Step2Details from './Step2Details';
import Step3Media from './Step3Media';
import Step4Location from './Step4Location';
import Step5Pricing from './Step5Pricing';
import Step6Availability from './Step6Availability';
import Step7Review from './Step7Review';

const STEPS = [
  { number: 1, titleKey: 'tourCreation.steps.basicInfo', component: Step1BasicInfo },
  { number: 2, titleKey: 'tourCreation.steps.details', component: Step2Details },
  { number: 3, titleKey: 'tourCreation.steps.media', component: Step3Media },
  { number: 4, titleKey: 'tourCreation.steps.location', component: Step4Location },
  { number: 5, titleKey: 'tourCreation.steps.pricing', component: Step5Pricing },
  { number: 6, titleKey: 'tourCreation.steps.availability', component: Step6Availability },
  { number: 7, titleKey: 'tourCreation.steps.review', component: Step7Review },
];

function WizardContent() {
  const { t } = useTranslation();
  const [, setLocation] = useLocation();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const { currentStep, nextStep, previousStep, form: wizardForm, setForm, completedSteps, goToStep } = useTourWizard();

  const form = useForm<InsertTour>({
    resolver: zodResolver(insertTourSchema),
    defaultValues: {
      title: '',
      description: '',
      itinerary: '',
      category: 'walking',
      price: '0',
      duration: 120,
      maxGroupSize: 10,
      images: [],
      videos: [],
      meetingPoint: '',
      latitude: 41.9028,
      longitude: 12.4964,
      radius: 0.5,
      languages: ['en'],
      included: [],
      excluded: [],
      availableDates: [],
      difficulty: 'easy',
      cancellationPolicy: '',
      communityMode: false,
      minParticipants: 1,
      status: 'draft',
      discountRules: [],
      addons: [],
      isActive: true,
      guideId: '',
    },
  });

  useEffect(() => {
    setForm(form);
  }, [form, setForm]);

  const mutation = useMutation({
    mutationFn: async (data: InsertTour) => {
      return await apiRequest('POST', '/api/tours', data);
    },
    onSuccess: () => {
      toast({
        title: t('common.success'),
        description: t('createTour.success'),
      });
      queryClient.invalidateQueries({ queryKey: ['/api/my-tours'] });
      setLocation('/guide-dashboard');
    },
    onError: (error: any) => {
      toast({
        title: t('common.error'),
        description: error.message || t('createTour.error'),
        variant: 'destructive',
      });
    },
  });

  const onSubmit = (data: InsertTour) => {
    mutation.mutate(data);
  };

  const validateCurrentStep = async () => {
    let fieldsToValidate: (keyof InsertTour)[] = [];

    switch (currentStep) {
      case 1:
        fieldsToValidate = ['title', 'description', 'category', 'languages'];
        break;
      case 2:
        fieldsToValidate = ['itinerary', 'duration', 'maxGroupSize', 'difficulty'];
        break;
      case 3:
        fieldsToValidate = ['images'];
        break;
      case 4:
        fieldsToValidate = ['meetingPoint', 'latitude', 'longitude'];
        break;
      case 5:
        fieldsToValidate = ['price'];
        break;
      case 6:
        fieldsToValidate = ['availableDates', 'status'];
        break;
      default:
        return true;
    }

    const result = await form.trigger(fieldsToValidate);
    return result;
  };

  const handleNext = async () => {
    const isValid = await validateCurrentStep();
    if (isValid) {
      nextStep();
    }
  };

  const handleStepClick = (stepNumber: number) => {
    if (stepNumber <= currentStep || completedSteps.has(stepNumber - 1)) {
      goToStep(stepNumber);
    }
  };

  const CurrentStepComponent = STEPS[currentStep - 1].component;
  const progress = (currentStep / STEPS.length) * 100;

  return (
    <div className="min-h-screen bg-background">
      <header className="border-b bg-card sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <Button
                variant="ghost"
                size="icon"
                onClick={() => setLocation('/guide-dashboard')}
                data-testid="button-back"
              >
                <ArrowLeft className="w-5 h-5" />
              </Button>
              <div>
                <h1 className="text-2xl font-serif font-semibold">{t('tourCreation.createNewTour')}</h1>
                <p className="text-sm text-muted-foreground">
                  {t('tourCreation.stepProgress', { 
                    step: currentStep, 
                    total: STEPS.length, 
                    stepName: t(STEPS[currentStep - 1].titleKey) 
                  })}
                </p>
              </div>
            </div>
          </div>
        </div>
      </header>

      <div className="max-w-5xl mx-auto px-4 py-8">
        <div className="mb-8">
          <Progress value={progress} className="mb-4" />
          <div className="flex justify-between">
            {STEPS.map((step) => {
              const isCompleted = completedSteps.has(step.number) || step.number < currentStep;
              const isCurrent = step.number === currentStep;
              const isAccessible = step.number <= currentStep || completedSteps.has(step.number - 1);

              return (
                <button
                  key={step.number}
                  onClick={() => handleStepClick(step.number)}
                  disabled={!isAccessible}
                  className={`flex flex-col items-center gap-2 transition-all ${
                    isAccessible ? 'cursor-pointer' : 'cursor-not-allowed opacity-50'
                  }`}
                  data-testid={`step-indicator-${step.number}`}
                >
                  <div
                    className={`w-10 h-10 rounded-full flex items-center justify-center border-2 transition-colors ${
                      isCurrent
                        ? 'border-primary bg-primary text-primary-foreground'
                        : isCompleted
                        ? 'border-primary bg-primary/10 text-primary'
                        : 'border-muted bg-muted text-muted-foreground'
                    }`}
                  >
                    {isCompleted && !isCurrent ? (
                      <Check className="w-5 h-5" />
                    ) : (
                      <span className="text-sm font-semibold">{step.number}</span>
                    )}
                  </div>
                  <span
                    className={`text-xs font-medium hidden md:block ${
                      isCurrent ? 'text-foreground' : 'text-muted-foreground'
                    }`}
                  >
                    {t(step.titleKey)}
                  </span>
                </button>
              );
            })}
          </div>
        </div>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)}>
            <Card className="p-6 md:p-8">
              <CurrentStepComponent />
            </Card>

            <div className="flex justify-between mt-8">
              <Button
                type="button"
                variant="outline"
                onClick={previousStep}
                disabled={currentStep === 1}
                data-testid="button-previous"
              >
                <ArrowLeft className="w-4 h-4 mr-2" />
                {t('common.previous')}
              </Button>

              {currentStep < STEPS.length ? (
                <Button
                  type="button"
                  onClick={handleNext}
                  data-testid="button-next"
                >
                  {t('common.next')}
                  <ArrowRight className="w-4 h-4 ml-2" />
                </Button>
              ) : (
                <Button
                  type="submit"
                  disabled={mutation.isPending}
                  data-testid="button-submit"
                >
                  {mutation.isPending ? t('tourCreation.creating') : t('tourCreation.createTour')}
                </Button>
              )}
            </div>
          </form>
        </Form>
      </div>
    </div>
  );
}

export default function TourCreationWizard() {
  return (
    <TourWizardProvider>
      <WizardContent />
    </TourWizardProvider>
  );
}
