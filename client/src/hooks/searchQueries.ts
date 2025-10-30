import { useQuery, useMutation } from '@tanstack/react-query';

export interface SearchFilters {
  type?: 'guide' | 'tour' | 'service' | 'all';
  city?: string;
  language?: string;
  priceMin?: number;
  priceMax?: number;
  rating?: number;
  availability?: boolean;
}

export function useGlobalSearch(query: string, filters: SearchFilters = {}) {
  return useQuery({
    queryKey: ['search', query, filters],
    queryFn: async () => {
      if (!query || query.length < 2) return { guides: [], tours: [], services: [], totalCount: 0 };
      
      const params = new URLSearchParams({ q: query });
      if (filters.type) params.append('type', filters.type);
      if (filters.city) params.append('city', filters.city);
      if (filters.language) params.append('language', filters.language);
      if (filters.priceMin) params.append('priceMin', String(filters.priceMin));
      if (filters.priceMax) params.append('priceMax', String(filters.priceMax));
      if (filters.rating) params.append('rating', String(filters.rating));
      if (filters.availability) params.append('availability', 'true');
      
      const res = await fetch(`/api/search?${params}`, { credentials: 'include' });
      if (!res.ok) throw new Error('Search failed');
      return res.json();
    },
    enabled: query.length >= 2,
    staleTime: 5 * 60 * 1000,
  });
}

export function useSemanticSearch() {
  return useMutation({
    mutationFn: async ({ query, type }: { query: string; type?: string }) => {
      const res = await fetch('/api/search/semantic', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ query, type }),
        credentials: 'include',
      });
      if (!res.ok) throw new Error('Semantic search failed');
      return res.json();
    },
  });
}

export function useTrackSearchClick() {
  return useMutation({
    mutationFn: async ({ 
      searchLogId, 
      entityId, 
      entityType 
    }: { 
      searchLogId: string; 
      entityId: string; 
      entityType: string; 
    }) => {
      const res = await fetch('/api/search/click', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ searchLogId, entityId, entityType }),
        credentials: 'include',
      });
      if (!res.ok) throw new Error('Failed to track click');
      return res.json();
    },
  });
}
