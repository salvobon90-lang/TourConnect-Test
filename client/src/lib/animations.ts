import { Variants } from 'framer-motion';

/**
 * Page transition variants
 * Used with AnimatePresence for route changes
 */
export const pageVariants: Variants = {
  initial: {
    opacity: 0,
    y: 20,
  },
  animate: {
    opacity: 1,
    y: 0,
    transition: {
      duration: 0.3,
      ease: 'easeOut',
    },
  },
  exit: {
    opacity: 0,
    y: -20,
    transition: {
      duration: 0.2,
      ease: 'easeIn',
    },
  },
};

/**
 * Card hover variants
 * 3D tilt effect with perspective
 */
export const cardVariants: Variants = {
  rest: {
    scale: 1,
    rotateX: 0,
    rotateY: 0,
  },
  hover: {
    scale: 1.03,
    rotateX: 3,
    rotateY: 3,
    transition: {
      duration: 0.2,
      ease: 'easeOut',
    },
  },
};

/**
 * Stagger children animations
 * For lists and grids
 */
export const staggerContainer: Variants = {
  hidden: { opacity: 0 },
  show: {
    opacity: 1,
    transition: {
      staggerChildren: 0.1,
    },
  },
};

export const staggerItem: Variants = {
  hidden: { opacity: 0, y: 20 },
  show: {
    opacity: 1,
    y: 0,
    transition: {
      duration: 0.4,
    },
  },
};

/**
 * Fade in on scroll
 * Use with IntersectionObserver
 */
export const fadeInUp: Variants = {
  hidden: {
    opacity: 0,
    y: 40,
  },
  visible: {
    opacity: 1,
    y: 0,
    transition: {
      duration: 0.6,
      ease: 'easeOut',
    },
  },
};

/**
 * Button press animation
 */
export const buttonVariants = {
  tap: { scale: 0.95 },
};

/**
 * Check if user prefers reduced motion
 */
export const prefersReducedMotion = (): boolean => {
  if (typeof window === 'undefined') return false;
  return window.matchMedia('(prefers-reduced-motion: reduce)').matches;
};

/**
 * Get animation duration based on reduced motion preference
 */
export const getAnimationDuration = (normalDuration: number): number => {
  return prefersReducedMotion() ? 0 : normalDuration;
};
