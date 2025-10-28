import { useQuery, useMutation } from '@tanstack/react-query';
import { Card } from '@/components/ui/card';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { StarRating } from '@/components/ui/star-rating';
import { formatDistanceToNow } from 'date-fns';
import { useState } from 'react';
import type { ReviewWithUser } from '@shared/schema';
import { useAuth } from '@/hooks/useAuth';
import { useToast } from '@/hooks/use-toast';
import { apiRequest, queryClient } from '@/lib/queryClient';

interface ReviewsListProps {
  tourId?: string;
  serviceId?: string;
}

export function ReviewsList({ tourId, serviceId }: ReviewsListProps) {
  const [sortBy, setSortBy] = useState<'recent' | 'rating'>('recent');
  
  const { data: reviews = [], isLoading } = useQuery<ReviewWithUser[]>({
    queryKey: tourId 
      ? ['/api/reviews', 'tour', tourId, sortBy]
      : ['/api/reviews', 'service', serviceId, sortBy],
    queryFn: async () => {
      const endpoint = tourId 
        ? `/api/reviews?tourId=${tourId}&sort=${sortBy}`
        : `/api/reviews?serviceId=${serviceId}&sort=${sortBy}`;
      const res = await fetch(endpoint, { credentials: 'include' });
      if (!res.ok) throw new Error('Failed to fetch reviews');
      return res.json();
    },
    enabled: !!(tourId || serviceId)
  });
  
  const { data: ratingStats } = useQuery<{ averageRating: number; reviewCount: number }>({
    queryKey: tourId ? ['/api/tours', tourId, 'rating'] : [],
    enabled: !!tourId,
  });
  
  if (isLoading) {
    return <div>Loading reviews...</div>;
  }
  
  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between flex-wrap gap-4">
        <div>
          <h3 className="text-2xl font-semibold">Reviews</h3>
          {ratingStats && (
            <div className="flex items-center gap-2 mt-2">
              <StarRating value={ratingStats.averageRating} readonly size="md" />
              <span className="text-lg font-medium">{ratingStats.averageRating.toFixed(1)}</span>
              <span className="text-muted-foreground">
                ({ratingStats.reviewCount} {ratingStats.reviewCount === 1 ? 'review' : 'reviews'})
              </span>
            </div>
          )}
        </div>
        
        <Select value={sortBy} onValueChange={(v) => setSortBy(v as 'recent' | 'rating')}>
          <SelectTrigger className="w-40" data-testid="select-sort">
            <SelectValue placeholder="Sort by" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="recent">Most Recent</SelectItem>
            <SelectItem value="rating">Highest Rating</SelectItem>
          </SelectContent>
        </Select>
      </div>
      
      {reviews.length === 0 ? (
        <Card className="p-8 text-center">
          <p className="text-muted-foreground">No reviews yet. Be the first to review!</p>
        </Card>
      ) : (
        <div className="space-y-4">
          {reviews.map(review => (
            <ReviewCard key={review.id} review={review} tourId={tourId} />
          ))}
        </div>
      )}
    </div>
  );
}

interface ReviewCardProps {
  review: ReviewWithUser;
  tourId?: string;
}

function ReviewCard({ review, tourId }: ReviewCardProps) {
  const { user } = useAuth();
  const { toast } = useToast();
  const [isEditing, setIsEditing] = useState(false);
  const [editComment, setEditComment] = useState(review.comment);
  const [editRating, setEditRating] = useState(review.rating);
  const [responseText, setResponseText] = useState('');
  const [showResponseForm, setShowResponseForm] = useState(false);
  
  const isOwner = review.userId === user?.id;
  const canRespond = user?.role === 'guide' && tourId;
  
  const deleteReviewMutation = useMutation({
    mutationFn: async () => {
      return apiRequest('DELETE', `/api/reviews/${review.id}`);
    },
    onSuccess: () => {
      toast({ title: 'Review deleted' });
      queryClient.invalidateQueries({ queryKey: ['/api/reviews'] });
      queryClient.invalidateQueries({ queryKey: ['/api/tours'] });
    },
    onError: () => {
      toast({ title: 'Failed to delete review', variant: 'destructive' });
    }
  });
  
  const updateReviewMutation = useMutation({
    mutationFn: async (data: { rating: number; comment: string }) => {
      return apiRequest('PATCH', `/api/reviews/${review.id}`, data);
    },
    onSuccess: () => {
      toast({ title: 'Review updated' });
      queryClient.invalidateQueries({ queryKey: ['/api/reviews'] });
      queryClient.invalidateQueries({ queryKey: ['/api/tours'] });
      setIsEditing(false);
    },
    onError: () => {
      toast({ title: 'Failed to update review', variant: 'destructive' });
    }
  });
  
  const addResponseMutation = useMutation({
    mutationFn: async (response: string) => {
      return apiRequest('PATCH', `/api/reviews/${review.id}`, { response });
    },
    onSuccess: () => {
      toast({ title: 'Response added' });
      queryClient.invalidateQueries({ queryKey: ['/api/reviews'] });
      setShowResponseForm(false);
      setResponseText('');
    },
    onError: () => {
      toast({ title: 'Failed to add response', variant: 'destructive' });
    }
  });
  
  return (
    <Card className="p-6" data-testid={`review-${review.id}`}>
      <div className="flex items-start gap-4">
        <Avatar>
          <AvatarImage src={review.user.profileImageUrl || undefined} />
          <AvatarFallback>
            {review.user.firstName?.[0]}{review.user.lastName?.[0]}
          </AvatarFallback>
        </Avatar>
        
        <div className="flex-1 min-w-0">
          <div className="flex items-start justify-between mb-2">
            <div>
              <p className="font-medium">
                {review.user.firstName} {review.user.lastName}
              </p>
              <p className="text-sm text-muted-foreground">
                {formatDistanceToNow(new Date(review.createdAt), { addSuffix: true })}
              </p>
            </div>
            {!isEditing && <StarRating value={review.rating} readonly size="sm" />}
          </div>
          
          {isEditing ? (
            <div className="space-y-3">
              <div>
                <label className="text-sm font-medium mb-1 block">Rating</label>
                <StarRating value={editRating} onChange={setEditRating} size="md" />
              </div>
              <Textarea
                value={editComment}
                onChange={(e) => setEditComment(e.target.value)}
                rows={4}
                data-testid="textarea-edit-comment"
              />
              <div className="flex gap-2">
                <Button
                  size="sm"
                  onClick={() => updateReviewMutation.mutate({ rating: editRating, comment: editComment })}
                  disabled={updateReviewMutation.isPending}
                  data-testid="button-save-edit"
                >
                  Save
                </Button>
                <Button
                  size="sm"
                  variant="ghost"
                  onClick={() => {
                    setIsEditing(false);
                    setEditComment(review.comment);
                    setEditRating(review.rating);
                  }}
                  data-testid="button-cancel-edit"
                >
                  Cancel
                </Button>
              </div>
            </div>
          ) : (
            <>
              <p className="text-sm mb-3 whitespace-pre-wrap">{review.comment}</p>
              
              {review.images && review.images.length > 0 && (
                <div className="flex gap-2 mb-3 flex-wrap">
                  {review.images.map((img, idx) => (
                    <img
                      key={idx}
                      src={img}
                      alt={`Review image ${idx + 1}`}
                      className="h-20 w-20 object-cover rounded-md"
                      data-testid={`review-image-${idx}`}
                    />
                  ))}
                </div>
              )}
              
              {review.response && (
                <Card className="p-4 mt-3 bg-muted/50">
                  <p className="text-sm font-medium mb-1">Response from guide:</p>
                  <p className="text-sm">{review.response}</p>
                </Card>
              )}
              
              {isOwner && (
                <div className="flex gap-2 mt-3">
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => setIsEditing(true)}
                    data-testid="button-edit-review"
                  >
                    Edit
                  </Button>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => deleteReviewMutation.mutate()}
                    disabled={deleteReviewMutation.isPending}
                    data-testid="button-delete-review"
                  >
                    Delete
                  </Button>
                </div>
              )}
              
              {canRespond && !review.response && (
                <div className="mt-3">
                  {!showResponseForm ? (
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setShowResponseForm(true)}
                      data-testid="button-show-response-form"
                    >
                      Respond
                    </Button>
                  ) : (
                    <div className="space-y-2">
                      <Textarea
                        placeholder="Write a response..."
                        value={responseText}
                        onChange={(e) => setResponseText(e.target.value)}
                        rows={3}
                        data-testid="textarea-response"
                      />
                      <div className="flex gap-2">
                        <Button 
                          onClick={() => addResponseMutation.mutate(responseText)}
                          size="sm"
                          disabled={addResponseMutation.isPending || !responseText.trim()}
                          data-testid="button-submit-response"
                        >
                          Submit Response
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => {
                            setShowResponseForm(false);
                            setResponseText('');
                          }}
                          data-testid="button-cancel-response"
                        >
                          Cancel
                        </Button>
                      </div>
                    </div>
                  )}
                </div>
              )}
            </>
          )}
        </div>
      </div>
    </Card>
  );
}
