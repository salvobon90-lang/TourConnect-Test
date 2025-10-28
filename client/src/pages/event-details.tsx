import { useParams, useLocation } from 'wouter';
import { useTranslation } from 'react-i18next';
import { useQuery, useMutation } from '@tanstack/react-query';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { ArrowLeft, Calendar, Users, MapPin, Clock } from 'lucide-react';
import type { Event, User, EventParticipant } from '@shared/schema';
import { Skeleton } from '@/components/ui/skeleton';
import { useAuth } from '@/hooks/useAuth';
import { Header } from '@/components/layout/Header';
import { format } from 'date-fns';
import { it } from 'date-fns/locale';
import { useToast } from '@/hooks/use-toast';
import { apiRequest, queryClient } from '@/lib/queryClient';

type EventWithDetails = Event & {
  creator: User;
  participantsCount: number;
  spotsLeft: number | null;
};

type ParticipantWithUser = EventParticipant & {
  user: User;
};

export default function EventDetails() {
  const { t } = useTranslation();
  const { id } = useParams();
  const [, setLocation] = useLocation();
  const { user } = useAuth();
  const { toast } = useToast();

  const { data: event, isLoading } = useQuery<EventWithDetails>({
    queryKey: ['/api/events', id],
    queryFn: async () => {
      const res = await fetch(`/api/events/${id}`, {
        credentials: 'include'
      });
      if (!res.ok) throw new Error('Failed to fetch event');
      return res.json();
    },
    enabled: !!id,
  });

  // RSVP mutation
  const rsvpMutation = useMutation({
    mutationFn: async () => {
      const res = await apiRequest('POST', `/api/events/${id}/rsvp`, { ticketsCount: 1 });
      return await res.json();
    },
    onSuccess: (data: any) => {
      if (data.checkoutUrl) {
        // Paid event - redirect to Stripe
        window.location.href = data.checkoutUrl;
      } else {
        // Free event - show success
        toast({ title: 'RSVP confermato!', description: 'Ti sei iscritto con successo all\'evento' });
        
        // Invalidate ALL event-related queries to ensure UI updates
        queryClient.invalidateQueries({ queryKey: ['/api/events'] }); // All events
        queryClient.invalidateQueries({ queryKey: ['/api/events', id] }); // This event
        queryClient.invalidateQueries({ queryKey: ['/api/events', id, 'participants'] }); // Participants
        queryClient.invalidateQueries({ queryKey: ['/api/users/me/events'] }); // My events
      }
    },
    onError: (error: any) => {
      toast({ 
        title: 'Errore', 
        description: error.message || 'Impossibile effettuare RSVP',
        variant: 'destructive'
      });
    }
  });

  // Cancel RSVP mutation
  const cancelMutation = useMutation({
    mutationFn: async () => {
      await apiRequest('DELETE', `/api/events/${id}/rsvp`);
    },
    onSuccess: () => {
      toast({ title: 'RSVP cancellato', description: 'La tua iscrizione è stata annullata' });
      
      // Invalidate ALL event-related queries to ensure UI updates
      queryClient.invalidateQueries({ queryKey: ['/api/events'] }); // All events
      queryClient.invalidateQueries({ queryKey: ['/api/events', id] }); // This event
      queryClient.invalidateQueries({ queryKey: ['/api/events', id, 'participants'] }); // Participants
      queryClient.invalidateQueries({ queryKey: ['/api/users/me/events'] }); // My events
    },
    onError: (error: any) => {
      toast({ 
        title: 'Errore', 
        description: error.message || 'Impossibile cancellare RSVP',
        variant: 'destructive'
      });
    }
  });

  // Fetch participants
  const { data: participants } = useQuery<ParticipantWithUser[]>({
    queryKey: ['/api/events', id, 'participants'],
    queryFn: async () => {
      const res = await fetch(`/api/events/${id}/participants`, {
        credentials: 'include'
      });
      if (!res.ok) throw new Error('Failed to fetch participants');
      return res.json();
    },
    enabled: !!id,
  });

  if (isLoading) {
    return (
      <>
        <Header />
        <div className="min-h-screen bg-background">
          <div className="max-w-7xl mx-auto px-4 py-12">
            <Skeleton className="w-full h-96 mb-8" />
            <Skeleton className="h-12 w-3/4 mb-4" />
            <Skeleton className="h-32 w-full" />
          </div>
        </div>
      </>
    );
  }

  if (!event) {
    return (
      <>
        <Header />
        <div className="min-h-screen bg-background flex items-center justify-center">
          <Card className="p-12 text-center">
            <h2 className="text-2xl font-semibold mb-2">Evento non trovato</h2>
            <p className="text-muted-foreground mb-6">L'evento che stai cercando non esiste</p>
            <Button onClick={() => setLocation('/events')}>Torna agli eventi</Button>
          </Card>
        </div>
      </>
    );
  }

  const isRegistered = participants?.some(p => 
    p.userId === user?.id && p.status !== 'cancelled'
  );
  const isFull = event.maxParticipants && event.spotsLeft === 0;
  const isOwner = user?.id === event.createdBy;

  return (
    <>
      <Header />
      <div className="min-h-screen bg-background">
        <div className="max-w-7xl mx-auto px-4 py-12">
          <Button 
            variant="ghost" 
            onClick={() => setLocation('/events')}
            data-testid="button-back"
            className="mb-4"
          >
            <ArrowLeft className="w-4 h-4 mr-2" /> Indietro
          </Button>

          {/* Hero Image */}
          {(event.coverImage || event.images?.[0]) && (
            <img
              src={event.coverImage || event.images?.[0]}
              alt={event.title}
              className="w-full h-96 object-cover rounded-lg mb-8"
              data-testid="event-image"
            />
          )}

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            {/* Main Content */}
            <div className="lg:col-span-2 space-y-6">
              <div>
                <div className="flex items-center gap-4 mb-4">
                  <Badge variant="secondary">{event.category}</Badge>
                  {event.status !== 'active' && (
                    <Badge variant="destructive">{event.status}</Badge>
                  )}
                </div>
                <h1 className="text-4xl font-serif font-bold mb-4">{event.title}</h1>
                <p className="text-lg text-foreground">{event.description}</p>
              </div>

              {/* Event Details */}
              <Card className="p-6">
                <h3 className="text-xl font-semibold mb-4">Dettagli Evento</h3>
                <div className="space-y-3">
                  <div className="flex items-center gap-3">
                    <Calendar className="w-5 h-5 text-muted-foreground" />
                    <div>
                      <p className="font-medium">Data inizio</p>
                      <p className="text-foreground">
                        {format(new Date(event.startDate), 'EEEE, dd MMMM yyyy · HH:mm', { locale: it })}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-3">
                    <Clock className="w-5 h-5 text-muted-foreground" />
                    <div>
                      <p className="font-medium">Data fine</p>
                      <p className="text-foreground">
                        {format(new Date(event.endDate), 'EEEE, dd MMMM yyyy · HH:mm', { locale: it })}
                      </p>
                    </div>
                  </div>
                  {event.locationName && (
                    <div className="flex items-start gap-3">
                      <MapPin className="w-5 h-5 text-muted-foreground mt-1" />
                      <div>
                        <p className="font-medium">Luogo</p>
                        <p className="text-foreground">{event.locationName}</p>
                      </div>
                    </div>
                  )}
                </div>
              </Card>

              {/* Participants */}
              <Card className="p-6">
                <h3 className="text-xl font-semibold mb-4">
                  Partecipanti ({event.participantsCount}
                  {event.maxParticipants ? `/${event.maxParticipants}` : ''})
                </h3>
                {participants && participants.length > 0 ? (
                  <div className="flex flex-wrap gap-2">
                    {participants
                      .filter(p => p.status !== 'cancelled')
                      .map((p) => (
                        <div key={p.id} className="flex items-center gap-2">
                          <Avatar className="h-10 w-10">
                            <AvatarImage src={p.user.profileImageUrl || undefined} />
                            <AvatarFallback>
                              {p.user.firstName?.[0]}{p.user.lastName?.[0]}
                            </AvatarFallback>
                          </Avatar>
                        </div>
                      ))}
                  </div>
                ) : (
                  <p className="text-muted-foreground">Nessun partecipante ancora</p>
                )}
              </Card>

              {/* Map Placeholder */}
              {event.latitude && event.longitude && (
                <Card className="p-6">
                  <h3 className="text-xl font-semibold mb-4">Posizione</h3>
                  <div className="h-64 bg-muted rounded-lg flex items-center justify-center">
                    <p className="text-muted-foreground">
                      Mappa: {event.latitude.toFixed(6)}, {event.longitude.toFixed(6)}
                    </p>
                  </div>
                </Card>
              )}
            </div>

            {/* Sidebar */}
            <div className="lg:col-span-1">
              <Card className="p-6 sticky top-24">
                <CardHeader className="px-0 pt-0">
                  <CardTitle>
                    {event.isFree ? (
                      <span className="text-2xl font-bold">Gratuito</span>
                    ) : (
                      <span className="text-2xl font-bold">€{event.ticketPrice}</span>
                    )}
                  </CardTitle>
                </CardHeader>
                <CardContent className="px-0 pb-0">
                  <div className="space-y-4 mb-6">
                    {event.maxParticipants && (
                      <div className="flex items-center gap-2 text-foreground">
                        <Users className="w-4 h-4 text-muted-foreground" />
                        <span>{event.spotsLeft} posti disponibili</span>
                      </div>
                    )}
                  </div>

                  {user && !isOwner && (
                    <>
                      {isRegistered ? (
                        <>
                          <Badge variant="default" className="w-full justify-center py-2 mb-2">
                            ✓ Registrato
                          </Badge>
                          <Button 
                            variant="outline" 
                            className="w-full"
                            onClick={() => cancelMutation.mutate()}
                            disabled={cancelMutation.isPending}
                            data-testid="button-cancel-rsvp"
                          >
                            {cancelMutation.isPending ? 'Annullamento...' : 'Annulla RSVP'}
                          </Button>
                        </>
                      ) : (
                        <Button 
                          className="w-full"
                          onClick={() => rsvpMutation.mutate()}
                          disabled={isFull || rsvpMutation.isPending || event.status !== 'active'}
                          data-testid="button-rsvp"
                        >
                          {rsvpMutation.isPending ? 'Iscrizione...' : isFull ? 'Sold Out' : event.status !== 'active' ? 'Non disponibile' : 'RSVP'}
                        </Button>
                      )}
                    </>
                  )}

                  {!user && (
                    <Button 
                      className="w-full"
                      onClick={() => setLocation('/role-selection')}
                      data-testid="button-login-to-rsvp"
                    >
                      Accedi per partecipare
                    </Button>
                  )}

                  {isOwner && (
                    <Badge variant="secondary" className="w-full justify-center py-2">
                      Sei l'organizzatore
                    </Badge>
                  )}
                </CardContent>
              </Card>

              {/* Creator Info */}
              <Card className="p-6 mt-4">
                <CardHeader className="px-0 pt-0">
                  <CardTitle>Organizzato da</CardTitle>
                </CardHeader>
                <CardContent className="px-0 pb-0">
                  <div className="flex items-center gap-3">
                    <Avatar className="h-12 w-12">
                      <AvatarImage src={event.creator.profileImageUrl || undefined} />
                      <AvatarFallback>
                        {event.creator.firstName?.[0]}{event.creator.lastName?.[0]}
                      </AvatarFallback>
                    </Avatar>
                    <div>
                      <p className="font-semibold">
                        {event.creator.firstName} {event.creator.lastName}
                      </p>
                      <p className="text-sm text-muted-foreground capitalize">
                        {event.creator.role}
                      </p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}
