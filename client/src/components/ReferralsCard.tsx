import { useQuery } from '@tanstack/react-query';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { motion } from 'framer-motion';
import { Users, Copy, CheckCircle2, Clock, Gift } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { useState } from 'react';
import { useToast } from '@/hooks/use-toast';

interface ReferralStats {
  totalReferrals: number;
  completedReferrals: number;
  pendingReferrals: number;
  pointsEarned: number;
}

interface Referral {
  id: string;
  referralCode: string;
  status: 'pending' | 'completed';
  pointsAwarded: boolean;
  createdAt: string;
  completedAt?: string;
  referee?: {
    id: string;
    firstName?: string;
    lastName?: string;
    email?: string;
  };
}

export function ReferralsCard({ compact = false }: { compact?: boolean }) {
  const { t } = useTranslation();
  const { toast } = useToast();
  const [copied, setCopied] = useState(false);

  const { data: codeData } = useQuery<{ code: string; referralLink: string }>({
    queryKey: ['/api/referrals/my-code'],
  });

  const { data: stats, isLoading: statsLoading } = useQuery<ReferralStats>({
    queryKey: ['/api/referrals/stats'],
  });

  const { data: referrals, isLoading: referralsLoading } = useQuery<Referral[]>({
    queryKey: ['/api/referrals/my-referrals'],
  });

  const handleCopyLink = async () => {
    if (!codeData?.referralLink) return;

    try {
      await navigator.clipboard.writeText(codeData.referralLink);
      setCopied(true);
      toast({
        title: t('referrals.linkCopied'),
        description: t('referrals.shareWithFriends'),
      });
      setTimeout(() => setCopied(false), 2000);
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to copy link",
        variant: "destructive",
      });
    }
  };

  if (statsLoading) {
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

  if (!stats) return null;

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4 }}
    >
      <Card className={`bg-gradient-to-br from-orange-600 to-orange-800 text-white ${compact ? 'p-4' : 'p-6'}`}>
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <Users className="w-6 h-6" />
            <h3 className={`font-semibold ${compact ? 'text-lg' : 'text-xl'}`}>
              {t('referrals.inviteFriends')}
            </h3>
          </div>
          <motion.div
            className="text-2xl"
            animate={{ scale: [1, 1.2, 1] }}
            transition={{ duration: 2, repeat: Infinity, repeatDelay: 3 }}
          >
            🎁
          </motion.div>
        </div>

        {/* Referral Link Section */}
        {!compact && codeData && (
          <div className="mb-6">
            <p className="text-sm opacity-90 mb-2">{t('referrals.yourLink')}</p>
            <div className="flex gap-2">
              <div className="flex-1 bg-white/10 backdrop-blur-sm rounded-lg p-3 font-mono text-sm break-all">
                {codeData.referralLink}
              </div>
              <Button
                onClick={handleCopyLink}
                variant="secondary"
                size="icon"
                className="shrink-0 bg-white/20 hover:bg-white/30 text-white"
              >
                <motion.div
                  animate={{ scale: copied ? [1, 1.3, 1] : 1 }}
                  transition={{ duration: 0.3 }}
                >
                  {copied ? <CheckCircle2 className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
                </motion.div>
              </Button>
            </div>
          </div>
        )}

        {/* Stats Grid */}
        {!compact && (
          <div className="grid grid-cols-3 gap-3 mb-6">
            <motion.div
              className="bg-white/10 backdrop-blur-sm rounded-lg p-3 text-center"
              whileHover={{ scale: 1.05 }}
              transition={{ type: 'spring', stiffness: 300 }}
            >
              <div className="flex items-center justify-center gap-1 mb-1">
                <Users className="w-3 h-3" />
              </div>
              <p className="text-2xl font-bold">{stats.completedReferrals}</p>
              <p className="text-xs opacity-90">{t('referrals.friends')}</p>
            </motion.div>

            <motion.div
              className="bg-white/10 backdrop-blur-sm rounded-lg p-3 text-center"
              whileHover={{ scale: 1.05 }}
              transition={{ type: 'spring', stiffness: 300 }}
            >
              <div className="flex items-center justify-center gap-1 mb-1">
                <Clock className="w-3 h-3" />
              </div>
              <p className="text-2xl font-bold">{stats.pendingReferrals}</p>
              <p className="text-xs opacity-90">{t('referrals.pending')}</p>
            </motion.div>

            <motion.div
              className="bg-white/10 backdrop-blur-sm rounded-lg p-3 text-center"
              whileHover={{ scale: 1.05 }}
              transition={{ type: 'spring', stiffness: 300 }}
            >
              <div className="flex items-center justify-center gap-1 mb-1">
                <Gift className="w-3 h-3" />
              </div>
              <p className="text-2xl font-bold">{stats.pointsEarned}</p>
              <p className="text-xs opacity-90">{t('referrals.pointsEarned')}</p>
            </motion.div>
          </div>
        )}

        {/* Referrals List */}
        {!compact && referrals && referrals.length > 0 && (
          <div className="space-y-2">
            <p className="text-sm opacity-90 mb-2">{t('referrals.yourReferrals')}</p>
            <div className="space-y-2 max-h-40 overflow-y-auto">
              {referrals.slice(0, 5).map((referral) => (
                <motion.div
                  key={referral.id}
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  className="bg-white/10 backdrop-blur-sm rounded-lg p-2 flex items-center justify-between"
                >
                  <div className="flex items-center gap-2">
                    {referral.status === 'completed' ? (
                      <CheckCircle2 className="w-4 h-4 text-green-300" />
                    ) : (
                      <Clock className="w-4 h-4 text-yellow-300" />
                    )}
                    <div>
                      <p className="text-sm font-medium">
                        {referral.referee
                          ? `${referral.referee.firstName || ''} ${referral.referee.lastName || ''}`.trim() || referral.referee.email
                          : t('referrals.pending')}
                      </p>
                      <p className="text-xs opacity-75">
                        {new Date(referral.createdAt).toLocaleDateString()}
                      </p>
                    </div>
                  </div>
                  <Badge
                    variant={referral.status === 'completed' ? 'default' : 'secondary'}
                    className={referral.status === 'completed' ? 'bg-green-500/20 text-green-100' : 'bg-yellow-500/20 text-yellow-100'}
                  >
                    {referral.status === 'completed' ? t('referrals.completed') : t('referrals.pending')}
                  </Badge>
                </motion.div>
              ))}
            </div>
          </div>
        )}

        {/* Empty State */}
        {!compact && (!referrals || referrals.length === 0) && !referralsLoading && (
          <div className="text-center py-4 opacity-75">
            <Users className="w-8 h-8 mx-auto mb-2 opacity-50" />
            <p className="text-sm">{t('referrals.noReferralsYet')}</p>
            <p className="text-xs mt-1">{t('referrals.shareToEarn')}</p>
          </div>
        )}
      </Card>
    </motion.div>
  );
}
