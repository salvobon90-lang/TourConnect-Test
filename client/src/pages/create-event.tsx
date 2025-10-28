import { useLocation } from 'wouter';
import { useTranslation } from 'react-i18next';
import { useMutation } from '@tanstack/react-query';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage, FormDescription } from '@/components/ui/form';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useAuth } from '@/hooks/useAuth';
import { Header } from '@/components/layout/Header';
import { useToast } from '@/hooks/use-toast';
import { apiRequest } from '@/lib/queryClient';
import { ArrowLeft } from 'lucide-react';

// Form validation schema
const eventFormSchema = z.object({
  title: z.string().min(3, 'Il titolo deve avere almeno 3 caratteri').max(200, 'Massimo 200 caratteri'),
  description: z.string().min(20, 'La descrizione deve avere almeno 20 caratteri').max(5000, 'Massimo 5000 caratteri'),
  category: z.string().min(1, 'Seleziona una categoria'),
  locationName: z.string().min(3, 'Inserisci un luogo').max(200, 'Massimo 200 caratteri'),
  latitude: z.number().min(-90).max(90).optional().nullable(),
  longitude: z.number().min(-180).max(180).optional().nullable(),
  startDate: z.string().refine(val => new Date(val) > new Date(), {
    message: 'La data di inizio deve essere futura'
  }),
  endDate: z.string().refine(val => new Date(val) > new Date(), {
    message: 'La data di fine deve essere futura'
  }),
  maxParticipants: z.number().int().min(1, 'Almeno 1 partecipante').max(1000, 'Massimo 1000 partecipanti').optional().nullable(),
  isFree: z.boolean(),
  ticketPrice: z.number().min(0, 'Il prezzo non può essere negativo').optional().nullable(),
  coverImage: z.string().url().optional().or(z.literal('')),
}).refine(data => {
  if (!data.isFree && !data.ticketPrice) {
    return false;
  }
  return true;
}, {
  message: 'Inserisci un prezzo per eventi a pagamento',
  path: ['ticketPrice']
}).refine(data => {
  return new Date(data.endDate) > new Date(data.startDate);
}, {
  message: 'La data di fine deve essere successiva alla data di inizio',
  path: ['endDate']
});

type EventFormData = z.infer<typeof eventFormSchema>;

export default function CreateEvent() {
  const { t } = useTranslation();
  const [, setLocation] = useLocation();
  const { user } = useAuth();
  const { toast } = useToast();

  // Check authorization
  if (!user || (user.role !== 'guide' && user.role !== 'provider')) {
    return (
      <>
        <Header />
        <div className="min-h-screen bg-background flex items-center justify-center">
          <Card className="p-12 text-center">
            <h2 className="text-2xl font-semibold mb-2">Non autorizzato</h2>
            <p className="text-muted-foreground mb-6">
              Solo guide e provider possono creare eventi
            </p>
            <Button onClick={() => setLocation('/events')}>Torna agli eventi</Button>
          </Card>
        </div>
      </>
    );
  }

  const form = useForm<EventFormData>({
    resolver: zodResolver(eventFormSchema),
    defaultValues: {
      title: '',
      description: '',
      category: 'cultura',
      locationName: '',
      latitude: null,
      longitude: null,
      startDate: '',
      endDate: '',
      maxParticipants: 50,
      isFree: true,
      ticketPrice: null,
      coverImage: ''
    }
  });

  const createMutation = useMutation({
    mutationFn: async (data: EventFormData) => {
      const payload = {
        ...data,
        // Convert empty string to null for optional fields
        coverImage: data.coverImage || null,
        latitude: data.latitude || null,
        longitude: data.longitude || null,
        maxParticipants: data.maxParticipants || null,
        ticketPrice: data.isFree ? null : (data.ticketPrice?.toString() || null),
      };
      
      return await apiRequest('POST', '/api/events', payload);
    },
    onSuccess: (event: any) => {
      toast({ title: 'Evento creato!', description: 'Il tuo evento è stato pubblicato con successo' });
      setLocation(`/events/${event.id}`);
    },
    onError: (error: any) => {
      toast({ 
        title: 'Errore', 
        description: error.message || 'Impossibile creare l\'evento',
        variant: 'destructive'
      });
    }
  });

  const isFree = form.watch('isFree');

  return (
    <>
      <Header />
      <div className="min-h-screen bg-background">
        <div className="max-w-2xl mx-auto px-4 py-12">
          <Button 
            variant="ghost" 
            onClick={() => setLocation('/events')}
            className="mb-4"
          >
            <ArrowLeft className="w-4 h-4 mr-2" /> Indietro
          </Button>

          <h1 className="text-3xl font-serif font-bold mb-2">Crea Nuovo Evento</h1>
          <p className="text-muted-foreground mb-8">
            Organizza un evento e invita la community a partecipare
          </p>

          <Form {...form}>
            <form onSubmit={form.handleSubmit((data) => createMutation.mutate(data))} className="space-y-6">
              <FormField
                control={form.control}
                name="title"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Titolo</FormLabel>
                    <FormControl>
                      <Input {...field} placeholder="Es: Workshop di fotografia urbana" data-testid="input-title" />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="description"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Descrizione</FormLabel>
                    <FormControl>
                      <Textarea 
                        {...field} 
                        rows={5} 
                        placeholder="Descrivi il tuo evento in dettaglio..." 
                        data-testid="input-description" 
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="category"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Categoria</FormLabel>
                    <Select onValueChange={field.onChange} defaultValue={field.value}>
                      <FormControl>
                        <SelectTrigger data-testid="select-category">
                          <SelectValue />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        <SelectItem value="cultura">Cultura</SelectItem>
                        <SelectItem value="musica">Musica</SelectItem>
                        <SelectItem value="sport">Sport</SelectItem>
                        <SelectItem value="cibo">Cibo & Bevande</SelectItem>
                        <SelectItem value="networking">Networking</SelectItem>
                        <SelectItem value="workshop">Workshop</SelectItem>
                        <SelectItem value="festival">Festival</SelectItem>
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <div className="grid grid-cols-2 gap-4">
                <FormField
                  control={form.control}
                  name="startDate"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Data e Ora Inizio</FormLabel>
                      <FormControl>
                        <Input 
                          type="datetime-local" 
                          {...field} 
                          data-testid="input-start-date"
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="endDate"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Data e Ora Fine</FormLabel>
                      <FormControl>
                        <Input 
                          type="datetime-local" 
                          {...field} 
                          data-testid="input-end-date"
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              <FormField
                control={form.control}
                name="locationName"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Luogo</FormLabel>
                    <FormControl>
                      <Input {...field} placeholder="Es: Piazza Duomo, Milano" data-testid="input-location" />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <div className="grid grid-cols-2 gap-4">
                <FormField
                  control={form.control}
                  name="latitude"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Latitudine (opzionale)</FormLabel>
                      <FormControl>
                        <Input 
                          type="number" 
                          step="0.000001"
                          {...field} 
                          value={field.value ?? ''}
                          onChange={(e) => field.onChange(e.target.value ? parseFloat(e.target.value) : null)}
                          data-testid="input-latitude"
                          placeholder="45.464664"
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="longitude"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Longitudine (opzionale)</FormLabel>
                      <FormControl>
                        <Input 
                          type="number" 
                          step="0.000001"
                          {...field} 
                          value={field.value ?? ''}
                          onChange={(e) => field.onChange(e.target.value ? parseFloat(e.target.value) : null)}
                          data-testid="input-longitude"
                          placeholder="9.188540"
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              <FormField
                control={form.control}
                name="maxParticipants"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Max Partecipanti (opzionale)</FormLabel>
                    <FormControl>
                      <Input 
                        type="number" 
                        {...field} 
                        value={field.value ?? ''}
                        onChange={(e) => field.onChange(e.target.value ? parseInt(e.target.value) : null)}
                        data-testid="input-max-participants"
                        placeholder="Lascia vuoto per illimitato"
                      />
                    </FormControl>
                    <FormDescription>
                      Lascia vuoto se non ci sono limiti al numero di partecipanti
                    </FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="isFree"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Tipo di Evento</FormLabel>
                    <Select 
                      onValueChange={(value) => field.onChange(value === 'true')} 
                      defaultValue={field.value ? 'true' : 'false'}
                    >
                      <FormControl>
                        <SelectTrigger data-testid="select-is-free">
                          <SelectValue />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        <SelectItem value="true">Gratuito</SelectItem>
                        <SelectItem value="false">A Pagamento</SelectItem>
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />

              {!isFree && (
                <FormField
                  control={form.control}
                  name="ticketPrice"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Prezzo Biglietto (€)</FormLabel>
                      <FormControl>
                        <Input 
                          type="number" 
                          step="0.01"
                          {...field} 
                          value={field.value ?? ''}
                          onChange={(e) => field.onChange(e.target.value ? parseFloat(e.target.value) : null)}
                          data-testid="input-price"
                          placeholder="0.00"
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              )}

              <FormField
                control={form.control}
                name="coverImage"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>URL Immagine di Copertina (opzionale)</FormLabel>
                    <FormControl>
                      <Input {...field} data-testid="input-image-url" placeholder="https://..." />
                    </FormControl>
                    <FormDescription>
                      Inserisci l'URL di un'immagine per il tuo evento
                    </FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <Button 
                type="submit" 
                className="w-full"
                disabled={createMutation.isPending}
                data-testid="button-create-event"
              >
                {createMutation.isPending ? 'Creazione in corso...' : 'Crea Evento'}
              </Button>
            </form>
          </Form>
        </div>
      </div>
    </>
  );
}
