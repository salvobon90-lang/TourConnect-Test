import { useParams, useLocation } from 'wouter';
import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Textarea } from '@/components/ui/textarea';
import { ArrowLeft, Star, Clock, Users, MapPin, Calendar } from 'lucide-react';
import type { TourWithGuide, Review, ReviewWithUser } from '@shared/schema';
import { Skeleton } from '@/components/ui/skeleton';
import { Link } from 'wouter';
import { useToast } from '@/hooks/use-toast';
import { apiRequest } from '@/lib/queryClient';
import { useAuth } from '@/hooks/useAuth';

export default function TourDetail() {
  const { t } = useTranslation();
  const { id } = useParams();
  const [, setLocation] = useLocation();
  const { user } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [rating, setRating] = useState(5);
  const [comment, setComment] = useState('');

  const { data: tour, isLoading } = useQuery<TourWithGuide>({
    queryKey: ['/api/tours', id],
    enabled: !!id,
  });

  const { data: reviews = [] } = useQuery<ReviewWithUser[]>({
    queryKey: [`/api/reviews?tourId=${id}`],
    enabled: !!id,
  });

  const submitReviewMutation = useMutation({
    mutationFn: async (data: { rating: number; comment: string }) => {
      const response = await apiRequest('POST', '/api/reviews', {
        tourId: id,
        rating: data.rating,
        comment: data.comment,
        images: [],
      });
      return response.json();
    },
    onSuccess: () => {
      toast({ title: t('system.success'), description: t('system.reviewSubmitted') });
      queryClient.invalidateQueries({ queryKey: [`/api/reviews?tourId=${id}`] });
      setComment('');
      setRating(5);
    },
    onError: () => {
      toast({ title: t('system.error'), description: t('system.reviewSubmissionFailed'), variant: 'destructive' });
    },
  });

  const handleSubmitReview = () => {
    if (!comment.trim()) {
      toast({ title: t('system.error'), description: t('tourDetail.addCommentRequired'), variant: 'destructive' });
      return;
    }
    submitReviewMutation.mutate({ rating, comment });
  };

  const averageRating = reviews.length > 0
    ? reviews.reduce((acc, r) => acc + r.rating, 0) / reviews.length
    : 5.0;

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

  return (
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
                  <div className="flex items-center gap-1">
                    <Star className="w-5 h-5 fill-yellow-400 text-yellow-400" />
                    <span className="font-semibold">{averageRating.toFixed(1)}</span>
                    <span className="text-muted-foreground">({reviews.length} {t('tourDetail.reviews', { count: reviews.length })})</span>
                  </div>
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
                  <div>
                    <p className="font-semibold text-lg">
                      {tour.guide.firstName} {tour.guide.lastName}
                    </p>
                    <p className="text-muted-foreground">{t('roles.guide')}</p>
                  </div>
                </div>
              </Card>

              {/* Reviews Section */}
              <Card className="p-6">
                <h3 className="text-xl font-semibold mb-6">{t('tourDetail.reviews', { count: reviews.length })} ({reviews.length})</h3>
                
                {!user && (
                  <div className="mb-8 p-6 bg-muted/30 rounded-lg text-center">
                    <p className="text-muted-foreground mb-3">
                      {t('tourDetail.loginToReview')}
                    </p>
                    <Link href="/role-selection">
                      <Button variant="outline" data-testid="button-login-to-review">
                        {t('navigation.login')}
                      </Button>
                    </Link>
                  </div>
                )}

                {user && user.role === 'tourist' && (
                  <div className="mb-8 p-4 bg-muted/30 rounded-lg">
                    <h4 className="font-semibold mb-3">{t('tourDetail.writeReview')}</h4>
                    <div className="flex items-center gap-2 mb-3">
                      <span className="text-sm font-medium">{t('tourDetail.yourRating')}:</span>
                      <div className="flex gap-1">
                        {[1, 2, 3, 4, 5].map((star) => (
                          <button
                            key={star}
                            onClick={() => setRating(star)}
                            className="focus:outline-none"
                            data-testid={`button-rating-${star}`}
                          >
                            <Star
                              className={`w-6 h-6 ${
                                star <= rating
                                  ? 'fill-yellow-400 text-yellow-400'
                                  : 'text-muted-foreground'
                              }`}
                            />
                          </button>
                        ))}
                      </div>
                      <span className="text-sm text-muted-foreground ml-2">{rating}/5</span>
                    </div>
                    <Textarea
                      placeholder={t('tourDetail.shareExperience')}
                      value={comment}
                      onChange={(e) => setComment(e.target.value)}
                      className="mb-3"
                      rows={4}
                      data-testid="input-review-comment"
                    />
                    <Button 
                      onClick={handleSubmitReview} 
                      disabled={submitReviewMutation.isPending}
                      data-testid="button-submit-review"
                    >
                      {submitReviewMutation.isPending ? t('common.submitting') : t('tourDetail.submitReview')}
                    </Button>
                  </div>
                )}

                <div className="space-y-4">
                  {reviews.length === 0 && (
                    <p className="text-center text-muted-foreground py-8">
                      {t('tourDetail.noReviews')}
                    </p>
                  )}
                  {reviews.map((review) => (
                    <div key={review.id} className="border-b pb-4 last:border-0" data-testid={`review-${review.id}`}>
                      <div className="flex items-start gap-3">
                        <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center flex-shrink-0">
                          <span className="text-sm font-semibold text-primary">
                            {review.user.firstName?.[0] || 'U'}
                          </span>
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 mb-1">
                            <span className="font-semibold">
                              {review.user.firstName} {review.user.lastName}
                            </span>
                            <div className="flex items-center gap-1">
                              {Array.from({ length: review.rating }).map((_, i) => (
                                <Star key={i} className="w-4 h-4 fill-yellow-400 text-yellow-400" />
                              ))}
                            </div>
                          </div>
                          <p className="text-sm text-muted-foreground mb-2">
                            {new Date(review.createdAt).toLocaleDateString()}
                          </p>
                          <p className="text-foreground">{review.comment}</p>
                          {review.response && (
                            <div className="mt-3 p-3 bg-muted/30 rounded-lg">
                              <p className="text-sm font-semibold mb-1">{t('tourDetail.guideResponse')}:</p>
                              <p className="text-sm text-foreground">{review.response}</p>
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </Card>
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

                <p className="text-sm text-center text-muted-foreground">
                  {t('tourDetail.freeCancellation')}
                </p>
              </div>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
}
