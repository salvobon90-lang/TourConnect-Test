import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useQuery } from '@tanstack/react-query';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { AnimatedCard } from '@/components/ui/animated-card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Search, Calendar, Users, MapPin, Clock } from 'lucide-react';
import type { Event, User } from '@shared/schema';
import { Skeleton } from '@/components/ui/skeleton';
import { Link, useLocation } from 'wouter';
import { useAuth } from '@/hooks/useAuth';
import { Header } from '@/components/layout/Header';
import { format } from 'date-fns';

type EventWithCreator = Event & {
  creator: User;
  participantsCount: number;
  spotsLeft: number | null;
};

export default function Events() {
  const { t } = useTranslation();
  const [, setLocation] = useLocation();
  const { user } = useAuth();
  const [searchTerm, setSearchTerm] = useState('');
  const [category, setCategory] = useState<string>('');
  const [isFree, setIsFree] = useState<string>('');

  // Build query parameters
  const queryParams = new URLSearchParams();
  if (category) queryParams.append('category', category);
  if (isFree === 'true') queryParams.append('isFree', 'true');
  if (isFree === 'false') queryParams.append('isFree', 'false');
  
  const queryString = queryParams.toString();
  const queryUrl = queryString ? `/api/events?${queryString}` : '/api/events';

  const { data: events, isLoading } = useQuery<EventWithCreator[]>({
    queryKey: [queryUrl],
  });

  // Client-side search filter
  const filteredEvents = events?.filter(event => {
    if (searchTerm) {
      const searchLower = searchTerm.toLowerCase();
      return (
        event.title.toLowerCase().includes(searchLower) ||
        event.description.toLowerCase().includes(searchLower) ||
        event.locationName?.toLowerCase().includes(searchLower)
      );
    }
    return true;
  });

  return (
    <>
      <Header />
      <div className="min-h-screen bg-background">
        {/* Hero Section */}
        <section className="relative h-80 flex items-center justify-center overflow-hidden">
          <div 
            className="absolute inset-0 bg-cover bg-center"
            style={{
              backgroundImage: 'linear-gradient(rgba(0, 0, 0, 0.5), rgba(0, 0, 0, 0.5)), url(https://images.unsplash.com/photo-1540575467063-178a50c2df87?q=80&w=2940)',
              backgroundPosition: 'center',
            }}
          />
          <div className="relative z-10 text-center max-w-4xl mx-auto px-4">
            <h1 className="text-4xl md:text-5xl font-serif font-bold text-white mb-4">
              Eventi Locali
            </h1>
            <p className="text-xl text-white/90 mb-8">
              Scopri eventi nella tua zona, partecipa e connettiti con la community
            </p>
            
            {/* Search Bar */}
            <Card className="p-4 bg-white/95 backdrop-blur-md">
              <div className="flex flex-col gap-3">
                <div className="flex flex-col md:flex-row gap-3">
                  <div className="flex-1 relative">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
                    <Input
                      placeholder="Cerca eventi..."
                      className="pl-10"
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                      data-testid="input-search"
                    />
                  </div>
                </div>
                
                {/* Filters */}
                <div className="flex flex-wrap gap-2">
                  <Select value={category || "all"} onValueChange={(value) => setCategory(value === "all" ? "" : value)}>
                    <SelectTrigger className="w-40" data-testid="select-category">
                      <SelectValue placeholder="Categoria" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">Tutte</SelectItem>
                      <SelectItem value="cultura">Cultura</SelectItem>
                      <SelectItem value="musica">Musica</SelectItem>
                      <SelectItem value="sport">Sport</SelectItem>
                      <SelectItem value="cibo">Cibo & Bevande</SelectItem>
                      <SelectItem value="networking">Networking</SelectItem>
                      <SelectItem value="workshop">Workshop</SelectItem>
                      <SelectItem value="festival">Festival</SelectItem>
                    </SelectContent>
                  </Select>
                  
                  <Select value={isFree || "all"} onValueChange={(value) => setIsFree(value === "all" ? "" : value)}>
                    <SelectTrigger className="w-40" data-testid="select-price">
                      <SelectValue placeholder="Prezzo" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">Tutti</SelectItem>
                      <SelectItem value="true">Gratuiti</SelectItem>
                      <SelectItem value="false">A Pagamento</SelectItem>
                    </SelectContent>
                  </Select>
                  
                  {(searchTerm || category || isFree) && (
                    <Button 
                      variant="outline" 
                      size="sm"
                      onClick={() => {
                        setSearchTerm('');
                        setCategory('');
                        setIsFree('');
                      }}
                      data-testid="button-clear-filters"
                    >
                      Cancella Filtri
                    </Button>
                  )}
                </div>
              </div>
            </Card>
          </div>
        </section>

        {/* Events Grid Section */}
        <section className="py-12 px-4">
          <div className="max-w-7xl mx-auto">
            <div className="flex items-center justify-between mb-8">
              <div>
                <h2 className="text-3xl font-serif font-semibold">Eventi Disponibili</h2>
                <p className="text-muted-foreground mt-2">
                  {filteredEvents ? `${filteredEvents.length} eventi trovati` : 'Caricamento...'}
                </p>
              </div>
              
              {user && (user.role === 'guide' || user.role === 'provider') && (
                <Button onClick={() => setLocation('/events/new')} data-testid="button-create-event">
                  Crea Evento
                </Button>
              )}
            </div>

            {/* Loading State */}
            {isLoading && (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {[1, 2, 3, 4, 5, 6].map((i) => (
                  <Card key={i} className="overflow-hidden">
                    <Skeleton className="h-48 w-full" />
                    <div className="p-4 space-y-3">
                      <Skeleton className="h-6 w-3/4" />
                      <Skeleton className="h-4 w-full" />
                      <Skeleton className="h-4 w-full" />
                      <Skeleton className="h-10 w-full" />
                    </div>
                  </Card>
                ))}
              </div>
            )}

            {/* Empty State */}
            {!isLoading && filteredEvents?.length === 0 && (
              <Card className="p-12 text-center">
                <Calendar className="w-16 h-16 mx-auto mb-4 text-muted-foreground" />
                <h3 className="text-2xl font-semibold mb-2">Nessun evento trovato</h3>
                <p className="text-muted-foreground mb-6">
                  Prova a modificare i filtri o crea un nuovo evento
                </p>
                <Button 
                  onClick={() => {
                    setSearchTerm('');
                    setCategory('');
                    setIsFree('');
                  }}
                  data-testid="button-clear-all"
                >
                  Cancella Filtri
                </Button>
              </Card>
            )}

            {/* Events Grid */}
            {!isLoading && filteredEvents && filteredEvents.length > 0 && (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {filteredEvents.map((event) => (
                  <AnimatedCard 
                    key={event.id} 
                    className="overflow-hidden hover-elevate cursor-pointer" 
                    onClick={() => setLocation(`/events/${event.id}`)}
                    data-testid={`card-event-${event.id}`}
                    enableTilt
                  >
                    <div className="relative h-48 overflow-hidden">
                      <img
                        src={event.coverImage || event.images?.[0] || 'https://images.unsplash.com/photo-1540575467063-178a50c2df87?q=80&w=2940'}
                        alt={event.title}
                        className="w-full h-full object-cover"
                      />
                      <div className="absolute top-3 right-3">
                        {event.isFree ? (
                          <Badge className="bg-white/90 text-foreground">
                            Gratuito
                          </Badge>
                        ) : (
                          <Badge className="bg-white/90 text-foreground">
                            €{event.ticketPrice}
                          </Badge>
                        )}
                      </div>
                      {event.spotsLeft === 0 && (
                        <div className="absolute top-3 left-3">
                          <Badge variant="destructive">Sold Out</Badge>
                        </div>
                      )}
                    </div>
                    <CardHeader>
                      <div className="flex items-center gap-2 mb-2">
                        <Badge variant="secondary" data-testid={`badge-category-${event.id}`}>
                          {event.category}
                        </Badge>
                      </div>
                      <CardTitle className="line-clamp-1" data-testid={`text-title-${event.id}`}>
                        {event.title}
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      <p className="text-sm text-muted-foreground mb-4 line-clamp-2" data-testid={`text-description-${event.id}`}>
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
                        {event.maxParticipants && (
                          <div className="flex items-center gap-2">
                            <Users className="w-4 h-4 text-muted-foreground" />
                            <span>{event.participantsCount}/{event.maxParticipants} partecipanti</span>
                          </div>
                        )}
                      </div>
                    </CardContent>
                  </AnimatedCard>
                ))}
              </div>
            )}
          </div>
        </section>
      </div>
    </>
  );
}
