import { useState } from 'react';
import { motion } from 'framer-motion';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Share2, Download, Star, Quote, Sparkles, Copy, Check } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { useToast } from '@/hooks/use-toast';
import { useTourSummary } from '@/hooks/aiQueries';
import { LoadingSpinner } from '@/components/loading-spinner';
import { aiCardVariants } from './aiAnimations';

interface TourSummaryData {
  title: string;
  participants: Array<{
    id: string;
    name: string;
    avatar?: string;
  }>;
  highlights: string[];
  quotes: Array<{
    text: string;
    author: string;
  }>;
  recommendations: string[];
  shareableText: string;
  pointsEarned?: number;
}

interface SummaryShareCardProps {
  isOpen: boolean;
  onClose: () => void;
  groupId: string;
}

export function SummaryShareCard({ isOpen, onClose, groupId }: SummaryShareCardProps) {
  const { t } = useTranslation();
  const { toast } = useToast();
  const [summaryData, setSummaryData] = useState<TourSummaryData | null>(null);
  const [copied, setCopied] = useState(false);

  const summaryMutation = useTourSummary(groupId);

  const handleGenerateSummary = async (language = 'en') => {
    try {
      const result = await summaryMutation.mutateAsync(language);
      setSummaryData(result);
    } catch (error: any) {
      toast({
        title: t('common.error'),
        description: error.message || t('aiAssistant.summaryFailed'),
        variant: 'destructive'
      });
    }
  };

  const handleShare = async () => {
    if (!summaryData) return;

    if (navigator.share) {
      try {
        await navigator.share({
          title: summaryData.title,
          text: summaryData.shareableText
        });
      } catch (error) {
        console.log('Share cancelled');
      }
    } else {
      handleCopy();
    }
  };

  const handleCopy = async () => {
    if (!summaryData) return;

    try {
      await navigator.clipboard.writeText(summaryData.shareableText);
      setCopied(true);
      toast({
        title: t('common.success'),
        description: t('aiAssistant.copiedToClipboard')
      });
      setTimeout(() => setCopied(false), 2000);
    } catch (error) {
      toast({
        title: t('common.error'),
        description: t('aiAssistant.copyFailed'),
        variant: 'destructive'
      });
    }
  };

  const handleDownloadImage = async () => {
    toast({
      title: t('common.info'),
      description: t('aiAssistant.downloadFeatureComingSoon')
    });
  };

  if (!isOpen) return null;

  if (!summaryData && !summaryMutation.isPending) {
    handleGenerateSummary();
  }

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <div className="flex items-center justify-between">
            <DialogTitle className="flex items-center gap-2">
              <Sparkles className="h-5 w-5 text-[#FF6600]" />
              {t('aiAssistant.tourSummary')}
            </DialogTitle>
            {summaryData?.pointsEarned && (
              <Badge className="bg-[#FF6600] hover:bg-[#FF6600]/90">
                <Star className="h-3 w-3 mr-1" />
                +{summaryData.pointsEarned} {t('common.points')}
              </Badge>
            )}
          </div>
        </DialogHeader>

        {summaryMutation.isPending ? (
          <div className="py-12 flex flex-col items-center justify-center gap-4">
            <LoadingSpinner size="lg" />
            <div className="text-center space-y-2">
              <p className="font-medium">{t('aiAssistant.generatingSummary')}</p>
              <p className="text-sm text-muted-foreground">{t('aiAssistant.thisWillTake')}</p>
            </div>
          </div>
        ) : summaryData ? (
          <motion.div
            variants={aiCardVariants}
            initial="hidden"
            animate="visible"
            className="space-y-6"
          >
            <div>
              <h2 className="text-2xl font-bold mb-4">{summaryData.title}</h2>
              
              <div className="flex items-center gap-2 mb-6">
                <div className="flex -space-x-2">
                  {summaryData.participants.slice(0, 5).map((participant) => (
                    <Avatar key={participant.id} className="border-2 border-background">
                      <AvatarImage src={participant.avatar} />
                      <AvatarFallback>{participant.name[0]}</AvatarFallback>
                    </Avatar>
                  ))}
                </div>
                <span className="text-sm text-muted-foreground">
                  {summaryData.participants.length} {t('smartGroups.participants')}
                </span>
              </div>
            </div>

            {summaryData.highlights.length > 0 && (
              <Card className="p-4">
                <h3 className="font-semibold mb-3 flex items-center gap-2">
                  <Star className="h-4 w-4 text-[#FF6600]" />
                  {t('aiAssistant.highlights')}
                </h3>
                <ul className="space-y-2">
                  {summaryData.highlights.map((highlight, index) => (
                    <li key={index} className="flex items-start gap-2 text-sm">
                      <span className="text-[#FF6600] mt-1">•</span>
                      <span>{highlight}</span>
                    </li>
                  ))}
                </ul>
              </Card>
            )}

            {summaryData.quotes.length > 0 && (
              <div className="space-y-3">
                <h3 className="font-semibold flex items-center gap-2">
                  <Quote className="h-4 w-4 text-[#FF6600]" />
                  {t('aiAssistant.memorableQuotes')}
                </h3>
                {summaryData.quotes.map((quote, index) => (
                  <blockquote
                    key={index}
                    className="border-l-4 border-[#FF6600] pl-4 py-2 italic bg-muted/50 rounded-r"
                  >
                    <p className="text-sm mb-1">"{quote.text}"</p>
                    <footer className="text-xs text-muted-foreground">
                      — {quote.author}
                    </footer>
                  </blockquote>
                ))}
              </div>
            )}

            {summaryData.recommendations.length > 0 && (
              <Card className="p-4 bg-[#FF6600]/5 border-[#FF6600]/20">
                <h3 className="font-semibold mb-3">{t('aiAssistant.recommendations')}</h3>
                <ul className="space-y-2">
                  {summaryData.recommendations.map((recommendation, index) => (
                    <li key={index} className="flex items-start gap-2 text-sm">
                      <span className="text-[#FF6600] mt-1">→</span>
                      <span>{recommendation}</span>
                    </li>
                  ))}
                </ul>
              </Card>
            )}

            <div className="pt-4 border-t">
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                <Button
                  onClick={handleShare}
                  className="bg-[#FF6600] hover:bg-[#FF6600]/90 gap-2"
                >
                  <Share2 className="h-4 w-4" />
                  {t('common.share')}
                </Button>
                
                <Button
                  onClick={handleCopy}
                  variant="outline"
                  className="gap-2"
                >
                  {copied ? (
                    <>
                      <Check className="h-4 w-4" />
                      {t('common.copied')}
                    </>
                  ) : (
                    <>
                      <Copy className="h-4 w-4" />
                      {t('common.copy')}
                    </>
                  )}
                </Button>

                <Button
                  onClick={handleDownloadImage}
                  variant="outline"
                  className="gap-2 col-span-2 sm:col-span-1"
                >
                  <Download className="h-4 w-4" />
                  {t('aiAssistant.downloadImage')}
                </Button>
              </div>
            </div>
          </motion.div>
        ) : null}
      </DialogContent>
    </Dialog>
  );
}
