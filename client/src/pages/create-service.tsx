import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { useLocation } from 'wouter';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { apiRequest } from '@/lib/queryClient';
import { useToast } from '@/hooks/use-toast';
import { insertServiceSchema, type InsertService } from '@shared/schema';
import { ArrowLeft } from 'lucide-react';
import { Link } from 'wouter';

export default function CreateService() {
  const { t } = useTranslation();
  const [, setLocation] = useLocation();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [imageFiles, setImageFiles] = useState<string[]>([]);

  const form = useForm<InsertService>({
    resolver: zodResolver(insertServiceSchema),
    defaultValues: {
      name: '',
      description: '',
      type: 'restaurant',
      images: [],
      address: '',
      latitude: 0,
      longitude: 0,
      operatingHours: '',
      priceRange: '$$',
      specialOffer: '',
      isActive: true,
      providerId: '', // Will be set by backend
    },
  });

  const mutation = useMutation({
    mutationFn: async (data: InsertService) => {
      const response = await apiRequest('POST', '/api/services', data);
      return response.json();
    },
    onSuccess: () => {
      toast({
        title: t('common.success'),
        description: t('createService.success'),
      });
      queryClient.invalidateQueries({ queryKey: ['/api/services/my-services'] });
      setLocation('/');
    },
    onError: (error: any) => {
      toast({
        title: t('common.error'),
        description: error.message || t('createService.error'),
        variant: 'destructive',
      });
    },
  });

  const onSubmit = (data: InsertService) => {
    mutation.mutate({
      ...data,
      images: imageFiles,
    });
  };

  return (
    <div className="min-h-screen bg-background">
      <header className="border-b bg-card sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 py-4 flex items-center gap-4">
          <Link href="/">
            <Button variant="ghost" size="icon" data-testid="button-back">
              <ArrowLeft className="w-5 h-5" />
            </Button>
          </Link>
          <h1 className="text-2xl font-serif font-semibold">{t('createService.title')}</h1>
        </div>
      </header>

      <div className="max-w-4xl mx-auto px-4 py-12">
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-8">
            <Card className="p-6">
              <h2 className="text-xl font-semibold mb-6">Basic Information</h2>
              
              <div className="space-y-4">
                <FormField
                  control={form.control}
                  name="name"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>{t('forms.name')}</FormLabel>
                      <FormControl>
                        <Input placeholder={t('createService.exampleName')} {...field} data-testid="input-name" />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="description"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>{t('forms.description')}</FormLabel>
                      <FormControl>
                        <Textarea 
                          placeholder={t('forms.descriptionPlaceholder')} 
                          {...field} 
                          rows={4}
                          data-testid="input-description"
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <div className="grid grid-cols-2 gap-4">
                  <FormField
                    control={form.control}
                    name="type"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>{t('createService.serviceType')}</FormLabel>
                        <Select onValueChange={field.onChange} defaultValue={field.value}>
                          <FormControl>
                            <SelectTrigger data-testid="select-type">
                              <SelectValue placeholder={t('forms.selectType')} />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            <SelectItem value="restaurant">Restaurant</SelectItem>
                            <SelectItem value="shop">Shop</SelectItem>
                            <SelectItem value="transport">Transport</SelectItem>
                            <SelectItem value="other">Other</SelectItem>
                          </SelectContent>
                        </Select>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="priceRange"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>{t('createService.priceRange')}</FormLabel>
                        <Select onValueChange={field.onChange} value={field.value ?? ''}>
                          <FormControl>
                            <SelectTrigger data-testid="select-price-range">
                              <SelectValue placeholder={t('forms.selectRange')} />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            <SelectItem value="$">$ (Budget)</SelectItem>
                            <SelectItem value="$$">$$ (Moderate)</SelectItem>
                            <SelectItem value="$$$">$$$ (Upscale)</SelectItem>
                          </SelectContent>
                        </Select>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>

                <FormField
                  control={form.control}
                  name="address"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>{t('forms.address')}</FormLabel>
                      <FormControl>
                        <Input placeholder={t('forms.addressPlaceholder')} {...field} data-testid="input-address" />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <div className="grid grid-cols-2 gap-4">
                  <FormField
                    control={form.control}
                    name="latitude"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>{t('forms.latitude')}</FormLabel>
                        <FormControl>
                          <Input 
                            type="number" 
                            step="any" 
                            {...field} 
                            onChange={(e) => field.onChange(parseFloat(e.target.value))}
                            data-testid="input-latitude"
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="longitude"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>{t('forms.longitude')}</FormLabel>
                        <FormControl>
                          <Input 
                            type="number" 
                            step="any" 
                            {...field} 
                            onChange={(e) => field.onChange(parseFloat(e.target.value))}
                            data-testid="input-longitude"
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>

                <FormField
                  control={form.control}
                  name="operatingHours"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>{t('createService.operatingHours')}</FormLabel>
                      <FormControl>
                        <Input placeholder={t('forms.operatingHoursPlaceholder')} value={field.value ?? ''} onChange={field.onChange} data-testid="input-hours" />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="specialOffer"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>{t('createService.specialOffer')}</FormLabel>
                      <FormControl>
                        <Input placeholder={t('forms.specialOfferPlaceholder')} value={field.value ?? ''} onChange={field.onChange} data-testid="input-special-offer" />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>
            </Card>

            <div className="flex gap-4">
              <Link href="/">
                <Button type="button" variant="outline" data-testid="button-cancel">
                  {t('actions.cancel')}
                </Button>
              </Link>
              <Button type="submit" disabled={mutation.isPending} data-testid="button-submit">
                {mutation.isPending ? t('actions.creating') : t('createService.create')}
              </Button>
            </div>
          </form>
        </Form>
      </div>
    </div>
  );
}
