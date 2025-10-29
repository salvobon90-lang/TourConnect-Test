import { useQuery } from '@tanstack/react-query';
import { Card } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { Badge } from '@/components/ui/badge';
import { motion } from 'framer-motion';
import { Trophy, TrendingUp, Flame, Star } from 'lucide-react';
import { useTranslation } from 'react-i18next';

interface RewardData {
  totalPoints: number;
  currentLevel: 'bronze' | 'silver' | 'gold' | 'platinum' | 'diamond';
  currentStreak: number;
  longestStreak: number;
  nextLevel: string | null;
  pointsNeeded: number;
}

const levelColors = {
  bronze: 'from-amber-600 to-orange-700',
  silver: 'from-gray-300 to-gray-500',
  gold: 'from-yellow-400 to-yellow-600',
  platinum: 'from-cyan-400 to-blue-500',
  diamond: 'from-purple-400 to-pink-500',
};

const levelIcons = {
  bronze: '🥉',
  silver: '🥈',
  gold: '🥇',
  platinum: '💎',
  diamond: '👑',
};

const levelThresholds = {
  bronze: 0,
  silver: 500,
  gold: 1500,
  platinum: 3500,
  diamond: 7500,
};

export function RewardsCard({ compact = false }: { compact?: boolean }) {
  const { t } = useTranslation();

  const { data: rewards, isLoading } = useQuery<RewardData>({
    queryKey: ['/api/rewards/me'],
  });

  if (isLoading) {
    return (
      <Card className="p-6">
        <div className="animate-pulse space-y-4">
          <div className="h-6 bg-muted rounded w-1/3"></div>
          <div className="h-12 bg-muted rounded"></div>
          <div className="h-4 bg-muted rounded w-2/3"></div>
        </div>
      </Card>
    );
  }

  if (!rewards) return null;

  const currentLevelThreshold = levelThresholds[rewards.currentLevel];
  const nextLevelThreshold = rewards.nextLevel ? levelThresholds[rewards.nextLevel as keyof typeof levelThresholds] : rewards.totalPoints;
  const progressPercentage = rewards.nextLevel
    ? ((rewards.totalPoints - currentLevelThreshold) / (nextLevelThreshold - currentLevelThreshold)) * 100
    : 100;

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4 }}
    >
      <Card className={`bg-gradient-to-br ${levelColors[rewards.currentLevel]} text-white ${compact ? 'p-4' : 'p-6'}`}>
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <Trophy className="w-6 h-6" />
            <h3 className={`font-semibold ${compact ? 'text-lg' : 'text-xl'}`}>
              {t('rewards.yourRewards')}
            </h3>
          </div>
          <motion.div
            className="text-3xl"
            animate={{ rotate: [0, 10, -10, 0] }}
            transition={{ duration: 2, repeat: Infinity, repeatDelay: 3 }}
          >
            {levelIcons[rewards.currentLevel]}
          </motion.div>
        </div>

        {!compact && (
          <>
            <div className="grid grid-cols-2 gap-4 mb-6">
              <motion.div
                className="bg-white/10 backdrop-blur-sm rounded-lg p-3"
                whileHover={{ scale: 1.05 }}
                transition={{ type: 'spring', stiffness: 300 }}
              >
                <div className="flex items-center gap-2 mb-1">
                  <Star className="w-4 h-4" />
                  <p className="text-sm opacity-90">{t('rewards.totalPoints')}</p>
                </div>
                <p className="text-2xl font-bold">{rewards.totalPoints.toLocaleString()}</p>
              </motion.div>

              <motion.div
                className="bg-white/10 backdrop-blur-sm rounded-lg p-3"
                whileHover={{ scale: 1.05 }}
                transition={{ type: 'spring', stiffness: 300 }}
              >
                <div className="flex items-center gap-2 mb-1">
                  <Flame className="w-4 h-4" />
                  <p className="text-sm opacity-90">{t('rewards.currentStreak')}</p>
                </div>
                <p className="text-2xl font-bold">{rewards.currentStreak} {t('rewards.days')}</p>
              </motion.div>
            </div>

            <div className="space-y-2 mb-4">
              <div className="flex items-center justify-between text-sm">
                <span className="flex items-center gap-1">
                  <TrendingUp className="w-4 h-4" />
                  {t('rewards.level')}: {t(`rewards.levels.${rewards.currentLevel}`)}
                </span>
                {rewards.nextLevel && (
                  <span className="opacity-90">
                    {t('rewards.nextLevel')}: {t(`rewards.levels.${rewards.nextLevel}`)}
                  </span>
                )}
              </div>
              <Progress value={progressPercentage} className="h-3 bg-white/20" />
              {rewards.nextLevel && (
                <p className="text-xs opacity-80 text-right">
                  {rewards.pointsNeeded} {t('rewards.pointsToNextLevel')}
                </p>
              )}
            </div>
          </>
        )}

        {compact && (
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm opacity-90">{t('rewards.level')}</p>
              <p className="font-bold">{t(`rewards.levels.${rewards.currentLevel}`)}</p>
            </div>
            <div className="text-right">
              <p className="text-sm opacity-90">{t('rewards.points')}</p>
              <p className="font-bold">{rewards.totalPoints.toLocaleString()}</p>
            </div>
          </div>
        )}

        {rewards.longestStreak > 0 && !compact && (
          <motion.div
            className="mt-4 pt-4 border-t border-white/20"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.3 }}
          >
            <p className="text-xs opacity-80">
              🔥 {t('rewards.longestStreak')}: {rewards.longestStreak} {t('rewards.days')}
            </p>
          </motion.div>
        )}
      </Card>
    </motion.div>
  );
}
