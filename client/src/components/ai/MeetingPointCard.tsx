import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { MapContainer, TileLayer, Marker, Popup } from 'react-leaflet';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { MapPin, Copy, Check, Star } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { useToast } from '@/hooks/use-toast';
import { aiCardVariants, mapCardVariants } from './aiAnimations';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';

const orangeIcon = new L.Icon({
  iconUrl: 'https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-2x-orange.png',
  shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png',
  iconSize: [25, 41],
  iconAnchor: [12, 41],
  popupAnchor: [1, -34],
  shadowSize: [41, 41]
});

const blueIcon = new L.Icon({
  iconUrl: 'https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-2x-blue.png',
  shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png',
  iconSize: [20, 33],
  iconAnchor: [10, 33],
  popupAnchor: [1, -28],
  shadowSize: [33, 33]
});

interface MeetingPointData {
  location: {
    name: string;
    latitude: number;
    longitude: number;
  };
  reasoning: string;
  participants: Array<{
    id: string;
    name: string;
    latitude: number;
    longitude: number;
    distance: number;
  }>;
  pointsEarned?: number;
}

interface MeetingPointCardProps {
  data: MeetingPointData;
  onClose: () => void;
}

export function MeetingPointCard({ data, onClose }: MeetingPointCardProps) {
  const { t } = useTranslation();
  const { toast } = useToast();
  const [copied, setCopied] = useState(false);

  const handleCopyLocation = async () => {
    const locationText = `${data.location.name}\nCoordinates: ${data.location.latitude}, ${data.location.longitude}`;
    
    try {
      await navigator.clipboard.writeText(locationText);
      setCopied(true);
      toast({
        title: t('aiAssistant.locationCopied'),
        description: t('aiAssistant.locationCopiedDesc'),
      });
      setTimeout(() => setCopied(false), 2000);
    } catch (error) {
      toast({
        title: t('common.error'),
        description: t('aiAssistant.copyFailed'),
        variant: 'destructive',
      });
    }
  };

  return (
    <AnimatePresence>
      <motion.div
        variants={aiCardVariants}
        initial="hidden"
        animate="visible"
        exit="exit"
      >
        <Card className="p-4 mb-4 border-[#FF6600]/20 bg-card/95 backdrop-blur-sm">
          <div className="flex items-start justify-between mb-3">
            <div className="flex items-center gap-2">
              <MapPin className="h-5 w-5 text-[#FF6600]" />
              <h3 className="font-semibold">{t('aiAssistant.suggestedMeetingPoint')}</h3>
            </div>
            {data.pointsEarned && (
              <Badge className="bg-[#FF6600] hover:bg-[#FF6600]/90">
                <Star className="h-3 w-3 mr-1" />
                +{data.pointsEarned} {t('common.points')}
              </Badge>
            )}
          </div>

          <div className="space-y-4">
            <div>
              <h4 className="font-medium text-lg mb-1">{data.location.name}</h4>
              <p className="text-sm text-muted-foreground mb-2">
                {data.location.latitude.toFixed(6)}, {data.location.longitude.toFixed(6)}
              </p>
              <p className="text-sm">{data.reasoning}</p>
            </div>

            <motion.div
              variants={mapCardVariants}
              initial="hidden"
              animate="visible"
              className="rounded-lg overflow-hidden border"
              style={{ height: '200px' }}
            >
              <MapContainer
                center={[data.location.latitude, data.location.longitude]}
                zoom={13}
                style={{ height: '100%', width: '100%' }}
                zoomControl={true}
                scrollWheelZoom={false}
              >
                <TileLayer
                  attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
                  url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                />
                
                <Marker
                  position={[data.location.latitude, data.location.longitude]}
                  icon={orangeIcon}
                >
                  <Popup>
                    <div className="text-center">
                      <p className="font-semibold">{data.location.name}</p>
                      <p className="text-xs">{t('aiAssistant.optimalMeetingPoint')}</p>
                    </div>
                  </Popup>
                </Marker>

                {data.participants.map((participant) => (
                  <Marker
                    key={participant.id}
                    position={[participant.latitude, participant.longitude]}
                    icon={blueIcon}
                  >
                    <Popup>
                      <div className="text-center">
                        <p className="font-semibold">{participant.name}</p>
                        <p className="text-xs">
                          {participant.distance.toFixed(2)} km {t('common.away')}
                        </p>
                      </div>
                    </Popup>
                  </Marker>
                ))}
              </MapContainer>
            </motion.div>

            <div className="grid grid-cols-2 gap-2 pt-2">
              <Button
                onClick={handleCopyLocation}
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
                    {t('aiAssistant.copyLocation')}
                  </>
                )}
              </Button>
              <Button
                onClick={onClose}
                className="bg-[#FF6600] hover:bg-[#FF6600]/90"
              >
                {t('common.close')}
              </Button>
            </div>

            <div className="text-xs text-muted-foreground">
              <p className="font-medium mb-1">{t('aiAssistant.participantDistances')}:</p>
              <ul className="space-y-1">
                {data.participants.map((participant) => (
                  <li key={participant.id}>
                    {participant.name}: {participant.distance.toFixed(2)} km
                  </li>
                ))}
              </ul>
            </div>
          </div>
        </Card>
      </motion.div>
    </AnimatePresence>
  );
}
