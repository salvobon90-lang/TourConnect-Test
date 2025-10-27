import type { UserStats } from './badges';

export function calculateTrustLevel(stats: UserStats): number {
  let trust = 0;
  
  // Base trust: Account age (max 20 points)
  trust += Math.min(stats.accountAgeMonths * 2, 20);
  
  // Reviews received (max 30 points)
  trust += Math.min(stats.reviewsReceived * 1.5, 30);
  
  // Average rating (max 25 points)
  if (stats.reviewsReceived >= 5) {
    trust += (stats.averageRating / 5) * 25;
  }
  
  // Activity level (max 15 points)
  trust += Math.min(stats.completedTours * 0.5, 15);
  
  // Reviews given (max 10 points)
  trust += Math.min(stats.reviewsGiven * 1, 10);
  
  // Premium bonus
  if (stats.isPremium) {
    trust += 5;
  }
  
  return Math.min(Math.round(trust), 100);
}
