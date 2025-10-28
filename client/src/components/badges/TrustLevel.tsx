import { Progress } from '@/components/ui/progress';
import { ShieldCheck } from 'lucide-react';
import { getTrustLevelColor, getTrustLevelLabel } from '@/lib/badges';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip';

interface TrustLevelProps {
  level: number;
  variant?: 'badge' | 'progress' | 'full';
  showLabel?: boolean;
}

export function TrustLevel({ level = 0, variant = 'badge', showLabel = true }: TrustLevelProps) {
  const color = getTrustLevelColor(level);
  const label = getTrustLevelLabel(level);
  
  if (variant === 'badge') {
    return (
      <TooltipProvider>
        <Tooltip>
          <TooltipTrigger asChild>
            <div 
              className="flex items-center gap-1.5 text-sm"
              data-testid="trust-level-badge"
            >
              <ShieldCheck className={`h-4 w-4 ${color}`} />
              <span className={`font-medium ${color}`}>{level}</span>
              {showLabel && (
                <span className="text-muted-foreground text-xs">/ 100</span>
              )}
            </div>
          </TooltipTrigger>
          <TooltipContent>
            <p className="font-medium">{label}</p>
            <p className="text-xs">Trust Level: {level}/100</p>
          </TooltipContent>
        </Tooltip>
      </TooltipProvider>
    );
  }
  
  if (variant === 'progress') {
    return (
      <div className="space-y-1" data-testid="trust-level-progress">
        <div className="flex items-center justify-between text-sm">
          <span className="text-muted-foreground">Trust Level</span>
          <span className={`font-medium ${color}`}>{label}</span>
        </div>
        <Progress value={level} className="h-2" />
        <p className="text-xs text-muted-foreground text-right">{level}/100</p>
      </div>
    );
  }
  
  return (
    <div className="space-y-2" data-testid="trust-level-full">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <ShieldCheck className={`h-5 w-5 ${color}`} />
          <span className="font-medium">Trust Level</span>
        </div>
        <span className={`text-lg font-bold ${color}`}>{level}</span>
      </div>
      <Progress value={level} className="h-2" />
      <p className="text-sm text-muted-foreground">{label}</p>
    </div>
  );
}
