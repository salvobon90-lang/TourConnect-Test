import { useAuth } from "@/hooks/useAuth";
import { useQuery, useMutation } from "@tanstack/react-query";
import { useToast } from "@/hooks/use-toast";
import { queryClient, apiRequest } from "@/lib/queryClient";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { CheckCircle2, XCircle, Clock, Users, UserCheck, UserX } from "lucide-react";
import type { User } from "@shared/schema";

export default function SupervisorDashboard() {
  const { user, isAuthenticated } = useAuth();
  const { toast } = useToast();

  const { data: pendingUsers, isLoading } = useQuery<User[]>({
    queryKey: ['/api/supervisor/pending-users'],
    enabled: isAuthenticated && user?.role === 'supervisor',
  });

  const approveMutation = useMutation({
    mutationFn: async (userId: string) => {
      return await apiRequest('POST', `/api/supervisor/approve-user/${userId}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/supervisor/pending-users'] });
      toast({
        title: "User Approved",
        description: "The user has been approved successfully",
      });
    },
    onError: () => {
      toast({
        title: "Error",
        description: "Failed to approve user",
        variant: "destructive",
      });
    },
  });

  const rejectMutation = useMutation({
    mutationFn: async (userId: string) => {
      return await apiRequest('POST', `/api/supervisor/reject-user/${userId}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/supervisor/pending-users'] });
      toast({
        title: "User Rejected",
        description: "The user has been rejected",
      });
    },
    onError: () => {
      toast({
        title: "Error",
        description: "Failed to reject user",
        variant: "destructive",
      });
    },
  });

  if (user?.role !== 'supervisor') {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <Card className="p-8 text-center">
          <XCircle className="w-16 h-16 mx-auto text-destructive mb-4" />
          <h2 className="text-2xl font-semibold mb-2">Access Denied</h2>
          <p className="text-muted-foreground">Only supervisors can access this page.</p>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <div className="bg-gradient-to-r from-primary/90 to-primary text-primary-foreground py-12 px-4">
        <div className="max-w-7xl mx-auto">
          <h1 className="text-4xl font-serif font-bold mb-2">Supervisor Dashboard</h1>
          <p className="text-primary-foreground/90">Manage user approvals and platform access</p>
        </div>
      </div>

      <div className="max-w-7xl mx-auto py-8 px-4">
        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          <Card className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground mb-1">Pending Approval</p>
                <p className="text-3xl font-bold">{pendingUsers?.length || 0}</p>
              </div>
              <Clock className="w-12 h-12 text-orange-500" />
            </div>
          </Card>

          <Card className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground mb-1">Total Users</p>
                <p className="text-3xl font-bold">-</p>
              </div>
              <Users className="w-12 h-12 text-blue-500" />
            </div>
          </Card>

          <Card className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground mb-1">Approved Today</p>
                <p className="text-3xl font-bold">-</p>
              </div>
              <UserCheck className="w-12 h-12 text-green-500" />
            </div>
          </Card>
        </div>

        {/* Pending Users Table */}
        <Card className="p-6">
          <h2 className="text-2xl font-semibold mb-6">Pending Approvals</h2>

          {isLoading ? (
            <div className="text-center py-12">
              <div className="animate-spin w-12 h-12 border-4 border-primary border-t-transparent rounded-full mx-auto" />
              <p className="text-muted-foreground mt-4">Loading pending users...</p>
            </div>
          ) : pendingUsers && pendingUsers.length > 0 ? (
            <div className="space-y-4">
              {pendingUsers.map((pendingUser) => (
                <Card key={pendingUser.id} className="p-4">
                  <div className="flex items-center justify-between gap-4">
                    <div className="flex items-center gap-4 flex-1">
                      <Avatar className="w-12 h-12">
                        <AvatarFallback>
                          {pendingUser.firstName?.[0]}{pendingUser.lastName?.[0]}
                        </AvatarFallback>
                      </Avatar>

                      <div className="flex-1">
                        <h3 className="font-semibold" data-testid={`text-user-name-${pendingUser.id}`}>
                          {pendingUser.firstName} {pendingUser.lastName}
                        </h3>
                        <p className="text-sm text-muted-foreground">{pendingUser.email}</p>
                        <div className="flex items-center gap-2 mt-1">
                          <Badge variant="secondary" data-testid={`badge-role-${pendingUser.id}`}>
                            {pendingUser.role}
                          </Badge>
                          <Badge variant="outline" className="bg-orange-100 text-orange-800 border-orange-300">
                            <Clock className="w-3 h-3 mr-1" />
                            Pending
                          </Badge>
                        </div>
                        <p className="text-xs text-muted-foreground mt-1">
                          Registered: {new Date(pendingUser.createdAt).toLocaleDateString()}
                        </p>
                      </div>
                    </div>

                    <div className="flex gap-2">
                      <Button
                        onClick={() => approveMutation.mutate(pendingUser.id)}
                        disabled={approveMutation.isPending || rejectMutation.isPending}
                        variant="default"
                        data-testid={`button-approve-${pendingUser.id}`}
                      >
                        <CheckCircle2 className="w-4 h-4 mr-2" />
                        Approve
                      </Button>
                      <Button
                        onClick={() => rejectMutation.mutate(pendingUser.id)}
                        disabled={approveMutation.isPending || rejectMutation.isPending}
                        variant="destructive"
                        data-testid={`button-reject-${pendingUser.id}`}
                      >
                        <XCircle className="w-4 h-4 mr-2" />
                        Reject
                      </Button>
                    </div>
                  </div>
                </Card>
              ))}
            </div>
          ) : (
            <div className="text-center py-12">
              <UserCheck className="w-16 h-16 mx-auto text-muted-foreground/50 mb-4" />
              <h3 className="text-lg font-semibold mb-2">No Pending Approvals</h3>
              <p className="text-muted-foreground">All users have been reviewed</p>
            </div>
          )}
        </Card>
      </div>
    </div>
  );
}
