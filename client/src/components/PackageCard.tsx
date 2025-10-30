import { Card, CardContent, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Users, Shield, Package as PackageIcon } from "lucide-react";
import { useTranslation } from "react-i18next";
import { PartnerBadge } from "@/components/PartnerBadge";

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

interface Package {
  id: string;
  title: string;
  description: string;
  basePrice: string;
  items: PackageItem[];
  discountRules?: DiscountRules;
  cancellationPolicy?: string;
  partner: {
    id: string;
    name: string;
    logoUrl?: string;
    verified: boolean;
  };
}

interface PackageCardProps {
  package: Package;
  onClick?: () => void;
}

export function PackageCard({ package: pkg, onClick }: PackageCardProps) {
  const { t } = useTranslation();
  
  const basePrice = parseFloat(pkg.basePrice);
  const hasDiscount = pkg.discountRules && pkg.discountRules.value > 0;
  
  let finalPrice = basePrice;
  let discountAmount = 0;
  
  if (hasDiscount && pkg.discountRules) {
    if (pkg.discountRules.type === 'percentage') {
      discountAmount = (basePrice * pkg.discountRules.value) / 100;
      finalPrice = basePrice - discountAmount;
    } else if (pkg.discountRules.type === 'fixed') {
      discountAmount = pkg.discountRules.value;
      finalPrice = basePrice - discountAmount;
    }
  }
  
  const tourCount = pkg.items.filter(item => item.type === 'tour').length;
  const serviceCount = pkg.items.filter(item => item.type === 'service').length;
  
  const getCancellationPolicyLabel = (policy?: string) => {
    if (!policy) return null;
    const lowerPolicy = policy.toLowerCase();
    if (lowerPolicy.includes('flexible')) return t('packages.flexible');
    if (lowerPolicy.includes('moderate')) return t('packages.moderate');
    if (lowerPolicy.includes('strict')) return t('packages.strict');
    return policy;
  };
  
  return (
    <Card 
      className="overflow-hidden hover:shadow-xl transition-all cursor-pointer border-2 border-orange-200 hover:border-orange-400 group"
      onClick={onClick}
    >
      <div className="relative h-56 overflow-hidden bg-gradient-to-br from-orange-50 to-orange-100 dark:from-orange-950 dark:to-orange-900">
        <div className="absolute inset-0 flex items-center justify-center">
          <PackageIcon className="h-24 w-24 text-orange-300 dark:text-orange-700 group-hover:scale-110 transition-transform" />
        </div>
        
        <div className="absolute top-3 right-3 flex flex-col gap-2">
          <PartnerBadge verified={pkg.partner.verified} size="sm" className="shadow-lg" />
          {hasDiscount && pkg.discountRules && (
            <Badge className="bg-orange-600 hover:bg-orange-700 text-white shadow-lg">
              -{pkg.discountRules.value}{pkg.discountRules.type === 'percentage' ? '%' : '€'}
            </Badge>
          )}
        </div>
      </div>
      
      <CardHeader>
        <div className="flex items-start gap-2 mb-2">
          <PackageIcon className="h-5 w-5 text-orange-600 mt-1 flex-shrink-0" />
          <CardTitle className="line-clamp-2 text-lg">{pkg.title}</CardTitle>
        </div>
        <p className="text-sm text-muted-foreground line-clamp-2">
          {pkg.description}
        </p>
      </CardHeader>
      
      <CardContent className="space-y-4">
        <div>
          <p className="text-xs font-semibold text-gray-600 dark:text-gray-400 mb-2">
            {t('packages.includedInPackage')}:
          </p>
          <div className="flex flex-wrap gap-2">
            {tourCount > 0 && (
              <Badge variant="secondary" className="text-xs">
                {tourCount} {tourCount === 1 ? 'Tour' : 'Tours'}
              </Badge>
            )}
            {serviceCount > 0 && (
              <Badge variant="secondary" className="text-xs">
                {serviceCount} {serviceCount === 1 ? 'Service' : 'Services'}
              </Badge>
            )}
          </div>
        </div>
        
        <div className="space-y-2">
          {hasDiscount && (
            <div className="flex items-center justify-between text-sm">
              <span className="text-gray-500 dark:text-gray-400">{t('packages.originalPrice')}:</span>
              <span className="line-through text-gray-500 dark:text-gray-400">€{basePrice.toFixed(2)}</span>
            </div>
          )}
          
          <div className="flex items-center justify-between">
            <span className="text-sm font-medium">{t('packages.pricePerPerson')}:</span>
            <span className="text-2xl font-bold text-orange-600">
              €{finalPrice.toFixed(2)}
            </span>
          </div>
          
          {hasDiscount && (
            <div className="text-xs text-green-600 dark:text-green-400 font-medium">
              {t('packages.bundleDiscount')}: -€{discountAmount.toFixed(2)}
            </div>
          )}
        </div>
        
        <div className="flex items-center justify-between text-sm pt-2 border-t">
          {pkg.cancellationPolicy && (
            <div className="flex items-center gap-1 text-gray-600 dark:text-gray-400">
              <Shield className="h-4 w-4" />
              <span className="text-xs">{getCancellationPolicyLabel(pkg.cancellationPolicy)}</span>
            </div>
          )}
        </div>
      </CardContent>
      
      <CardFooter>
        <Button 
          className="w-full bg-orange-600 hover:bg-orange-700 text-white"
          onClick={(e) => {
            e.stopPropagation();
            onClick?.();
          }}
        >
          {t('packages.viewBundle')}
        </Button>
      </CardFooter>
    </Card>
  );
}
