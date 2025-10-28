import { motion } from 'framer-motion';
import { Card } from '@/components/ui/card';
import { cardVariants, prefersReducedMotion } from '@/lib/animations';
import { ComponentProps, forwardRef } from 'react';

interface AnimatedCardProps extends ComponentProps<typeof Card> {
  enableTilt?: boolean;
}

export const AnimatedCard = forwardRef<HTMLDivElement, AnimatedCardProps>(
  ({ children, enableTilt = true, className, ...props }, ref) => {
    const shouldAnimate = !prefersReducedMotion() && enableTilt;
    
    if (!shouldAnimate) {
      return (
        <Card ref={ref} className={className} {...props}>
          {children}
        </Card>
      );
    }
    
    return (
      <motion.div
        initial="rest"
        whileHover="hover"
        variants={cardVariants}
        style={{ perspective: 1000 }}
      >
        <Card ref={ref} className={className} {...props}>
          {children}
        </Card>
      </motion.div>
    );
  }
);

AnimatedCard.displayName = 'AnimatedCard';
