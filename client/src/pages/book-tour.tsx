import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useParams, useLocation } from 'wouter';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { apiRequest } from '@/lib/queryClient';
import { useToast } from '@/hooks/use-toast';
import { ArrowLeft, Calendar, Users, CreditCard, CheckCircle } from 'lucide-react';
import type { TourWithGuide } from '@shared/schema';
import { Skeleton } from '@/components/ui/skeleton';
import { Link } from 'wouter';

const bookingSchema = z.object({
  bookingDate: z.string().min(1, 'Please select a date'),
  participants: z.number().min(1, 'At least 1 participant required').max(50),
  specialRequests: z.string().optional(),
});

type BookingFormData = z.infer<typeof bookingSchema>;

export default function BookTour() {
  const { t } = useTranslation();
  const { id } = useParams();
  const [, setLocation] = useLocation();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [currentStep, setCurrentStep] = useState<'details' | 'payment' | 'confirmation'>('details');
  const [bookingId, setBookingId] = useState<string | null>(null);

  const { data: tour, isLoading } = useQuery<TourWithGuide>({
    queryKey: ['/api/tours', id],
    enabled: !!id,
  });

  const form = useForm<BookingFormData>({
    resolver: zodResolver(bookingSchema),
    defaultValues: {
      bookingDate: '',
      participants: 1,
      specialRequests: '',
    },
  });

  const participants = form.watch('participants');
  const totalAmount = tour ? Number(tour.price) * participants : 0;

  const createBookingMutation = useMutation({
    mutationFn: async (data: BookingFormData) => {
      const response = await apiRequest('POST', '/api/bookings', {
        tourId: id,
        bookingDate: new Date(data.bookingDate).toISOString(),
        participants: data.participants,
        totalAmount: totalAmount.toString(),
        specialRequests: data.specialRequests || '',
        status: 'pending',
        paymentStatus: 'pending',
      });
      return response.json();
    },
    onSuccess: (data) => {
      setBookingId(data.id);
      setCurrentStep('payment');
      queryClient.invalidateQueries({ queryKey: ['/api/bookings'] });
    },
    onError: (error: any) => {
      toast({
        title: t('system.error'),
        description: error.message || t('system.bookingFailed'),
        variant: 'destructive',
      });
    },
  });

  const processPaymentMutation = useMutation({
    mutationFn: async () => {
      if (!bookingId) throw new Error('No booking ID');
      
      const response = await apiRequest('POST', '/api/create-checkout-session', {
        bookingId,
      });
      return response.json();
    },
    onSuccess: (data: { url: string }) => {
      // Redirect to Stripe Checkout
      window.location.href = data.url;
    },
    onError: (error: any) => {
      toast({
        title: t('system.paymentError'),
        description: error.message || t('system.paymentSimulation'),
        variant: 'destructive',
      });
      
      // Fallback to simulation if Stripe is not configured
      if (error.message?.includes('not configured')) {
        apiRequest('PUT', `/api/bookings/${bookingId}`, {
          status: 'confirmed',
          paymentStatus: 'paid',
        }).then(() => {
          setCurrentStep('confirmation');
          queryClient.invalidateQueries({ queryKey: ['/api/bookings'] });
        });
      }
    },
  });

  const onSubmitDetails = (data: BookingFormData) => {
    createBookingMutation.mutate(data);
  };

  const handlePayment = () => {
    processPaymentMutation.mutate();
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-background">
        <header className="border-b bg-card sticky top-0 z-50">
          <div className="max-w-7xl mx-auto px-4 py-4">
            <Skeleton className="h-8 w-48" />
          </div>
        </header>
        <div className="max-w-4xl mx-auto px-4 py-12">
          <Skeleton className="h-96 w-full" />
        </div>
      </div>
    );
  }

  if (!tour) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <Card className="p-12 text-center">
          <h2 className="text-2xl font-semibold mb-2">{t('tourDetail.notFound')}</h2>
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
          <Link href={`/tours/${id}`}>
            <Button variant="ghost" size="icon" data-testid="button-back">
              <ArrowLeft className="w-5 h-5" />
            </Button>
          </Link>
          <h1 className="text-2xl font-serif font-semibold">{t('booking.bookTour')}</h1>
        </div>
      </header>

      <div className="max-w-4xl mx-auto px-4 py-12">
        {/* Progress indicator */}
        <div className="flex items-center justify-center gap-4 mb-12">
          <div className={`flex items-center gap-2 ${currentStep === 'details' ? 'text-primary' : 'text-muted-foreground'}`}>
            <div className={`w-8 h-8 rounded-full flex items-center justify-center ${currentStep === 'details' ? 'bg-primary text-primary-foreground' : 'bg-muted'}`}>
              1
            </div>
            <span className="font-medium">{t('booking.details')}</span>
          </div>
          <div className="w-12 h-px bg-border" />
          <div className={`flex items-center gap-2 ${currentStep === 'payment' ? 'text-primary' : 'text-muted-foreground'}`}>
            <div className={`w-8 h-8 rounded-full flex items-center justify-center ${currentStep === 'payment' ? 'bg-primary text-primary-foreground' : 'bg-muted'}`}>
              2
            </div>
            <span className="font-medium">{t('booking.payment')}</span>
          </div>
          <div className="w-12 h-px bg-border" />
          <div className={`flex items-center gap-2 ${currentStep === 'confirmation' ? 'text-primary' : 'text-muted-foreground'}`}>
            <div className={`w-8 h-8 rounded-full flex items-center justify-center ${currentStep === 'confirmation' ? 'bg-primary text-primary-foreground' : 'bg-muted'}`}>
              3
            </div>
            <span className="font-medium">{t('booking.confirm')}</span>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          <div className="lg:col-span-2">
            {currentStep === 'details' && (
              <Card className="p-6">
                <h2 className="text-2xl font-semibold mb-6">{t('booking.bookingDetails')}</h2>
                <Form {...form}>
                  <form onSubmit={form.handleSubmit(onSubmitDetails)} className="space-y-6">
                    <FormField
                      control={form.control}
                      name="bookingDate"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>{t('booking.selectDate')}</FormLabel>
                          <FormControl>
                            <Input type="date" {...field} data-testid="input-booking-date" />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={form.control}
                      name="participants"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>{t('booking.participants')}</FormLabel>
                          <FormControl>
                            <Input 
                              type="number" 
                              {...field} 
                              onChange={(e) => field.onChange(parseInt(e.target.value))}
                              data-testid="input-participants"
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={form.control}
                      name="specialRequests"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>{t('booking.specialRequests')}</FormLabel>
                          <FormControl>
                            <Textarea 
                              placeholder={t('booking.specialRequestsPlaceholder')} 
                              {...field} 
                              rows={4}
                              data-testid="input-special-requests"
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <Button type="submit" className="w-full" disabled={createBookingMutation.isPending} data-testid="button-continue-payment">
                      {createBookingMutation.isPending ? t('common.processing') : t('booking.continueToPayment')}
                    </Button>
                  </form>
                </Form>
              </Card>
            )}

            {currentStep === 'payment' && (
              <Card className="p-6">
                <h2 className="text-2xl font-semibold mb-6">{t('booking.payment')}</h2>
                <div className="space-y-6">
                  <div className="flex items-center gap-4 p-4 bg-muted rounded-lg">
                    <CreditCard className="w-8 h-8 text-primary" />
                    <div>
                      <p className="font-medium">{t('booking.securePayment')}</p>
                      <p className="text-sm text-muted-foreground">{t('booking.paymentSecureDesc')}</p>
                    </div>
                  </div>
                  
                  <div className="p-4 bg-muted rounded-lg">
                    <p className="text-sm text-muted-foreground mb-2">
                      {t('booking.paymentFormPlaceholder')}
                    </p>
                  </div>

                  <Button 
                    className="w-full" 
                    onClick={handlePayment} 
                    disabled={processPaymentMutation.isPending}
                    data-testid="button-confirm-payment"
                  >
                    {processPaymentMutation.isPending ? t('booking.processingPayment') : t('booking.confirmPayment')}
                  </Button>
                </div>
              </Card>
            )}

            {currentStep === 'confirmation' && (
              <Card className="p-12 text-center">
                <div className="inline-flex items-center justify-center w-20 h-20 rounded-full bg-green-100 mb-6">
                  <CheckCircle className="w-12 h-12 text-green-600" />
                </div>
                <h2 className="text-3xl font-semibold mb-4">{t('booking.confirmed')}</h2>
                <p className="text-lg text-muted-foreground mb-8">
                  {t('booking.confirmationMessage')}
                </p>
                <div className="flex gap-4 justify-center">
                  <Link href="/bookings">
                    <Button variant="outline">{t('booking.viewMyBookings')}</Button>
                  </Link>
                  <Link href="/">
                    <Button>{t('booking.browseMoreTours')}</Button>
                  </Link>
                </div>
              </Card>
            )}
          </div>

          {/* Summary sidebar */}
          <div className="lg:col-span-1">
            <Card className="p-6 sticky top-24">
              <h3 className="font-semibold mb-4">{t('booking.bookingSummary')}</h3>
              <div className="space-y-4">
                <div>
                  <img
                    src={tour.images[0] || 'https://images.unsplash.com/photo-1469854523086-cc02fe5d8800?q=80&w=2021'}
                    alt={tour.title}
                    className="w-full h-32 object-cover rounded-lg mb-2"
                  />
                  <h4 className="font-semibold line-clamp-2">{tour.title}</h4>
                </div>

                <div className="space-y-2 text-sm">
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">{t('tourDetail.perPerson')}</span>
                    <span className="font-medium">${tour.price}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">{t('booking.participants')}</span>
                    <span className="font-medium">{participants}</span>
                  </div>
                  <div className="border-t pt-2">
                    <div className="flex justify-between font-semibold text-lg">
                      <span>{t('booking.total')}</span>
                      <span>${totalAmount.toFixed(2)}</span>
                    </div>
                  </div>
                </div>
              </div>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
}
