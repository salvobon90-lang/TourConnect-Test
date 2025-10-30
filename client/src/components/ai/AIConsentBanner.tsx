import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useUpdateAIConsent } from '@/hooks/aiQueries';
import { useToast } from '@/hooks/use-toast';
import {
  AlertDialog,
  AlertDialogContent,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogDescription,
  AlertDialogFooter,
} from '@/components/ui/alert-dialog';
import { Button } from '@/components/ui/button';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';
import { ChevronDown, Shield, Database, Lock } from 'lucide-react';

interface AIConsentBannerProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onConsent?: (consented: boolean) => void;
}

export function AIConsentBanner({ open, onOpenChange, onConsent }: AIConsentBannerProps) {
  const { t } = useTranslation();
  const { toast } = useToast();
  const updateConsent = useUpdateAIConsent();
  const [showDetails, setShowDetails] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  const handleConsent = async (consent: boolean) => {
    setIsLoading(true);
    try {
      await updateConsent.mutateAsync(consent);
      toast({
        title: consent ? t('privacy.consentGranted') : t('privacy.consentRevoked'),
        description: consent 
          ? t('privacy.aiConsentDescription')
          : t('privacy.optOutAnytime'),
      });
      onConsent?.(consent);
      onOpenChange(false);
    } catch (error) {
      toast({
        title: 'Error',
        description: 'Failed to update consent. Please try again.',
        variant: 'destructive',
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <AlertDialog open={open} onOpenChange={onOpenChange}>
      <AlertDialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <AlertDialogHeader>
          <div className="flex items-center gap-2 mb-2">
            <Shield className="h-6 w-6 text-orange-500" />
            <AlertDialogTitle className="text-2xl">
              {t('privacy.aiConsentTitle')}
            </AlertDialogTitle>
          </div>
          <AlertDialogDescription className="text-base space-y-4">
            <p>{t('privacy.aiConsentDescription')}</p>
            
            <Collapsible open={showDetails} onOpenChange={setShowDetails}>
              <CollapsibleTrigger asChild>
                <button className="flex items-center gap-2 text-sm font-medium text-orange-600 hover:text-orange-700 transition-colors">
                  <ChevronDown className={`h-4 w-4 transition-transform ${showDetails ? 'rotate-180' : ''}`} />
                  {t('privacy.whatDataUsed')}
                </button>
              </CollapsibleTrigger>
              <CollapsibleContent className="mt-4 space-y-4">
                <div className="bg-orange-50 dark:bg-orange-950/20 rounded-lg p-4 space-y-3">
                  <div className="flex items-start gap-2">
                    <Database className="h-5 w-5 text-orange-600 mt-0.5" />
                    <div>
                      <h4 className="font-semibold text-sm text-orange-900 dark:text-orange-100 mb-2">
                        {t('privacy.dataUsed')}
                      </h4>
                      <ul className="space-y-1 text-sm text-orange-800 dark:text-orange-200">
                        <li>• {t('privacy.groupMessages')}</li>
                        <li>• {t('privacy.userLocations')}</li>
                        <li>• {t('privacy.eventSchedules')}</li>
                        <li>• {t('privacy.tourDetails')}</li>
                      </ul>
                    </div>
                  </div>
                </div>

                <div className="bg-green-50 dark:bg-green-950/20 rounded-lg p-4 space-y-3">
                  <div className="flex items-start gap-2">
                    <Lock className="h-5 w-5 text-green-600 mt-0.5" />
                    <div>
                      <h4 className="font-semibold text-sm text-green-900 dark:text-green-100 mb-2">
                        {t('privacy.neverUsed')}
                      </h4>
                      <ul className="space-y-1 text-sm text-green-800 dark:text-green-200">
                        <li>• {t('privacy.noPasswords')}</li>
                        <li>• {t('privacy.noPayment')}</li>
                        <li>• {t('privacy.noEmails')}</li>
                        <li>• {t('privacy.noContactDetails')}</li>
                      </ul>
                    </div>
                  </div>
                </div>

                <p className="text-xs text-muted-foreground italic">
                  {t('privacy.optOutAnytime')}
                </p>
              </CollapsibleContent>
            </Collapsible>
          </AlertDialogDescription>
        </AlertDialogHeader>
        
        <AlertDialogFooter className="flex-col sm:flex-row gap-2">
          <Button
            variant="outline"
            onClick={() => handleConsent(false)}
            disabled={isLoading}
            className="w-full sm:w-auto"
          >
            {t('privacy.noThanks')}
          </Button>
          <Button
            onClick={() => handleConsent(true)}
            disabled={isLoading}
            className="w-full sm:w-auto bg-orange-600 hover:bg-orange-700 text-white"
          >
            {isLoading ? t('common.loading') : t('privacy.enableAI')}
          </Button>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
