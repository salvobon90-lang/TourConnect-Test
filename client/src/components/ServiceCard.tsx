import { Link } from 'wouter';
import { MapPin, Clock, Users, Heart, Star } from 'lucide-react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { useTranslation } from 'react-i18next';

interface ServiceCardProps {
  service: {
    id: string;
    title: string;
    description: string;
    price: string;
    duration: number;
    categoryId: string;
    category?: { name: string; icon: string };
    provider?: { name: string; id: string; isPartner?: boolean };
    images: string[];
    location: string;
    rating?: number;
    reviewCount?: number;
    likeCount?: number;
    isLiked?: boolean;
  };
  onLike?: () => void;
}

export function ServiceCard({ service, onLike }: ServiceCardProps) {
  const { t } = useTranslation();
  
  return (
    <Card className="overflow-hidden hover:shadow-lg transition-shadow">
      <Link href={`/services/${service.id}`}>
        <div className="relative h-48 overflow-hidden">
          <img 
            src={service.images[0] || '/placeholder-service.jpg'} 
            alt={service.title}
            className="w-full h-full object-cover hover:scale-105 transition-transform duration-300"
          />
          {service.provider?.isPartner && (
            <Badge className="absolute top-2 right-2 bg-primary">
              {t('services.verified')}
            </Badge>
          )}
        </div>
      </Link>
      
      <div className="p-4">
        <div className="flex justify-between items-start mb-2">
          <Link href={`/services/${service.id}`}>
            <h3 className="font-semibold text-lg hover:text-primary transition-colors">
              {service.title}
            </h3>
          </Link>
          <Button
            variant="ghost"
            size="sm"
            onClick={onLike}
            className={service.isLiked ? 'text-red-500' : ''}
          >
            <Heart className={service.isLiked ? 'fill-current' : ''} />
          </Button>
        </div>
        
        <Link href={`/profile/${service.provider?.id}`}>
          <p className="text-sm text-muted-foreground hover:text-primary mb-2">
            {t('services.byProvider', { name: service.provider?.name })}
          </p>
        </Link>
        
        <div className="flex items-center gap-4 text-sm text-muted-foreground mb-3">
          <div className="flex items-center gap-1">
            <MapPin className="w-4 h-4" />
            <span>{service.location}</span>
          </div>
          <div className="flex items-center gap-1">
            <Clock className="w-4 h-4" />
            <span>{service.duration} {t('services.minutes')}</span>
          </div>
        </div>
        
        {service.rating && (
          <div className="flex items-center gap-2 mb-3">
            <Star className="w-4 h-4 fill-yellow-400 text-yellow-400" />
            <span className="font-medium">{service.rating.toFixed(1)}</span>
            <span className="text-sm text-muted-foreground">
              ({service.reviewCount} {t('services.reviews')})
            </span>
          </div>
        )}
        
        <div className="flex justify-between items-center mt-4">
          <div>
            <span className="text-2xl font-bold">${service.price}</span>
            <span className="text-sm text-muted-foreground"> {t('services.perPerson')}</span>
          </div>
          <Link href={`/services/${service.id}`}>
            <Button>{t('services.viewDetails')}</Button>
          </Link>
        </div>
      </div>
    </Card>
  );
}
