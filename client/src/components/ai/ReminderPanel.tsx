import { useState } from 'react';
import { motion } from 'framer-motion';
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetDescription } from '@/components/ui/sheet';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Card } from '@/components/ui/card';
import { Bell, MapPin, Calendar, Clock, Star, Check, AlertCircle } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { useToast } from '@/hooks/use-toast';
import { useScheduleEvent, useGroupEvents } from '@/hooks/aiQueries';
import { useUserLocation } from '@/hooks/use-location';
import { LoadingSpinner } from '@/components/loading-spinner';
import { format, formatDistanceToNow } from 'date-fns';
import { aiCardVariants } from './aiAnimations';

interface ReminderPanelProps {
  isOpen: boolean;
  onClose: () => void;
  groupId: string;
}

interface EventFormData {
  eventType: string;
  title: string;
  description: string;
  eventDate: string;
  eventTime: string;
  location: string;
  useCurrentLocation: boolean;
}

export function ReminderPanel({ isOpen, onClose, groupId }: ReminderPanelProps) {
  const { t } = useTranslation();
  const { toast } = useToast();
  const { location, requestLocation } = useUserLocation();
  const [activeTab, setActiveTab] = useState('create');
  const [formData, setFormData] = useState<EventFormData>({
    eventType: 'reminder',
    title: '',
    description: '',
    eventDate: '',
    eventTime: '',
    location: '',
    useCurrentLocation: false
  });

  const scheduleEventMutation = useScheduleEvent(groupId);
  const { data: events = [], isLoading: eventsLoading } = useGroupEvents(groupId);

  const handleUseCurrentLocation = async () => {
    if (location) {
      setFormData({
        ...formData,
        location: `${location.latitude}, ${location.longitude}`,
        useCurrentLocation: true
      });
    } else {
      await requestLocation();
      toast({
        title: t('common.loading'),
        description: t('aiAssistant.gettingLocation')
      });
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (formData.title.length > 200) {
      toast({
        title: t('common.error'),
        description: t('aiAssistant.titleTooLong'),
        variant: 'destructive'
      });
      return;
    }

    if (formData.description.length > 500) {
      toast({
        title: t('common.error'),
        description: t('aiAssistant.descriptionTooLong'),
        variant: 'destructive'
      });
      return;
    }

    const eventDateTime = new Date(`${formData.eventDate}T${formData.eventTime}`);
    if (eventDateTime <= new Date()) {
      toast({
        title: t('common.error'),
        description: t('aiAssistant.futureDateRequired'),
        variant: 'destructive'
      });
      return;
    }

    const eventData: any = {
      eventType: formData.eventType,
      title: formData.title,
      description: formData.description || undefined,
      eventDate: eventDateTime.toISOString(),
      location: formData.location || undefined
    };

    if (formData.useCurrentLocation && location) {
      eventData.latitude = location.latitude;
      eventData.longitude = location.longitude;
    }

    try {
      const result = await scheduleEventMutation.mutateAsync(eventData);
      
      toast({
        title: t('aiAssistant.eventCreated'),
        description: (
          <div className="flex items-center gap-2">
            <span>{t('aiAssistant.eventCreatedSuccess')}</span>
            {result.pointsEarned && (
              <Badge className="bg-[#FF6600]">
                <Star className="h-3 w-3 mr-1" />
                +{result.pointsEarned}
              </Badge>
            )}
          </div>
        )
      });

      setFormData({
        eventType: 'reminder',
        title: '',
        description: '',
        eventDate: '',
        eventTime: '',
        location: '',
        useCurrentLocation: false
      });

      setActiveTab('upcoming');

      if (result.hasConflict && result.alternatives) {
        toast({
          title: t('aiAssistant.conflictDetected'),
          description: t('aiAssistant.alternativeSuggested'),
          variant: 'default'
        });
      }
    } catch (error: any) {
      toast({
        title: t('common.error'),
        description: error.message || t('aiAssistant.eventCreationFailed'),
        variant: 'destructive'
      });
    }
  };

  const getEventTypeBadge = (type: string) => {
    const types: Record<string, { color: string; icon: any }> = {
      reminder: { color: 'bg-blue-500', icon: Bell },
      meeting: { color: 'bg-green-500', icon: Calendar },
      schedule: { color: 'bg-purple-500', icon: Clock }
    };
    const config = types[type] || types.reminder;
    const Icon = config.icon;
    return (
      <Badge className={`${config.color} text-white`}>
        <Icon className="h-3 w-3 mr-1" />
        {type}
      </Badge>
    );
  };

  return (
    <Sheet open={isOpen} onOpenChange={onClose}>
      <SheetContent side="right" className="w-full sm:max-w-xl overflow-y-auto">
        <SheetHeader>
          <SheetTitle>{t('aiAssistant.eventReminder')}</SheetTitle>
          <SheetDescription>
            {t('aiAssistant.manageEvents')}
          </SheetDescription>
        </SheetHeader>

        <Tabs value={activeTab} onValueChange={setActiveTab} className="mt-6">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="create">{t('aiAssistant.create')}</TabsTrigger>
            <TabsTrigger value="upcoming">{t('aiAssistant.upcoming')}</TabsTrigger>
          </TabsList>

          <TabsContent value="create" className="space-y-4 mt-4">
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="eventType">{t('aiAssistant.eventType')}</Label>
                <Select
                  value={formData.eventType}
                  onValueChange={(value) => setFormData({ ...formData, eventType: value })}
                >
                  <SelectTrigger id="eventType">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="reminder">{t('aiAssistant.reminder')}</SelectItem>
                    <SelectItem value="meeting">{t('aiAssistant.meeting')}</SelectItem>
                    <SelectItem value="schedule">{t('aiAssistant.schedule')}</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="title">
                  {t('aiAssistant.title')} <span className="text-xs text-muted-foreground">(max 200)</span>
                </Label>
                <Input
                  id="title"
                  value={formData.title}
                  onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                  placeholder={t('aiAssistant.enterTitle')}
                  maxLength={200}
                  required
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="description">
                  {t('aiAssistant.description')} <span className="text-xs text-muted-foreground">(optional, max 500)</span>
                </Label>
                <Textarea
                  id="description"
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  placeholder={t('aiAssistant.enterDescription')}
                  maxLength={500}
                  rows={3}
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="eventDate">{t('aiAssistant.date')}</Label>
                  <Input
                    id="eventDate"
                    type="date"
                    value={formData.eventDate}
                    onChange={(e) => setFormData({ ...formData, eventDate: e.target.value })}
                    min={new Date().toISOString().split('T')[0]}
                    required
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="eventTime">{t('aiAssistant.time')}</Label>
                  <Input
                    id="eventTime"
                    type="time"
                    value={formData.eventTime}
                    onChange={(e) => setFormData({ ...formData, eventTime: e.target.value })}
                    required
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="location">{t('aiAssistant.location')} <span className="text-xs text-muted-foreground">(optional)</span></Label>
                <div className="flex gap-2">
                  <Input
                    id="location"
                    value={formData.location}
                    onChange={(e) => setFormData({ ...formData, location: e.target.value })}
                    placeholder={t('aiAssistant.enterLocation')}
                    className="flex-1"
                  />
                  <Button
                    type="button"
                    variant="outline"
                    onClick={handleUseCurrentLocation}
                    className="gap-2"
                  >
                    <MapPin className="h-4 w-4" />
                  </Button>
                </div>
              </div>

              <Button
                type="submit"
                className="w-full bg-[#FF6600] hover:bg-[#FF6600]/90"
                disabled={scheduleEventMutation.isPending}
              >
                {scheduleEventMutation.isPending ? (
                  <LoadingSpinner size="sm" />
                ) : (
                  t('aiAssistant.createReminder')
                )}
              </Button>
            </form>
          </TabsContent>

          <TabsContent value="upcoming" className="space-y-3 mt-4">
            {eventsLoading ? (
              <div className="flex justify-center py-8">
                <LoadingSpinner size="lg" />
              </div>
            ) : events.length === 0 ? (
              <Card className="p-8 text-center">
                <Bell className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
                <p className="text-muted-foreground">{t('aiAssistant.noUpcomingEvents')}</p>
              </Card>
            ) : (
              events.map((event: any) => (
                <motion.div
                  key={event.id}
                  variants={aiCardVariants}
                  initial="hidden"
                  animate="visible"
                >
                  <Card className="p-4">
                    <div className="flex items-start justify-between mb-2">
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-2">
                          {getEventTypeBadge(event.eventType)}
                          {event.status === 'completed' && (
                            <Badge variant="outline" className="gap-1">
                              <Check className="h-3 w-3" />
                              {t('common.completed')}
                            </Badge>
                          )}
                        </div>
                        <h4 className="font-semibold">{event.title}</h4>
                        {event.description && (
                          <p className="text-sm text-muted-foreground mt-1">{event.description}</p>
                        )}
                      </div>
                    </div>

                    <div className="space-y-2 text-sm">
                      <div className="flex items-center gap-2 text-muted-foreground">
                        <Clock className="h-4 w-4" />
                        <span>{format(new Date(event.eventDate), 'PPp')}</span>
                        <span className="text-[#FF6600] font-medium">
                          ({formatDistanceToNow(new Date(event.eventDate), { addSuffix: true })})
                        </span>
                      </div>

                      {event.location && (
                        <div className="flex items-center gap-2 text-muted-foreground">
                          <MapPin className="h-4 w-4" />
                          <span>{event.location}</span>
                        </div>
                      )}
                    </div>
                  </Card>
                </motion.div>
              ))
            )}
          </TabsContent>
        </Tabs>
      </SheetContent>
    </Sheet>
  );
}
