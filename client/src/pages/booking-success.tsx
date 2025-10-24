import { useEffect } from 'react';
import { useLocation } from 'wouter';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { CheckCircle } from 'lucide-react';
import { Link } from 'wouter';

export default function BookingSuccess() {
  const [location] = useLocation();
  const params = new URLSearchParams(location.split('?')[1]);
  const sessionId = params.get('session_id');
  const bookingId = params.get('booking_id');

  useEffect(() => {
    // Optional: Verify the payment with backend
    if (sessionId && bookingId) {
      console.log('Payment successful:', { sessionId, bookingId });
    }
  }, [sessionId, bookingId]);

  return (
    <div className="min-h-screen bg-background flex items-center justify-center p-4">
      <Card className="p-12 text-center max-w-md">
        <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-6">
          <CheckCircle className="w-10 h-10 text-green-600" />
        </div>
        
        <h1 className="text-3xl font-serif font-bold mb-4">Booking Confirmed!</h1>
        
        <p className="text-lg text-muted-foreground mb-8">
          Your payment was successful and your booking has been confirmed. 
          You'll receive a confirmation email shortly.
        </p>

        <div className="flex flex-col gap-3">
          <Link href="/bookings">
            <Button className="w-full" data-testid="button-view-bookings">
              View My Bookings
            </Button>
          </Link>
          <Link href="/">
            <Button variant="outline" className="w-full" data-testid="button-back-home">
              Back to Home
            </Button>
          </Link>
        </div>
      </Card>
    </div>
  );
}
