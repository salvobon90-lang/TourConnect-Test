import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { queryClient } from '@/lib/queryClient';

export function useMeetingSuggestion(groupId: string) {
  return useMutation({
    mutationFn: async (language?: string) => {
      const res = await fetch(`/api/ai/group/${groupId}/suggest-meeting`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ language: language || 'en' }),
        credentials: 'include'
      });
      if (!res.ok) throw new Error(await res.text());
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['smartGroup', groupId] });
    }
  });
}

export function useMessageTranslation(groupId: string) {
  return useMutation({
    mutationFn: async ({ text, targetLanguage }: { text: string; targetLanguage: string }) => {
      const res = await fetch(`/api/ai/group/${groupId}/translate`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ text, targetLanguage }),
        credentials: 'include'
      });
      if (!res.ok) throw new Error(await res.text());
      return res.json();
    }
  });
}

export function useTourSummary(groupId: string) {
  return useMutation({
    mutationFn: async (language?: string) => {
      const res = await fetch(`/api/ai/group/${groupId}/summary`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ language: language || 'en' }),
        credentials: 'include'
      });
      if (!res.ok) throw new Error(await res.text());
      return res.json();
    }
  });
}

export function useScheduleEvent(groupId: string) {
  return useMutation({
    mutationFn: async (eventData: {
      eventType: string;
      title: string;
      description?: string;
      eventDate: string;
      location?: string;
      latitude?: number;
      longitude?: number;
      language?: string;
    }) => {
      const res = await fetch(`/api/ai/group/${groupId}/schedule`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(eventData),
        credentials: 'include'
      });
      if (!res.ok) throw new Error(await res.text());
      return res.json();
    }
  });
}

export function useGroupEvents(groupId: string) {
  return useQuery({
    queryKey: ['groupEvents', groupId],
    queryFn: async () => {
      const res = await fetch(`/api/smart-groups/${groupId}/events`, {
        credentials: 'include'
      });
      if (!res.ok) throw new Error(await res.text());
      return res.json();
    }
  });
}

export function useAIConsent() {
  return useQuery({
    queryKey: ['aiConsent'],
    queryFn: async () => {
      const res = await fetch('/api/ai/consent', { credentials: 'include' });
      if (!res.ok) throw new Error('Failed to fetch consent');
      return res.json();
    }
  });
}

export function useUpdateAIConsent() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (consent: boolean) => {
      const res = await fetch('/api/ai/consent', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ consent }),
        credentials: 'include'
      });
      if (!res.ok) throw new Error('Failed to update consent');
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['aiConsent'] });
      queryClient.invalidateQueries({ queryKey: ['user'] });
    }
  });
}
