import { useState, useEffect } from 'react';
import { Switch, Route } from "wouter";
import { queryClient } from "./lib/queryClient";
import { QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { useAuth } from "@/hooks/useAuth";
import NotFound from "@/pages/not-found";
import LanguageSelection from "@/pages/language-selection";
import Landing from "@/pages/landing";
import Tours from "@/pages/tours";
import RoleSelection from "@/pages/role-selection";
import TouristDashboard from "@/pages/tourist-dashboard";
import GuideDashboard from "@/pages/guide-dashboard";
import ProviderDashboard from "@/pages/provider-dashboard";
import SupervisorDashboard from "@/pages/supervisor-dashboard";
import PendingApproval from "@/pages/pending-approval";
import Bookings from "@/pages/bookings";
import MapView from "@/pages/interactive-map";
import CreateTour from "@/pages/create-tour";
import CreateService from "@/pages/create-service";
import TourDetail from "@/pages/tour-detail";
import BookTour from "@/pages/book-tour";
import BookingSuccess from "@/pages/booking-success";
import EditTour from "@/pages/edit-tour";
import Profile from "@/pages/profile";
import SponsorshipSuccess from "@/pages/sponsorship-success";
import "./i18n";

function Router() {
  const { user, isAuthenticated, isLoading } = useAuth();
  const [languageSelected, setLanguageSelected] = useState(
    !!localStorage.getItem('language')
  );

  // Show language selection first if not selected
  if (!languageSelected) {
    return <LanguageSelection onLanguageSelected={() => setLanguageSelected(true)} />;
  }

  // Show loading state
  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="animate-spin w-12 h-12 border-4 border-primary border-t-transparent rounded-full" />
      </div>
    );
  }

  // Show landing page for non-authenticated users
  if (!isAuthenticated) {
    return (
      <Switch>
        <Route path="/" component={Landing} />
        <Route path="/tours" component={Tours} />
        <Route path="/tours/:id" component={TourDetail} />
        <Route component={NotFound} />
      </Switch>
    );
  }

  // Show role selection if user hasn't selected a role
  if (!user?.role) {
    return <RoleSelection />;
  }

  // Show pending approval page if user is guide/provider and not approved
  if ((user.role === 'guide' || user.role === 'provider') && user.approvalStatus !== 'approved') {
    return <PendingApproval />;
  }

  // Route based on user role
  return (
    <Switch>
      {/* Shared routes for all authenticated users */}
      <Route path="/profile" component={Profile} />
      <Route path="/tours/:id" component={TourDetail} />
      <Route path="/book/:id" component={BookTour} />
      <Route path="/booking-success" component={BookingSuccess} />
      <Route path="/sponsorship-success" component={SponsorshipSuccess} />
      <Route path="/edit-tour/:id" component={EditTour} />
      
      {user.role === 'tourist' && (
        <>
          <Route path="/" component={TouristDashboard} />
          <Route path="/bookings" component={Bookings} />
          <Route path="/saved" component={() => <div>Saved Page - Coming Soon</div>} />
          <Route path="/map" component={MapView} />
        </>
      )}
      {user.role === 'guide' && (
        <>
          <Route path="/" component={GuideDashboard} />
          <Route path="/bookings" component={Bookings} />
          <Route path="/analytics" component={() => <div>Analytics - Coming Soon</div>} />
          <Route path="/create-tour" component={CreateTour} />
        </>
      )}
      {user.role === 'provider' && (
        <>
          <Route path="/" component={ProviderDashboard} />
          <Route path="/offers" component={() => <div>Offers - Coming Soon</div>} />
          <Route path="/insights" component={() => <div>Insights - Coming Soon</div>} />
          <Route path="/create-service" component={CreateService} />
        </>
      )}
      {user.role === 'supervisor' && (
        <>
          <Route path="/" component={SupervisorDashboard} />
        </>
      )}
      <Route component={NotFound} />
    </Switch>
  );
}

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <Toaster />
        <Router />
      </TooltipProvider>
    </QueryClientProvider>
  );
}

export default App;
