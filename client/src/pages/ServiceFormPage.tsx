import { useMutation } from '@tanstack/react-query';
import { useLocation } from 'wouter';
import { ServiceForm } from '@/components/ServiceForm';
import { useTranslation } from 'react-i18next';
import { useToast } from '@/hooks/use-toast';
import { Header } from '@/components/layout/Header';

export default function ServiceFormPage() {
  const { t } = useTranslation();
  const { toast } = useToast();
  const [, setLocation] = useLocation();
  
  const createMutation = useMutation({
    mutationFn: async (data: any) => {
      const res = await fetch('/api/services/create', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      });
      if (!res.ok) throw new Error('Failed to create');
      return res.json();
    },
    onSuccess: () => {
      toast({
        title: t('serviceForm.success'),
        description: t('serviceForm.serviceCreated'),
      });
      setLocation('/provider-dashboard');
    },
    onError: () => {
      toast({
        title: t('common.error'),
        description: t('serviceForm.createFailed'),
        variant: 'destructive',
      });
    },
  });
  
  return (
    <div className="min-h-screen bg-background">
      <Header />
      
      <div className="container mx-auto px-4 py-8 max-w-3xl">
        <h1 className="text-3xl font-bold mb-6">{t('serviceForm.createTitle')}</h1>
        <ServiceForm onSubmit={(data) => createMutation.mutate(data)} />
      </div>
    </div>
  );
}
