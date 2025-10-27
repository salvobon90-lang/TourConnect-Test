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
import { apiRequest, queryClient as qc } from '@/lib/queryClient';
import { useToast } from '@/hooks/use-toast';
import { insertTourSchema, type InsertTour } from '@shared/schema';
import { ArrowLeft, Upload, X, Calendar } from 'lucide-react';
import { Link } from 'wouter';
import { Badge } from '@/components/ui/badge';

export default function CreateTour() {
  const { t } = useTranslation();
  const [, setLocation] = useLocation();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [imageFiles, setImageFiles] = useState<string[]>([]);
  const [currentDate, setCurrentDate] = useState('');

  const form = useForm<InsertTour>({
    resolver: zodResolver(insertTourSchema),
    defaultValues: {
      title: '',
      description: '',
      itinerary: '',
      category: 'walking',
      price: '0',
      duration: 120,
      maxGroupSize: 10,
      images: [],
      meetingPoint: '',
      latitude: 0,
      longitude: 0,
      languages: ['en'],
      included: [],
      excluded: [],
      availableDates: [],
      isActive: true,
      guideId: '', // Will be set by backend
    },
  });

  const mutation = useMutation({
    mutationFn: async (data: InsertTour) => {
      const response = await apiRequest('POST', '/api/tours', data);
      return response.json();
    },
    onSuccess: () => {
      toast({
        title: t('common.success'),
        description: t('createTour.success'),
      });
      queryClient.invalidateQueries({ queryKey: ['/api/my-tours'] });
      setLocation('/');
    },
    onError: (error: any) => {
      toast({
        title: t('common.error'),
        description: error.message || t('createTour.error'),
        variant: 'destructive',
      });
    },
  });

  const onSubmit = (data: InsertTour) => {
    mutation.mutate({
      ...data,
      images: imageFiles,
    });
  };

  const handleAddDate = () => {
    if (currentDate) {
      const currentDates = form.getValues('availableDates') || [];
      const dateISO = new Date(currentDate).toISOString();
      if (!currentDates.includes(dateISO)) {
        form.setValue('availableDates', [...currentDates, dateISO]);
        setCurrentDate('');
      }
    }
  };

  const handleRemoveDate = (dateToRemove: string) => {
    const currentDates = form.getValues('availableDates') || [];
    form.setValue('availableDates', currentDates.filter(d => d !== dateToRemove));
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
          <h1 className="text-2xl font-serif font-semibold">{t('createTour.title')}</h1>
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
                  name="title"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>{t('forms.title')}</FormLabel>
                      <FormControl>
                        <Input placeholder={t('createTour.titlePlaceholder')} {...field} data-testid="input-title" />
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
                          placeholder={t('createTour.descriptionPlaceholder')} 
                          {...field} 
                          rows={4}
                          data-testid="input-description"
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="itinerary"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>{t('createTour.itinerary')}</FormLabel>
                      <FormControl>
                        <Textarea 
                          placeholder={t('createTour.itineraryPlaceholder')} 
                          {...field} 
                          rows={4}
                          data-testid="input-itinerary"
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <div className="grid grid-cols-2 gap-4">
                  <FormField
                    control={form.control}
                    name="category"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>{t('forms.category')}</FormLabel>
                        <Select onValueChange={field.onChange} defaultValue={field.value}>
                          <FormControl>
                            <SelectTrigger data-testid="select-category">
                              <SelectValue placeholder={t('forms.selectCategory')} />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            <SelectItem value="walking">Walking</SelectItem>
                            <SelectItem value="food">Food</SelectItem>
                            <SelectItem value="adventure">Adventure</SelectItem>
                            <SelectItem value="cultural">Cultural</SelectItem>
                            <SelectItem value="historical">Historical</SelectItem>
                            <SelectItem value="nature">Nature</SelectItem>
                            <SelectItem value="art">Art</SelectItem>
                            <SelectItem value="nightlife">Nightlife</SelectItem>
                          </SelectContent>
                        </Select>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="price"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>{t('forms.price')}</FormLabel>
                        <FormControl>
                          <Input type="number" step="0.01" {...field} data-testid="input-price" />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <FormField
                    control={form.control}
                    name="duration"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>{t('forms.duration')}</FormLabel>
                        <FormControl>
                          <Input 
                            type="number" 
                            {...field} 
                            onChange={(e) => field.onChange(parseInt(e.target.value))}
                            data-testid="input-duration"
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="maxGroupSize"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>{t('createTour.maxGroupSize')}</FormLabel>
                        <FormControl>
                          <Input 
                            type="number" 
                            {...field} 
                            onChange={(e) => field.onChange(parseInt(e.target.value))}
                            data-testid="input-max-group"
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>

                <FormField
                  control={form.control}
                  name="meetingPoint"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>{t('createTour.meetingPoint')}</FormLabel>
                      <FormControl>
                        <Input placeholder={t('createTour.meetingPointPlaceholder')} {...field} data-testid="input-meeting-point" />
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
                  name="availableDates"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>{t('createTour.availableDates')}</FormLabel>
                      <div className="space-y-4">
                        <div className="flex gap-2">
                          <Input
                            type="date"
                            value={currentDate}
                            onChange={(e) => setCurrentDate(e.target.value)}
                            data-testid="input-available-date"
                            min={new Date().toISOString().split('T')[0]}
                          />
                          <Button
                            type="button"
                            onClick={handleAddDate}
                            disabled={!currentDate}
                            data-testid="button-add-date"
                          >
                            <Calendar className="w-4 h-4 mr-2" />
                            {t('createTour.addDate')}
                          </Button>
                        </div>
                        
                        {field.value && field.value.length > 0 && (
                          <div className="flex flex-wrap gap-2">
                            {field.value.map((date: string, index: number) => (
                              <Badge 
                                key={index} 
                                variant="secondary"
                                className="flex items-center gap-1"
                                data-testid={`badge-date-${index}`}
                              >
                                {new Date(date).toLocaleDateString()}
                                <button
                                  type="button"
                                  onClick={() => handleRemoveDate(date)}
                                  className="ml-1 hover:text-destructive"
                                  data-testid={`button-remove-date-${index}`}
                                >
                                  <X className="w-3 h-3" />
                                </button>
                              </Badge>
                            ))}
                          </div>
                        )}
                      </div>
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
                {mutation.isPending ? t('actions.creating') : t('createTour.create')}
              </Button>
            </div>
          </form>
        </Form>
      </div>
    </div>
  );
}
