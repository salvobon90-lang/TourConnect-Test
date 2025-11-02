import { useState } from 'react';
import { useMutation } from '@tanstack/react-query';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useTranslation } from 'react-i18next';
import { Header } from '@/components/layout/Header';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '@/components/ui/accordion';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Slider } from '@/components/ui/slider';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Progress } from '@/components/ui/progress';
import { useToast } from '@/hooks/use-toast';
import { apiRequest } from '@/lib/queryClient';
import { Loader2, Sparkles, MapPin, Euro, Lightbulb, AlertCircle, RotateCcw, Download, Save, Info } from 'lucide-react';
import { Helmet } from 'react-helmet-async';

// UI State type
type UIState = 'idle' | 'loading' | 'success' | 'error';

// Validation schema matching backend
const itineraryFormSchema = z.object({
  destination: z.string().min(3, 'Destination too short').max(100, 'Destination too long'),
  days: z.number().min(1, 'Minimum 1 day').max(14, 'Maximum 14 days'),
  interests: z.array(z.string()).min(1, 'Select at least one interest'),
  budget: z.enum(['budget', 'moderate', 'luxury']),
  travelStyle: z.enum(['relaxed', 'balanced', 'packed']),
  language: z.string().min(1, 'Language is required')
});

type ItineraryFormValues = z.infer<typeof itineraryFormSchema>;

// Available interests
const INTERESTS = [
  'History', 'Art', 'Food', 'Nature', 'Adventure', 
  'Culture', 'Shopping', 'Nightlife', 'Beach', 'Architecture'
];

export default function ItineraryBuilder() {
  const { t, i18n } = useTranslation();
  const { toast } = useToast();
  const [uiState, setUiState] = useState<UIState>('idle');
  const [generatedItinerary, setGeneratedItinerary] = useState<any>(null);
  const [errorMessage, setErrorMessage] = useState<string>('');
  const [loadingProgress, setLoadingProgress] = useState<number>(0);
  
  // Form with React Hook Form + Zod
  const form = useForm<ItineraryFormValues>({
    resolver: zodResolver(itineraryFormSchema),
    defaultValues: {
      destination: '',
      days: 3,
      interests: [],
      budget: 'moderate',
      travelStyle: 'balanced',
      language: i18n.language || 'en'
    }
  });
  
  // Simulate progress during loading
  const startProgressSimulation = () => {
    setLoadingProgress(0);
    const interval = setInterval(() => {
      setLoadingProgress(prev => {
        if (prev >= 90) {
          clearInterval(interval);
          return 90;
        }
        return prev + 10;
      });
    }, 500);
    return interval;
  };
  
  // Generate itinerary mutation
  const generateMutation = useMutation({
    mutationFn: async (data: ItineraryFormValues) => {
      return await apiRequest('POST', '/api/ai/itinerary', data);
    },
    onMutate: () => {
      setUiState('loading');
      setErrorMessage('');
      const interval = startProgressSimulation();
      return { interval };
    },
    onSuccess: (data, _, context: any) => {
      if (context?.interval) clearInterval(context.interval);
      setLoadingProgress(100);
      setGeneratedItinerary(data);
      setUiState('success');
      
      // Show fallback warning if AI used fallback
      if (data.isFallback) {
        toast({ 
          title: t('itineraryBuilder.success'),
          description: t('itineraryBuilder.errors.aiFailed'),
          variant: 'default'
        });
      } else {
        toast({ 
          title: t('itineraryBuilder.success'),
          description: t('itineraryBuilder.subtitle')
        });
      }
    },
    onError: (error: any, _, context: any) => {
      if (context?.interval) clearInterval(context.interval);
      setUiState('error');
      
      // Handle different error types and show localized messages
      let errorKey = 'itineraryBuilder.errors.generic';
      
      if (error.message) {
        const errorMsg = error.message.toLowerCase();
        if (errorMsg.includes('rate limit') || errorMsg.includes('too many')) {
          errorKey = 'itineraryBuilder.errors.rateLimit';
        } else if (errorMsg.includes('destination')) {
          errorKey = 'itineraryBuilder.errors.invalidDestination';
        } else if (errorMsg.includes('days')) {
          errorKey = 'itineraryBuilder.errors.invalidDays';
        } else if (errorMsg.includes('language')) {
          errorKey = 'itineraryBuilder.errors.invalidLanguage';
        }
      }
      
      // Check for error code in response
      if (error.errorCode) {
        switch (error.errorCode) {
          case 'RATE_LIMIT':
          case 'RATE_LIMIT_EXCEEDED':
            errorKey = 'itineraryBuilder.errors.rateLimit';
            break;
          case 'VALIDATION_ERROR':
            errorKey = 'itineraryBuilder.errors.generic';
            break;
          case 'AI_GENERATION_FAILED':
          case 'AI_UNAVAILABLE':
            errorKey = 'itineraryBuilder.errors.aiFailed';
            break;
        }
      }
      
      const localizedError = t(errorKey);
      setErrorMessage(localizedError);
      
      toast({
        title: t('common.error'),
        description: localizedError,
        variant: 'destructive'
      });
      
      console.error('[generateItinerary] Error:', error);
    }
  });
  
  const onSubmit = (data: ItineraryFormValues) => {
    generateMutation.mutate(data);
  };
  
  const handleRetry = () => {
    setUiState('idle');
    setErrorMessage('');
    setLoadingProgress(0);
  };
  
  const handleNewItinerary = () => {
    setGeneratedItinerary(null);
    setUiState('idle');
    setErrorMessage('');
    setLoadingProgress(0);
  };
  
  // Toggle interest selection
  const toggleInterest = (interest: string) => {
    const current = form.getValues('interests');
    if (current.includes(interest)) {
      form.setValue('interests', current.filter(i => i !== interest));
    } else {
      form.setValue('interests', [...current, interest]);
    }
  };
  
  return (
    <div className="min-h-screen bg-background">
      <Helmet>
        <title>AI Itinerary Builder | TourConnect</title>
        <meta name="description" content="Crea itinerari personalizzati con l'intelligenza artificiale" />
      </Helmet>
      
      <Header />
      
      <div className="container mx-auto px-4 py-6">
        {/* Hero Section */}
        <div className="mb-8 text-center">
          <h1 className="text-4xl font-bold mb-2 flex items-center justify-center gap-2">
            <Sparkles className="h-8 w-8 text-primary" />
            AI Itinerary Builder
          </h1>
          <p className="text-muted-foreground text-lg">
            Crea itinerari personalizzati in secondi con l'intelligenza artificiale
          </p>
        </div>
        
        {/* Error State */}
        {uiState === 'error' && (
          <div className="max-w-3xl mx-auto mb-6">
            <Alert variant="destructive">
              <AlertCircle className="h-4 w-4" />
              <AlertTitle>{t('common.error')}</AlertTitle>
              <AlertDescription className="flex items-center justify-between">
                <span>{errorMessage}</span>
                <Button 
                  variant="outline" 
                  size="sm" 
                  onClick={handleRetry}
                  className="ml-4"
                >
                  <RotateCcw className="mr-2 h-4 w-4" />
                  {t('itineraryBuilder.retry')}
                </Button>
              </AlertDescription>
            </Alert>
          </div>
        )}
        
        {/* Loading State */}
        {uiState === 'loading' && (
          <Card className="max-w-3xl mx-auto">
            <CardContent className="pt-6">
              <div className="space-y-4 text-center">
                <Loader2 className="h-12 w-12 animate-spin mx-auto text-primary" />
                <h3 className="text-lg font-semibold">{t('itineraryBuilder.generating')}</h3>
                <Progress value={loadingProgress} className="w-full" />
                <p className="text-sm text-muted-foreground">{loadingProgress}%</p>
              </div>
            </CardContent>
          </Card>
        )}
        
        {/* Form Card */}
        {uiState === 'idle' && (
          <Card className="max-w-3xl mx-auto" data-testid="card-itinerary-form">
            <CardHeader>
              <CardTitle>{t('itineraryBuilder.title')}</CardTitle>
              <CardDescription>
                {t('itineraryBuilder.subtitle')}
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Form {...form}>
                <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
                  {/* Destination */}
                  <FormField
                    control={form.control}
                    name="destination"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Destination</FormLabel>
                        <FormControl>
                          <Input 
                            placeholder="Rome, Italy" 
                            {...field} 
                            data-testid="input-destination"
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  
                  {/* Language */}
                  <FormField
                    control={form.control}
                    name="language"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Language</FormLabel>
                        <Select onValueChange={field.onChange} defaultValue={field.value}>
                          <FormControl>
                            <SelectTrigger data-testid="select-language">
                              <SelectValue placeholder="Select language" />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            <SelectItem value="en">English</SelectItem>
                            <SelectItem value="it">Italiano</SelectItem>
                            <SelectItem value="fr">Français</SelectItem>
                            <SelectItem value="de">Deutsch</SelectItem>
                            <SelectItem value="es">Español</SelectItem>
                          </SelectContent>
                        </Select>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  
                  {/* Days */}
                  <FormField
                    control={form.control}
                    name="days"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Giorni di Viaggio: {field.value}</FormLabel>
                        <FormControl>
                          <Slider
                            min={1}
                            max={14}
                            step={1}
                            value={[field.value]}
                            onValueChange={(vals) => field.onChange(vals[0])}
                            data-testid="slider-days"
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  
                  {/* Interests */}
                  <FormField
                    control={form.control}
                    name="interests"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Interessi (seleziona almeno uno)</FormLabel>
                        <div className="flex flex-wrap gap-2 mt-2">
                          {INTERESTS.map(interest => {
                            const isSelected = field.value.includes(interest);
                            return (
                              <Badge
                                key={interest}
                                variant={isSelected ? 'default' : 'outline'}
                                className="cursor-pointer toggle-elevate"
                                onClick={() => toggleInterest(interest)}
                                data-testid={`interest-${interest.toLowerCase()}`}
                              >
                                {interest}
                              </Badge>
                            );
                          })}
                        </div>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  
                  {/* Budget */}
                  <FormField
                    control={form.control}
                    name="budget"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Budget</FormLabel>
                        <FormControl>
                          <Tabs value={field.value} onValueChange={field.onChange}>
                            <TabsList className="grid w-full grid-cols-3" data-testid="tabs-budget">
                              <TabsTrigger value="budget">Economico €</TabsTrigger>
                              <TabsTrigger value="moderate">Moderato €€</TabsTrigger>
                              <TabsTrigger value="luxury">Lusso €€€</TabsTrigger>
                            </TabsList>
                          </Tabs>
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  
                  {/* Travel Style */}
                  <FormField
                    control={form.control}
                    name="travelStyle"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Stile di Viaggio</FormLabel>
                        <FormControl>
                          <Tabs value={field.value} onValueChange={field.onChange}>
                            <TabsList className="grid w-full grid-cols-3" data-testid="tabs-travel-style">
                              <TabsTrigger value="relaxed">Rilassato</TabsTrigger>
                              <TabsTrigger value="balanced">Bilanciato</TabsTrigger>
                              <TabsTrigger value="packed">Intenso</TabsTrigger>
                            </TabsList>
                          </Tabs>
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  
                  {/* Submit Button */}
                  <Button 
                    type="submit" 
                    className="w-full" 
                    size="lg"
                    disabled={generateMutation.isPending}
                    data-testid="button-generate"
                  >
                    {generateMutation.isPending ? (
                      <>
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        L'AI sta creando il tuo itinerario...
                      </>
                    ) : (
                      <>
                        <Sparkles className="mr-2 h-4 w-4" />
                        Genera Itinerario
                      </>
                    )}
                  </Button>
                </form>
              </Form>
            </CardContent>
          </Card>
        )}
        
        {/* Generated Itinerary Display - Success State */}
        {uiState === 'success' && generatedItinerary && (
          <div className="max-w-4xl mx-auto space-y-6">
            {/* Fallback Warning */}
            {generatedItinerary.isFallback && (
              <Alert>
                <Info className="h-4 w-4" />
                <AlertTitle>Suggested Itinerary</AlertTitle>
                <AlertDescription>
                  {t('itineraryBuilder.errors.aiFailed')}
                </AlertDescription>
              </Alert>
            )}
            
            {/* Header with Actions */}
            <div className="flex justify-between items-center">
              <h2 className="text-3xl font-bold">
                {generatedItinerary.destination}
              </h2>
              <div className="flex gap-2">
                <Button 
                  variant="outline"
                  size="sm"
                  onClick={() => toast({ title: 'Coming soon!', description: 'Save feature will be available soon.' })}
                >
                  <Save className="mr-2 h-4 w-4" />
                  {t('itineraryBuilder.saveItinerary')}
                </Button>
                <Button 
                  variant="outline"
                  size="sm"
                  onClick={() => toast({ title: 'Coming soon!', description: 'PDF download will be available soon.' })}
                >
                  <Download className="mr-2 h-4 w-4" />
                  {t('itineraryBuilder.downloadPDF')}
                </Button>
                <Button 
                  onClick={handleNewItinerary}
                  variant="default"
                  data-testid="button-new-itinerary"
                >
                  <Sparkles className="mr-2 h-4 w-4" />
                  New Itinerary
                </Button>
              </div>
            </div>
            
            {/* Total Cost Summary */}
            <Card data-testid="card-cost-summary">
              <CardHeader className="flex flex-row items-center justify-between gap-2 space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">
                  Estimated Total Cost
                </CardTitle>
                <Euro className="h-4 w-4 text-primary" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">
                  €{generatedItinerary.estimatedTotalCost || generatedItinerary.totalEstimatedCost || 'N/A'}
                </div>
                <p className="text-xs text-muted-foreground mt-1">
                  {generatedItinerary.totalDays} days trip
                </p>
              </CardContent>
            </Card>
            
            {/* Day-by-Day Itinerary */}
            <Card data-testid="card-itinerary">
              <CardHeader>
                <CardTitle>Daily Plan</CardTitle>
              </CardHeader>
              <CardContent>
                <Accordion type="single" collapsible className="w-full">
                  {generatedItinerary.dailyPlans?.map((day: any) => (
                    <AccordionItem 
                      key={day.day} 
                      value={`day-${day.day}`}
                      data-testid={`accordion-day-${day.day}`}
                    >
                      <AccordionTrigger>
                        <div className="text-left w-full">
                          <div className="flex justify-between items-center">
                            <div>
                              <div className="font-semibold">Day {day.day}</div>
                              <div className="text-sm text-muted-foreground">
                                {day.title}
                              </div>
                            </div>
                            <div className="text-sm text-muted-foreground">
                              €{day.estimatedCost}
                            </div>
                          </div>
                        </div>
                      </AccordionTrigger>
                      <AccordionContent>
                        <div className="space-y-4 pl-4">
                          {/* Morning */}
                          {day.morning && day.morning.length > 0 && (
                            <div>
                              <h4 className="font-semibold text-sm mb-2">☀️ Morning</h4>
                              <ul className="space-y-1 pl-4">
                                {day.morning.map((activity: string, idx: number) => (
                                  <li key={idx} className="text-sm flex gap-2">
                                    <span className="text-primary">•</span>
                                    <span>{activity}</span>
                                  </li>
                                ))}
                              </ul>
                            </div>
                          )}
                          
                          {/* Afternoon */}
                          {day.afternoon && day.afternoon.length > 0 && (
                            <div>
                              <h4 className="font-semibold text-sm mb-2">🌤️ Afternoon</h4>
                              <ul className="space-y-1 pl-4">
                                {day.afternoon.map((activity: string, idx: number) => (
                                  <li key={idx} className="text-sm flex gap-2">
                                    <span className="text-primary">•</span>
                                    <span>{activity}</span>
                                  </li>
                                ))}
                              </ul>
                            </div>
                          )}
                          
                          {/* Evening */}
                          {day.evening && day.evening.length > 0 && (
                            <div>
                              <h4 className="font-semibold text-sm mb-2">🌙 Evening</h4>
                              <ul className="space-y-1 pl-4">
                                {day.evening.map((activity: string, idx: number) => (
                                  <li key={idx} className="text-sm flex gap-2">
                                    <span className="text-primary">•</span>
                                    <span>{activity}</span>
                                  </li>
                                ))}
                              </ul>
                            </div>
                          )}
                          
                          {/* Day Tips */}
                          {day.tips && day.tips.length > 0 && (
                            <div className="mt-3 p-3 bg-muted/50 rounded-md">
                              <h4 className="font-semibold text-sm mb-2 flex items-center gap-1">
                                <Lightbulb className="h-4 w-4" /> Tips
                              </h4>
                              <ul className="space-y-1 pl-4">
                                {day.tips.map((tip: string, idx: number) => (
                                  <li key={idx} className="text-xs text-muted-foreground flex gap-2">
                                    <span>💡</span>
                                    <span>{tip}</span>
                                  </li>
                                ))}
                              </ul>
                            </div>
                          )}
                        </div>
                      </AccordionContent>
                    </AccordionItem>
                  ))}
                </Accordion>
              </CardContent>
            </Card>
            
            {/* Packing List */}
            {generatedItinerary.packingList && generatedItinerary.packingList.length > 0 && (
              <Card data-testid="card-packing-list">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    🎒 Packing List
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-2 md:grid-cols-3 gap-2">
                    {generatedItinerary.packingList.map((item: string, idx: number) => (
                      <div key={idx} className="flex items-center gap-2 text-sm">
                        <span className="text-primary">✓</span>
                        <span>{item}</span>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            )}
            
            {/* Local Tips */}
            {generatedItinerary.localTips && generatedItinerary.localTips.length > 0 && (
              <Card data-testid="card-tips">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Lightbulb className="h-5 w-5 text-primary" />
                    Local Tips & Customs
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <ul className="space-y-2">
                    {generatedItinerary.localTips.map((tip: string, idx: number) => (
                      <li key={idx} className="flex gap-2">
                        <span className="text-primary">•</span>
                        <span>{tip}</span>
                      </li>
                    ))}
                  </ul>
                </CardContent>
              </Card>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
