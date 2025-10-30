import { Badge } from '@/components/ui/badge';
import { useTranslation } from 'react-i18next';
import { cn } from '@/lib/utils';

interface GroupStatusBadgeProps {
  status: 'active' | 'full' | 'expired' | 'completed';
  className?: string;
}

const statusStyles = {
  active: 'bg-green-500 text-white border-green-500',
  full: 'bg-blue-500 text-white border-blue-500',
  expired: 'bg-gray-500 text-white border-gray-500',
  completed: 'bg-orange-600 text-white border-orange-600',
};

export function GroupStatusBadge({ status, className }: GroupStatusBadgeProps) {
  const { t } = useTranslation();

  const statusLabels = {
    active: t('smartGroups.groupActive'),
    full: t('smartGroups.groupFull'),
    expired: t('smartGroups.groupExpired'),
    completed: t('smartGroups.groupCompleted'),
  };

  return (
    <Badge className={cn(statusStyles[status], className)}>
      {statusLabels[status]}
    </Badge>
  );
}
