import { useParams, useLocation } from 'wouter';
import { useTranslation } from 'react-i18next';
import { useQuery } from '@tanstack/react-query';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { ArrowLeft, Clock, Users, MapPin, Calendar, Maximize2 } from 'lucide-react';
import type { TourWithGuide } from '@shared/schema';
import { Skeleton } from '@/components/ui/skeleton';
import { Link } from 'wouter';
import { useAuth } from '@/hooks/useAuth';
import { SEO } from '@/components/seo';
import { ReviewsList } from '@/components/reviews/ReviewsList';
import { GroupBookingCard } from '@/components/GroupBookingCard';
import { ParticipantsList } from '@/components/ParticipantsList';
import { SmartShareCard } from '@/components/SmartShareCard';
import { PartnerBadge } from '@/components/PartnerBadge';
import { useState } from 'react';

export default function TourDetail() {
  const { t } = useTranslation();
  const { id } = useParams();
  const [, setLocation] = useLocation();
  const { user } = useAuth();
  const [selectedDate, setSelectedDate] = useState(new Date(Date.now() + 86400000)); // Tomorrow by default

  const { data: tour, isLoading } = useQuery<TourWithGuide>({
    queryKey: ['/api/tours', id],
    enabled: !!id,
  });

  if (isLoading) {
    return (
      <div className="min-h-screen bg-background">
        <header className="border-b bg-card sticky top-0 z-50">
          <div className="max-w-7xl mx-auto px-4 py-4">
            <Skeleton className="h-8 w-48" />
          </div>
        </header>
        <div className="max-w-7xl mx-auto px-4 py-12">
          <Skeleton className="w-full h-96 mb-8" />
          <Skeleton className="h-12 w-3/4 mb-4" />
          <Skeleton className="h-32 w-full" />
        </div>
      </div>
    );
  }

  if (!tour) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <Card className="p-12 text-center">
          <h2 className="text-2xl font-semibold mb-2">{t('tourDetail.notFound')}</h2>
          <p className="text-muted-foreground mb-6">{t('tourDetail.notFoundDesc')}</p>
          <Link href="/">
            <Button>{t('common.backToHome')}</Button>
          </Link>
        </Card>
      </div>
    );
  }

  const tourSchemaData = {
    "@context": "https://schema.org",
    "@type": "TouristAttraction",
    "name": tour.title,
    "description": tour.description,
    "image": tour.images,
    "offers": {
      "@type": "Offer",
      "price": tour.price,
      "priceCurrency": "EUR"
    }
  };

  return (
    <>
      <SEO 
        title={tour.title}
        description={tour.description}
        image={tour.images[0]}
        type="article"
        structuredData={tourSchemaData}
      />
      <div className="min-h-screen bg-background">
      <header className="border-b bg-card sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 py-4 flex items-center gap-4">
          <Link href="/">
            <Button variant="ghost" size="icon" data-testid="button-back">
              <ArrowLeft className="w-5 h-5" />
            </Button>
          </Link>
          <h1 className="text-2xl font-serif font-semibold">{tour.title}</h1>
        </div>
      </header>

      <div className="max-w-7xl mx-auto px-4 py-12">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          <div className="lg:col-span-2">
            {/* Images */}
            <div className="mb-8">
              <img
                src={tour.images[0] || 'https://images.unsplash.com/photo-1469854523086-cc02fe5d8800?q=80&w=2021'}
                alt={tour.title}
                className="w-full h-96 object-cover rounded-lg"
                data-testid="tour-image"
              />
            </div>

            {/* Details */}
            <div className="space-y-6">
              <div>
                <div className="flex items-center gap-4 mb-4">
                  <Badge variant="secondary">{tour.category}</Badge>
                </div>
                <h2 className="text-3xl font-serif font-bold mb-4">{tour.title}</h2>
                <p className="text-lg text-foreground">{tour.description}</p>
              </div>

              <Card className="p-6">
                <h3 className="text-xl font-semibold mb-4">{t('tourDetail.whatToExpect')}</h3>
                <p className="text-foreground whitespace-pre-wrap">{tour.itinerary}</p>
              </Card>

              <Card className="p-6">
                <h3 className="text-xl font-semibold mb-4">{t('tourDetail.whatsIncluded')}</h3>
                <ul className="list-disc list-inside space-y-2">
                  {tour.included.map((item, i) => (
                    <li key={i} className="text-foreground">{item}</li>
                  ))}
                </ul>
                {tour.excluded.length > 0 && (
                  <>
                    <h3 className="text-xl font-semibold mb-4 mt-6">{t('tourDetail.whatsNotIncluded')}</h3>
                    <ul className="list-disc list-inside space-y-2">
                      {tour.excluded.map((item, i) => (
                        <li key={i} className="text-foreground">{item}</li>
                      ))}
                    </ul>
                  </>
                )}
              </Card>

              <Card className="p-6">
                <h3 className="text-xl font-semibold mb-4">{t('tourDetail.meetingPoint')}</h3>
                <div className="flex items-start gap-2">
                  <MapPin className="w-5 h-5 text-primary mt-1" />
                  <p className="text-foreground">{tour.meetingPoint}</p>
                </div>
              </Card>

              <Card className="p-6">
                <h3 className="text-xl font-semibold mb-4">{t('tourDetail.yourGuide')}</h3>
                <div className="flex items-center gap-4">
                  <div className="w-16 h-16 rounded-full bg-primary/10 flex items-center justify-center">
                    <span className="text-2xl font-semibold text-primary">
                      {tour.guide.firstName?.[0] || 'G'}
                    </span>
                  </div>
                  <div className="flex-1">
                    <div className="flex items-center gap-2 flex-wrap">
                      <Link href={`/guide/${tour.guide.id}`}>
                        <button 
                          className="font-semibold text-lg hover:text-orange-600 hover:underline transition-colors cursor-pointer text-left"
                          aria-label={`View ${tour.guide.firstName} ${tour.guide.lastName}'s profile`}
                        >
                          {tour.guide.firstName} {tour.guide.lastName}
                        </button>
                      </Link>
                      {tour.guide.verified && <PartnerBadge verified={true} size="sm" />}
                    </div>
                    <p className="text-muted-foreground">{t('roles.guide')}</p>
                  </div>
                </div>
              </Card>

              {/* Reviews Section */}
              <div className="space-y-6">
                <ReviewsList tourId={id} />
              </div>
            </div>
          </div>

          {/* Sidebar */}
          <div className="lg:col-span-1">
            <Card className="p-6 sticky top-24">
              <div className="space-y-6">
                <div>
                  <div className="flex items-baseline gap-2 mb-4">
                    <span className="text-4xl font-bold">${tour.price}</span>
                    <span className="text-muted-foreground">{t('tourDetail.perPerson')}</span>
                  </div>
                </div>

                <div className="space-y-3">
                  <div className="flex items-center gap-3 text-foreground">
                    <Clock className="w-5 h-5 text-muted-foreground" />
                    <span>
                      {Math.floor(Number(tour.duration) / 60)}h {Number(tour.duration) % 60}m
                    </span>
                  </div>
                  <div className="flex items-center gap-3 text-foreground">
                    <Users className="w-5 h-5 text-muted-foreground" />
                    <span>{t('tourDetail.maxPeople', { count: tour.maxGroupSize })}</span>
                  </div>
                  <div className="flex items-center gap-3 text-foreground">
                    <Calendar className="w-5 h-5 text-muted-foreground" />
                    <span>{t('tourDetail.availableDaily')}</span>
                  </div>
                </div>

                <Link href={`/tours/${tour.id}/3d`}>
                  <Button 
                    className="w-full" 
                    variant="outline"
                    data-testid="button-view-3d"
                  >
                    <Maximize2 className="w-4 h-4 mr-2" />
                    View in 3D
                  </Button>
                </Link>

                {/* Group Booking Option */}
                <div className="border-t pt-4">
                  <GroupBookingCard 
                    tourId={tour.id} 
                    tourDate={selectedDate}
                    tourName={tour.title}
                    showJoinButton={true}
                  />
                </div>

                <div className="border-t pt-4">
                  <p className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    {t('tourDetail.orBookIndividually')}
                  </p>
                  {user ? (
                  <Button 
                    className="w-full" 
                    size="lg"
                    onClick={() => setLocation(`/book/${tour.id}`)}
                    data-testid="button-book-now"
                  >
                    {t('actions.bookNow')}
                  </Button>
                ) : (
                  <Link href="/role-selection">
                    <Button 
                      className="w-full" 
                      size="lg"
                      variant="outline"
                      data-testid="button-login-to-book"
                    >
                      {t('tourDetail.loginToBook')}
                    </Button>
                  </Link>
                )}

                  <p className="text-sm text-center text-muted-foreground mt-4">
                    {t('tourDetail.freeCancellation')}
                  </p>
                </div>
              </div>
            </Card>
          </div>
        </div>
      </div>
    </div>

    {/* Smart Share Card - Floating Button */}
    <SmartShareCard tourId={tour.id} type="tour" />
    </>
  );
}
