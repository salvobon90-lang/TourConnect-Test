import { useAuth } from "@/hooks/useAuth";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Clock, UserCheck, XCircle, Mail } from "lucide-react";

export default function PendingApproval() {
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
            <h1 className="text-3xl font-serif font-bold mb-4">Application Rejected</h1>
            <p className="text-muted-foreground text-lg mb-6">
              Unfortunately, your application to join as a {user.role} has been rejected by our team.
            </p>
            <div className="bg-muted/50 p-6 rounded-lg mb-6">
              <p className="text-sm">
                If you believe this was a mistake or would like to reapply, please contact our support team.
              </p>
            </div>
            <div className="flex gap-4 justify-center">
              <Button onClick={handleLogout} variant="outline" data-testid="button-logout">
                Logout
              </Button>
              <Button variant="default" data-testid="button-contact-support">
                <Mail className="w-4 h-4 mr-2" />
                Contact Support
              </Button>
            </div>
          </div>
        ) : (
          <div className="text-center">
            <Clock className="w-20 h-20 mx-auto text-orange-500 mb-6" />
            <h1 className="text-3xl font-serif font-bold mb-4">Pending Approval</h1>
            <p className="text-muted-foreground text-lg mb-6">
              Your application as a <span className="font-semibold text-foreground">{user?.role}</span> is currently under review.
            </p>
            
            <div className="bg-muted/50 p-6 rounded-lg mb-6 text-left">
              <h3 className="font-semibold mb-3 flex items-center gap-2">
                <UserCheck className="w-5 h-5 text-primary" />
                What happens next?
              </h3>
              <ul className="space-y-2 text-sm text-muted-foreground">
                <li className="flex gap-2">
                  <span className="text-primary">•</span>
                  <span>A supervisor will review your application within 24-48 hours</span>
                </li>
                <li className="flex gap-2">
                  <span className="text-primary">•</span>
                  <span>You'll receive an email notification once your account is reviewed</span>
                </li>
                <li className="flex gap-2">
                  <span className="text-primary">•</span>
                  <span>
                    {user?.role === 'guide' 
                      ? 'Once approved, you can create tours and start sharing your expertise'
                      : 'Once approved, you can add services and connect with tourists'}
                  </span>
                </li>
              </ul>
            </div>

            <div className="bg-blue-50 dark:bg-blue-950 border border-blue-200 dark:border-blue-800 p-4 rounded-lg mb-6">
              <p className="text-sm text-blue-900 dark:text-blue-100">
                <strong>Your account information:</strong>
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
                Logout
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
