import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { apiRequest } from '@/lib/queryClient';
import { Compass, Map, Store } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import type { UserRole } from '@shared/schema';

const roles = [
  {
    value: 'tourist' as UserRole,
    icon: Compass,
    titleKey: 'roles.tourist',
    descriptionKey: 'roles.touristDesc',
  },
  {
    value: 'guide' as UserRole,
    icon: Map,
    titleKey: 'roles.guide',
    descriptionKey: 'roles.guideDesc',
  },
  {
    value: 'provider' as UserRole,
    icon: Store,
    titleKey: 'roles.provider',
    descriptionKey: 'roles.providerDesc',
  },
];

export default function RoleSelection() {
  const { t } = useTranslation();
  const [selectedRole, setSelectedRole] = useState<UserRole | null>(null);
  const queryClient = useQueryClient();
  const { toast } = useToast();

  const mutation = useMutation({
    mutationFn: async (role: UserRole) => {
      const response = await apiRequest('POST', '/api/auth/set-role', { role });
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/auth/user'] });
    },
    onError: () => {
      toast({
        title: t('common.error'),
        description: t('roleSelection.roleSetError'),
        variant: 'destructive',
      });
    },
  });

  const handleRoleSelect = (role: UserRole) => {
    setSelectedRole(role);
    mutation.mutate(role);
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-primary/10 via-background to-secondary/10 p-4">
      <div className="w-full max-w-5xl">
        <div className="text-center mb-12">
          <h1 className="text-4xl md:text-5xl font-serif font-semibold text-foreground mb-3">
            {t('roleSelection.title')}
          </h1>
          <p className="text-lg text-muted-foreground">
            {t('roleSelection.subtitle')}
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {roles.map((role) => {
            const Icon = role.icon;
            return (
              <Card
                key={role.value}
                className={`p-8 cursor-pointer transition-all hover-elevate active-elevate-2 ${
                  selectedRole === role.value ? 'border-primary border-2' : ''
                } ${mutation.isPending ? 'opacity-50 pointer-events-none' : ''}`}
                onClick={() => handleRoleSelect(role.value)}
                data-testid={`role-${role.value}`}
              >
                <div className="flex flex-col items-center text-center">
                  <div className="w-20 h-20 rounded-full bg-primary/10 flex items-center justify-center mb-6">
                    <Icon className="w-10 h-10 text-primary" />
                  </div>
                  <h3 className="text-2xl font-semibold text-foreground mb-3">
                    {t(role.titleKey)}
                  </h3>
                  <p className="text-muted-foreground">
                    {t(role.descriptionKey)}
                  </p>
                </div>
              </Card>
            );
          })}
        </div>
      </div>
    </div>
  );
}
