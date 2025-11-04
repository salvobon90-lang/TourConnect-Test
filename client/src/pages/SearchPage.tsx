import { useState } from 'react';
import { useSearch } from 'wouter';
import { useQuery } from '@tanstack/react-query';
import { useTranslation } from 'react-i18next';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { SearchResultMap } from '@/components/SearchResultMap';
import { MapPin, Star, List, Map as MapIcon } from 'lucide-react';
import { Header } from '@/components/layout/Header';

export default function SearchPage() {
  const { t } = useTranslation();
  const search = useSearch(); // URL search params from Wouter
  const [viewMode, setViewMode] = useState<'map' | 'list'>('list');
  
  // Parse URL params
  const params = new URLSearchParams(search);
  const query = params.get('search') || params.get('q') || '';
  const category = params.get('category') || '';
  const minPrice = params.get('minPrice') || '';
  const maxPrice = params.get('maxPrice') || '';
  const proximity = params.get('proximity') || '';
  
  // Build API query string
  const apiParams = new URLSearchParams();
  if (query) apiParams.append('q', query);
  if (category) apiParams.append('type', category);
  if (minPrice) apiParams.append('priceMin', minPrice);
  if (maxPrice) apiParams.append('priceMax', maxPrice);
  
  const { data: results, isLoading } = useQuery({
    queryKey: [`/api/search?${apiParams.toString()}`],
    enabled: !!query,
  });
  
  // Ensure results is an array
  const resultsArray = Array.isArray(results) ? results : [];
  
  return (
    <div className="min-h-screen bg-background">
      <Header />
      
      <div className="container mx-auto px-4 py-8">
        {/* Header with toggle */}
        <div className="flex justify-between items-center mb-6">
          <h1 className="text-3xl font-bold">
            {query ? t('search.resultsFor', { query }) : t('search.title', 'Search Results')}
          </h1>
          <Button 
            onClick={() => setViewMode(viewMode === 'map' ? 'list' : 'map')}
            variant="outline"
          >
            {viewMode === 'map' ? (
              <>
                <List className="w-4 h-4 mr-2" />
                {t('search.listView')}
              </>
            ) : (
              <>
                <MapIcon className="w-4 h-4 mr-2" />
                {t('search.mapView')}
              </>
            )}
          </Button>
        </div>
        
        {/* Loading state */}
        {isLoading && (
          <div className="text-center py-12">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
            <p className="text-muted-foreground">{t('search.loading')}</p>
          </div>
        )}
        
        {/* Map view */}
        {viewMode === 'map' && !isLoading && resultsArray.length > 0 && (
          <SearchResultMap results={resultsArray} />
        )}
        
        {/* List view */}
        {viewMode === 'list' && !isLoading && resultsArray.length > 0 && (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {resultsArray.map((item: any) => (
              <Card key={`${item.type}-${item.id}`} className="p-6 hover:shadow-lg transition-shadow">
                <h3 className="text-xl font-semibold mb-2">{item.title}</h3>
                <p className="text-muted-foreground mb-3 line-clamp-2">
                  {item.description || 'No description available'}
                </p>
                <div className="flex flex-wrap gap-2 mb-3">
                  {item.type && <Badge>{item.type}</Badge>}
                  {item.price && <Badge variant="outline">€{item.price}</Badge>}
                  {item.category && <Badge variant="secondary">{item.category}</Badge>}
                  {item.language && <Badge variant="outline">{item.language}</Badge>}
                </div>
                <div className="flex items-center justify-between text-sm text-muted-foreground">
                  {item.city && (
                    <span className="flex items-center gap-1">
                      <MapPin className="w-4 h-4" />
                      {item.city}
                    </span>
                  )}
                  {item.rating && item.rating > 0 && (
                    <span className="flex items-center gap-1">
                      <Star className="w-4 h-4 fill-yellow-400 text-yellow-400" />
                      {typeof item.rating === 'number' ? item.rating.toFixed(1) : item.rating}
                    </span>
                  )}
                </div>
              </Card>
            ))}
          </div>
        )}
        
        {/* Empty state */}
        {!isLoading && resultsArray.length === 0 && query && (
          <div className="text-center py-12">
            <p className="text-xl text-muted-foreground">
              {t('search.noResults', { query })}
            </p>
          </div>
        )}
        
        {/* No query state */}
        {!isLoading && !query && (
          <div className="text-center py-12">
            <p className="text-xl text-muted-foreground">
              {t('search.enterQuery', 'Enter a search query to find tours, services, and guides')}
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
