import { useLocation } from 'wouter';
import { useTranslation } from 'react-i18next';
import { useQuery } from '@tanstack/react-query';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Calendar, MapPin, Users, Clock } from 'lucide-react';
import type { Event, User, EventParticipant } from '@shared/schema';
import { Skeleton } from '@/components/ui/skeleton';
import { useAuth } from '@/hooks/useAuth';
import { Header } from '@/components/layout/Header';
import { format } from 'date-fns';

type EventWithCreator = Event & {
  creator: User;
  participantsCount: number;
  spotsLeft: number | null;
};

type ParticipationWithEvent = EventParticipant & {
  event: EventWithCreator;
};

export default function MyEvents() {
  const { t } = useTranslation();
  const [, setLocation] = useLocation();
  const { user } = useAuth();

  // Fetch events user has RSVP'd to
  const { data: myEvents, isLoading } = useQuery<EventWithCreator[]>({
    queryKey: ['/api/users/me/events'],
    enabled: !!user,
  });

  const now = new Date();
  const upcomingEvents = myEvents?.filter(event => new Date(event.startDate) > now) || [];
  const pastEvents = myEvents?.filter(event => new Date(event.startDate) <= now) || [];

  if (!user) {
    return (
      <>
        <Header />
        <div className="min-h-screen bg-background flex items-center justify-center">
          <Card className="p-12 text-center">
            <h2 className="text-2xl font-semibold mb-2">Accedi</h2>
            <p className="text-muted-foreground mb-6">
              Devi effettuare l'accesso per vedere i tuoi eventi
            </p>
            <Button onClick={() => setLocation('/role-selection')}>Accedi</Button>
          </Card>
        </div>
      </>
    );
  }

  return (
    <>
      <Header />
      <div className="min-h-screen bg-background">
        <div className="max-w-7xl mx-auto px-4 py-12">
          <div className="flex items-center justify-between mb-8">
            <div>
              <h1 className="text-3xl font-serif font-bold mb-2">I Miei Eventi</h1>
              <p className="text-muted-foreground">
                Eventi a cui hai partecipato o che hai organizzato
              </p>
            </div>
            
            {(user.role === 'guide' || user.role === 'provider') && (
              <Button onClick={() => setLocation('/events/new')} data-testid="button-create-event">
                Crea Evento
              </Button>
            )}
          </div>

          <Tabs defaultValue="upcoming" className="space-y-6">
            <TabsList>
              <TabsTrigger value="upcoming" data-testid="tab-upcoming">
                In Arrivo ({upcomingEvents.length})
              </TabsTrigger>
              <TabsTrigger value="past" data-testid="tab-past">
                Passati ({pastEvents.length})
              </TabsTrigger>
            </TabsList>

            <TabsContent value="upcoming" className="space-y-4">
              {isLoading ? (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                  {[1, 2, 3].map((i) => (
                    <Card key={i} className="overflow-hidden">
                      <Skeleton className="h-48 w-full" />
                      <div className="p-4 space-y-3">
                        <Skeleton className="h-6 w-3/4" />
                        <Skeleton className="h-4 w-full" />
                      </div>
                    </Card>
                  ))}
                </div>
              ) : upcomingEvents.length === 0 ? (
                <Card className="p-12 text-center">
                  <Calendar className="w-16 h-16 mx-auto mb-4 text-muted-foreground" />
                  <h3 className="text-2xl font-semibold mb-2">Nessun evento in arrivo</h3>
                  <p className="text-muted-foreground mb-6">
                    Non hai ancora eventi in programma
                  </p>
                  <Button onClick={() => setLocation('/events')} data-testid="button-browse-events">
                    Esplora Eventi
                  </Button>
                </Card>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                  {upcomingEvents.map((event) => (
                    <Card 
                      key={event.id} 
                      className="overflow-hidden hover-elevate cursor-pointer"
                      onClick={() => setLocation(`/events/${event.id}`)}
                      data-testid={`card-event-${event.id}`}
                    >
                      <div className="relative h-48 overflow-hidden">
                        <img
                          src={event.coverImage || event.images?.[0] || 'https://images.unsplash.com/photo-1540575467063-178a50c2df87?q=80&w=2940'}
                          alt={event.title}
                          className="w-full h-full object-cover"
                        />
                        <div className="absolute top-3 right-3">
                          {event.isFree ? (
                            <Badge className="bg-white/90 text-foreground">Gratuito</Badge>
                          ) : (
                            <Badge className="bg-white/90 text-foreground">€{event.ticketPrice}</Badge>
                          )}
                        </div>
                      </div>
                      <CardHeader>
                        <Badge variant="secondary" className="w-fit">{event.category}</Badge>
                        <CardTitle className="line-clamp-1">{event.title}</CardTitle>
                      </CardHeader>
                      <CardContent>
                        <p className="text-sm text-muted-foreground mb-4 line-clamp-2">
                          {event.description}
                        </p>
                        <div className="space-y-2 text-sm text-foreground">
                          <div className="flex items-center gap-2">
                            <Calendar className="w-4 h-4 text-muted-foreground" />
                            <span>{format(new Date(event.startDate), 'dd MMM yyyy, HH:mm')}</span>
                          </div>
                          {event.locationName && (
                            <div className="flex items-center gap-2">
                              <MapPin className="w-4 h-4 text-muted-foreground" />
                              <span className="truncate">{event.locationName}</span>
                            </div>
                          )}
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              )}
            </TabsContent>

            <TabsContent value="past" className="space-y-4">
              {isLoading ? (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                  {[1, 2, 3].map((i) => (
                    <Card key={i} className="overflow-hidden">
                      <Skeleton className="h-48 w-full" />
                      <div className="p-4 space-y-3">
                        <Skeleton className="h-6 w-3/4" />
                        <Skeleton className="h-4 w-full" />
                      </div>
                    </Card>
                  ))}
                </div>
              ) : pastEvents.length === 0 ? (
                <Card className="p-12 text-center">
                  <Clock className="w-16 h-16 mx-auto mb-4 text-muted-foreground" />
                  <h3 className="text-2xl font-semibold mb-2">Nessun evento passato</h3>
                  <p className="text-muted-foreground mb-6">
                    Non hai ancora partecipato a eventi
                  </p>
                  <Button onClick={() => setLocation('/events')} data-testid="button-browse-events-past">
                    Esplora Eventi
                  </Button>
                </Card>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                  {pastEvents.map((event) => (
                    <Card 
                      key={event.id} 
                      className="overflow-hidden hover-elevate cursor-pointer opacity-80"
                      onClick={() => setLocation(`/events/${event.id}`)}
                      data-testid={`card-event-past-${event.id}`}
                    >
                      <div className="relative h-48 overflow-hidden">
                        <img
                          src={event.coverImage || event.images?.[0] || 'https://images.unsplash.com/photo-1540575467063-178a50c2df87?q=80&w=2940'}
                          alt={event.title}
                          className="w-full h-full object-cover"
                        />
                        <div className="absolute top-3 right-3">
                          <Badge variant="secondary">Concluso</Badge>
                        </div>
                      </div>
                      <CardHeader>
                        <Badge variant="secondary" className="w-fit">{event.category}</Badge>
                        <CardTitle className="line-clamp-1">{event.title}</CardTitle>
                      </CardHeader>
                      <CardContent>
                        <p className="text-sm text-muted-foreground mb-4 line-clamp-2">
                          {event.description}
                        </p>
                        <div className="space-y-2 text-sm text-foreground">
                          <div className="flex items-center gap-2">
                            <Calendar className="w-4 h-4 text-muted-foreground" />
                            <span>{format(new Date(event.startDate), 'dd MMM yyyy, HH:mm')}</span>
                          </div>
                          {event.locationName && (
                            <div className="flex items-center gap-2">
                              <MapPin className="w-4 h-4 text-muted-foreground" />
                              <span className="truncate">{event.locationName}</span>
                            </div>
                          )}
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              )}
            </TabsContent>
          </Tabs>
        </div>
      </div>
    </>
  );
}
