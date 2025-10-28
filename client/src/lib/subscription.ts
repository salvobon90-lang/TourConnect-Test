export function isPremium(tier?: string | null): boolean {
  return tier === 'tourist-premium' || tier === 'guide-pro';
}

export function isGuidePro(tier?: string | null): boolean {
  return tier === 'guide-pro';
}

export function canAccessFeature(userTier: string, requiredTier: string): boolean {
  const tierLevels = {
    'free': 0,
    'tourist-premium': 1,
    'guide-pro': 2
  };
  
  return (tierLevels[userTier as keyof typeof tierLevels] || 0) >= 
         (tierLevels[requiredTier as keyof typeof tierLevels] || 0);
}
