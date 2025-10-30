import { useState } from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { useQuery, useMutation } from '@tanstack/react-query';
import { useToast } from '@/hooks/use-toast';
import { useTranslation } from 'react-i18next';
import { Copy, CheckCircle2, Share2 } from 'lucide-react';
import { motion } from 'framer-motion';
import { Skeleton } from '@/components/ui/skeleton';

interface InviteFriendsPanelProps {
  groupId: string;
  className?: string;
}

interface InviteData {
  inviteCode: string;
  inviteLink: string;
}

export function InviteFriendsPanel({ groupId, className }: InviteFriendsPanelProps) {
  const { t } = useTranslation();
  const { toast } = useToast();
  const [copied, setCopied] = useState(false);

  const { data: inviteData, isLoading } = useQuery<InviteData>({
    queryKey: [`/api/smart-groups/${groupId}/invite`],
    queryFn: async () => {
      const res = await fetch(`/api/smart-groups/${groupId}/invite`, {
        method: 'POST',
        credentials: 'include',
      });
      if (!res.ok) {
        throw new Error('Failed to fetch invite code');
      }
      return res.json();
    },
    enabled: !!groupId,
  });

  const handleCopyLink = async () => {
    if (!inviteData?.inviteLink) return;

    try {
      await navigator.clipboard.writeText(inviteData.inviteLink);
      setCopied(true);
      toast({
        title: t('referrals.linkCopied'),
        description: t('smartGroups.shareGroup'),
      });
      setTimeout(() => setCopied(false), 2000);
    } catch (error) {
      toast({
        title: t('common.error'),
        description: 'Failed to copy link',
        variant: 'destructive',
      });
    }
  };

  const handleShare = async () => {
    if (!inviteData?.inviteLink) return;

    try {
      if (navigator.share) {
        await navigator.share({
          title: t('smartGroups.inviteFriends'),
          text: t('smartGroups.shareGroup'),
          url: inviteData.inviteLink,
        });
      } else {
        handleCopyLink();
      }
    } catch (error) {
      console.error('Error sharing:', error);
    }
  };

  if (isLoading) {
    return (
      <Card className={`p-6 ${className}`}>
        <div className="space-y-4">
          <Skeleton className="h-6 w-1/3" />
          <Skeleton className="h-12 w-full" />
          <Skeleton className="h-10 w-full" />
        </div>
      </Card>
    );
  }

  if (!inviteData) return null;

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4 }}
    >
      <Card className={`bg-gradient-to-br from-orange-600 to-orange-800 text-white p-6 ${className}`}>
        <div className="flex items-center gap-2 mb-4">
          <Share2 className="w-5 h-5" />
          <h3 className="text-lg font-semibold">
            {t('smartGroups.inviteFriends')}
          </h3>
        </div>

        <div className="space-y-4">
          {/* Invite Code Display */}
          <div>
            <p className="text-sm opacity-90 mb-2">{t('smartGroups.inviteCode')}</p>
            <div className="bg-white/10 backdrop-blur-sm rounded-lg p-3 font-mono text-sm break-all">
              {inviteData.inviteCode}
            </div>
          </div>

          {/* Invite Link Display */}
          <div>
            <p className="text-sm opacity-90 mb-2">{t('smartGroups.shareGroup')}</p>
            <div className="flex gap-2">
              <div className="flex-1 bg-white/10 backdrop-blur-sm rounded-lg p-3 font-mono text-xs break-all">
                {inviteData.inviteLink}
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

          {/* Share Button */}
          <Button
            onClick={handleShare}
            variant="secondary"
            className="w-full bg-white/20 hover:bg-white/30 text-white"
          >
            <Share2 className="w-4 h-4 mr-2" />
            {t('smartGroups.shareGroup')}
          </Button>
        </div>
      </Card>
    </motion.div>
  );
}
