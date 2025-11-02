import { useParams, Link } from 'wouter';
import { useQuery } from '@tanstack/react-query';
import { useTranslation } from 'react-i18next';
import { SEO } from '@/components/seo';
import { LikeButton } from '@/components/LikeButton';
import { TrustLevelBadge } from '@/components/TrustLevelBadge';
import { Avatar, AvatarImage, AvatarFallback } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { MapPin, Globe, Award, Calendar, Clock, DollarSign, BadgeCheck } from 'lucide-react';
import { Header } from '@/components/layout/Header';

interface Tour {
  id: string;
  title: string;
  description: string;
  price: string;
  duration: number;
  category: string;
  imageUrl?: string;
  latitude?: number;
  longitude?: number;
}

interface GuideProfile {
  id: string;
  firstName: string;
  lastName: string;
  bio: string;
  city: string;
  country: string;
  profileImageUrl?: string;
  languages: string[];
  specialties: string[];
  experience: number;
  verified: boolean;
  averageRating: string;
  totalCompletedTours: number;
  likesCount: number;
  tours: Tour[];
}

function LoadingSkeleton() {
  return (
    <div className="min-h-screen bg-background">
      <Header />
      <div className="container max-w-5xl py-8">
        <Card className="p-6 mb-6">
          <div className="flex items-start gap-6">
            <Skeleton className="w-24 h-24 rounded-full" />
            <div className="flex-1 space-y-3">
              <Skeleton className="h-8 w-48" />
              <Skeleton className="h-4 w-64" />
              <Skeleton className="h-4 w-full" />
            </div>
          </div>
        </Card>
      </div>
    </div>
  );
}

function TourCard({ tour }: { tour: Tour }) {
  const { t } = useTranslation();
  
  return (
    <Link href={`/tours/${tour.id}`}>
      <Card className="p-4 hover:shadow-lg transition-shadow cursor-pointer">
        <div className="flex gap-4">
          {tour.imageUrl && (
            <div className="w-32 h-32 rounded-lg overflow-hidden flex-shrink-0">
              <img 
                src={tour.imageUrl} 
                alt={tour.title}
                className="w-full h-full object-cover"
              />
            </div>
          )}
          <div className="flex-1">
            <div className="flex items-start justify-between">
              <div>
                <h3 className="font-semibold text-lg mb-1">{tour.title}</h3>
                <Badge variant="secondary" className="mb-2">
                  {t(`categories.${tour.category}`)}
                </Badge>
              </div>
              <div className="text-right">
                <div className="text-2xl font-bold text-primary">€{tour.price}</div>
                <div className="text-xs text-muted-foreground">{t('tours.perPerson')}</div>
              </div>
            </div>
            <p className="text-sm text-muted-foreground line-clamp-2 mb-3">
              {tour.description}
            </p>
            <div className="flex items-center gap-4 text-sm text-muted-foreground">
              <span className="flex items-center gap-1">
                <Clock className="w-4 h-4" />
                {tour.duration}h
              </span>
            </div>
          </div>
        </div>
      </Card>
    </Link>
  );
}

export default function GuideProfile() {
  const { id } = useParams<{ id: string }>();
  const { t } = useTranslation();
  
  const { data: guide, isLoading, error } = useQuery<GuideProfile>({
    queryKey: ['guide', id],
    queryFn: async () => {
      const res = await fetch(`/api/guides/${id}`);
      if (!res.ok) {
        if (res.status === 404) {
          throw new Error('Guide not found');
        }
        throw new Error('Failed to fetch guide profile');
      }
      return res.json();
    },
  });
  
  if (isLoading) return <LoadingSkeleton />;
  
  if (error || !guide) {
    return (
      <div className="min-h-screen bg-background">
        <Header />
        <div className="container max-w-5xl py-16 text-center">
          <h1 className="text-4xl font-bold mb-4">{t('guide.profile.notFound')}</h1>
          <p className="text-muted-foreground mb-8">{t('guide.profile.notFoundDesc')}</p>
          <Button asChild>
            <Link href="/tours">{t('guide.profile.browseTours')}</Link>
          </Button>
        </div>
      </div>
    );
  }
  
  const fullName = `${guide.firstName} ${guide.lastName}`;
  
  return (
    <>
      <SEO 
        title={`${fullName} - ${t('guide.profile.title')}`}
        description={guide.bio || t('guide.profile.defaultDesc', { name: fullName })}
        type="article"
        structuredData={{
          "@context": "https://schema.org",
          "@type": "Person",
          "name": fullName,
          "description": guide.bio,
          "address": {
            "@type": "PostalAddress",
            "addressLocality": guide.city,
            "addressCountry": guide.country
          },
          "knowsLanguage": guide.languages,
          "jobTitle": "Tour Guide",
          "aggregateRating": guide.averageRating ? {
            "@type": "AggregateRating",
            "ratingValue": guide.averageRating,
            "reviewCount": guide.totalCompletedTours
          } : undefined
        }}
      />
      
      <div className="min-h-screen bg-background">
        <Header />
        
        <div className="container max-w-5xl py-8">
          {/* Header Section */}
          <Card className="p-6 mb-6">
            <div className="flex flex-col md:flex-row items-start gap-6">
              <Avatar className="w-24 h-24 flex-shrink-0">
                <AvatarImage src={guide.profileImageUrl} alt={fullName} />
                <AvatarFallback className="text-2xl">
                  {guide.firstName[0]}{guide.lastName[0]}
                </AvatarFallback>
              </Avatar>
              
              <div className="flex-1 w-full">
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-3">
                  <div>
                    <div className="flex items-center gap-2 mb-1">
                      <h1 className="text-3xl font-bold">{fullName}</h1>
                      {guide.verified && (
                        <BadgeCheck className="w-6 h-6 text-blue-500" />
                      )}
                    </div>
                    <div className="flex items-center gap-2 text-muted-foreground">
                      {guide.city && (
                        <span className="flex items-center gap-1">
                          <MapPin className="w-4 h-4" />
                          {guide.city}, {guide.country}
                        </span>
                      )}
                    </div>
                  </div>
                  
                  <div className="flex items-center gap-3">
                    <TrustLevelBadge userId={guide.id} showScore />
                    <LikeButton 
                      targetId={guide.id} 
                      targetType="profile" 
                      showCount
                    />
                  </div>
                </div>
                
                {/* Stats */}
                <div className="flex flex-wrap gap-4 mb-4 text-sm">
                  <div className="flex items-center gap-1">
                    <Award className="w-4 h-4 text-orange-500" />
                    <span className="font-semibold">{guide.averageRating}</span>
                    <span className="text-muted-foreground">
                      ({guide.totalCompletedTours} {t('guide.profile.completedTours')})
                    </span>
                  </div>
                </div>
                
                {/* Languages */}
                {guide.languages?.length > 0 && (
                  <div className="flex items-center gap-2 mb-2">
                    <Globe className="w-4 h-4 text-muted-foreground" />
                    <span className="text-sm font-medium">{t('guide.profile.languages')}:</span>
                    <div className="flex gap-1 flex-wrap">
                      {guide.languages.map((lang: string) => (
                        <Badge key={lang} variant="secondary" className="text-xs">
                          {lang}
                        </Badge>
                      ))}
                    </div>
                  </div>
                )}
                
                {/* Specialties */}
                {guide.specialties?.length > 0 && (
                  <div className="flex items-center gap-2 mb-2">
                    <Award className="w-4 h-4 text-muted-foreground" />
                    <span className="text-sm font-medium">{t('guide.profile.specialties')}:</span>
                    <div className="flex gap-1 flex-wrap">
                      {guide.specialties.map((spec: string) => (
                        <Badge key={spec} variant="outline" className="text-xs">
                          {spec}
                        </Badge>
                      ))}
                    </div>
                  </div>
                )}
                
                {/* Experience */}
                {guide.experience > 0 && (
                  <div className="flex items-center gap-2 text-sm text-muted-foreground">
                    <Calendar className="w-4 h-4" />
                    <span>
                      {t('guide.profile.experience', { years: guide.experience })}
                    </span>
                  </div>
                )}
              </div>
            </div>
            
            {/* Bio */}
            {guide.bio && (
              <div className="mt-6 pt-6 border-t">
                <h3 className="font-semibold mb-2">{t('guide.profile.about')}</h3>
                <p className="text-muted-foreground leading-relaxed">{guide.bio}</p>
              </div>
            )}
          </Card>
          
          {/* Tours Section */}
          <div>
            <h2 className="text-2xl font-bold mb-4">
              {t('guide.profile.toursBy', { name: guide.firstName })}
            </h2>
            
            {guide.tours?.length > 0 ? (
              <div className="grid gap-4">
                {guide.tours.map((tour) => (
                  <TourCard key={tour.id} tour={tour} />
                ))}
              </div>
            ) : (
              <Card className="p-12">
                <p className="text-muted-foreground text-center">
                  {t('guide.profile.noTours')}
                </p>
              </Card>
            )}
          </div>
        </div>
      </div>
    </>
  );
}
