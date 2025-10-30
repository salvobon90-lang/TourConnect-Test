import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';

export function usePartnership() {
  return useQuery({
    queryKey: ['partnership'],
    queryFn: async () => {
      const res = await fetch('/api/partnerships/my', { credentials: 'include' });
      if (!res.ok) {
        if (res.status === 401) return null;
        throw new Error('Failed to fetch partnership');
      }
      return res.json();
    },
  });
}

export function useUpgradeSubscription() {
  return useMutation({
    mutationFn: async (tier: 'standard' | 'premium' | 'pro') => {
      const res = await fetch('/api/subscription/upgrade', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ tier }),
        credentials: 'include',
      });
      if (!res.ok) {
        const error = await res.json();
        throw new Error(error.message || 'Failed to upgrade subscription');
      }
      return res.json();
    },
    onSuccess: (data) => {
      if (data.checkoutUrl) {
        window.location.href = data.checkoutUrl;
      }
    },
  });
}

export function useCancelSubscription() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async () => {
      const res = await fetch('/api/subscription/cancel', {
        method: 'POST',
        credentials: 'include',
      });
      if (!res.ok) throw new Error('Failed to cancel subscription');
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['partnership'] });
    },
  });
}

export function useAnalytics(userId: string) {
  return useQuery({
    queryKey: ['analytics', userId],
    queryFn: async () => {
      const res = await fetch(`/api/analytics/profile/${userId}`, { credentials: 'include' });
      if (!res.ok) {
        if (res.status === 403) return null;
        throw new Error('Failed to fetch analytics');
      }
      return res.json();
    },
  });
}
