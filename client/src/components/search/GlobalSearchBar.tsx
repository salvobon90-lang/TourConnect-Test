import { useState, useRef, useEffect } from 'react';
import { useLocation } from 'wouter';
import { Search, Loader2, X, Sparkles } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { useGlobalSearch } from '@/hooks/searchQueries';
import { SearchResults } from './SearchResults';
import { cn } from '@/lib/utils';

export function GlobalSearchBar({ className }: { className?: string }) {
  const [query, setQuery] = useState('');
  const [isOpen, setIsOpen] = useState(false);
  const [, navigate] = useLocation();
  const containerRef = useRef<HTMLDivElement>(null);
  
  const { data: results, isLoading } = useGlobalSearch(query);

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    }
    
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (query.trim()) {
      navigate(`/search?q=${encodeURIComponent(query)}`);
      setIsOpen(false);
    }
  };

  const handleClear = () => {
    setQuery('');
    setIsOpen(false);
  };

  return (
    <div ref={containerRef} className={cn("relative w-full max-w-lg", className)}>
      <form onSubmit={handleSearch} className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
        <Input
          type="text"
          placeholder="Search guides, tours, services..."
          value={query}
          onChange={(e) => {
            setQuery(e.target.value);
            setIsOpen(e.target.value.length >= 2);
          }}
          onFocus={() => query.length >= 2 && setIsOpen(true)}
          className="pl-10 pr-10"
        />
        {query && (
          <Button
            type="button"
            variant="ghost"
            size="icon"
            onClick={handleClear}
            className="absolute right-1 top-1/2 -translate-y-1/2 h-7 w-7"
          >
            <X className="h-4 w-4" />
          </Button>
        )}
        {isLoading && (
          <Loader2 className="absolute right-10 top-1/2 -translate-y-1/2 h-4 w-4 animate-spin text-muted-foreground" />
        )}
      </form>

      {isOpen && results && results.totalCount > 0 && (
        <SearchResults
          results={results}
          query={query}
          onClose={() => setIsOpen(false)}
        />
      )}

      {query.length >= 2 && (
        <Button
          variant="ghost"
          size="sm"
          className="absolute -bottom-8 right-0 text-xs"
          onClick={() => navigate(`/search?q=${encodeURIComponent(query)}&semantic=true`)}
        >
          <Sparkles className="h-3 w-3 mr-1" />
          AI Search
        </Button>
      )}
    </div>
  );
}
