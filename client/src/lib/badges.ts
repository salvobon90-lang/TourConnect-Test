import { 
  Compass, 
  MessageSquare, 
  Award, 
  Briefcase, 
  Star, 
  ShieldCheck, 
  Crown, 
  Trophy 
} from 'lucide-react';
import type { LucideIcon } from 'lucide-react';

export const BADGE_CONFIG: Record<string, {
  label: string;
  description: string;
  icon: LucideIcon;
  color: string;
}> = {
  'Explorer': {
    label: 'Explorer',
    description: 'Completed 100+ tours',
    icon: Compass,
    color: 'text-blue-500'
  },
  'Ambassador': {
    label: 'Ambassador',
    description: 'Written 10+ reviews',
    icon: MessageSquare,
    color: 'text-green-500'
  },
  'Travel Expert': {
    label: 'Travel Expert',
    description: '50+ tours with 4.5+ rating',
    icon: Award,
    color: 'text-purple-500'
  },
  'Guide Pro': {
    label: 'Guide Pro',
    description: 'Created 50+ tours',
    icon: Briefcase,
    color: 'text-indigo-500'
  },
  'Top Rated': {
    label: 'Top Rated',
    description: 'Average rating 4.8+',
    icon: Star,
    color: 'text-yellow-500'
  },
  'Verified Guide': {
    label: 'Verified Guide',
    description: 'Verified professional guide',
    icon: ShieldCheck,
    color: 'text-primary'
  },
  'Premium Partner': {
    label: 'Premium Partner',
    description: 'Premium subscription active',
    icon: Crown,
    color: 'text-primary'
  },
  'Super Host': {
    label: 'Super Host',
    description: '100+ tours with 4.9+ rating',
    icon: Trophy,
    color: 'text-primary'
  }
};

export function getTrustLevelColor(level: number): string {
  if (level >= 80) return 'text-green-600';
  if (level >= 60) return 'text-blue-600';
  if (level >= 40) return 'text-yellow-600';
  return 'text-muted-foreground';
}

export function getTrustLevelLabel(level: number): string {
  if (level >= 80) return 'Highly Trusted';
  if (level >= 60) return 'Trusted';
  if (level >= 40) return 'Verified';
  return 'New';
}
