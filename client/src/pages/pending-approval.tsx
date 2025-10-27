import { useTranslation } from 'react-i18next';
import { useAuth } from "@/hooks/useAuth";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Clock, UserCheck, XCircle, Mail } from "lucide-react";

export default function PendingApproval() {
  const { t } = useTranslation();
  const { user } = useAuth();

  const handleLogout = () => {
    window.location.href = '/api/logout';
  };

  const isRejected = user?.approvalStatus === 'rejected';

  return (
    <div className="min-h-screen flex items-center justify-center bg-background p-4">
      <Card className="max-w-2xl w-full p-8">
        {isRejected ? (
          <div className="text-center">
            <XCircle className="w-20 h-20 mx-auto text-destructive mb-6" />
            <h1 className="text-3xl font-serif font-bold mb-4">{t('pendingApproval.rejected.title')}</h1>
            <p className="text-muted-foreground text-lg mb-6">
              {t('pendingApproval.rejected.message', { role: user.role })}
            </p>
            <div className="bg-muted/50 p-6 rounded-lg mb-6">
              <p className="text-sm">
                {t('pendingApproval.rejected.reapplyMessage')}
              </p>
            </div>
            <div className="flex gap-4 justify-center">
              <Button onClick={handleLogout} variant="outline" data-testid="button-logout">
                {t('pendingApproval.logout')}
              </Button>
              <Button variant="default" data-testid="button-contact-support">
                <Mail className="w-4 h-4 mr-2" />
                {t('pendingApproval.rejected.contactSupport')}
              </Button>
            </div>
          </div>
        ) : (
          <div className="text-center">
            <Clock className="w-20 h-20 mx-auto text-orange-500 mb-6" />
            <h1 className="text-3xl font-serif font-bold mb-4">{t('pendingApproval.pending.title')}</h1>
            <p className="text-muted-foreground text-lg mb-6">
              {t('pendingApproval.pending.message', { role: user?.role })}
            </p>
            
            <div className="bg-muted/50 p-6 rounded-lg mb-6 text-left">
              <h3 className="font-semibold mb-3 flex items-center gap-2">
                <UserCheck className="w-5 h-5 text-primary" />
                {t('pendingApproval.pending.whatNext')}
              </h3>
              <ul className="space-y-2 text-sm text-muted-foreground">
                <li className="flex gap-2">
                  <span className="text-primary">•</span>
                  <span>{t('pendingApproval.pending.step1')}</span>
                </li>
                <li className="flex gap-2">
                  <span className="text-primary">•</span>
                  <span>{t('pendingApproval.pending.step2')}</span>
                </li>
                <li className="flex gap-2">
                  <span className="text-primary">•</span>
                  <span>
                    {user?.role === 'guide' 
                      ? t('pendingApproval.pending.step3Guide')
                      : t('pendingApproval.pending.step3Provider')}
                  </span>
                </li>
              </ul>
            </div>

            <div className="bg-blue-50 dark:bg-blue-950 border border-blue-200 dark:border-blue-800 p-4 rounded-lg mb-6">
              <p className="text-sm text-blue-900 dark:text-blue-100">
                <strong>{t('pendingApproval.pending.accountInfo')}</strong>
              </p>
              <div className="text-sm text-blue-800 dark:text-blue-200 mt-2 space-y-1">
                <p>Name: {user?.firstName} {user?.lastName}</p>
                <p>Email: {user?.email}</p>
                <p>Role: {user?.role}</p>
                <p>Applied: {user?.createdAt ? new Date(user.createdAt).toLocaleDateString() : '-'}</p>
              </div>
            </div>

            <div className="flex gap-4 justify-center" data-testid="pending-approval-actions">
              <Button onClick={handleLogout} variant="outline" data-testid="button-logout">
                {t('pendingApproval.logout')}
              </Button>
              <Button 
                variant="default" 
                onClick={() => window.location.reload()}
                data-testid="button-check-status"
              >
                Check Status
              </Button>
            </div>
          </div>
        )}
      </Card>
    </div>
  );
}
