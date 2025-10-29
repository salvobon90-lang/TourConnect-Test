import { Badge } from '@/components/ui/badge';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { Trophy } from 'lucide-react';
import { useTranslation } from 'react-i18next';

interface RewardsBadgeProps {
  level: 'bronze' | 'silver' | 'gold' | 'platinum' | 'diamond';
  points?: number;
  streak?: number;
  showTooltip?: boolean;
}

const levelColors = {
  bronze: 'bg-gradient-to-r from-amber-600 to-orange-700',
  silver: 'bg-gradient-to-r from-gray-300 to-gray-500',
  gold: 'bg-gradient-to-r from-yellow-400 to-yellow-600',
  platinum: 'bg-gradient-to-r from-cyan-400 to-blue-500',
  diamond: 'bg-gradient-to-r from-purple-400 to-pink-500',
};

const levelIcons = {
  bronze: '🥉',
  silver: '🥈',
  gold: '🥇',
  platinum: '💎',
  diamond: '👑',
};

export function RewardsBadge({ level, points, streak, showTooltip = true }: RewardsBadgeProps) {
  const { t } = useTranslation();

  const badge = (
    <Badge className={`${levelColors[level]} text-white border-0 gap-1 cursor-default`}>
      <span>{levelIcons[level]}</span>
      <span className="font-semibold">{t(`rewards.levels.${level}`)}</span>
    </Badge>
  );

  if (!showTooltip || (points === undefined && streak === undefined)) {
    return badge;
  }

  return (
    <TooltipProvider>
      <Tooltip>
        <TooltipTrigger asChild>
          {badge}
        </TooltipTrigger>
        <TooltipContent className="bg-card border shadow-lg p-3">
          <div className="space-y-2">
            <div className="flex items-center gap-2">
              <Trophy className="w-4 h-4 text-primary" />
              <span className="font-semibold">{t(`rewards.levels.${level}`)}</span>
            </div>
            {points !== undefined && (
              <p className="text-sm">
                <span className="text-muted-foreground">{t('rewards.totalPoints')}:</span>{' '}
                <span className="font-semibold">{points.toLocaleString()}</span>
              </p>
            )}
            {streak !== undefined && streak > 0 && (
              <p className="text-sm">
                <span className="text-muted-foreground">{t('rewards.streak')}:</span>{' '}
                <span className="font-semibold">🔥 {streak} {t('rewards.days')}</span>
              </p>
            )}
          </div>
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  );
}
