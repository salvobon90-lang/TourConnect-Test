import { useState } from "react";
import { useParams, useLocation, Link } from "wouter";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useTranslation } from "react-i18next";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { ArrowLeft, MapPin, Calendar, Shield, CheckCircle2, Package as PackageIcon } from "lucide-react";
import { PackagePricingCalculator } from "@/components/PackagePricingCalculator";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/hooks/useAuth";
import { Skeleton } from "@/components/ui/skeleton";
import { SEO } from "@/components/seo";
import { PartnerBadge } from "@/components/PartnerBadge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";

interface PackageItem {
  type: string;
  id: string;
  quantity: number;
}

interface DiscountRules {
  type: string;
  value: number;
  minParticipants?: number;
}

interface Partner {
  id: string;
  name: string;
  logoUrl?: string;
  verified: boolean;
  description?: string;
  type: string;
}

interface Package {
  id: string;
  partnerId: string;
  title: string;
  description: string;
  items: PackageItem[];
  basePrice: string;
  discountRules?: DiscountRules;
  cancellationPolicy?: string;
  availability?: {
    dates?: string[];
    maxBookings?: number;
  };
  isActive: boolean;
  partner: Partner;
}

export default function PackageDetail() {
  const { t } = useTranslation();
  const { id } = useParams();
  const [, setLocation] = useLocation();
  const { user } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  
  const [participants, setParticipants] = useState(1);
  const [totalPrice, setTotalPrice] = useState(0);
  const [couponCode, setCouponCode] = useState("");
  const [specialRequests, setSpecialRequests] = useState("");
  const [acceptedTerms, setAcceptedTerms] = useState(false);
  const [isBooking, setIsBooking] = useState(false);

  const { data: pkg, isLoading, error } = useQuery<Package>({
    queryKey: ['packages', id],
    queryFn: async () => {
      const res = await fetch(`/api/packages/${id}`, {
        credentials: 'include'
      });
      if (!res.ok) throw new Error('Failed to fetch package');
      return res.json();
    },
    enabled: !!id,
  });

  const handlePriceChange = (total: number, participantCount: number, coupon?: string) => {
    setTotalPrice(total);
    setParticipants(participantCount);
    if (coupon) {
      setCouponCode(coupon);
    }
  };

  const handleBookNow = async () => {
    if (!user) {
      toast({
        title: t('packages.errors.loginRequired'),
        description: t('packages.errors.loginRequiredDesc'),
        variant: "destructive",
      });
      setLocation('/role-selection');
      return;
    }

    if (!acceptedTerms) {
      toast({
        title: t('packages.errors.acceptTerms'),
        variant: "destructive",
      });
      return;
    }

    setIsBooking(true);

    try {
      const urlParams = new URLSearchParams(window.location.search);
      const affiliateCode = urlParams.get('ref');

      const bookingRes = await fetch(`/api/packages/${id}/book`, {
        method: 'POST',
        credentials: 'include',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          participants,
          specialRequests: specialRequests || undefined,
          couponCode: couponCode || undefined,
          affiliateCode: affiliateCode || undefined,
        }),
      });

      if (!bookingRes.ok) {
        const error = await bookingRes.json();
        throw new Error(error.message || 'Failed to create booking');
      }

      const booking = await bookingRes.json();

      // Invalidate caches
      queryClient.invalidateQueries({ queryKey: ['packages', id] });
      queryClient.invalidateQueries({ queryKey: ['packages', 'search'] });

      const checkoutRes = await fetch(`/api/billing/packages/${booking.id}/checkout`, {
        method: 'POST',
        credentials: 'include',
      });

      if (!checkoutRes.ok) {
        throw new Error('Failed to create checkout session');
      }

      const { checkoutUrl } = await checkoutRes.json();

      if (checkoutUrl) {
        window.location.href = checkoutUrl;
      } else {
        setLocation(`/booking-success?booking_id=${booking.id}`);
      }
    } catch (error: any) {
      toast({
        title: t('packages.errors.bookingFailed'),
        description: error.message || t('packages.errors.bookingFailedDesc'),
        variant: "destructive",
      });
    } finally {
      setIsBooking(false);
    }
  };

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

  if (!pkg) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <Card className="p-12 text-center">
          <h2 className="text-2xl font-semibold mb-2">{t('packages.notFound')}</h2>
          <p className="text-muted-foreground mb-6">{t('packages.notFoundDesc')}</p>
          <Link href="/discover">
            <Button>{t('common.back')}</Button>
          </Link>
        </Card>
      </div>
    );
  }

  const basePrice = parseFloat(pkg.basePrice);

  return (
    <>
      <SEO 
        title={pkg.title}
        description={pkg.description}
        type="article"
      />
      <div className="min-h-screen bg-background">
        <header className="border-b bg-card sticky top-0 z-50">
          <div className="max-w-7xl mx-auto px-4 py-4 flex items-center gap-4">
            <Link href="/discover">
              <Button variant="ghost" size="icon">
                <ArrowLeft className="w-5 h-5" />
              </Button>
            </Link>
            <div className="flex items-center gap-2">
              <PackageIcon className="h-6 w-6 text-orange-600" />
              <h1 className="text-2xl font-serif font-semibold">{pkg.title}</h1>
            </div>
          </div>
        </header>

        <div className="max-w-7xl mx-auto px-4 py-12">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            <div className="lg:col-span-2 space-y-6">
              <div className="relative h-96 rounded-lg overflow-hidden bg-gradient-to-br from-orange-50 to-orange-100 dark:from-orange-950 dark:to-orange-900">
                <div className="absolute inset-0 flex items-center justify-center">
                  <PackageIcon className="h-32 w-32 text-orange-300 dark:text-orange-700" />
                </div>
                <div className="absolute top-4 right-4 flex flex-col gap-2">
                  <PartnerBadge verified={pkg.partner.verified} size="sm" className="shadow-lg" />
                  {pkg.discountRules && pkg.discountRules.value > 0 && (
                    <Badge className="bg-orange-600 hover:bg-orange-700 text-white shadow-lg">
                      {t('packages.bundleDiscount')}: {pkg.discountRules.value}
                      {pkg.discountRules.type === 'percentage' ? '%' : '€'}
                    </Badge>
                  )}
                </div>
              </div>

              <Card className="p-6">
                <h2 className="text-3xl font-bold mb-4">{pkg.title}</h2>
                <p className="text-lg text-foreground whitespace-pre-wrap">{pkg.description}</p>
              </Card>

              <Card className="p-6">
                <h3 className="text-xl font-semibold mb-4 flex items-center gap-2">
                  <CheckCircle2 className="h-5 w-5 text-orange-600" />
                  {t('packages.includedInPackage')}
                </h3>
                <div className="space-y-2">
                  {pkg.items.map((item, index) => (
                    <div key={index} className="flex items-center gap-3 p-3 bg-muted/50 rounded-lg">
                      <Badge variant="secondary">
                        {item.type === 'tour' ? t('navigation.tours') : t('common.service')}
                      </Badge>
                      <span className="text-sm">
                        {item.quantity > 1 && `${item.quantity}× `}
                        {item.type} (ID: {item.id})
                      </span>
                    </div>
                  ))}
                </div>
              </Card>

              {pkg.partner && (
                <Card className="p-6">
                  <h3 className="text-xl font-semibold mb-4">{t('packages.partnerInfo')}</h3>
                  <div className="flex items-start gap-4">
                    <Avatar className="w-16 h-16">
                      <AvatarImage src={pkg.partner.logoUrl} alt={pkg.partner.name} />
                      <AvatarFallback className="bg-orange-100 dark:bg-orange-900 text-orange-600 text-2xl font-bold">
                        {pkg.partner.name[0]}
                      </AvatarFallback>
                    </Avatar>
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-1 flex-wrap">
                        <p className="font-semibold text-lg">{pkg.partner.name}</p>
                        <PartnerBadge verified={pkg.partner.verified} size="sm" />
                      </div>
                      <p className="text-sm text-muted-foreground capitalize">{pkg.partner.type}</p>
                      {pkg.partner.description && (
                        <p className="text-sm text-foreground mt-2">{pkg.partner.description}</p>
                      )}
                    </div>
                  </div>
                </Card>
              )}

              {pkg.cancellationPolicy && (
                <Card className="p-6">
                  <h3 className="text-xl font-semibold mb-4 flex items-center gap-2">
                    <Shield className="h-5 w-5 text-orange-600" />
                    {t('packages.cancellationPolicy')}
                  </h3>
                  <p className="text-foreground">{pkg.cancellationPolicy}</p>
                </Card>
              )}
            </div>

            <div className="lg:col-span-1">
              <div className="sticky top-24 space-y-6">
                <PackagePricingCalculator
                  basePrice={basePrice}
                  discountRules={pkg.discountRules}
                  maxParticipants={pkg.availability?.maxBookings || 10}
                  onPriceChange={handlePriceChange}
                />

                <Card className="p-6">
                  <h3 className="text-lg font-semibold mb-4">{t('packages.bookingDetails')}</h3>
                  <div className="space-y-4">
                    <div>
                      <Label htmlFor="special-requests">{t('packages.specialRequests')}</Label>
                      <Textarea
                        id="special-requests"
                        placeholder={t('packages.specialRequestsPlaceholder')}
                        value={specialRequests}
                        onChange={(e) => setSpecialRequests(e.target.value)}
                        className="mt-2"
                        rows={3}
                      />
                    </div>

                    <div className="flex items-start gap-2">
                      <Checkbox
                        id="terms"
                        checked={acceptedTerms}
                        onCheckedChange={(checked) => setAcceptedTerms(checked as boolean)}
                      />
                      <Label htmlFor="terms" className="text-sm cursor-pointer">
                        {t('packages.acceptTerms')}
                      </Label>
                    </div>

                    <Button
                      className="w-full bg-orange-600 hover:bg-orange-700 text-white"
                      size="lg"
                      onClick={handleBookNow}
                      disabled={isBooking || !acceptedTerms}
                    >
                      {isBooking ? t('packages.processing') : t('packages.bookNow')}
                    </Button>

                    <p className="text-xs text-center text-muted-foreground">
                      {t('packages.secureCheckout')}
                    </p>
                  </div>
                </Card>
              </div>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}
