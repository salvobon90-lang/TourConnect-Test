import { useQuery } from '@tanstack/react-query';
import { useLocation } from 'wouter';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import {
  Bell,
  MessageSquare,
  User,
  Settings,
  LogOut,
  Crown,
  ShieldCheck
} from 'lucide-react';
import { useAuth } from '@/hooks/useAuth';
import { useWebSocket } from '@/hooks/useWebSocket';
import { useState, useEffect } from 'react';
import { queryClient } from '@/lib/queryClient';
import { Logo } from '@/components/logo';

export function Header() {
  const { user, isAuthenticated } = useAuth();
  const [, setLocation] = useLocation();
  const [unreadCount, setUnreadCount] = useState(0);
  
  // Fetch unread message count
  const { data: unreadData } = useQuery<{ count: number }>({
    queryKey: ['/api/messages/unread-count'],
    enabled: !!user && isAuthenticated,
    refetchInterval: 30000 // Refetch every 30 seconds
  });
  
  // Fetch subscription status
  const { data: subscription } = useQuery<{ tier: string; status: string }>({
    queryKey: ['/api/subscriptions/status'],
    enabled: !!user && isAuthenticated,
  });
  
  // WebSocket for real-time unread updates
  useWebSocket((message) => {
    if (message.type === 'new_message') {
      // Invalidate unread count query
      queryClient.invalidateQueries({ queryKey: ['/api/messages/unread-count'] });
    }
  });
  
  useEffect(() => {
    if (unreadData?.count !== undefined) {
      setUnreadCount(unreadData.count);
    }
  }, [unreadData]);
  
  const handleLogout = () => {
    window.location.href = '/api/logout';
  };
  
  if (!user || !isAuthenticated) return null;
  
  // Format subscription tier for display
  const subscriptionTier = subscription?.tier || 'free';
  const isPremium = subscriptionTier !== 'free';
  const tierDisplayName = subscriptionTier === 'tourist-premium' 
    ? 'Premium' 
    : subscriptionTier === 'guide-pro' 
    ? 'Pro' 
    : null;
  
  return (
    <header className="sticky top-0 z-40 w-full border-b bg-card backdrop-blur">
      <div className="max-w-7xl mx-auto flex h-16 items-center justify-between px-4">
        {/* Logo */}
        <div 
          className="flex items-center gap-2 cursor-pointer hover-elevate rounded-md px-3 py-2"
          onClick={() => setLocation('/')}
          data-testid="header-logo"
        >
          <Logo className="h-8" />
          <span className="font-bold text-xl hidden md:inline">TourConnect</span>
        </div>
        
        {/* Right side */}
        <div className="flex items-center gap-2">
          {/* Messages */}
          <Button
            variant="ghost"
            size="icon"
            className="relative"
            onClick={() => setLocation('/messages')}
            data-testid="button-messages"
          >
            <MessageSquare className="h-5 w-5" />
            {unreadCount > 0 && (
              <Badge 
                className="absolute -top-1 -right-1 h-5 w-5 flex items-center justify-center p-0 text-xs"
                data-testid="badge-unread-count"
              >
                {unreadCount > 9 ? '9+' : unreadCount}
              </Badge>
            )}
          </Button>
          
          {/* Notifications */}
          <Button
            variant="ghost"
            size="icon"
            data-testid="button-notifications"
          >
            <Bell className="h-5 w-5" />
          </Button>
          
          {/* Premium indicator */}
          {isPremium && tierDisplayName && (
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setLocation('/subscriptions')}
              className="hidden md:flex"
              data-testid="button-premium"
            >
              <Crown className="h-4 w-4 mr-2 text-primary" />
              <span className="text-primary font-medium">{tierDisplayName}</span>
            </Button>
          )}
          
          {/* User dropdown */}
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button 
                variant="ghost" 
                className="relative h-10 w-10 rounded-full"
                data-testid="button-user-menu"
              >
                <Avatar className="h-10 w-10">
                  <AvatarImage src={user.profileImageUrl || undefined} />
                  <AvatarFallback>
                    {user.firstName?.[0] || user.email?.[0] || 'U'}
                    {user.lastName?.[0] || ''}
                  </AvatarFallback>
                </Avatar>
                {/* Online status indicator */}
                {user.isOnline && (
                  <div className="absolute bottom-0 right-0 h-3 w-3 rounded-full bg-green-500 border-2 border-card" data-testid="status-online" />
                )}
              </Button>
            </DropdownMenuTrigger>
            
            <DropdownMenuContent align="end" className="w-56">
              <DropdownMenuLabel>
                <div className="flex flex-col space-y-1">
                  <p className="text-sm font-medium leading-none">
                    {user.firstName && user.lastName 
                      ? `${user.firstName} ${user.lastName}` 
                      : user.email}
                  </p>
                  {user.firstName && user.lastName && (
                    <p className="text-xs leading-none text-muted-foreground">
                      {user.email}
                    </p>
                  )}
                  {user.trustLevel && user.trustLevel > 0 && (
                    <div className="flex items-center gap-1 mt-1">
                      <ShieldCheck className="h-3 w-3 text-primary" />
                      <span className="text-xs text-primary font-medium" data-testid="text-trust-level">
                        Trust Level: {user.trustLevel}
                      </span>
                    </div>
                  )}
                </div>
              </DropdownMenuLabel>
              
              <DropdownMenuSeparator />
              
              <DropdownMenuItem 
                onClick={() => setLocation('/profile')}
                data-testid="menu-profile"
              >
                <User className="mr-2 h-4 w-4" />
                <span>Profile</span>
              </DropdownMenuItem>
              
              <DropdownMenuItem 
                onClick={() => setLocation('/messages')}
                data-testid="menu-messages"
              >
                <MessageSquare className="mr-2 h-4 w-4" />
                <span>Messages</span>
                {unreadCount > 0 && (
                  <Badge variant="secondary" className="ml-auto" data-testid="badge-menu-unread">
                    {unreadCount}
                  </Badge>
                )}
              </DropdownMenuItem>
              
              <DropdownMenuItem 
                onClick={() => setLocation('/subscriptions')}
                data-testid="menu-subscriptions"
              >
                <Crown className="mr-2 h-4 w-4" />
                <span>Subscription</span>
              </DropdownMenuItem>
              
              <DropdownMenuItem 
                onClick={() => setLocation('/profile')}
                data-testid="menu-settings"
              >
                <Settings className="mr-2 h-4 w-4" />
                <span>Settings</span>
              </DropdownMenuItem>
              
              <DropdownMenuSeparator />
              
              <DropdownMenuItem 
                onClick={handleLogout}
                data-testid="menu-logout"
              >
                <LogOut className="mr-2 h-4 w-4" />
                <span>Log out</span>
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>
    </header>
  );
}
