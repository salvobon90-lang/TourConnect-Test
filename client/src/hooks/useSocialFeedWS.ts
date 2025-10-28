import { useEffect } from 'react';
import { useWebSocket } from './useWebSocket';
import { useQueryClient } from '@tanstack/react-query';
import { useToast } from './use-toast';
import type { Post, User, PostComment } from '@shared/schema';

// Extended Post type with author and engagement data
type PostWithDetails = Post & {
  author: User;
  isLikedByCurrentUser: boolean;
};

// WebSocket message type interfaces
interface NewPostMessage {
  type: 'new_post';
  post: PostWithDetails;
}

interface PostLikedMessage {
  type: 'post_liked';
  postId: string;
  userId: string;
  likesCount: number;
}

interface PostUnlikedMessage {
  type: 'post_unliked';
  postId: string;
  userId: string;
  likesCount: number;
}

interface PostCommentedMessage {
  type: 'post_commented';
  postId: string;
  comment: PostComment & { author: User };
  commentsCount: number;
}

interface PostDeletedMessage {
  type: 'post_deleted';
  postId: string;
}

type SocialFeedWSMessage = 
  | NewPostMessage 
  | PostLikedMessage 
  | PostUnlikedMessage 
  | PostCommentedMessage 
  | PostDeletedMessage;

export function useSocialFeedWS() {
  const queryClient = useQueryClient();
  const { toast } = useToast();
  
  const handleMessage = (message: unknown) => {
    try {
      // Parse message if it's a string
      const parsed: unknown = typeof message === 'string' ? JSON.parse(message) : message;
      
      // Type guard: check if message has type property
      if (!parsed || typeof parsed !== 'object' || !('type' in parsed)) {
        console.warn('[useSocialFeedWS] Invalid message format:', message);
        return;
      }
      
      const data = parsed as SocialFeedWSMessage;
      
      switch (data.type) {
        case 'new_post': {
          // Validate new_post message
          if (!data.post) {
            console.warn('[useSocialFeedWS] new_post missing post data');
            return;
          }
          
          // Prepend new post to feed
          queryClient.setQueryData<PostWithDetails[]>(['/api/posts'], (old) => {
            if (!old) return [data.post];
            return [data.post, ...old];
          });
          
          toast({ 
            title: 'Nuovo post!', 
            description: data.post.content?.substring(0, 50) || 'Un nuovo post è stato pubblicato'
          });
          break;
        }
          
        case 'post_liked':
        case 'post_unliked': {
          // Validate like/unlike message
          if (!data.postId || typeof data.likesCount !== 'number') {
            console.warn('[useSocialFeedWS] Invalid like/unlike message:', data);
            return;
          }
          
          // Update likes count in feed
          queryClient.setQueryData<PostWithDetails[]>(['/api/posts'], (old) => {
            if (!old) return old;
            return old.map((p) => 
              p.id === data.postId 
                ? { ...p, likesCount: data.likesCount }
                : p
            );
          });
          
          // Update likes count in post details
          queryClient.setQueryData<PostWithDetails>(['/api/posts', data.postId], (old) => {
            if (!old) return old;
            return {
              ...old,
              likesCount: data.likesCount
            };
          });
          break;
        }
          
        case 'post_commented': {
          // Validate comment message
          if (!data.postId || typeof data.commentsCount !== 'number') {
            console.warn('[useSocialFeedWS] Invalid comment message:', data);
            return;
          }
          
          // Update comments count in feed
          queryClient.setQueryData<PostWithDetails[]>(['/api/posts'], (old) => {
            if (!old) return old;
            return old.map((p) => 
              p.id === data.postId 
                ? { ...p, commentsCount: data.commentsCount }
                : p
            );
          });
          
          // Update comments count in post details
          queryClient.setQueryData<PostWithDetails>(['/api/posts', data.postId], (old) => {
            if (!old) return old;
            return {
              ...old,
              commentsCount: data.commentsCount
            };
          });
          
          // Add comment to comments list if we have it
          if (data.comment) {
            queryClient.setQueryData<Array<PostComment & { author: User }>>(
              ['/api/posts', data.postId, 'comments'], 
              (old) => {
                if (!old) return [data.comment];
                return [...old, data.comment];
              }
            );
          }
          
          toast({ 
            title: 'Nuovo commento', 
            description: 'Qualcuno ha commentato un post'
          });
          break;
        }
          
        case 'post_deleted': {
          // Validate delete message
          if (!data.postId) {
            console.warn('[useSocialFeedWS] Invalid delete message:', data);
            return;
          }
          
          // Remove post from feed
          queryClient.setQueryData<PostWithDetails[]>(['/api/posts'], (old) => {
            if (!old) return old;
            return old.filter((p) => p.id !== data.postId);
          });
          
          // Invalidate post details
          queryClient.invalidateQueries({ 
            queryKey: ['/api/posts', data.postId],
            exact: true
          });
          
          toast({ 
            title: 'Post eliminato', 
            description: 'Un post è stato rimosso'
          });
          break;
        }
          
        default: {
          // Handle unknown message types
          const unknownData = data as { type: string };
          console.warn('[useSocialFeedWS] Unknown message type:', unknownData.type);
        }
      }
    } catch (error) {
      console.error('[useSocialFeedWS] Error handling message:', error);
    }
  };

  const { isConnected } = useWebSocket(handleMessage);
  
  useEffect(() => {
    if (isConnected) {
      console.log('[useSocialFeedWS] Connected to WebSocket for social feed updates');
    }
  }, [isConnected]);
}
