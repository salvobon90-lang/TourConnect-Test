export const SUBSCRIPTION_TIERS = {
  FREE: {
    id: 'free',
    name: 'Free',
    price: 0,
    interval: null,
    features: [
      'Browse tours',
      'Book tours',
      'Leave reviews',
      'Basic messaging'
    ]
  },
  TOURIST_PREMIUM: {
    id: 'tourist-premium',
    name: 'Tourist Premium',
    price: 9.99,
    interval: 'month',
    stripePriceId: 'price_tourist_premium',
    features: [
      'All Free features',
      'Priority booking',
      'Exclusive tours access',
      'AI Travel Assistant',
      'Advanced filters',
      'No booking fees'
    ]
  },
  GUIDE_PRO: {
    id: 'guide-pro',
    name: 'Guide Pro',
    price: 19.99,
    interval: 'month',
    stripePriceId: 'price_guide_pro',
    features: [
      'All Free features',
      'Unlimited tour listings',
      'Featured placement',
      'Advanced analytics',
      'Priority support',
      'Lower commission (10% vs 20%)'
    ]
  }
} as const;

export type SubscriptionTier = 'free' | 'tourist-premium' | 'guide-pro';
