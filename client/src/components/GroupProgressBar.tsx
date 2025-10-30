import { Progress } from '@/components/ui/progress';
import { motion } from 'framer-motion';
import { useTranslation } from 'react-i18next';
import { Users } from 'lucide-react';

interface GroupProgressBarProps {
  current: number;
  target: number;
  className?: string;
}

export function GroupProgressBar({ current, target, className }: GroupProgressBarProps) {
  const { t } = useTranslation();
  const percentage = Math.min((current / target) * 100, 100);
  const spotsLeft = target - current;

  return (
    <motion.div
      className={className}
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
    >
      <div className="flex items-center gap-2 mb-2">
        <Users className="w-4 h-4 text-muted-foreground" />
        <span className="text-sm font-medium">
          {current} / {target} {t('smartGroups.members')}
        </span>
      </div>
      
      <div className="relative">
        <Progress
          value={percentage}
          className="h-3 bg-muted"
        />
        <motion.div
          className="absolute inset-0 h-3 rounded-full bg-[#FF6600]"
          initial={{ width: 0 }}
          animate={{ width: `${percentage}%` }}
          transition={{ duration: 0.6, ease: 'easeOut' }}
          style={{ maxWidth: '100%' }}
        />
      </div>

      <div className="flex items-center justify-between mt-2">
        <span className="text-xs text-muted-foreground">
          {percentage.toFixed(0)}% {t('common.filled') || 'filled'}
        </span>
        {spotsLeft > 0 && (
          <span className="text-xs text-muted-foreground">
            {t('smartGroups.participantsNeeded', { count: spotsLeft })}
          </span>
        )}
        {spotsLeft === 0 && (
          <span className="text-xs font-semibold text-[#FF6600]">
            {t('smartGroups.participantsFull')}
          </span>
        )}
      </div>
    </motion.div>
  );
}
