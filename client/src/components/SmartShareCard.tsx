import { useState } from 'react';
import { motion } from 'framer-motion';
import { Users, Share2, X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { useToast } from '@/hooks/use-toast';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { useTranslation } from 'react-i18next';
import { useAuth } from '@/hooks/useAuth';

interface SmartShareCardProps {
  tourId?: string;
  serviceId?: string;
  type: 'tour' | 'service';
}

interface CreateGroupForm {
  name: string;
  description: string;
  targetParticipants: number;
  tourId?: string;
  serviceId?: string;
}

export function SmartShareCard({ tourId, serviceId, type }: SmartShareCardProps) {
  const { t } = useTranslation();
  const { toast } = useToast();
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const [isOpen, setIsOpen] = useState(false);
  const [formData, setFormData] = useState<CreateGroupForm>({
    name: '',
    description: '',
    targetParticipants: 5,
    tourId,
    serviceId,
  });

  const createGroupMutation = useMutation({
    mutationFn: async (data: CreateGroupForm) => {
      const res = await fetch('/api/smart-groups/create', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify(data),
      });
      if (!res.ok) {
        const error = await res.json();
        throw new Error(error.message || 'Failed to create group');
      }
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/smart-groups/my-groups'] });
      toast({
        title: t('smartGroups.groupCreated'),
        description: t('smartGroups.groupCreated'),
      });
      setIsOpen(false);
      setFormData({
        name: '',
        description: '',
        targetParticipants: 5,
        tourId,
        serviceId,
      });
    },
    onError: (error: Error) => {
      toast({
        title: t('common.error'),
        description: error.message,
        variant: 'destructive',
      });
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) {
      toast({
        title: t('common.error'),
        description: 'Please login to create a group',
        variant: 'destructive',
      });
      return;
    }
    createGroupMutation.mutate(formData);
  };

  return (
    <>
      <motion.div
        className="fixed bottom-6 right-6 z-50"
        initial={{ scale: 0, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        transition={{ type: 'spring', stiffness: 200, damping: 15 }}
      >
        <motion.div
          whileHover={{ scale: 1.1 }}
          whileTap={{ scale: 0.95 }}
        >
          <Button
            size="lg"
            onClick={() => setIsOpen(true)}
            className="rounded-full h-14 w-14 shadow-lg bg-[#FF6600] hover:bg-[#FF6600]/90 text-white"
          >
            <div className="relative">
              <Users className="h-6 w-6" />
              <Share2 className="h-3 w-3 absolute -top-1 -right-1" />
            </div>
          </Button>
        </motion.div>
      </motion.div>

      <Dialog open={isOpen} onOpenChange={setIsOpen}>
        <DialogContent className="sm:max-w-[500px]">
          <DialogHeader>
            <DialogTitle>{t('smartGroups.createNewGroup')}</DialogTitle>
            <DialogDescription>
              {t('smartGroups.createNewGroup')}
            </DialogDescription>
          </DialogHeader>

          <form onSubmit={handleSubmit}>
            <div className="space-y-4 py-4">
              <div className="space-y-2">
                <Label htmlFor="name">{t('smartGroups.groupName')}</Label>
                <Input
                  id="name"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  placeholder="e.g., Weekend Rome Tour Group"
                  required
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="description">{t('smartGroups.description')}</Label>
                <Textarea
                  id="description"
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  placeholder="Describe your group..."
                  rows={3}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="targetParticipants">{t('smartGroups.targetParticipants')}</Label>
                <Input
                  id="targetParticipants"
                  type="number"
                  min="2"
                  max="20"
                  value={formData.targetParticipants}
                  onChange={(e) => setFormData({ ...formData, targetParticipants: parseInt(e.target.value) })}
                  required
                />
              </div>
            </div>

            <DialogFooter>
              <Button
                type="button"
                variant="outline"
                onClick={() => setIsOpen(false)}
              >
                {t('common.cancel')}
              </Button>
              <Button
                type="submit"
                disabled={createGroupMutation.isPending}
                className="bg-[#FF6600] hover:bg-[#FF6600]/90"
              >
                {createGroupMutation.isPending ? t('actions.creating') : t('smartGroups.createGroup')}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </>
  );
}
