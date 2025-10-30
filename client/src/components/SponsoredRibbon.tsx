import { Star } from 'lucide-react';
import { useTranslation } from 'react-i18next';

interface SponsoredRibbonProps {
  position?: 'top-left' | 'top-right';
}

export function SponsoredRibbon({ position = 'top-right' }: SponsoredRibbonProps) {
  const { t } = useTranslation();
  
  const positionClasses = position === 'top-left' 
    ? 'left-0 top-0 rounded-tr-md' 
    : 'right-0 top-0 rounded-tl-md';
  
  return (
    <div 
      className={`absolute ${positionClasses} bg-orange-600 text-white px-3 py-1 text-xs font-bold flex items-center gap-1 shadow-lg z-10`}
      aria-label={t('badges.sponsored')}
      role="status"
    >
      <Star className="w-3 h-3 fill-current" />
      {t('badges.sponsored')}
    </div>
  );
}
