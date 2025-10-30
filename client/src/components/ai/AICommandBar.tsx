import { useState } from 'react';
import { motion } from 'framer-motion';
import { Button } from '@/components/ui/button';
import { MapPin, Bell, FileText, Languages } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { commandButtonVariants } from './aiAnimations';
import { LoadingSpinner } from '@/components/loading-spinner';

interface AICommandBarProps {
  groupId: string;
  onSuggestMeeting: () => void;
  onCreateReminder: () => void;
  onGenerateSummary: () => void;
  onToggleTranslate: () => void;
  isLoading?: {
    meeting?: boolean;
    reminder?: boolean;
    summary?: boolean;
    translate?: boolean;
  };
}

export function AICommandBar({
  groupId,
  onSuggestMeeting,
  onCreateReminder,
  onGenerateSummary,
  onToggleTranslate,
  isLoading = {}
}: AICommandBarProps) {
  const { t } = useTranslation();

  const commands = [
    {
      id: 'meeting',
      label: t('aiAssistant.suggestMeeting'),
      icon: MapPin,
      onClick: onSuggestMeeting,
      isLoading: isLoading.meeting,
      color: 'bg-[#FF6600] hover:bg-[#FF6600]/90'
    },
    {
      id: 'reminder',
      label: t('aiAssistant.createReminder'),
      icon: Bell,
      onClick: onCreateReminder,
      isLoading: isLoading.reminder,
      color: 'bg-[#FF6600] hover:bg-[#FF6600]/90'
    },
    {
      id: 'summary',
      label: t('aiAssistant.generateSummary'),
      icon: FileText,
      onClick: onGenerateSummary,
      isLoading: isLoading.summary,
      color: 'bg-[#FF6600] hover:bg-[#FF6600]/90'
    },
    {
      id: 'translate',
      label: t('aiAssistant.translate'),
      icon: Languages,
      onClick: onToggleTranslate,
      isLoading: isLoading.translate,
      color: 'bg-[#FF6600] hover:bg-[#FF6600]/90'
    }
  ];

  return (
    <div className="border-b bg-card/50 backdrop-blur-sm sticky top-0 z-10">
      <div className="p-3 overflow-x-auto">
        <div className="flex gap-2 min-w-max">
          {commands.map((command) => {
            const Icon = command.icon;
            return (
              <motion.div
                key={command.id}
                variants={commandButtonVariants}
                initial="idle"
                whileHover="hover"
                whileTap="tap"
              >
                <Button
                  onClick={command.onClick}
                  disabled={command.isLoading}
                  className={`${command.color} text-white gap-2 text-sm`}
                  size="sm"
                >
                  {command.isLoading ? (
                    <LoadingSpinner size="sm" />
                  ) : (
                    <Icon className="h-4 w-4" />
                  )}
                  <span className="hidden sm:inline">{command.label}</span>
                </Button>
              </motion.div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
