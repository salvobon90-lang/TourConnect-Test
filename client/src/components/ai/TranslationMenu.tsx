import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Button } from '@/components/ui/button';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { Languages, ChevronDown } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { useMessageTranslation } from '@/hooks/aiQueries';
import { LoadingSpinner } from '@/components/loading-spinner';
import { useToast } from '@/hooks/use-toast';

const LANGUAGES = [
  { code: 'en', label: 'English', flag: '🇬🇧' },
  { code: 'it', label: 'Italian', flag: '🇮🇹' },
  { code: 'de', label: 'German', flag: '🇩🇪' },
  { code: 'fr', label: 'French', flag: '🇫🇷' },
  { code: 'es', label: 'Spanish', flag: '🇪🇸' }
];

interface TranslationMenuProps {
  messageId: string;
  messageText: string;
  groupId: string;
}

export function TranslationMenu({ messageId, messageText, groupId }: TranslationMenuProps) {
  const { t } = useTranslation();
  const { toast } = useToast();
  const [isOpen, setIsOpen] = useState(false);
  const [translatedText, setTranslatedText] = useState<string | null>(null);
  const [showTranslation, setShowTranslation] = useState(false);
  const [autoTranslate, setAutoTranslate] = useState(() => {
    return localStorage.getItem('autoTranslate') === 'true';
  });

  const translateMutation = useMessageTranslation(groupId);

  const handleTranslate = async (targetLanguage: string) => {
    try {
      const result = await translateMutation.mutateAsync({
        text: messageText,
        targetLanguage
      });
      setTranslatedText(result.translatedText);
      setShowTranslation(true);
      setIsOpen(false);
    } catch (error) {
      toast({
        title: t('common.error'),
        description: t('aiAssistant.translationFailed'),
        variant: 'destructive'
      });
    }
  };

  const handleAutoTranslateToggle = (checked: boolean) => {
    setAutoTranslate(checked);
    localStorage.setItem('autoTranslate', checked.toString());
  };

  return (
    <div className="inline-flex flex-col gap-2">
      <Popover open={isOpen} onOpenChange={setIsOpen}>
        <PopoverTrigger asChild>
          <Button
            variant="ghost"
            size="sm"
            className="h-8 gap-1 text-muted-foreground hover:text-[#FF6600]"
          >
            <Languages className="h-4 w-4" />
            <span className="text-xs">{t('aiAssistant.translate')}</span>
          </Button>
        </PopoverTrigger>
        <PopoverContent className="w-56 p-3" align="start">
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <Label htmlFor="auto-translate" className="text-sm">
                {t('aiAssistant.autoTranslate')}
              </Label>
              <Switch
                id="auto-translate"
                checked={autoTranslate}
                onCheckedChange={handleAutoTranslateToggle}
              />
            </div>

            <div className="border-t pt-3">
              <p className="text-xs text-muted-foreground mb-2">
                {t('aiAssistant.selectLanguage')}
              </p>
              <div className="space-y-1">
                {LANGUAGES.map((language) => (
                  <Button
                    key={language.code}
                    onClick={() => handleTranslate(language.code)}
                    disabled={translateMutation.isPending}
                    variant="ghost"
                    className="w-full justify-start gap-2 h-9"
                  >
                    <span className="text-base">{language.flag}</span>
                    <span className="text-sm">{language.label}</span>
                    {translateMutation.isPending && (
                      <div className="ml-auto">
                        <LoadingSpinner size="sm" />
                      </div>
                    )}
                  </Button>
                ))}
              </div>
            </div>
          </div>
        </PopoverContent>
      </Popover>

      <AnimatePresence>
        {showTranslation && translatedText && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            className="mt-2 p-3 bg-muted/50 rounded-lg border-l-2 border-[#FF6600]"
          >
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs font-medium text-[#FF6600] flex items-center gap-1">
                <Languages className="h-3 w-3" />
                {t('aiAssistant.translation')}
              </span>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setShowTranslation(false)}
                className="h-6 px-2 text-xs"
              >
                {t('common.hide')}
              </Button>
            </div>
            <p className="text-sm">{translatedText}</p>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
