export interface UserStats {
  completedTours: number;
  toursCompleted: number;
  reviewsGiven: number;
  reviewsReceived: number;
  averageRating: number;
  isPremium: boolean;
  accountAgeMonths: number;
}

export interface Badge {
  id: string;
  name: string;
  description: string;
  criteria: (stats: UserStats) => boolean;
  icon: string;
}

export const BADGES = {
  EXPLORER: {
    id: 'explorer',
    name: 'Explorer',
    description: 'Completed 5 tours',
    criteria: (stats: UserStats) => stats.completedTours >= 5,
    icon: '🧭'
  },
  AMBASSADOR: {
    id: 'ambassador',
    name: 'Ambassador',
    description: 'Left 10 helpful reviews',
    criteria: (stats: UserStats) => stats.reviewsGiven >= 10,
    icon: '🌟'
  },
  TRAVEL_EXPERT: {
    id: 'travel-expert',
    name: 'Travel Expert',
    description: 'Completed 20 tours',
    criteria: (stats: UserStats) => stats.completedTours >= 20,
    icon: '✈️'
  },
  GUIDE_PRO: {
    id: 'guide-pro',
    name: 'Guide Pro',
    description: 'Average rating 4.5+ with 10+ reviews',
    criteria: (stats: UserStats) => 
      stats.averageRating >= 4.5 && stats.reviewsReceived >= 10,
    icon: '⭐'
  },
  TOP_RATED: {
    id: 'top-rated',
    name: 'Top Rated',
    description: 'Average rating 4.8+ with 50+ reviews',
    criteria: (stats: UserStats) => 
      stats.averageRating >= 4.8 && stats.reviewsReceived >= 50,
    icon: '🏆'
  },
  VERIFIED_GUIDE: {
    id: 'verified-guide',
    name: 'Verified Guide',
    description: 'Completed 100 tours',
    criteria: (stats: UserStats) => stats.toursCompleted >= 100,
    icon: '✓'
  },
  PREMIUM_PARTNER: {
    id: 'premium-partner',
    name: 'Premium Partner',
    description: 'Premium subscription active',
    criteria: (stats: UserStats) => stats.isPremium,
    icon: '💎'
  },
  SUPER_HOST: {
    id: 'super-host',
    name: 'Super Host',
    description: 'Average rating 4.7+ with 30+ reviews',
    criteria: (stats: UserStats) => 
      stats.averageRating >= 4.7 && stats.reviewsReceived >= 30,
    icon: '🌟'
  }
} as const;
