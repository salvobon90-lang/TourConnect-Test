import { Shield } from 'lucide-react';
import { Badge } from './ui/badge';
import { useTranslation } from 'react-i18next';
import { cn } from '@/lib/utils';

interface PartnerBadgeProps {
  verified: boolean;
  size?: 'sm' | 'md' | 'lg';
  showIcon?: boolean;
  className?: string;
}

export function PartnerBadge({ 
  verified, 
  size = 'md', 
  showIcon = true,
  className 
}: PartnerBadgeProps) {
  const { t } = useTranslation();
  
  if (!verified) return null;
  
  const sizeClasses = {
    sm: 'text-xs px-2 py-0.5',
    md: 'text-sm px-2.5 py-1',
    lg: 'text-base px-3 py-1.5',
  };
  
  const iconSizes = {
    sm: 'w-3 h-3',
    md: 'w-3.5 h-3.5',
    lg: 'w-4 h-4',
  };
  
  return (
    <Badge 
      variant="secondary" 
      className={cn(
        'bg-green-600 hover:bg-green-700 text-white border-0 gap-1',
        sizeClasses[size],
        className
      )}
      aria-label={t('badges.partnerVerified')}
    >
      {showIcon && <Shield className={iconSizes[size]} />}
      {t('badges.partnerVerified')}
    </Badge>
  );
}
