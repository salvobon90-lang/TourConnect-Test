import { useTranslation } from 'react-i18next';
import { useAuth } from '@/hooks/useAuth';
import { useQuery } from '@tanstack/react-query';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Calendar, MapPin, Users, ArrowLeft, Star } from 'lucide-react';
import type { BookingWithDetails, Review } from '@shared/schema';
import { Skeleton } from '@/components/ui/skeleton';
import { Link } from 'wouter';
import { format } from 'date-fns';
import { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { CreateReviewForm } from '@/components/reviews/CreateReviewForm';

export default function Bookings() {
  const { t } = useTranslation();
  const { isAuthenticated } = useAuth();
  const [reviewDialogOpen, setReviewDialogOpen] = useState(false);
  const [selectedBookingId, setSelectedBookingId] = useState<string | null>(null);

  const { data: bookings, isLoading } = useQuery<BookingWithDetails[]>({
    queryKey: ['/api/bookings'],
    enabled: isAuthenticated,
  });

  const { data: reviews } = useQuery<Review[]>({
    queryKey: ['/api/reviews'],
    enabled: isAuthenticated,
  });

  const getReviewForBooking = (bookingId: string) => {
    return reviews?.find(review => review.bookingId === bookingId);
  };

  const handleLeaveReview = (bookingId: string) => {
    setSelectedBookingId(bookingId);
    setReviewDialogOpen(true);
  };

  const handleReviewSuccess = () => {
    setReviewDialogOpen(false);
    setSelectedBookingId(null);
  };

  return (
    <div className="min-h-screen bg-background">
      <header className="border-b bg-card sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 py-4 flex items-center gap-4">
          <Link href="/">
            <Button variant="ghost" size="icon" data-testid="button-back">
              <ArrowLeft className="w-5 h-5" />
            </Button>
          </Link>
          <h1 className="text-2xl font-serif font-semibold">{t('bookings.title')}</h1>
        </div>
      </header>

      <div className="max-w-7xl mx-auto px-4 py-12">
        {isLoading ? (
          <div className="space-y-4">
            {[1, 2, 3].map((i) => (
              <Card key={i} className="p-6">
                <div className="flex gap-4">
                  <Skeleton className="w-32 h-32 rounded-lg" />
                  <div className="flex-1 space-y-3">
                    <Skeleton className="h-6 w-3/4" />
                    <Skeleton className="h-4 w-full" />
                    <Skeleton className="h-4 w-1/2" />
                  </div>
                </div>
              </Card>
            ))}
          </div>
        ) : bookings && bookings.length > 0 ? (
          <div className="space-y-4">
            {bookings.map((booking) => (
              <Card key={booking.id} className="p-6 hover-elevate" data-testid={`booking-card-${booking.id}`}>
                <div className="flex gap-6">
                  <div className="w-32 h-32 rounded-lg overflow-hidden flex-shrink-0">
                    <img
                      src={booking.tour.images[0] || 'https://images.unsplash.com/photo-1469854523086-cc02fe5d8800?q=80&w=2021'}
                      alt={booking.tour.title}
                      className="w-full h-full object-cover"
                    />
                  </div>
                  <div className="flex-1">
                    <div className="flex items-start justify-between mb-2">
                      <div>
                        <h3 className="text-xl font-semibold mb-1">{booking.tour.title}</h3>
                        <div className="flex items-center gap-2">
                          <Badge variant={booking.status === 'confirmed' ? 'default' : 'secondary'}>
                            {booking.status}
                          </Badge>
                          <Badge variant={booking.paymentStatus === 'paid' ? 'default' : 'secondary'}>
                            {booking.paymentStatus}
                          </Badge>
                        </div>
                      </div>
                      <div className="text-right">
                        <p className="text-2xl font-semibold">${booking.totalAmount}</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-6 text-sm text-muted-foreground mb-4">
                      <div className="flex items-center gap-1">
                        <Calendar className="w-4 h-4" />
                        {format(new Date(booking.bookingDate), 'PPP')}
                      </div>
                      <div className="flex items-center gap-1">
                        <Users className="w-4 h-4" />
                        {t('bookings.participants', { count: booking.participants })}
                      </div>
                      <div className="flex items-center gap-1">
                        <MapPin className="w-4 h-4" />
                        {booking.tour.meetingPoint}
                      </div>
                    </div>
                    {booking.specialRequests && (
                      <p className="text-sm text-muted-foreground mb-4">
                        <strong>Special requests:</strong> {booking.specialRequests}
                      </p>
                    )}
                    <div className="flex gap-2">
                      <Button variant="outline" size="sm">{t('actions.viewDetails')}</Button>
                      {booking.status === 'pending' && (
                        <Button variant="outline" size="sm">{t('bookings.cancelBooking')}</Button>
                      )}
                      {booking.status === 'completed' && !getReviewForBooking(booking.id) && (
                        <Button 
                          variant="outline" 
                          size="sm"
                          onClick={() => handleLeaveReview(booking.id)}
                          data-testid={`leave-review-${booking.id}`}
                        >
                          <Star className="w-4 h-4 mr-1" />
                          {t('reviews.leaveReview')}
                        </Button>
                      )}
                      {booking.status === 'completed' && getReviewForBooking(booking.id) && (
                        <Button 
                          variant="outline" 
                          size="sm"
                          data-testid={`view-review-${booking.id}`}
                        >
                          <Star className="w-4 h-4 mr-1 fill-current" />
                          {t('reviews.viewReview')}
                        </Button>
                      )}
                    </div>
                  </div>
                </div>
              </Card>
            ))}
          </div>
        ) : (
          <Card className="p-12 text-center">
            <Calendar className="w-16 h-16 text-muted-foreground mx-auto mb-4" />
            <h3 className="text-xl font-semibold mb-2">{t('bookings.noBookings')}</h3>
            <p className="text-muted-foreground mb-6">
              {t('bookings.noBookingsDesc')}
            </p>
            <Link href="/">
              <Button>{t('navigation.discover')}</Button>
            </Link>
          </Card>
        )}
      </div>

      <Dialog open={reviewDialogOpen} onOpenChange={setReviewDialogOpen}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>{t('reviews.leaveReview')}</DialogTitle>
          </DialogHeader>
          {selectedBookingId && (
            <CreateReviewForm 
              bookingId={selectedBookingId} 
              onSuccess={handleReviewSuccess}
            />
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
