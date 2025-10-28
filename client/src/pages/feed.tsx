import { useState, useEffect, FormEvent } from 'react';
import { useLocation } from 'wouter';
import { useQuery, useMutation } from '@tanstack/react-query';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { insertPostSchema, type InsertPost, type Post, type User } from '@shared/schema';
import { apiRequest, queryClient } from '@/lib/queryClient';
import { useAuth } from '@/hooks/useAuth';
import { useToast } from '@/hooks/use-toast';
import { useSocialFeedWS } from '@/hooks/useSocialFeedWS';
import { Header } from '@/components/layout/Header';
import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Form, FormField, FormItem, FormLabel, FormControl, FormMessage } from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Switch } from '@/components/ui/switch';
import { LoadingSpinner } from '@/components/loading-spinner';
import { SEO } from '@/components/seo';
import { Heart, MessageCircle, Trash2, Plus } from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';
import { it } from 'date-fns/locale';
import { z } from 'zod';

// Extended Post type with author and engagement data
type PostWithDetails = Post & {
  author: User;
  isLikedByCurrentUser: boolean;
};

// Form schema for dialog
const createPostFormSchema = z.object({
  content: z.string().min(1, "Il contenuto è obbligatorio"),
  images: z.string().optional(),
  hashtags: z.string().optional(),
  isPublic: z.boolean().default(true),
});

type CreatePostFormValues = z.infer<typeof createPostFormSchema>;

// PostCard Component
function PostCard({ post }: { post: PostWithDetails }) {
  const { user } = useAuth();
  const [location, navigate] = useLocation();
  const { toast } = useToast();

  const likeMutation = useMutation({
    mutationFn: async (postId: string) => {
      const isLiked = post.isLikedByCurrentUser;
      
      if (isLiked) {
        return await apiRequest('DELETE', `/api/posts/${postId}/like`);
      } else {
        return await apiRequest('POST', `/api/posts/${postId}/like`);
      }
    },
    onSuccess: async () => {
      // Invalidate all posts queries (feed and related queries)
      await queryClient.invalidateQueries({ 
        queryKey: ['/api/posts'],
        exact: false
      });
      // Invalidate specific post details
      await queryClient.invalidateQueries({ 
        queryKey: ['/api/posts', post.id],
        exact: true
      });
    },
    onError: (error: any) => {
      toast({ 
        title: 'Errore', 
        description: 'Impossibile aggiornare il like',
        variant: 'destructive'
      });
      console.error('[likePost] Error:', error);
    }
  });

  const deleteMutation = useMutation({
    mutationFn: async (postId: string) => {
      return await apiRequest('DELETE', `/api/posts/${postId}`);
    },
    onSuccess: async () => {
      toast({ title: 'Post eliminato con successo' });
      // Invalidate all posts queries
      await queryClient.invalidateQueries({ 
        queryKey: ['/api/posts'],
        exact: false
      });
    },
    onError: (error: any) => {
      toast({ 
        title: 'Errore', 
        description: 'Impossibile eliminare il post',
        variant: 'destructive'
      });
      console.error('[deletePost] Error:', error);
    }
  });

  const handleLike = (postId: string) => {
    likeMutation.mutate(postId);
  };

  const handleDelete = (postId: string) => {
    if (confirm('Sei sicuro di voler eliminare questo post?')) {
      deleteMutation.mutate(postId);
    }
  };

  return (
    <Card data-testid={`card-post-${post.id}`} className="hover-elevate">
      <CardHeader>
        <div className="flex items-center gap-3">
          <Avatar>
            <AvatarImage src={post.author.profileImageUrl || undefined} />
            <AvatarFallback>
              {post.author.firstName?.[0]}{post.author.lastName?.[0]}
            </AvatarFallback>
          </Avatar>
          <div className="flex-1">
            <p className="font-semibold">
              {post.author.firstName} {post.author.lastName}
            </p>
            <p className="text-sm text-muted-foreground">
              {post.author.role} · {formatDistanceToNow(new Date(post.createdAt), { addSuffix: true, locale: it })}
            </p>
          </div>
        </div>
      </CardHeader>
      
      <CardContent className="space-y-4">
        {/* Content */}
        <p className="whitespace-pre-wrap">{post.content}</p>
        
        {/* Images */}
        {post.images && post.images.length > 0 && (
          <div className="rounded-md overflow-hidden">
            <img 
              src={post.images[0]} 
              alt="Post image" 
              className="w-full h-auto object-cover max-h-96"
            />
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
        <div className="flex items-center gap-4 pt-2">
          {/* Like Button */}
          <Button
            variant="ghost"
            size="sm"
            data-testid={`button-like-${post.id}`}
            onClick={() => handleLike(post.id)}
            disabled={likeMutation.isPending}
            className="gap-2"
          >
            <Heart className={post.isLikedByCurrentUser ? "fill-primary text-primary" : ""} size={18} />
            <span>{post.likesCount}</span>
          </Button>
          
          {/* Comment Button */}
          <Button
            variant="ghost"
            size="sm"
            data-testid={`button-comments-${post.id}`}
            onClick={() => navigate(`/feed/${post.id}`)}
            className="gap-2"
          >
            <MessageCircle size={18} />
            <span>{post.commentsCount}</span>
          </Button>
          
          {/* Delete Button (own posts only) */}
          {post.authorId === user?.id && (
            <Button
              variant="ghost"
              size="sm"
              data-testid={`button-delete-${post.id}`}
              onClick={() => handleDelete(post.id)}
              disabled={deleteMutation.isPending}
              className="gap-2 ml-auto text-destructive hover:text-destructive"
            >
              <Trash2 size={18} />
            </Button>
          )}
        </div>
      </CardContent>
    </Card>
  );
}

// Main Feed Page
export default function Feed() {
  const { user } = useAuth();
  const [location, navigate] = useLocation();
  const { toast } = useToast();
  const [createDialogOpen, setCreateDialogOpen] = useState(false);

  // Enable WebSocket real-time updates
  useSocialFeedWS();

  // Query posts
  const { data: posts, isLoading } = useQuery<PostWithDetails[]>({
    queryKey: ['/api/posts'],
    enabled: !!user
  });

  // Open dialog when URL is /feed/new
  useEffect(() => {
    setCreateDialogOpen(location === '/feed/new');
  }, [location]);

  // Close dialog -> navigate back to /feed
  const closeDialog = () => {
    navigate('/feed');
    setCreateDialogOpen(false);
  };

  // Form setup
  const form = useForm<CreatePostFormValues>({
    resolver: zodResolver(createPostFormSchema),
    defaultValues: {
      content: '',
      images: '',
      hashtags: '',
      isPublic: true
    }
  });

  // Create post mutation
  const createMutation = useMutation({
    mutationFn: async (data: InsertPost) => {
      return await apiRequest('POST', '/api/posts', data);
    },
    onSuccess: async () => {
      toast({ title: 'Post creato con successo!' });
      // Await invalidation to ensure cache is refreshed
      await queryClient.invalidateQueries({ 
        queryKey: ['/api/posts'],
        exact: false
      });
      closeDialog();
      form.reset();
    },
    onError: (error: any) => {
      toast({ 
        title: 'Errore nella creazione del post', 
        description: error.message || 'Impossibile creare il post',
        variant: 'destructive'
      });
      console.error('[createPost] Error:', error);
    }
  });

  const onSubmit = (data: CreatePostFormValues) => {
    // Parse arrays from comma-separated strings
    const images = data.images 
      ? data.images.split(',').map((s: string) => s.trim()).filter(Boolean)
      : undefined;
    
    const hashtags = data.hashtags 
      ? data.hashtags.split(',').map((s: string) => s.trim()).filter(Boolean)
      : undefined;
    
    // Create payload matching InsertPost schema exactly
    const payload: InsertPost = {
      authorId: user!.id,
      content: data.content.trim(),
      isPublic: data.isPublic ?? true,
    };
    
    // Only add optional array fields if they have values
    if (images && images.length > 0) {
      payload.images = images;
    }
    
    if (hashtags && hashtags.length > 0) {
      payload.hashtags = hashtags;
    }
    
    createMutation.mutate(payload);
  };

  return (
    <>
      <SEO 
        title="Feed Social | TourConnect"
        description="Condividi le tue esperienze di viaggio, scopri storie dai turisti e dalle guide locali. Il feed social di TourConnect ti connette con la community del turismo."
      />

      <div className="min-h-screen bg-background">
        <Header />
        
        <div className="container mx-auto px-4 py-8 max-w-4xl">
          {/* Hero Section */}
          <div className="mb-8">
            <h1 className="text-4xl font-bold mb-3">Feed Social</h1>
            <p className="text-muted-foreground text-lg mb-6">
              Condividi le tue esperienze e scopri le storie della community
            </p>
            
            <div className="flex items-center gap-4">
              <Button 
                onClick={() => navigate('/feed/new')}
                data-testid="button-create-post"
                className="gap-2"
              >
                <Plus size={18} />
                Crea Post
              </Button>
            </div>
          </div>

          {/* Filter Bar - Placeholder */}
          <div className="mb-6 p-4 bg-card rounded-md border">
            <p className="text-sm text-muted-foreground">
              Filtri (in arrivo): #hashtag, solo pubblici, solo i miei post
            </p>
          </div>

          {/* Posts List */}
          {isLoading ? (
            <div className="flex justify-center py-12">
              <LoadingSpinner size="lg" />
            </div>
          ) : posts?.length === 0 ? (
            <div className="text-center py-12">
              <p className="text-muted-foreground">Nessun post ancora. Sii il primo a condividere qualcosa!</p>
            </div>
          ) : (
            <div className="space-y-4">
              {posts?.map(post => (
                <PostCard key={post.id} post={post} />
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Create Post Dialog */}
      <Dialog open={createDialogOpen} onOpenChange={(open) => {
        if (!open) closeDialog();
      }}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Crea un Nuovo Post</DialogTitle>
          </DialogHeader>
          
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
              {/* Content Textarea */}
              <FormField
                control={form.control}
                name="content"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Contenuto *</FormLabel>
                    <FormControl>
                      <Textarea
                        {...field}
                        placeholder="Cosa vuoi condividere con la community?"
                        data-testid="input-content"
                        rows={5}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              
              {/* Images (optional) */}
              <FormField
                control={form.control}
                name="images"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Immagini (URL)</FormLabel>
                    <FormControl>
                      <Input
                        {...field}
                        placeholder="https://example.com/image.jpg, https://..."
                        data-testid="input-images"
                      />
                    </FormControl>
                    <p className="text-sm text-muted-foreground">
                      Inserisci URL delle immagini, separati da virgola
                    </p>
                    <FormMessage />
                  </FormItem>
                )}
              />
              
              {/* Hashtags */}
              <FormField
                control={form.control}
                name="hashtags"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Hashtags</FormLabel>
                    <FormControl>
                      <Input
                        {...field}
                        placeholder="travel, tourism, italy"
                        data-testid="input-hashtags"
                      />
                    </FormControl>
                    <p className="text-sm text-muted-foreground">
                      Separa gli hashtag con virgole (senza #)
                    </p>
                    <FormMessage />
                  </FormItem>
                )}
              />
              
              {/* Public Toggle */}
              <FormField
                control={form.control}
                name="isPublic"
                render={({ field }) => (
                  <FormItem className="flex flex-row items-center justify-between rounded-lg border p-4">
                    <div className="space-y-0.5">
                      <FormLabel className="text-base">Post Pubblico</FormLabel>
                      <p className="text-sm text-muted-foreground">
                        Rendi questo post visibile a tutti gli utenti
                      </p>
                    </div>
                    <FormControl>
                      <Switch
                        checked={field.value}
                        onCheckedChange={field.onChange}
                        data-testid="switch-public"
                      />
                    </FormControl>
                  </FormItem>
                )}
              />
              
              <DialogFooter>
                <Button
                  type="button"
                  variant="outline"
                  onClick={closeDialog}
                >
                  Annulla
                </Button>
                <Button
                  type="submit"
                  disabled={createMutation.isPending}
                  data-testid="button-submit-post"
                >
                  {createMutation.isPending ? 'Pubblicazione...' : 'Pubblica'}
                </Button>
              </DialogFooter>
            </form>
          </Form>
        </DialogContent>
      </Dialog>
    </>
  );
}
