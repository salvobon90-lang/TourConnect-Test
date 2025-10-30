import { Badge } from '@/components/ui/badge';
import { ShieldCheck, Crown, Star } from 'lucide-react';
import { cn } from '@/lib/utils';

interface PartnerBadgeProps {
  tier: 'standard' | 'premium' | 'pro' | null;
  className?: string;
}

export function PartnerBadge({ tier, className }: PartnerBadgeProps) {
  if (!tier) return null;

  const config = {
    standard: {
      label: 'Standard',
      icon: Star,
      className: 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200',
    },
    premium: {
      label: 'Featured',
      icon: Crown,
      className: 'bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-200',
    },
    pro: {
      label: 'Partner Verified',
      icon: ShieldCheck,
      className: 'bg-orange-100 text-orange-800 dark:bg-orange-900 dark:text-orange-200',
    },
  };

  const { label, icon: Icon, className: badgeClass } = config[tier];

  return (
    <Badge className={cn(badgeClass, 'flex items-center gap-1', className)}>
      <Icon className="h-3 w-3" />
      {label}
    </Badge>
  );
}
