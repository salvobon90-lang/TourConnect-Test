import { useState, useEffect } from 'react';
import { useQuery } from '@tanstack/react-query';
import { useTranslation } from 'react-i18next';
import { Link } from 'wouter';
import { Header } from '@/components/layout/Header';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Progress } from '@/components/ui/progress';
import { LoadingSpinner } from '@/components/loading-spinner';
import { SEO } from '@/components/seo';
import { apiRequest } from '@/lib/queryClient';
import { useAuth } from '@/hooks/useAuth';
import { 
  Search, 
  MapPin, 
  Calendar, 
  Users, 
  DollarSign, 
  TrendingDown,
  Clock,
  Sparkles,
  Filter
} from 'lucide-react';
import { format } from 'date-fns';
import { motion } from 'framer-motion';

interface MarketplaceGroup {
  id: string;
  tourId: string;
  tourTitle: string;
  tourDescription: string;
  tourCategory: string;
  tourDuration: number;
  tourImages: string[];
  tourDate: string;
  maxParticipants: number;
  minParticipants: number;
  currentParticipants: number;
  basePricePerPerson: string;
  currentPricePerPerson: string;
  status: string;
  groupCode: string;
  meetingPoint: string;
  tourLanguages: string[];
  guideId: string;
  guideName: string;
  guideImage: string;
  guideTrustLevel: number;
  spotsLeft: number;
  spotsNeeded: number;
  progress: number;
  discountPercentage: number;
  isAlmostFull: boolean;
  isAlmostReady: boolean;
}

export default function GroupMarketplace() {
  const { t } = useTranslation();
  const { user } = useAuth();
  const [filters, setFilters] = useState({
    destination: '',
    dateFrom: '',
    dateTo: '',
    minPrice: '',
    maxPrice: '',
    language: '',
    sortBy: 'urgency'
  });

  const { data: groups, isLoading } = useQuery<MarketplaceGroup[]>({
    queryKey: ['/api/marketplace/groups', filters],
    queryFn: async () => {
      const params = new URLSearchParams();
      Object.entries(filters).forEach(([key, value]) => {
        if (value) params.append(key, value);
      });
      return await apiRequest('GET', `/api/marketplace/groups?${params.toString()}`);
    }
  });

  const { data: aiSuggestions } = useQuery({
    queryKey: ['/api/marketplace/ai-suggestions'],
    queryFn: async () => {
      return await apiRequest('GET', '/api/marketplace/ai-suggestions');
    },
    enabled: !!user
  });

  return (
    <div className="min-h-screen bg-background">
      <SEO 
        title={t('seo.marketplace.title')}
        description={t('seo.marketplace.description')}
      />
      <Header />

      <div className="max-w-7xl mx-auto px-4 py-8">
        <div className="mb-8">
          <h1 className="text-4xl font-bold mb-2">
            {t('marketplace.title')} 🌍
          </h1>
          <p className="text-muted-foreground text-lg">
            {t('marketplace.subtitle')}
          </p>
        </div>

        {aiSuggestions?.hotDeals && aiSuggestions.hotDeals.length > 0 && (
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            className="mb-6"
          >
            <Card className="bg-gradient-to-r from-orange-500 to-orange-600 text-white border-none">
              <CardContent className="p-6">
                <div className="flex items-start gap-4">
                  <Sparkles className="w-8 h-8 flex-shrink-0 mt-1" />
                  <div className="flex-1">
                    <h3 className="text-xl font-bold mb-2">
                      🔥 {t('marketplace.hotDeals')}
                    </h3>
                    <p className="text-white/90 mb-4">
                      {aiSuggestions.message}
                    </p>
                    <div className="flex gap-2 overflow-x-auto pb-2">
                      {aiSuggestions.hotDeals.slice(0, 3).map((deal: MarketplaceGroup) => (
                        <Badge key={deal.id} variant="secondary" className="whitespace-nowrap">
                          {deal.tourTitle} - {t('marketplace.onlySpots', { count: deal.spotsNeeded })}
                        </Badge>
                      ))}
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </motion.div>
        )}

        <Card className="mb-6">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Filter className="w-5 h-5" />
              {t('marketplace.filters')}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
              <div>
                <label className="text-sm font-medium mb-2 block">{t('marketplace.destination')}</label>
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                  <Input
                    placeholder={t('marketplace.searchDestination')}
                    value={filters.destination}
                    onChange={(e) => setFilters({ ...filters, destination: e.target.value })}
                    className="pl-10"
                  />
                </div>
              </div>

              <div>
                <label className="text-sm font-medium mb-2 block">{t('marketplace.dateFrom')}</label>
                <Input
                  type="date"
                  value={filters.dateFrom}
                  onChange={(e) => setFilters({ ...filters, dateFrom: e.target.value })}
                />
              </div>

              <div>
                <label className="text-sm font-medium mb-2 block">{t('marketplace.maxPrice')}</label>
                <Input
                  type="number"
                  placeholder={t('marketplace.pricePlaceholder')}
                  value={filters.maxPrice}
                  onChange={(e) => setFilters({ ...filters, maxPrice: e.target.value })}
                />
              </div>

              <div>
                <label className="text-sm font-medium mb-2 block">{t('marketplace.sortBy')}</label>
                <Select
                  value={filters.sortBy}
                  onValueChange={(value) => setFilters({ ...filters, sortBy: value })}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="urgency">{t('marketplace.mostUrgent')}</SelectItem>
                    <SelectItem value="date">{t('marketplace.nearestDate')}</SelectItem>
                    <SelectItem value="price">{t('marketplace.lowestPrice')}</SelectItem>
                    <SelectItem value="popularity">{t('marketplace.mostPopular')}</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            <Button
              variant="outline"
              size="sm"
              className="mt-4"
              onClick={() => setFilters({
                destination: '',
                dateFrom: '',
                dateTo: '',
                minPrice: '',
                maxPrice: '',
                language: '',
                sortBy: 'urgency'
              })}
            >
              {t('marketplace.clearFilters')}
            </Button>
          </CardContent>
        </Card>

        {isLoading ? (
          <div className="flex justify-center py-12">
            <LoadingSpinner size="lg" />
          </div>
        ) : groups && groups.length > 0 ? (
          <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-6">
            {groups.map((group) => (
              <GroupCard key={group.id} group={group} />
            ))}
          </div>
        ) : (
          <Card className="p-12 text-center">
            <Users className="w-16 h-16 mx-auto mb-4 text-muted-foreground" />
            <h3 className="text-xl font-semibold mb-2">{t('marketplace.noGroups')}</h3>
            <p className="text-muted-foreground">
              {t('marketplace.noGroupsDesc')}
            </p>
          </Card>
        )}
      </div>
    </div>
  );
}

function GroupCard({ group }: { group: MarketplaceGroup }) {
  const { t } = useTranslation();
  const [timeLeft, setTimeLeft] = useState('');

  useEffect(() => {
    const updateCountdown = () => {
      const now = new Date();
      const tourDate = new Date(group.tourDate);
      const diff = tourDate.getTime() - now.getTime();
      
      if (diff <= 0) {
        setTimeLeft(t('marketplace.tourDatePassed'));
        return;
      }

      const days = Math.floor(diff / (1000 * 60 * 60 * 24));
      const hours = Math.floor((diff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
      
      if (days > 0) {
        setTimeLeft(t('marketplace.daysLeft', { count: days }));
      } else {
        setTimeLeft(t('marketplace.hoursLeft', { count: hours }));
      }
    };

    updateCountdown();
    const interval = setInterval(updateCountdown, 60000);
    return () => clearInterval(interval);
  }, [group.tourDate, t]);

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      whileHover={{ y: -5 }}
      transition={{ duration: 0.2 }}
    >
      <Card className="overflow-hidden hover:shadow-lg transition-shadow">
        {group.tourImages?.[0] && (
          <div className="relative h-48 overflow-hidden">
            <img
              src={group.tourImages[0]}
              alt={group.tourTitle}
              className="w-full h-full object-cover"
            />
            {group.discountPercentage > 0 && (
              <Badge className="absolute top-3 right-3 bg-orange-600">
                <TrendingDown className="w-3 h-3 mr-1" />
                {group.discountPercentage}% {t('marketplace.off')}
              </Badge>
            )}
            {group.isAlmostReady && (
              <Badge className="absolute top-3 left-3 bg-green-600 animate-pulse">
                <Sparkles className="w-3 h-3 mr-1" />
                {t('marketplace.almostReady')}
              </Badge>
            )}
          </div>
        )}

        <CardContent className="p-4">
          <div className="mb-3">
            <Badge variant="secondary" className="mb-2">
              {group.tourCategory}
            </Badge>
            <h3 className="font-bold text-lg line-clamp-2">
              {group.tourTitle}
            </h3>
          </div>

          <div className="flex items-center gap-2 mb-3">
            <Avatar className="w-6 h-6">
              <AvatarImage src={group.guideImage} />
              <AvatarFallback>{group.guideName?.[0]}</AvatarFallback>
            </Avatar>
            {group.guideId ? (
              <Link href={`/guide/${group.guideId}`}>
                <button 
                  className="text-sm text-muted-foreground hover:text-orange-600 hover:underline transition-colors cursor-pointer"
                  onClick={(e) => e.stopPropagation()}
                  aria-label={`View ${group.guideName}'s profile`}
                >
                  {group.guideName}
                </button>
              </Link>
            ) : (
              <span className="text-sm text-muted-foreground">
                {group.guideName}
              </span>
            )}
            {group.guideTrustLevel >= 3 && (
              <Badge variant="outline" className="text-xs">
                ⭐ {t('marketplace.verified')}
              </Badge>
            )}
          </div>

          <div className="space-y-2 mb-4 text-sm">
            <div className="flex items-center gap-2 text-muted-foreground">
              <Calendar className="w-4 h-4" />
              {format(new Date(group.tourDate), 'MMM dd, yyyy')}
            </div>
            <div className="flex items-center gap-2 text-muted-foreground">
              <MapPin className="w-4 h-4" />
              <span className="line-clamp-1">{group.meetingPoint || 'TBD'}</span>
            </div>
            <div className="flex items-center gap-2 text-muted-foreground">
              <Clock className="w-4 h-4" />
              {timeLeft}
            </div>
          </div>

          <div className="mb-4">
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm font-medium">
                {group.currentParticipants} / {group.maxParticipants} {t('marketplace.joined')}
              </span>
              <span className="text-sm text-muted-foreground">
                {group.progress}%
              </span>
            </div>
            <Progress value={group.progress} className="h-2" />
            {group.spotsNeeded > 0 && (
              <p className="text-xs text-muted-foreground mt-1">
                {t('marketplace.spotsNeeded', { count: group.spotsNeeded })}
              </p>
            )}
          </div>

          <div className="flex items-center justify-between mb-4">
            <div>
              <div className="flex items-center gap-2">
                <DollarSign className="w-4 h-4 text-muted-foreground" />
                <span className="text-2xl font-bold text-orange-600">
                  €{parseFloat(group.currentPricePerPerson).toFixed(0)}
                </span>
              </div>
              {parseFloat(group.basePricePerPerson) > parseFloat(group.currentPricePerPerson) && (
                <span className="text-xs text-muted-foreground line-through">
                  €{parseFloat(group.basePricePerPerson).toFixed(0)}
                </span>
              )}
            </div>
            <span className="text-xs text-muted-foreground">{t('marketplace.perPerson')}</span>
          </div>

          <Button 
            className="w-full bg-orange-600 hover:bg-orange-700"
            onClick={() => window.location.href = `/tours/${group.tourId}?group=${group.groupCode}`}
          >
            <Users className="w-4 h-4 mr-2" />
            {t('marketplace.joinGroup')}
          </Button>
        </CardContent>
      </Card>
    </motion.div>
  );
}
