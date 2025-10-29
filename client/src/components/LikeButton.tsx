import { useState } from "react";
import { Heart } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/hooks/useAuth";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useToast } from "@/hooks/use-toast";
import { motion, AnimatePresence } from "framer-motion";

interface LikeButtonProps {
  targetId: string;
  targetType: "profile" | "tour" | "service";
  showCount?: boolean;
  variant?: "default" | "ghost" | "outline";
  size?: "sm" | "default" | "lg" | "icon";
}

export function LikeButton({ 
  targetId, 
  targetType, 
  showCount = true,
  variant = "ghost",
  size = "sm"
}: LikeButtonProps) {
  const { user } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [isAnimating, setIsAnimating] = useState(false);

  // Fetch like count
  const { data: likeData } = useQuery({
    queryKey: [`likes-${targetType}-${targetId}`],
    queryFn: async () => {
      const res = await fetch(`/api/likes/${targetType}/${targetId}`);
      if (!res.ok) throw new Error("Failed to fetch likes");
      return res.json() as Promise<{ count: number }>;
    },
  });

  // Check if user has liked
  const { data: likedData } = useQuery({
    queryKey: [`like-check-${targetType}-${targetId}`],
    queryFn: async () => {
      if (!user) return { hasLiked: false };
      const res = await fetch(`/api/likes/${targetType}/${targetId}/check`, {
        credentials: "include",
      });
      if (!res.ok) return { hasLiked: false };
      return res.json() as Promise<{ hasLiked: boolean }>;
    },
    enabled: !!user,
  });

  // Toggle like mutation
  const toggleLike = useMutation({
    mutationFn: async () => {
      const res = await fetch("/api/likes/toggle", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({ targetId, targetType }),
      });
      if (!res.ok) {
        const error = await res.json();
        throw new Error(error.message || "Failed to toggle like");
      }
      return res.json();
    },
    onMutate: () => {
      setIsAnimating(true);
      setTimeout(() => setIsAnimating(false), 600);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [`likes-${targetType}-${targetId}`] });
      queryClient.invalidateQueries({ queryKey: [`like-check-${targetType}-${targetId}`] });
    },
    onError: (error: Error) => {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const handleClick = () => {
    if (!user) {
      toast({
        title: "Login Required",
        description: "Please log in to like content",
        variant: "destructive",
      });
      return;
    }

    if (user.role !== "tourist") {
      toast({
        title: "Not Allowed",
        description: "Only tourists can like content",
        variant: "destructive",
      });
      return;
    }

    toggleLike.mutate();
  };

  const isLiked = likedData?.hasLiked || false;
  const count = likeData?.count || 0;

  return (
    <div className="flex items-center gap-1">
      <Button
        variant={variant}
        size={size}
        onClick={handleClick}
        className="relative group"
        disabled={toggleLike.isPending}
      >
        <AnimatePresence>
          {isAnimating && (
            <motion.div
              initial={{ scale: 0, opacity: 1 }}
              animate={{ scale: 2, opacity: 0 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.6 }}
              className="absolute inset-0 flex items-center justify-center"
            >
              <Heart className="fill-orange-500 text-orange-500" />
            </motion.div>
          )}
        </AnimatePresence>
        
        <motion.div
          animate={{ scale: isAnimating ? [1, 1.3, 1] : 1 }}
          transition={{ duration: 0.3 }}
        >
          <Heart
            className={`h-5 w-5 transition-all ${
              isLiked 
                ? "fill-orange-600 text-orange-600" 
                : "text-gray-400 group-hover:text-orange-500"
            }`}
          />
        </motion.div>
      </Button>
      
      {showCount && (
        <span className="text-sm font-medium text-gray-600 dark:text-gray-400 min-w-[2rem]">
          {count}
        </span>
      )}
    </div>
  );
}
