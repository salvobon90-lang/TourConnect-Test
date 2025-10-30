import { useState } from 'react';
import { useQuery, useMutation } from '@tanstack/react-query';
import { useTranslation } from 'react-i18next';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { CheckCircle, XCircle } from 'lucide-react';
import { Header } from '@/components/layout/Header';
import { useToast } from '@/hooks/use-toast';

export default function AdminServicesPanel() {
  const { t } = useTranslation();
  const { toast } = useToast();
  const [filter, setFilter] = useState('pending');
  
  const { data: services, refetch } = useQuery({
    queryKey: ['/api/admin/services', filter],
    queryFn: async () => {
      const res = await fetch(`/api/admin/services?status=${filter}`);
      if (!res.ok) throw new Error('Failed to fetch');
      return res.json();
    },
  });
  
  const moderateMutation = useMutation({
    mutationFn: async ({ id, status, notes }: any) => {
      const res = await fetch(`/api/admin/services/${id}/moderate`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status, notes }),
      });
      if (!res.ok) throw new Error('Failed to moderate');
      return res.json();
    },
    onSuccess: () => {
      refetch();
      toast({
        title: t('admin.success'),
        description: t('admin.serviceModerated'),
      });
    },
    onError: () => {
      toast({
        title: t('common.error'),
        description: t('admin.moderationFailed'),
        variant: 'destructive',
      });
    },
  });
  
  return (
    <div className="min-h-screen bg-background">
      <Header />
      
      <div className="container mx-auto px-4 py-8">
        <h1 className="text-3xl font-bold mb-6">{t('admin.servicesModeration')}</h1>
        
        <div className="mb-6">
          <Select value={filter} onValueChange={setFilter}>
            <SelectTrigger className="w-48">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="pending">{t('admin.pending')}</SelectItem>
              <SelectItem value="approved">{t('admin.approved')}</SelectItem>
              <SelectItem value="rejected">{t('admin.rejected')}</SelectItem>
            </SelectContent>
          </Select>
        </div>
        
        <div className="grid gap-6">
          {services?.length === 0 ? (
            <Card className="p-12 text-center">
              <p className="text-muted-foreground">{t('admin.noServices')}</p>
            </Card>
          ) : (
            services?.map((service: any) => (
              <Card key={service.id} className="p-6">
                <div className="flex gap-6">
                  <img 
                    src={service.images?.[0] || 'https://via.placeholder.com/200'}
                    alt={service.title || service.name}
                    className="w-48 h-48 rounded object-cover"
                  />
                  
                  <div className="flex-1 space-y-4">
                    <div>
                      <h2 className="text-2xl font-bold">{service.title || service.name}</h2>
                      <p className="text-muted-foreground">
                        {service.provider?.firstName} {service.provider?.lastName}
                      </p>
                      {service.category && (
                        <Badge className="mt-2">{service.category.name}</Badge>
                      )}
                    </div>
                    
                    <p className="text-sm">{service.description}</p>
                    
                    <div className="grid grid-cols-3 gap-4 text-sm">
                      <div>
                        <span className="font-medium">{t('admin.price')}:</span> ${service.price || service.priceRange}
                      </div>
                      {service.duration && (
                        <div>
                          <span className="font-medium">{t('admin.duration')}:</span> {service.duration} min
                        </div>
                      )}
                      <div>
                        <span className="font-medium">{t('admin.location')}:</span> {service.location}
                      </div>
                    </div>
                    
                    {service.moderationStatus === 'pending' && (
                      <div className="flex gap-2">
                        <Button 
                          onClick={() => moderateMutation.mutate({ id: service.id, status: 'approved' })}
                          className="bg-green-600 hover:bg-green-700"
                        >
                          <CheckCircle className="mr-2 w-4 h-4" />
                          {t('admin.approve')}
                        </Button>
                        <Button 
                          onClick={() => moderateMutation.mutate({ id: service.id, status: 'rejected', notes: 'Inappropriate content' })}
                          variant="destructive"
                        >
                          <XCircle className="mr-2 w-4 h-4" />
                          {t('admin.reject')}
                        </Button>
                      </div>
                    )}
                    
                    {service.moderationStatus !== 'pending' && (
                      <Badge variant={service.moderationStatus === 'approved' ? 'default' : 'destructive'}>
                        {service.moderationStatus === 'approved' ? t('admin.approved') : t('admin.rejected')}
                      </Badge>
                    )}
                  </div>
                </div>
              </Card>
            ))
          )}
        </div>
      </div>
    </div>
  );
}
