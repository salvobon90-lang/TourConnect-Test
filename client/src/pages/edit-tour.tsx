import { useEffect } from 'react';
import { useParams, useLocation } from 'wouter';
import { useAuth } from '@/hooks/useAuth';
import { useQuery, useMutation } from '@tanstack/react-query';
import { useToast } from '@/hooks/use-toast';
import { queryClient, apiRequest } from '@/lib/queryClient';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { insertTourSchema, type InsertTour, type TourWithGuide } from '@shared/schema';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage, FormDescription } from '@/components/ui/form';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';
import { Loader2, ArrowLeft } from 'lucide-react';
import { Link } from 'wouter';

export default function EditTour() {
  const { id } = useParams();
  const [, navigate] = useLocation();
  const { user, isAuthenticated } = useAuth();
  const { toast } = useToast();

  const { data: tour, isLoading } = useQuery<TourWithGuide>({
    queryKey: ['/api/tours', id],
    enabled: !!id && isAuthenticated,
  });

  const form = useForm<InsertTour>({
    resolver: zodResolver(insertTourSchema.omit({ guideId: true })),
    defaultValues: {
      title: '',
      description: '',
      itinerary: '',
      price: 0,
      duration: 0,
      maxGroupSize: 1,
      category: 'walking',
      meetingPoint: '',
      latitude: 0,
      longitude: 0,
      images: [],
      languages: [],
      included: [],
      excluded: [],
      isActive: true,
    },
  });

  useEffect(() => {
    if (tour) {
      form.reset({
        title: tour.title,
        description: tour.description,
        itinerary: tour.itinerary,
        price: tour.price,
        duration: tour.duration,
        maxGroupSize: tour.maxGroupSize,
        category: tour.category,
        meetingPoint: tour.meetingPoint,
        latitude: tour.latitude,
        longitude: tour.longitude,
        images: tour.images,
        languages: tour.languages,
        included: tour.included,
        excluded: tour.excluded,
        isActive: tour.isActive,
      });
    }
  }, [tour, form]);

  const updateMutation = useMutation({
    mutationFn: async (data: InsertTour) => {
      const response = await apiRequest('PUT', `/api/tours/${id}`, data);
      return response.json();
    },
    onSuccess: () => {
      toast({
        title: 'Success',
        description: 'Tour updated successfully',
      });
      // Invalidate both the list and the specific tour query
      queryClient.invalidateQueries({ queryKey: ['/api/tours'] });
      queryClient.invalidateQueries({ queryKey: ['/api/tours', id] });
      navigate('/');
    },
    onError: (error: any) => {
      toast({
        title: 'Error',
        description: error.message || 'Failed to update tour',
        variant: 'destructive',
      });
    },
  });

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin" />
      </div>
    );
  }

  if (!tour || tour.guideId !== user?.id) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Card className="p-8">
          <h1 className="text-xl font-semibold mb-4">Unauthorized</h1>
          <p className="text-muted-foreground mb-4">You don't have permission to edit this tour.</p>
          <Link href="/">
            <Button>Go Back</Button>
          </Link>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background py-12 px-4">
      <div className="max-w-3xl mx-auto">
        <Link href="/">
          <Button variant="outline" className="mb-6" data-testid="button-back">
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back
          </Button>
        </Link>

        <Card className="p-8">
          <h1 className="text-3xl font-serif font-semibold mb-6">Edit Tour</h1>

          <Form {...form}>
            <form onSubmit={form.handleSubmit((data) => updateMutation.mutate(data))} className="space-y-6">
              <FormField
                control={form.control}
                name="title"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Tour Title</FormLabel>
                    <FormControl>
                      <Input {...field} placeholder="Amazing City Walking Tour" data-testid="input-title" />
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
                    <FormLabel>Description</FormLabel>
                    <FormControl>
                      <Textarea {...field} rows={5} placeholder="Describe your tour..." data-testid="textarea-description" />
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
                    <FormLabel>Itinerary</FormLabel>
                    <FormControl>
                      <Textarea {...field} rows={5} placeholder="Tour itinerary and schedule..." data-testid="textarea-itinerary" />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <FormField
                  control={form.control}
                  name="price"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Price ($)</FormLabel>
                      <FormControl>
                        <Input
                          type="number"
                          {...field}
                          onChange={(e) => {
                            const value = e.target.value;
                            if (value !== '') {
                              field.onChange(parseFloat(value));
                            }
                          }}
                          data-testid="input-price"
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="duration"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Duration (minutes)</FormLabel>
                      <FormControl>
                        <Input
                          type="number"
                          {...field}
                          onChange={(e) => {
                            const value = e.target.value;
                            if (value !== '') {
                              field.onChange(parseInt(value));
                            }
                          }}
                          data-testid="input-duration"
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <FormField
                  control={form.control}
                  name="maxGroupSize"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Max Group Size</FormLabel>
                      <FormControl>
                        <Input
                          type="number"
                          {...field}
                          onChange={(e) => {
                            const value = e.target.value;
                            if (value !== '') {
                              field.onChange(parseInt(value));
                            }
                          }}
                          data-testid="input-max-group"
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="category"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Category</FormLabel>
                      <Select onValueChange={field.onChange} value={field.value}>
                        <FormControl>
                          <SelectTrigger data-testid="select-category">
                            <SelectValue />
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
              </div>

              <FormField
                control={form.control}
                name="meetingPoint"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Meeting Point</FormLabel>
                    <FormControl>
                      <Input {...field} placeholder="Main Square, City Center" data-testid="input-meeting-point" />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <FormField
                  control={form.control}
                  name="latitude"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Latitude</FormLabel>
                      <FormControl>
                        <Input
                          type="number"
                          step="any"
                          {...field}
                          onChange={(e) => {
                            const value = e.target.value;
                            if (value !== '') {
                              field.onChange(parseFloat(value));
                            }
                          }}
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
                      <FormLabel>Longitude</FormLabel>
                      <FormControl>
                        <Input
                          type="number"
                          step="any"
                          {...field}
                          onChange={(e) => {
                            const value = e.target.value;
                            if (value !== '') {
                              field.onChange(parseFloat(value));
                            }
                          }}
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
                name="languages"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Languages (comma-separated)</FormLabel>
                    <FormControl>
                      <Input
                        value={field.value?.join(', ') || ''}
                        onChange={(e) => field.onChange(e.target.value.split(',').map(s => s.trim()).filter(Boolean))}
                        placeholder="English, Spanish, French"
                        data-testid="input-languages"
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="included"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Included Items (one per line)</FormLabel>
                    <FormControl>
                      <Textarea
                        value={field.value?.join('\n') || ''}
                        onChange={(e) => field.onChange(e.target.value.split('\n').filter(Boolean))}
                        rows={4}
                        placeholder="Professional guide&#10;Museum entrance&#10;Transportation"
                        data-testid="textarea-included"
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="excluded"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Excluded Items (one per line)</FormLabel>
                    <FormControl>
                      <Textarea
                        value={field.value?.join('\n') || ''}
                        onChange={(e) => field.onChange(e.target.value.split('\n').filter(Boolean))}
                        rows={4}
                        placeholder="Food and drinks&#10;Personal expenses&#10;Gratuities"
                        data-testid="textarea-excluded"
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="images"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Image URLs (one per line)</FormLabel>
                    <FormControl>
                      <Textarea
                        value={field.value?.join('\n') || ''}
                        onChange={(e) => field.onChange(e.target.value.split('\n').filter(Boolean))}
                        rows={3}
                        placeholder="https://example.com/image1.jpg&#10;https://example.com/image2.jpg"
                        data-testid="textarea-images"
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="isActive"
                render={({ field }) => (
                  <FormItem className="flex flex-row items-center justify-between rounded-lg border p-4">
                    <div className="space-y-0.5">
                      <FormLabel className="text-base">Active Status</FormLabel>
                      <FormDescription>
                        Make this tour visible to tourists
                      </FormDescription>
                    </div>
                    <FormControl>
                      <Switch
                        checked={field.value}
                        onCheckedChange={field.onChange}
                        data-testid="switch-is-active"
                      />
                    </FormControl>
                  </FormItem>
                )}
              />

              <div className="flex gap-3">
                <Button type="submit" disabled={updateMutation.isPending} data-testid="button-save">
                  {updateMutation.isPending && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
                  Save Changes
                </Button>
                <Link href="/">
                  <Button type="button" variant="outline" data-testid="button-cancel">
                    Cancel
                  </Button>
                </Link>
              </div>
            </form>
          </Form>
        </Card>
      </div>
    </div>
  );
}
