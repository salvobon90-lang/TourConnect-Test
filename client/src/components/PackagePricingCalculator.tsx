import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Minus, Plus, Tag } from "lucide-react";
import { useTranslation } from "react-i18next";
import { useToast } from "@/hooks/use-toast";

interface DiscountRules {
  type: string;
  value: number;
  minParticipants?: number;
}

interface PackagePricingCalculatorProps {
  basePrice: number;
  discountRules?: DiscountRules;
  maxParticipants?: number;
  onPriceChange?: (total: number, participants: number, couponCode?: string) => void;
}

export function PackagePricingCalculator({
  basePrice,
  discountRules,
  maxParticipants = 10,
  onPriceChange,
}: PackagePricingCalculatorProps) {
  const { t } = useTranslation();
  const { toast } = useToast();
  const [participants, setParticipants] = useState(1);
  const [couponCode, setCouponCode] = useState("");
  const [appliedCoupon, setAppliedCoupon] = useState<{
    code: string;
    type: string;
    value: number;
  } | null>(null);
  const [isValidatingCoupon, setIsValidatingCoupon] = useState(false);
  
  const calculatePrice = () => {
    const baseTotal = basePrice * participants;
    let discountedTotal = baseTotal;
    
    // Apply package group discount first (if any)
    let groupDiscountAmount = 0;
    if (discountRules && discountRules.minParticipants && participants >= discountRules.minParticipants) {
      if (discountRules.type === 'percentage') {
        groupDiscountAmount = baseTotal * (discountRules.value / 100);
      } else if (discountRules.type === 'fixed') {
        groupDiscountAmount = discountRules.value;
      }
      discountedTotal = baseTotal - groupDiscountAmount;
    }
    
    // Apply coupon to BASE price (not already discounted)
    let couponDiscountAmount = 0;
    if (appliedCoupon) {
      if (appliedCoupon.type === 'percentage') {
        // Apply percentage to BASE price
        couponDiscountAmount = baseTotal * (Number(appliedCoupon.value) / 100);
      } else if (appliedCoupon.type === 'fixed') {
        // Fixed amount in euros
        couponDiscountAmount = Number(appliedCoupon.value);
      }
    }
    
    // Final price = base - group discount - coupon discount
    // Ensure non-negative
    const finalPrice = Math.max(0, baseTotal - groupDiscountAmount - couponDiscountAmount);
    
    return {
      subtotal: baseTotal,
      packageDiscount: groupDiscountAmount,
      couponDiscount: couponDiscountAmount,
      total: finalPrice,
    };
  };
  
  const handleParticipantsChange = (delta: number) => {
    const newValue = Math.max(1, Math.min(maxParticipants, participants + delta));
    setParticipants(newValue);
    // onPriceChange will be called by useEffect after state update
  };
  
  const handleApplyCoupon = async () => {
    if (!couponCode.trim()) {
      toast({
        title: t('packages.errors.emptyCoupon'),
        variant: "destructive",
      });
      return;
    }
    
    setIsValidatingCoupon(true);
    
    try {
      const res = await fetch(`/api/coupons/validate/${encodeURIComponent(couponCode)}`, {
        credentials: 'include',
      });
      
      if (!res.ok) {
        toast({
          title: t('packages.errors.invalidCoupon'),
          description: t('packages.errors.invalidCouponDesc'),
          variant: "destructive",
        });
        return;
      }
      
      const data = await res.json();
      
      // Check backend response schema
      if (!data.valid) {
        toast({
          title: t('packages.errors.invalidCoupon'),
          description: data.message || t('packages.errors.invalidCouponDesc'),
          variant: "destructive",
        });
        setAppliedCoupon(null);
        return;
      }
      
      // Extract coupon details from response
      const coupon = data.coupon;
      
      setAppliedCoupon({
        code: couponCode,
        type: coupon.type,
        value: coupon.value,
      });
      
      toast({
        title: t('packages.couponApplied'),
        description: t('packages.couponAppliedDesc', { 
          value: coupon.type === 'percentage' ? `${coupon.value}%` : `€${coupon.value}`
        }),
      });
      
      // onPriceChange will be called by useEffect after state update
    } catch (error) {
      toast({
        title: t('packages.errors.invalidCoupon'),
        description: t('packages.errors.invalidCouponDesc'),
        variant: "destructive",
      });
      setAppliedCoupon(null);
    } finally {
      setIsValidatingCoupon(false);
    }
  };
  
  const handleRemoveCoupon = () => {
    setAppliedCoupon(null);
    setCouponCode("");
    // onPriceChange will be called by useEffect after state update
  };
  
  // Synchronize price calculation after state updates
  useEffect(() => {
    const { total } = calculatePrice();
    onPriceChange?.(total, participants, appliedCoupon?.code);
  }, [participants, appliedCoupon, basePrice, discountRules, onPriceChange]);
  
  const pricing = calculatePrice();
  
  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-lg">{t('packages.pricingCalculator')}</CardTitle>
      </CardHeader>
      <CardContent className="space-y-6">
        <div>
          <Label className="text-sm font-medium mb-3 block">{t('packages.participants')}</Label>
          <div className="flex items-center gap-4">
            <Button
              variant="outline"
              size="icon"
              onClick={() => handleParticipantsChange(-1)}
              disabled={participants <= 1}
            >
              <Minus className="h-4 w-4" />
            </Button>
            <div className="flex-1 text-center">
              <span className="text-2xl font-bold">{participants}</span>
              <span className="text-sm text-muted-foreground ml-2">
                {participants === 1 ? t('packages.person') : t('packages.people')}
              </span>
            </div>
            <Button
              variant="outline"
              size="icon"
              onClick={() => handleParticipantsChange(1)}
              disabled={participants >= maxParticipants}
            >
              <Plus className="h-4 w-4" />
            </Button>
          </div>
          <p className="text-xs text-muted-foreground text-center mt-2">
            {t('packages.maxParticipants')}: {maxParticipants}
          </p>
        </div>
        
        <div className="space-y-2">
          <Label className="text-sm font-medium">{t('packages.couponCode')}</Label>
          <div className="flex gap-2">
            <Input
              placeholder={t('packages.enterCouponCode')}
              value={couponCode}
              onChange={(e) => setCouponCode(e.target.value)}
              disabled={!!appliedCoupon}
              className="flex-1"
            />
            {!appliedCoupon ? (
              <Button
                variant="outline"
                onClick={handleApplyCoupon}
                disabled={isValidatingCoupon || !couponCode.trim()}
              >
                <Tag className="h-4 w-4 mr-2" />
                {t('packages.apply')}
              </Button>
            ) : (
              <Button variant="destructive" onClick={handleRemoveCoupon}>
                {t('common.remove')}
              </Button>
            )}
          </div>
          {appliedCoupon && (
            <Badge className="bg-green-600 text-white">
              {t('packages.couponAppliedBadge')}: {appliedCoupon.code}
            </Badge>
          )}
        </div>
        
        <div className="space-y-3 pt-4 border-t">
          <div className="flex justify-between text-sm">
            <span className="text-muted-foreground">{t('packages.subtotal')}:</span>
            <span className="font-medium">€{pricing.subtotal.toFixed(2)}</span>
          </div>
          
          {pricing.packageDiscount > 0 && (
            <div className="flex justify-between text-sm text-green-600 dark:text-green-400">
              <span>{t('packages.bundleDiscount')}:</span>
              <span className="font-medium">-€{pricing.packageDiscount.toFixed(2)}</span>
            </div>
          )}
          
          {pricing.couponDiscount > 0 && (
            <div className="flex justify-between text-sm text-green-600 dark:text-green-400">
              <span>{t('packages.couponDiscount')}:</span>
              <span className="font-medium">-€{pricing.couponDiscount.toFixed(2)}</span>
            </div>
          )}
          
          <div className="flex justify-between text-lg font-bold pt-3 border-t">
            <span>{t('packages.totalPrice')}:</span>
            <span className="text-orange-600">€{pricing.total.toFixed(2)}</span>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
