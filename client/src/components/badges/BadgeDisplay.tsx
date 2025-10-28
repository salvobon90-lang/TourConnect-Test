import { Badge } from '@/components/ui/badge';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip';
import { BADGE_CONFIG } from '@/lib/badges';

interface BadgeDisplayProps {
  badges: string[];
  size?: 'sm' | 'md' | 'lg';
  maxVisible?: number;
  showLabels?: boolean;
}

export function BadgeDisplay({ 
  badges = [], 
  size = 'md', 
  maxVisible = 4,
  showLabels = false 
}: BadgeDisplayProps) {
  const iconSizes = {
    sm: 'h-3 w-3',
    md: 'h-4 w-4',
    lg: 'h-5 w-5'
  };
  
  const visibleBadges = badges.slice(0, maxVisible);
  const remainingCount = badges.length - maxVisible;
  
  if (badges.length === 0) {
    return null;
  }
  
  return (
    <TooltipProvider>
      <div className="flex items-center gap-1 flex-wrap" data-testid="badge-display">
        {visibleBadges.map((badgeKey) => {
          const config = BADGE_CONFIG[badgeKey];
          if (!config) return null;
          
          const Icon = config.icon;
          
          return (
            <Tooltip key={badgeKey}>
              <TooltipTrigger asChild>
                <Badge 
                  variant="outline" 
                  className="gap-1"
                  data-testid={`badge-${badgeKey.toLowerCase().replace(' ', '-')}`}
                >
                  <Icon className={`${iconSizes[size]} ${config.color}`} />
                  {showLabels && <span>{config.label}</span>}
                </Badge>
              </TooltipTrigger>
              <TooltipContent>
                <p className="font-medium">{config.label}</p>
                <p className="text-xs text-muted-foreground">{config.description}</p>
              </TooltipContent>
            </Tooltip>
          );
        })}
        
        {remainingCount > 0 && (
          <Badge variant="outline" className="text-xs">
            +{remainingCount} more
          </Badge>
        )}
      </div>
    </TooltipProvider>
  );
}
