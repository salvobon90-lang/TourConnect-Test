import { useQuery } from "@tanstack/react-query";
import { Badge } from "@/components/ui/badge";
import { Crown, Star, Compass, Map, Footprints } from "lucide-react";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";

const TRUST_LEVELS = {
  explorer: {
    label: "Explorer",
    icon: Footprints,
    color: "bg-orange-100 text-orange-700 border-orange-300 dark:bg-orange-950 dark:text-orange-400",
    description: "Just starting the journey (0-20 points)",
    min: 0,
    max: 20,
  },
  pathfinder: {
    label: "Pathfinder",
    icon: Compass,
    color: "bg-orange-200 text-orange-800 border-orange-400 dark:bg-orange-900 dark:text-orange-300",
    description: "Building trust (21-50 points)",
    min: 21,
    max: 50,
  },
  trailblazer: {
    label: "Trailblazer",
    icon: Map,
    color: "bg-orange-300 text-orange-900 border-orange-500 dark:bg-orange-800 dark:text-orange-200",
    description: "Experienced and trusted (51-100 points)",
    min: 51,
    max: 100,
  },
  navigator: {
    label: "Navigator",
    icon: Star,
    color: "bg-amber-400 text-amber-950 border-amber-600 dark:bg-amber-700 dark:text-amber-100",
    description: "Expert in the field (101-200 points)",
    min: 101,
    max: 200,
  },
  legend: {
    label: "Legend",
    icon: Crown,
    color: "bg-gradient-to-r from-orange-500 to-red-600 text-white border-red-700",
    description: "Elite status (200+ points)",
    min: 201,
    max: Infinity,
  },
};

interface TrustLevelBadgeProps {
  userId: string;
  showScore?: boolean;
  size?: "sm" | "md" | "lg";
}

export function TrustLevelBadge({ userId, showScore = false, size = "md" }: TrustLevelBadgeProps) {
  const { data: trustLevel, isLoading } = useQuery({
    queryKey: [`trust-level-${userId}`],
    queryFn: async () => {
      const res = await fetch(`/api/trust-level/${userId}`);
      if (!res.ok) throw new Error("Failed to fetch trust level");
      return res.json() as Promise<{
        level: keyof typeof TRUST_LEVELS;
        score: number;
        likesCount: number;
        averageRating: string;
      }>;
    },
  });

  if (isLoading || !trustLevel) {
    return null;
  }

  const levelData = TRUST_LEVELS[trustLevel.level] || TRUST_LEVELS.explorer;
  const Icon = levelData.icon;

  const sizeClasses = {
    sm: "text-xs px-2 py-0.5",
    md: "text-sm px-3 py-1",
    lg: "text-base px-4 py-1.5",
  };

  const iconSizes = {
    sm: "h-3 w-3",
    md: "h-4 w-4",
    lg: "h-5 w-5",
  };

  return (
    <TooltipProvider>
      <Tooltip>
        <TooltipTrigger asChild>
          <Badge 
            variant="outline" 
            className={`${levelData.color} ${sizeClasses[size]} font-semibold flex items-center gap-1.5 border-2 shadow-sm hover:shadow-md transition-all`}
          >
            <Icon className={iconSizes[size]} />
            <span>{levelData.label}</span>
            {showScore && (
              <span className="ml-1 opacity-80">
                ({trustLevel.score})
              </span>
            )}
          </Badge>
        </TooltipTrigger>
        <TooltipContent>
          <div className="space-y-1">
            <p className="font-semibold">{levelData.label}</p>
            <p className="text-sm text-gray-600 dark:text-gray-400">
              {levelData.description}
            </p>
            <div className="text-xs space-y-0.5 mt-2 pt-2 border-t">
              <p>Score: {trustLevel.score} points</p>
              <p>Likes: {trustLevel.likesCount}</p>
              <p>Avg Rating: {parseFloat(trustLevel.averageRating).toFixed(1)} ⭐</p>
            </div>
          </div>
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  );
}

// Progress indicator for trust level
interface TrustLevelProgressProps {
  userId: string;
}

export function TrustLevelProgress({ userId }: TrustLevelProgressProps) {
  const { data: trustLevel, isLoading } = useQuery({
    queryKey: [`trust-level-${userId}`],
    queryFn: async () => {
      const res = await fetch(`/api/trust-level/${userId}`);
      if (!res.ok) throw new Error("Failed to fetch trust level");
      return res.json() as Promise<{
        level: keyof typeof TRUST_LEVELS;
        score: number;
        likesCount: number;
        averageRating: string;
      }>;
    },
  });

  if (isLoading || !trustLevel) {
    return null;
  }

  const currentLevel = TRUST_LEVELS[trustLevel.level];
  const nextLevel = Object.values(TRUST_LEVELS).find(l => l.min > trustLevel.score);
  const progress = nextLevel 
    ? Math.min(100, ((trustLevel.score - currentLevel.min) / (nextLevel.min - currentLevel.min)) * 100)
    : 100;

  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between">
        <TrustLevelBadge userId={userId} showScore />
        {nextLevel && (
          <span className="text-sm text-gray-600 dark:text-gray-400">
            {nextLevel.min - trustLevel.score} pts to {nextLevel.label}
          </span>
        )}
      </div>
      <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2.5">
        <div
          className="bg-gradient-to-r from-orange-500 to-orange-600 h-2.5 rounded-full transition-all duration-500"
          style={{ width: `${progress}%` }}
        />
      </div>
    </div>
  );
}
