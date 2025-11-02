import { useQuery, useMutation } from '@tanstack/react-query';
import { useParams, Link } from 'wouter';
import { useTranslation } from 'react-i18next';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { MapPin, Clock, Users, Heart, Star, Calendar } from 'lucide-react';

export default function ServiceDetail() {
  const { id } = useParams();
  const { t } = useTranslation();
  
  const { data: service, isLoading } = useQuery<any>({
    queryKey: [`/api/services/${id}`],
    queryFn: async () => {
      const res = await fetch(`/api/services/${id}`);
      if (!res.ok) throw new Error('Failed to fetch service');
      return res.json();
    },
  });
  
  const likeMutation = useMutation({
    mutationFn: async () => {
      const res = await fetch(`/api/services/${id}/like`, { method: 'POST' });
      if (!res.ok) throw new Error('Failed to like');
      return res.json();
    },
  });
  
  const bookMutation = useMutation({
    mutationFn: async (bookingData: any) => {
      const res = await fetch(`/api/services/${id}/book`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(bookingData),
      });
      if (!res.ok) throw new Error('Failed to book');
      return res.json();
    },
  });
  
  if (isLoading) return <div className="container mx-auto px-4 py-8">{t('common.loading')}</div>;
  if (!service) return <div className="container mx-auto px-4 py-8">{t('services.notFound')}</div>;
  
  return (
    <div className="container mx-auto px-4 py-8">
      {/* Image Gallery */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-8">
        <div className="h-96 rounded-lg overflow-hidden">
          <img 
            src={service.images[0] || '/placeholder-service.jpg'} 
            alt={service.title}
            className="w-full h-full object-cover"
          />
        </div>
        <div className="grid grid-cols-2 gap-4">
          {service.images.slice(1, 5).map((img: string, i: number) => (
            <div key={i} className="h-44 rounded-lg overflow-hidden">
              <img src={img} alt="" className="w-full h-full object-cover" />
            </div>
          ))}
        </div>
      </div>
      
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Main Content */}
        <div className="lg:col-span-2 space-y-6">
          <div>
            <div className="flex justify-between items-start mb-2">
              <h1 className="text-4xl font-bold">{service.title}</h1>
              <Button variant="ghost" onClick={() => likeMutation.mutate()}>
                <Heart className={service.isLiked ? 'fill-current text-red-500' : ''} />
              </Button>
            </div>
            
            <Link href={`/guide/${service.provider?.id}`}>
              <button 
                className="text-lg text-muted-foreground hover:text-orange-600 hover:underline transition-colors cursor-pointer text-left"
                aria-label={`View ${service.provider?.name}'s profile`}
              >
                {t('services.byProvider', { name: service.provider?.name })}
                {service.provider?.isPartner && (
                  <Badge className="ml-2">{t('services.verified')}</Badge>
                )}
              </button>
            </Link>
          </div>
          
          <div className="flex gap-6 text-muted-foreground">
            <div className="flex items-center gap-2">
              <MapPin className="w-5 h-5" />
              <span>{service.location}</span>
            </div>
            <div className="flex items-center gap-2">
              <Clock className="w-5 h-5" />
              <span>{service.duration} {t('services.minutes')}</span>
            </div>
            {service.rating && (
              <div className="flex items-center gap-2">
                <Star className="w-5 h-5 fill-yellow-400 text-yellow-400" />
                <span>{service.rating.toFixed(1)} ({service.reviewCount} {t('services.reviews')})</span>
              </div>
            )}
          </div>
          
          <div>
            <h2 className="text-2xl font-semibold mb-4">{t('services.about')}</h2>
            <p className="text-muted-foreground whitespace-pre-line">{service.description}</p>
          </div>
          
          <div>
            <h2 className="text-2xl font-semibold mb-4">{t('services.languages')}</h2>
            <div className="flex gap-2">
              {service.languages?.map((lang: string) => (
                <Badge key={lang} variant="secondary">{lang.toUpperCase()}</Badge>
              ))}
            </div>
          </div>
        </div>
        
        {/* Booking Card */}
        <div className="lg:col-span-1">
          <Card className="p-6 sticky top-4">
            <div className="mb-6">
              <span className="text-3xl font-bold">${service.price}</span>
              <span className="text-muted-foreground"> {t('services.perPerson')}</span>
            </div>
            
            <Button 
              className="w-full mb-4" 
              size="lg"
              onClick={() => bookMutation.mutate({ serviceId: service.id })}
              disabled={bookMutation.isPending}
            >
              <Calendar className="mr-2" />
              {t('services.bookNow')}
            </Button>
            
            <p className="text-sm text-center text-muted-foreground">
              {t('services.freeCancel')}
            </p>
          </Card>
        </div>
      </div>
    </div>
  );
}
