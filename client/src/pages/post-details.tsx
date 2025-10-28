import { useState, FormEvent } from 'react';
import { useParams, useLocation } from 'wouter';
import { useQuery, useMutation } from '@tanstack/react-query';
import { apiRequest, queryClient } from '@/lib/queryClient';
import { useAuth } from '@/hooks/useAuth';
import { useToast } from '@/hooks/use-toast';
import { useSocialFeedWS } from '@/hooks/useSocialFeedWS';
import { Header } from '@/components/layout/Header';
import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Textarea } from '@/components/ui/textarea';
import { LoadingSpinner } from '@/components/loading-spinner';
import { SEO } from '@/components/seo';
import { ArrowLeft, Heart, MessageCircle, Trash2 } from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';
import { it } from 'date-fns/locale';
import type { Post, User, PostComment } from '@shared/schema';

// Extended types
type PostWithDetails = Post & {
  author: User;
  isLikedByCurrentUser: boolean;
};

type CommentWithUser = PostComment & {
  user: User;
};

export default function PostDetails() {
  const { id } = useParams<{ id: string }>();
  const { user } = useAuth();
  const [, navigate] = useLocation();
  const { toast } = useToast();
  const [commentText, setCommentText] = useState('');

  // Enable WebSocket real-time updates
  useSocialFeedWS();

  // Fetch post details
  const { data: post, isLoading: postLoading } = useQuery<PostWithDetails>({
    queryKey: ['/api/posts', id],
    enabled: !!id
  });

  // Fetch comments
  const { data: comments, isLoading: commentsLoading } = useQuery<CommentWithUser[]>({
    queryKey: ['/api/posts', id, 'comments'],
    enabled: !!id
  });

  // Like mutation
  const likeMutation = useMutation({
    mutationFn: async () => {
      const isLiked = post?.isLikedByCurrentUser;
      
      if (isLiked) {
        return await apiRequest('DELETE', `/api/posts/${id}/like`);
      } else {
        return await apiRequest('POST', `/api/posts/${id}/like`);
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/posts'] });
      queryClient.invalidateQueries({ queryKey: ['/api/posts', id] });
    }
  });

  // Delete post mutation
  const deleteMutation = useMutation({
    mutationFn: async () => {
      return await apiRequest('DELETE', `/api/posts/${id}`);
    },
    onSuccess: () => {
      toast({ title: 'Post eliminato con successo' });
      navigate('/feed');
    }
  });

  // Add comment mutation
  const addCommentMutation = useMutation({
    mutationFn: async (content: string) => {
      return await apiRequest('POST', `/api/posts/${id}/comments`, { content, postId: id });
    },
    onSuccess: () => {
      toast({ title: 'Commento aggiunto!' });
      queryClient.invalidateQueries({ queryKey: ['/api/posts', id, 'comments'] });
      queryClient.invalidateQueries({ queryKey: ['/api/posts', id] });
      queryClient.invalidateQueries({ queryKey: ['/api/posts'] });
      setCommentText('');
    },
    onError: (error: any) => {
      toast({ 
        title: 'Errore nell\'aggiunta del commento', 
        description: error.message,
        variant: 'destructive'
      });
    }
  });

  const handleAddComment = (e: FormEvent) => {
    e.preventDefault();
    if (commentText.trim()) {
      addCommentMutation.mutate(commentText);
    }
  };

  const handleLike = () => {
    likeMutation.mutate();
  };

  const handleDelete = () => {
    if (confirm('Sei sicuro di voler eliminare questo post?')) {
      deleteMutation.mutate();
    }
  };

  if (postLoading) {
    return (
      <>
        <Header />
        <div className="flex justify-center items-center min-h-screen">
          <LoadingSpinner size="lg" />
        </div>
      </>
    );
  }

  if (!post) {
    return (
      <>
        <Header />
        <div className="container mx-auto px-4 py-8 max-w-4xl">
          <p className="text-center text-muted-foreground">Post non trovato</p>
        </div>
      </>
    );
  }

  return (
    <>
      <SEO 
        title={`${post.author.firstName} ${post.author.lastName} - Post | TourConnect`}
        description={post.content.substring(0, 150)}
      />

      <div className="min-h-screen bg-background">
        <Header />
        
        <div className="container mx-auto px-4 py-8 max-w-4xl">
          {/* Back Button */}
          <Button 
            variant="ghost" 
            onClick={() => navigate('/feed')}
            className="mb-6 gap-2"
            data-testid="button-back"
          >
            <ArrowLeft size={18} />
            Indietro al Feed
          </Button>

          {/* Post Card (Full Details) */}
          <Card className="mb-8">
            <CardHeader>
              <div className="flex items-center gap-3">
                <Avatar className="h-12 w-12">
                  <AvatarImage src={post.author.profileImageUrl || undefined} />
                  <AvatarFallback>
                    {post.author.firstName?.[0]}{post.author.lastName?.[0]}
                  </AvatarFallback>
                </Avatar>
                <div className="flex-1">
                  <p className="font-semibold text-lg">
                    {post.author.firstName} {post.author.lastName}
                  </p>
                  <p className="text-sm text-muted-foreground">
                    {post.author.role} · {formatDistanceToNow(new Date(post.createdAt), { addSuffix: true, locale: it })}
                  </p>
                </div>
                {post.authorId === user?.id && (
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={handleDelete}
                    disabled={deleteMutation.isPending}
                    data-testid="button-delete"
                    className="text-destructive hover:text-destructive"
                  >
                    <Trash2 size={18} />
                  </Button>
                )}
              </div>
            </CardHeader>
            
            <CardContent className="space-y-4">
              {/* Content */}
              <p className="text-lg whitespace-pre-wrap">{post.content}</p>
              
              {/* Images */}
              {post.images && post.images.length > 0 && (
                <div className="space-y-4">
                  {post.images.map((img, index) => (
                    <div key={index} className="rounded-md overflow-hidden">
                      <img 
                        src={img} 
                        alt={`Post image ${index + 1}`} 
                        className="w-full h-auto object-cover"
                      />
                    </div>
                  ))}
                </div>
              )}
              
              {/* Hashtags */}
              {post.hashtags && post.hashtags.length > 0 && (
                <div className="flex flex-wrap gap-2">
                  {post.hashtags.map((tag, index) => (
                    <Badge key={index} variant="secondary">
                      #{tag}
                    </Badge>
                  ))}
                </div>
              )}
              
              {/* Actions */}
              <div className="flex items-center gap-4 pt-4 border-t">
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={handleLike}
                  disabled={likeMutation.isPending}
                  data-testid="button-like"
                  className="gap-2"
                >
                  <Heart className={post.isLikedByCurrentUser ? "fill-primary text-primary" : ""} size={20} />
                  <span>{post.likesCount}</span>
                </Button>
                
                <Button
                  variant="ghost"
                  size="sm"
                  className="gap-2"
                  data-testid="button-comments-count"
                >
                  <MessageCircle size={20} />
                  <span>{post.commentsCount}</span>
                </Button>
              </div>
            </CardContent>
          </Card>

          {/* Comments Section */}
          <div className="space-y-6">
            <div className="flex items-center justify-between">
              <h2 className="text-2xl font-bold">
                Commenti ({comments?.length || 0})
              </h2>
            </div>

            {/* Add Comment Form */}
            <Card>
              <CardContent className="pt-6">
                <form onSubmit={handleAddComment} className="space-y-4">
                  <Textarea
                    value={commentText}
                    onChange={(e) => setCommentText(e.target.value)}
                    placeholder="Scrivi un commento..."
                    data-testid="input-comment"
                    rows={3}
                  />
                  <div className="flex justify-end">
                    <Button
                      type="submit"
                      disabled={!commentText.trim() || addCommentMutation.isPending}
                      data-testid="button-submit-comment"
                    >
                      {addCommentMutation.isPending ? 'Invio...' : 'Commenta'}
                    </Button>
                  </div>
                </form>
              </CardContent>
            </Card>

            {/* Comments List */}
            {commentsLoading ? (
              <div className="flex justify-center py-8">
                <LoadingSpinner />
              </div>
            ) : comments && comments.length > 0 ? (
              <div className="space-y-4">
                {comments.map(comment => (
                  <Card key={comment.id} data-testid={`comment-${comment.id}`}>
                    <CardContent className="pt-6">
                      <div className="flex items-start gap-3">
                        <Avatar>
                          <AvatarImage src={comment.user?.profileImageUrl || undefined} />
                          <AvatarFallback>
                            {comment.user?.firstName?.[0]}{comment.user?.lastName?.[0]}
                          </AvatarFallback>
                        </Avatar>
                        <div className="flex-1 space-y-2">
                          <div>
                            <p className="font-semibold">
                              {comment.user?.firstName} {comment.user?.lastName}
                            </p>
                            <p className="text-sm text-muted-foreground">
                              {formatDistanceToNow(new Date(comment.createdAt), { addSuffix: true, locale: it })}
                            </p>
                          </div>
                          <p className="whitespace-pre-wrap">{comment.content}</p>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            ) : (
              <p className="text-center text-muted-foreground py-8">
                Nessun commento ancora. Sii il primo a commentare!
              </p>
            )}
          </div>
        </div>
      </div>
    </>
  );
}
