import { motion } from 'framer-motion';
import { Progress } from '@/components/ui/progress';
import { Badge } from '@/components/ui/badge';
import { Users, TrendingDown, Zap } from 'lucide-react';

interface EnhancedGroupProgressProps {
  currentParticipants: number;
  maxParticipants: number;
  minParticipants: number;
  currentPrice: number;
  basePrice: number;
  discountPercentage: number;
}

export function EnhancedGroupProgress({
  currentParticipants,
  maxParticipants,
  minParticipants,
  currentPrice,
  basePrice,
  discountPercentage,
}: EnhancedGroupProgressProps) {
  const progress = (currentParticipants / maxParticipants) * 100;
  const spotsNeeded = Math.max(0, minParticipants - currentParticipants);

  return (
    <div className="space-y-4">
      {/* Price Display with Animation */}
      <div className="flex items-center justify-between">
        <div>
          <motion.div
            key={currentPrice}
            initial={{ scale: 1.2, color: '#FF6600' }}
            animate={{ scale: 1, color: '#000' }}
            transition={{ duration: 0.3 }}
            className="text-3xl font-bold"
          >
            €{currentPrice.toFixed(0)}
          </motion.div>
          {basePrice > currentPrice && (
            <div className="text-sm text-muted-foreground line-through">
              €{basePrice.toFixed(0)}
            </div>
          )}
        </div>

        {discountPercentage > 0 && (
          <Badge className="bg-orange-600 text-white animate-pulse">
            <TrendingDown className="w-3 h-3 mr-1" />
            {discountPercentage}% OFF
          </Badge>
        )}
      </div>

      {/* Animated Progress Bar */}
      <div className="space-y-2">
        <div className="flex items-center justify-between text-sm">
          <div className="flex items-center gap-2">
            <Users className="w-4 h-4" />
            <span className="font-medium">
              {currentParticipants} / {maxParticipants} joined
            </span>
          </div>
          <span className="text-muted-foreground">{Math.round(progress)}%</span>
        </div>

        <div className="relative">
          <Progress value={progress} className="h-3 bg-muted" />
          <motion.div
            className="absolute top-0 left-0 h-3 rounded-full bg-gradient-to-r from-orange-400 to-orange-600"
            initial={{ width: 0 }}
            animate={{ width: `${progress}%` }}
            transition={{ duration: 0.6, ease: 'easeOut' }}
          />
          
          {/* Minimum threshold marker */}
          <div 
            className="absolute top-0 h-3 w-0.5 bg-green-500"
            style={{ left: `${(minParticipants / maxParticipants) * 100}%` }}
          />
        </div>

        {spotsNeeded > 0 ? (
          <div className="flex items-center gap-2 text-sm text-orange-600 font-medium">
            <Zap className="w-4 h-4 animate-pulse" />
            Only {spotsNeeded} more needed to confirm!
          </div>
        ) : (
          <div className="text-sm text-green-600 font-medium">
            ✓ Minimum reached - Group confirmed!
          </div>
        )}
      </div>
    </div>
  );
}
