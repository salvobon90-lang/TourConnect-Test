import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useTranslation } from 'react-i18next';
import { useQuery } from '@tanstack/react-query';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Checkbox } from '@/components/ui/checkbox';
import { Card } from '@/components/ui/card';

const serviceSchema = z.object({
  title: z.string().min(5, 'Title must be at least 5 characters'),
  description: z.string().min(20, 'Description must be at least 20 characters'),
  categoryId: z.string().min(1, 'Category is required'),
  price: z.string().min(1, 'Price is required'),
  duration: z.string().min(1, 'Duration is required'),
  location: z.string().min(1, 'Location is required'),
  languages: z.array(z.string()).min(1, 'At least one language is required'),
  images: z.array(z.string()).min(1, 'At least one image is required'),
});

interface ServiceFormProps {
  initialData?: any;
  onSubmit: (data: any) => void;
}

export function ServiceForm({ initialData, onSubmit }: ServiceFormProps) {
  const { t } = useTranslation();
  const { register, handleSubmit, watch, setValue, formState: { errors } } = useForm({
    resolver: zodResolver(serviceSchema),
    defaultValues: initialData || {
      languages: [],
      images: ['https://images.unsplash.com/photo-1414235077428-338989a2e8c0?q=80&w=2940'],
    },
  });
  
  const { data: categories } = useQuery({
    queryKey: ['/api/services/categories'],
    queryFn: async () => {
      const res = await fetch('/api/services/categories');
      return res.json();
    },
  });
  
  const languages = ['en', 'it', 'de', 'fr', 'es'];
  const currentLanguages = watch('languages') || [];
  
  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
      <Card className="p-6">
        <div className="space-y-4">
          <div>
            <label className="font-medium block mb-2">{t('serviceForm.title')}</label>
            <Input {...register('title')} placeholder="e.g. Restaurant Dining Experience" />
            {errors.title && <p className="text-sm text-destructive mt-1">{errors.title.message as string}</p>}
          </div>
          
          <div>
            <label className="font-medium block mb-2">{t('serviceForm.description')}</label>
            <Textarea {...register('description')} rows={6} placeholder="Describe your service in detail..." />
            {errors.description && <p className="text-sm text-destructive mt-1">{errors.description.message as string}</p>}
          </div>
        </div>
      </Card>

      <Card className="p-6">
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="font-medium block mb-2">{t('serviceForm.category')}</label>
            <Select onValueChange={(value) => setValue('categoryId', value)}>
              <SelectTrigger>
                <SelectValue placeholder="Select category" />
              </SelectTrigger>
              <SelectContent>
                {categories?.map((cat: any) => (
                  <SelectItem key={cat.id} value={cat.id}>{cat.name}</SelectItem>
                ))}
              </SelectContent>
            </Select>
            {errors.categoryId && <p className="text-sm text-destructive mt-1">{errors.categoryId.message as string}</p>}
          </div>
          
          <div>
            <label className="font-medium block mb-2">{t('serviceForm.price')}</label>
            <Input {...register('price')} type="number" step="0.01" placeholder="0.00" />
            {errors.price && <p className="text-sm text-destructive mt-1">{errors.price.message as string}</p>}
          </div>
        </div>
      </Card>

      <Card className="p-6">
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="font-medium block mb-2">{t('serviceForm.duration')} (minutes)</label>
            <Input {...register('duration')} type="number" placeholder="60" />
            {errors.duration && <p className="text-sm text-destructive mt-1">{errors.duration.message as string}</p>}
          </div>
          
          <div>
            <label className="font-medium block mb-2">{t('serviceForm.location')}</label>
            <Input {...register('location')} placeholder="City, Country" />
            {errors.location && <p className="text-sm text-destructive mt-1">{errors.location.message as string}</p>}
          </div>
        </div>
      </Card>

      <Card className="p-6">
        <div>
          <label className="font-medium block mb-2">{t('serviceForm.languages')} (Select at least one) *</label>
          <p className="text-sm text-muted-foreground mb-3">
            ✨ Content will be automatically translated to selected languages using AI
          </p>
          <div className="grid grid-cols-2 md:grid-cols-3 gap-3 mt-2">
            {languages.map(lang => (
              <div
                key={lang}
                className={`flex items-center space-x-2 p-3 border rounded-lg cursor-pointer transition-colors ${
                  currentLanguages.includes(lang)
                    ? 'bg-primary/10 border-primary'
                    : 'hover:bg-muted'
                }`}
                onClick={() => {
                  const current = watch('languages') || [];
                  setValue('languages', currentLanguages.includes(lang)
                    ? current.filter((l: string) => l !== lang)
                    : [...current, lang]
                  );
                }}
              >
                <Checkbox 
                  checked={currentLanguages.includes(lang)}
                  onCheckedChange={(checked) => {
                    const current = watch('languages') || [];
                    setValue('languages', checked 
                      ? [...current, lang]
                      : current.filter((l: string) => l !== lang)
                    );
                  }}
                />
                <span className="text-sm font-medium">{lang.toUpperCase()}</span>
              </div>
            ))}
          </div>
          {errors.languages && <p className="text-sm text-destructive mt-1">{errors.languages.message as string}</p>}
        </div>
      </Card>

      <Card className="p-6">
        <div>
          <label className="font-medium block mb-2">{t('serviceForm.images')}</label>
          <p className="text-sm text-muted-foreground mb-2">{t('serviceForm.imageHint')}</p>
          <Input type="file" multiple accept="image/*" />
        </div>
      </Card>
      
      <Button type="submit" size="lg" className="w-full">
        {initialData ? t('serviceForm.update') : t('serviceForm.create')}
      </Button>
    </form>
  );
}
