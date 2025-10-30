import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { useTranslation } from 'react-i18next';
import { ServiceCard } from '@/components/ServiceCard';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Slider } from '@/components/ui/slider';
import { Filter, MapIcon } from 'lucide-react';

export default function ServiceList() {
  const { t } = useTranslation();
  const [filters, setFilters] = useState({
    category: '',
    location: '',
    language: '',
    maxPrice: 1000,
  });
  
  const { data: categories } = useQuery<any[]>({
    queryKey: ['/api/services/categories'],
    queryFn: async () => {
      const res = await fetch('/api/services/categories');
      if (!res.ok) throw new Error('Failed to fetch categories');
      return res.json();
    },
  });
  
  const { data: services, isLoading } = useQuery<any[]>({
    queryKey: ['/api/services/search', filters],
    queryFn: async () => {
      const params = new URLSearchParams();
      if (filters.category) params.append('category', filters.category);
      if (filters.location) params.append('location', filters.location);
      if (filters.language) params.append('language', filters.language);
      params.append('maxPrice', filters.maxPrice.toString());
      
      const res = await fetch(`/api/services/search?${params}`);
      return res.json();
    },
  });
  
  return (
    <div className="container mx-auto px-4 py-8">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-3xl font-bold">{t('services.title')}</h1>
        <Button variant="outline">
          <MapIcon className="mr-2" />
          {t('services.mapView')}
        </Button>
      </div>
      
      {/* Filters */}
      <div className="bg-card p-4 rounded-lg mb-6 space-y-4">
        <div className="flex items-center gap-2 mb-4">
          <Filter className="w-5 h-5" />
          <h2 className="font-semibold">{t('services.filters')}</h2>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <Select value={filters.category} onValueChange={(val) => setFilters({...filters, category: val})}>
            <SelectTrigger>
              <SelectValue placeholder={t('services.filterByCategory')} />
            </SelectTrigger>
            <SelectContent>
              {categories?.map((cat: any) => (
                <SelectItem key={cat.id} value={cat.id}>
                  {cat.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          
          <Input 
            placeholder={t('services.filterByLocation')}
            value={filters.location}
            onChange={(e) => setFilters({...filters, location: e.target.value})}
          />
          
          <Select value={filters.language} onValueChange={(val) => setFilters({...filters, language: val})}>
            <SelectTrigger>
              <SelectValue placeholder={t('services.filterByLanguage')} />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="en">English</SelectItem>
              <SelectItem value="it">Italiano</SelectItem>
              <SelectItem value="de">Deutsch</SelectItem>
              <SelectItem value="fr">Français</SelectItem>
              <SelectItem value="es">Español</SelectItem>
            </SelectContent>
          </Select>
          
          <div className="space-y-2">
            <label className="text-sm font-medium">
              {t('services.maxPrice')}: ${filters.maxPrice}
            </label>
            <Slider
              value={[filters.maxPrice]}
              onValueChange={([val]) => setFilters({...filters, maxPrice: val})}
              min={0}
              max={1000}
              step={10}
            />
          </div>
        </div>
      </div>
      
      {/* Services Grid */}
      {isLoading ? (
        <div className="text-center py-12">{t('common.loading')}</div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {services?.map((service: any) => (
            <ServiceCard key={service.id} service={service} />
          ))}
        </div>
      )}
      
      {!isLoading && services?.length === 0 && (
        <div className="text-center py-12 text-muted-foreground">
          {t('services.noResults')}
        </div>
      )}
    </div>
  );
}
