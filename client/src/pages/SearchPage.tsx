import { useState, useEffect } from 'react';
import { useLocation, Link } from 'wouter';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Checkbox } from '@/components/ui/checkbox';
import { Label } from '@/components/ui/label';
import { Loader2, Sparkles, Filter, Package as PackageIcon } from 'lucide-react';
import { useGlobalSearch, useSemanticSearch } from '@/hooks/searchQueries';
import { Header } from '@/components/layout/Header';
import { PackageCard } from '@/components/PackageCard';
import { useQuery } from '@tanstack/react-query';
import { useTranslation } from 'react-i18next';

export default function SearchPage() {
  const { t, i18n } = useTranslation();
  const [location, setLocation] = useLocation();
  const searchParams = new URLSearchParams(location.split('?')[1]);
  const initialQuery = searchParams.get('q') || '';
  const useSemantic = searchParams.get('semantic') === 'true';

  const [query, setQuery] = useState(initialQuery);
  const [filters, setFilters] = useState({
    type: 'all' as any,
    city: '',
    language: i18n.language,
    priceMin: 0,
    priceMax: 500,
    rating: 0,
  });
  const [showPackagesOnly, setShowPackagesOnly] = useState(false);
  const [partnerVerifiedOnly, setPartnerVerifiedOnly] = useState(false);

  // Update language filter when i18n language changes
  useEffect(() => {
    setFilters(prev => ({ ...prev, language: i18n.language }));
  }, [i18n.language]);

  const { data: results, isLoading } = useGlobalSearch(query, filters);
  const semanticSearch = useSemanticSearch();

  const { data: packages = [] } = useQuery({
    queryKey: ['packages', 'search', showPackagesOnly, partnerVerifiedOnly, filters.priceMin, filters.priceMax],
    queryFn: async () => {
      const queryParams = new URLSearchParams();
      if (showPackagesOnly) queryParams.append('type', 'package');
      if (partnerVerifiedOnly) queryParams.append('verified', 'true');
      if (filters.priceMin > 0) queryParams.append('minPrice', filters.priceMin.toString());
      if (filters.priceMax < 500) queryParams.append('maxPrice', filters.priceMax.toString());
      
      const res = await fetch(`/api/packages/search?${queryParams.toString()}`, {
        credentials: 'include',
      });
      if (!res.ok) return [];
      return res.json();
    },
    enabled: showPackagesOnly || query.length > 0,
  });

  useEffect(() => {
    if (useSemantic && query) {
      semanticSearch.mutate({ query, type: filters.type });
    }
  }, [useSemantic]);

  return (
    <div className="min-h-screen bg-background">
      <Header />
      <div className="container mx-auto px-4 py-8">
        <div className="max-w-6xl mx-auto space-y-6">
          <div>
            <h1 className="text-3xl font-bold mb-2">{t('search.title')}</h1>
            <p className="text-muted-foreground">{t('search.subtitle')}</p>
          </div>

          <Card className="p-6">
            <div className="flex gap-4">
              <Input
                type="text"
                placeholder={t('search.searchPlaceholder')}
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                className="flex-1"
              />
              <Button variant="outline">
                <Filter className="h-4 w-4 mr-2" />
                {t('search.filters')}
              </Button>
              <Button onClick={() => semanticSearch.mutate({ query, type: filters.type })}>
                <Sparkles className="h-4 w-4 mr-2" />
                {t('search.aiSearch')}
              </Button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mt-4">
              <Select value={filters.type} onValueChange={(v) => setFilters({ ...filters, type: v })}>
                <SelectTrigger>
                  <SelectValue placeholder={t('search.type')} />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">{t('search.all')}</SelectItem>
                  <SelectItem value="guide">{t('search.guides')}</SelectItem>
                  <SelectItem value="tour">{t('search.tours')}</SelectItem>
                  <SelectItem value="service">{t('search.services')}</SelectItem>
                  <SelectItem value="package">{t('search.packages')}</SelectItem>
                </SelectContent>
              </Select>

              <Input
                placeholder={t('search.city')}
                value={filters.city}
                onChange={(e) => setFilters({ ...filters, city: e.target.value })}
              />

              <Input
                placeholder={t('search.language')}
                value={filters.language}
                onChange={(e) => setFilters({ ...filters, language: e.target.value })}
              />

              <div className="flex items-center gap-2">
                <span className="text-sm">{t('search.priceRange', { min: filters.priceMin, max: filters.priceMax })}</span>
              </div>
            </div>

            <div className="flex flex-wrap gap-4 mt-4 pt-4 border-t">
              <div className="flex items-center gap-2">
                <Checkbox 
                  id="packages-only" 
                  checked={showPackagesOnly}
                  onCheckedChange={(checked) => setShowPackagesOnly(checked as boolean)}
                />
                <Label htmlFor="packages-only" className="cursor-pointer text-sm">
                  {t('search.showPackagesOnly')}
                </Label>
              </div>

              <div className="flex items-center gap-2">
                <Checkbox 
                  id="verified-only" 
                  checked={partnerVerifiedOnly}
                  onCheckedChange={(checked) => setPartnerVerifiedOnly(checked as boolean)}
                />
                <Label htmlFor="verified-only" className="cursor-pointer text-sm">
                  {t('search.partnerVerifiedOnly')}
                </Label>
              </div>
            </div>
          </Card>

          {semanticSearch.data && (
            <Card className="p-6 bg-orange-50 dark:bg-orange-950">
              <div className="flex items-start gap-3">
                <Sparkles className="h-5 w-5 text-orange-600 mt-1" />
                <div className="flex-1">
                  <h3 className="font-semibold mb-1">{t('search.aiInsights')}</h3>
                  <p className="text-sm text-muted-foreground">{semanticSearch.data.explanation}</p>
                  <Badge className="mt-2" variant="secondary">
                    {t('search.confidence', { percent: (semanticSearch.data.confidence * 100).toFixed(0) })}
                  </Badge>
                </div>
              </div>
            </Card>
          )}

          {isLoading && (
            <div className="text-center py-12">
              <Loader2 className="h-8 w-8 animate-spin mx-auto text-muted-foreground" />
              <p className="mt-4 text-muted-foreground">{t('search.searching')}</p>
            </div>
          )}

          {results && results.totalCount === 0 && (
            <Card className="p-12 text-center">
              <p className="text-muted-foreground">{t('search.noResults', { query })}</p>
              <p className="text-sm text-muted-foreground mt-2">{t('search.tryAdjusting')}</p>
            </Card>
          )}

          {(showPackagesOnly || (results && results.totalCount > 0)) && (
            <div className="space-y-8">
              {packages.length > 0 && (
                <div>
                  <h2 className="text-xl font-semibold mb-4 flex items-center gap-2">
                    <PackageIcon className="h-5 w-5 text-orange-600" />
                    {t('search.packagesCount', { count: packages.length })}
                  </h2>
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    {packages.map((pkg: any) => (
                      <PackageCard
                        key={pkg.id}
                        package={pkg}
                        onClick={() => setLocation(`/packages/${pkg.id}`)}
                      />
                    ))}
                  </div>
                </div>
              )}
              
              {!showPackagesOnly && results && results.guides.length > 0 && (
                <div>
                  <h2 className="text-xl font-semibold mb-4">{t('search.guidesCount', { count: results.guides.length })}</h2>
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    {results.guides.map((guide: any) => (
                      <Card key={guide.id} className="p-4 hover:shadow-lg transition-shadow">
                        <Link href={`/guide/${guide.id}`}>
                          <button 
                            className="font-medium text-foreground hover:text-orange-600 transition-colors w-full text-left"
                            aria-label={`View ${guide.name}'s profile`}
                          >
                            {guide.name}
                          </button>
                        </Link>
                        <p className="text-sm text-muted-foreground mt-1">{guide.city}</p>
                      </Card>
                    ))}
                  </div>
                </div>
              )}
              {!showPackagesOnly && results && results.tours.length > 0 && (
                <div>
                  <h2 className="text-xl font-semibold mb-4">{t('search.toursCount', { count: results.tours.length })}</h2>
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    {results.tours.map((tour: any) => (
                      <Card key={tour.id} className="p-4">
                        <p className="font-medium">{tour.title}</p>
                        <p className="text-sm text-orange-600">€{tour.price}</p>
                      </Card>
                    ))}
                  </div>
                </div>
              )}
              {!showPackagesOnly && results && results.services.length > 0 && (
                <div>
                  <h2 className="text-xl font-semibold mb-4">{t('search.servicesCount', { count: results.services.length })}</h2>
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    {results.services.map((service: any) => (
                      <Card key={service.id} className="p-4">
                        <p className="font-medium">{service.name}</p>
                        <p className="text-sm text-orange-600">€{service.price}</p>
                      </Card>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
