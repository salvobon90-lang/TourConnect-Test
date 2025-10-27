import { useAuth } from "@/hooks/useAuth";
import { useQuery, useMutation } from "@tanstack/react-query";
import { useToast } from "@/hooks/use-toast";
import { queryClient, apiRequest } from "@/lib/queryClient";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { CheckCircle2, XCircle, Clock, Users, UserCheck, UserX, Shield, Map } from "lucide-react";
import type { User, TourWithGuide } from "@shared/schema";

export default function SupervisorDashboard() {
  const { user, isAuthenticated } = useAuth();
  const { toast } = useToast();

  const { data: pendingUsers, isLoading } = useQuery<User[]>({
    queryKey: ['/api/supervisor/pending-users'],
    enabled: isAuthenticated && user?.role === 'supervisor',
  });

  const { data: allUsers, isLoading: isLoadingAllUsers } = useQuery<User[]>({
    queryKey: ['/api/supervisor/users'],
    enabled: isAuthenticated && user?.role === 'supervisor',
  });

  const { data: pendingTours, isLoading: isLoadingTours } = useQuery<TourWithGuide[]>({
    queryKey: ['/api/supervisor/pending-tours'],
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

  const promoteToSupervisorMutation = useMutation({
    mutationFn: async (userId: string) => {
      return await apiRequest('POST', `/api/supervisor/promote-to-supervisor/${userId}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/supervisor/users'] });
      toast({
        title: "User Promoted",
        description: "The user has been promoted to supervisor",
      });
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error?.message || "Failed to promote user",
        variant: "destructive",
      });
    },
  });

  const approveTourMutation = useMutation({
    mutationFn: async (tourId: string) => {
      return await apiRequest('POST', `/api/supervisor/approve-tour/${tourId}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/supervisor/pending-tours'] });
      toast({
        title: "Tour Approved",
        description: "The tour has been approved successfully",
      });
    },
    onError: () => {
      toast({
        title: "Error",
        description: "Failed to approve tour",
        variant: "destructive",
      });
    },
  });

  const rejectTourMutation = useMutation({
    mutationFn: async (tourId: string) => {
      return await apiRequest('POST', `/api/supervisor/reject-tour/${tourId}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/supervisor/pending-tours'] });
      toast({
        title: "Tour Rejected",
        description: "The tour has been rejected",
      });
    },
    onError: () => {
      toast({
        title: "Error",
        description: "Failed to reject tour",
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

        {/* Management Tabs */}
        <Tabs defaultValue="pending" className="space-y-6">
          <TabsList className="grid w-full max-w-3xl grid-cols-3">
            <TabsTrigger value="pending" data-testid="tab-pending">
              <Clock className="w-4 h-4 mr-2" />
              Pending Approvals
            </TabsTrigger>
            <TabsTrigger value="users" data-testid="tab-users">
              <Users className="w-4 h-4 mr-2" />
              User Management
            </TabsTrigger>
            <TabsTrigger value="tours" data-testid="tab-tours">
              <Map className="w-4 h-4 mr-2" />
              Tour Moderation
            </TabsTrigger>
          </TabsList>

          <TabsContent value="pending">
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
          </TabsContent>

          <TabsContent value="users">
            <Card className="p-6">
              <h2 className="text-2xl font-semibold mb-6">User Management</h2>

              {isLoadingAllUsers ? (
                <div className="text-center py-12">
                  <div className="animate-spin w-12 h-12 border-4 border-primary border-t-transparent rounded-full mx-auto" />
                  <p className="text-muted-foreground mt-4">Loading users...</p>
                </div>
              ) : allUsers && allUsers.length > 0 ? (
                <div className="space-y-4">
                  {allUsers.map((u) => (
                    <Card key={u.id} className="p-4">
                      <div className="flex items-center justify-between gap-4">
                        <div className="flex items-center gap-4 flex-1">
                          <Avatar className="w-12 h-12">
                            <AvatarFallback>
                              {u.firstName?.[0]}{u.lastName?.[0]}
                            </AvatarFallback>
                          </Avatar>

                          <div className="flex-1">
                            <h3 className="font-semibold" data-testid={`text-user-name-${u.id}`}>
                              {u.firstName} {u.lastName}
                            </h3>
                            <p className="text-sm text-muted-foreground">{u.email}</p>
                            <div className="flex items-center gap-2 mt-1">
                              <Badge 
                                variant={u.role === 'supervisor' ? 'default' : 'secondary'}
                                data-testid={`badge-role-${u.id}`}
                              >
                                {u.role || 'No Role'}
                              </Badge>
                              {u.approvalStatus && (
                                <Badge 
                                  variant="outline" 
                                  className={
                                    u.approvalStatus === 'approved' 
                                      ? 'bg-green-100 text-green-800 border-green-300'
                                      : u.approvalStatus === 'pending'
                                      ? 'bg-orange-100 text-orange-800 border-orange-300'
                                      : 'bg-red-100 text-red-800 border-red-300'
                                  }
                                >
                                  {u.approvalStatus}
                                </Badge>
                              )}
                            </div>
                            <p className="text-xs text-muted-foreground mt-1">
                              Registered: {new Date(u.createdAt).toLocaleDateString()}
                            </p>
                          </div>
                        </div>

                        <div className="flex gap-2">
                          {u.role !== 'supervisor' && u.role !== null && (
                            <Button
                              onClick={() => promoteToSupervisorMutation.mutate(u.id)}
                              disabled={promoteToSupervisorMutation.isPending}
                              variant="outline"
                              data-testid={`button-promote-${u.id}`}
                            >
                              <Shield className="w-4 h-4 mr-2" />
                              Promote to Supervisor
                            </Button>
                          )}
                          {u.role === 'supervisor' && (
                            <Badge variant="default" className="px-4 py-2">
                              <Shield className="w-4 h-4 mr-2" />
                              Supervisor
                            </Badge>
                          )}
                        </div>
                      </div>
                    </Card>
                  ))}
                </div>
              ) : (
                <div className="text-center py-12">
                  <Users className="w-16 h-16 mx-auto text-muted-foreground/50 mb-4" />
                  <h3 className="text-lg font-semibold mb-2">No Users Found</h3>
                  <p className="text-muted-foreground">No users in the system</p>
                </div>
              )}
            </Card>
          </TabsContent>

          <TabsContent value="tours">
            <Card className="p-6">
              <h2 className="text-2xl font-semibold mb-6">Tour Moderation</h2>

              {isLoadingTours ? (
                <div className="text-center py-12">
                  <div className="animate-spin w-12 h-12 border-4 border-primary border-t-transparent rounded-full mx-auto" />
                  <p className="text-muted-foreground mt-4">Loading pending tours...</p>
                </div>
              ) : pendingTours && pendingTours.length > 0 ? (
                <div className="space-y-4">
                  {pendingTours.map((tour) => (
                    <Card key={tour.id} className="p-4">
                      <div className="flex items-start justify-between gap-4">
                        <div className="flex-1">
                          <h3 className="font-semibold text-lg" data-testid={`text-tour-title-${tour.id}`}>
                            {tour.title}
                          </h3>
                          <p className="text-sm text-muted-foreground mt-1">
                            by {tour.guide?.firstName} {tour.guide?.lastName}
                          </p>
                          <div className="flex flex-wrap items-center gap-2 mt-2">
                            <Badge variant="secondary" data-testid={`badge-category-${tour.id}`}>
                              {tour.category}
                            </Badge>
                            <Badge variant="outline" className="bg-orange-100 text-orange-800 border-orange-300">
                              <Clock className="w-3 h-3 mr-1" />
                              Pending
                            </Badge>
                            <span className="text-sm text-muted-foreground">
                              ${tour.price}
                            </span>
                            <span className="text-sm text-muted-foreground">•</span>
                            <span className="text-sm text-muted-foreground">
                              {tour.duration} min
                            </span>
                          </div>
                          <p className="text-xs text-muted-foreground mt-2">
                            Created: {new Date(tour.createdAt).toLocaleDateString()}
                          </p>
                        </div>

                        <div className="flex gap-2">
                          <Button
                            onClick={() => approveTourMutation.mutate(tour.id)}
                            disabled={approveTourMutation.isPending || rejectTourMutation.isPending}
                            variant="default"
                            data-testid={`button-approve-tour-${tour.id}`}
                          >
                            <CheckCircle2 className="w-4 h-4 mr-2" />
                            Approve
                          </Button>
                          <Button
                            onClick={() => rejectTourMutation.mutate(tour.id)}
                            disabled={approveTourMutation.isPending || rejectTourMutation.isPending}
                            variant="destructive"
                            data-testid={`button-reject-tour-${tour.id}`}
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
                  <Map className="w-16 h-16 mx-auto text-muted-foreground/50 mb-4" />
                  <h3 className="text-lg font-semibold mb-2">No Pending Tours</h3>
                  <p className="text-muted-foreground">All tours have been reviewed</p>
                </div>
              )}
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}
