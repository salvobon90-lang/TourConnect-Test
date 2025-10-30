import { useState, useEffect } from 'react';
import { useLocation } from 'wouter';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Loader2, Sparkles, Filter } from 'lucide-react';
import { useGlobalSearch, useSemanticSearch } from '@/hooks/searchQueries';
import { Header } from '@/components/layout/Header';

export default function SearchPage() {
  const [location] = useLocation();
  const searchParams = new URLSearchParams(location.split('?')[1]);
  const initialQuery = searchParams.get('q') || '';
  const useSemantic = searchParams.get('semantic') === 'true';

  const [query, setQuery] = useState(initialQuery);
  const [filters, setFilters] = useState({
    type: 'all' as any,
    city: '',
    language: '',
    priceMin: 0,
    priceMax: 500,
    rating: 0,
  });

  const { data: results, isLoading } = useGlobalSearch(query, filters);
  const semanticSearch = useSemanticSearch();

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
            <h1 className="text-3xl font-bold mb-2">Search TourConnect</h1>
            <p className="text-muted-foreground">Find guides, tours, and services worldwide</p>
          </div>

          <Card className="p-6">
            <div className="flex gap-4">
              <Input
                type="text"
                placeholder="Search..."
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                className="flex-1"
              />
              <Button variant="outline">
                <Filter className="h-4 w-4 mr-2" />
                Filters
              </Button>
              <Button onClick={() => semanticSearch.mutate({ query, type: filters.type })}>
                <Sparkles className="h-4 w-4 mr-2" />
                AI Search
              </Button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mt-4">
              <Select value={filters.type} onValueChange={(v) => setFilters({ ...filters, type: v })}>
                <SelectTrigger>
                  <SelectValue placeholder="Type" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All</SelectItem>
                  <SelectItem value="guide">Guides</SelectItem>
                  <SelectItem value="tour">Tours</SelectItem>
                  <SelectItem value="service">Services</SelectItem>
                </SelectContent>
              </Select>

              <Input
                placeholder="City"
                value={filters.city}
                onChange={(e) => setFilters({ ...filters, city: e.target.value })}
              />

              <Input
                placeholder="Language"
                value={filters.language}
                onChange={(e) => setFilters({ ...filters, language: e.target.value })}
              />

              <div className="flex items-center gap-2">
                <span className="text-sm">Price: €{filters.priceMin} - €{filters.priceMax}</span>
              </div>
            </div>
          </Card>

          {semanticSearch.data && (
            <Card className="p-6 bg-orange-50 dark:bg-orange-950">
              <div className="flex items-start gap-3">
                <Sparkles className="h-5 w-5 text-orange-600 mt-1" />
                <div className="flex-1">
                  <h3 className="font-semibold mb-1">AI Insights</h3>
                  <p className="text-sm text-muted-foreground">{semanticSearch.data.explanation}</p>
                  <Badge className="mt-2" variant="secondary">
                    {(semanticSearch.data.confidence * 100).toFixed(0)}% confidence
                  </Badge>
                </div>
              </div>
            </Card>
          )}

          {isLoading && (
            <div className="text-center py-12">
              <Loader2 className="h-8 w-8 animate-spin mx-auto text-muted-foreground" />
              <p className="mt-4 text-muted-foreground">Searching...</p>
            </div>
          )}

          {results && results.totalCount === 0 && (
            <Card className="p-12 text-center">
              <p className="text-muted-foreground">No results found for "{query}"</p>
              <p className="text-sm text-muted-foreground mt-2">Try adjusting your filters or use AI Search</p>
            </Card>
          )}

          {results && results.totalCount > 0 && (
            <div className="space-y-8">
              {results.guides.length > 0 && (
                <div>
                  <h2 className="text-xl font-semibold mb-4">Guides ({results.guides.length})</h2>
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    {results.guides.map((guide: any) => (
                      <Card key={guide.id} className="p-4">
                        <p className="font-medium">{guide.name}</p>
                        <p className="text-sm text-muted-foreground">{guide.city}</p>
                      </Card>
                    ))}
                  </div>
                </div>
              )}
              {results.tours.length > 0 && (
                <div>
                  <h2 className="text-xl font-semibold mb-4">Tours ({results.tours.length})</h2>
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
              {results.services.length > 0 && (
                <div>
                  <h2 className="text-xl font-semibold mb-4">Services ({results.services.length})</h2>
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
