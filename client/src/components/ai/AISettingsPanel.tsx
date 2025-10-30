import { useTranslation } from 'react-i18next';
import { useAIConsent, useUpdateAIConsent } from '@/hooks/aiQueries';
import { useToast } from '@/hooks/use-toast';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { Separator } from '@/components/ui/separator';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';
import { Badge } from '@/components/ui/badge';
import { Shield, ChevronDown, CheckCircle2, XCircle, Database, Lock, Info } from 'lucide-react';
import { format } from 'date-fns';
import { useState } from 'react';

export function AISettingsPanel() {
  const { t } = useTranslation();
  const { toast } = useToast();
  const { data: consentData, isLoading } = useAIConsent();
  const updateConsent = useUpdateAIConsent();
  const [showDataDetails, setShowDataDetails] = useState(false);

  const hasConsented = consentData?.hasConsented ?? false;
  const consentDate = consentData?.consentDate;

  const handleToggle = async (checked: boolean) => {
    try {
      await updateConsent.mutateAsync(checked);
      toast({
        title: checked ? t('privacy.consentGranted') : t('privacy.consentRevoked'),
        description: checked
          ? 'You can now use AI features for translations, summaries, and more.'
          : 'AI features have been disabled.',
      });
    } catch (error) {
      toast({
        title: 'Error',
        description: 'Failed to update AI consent. Please try again.',
        variant: 'destructive',
      });
    }
  };

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <Shield className="h-5 w-5 text-orange-600" />
              <CardTitle>{t('privacy.aiSettings')}</CardTitle>
            </div>
            <CardDescription>{t('privacy.aiSettingsDesc')}</CardDescription>
          </div>
          <Badge variant={hasConsented ? 'default' : 'secondary'} className="ml-auto">
            {hasConsented ? (
              <span className="flex items-center gap-1">
                <CheckCircle2 className="h-3 w-3" />
                {t('privacy.enabled')}
              </span>
            ) : (
              <span className="flex items-center gap-1">
                <XCircle className="h-3 w-3" />
                {t('privacy.disabled')}
              </span>
            )}
          </Badge>
        </div>
      </CardHeader>

      <CardContent className="space-y-6">
        <div className="flex items-center justify-between space-x-2">
          <Label htmlFor="ai-consent" className="flex flex-col space-y-1">
            <span className="font-medium">{t('privacy.toggle')}</span>
            <span className="font-normal text-sm text-muted-foreground">
              {hasConsented
                ? 'AI assistance is currently active'
                : 'Enable AI to use smart features'}
            </span>
          </Label>
          <Switch
            id="ai-consent"
            checked={hasConsented}
            onCheckedChange={handleToggle}
            disabled={isLoading || updateConsent.isPending}
          />
        </div>

        {consentDate && (
          <div className="text-xs text-muted-foreground">
            {t('privacy.lastUpdated', {
              date: format(new Date(consentDate), 'PPP'),
            })}
          </div>
        )}

        <Separator />

        <Collapsible open={showDataDetails} onOpenChange={setShowDataDetails}>
          <CollapsibleTrigger asChild>
            <button className="flex items-center gap-2 text-sm font-medium text-orange-600 hover:text-orange-700 transition-colors w-full">
              <Info className="h-4 w-4" />
              <span>{t('privacy.whatDataUsed')}</span>
              <ChevronDown
                className={`h-4 w-4 ml-auto transition-transform ${
                  showDataDetails ? 'rotate-180' : ''
                }`}
              />
            </button>
          </CollapsibleTrigger>

          <CollapsibleContent className="mt-4 space-y-4">
            <div className="bg-orange-50 dark:bg-orange-950/20 rounded-lg p-4 space-y-3">
              <div className="flex items-start gap-2">
                <Database className="h-5 w-5 text-orange-600 mt-0.5 flex-shrink-0" />
                <div className="flex-1">
                  <h4 className="font-semibold text-sm text-orange-900 dark:text-orange-100 mb-2">
                    {t('privacy.dataUsed')}
                  </h4>
                  <ul className="space-y-1.5 text-sm text-orange-800 dark:text-orange-200">
                    <li className="flex items-start gap-2">
                      <span className="text-orange-600 mt-0.5">•</span>
                      <span>{t('privacy.groupMessages')}</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <span className="text-orange-600 mt-0.5">•</span>
                      <span>{t('privacy.userLocations')}</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <span className="text-orange-600 mt-0.5">•</span>
                      <span>{t('privacy.eventSchedules')}</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <span className="text-orange-600 mt-0.5">•</span>
                      <span>{t('privacy.tourDetails')}</span>
                    </li>
                  </ul>
                </div>
              </div>
            </div>

            <div className="bg-green-50 dark:bg-green-950/20 rounded-lg p-4 space-y-3">
              <div className="flex items-start gap-2">
                <Lock className="h-5 w-5 text-green-600 mt-0.5 flex-shrink-0" />
                <div className="flex-1">
                  <h4 className="font-semibold text-sm text-green-900 dark:text-green-100 mb-2">
                    {t('privacy.neverUsed')}
                  </h4>
                  <ul className="space-y-1.5 text-sm text-green-800 dark:text-green-200">
                    <li className="flex items-start gap-2">
                      <span className="text-green-600 mt-0.5">•</span>
                      <span>{t('privacy.noPasswords')}</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <span className="text-green-600 mt-0.5">•</span>
                      <span>{t('privacy.noPayment')}</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <span className="text-green-600 mt-0.5">•</span>
                      <span>{t('privacy.noEmails')}</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <span className="text-green-600 mt-0.5">•</span>
                      <span>{t('privacy.noContactDetails')}</span>
                    </li>
                  </ul>
                </div>
              </div>
            </div>

            <div className="flex items-center gap-2 text-xs text-muted-foreground bg-muted p-3 rounded-lg">
              <Shield className="h-4 w-4" />
              <span>{t('privacy.gdprCompliant')} • {t('privacy.optOutAnytime')}</span>
            </div>
          </CollapsibleContent>
        </Collapsible>
      </CardContent>
    </Card>
  );
}
