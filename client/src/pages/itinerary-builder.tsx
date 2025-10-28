import { useState } from 'react';
import { useMutation } from '@tanstack/react-query';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Header } from '@/components/layout/Header';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '@/components/ui/accordion';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Slider } from '@/components/ui/slider';
import { useToast } from '@/hooks/use-toast';
import { apiRequest } from '@/lib/queryClient';
import { Loader2, Sparkles, MapPin, UtensilsCrossed, Compass, Car, Euro, Lightbulb } from 'lucide-react';
import { Helmet } from 'react-helmet-async';

// Validation schema matching backend
const itineraryFormSchema = z.object({
  destination: z.string().min(3, 'Destinazione troppo corta').max(100),
  days: z.number().min(1).max(14),
  interests: z.array(z.string()).min(1, 'Seleziona almeno un interesse'),
  budget: z.enum(['budget', 'moderate', 'luxury']),
  travelStyle: z.enum(['relaxed', 'balanced', 'packed'])
});

type ItineraryFormValues = z.infer<typeof itineraryFormSchema>;

// Available interests
const INTERESTS = [
  'History', 'Art', 'Food', 'Nature', 'Adventure', 
  'Culture', 'Shopping', 'Nightlife', 'Beach', 'Architecture'
];

export default function ItineraryBuilder() {
  const { toast } = useToast();
  const [generatedItinerary, setGeneratedItinerary] = useState<any>(null);
  
  // Form with React Hook Form + Zod
  const form = useForm<ItineraryFormValues>({
    resolver: zodResolver(itineraryFormSchema),
    defaultValues: {
      destination: '',
      days: 3,
      interests: [],
      budget: 'moderate',
      travelStyle: 'balanced'
    }
  });
  
  // Generate itinerary mutation
  const generateMutation = useMutation({
    mutationFn: async (data: ItineraryFormValues) => {
      return await apiRequest('POST', '/api/ai/itinerary', data);
    },
    onSuccess: (data) => {
      setGeneratedItinerary(data);
      toast({ 
        title: 'Itinerario creato!', 
        description: 'Il tuo itinerario personalizzato è pronto.' 
      });
    },
    onError: (error: any) => {
      toast({
        title: 'Errore',
        description: error.message || 'Impossibile generare l\'itinerario. Riprova.',
        variant: 'destructive'
      });
      console.error('[generateItinerary] Error:', error);
    }
  });
  
  const onSubmit = (data: ItineraryFormValues) => {
    generateMutation.mutate(data);
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
        
        {/* Form Card */}
        {!generatedItinerary && (
          <Card className="max-w-3xl mx-auto" data-testid="card-itinerary-form">
            <CardHeader>
              <CardTitle>Costruisci il Tuo Itinerario</CardTitle>
              <CardDescription>
                Fornisci i dettagli del tuo viaggio e l'AI creerà un itinerario perfetto
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
                        <FormLabel>Destinazione</FormLabel>
                        <FormControl>
                          <Input 
                            placeholder="Roma, Italia" 
                            {...field} 
                            data-testid="input-destination"
                          />
                        </FormControl>
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
        
        {/* Generated Itinerary Display */}
        {generatedItinerary && (
          <div className="max-w-4xl mx-auto space-y-6">
            {/* Header with Regenerate Button */}
            <div className="flex justify-between items-center">
              <h2 className="text-3xl font-bold">Il Tuo Itinerario</h2>
              <Button 
                onClick={() => setGeneratedItinerary(null)}
                variant="outline"
                data-testid="button-new-itinerary"
              >
                Crea Nuovo Itinerario
              </Button>
            </div>
            
            {/* Total Cost Summary */}
            <Card data-testid="card-cost-summary">
              <CardHeader className="flex flex-row items-center justify-between gap-2 space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">
                  Costo Totale Stimato
                </CardTitle>
                <Euro className="h-4 w-4 text-primary" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">
                  {generatedItinerary.totalEstimatedCost || 'N/A'}
                </div>
              </CardContent>
            </Card>
            
            {/* Day-by-Day Itinerary */}
            <Card data-testid="card-itinerary">
              <CardHeader>
                <CardTitle>Programma Giornaliero</CardTitle>
              </CardHeader>
              <CardContent>
                <Accordion type="single" collapsible className="w-full">
                  {generatedItinerary.itinerary?.map((day: any) => (
                    <AccordionItem 
                      key={day.day} 
                      value={`day-${day.day}`}
                      data-testid={`accordion-day-${day.day}`}
                    >
                      <AccordionTrigger>
                        <div className="text-left">
                          <div className="font-semibold">Giorno {day.day}</div>
                          <div className="text-sm text-muted-foreground">
                            {day.date} - {day.title}
                          </div>
                        </div>
                      </AccordionTrigger>
                      <AccordionContent>
                        <div className="space-y-4 pl-4">
                          {day.activities?.map((activity: any, idx: number) => (
                            <div 
                              key={idx} 
                              className="flex gap-4 border-l-2 border-primary/20 pl-4"
                              data-testid={`activity-${day.day}-${idx}`}
                            >
                              {/* Icon based on type */}
                              <div className="flex-shrink-0 mt-1">
                                {activity.type === 'tour' && <MapPin className="h-5 w-5 text-primary" />}
                                {activity.type === 'restaurant' && <UtensilsCrossed className="h-5 w-5 text-primary" />}
                                {activity.type === 'activity' && <Compass className="h-5 w-5 text-primary" />}
                                {activity.type === 'transport' && <Car className="h-5 w-5 text-primary" />}
                              </div>
                              
                              <div className="flex-1">
                                <div className="flex items-baseline gap-2 mb-1">
                                  <span className="text-sm font-semibold text-muted-foreground">
                                    {activity.time}
                                  </span>
                                  <h4 className="font-semibold">{activity.title}</h4>
                                </div>
                                <p className="text-sm text-muted-foreground mb-2">
                                  {activity.description}
                                </p>
                                <div className="flex gap-3 text-xs text-muted-foreground">
                                  {activity.duration && (
                                    <span>⏱️ {activity.duration}</span>
                                  )}
                                  {activity.estimatedCost && (
                                    <span>💰 {activity.estimatedCost}</span>
                                  )}
                                </div>
                              </div>
                            </div>
                          ))}
                        </div>
                      </AccordionContent>
                    </AccordionItem>
                  ))}
                </Accordion>
              </CardContent>
            </Card>
            
            {/* Tips Section */}
            {generatedItinerary.tips && generatedItinerary.tips.length > 0 && (
              <Card data-testid="card-tips">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Lightbulb className="h-5 w-5 text-primary" />
                    Consigli di Viaggio
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <ul className="space-y-2">
                    {generatedItinerary.tips.map((tip: string, idx: number) => (
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
