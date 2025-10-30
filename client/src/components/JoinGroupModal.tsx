import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useToast } from '@/hooks/use-toast';
import { useTranslation } from 'react-i18next';
import { useAuth } from '@/hooks/useAuth';
import { GroupStatusBadge } from './GroupStatusBadge';
import { GroupProgressBar } from './GroupProgressBar';
import { Calendar, MapPin, DollarSign, Clock } from 'lucide-react';
import { motion } from 'framer-motion';
import { format } from 'date-fns';

interface JoinGroupModalProps {
  groupId: string;
  isOpen: boolean;
  onClose: () => void;
}

interface SmartGroup {
  id: string;
  name: string;
  description?: string;
  tourId?: string;
  serviceId?: string;
  tourName?: string;
  serviceName?: string;
  currentParticipants: number;
  targetParticipants: number;
  status: 'active' | 'full' | 'expired' | 'completed';
  expiresAt: string;
  createdBy: {
    id: string;
    firstName?: string;
    lastName?: string;
  };
  participants: Array<{
    id: string;
    firstName?: string;
    lastName?: string;
  }>;
}

export function JoinGroupModal({ groupId, isOpen, onClose }: JoinGroupModalProps) {
  const { t } = useTranslation();
  const { toast } = useToast();
  const { user } = useAuth();
  const queryClient = useQueryClient();

  const { data: group, isLoading } = useQuery<SmartGroup>({
    queryKey: [`/api/smart-groups/${groupId}`],
    queryFn: async () => {
      const res = await fetch(`/api/smart-groups/${groupId}`, {
        credentials: 'include',
      });
      if (!res.ok) {
        throw new Error('Failed to fetch group');
      }
      return res.json();
    },
    enabled: isOpen && !!groupId,
  });

  const joinMutation = useMutation({
    mutationFn: async () => {
      const res = await fetch(`/api/smart-groups/${groupId}/join`, {
        method: 'POST',
        credentials: 'include',
      });
      if (!res.ok) {
        const error = await res.json();
        throw new Error(error.message || 'Failed to join group');
      }
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [`/api/smart-groups/${groupId}`] });
      queryClient.invalidateQueries({ queryKey: ['/api/smart-groups/my-groups'] });
      queryClient.invalidateQueries({ queryKey: ['/api/smart-groups/nearby'] });
      toast({
        title: t('smartGroups.groupJoined'),
        description: t('smartGroups.groupJoined'),
      });
      onClose();
    },
    onError: (error: Error) => {
      toast({
        title: t('common.error'),
        description: error.message,
        variant: 'destructive',
      });
    },
  });

  const handleJoin = () => {
    if (!user) {
      toast({
        title: t('common.error'),
        description: 'Please login to join a group',
        variant: 'destructive',
      });
      return;
    }

    if (group?.status === 'full') {
      toast({
        title: t('smartGroups.groupFull'),
        description: t('smartGroups.groupFull'),
        variant: 'destructive',
      });
      return;
    }

    if (group?.status === 'expired') {
      toast({
        title: t('smartGroups.groupExpired'),
        description: t('smartGroups.groupExpired'),
        variant: 'destructive',
      });
      return;
    }

    const isMember = group?.participants.some(p => p.id === user.id);
    if (isMember) {
      toast({
        title: t('smartGroups.alreadyMember'),
        description: t('smartGroups.alreadyMember'),
        variant: 'destructive',
      });
      return;
    }

    joinMutation.mutate();
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[600px]">
        {isLoading ? (
          <div className="space-y-4 py-6">
            <Skeleton className="h-8 w-3/4" />
            <Skeleton className="h-4 w-full" />
            <Skeleton className="h-32 w-full" />
          </div>
        ) : group ? (
          <>
            <DialogHeader>
              <div className="flex items-center justify-between">
                <DialogTitle>{group.name}</DialogTitle>
                <GroupStatusBadge status={group.status} />
              </div>
              <DialogDescription>
                {group.description || t('smartGroups.groupDetails')}
              </DialogDescription>
            </DialogHeader>

            <motion.div
              className="space-y-4 py-4"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.3 }}
            >
              {/* Tour/Service Info */}
              <Card className="p-4">
                <div className="flex items-center gap-2 mb-2">
                  <MapPin className="w-4 h-4 text-[#FF6600]" />
                  <h3 className="font-semibold">
                    {group.tourName || group.serviceName || t('smartGroups.selectTourOrService')}
                  </h3>
                </div>
              </Card>

              {/* Progress */}
              <GroupProgressBar
                current={group.currentParticipants}
                target={group.targetParticipants}
              />

              {/* Details Grid */}
              <div className="grid grid-cols-2 gap-4">
                <Card className="p-4">
                  <div className="flex items-center gap-2 text-sm text-muted-foreground mb-1">
                    <Clock className="w-4 h-4" />
                    <span>{t('smartGroups.expiresIn', { time: '' })}</span>
                  </div>
                  <p className="font-semibold">
                    {format(new Date(group.expiresAt), 'MMM dd, yyyy')}
                  </p>
                </Card>

                <Card className="p-4">
                  <div className="flex items-center gap-2 text-sm text-muted-foreground mb-1">
                    <Calendar className="w-4 h-4" />
                    <span>{t('smartGroups.createdBy', { name: '' })}</span>
                  </div>
                  <p className="font-semibold">
                    {group.createdBy.firstName || 'User'} {group.createdBy.lastName?.[0] || ''}.
                  </p>
                </Card>
              </div>

              {/* Participants List */}
              {group.participants.length > 0 && (
                <Card className="p-4">
                  <h4 className="font-semibold mb-3">{t('smartGroups.members')}</h4>
                  <div className="flex flex-wrap gap-2">
                    {group.participants.map((participant) => (
                      <div
                        key={participant.id}
                        className="px-3 py-1 bg-muted rounded-full text-sm"
                      >
                        {participant.firstName || 'User'} {participant.lastName?.[0] || ''}.
                      </div>
                    ))}
                  </div>
                </Card>
              )}
            </motion.div>

            <DialogFooter>
              <Button variant="outline" onClick={onClose}>
                {t('common.cancel')}
              </Button>
              <Button
                onClick={handleJoin}
                disabled={
                  joinMutation.isPending ||
                  group.status === 'full' ||
                  group.status === 'expired' ||
                  group.participants.some(p => p.id === user?.id)
                }
                className="bg-[#FF6600] hover:bg-[#FF6600]/90"
              >
                {joinMutation.isPending ? t('common.loading') : t('smartGroups.joinGroup')}
              </Button>
            </DialogFooter>
          </>
        ) : (
          <div className="py-8 text-center">
            <p className="text-muted-foreground">{t('smartGroups.groupNotFound')}</p>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}
