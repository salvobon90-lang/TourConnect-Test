import { useState } from 'react';
import { useMutation } from '@tanstack/react-query';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { StarRating } from '@/components/ui/star-rating';
import { Upload, X } from 'lucide-react';
import { apiRequest, queryClient } from '@/lib/queryClient';
import { useToast } from '@/hooks/use-toast';

const reviewSchema = z.object({
  rating: z.number().min(1, 'Please select a rating').max(5),
  comment: z.string().min(10, 'Comment must be at least 10 characters').max(2000),
  images: z.array(z.string().url()).optional()
});

type ReviewFormData = z.infer<typeof reviewSchema>;

interface CreateReviewFormProps {
  tourId?: string;
  serviceId?: string;
  onSuccess?: () => void;
}

export function CreateReviewForm({ tourId, serviceId, onSuccess }: CreateReviewFormProps) {
  const [imageUrls, setImageUrls] = useState<string[]>([]);
  const { toast } = useToast();
  
  const form = useForm<ReviewFormData>({
    resolver: zodResolver(reviewSchema),
    defaultValues: {
      rating: 0,
      comment: '',
      images: []
    }
  });
  
  const createReviewMutation = useMutation({
    mutationFn: async (data: ReviewFormData) => {
      return await apiRequest('POST', '/api/reviews', {
        tourId,
        serviceId,
        rating: data.rating,
        comment: data.comment,
        images: imageUrls
      });
    },
    onSuccess: () => {
      toast({ title: 'Review posted successfully!' });
      queryClient.invalidateQueries({ queryKey: ['/api/reviews'] });
      if (tourId) {
        queryClient.invalidateQueries({ queryKey: ['/api/tours', tourId, 'rating'] });
      }
      form.reset();
      setImageUrls([]);
      onSuccess?.();
    },
    onError: (error: any) => {
      toast({ 
        title: 'Failed to post review', 
        description: error.message,
        variant: 'destructive' 
      });
    }
  });
  
  const onSubmit = (data: ReviewFormData) => {
    createReviewMutation.mutate(data);
  };
  
  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files) return;
    
    toast({ title: 'Image upload coming soon!', description: 'This feature will be available soon.' });
  };
  
  return (
    <Card className="p-6">
      <h3 className="text-xl font-semibold mb-4">Write a Review</h3>
      
      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
          <FormField
            control={form.control}
            name="rating"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Rating *</FormLabel>
                <FormControl>
                  <StarRating
                    value={field.value}
                    onChange={field.onChange}
                    size="lg"
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
          
          <FormField
            control={form.control}
            name="comment"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Your Review *</FormLabel>
                <FormControl>
                  <Textarea
                    {...field}
                    placeholder="Share your experience..."
                    rows={5}
                    data-testid="input-comment"
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
          
          <div>
            <FormLabel>Photos (optional)</FormLabel>
            <div className="mt-2">
              <label className="cursor-pointer">
                <div className="border-2 border-dashed rounded-md p-4 text-center hover-elevate">
                  <Upload className="h-8 w-8 mx-auto mb-2 text-muted-foreground" />
                  <p className="text-sm text-muted-foreground">Click to upload images</p>
                </div>
                <input
                  type="file"
                  accept="image/*"
                  multiple
                  className="hidden"
                  onChange={handleImageUpload}
                  data-testid="input-images"
                />
              </label>
            </div>
            
            {imageUrls.length > 0 && (
              <div className="flex gap-2 mt-3 flex-wrap">
                {imageUrls.map((url, idx) => (
                  <div key={idx} className="relative">
                    <img
                      src={url}
                      alt={`Preview ${idx + 1}`}
                      className="h-20 w-20 object-cover rounded-md"
                    />
                    <button
                      type="button"
                      onClick={() => setImageUrls(urls => urls.filter((_, i) => i !== idx))}
                      className="absolute -top-2 -right-2 bg-destructive text-destructive-foreground rounded-full p-1"
                    >
                      <X className="h-3 w-3" />
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>
          
          <Button
            type="submit"
            disabled={createReviewMutation.isPending}
            data-testid="button-submit-review"
          >
            {createReviewMutation.isPending ? 'Posting...' : 'Post Review'}
          </Button>
        </form>
      </Form>
    </Card>
  );
}
