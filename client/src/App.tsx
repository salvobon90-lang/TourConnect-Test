import { useState, lazy, Suspense } from 'react';
import { Switch, Route, useLocation } from "wouter";
import { queryClient } from "./lib/queryClient";
import { QueryClientProvider } from "@tanstack/react-query";
import { HelmetProvider } from 'react-helmet-async';
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { ThemeProvider } from '@/components/theme-provider';
import { useAuth } from "@/hooks/useAuth";
import { LoadingSpinner } from "@/components/loading-spinner";
import { useTranslation } from "react-i18next";
import { AnimatePresence, motion } from 'framer-motion';
import { pageVariants } from '@/lib/animations';
import { AIChatWidget } from "@/components/ai/AIChatWidget";
import "./i18n";

// Critical routes - loaded eagerly (always needed)
import NotFound from "@/pages/not-found";
import LanguageSelection from "@/pages/language-selection";
import Landing from "@/pages/landing";

// All other routes - loaded lazily (on-demand)
const Tours = lazy(() => import("@/pages/tours"));
const RoleSelection = lazy(() => import("@/pages/role-selection"));
const TouristDashboard = lazy(() => import("@/pages/tourist-dashboard"));
const GuideDashboard = lazy(() => import("@/pages/guide-dashboard"));
const ProviderDashboard = lazy(() => import("@/pages/provider-dashboard"));
const SupervisorDashboard = lazy(() => import("@/pages/supervisor-dashboard"));
const PendingApproval = lazy(() => import("@/pages/pending-approval"));
const Bookings = lazy(() => import("@/pages/bookings"));
const MapView = lazy(() => import("@/pages/interactive-map"));
const CreateTour = lazy(() => import("@/pages/create-tour"));
const CreateService = lazy(() => import("@/pages/create-service"));
const TourDetail = lazy(() => import("@/pages/tour-detail"));
const BookTour = lazy(() => import("@/pages/book-tour"));
const BookingSuccess = lazy(() => import("@/pages/booking-success"));
const EditTour = lazy(() => import("@/pages/edit-tour"));
const Profile = lazy(() => import("@/pages/profile"));
const SponsorshipSuccess = lazy(() => import("@/pages/sponsorship-success"));
const Onboarding = lazy(() => import("@/pages/onboarding"));
const Messages = lazy(() => import("@/pages/Messages"));
const Subscriptions = lazy(() => import("@/pages/Subscriptions"));
const SubscriptionSuccess = lazy(() => import("@/pages/SubscriptionSuccess"));
const SubscriptionCancel = lazy(() => import("@/pages/SubscriptionCancel"));
const Tour3DPage = lazy(() => import("@/pages/Tour3DPage"));
const MapboxMap3D = lazy(() => import("@/pages/mapbox-3d"));
const Events = lazy(() => import("@/pages/events"));
const EventDetails = lazy(() => import("@/pages/event-details"));
const CreateEvent = lazy(() => import("@/pages/create-event"));
const MyEvents = lazy(() => import("@/pages/my-events"));
const Feed = lazy(() => import("@/pages/feed"));
const PostDetails = lazy(() => import("@/pages/post-details"));
const Analytics = lazy(() => import("@/pages/analytics"));
const ItineraryBuilder = lazy(() => import("@/pages/itinerary-builder"));
const EsploraMondo = lazy(() => import("@/pages/esplora-mondo"));
const Discover = lazy(() => import("@/pages/discover"));
const CommunityMapPage = lazy(() => import("@/pages/CommunityMapPage"));
const SearchPage = lazy(() => import("@/pages/SearchPage"));
const PartnershipsPage = lazy(() => import("@/pages/PartnershipsPage"));
const AdminLoginPage = lazy(() => import("@/pages/AdminLoginPage"));
const GroupMarketplace = lazy(() => import("@/pages/group-marketplace"));
const PartnerPortal = lazy(() => import("@/pages/PartnerPortal"));
const PackageDetail = lazy(() => import("@/pages/PackageDetail"));
const ServiceList = lazy(() => import("@/pages/ServiceList"));
const ServiceDetail = lazy(() => import("@/pages/ServiceDetail"));

// Loading fallback component
function PageLoader() {
  return (
    <div className="flex items-center justify-center min-h-screen" data-testid="page-loader">
      <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
    </div>
  );
}

function Router() {
  const { user, isAuthenticated, isLoading } = useAuth();
  const { t } = useTranslation();
  const [location] = useLocation();
  const [languageSelected, setLanguageSelected] = useState(
    !!localStorage.getItem('language')
  );

  // Show language selection first if not selected (but allow admin login)
  if (!languageSelected && location !== '/admin/login') {
    return <LanguageSelection onLanguageSelected={() => setLanguageSelected(true)} />;
  }

  // Show loading state
  if (isLoading) {
    return <LoadingSpinner size="lg" text={t('common.loading')} fullscreen />;
  }

  // Show landing page for non-authenticated users
  if (!isAuthenticated) {
    return (
      <AnimatePresence mode="wait">
        <motion.div
          key={location}
          variants={pageVariants}
          initial="initial"
          animate="animate"
          exit="exit"
        >
          <Suspense fallback={<PageLoader />}>
            <Switch location={location}>
              <Route path="/" component={Landing} />
              <Route path="/admin/login" component={AdminLoginPage} />
              <Route path="/tours" component={Tours} />
              <Route path="/tours/:id/3d" component={Tour3DPage} />
              <Route path="/tours/:id" component={TourDetail} />
              <Route component={NotFound} />
            </Switch>
          </Suspense>
        </motion.div>
      </AnimatePresence>
    );
  }

  // Show onboarding for new authenticated users (only once)
  if (!localStorage.getItem('onboardingCompleted')) {
    return (
      <Suspense fallback={<PageLoader />}>
        <Onboarding />
      </Suspense>
    );
  }

  // Show role selection if user hasn't selected a role
  if (!user?.role) {
    return (
      <Suspense fallback={<PageLoader />}>
        <RoleSelection />
      </Suspense>
    );
  }

  // Show pending approval page if user is guide/provider and not approved
  if ((user.role === 'guide' || user.role === 'provider') && user.approvalStatus !== 'approved') {
    return (
      <Suspense fallback={<PageLoader />}>
        <PendingApproval />
      </Suspense>
    );
  }

  // Route based on user role - all wrapped in Suspense
  return (
    <AnimatePresence mode="wait">
      <motion.div
        key={location}
        variants={pageVariants}
        initial="initial"
        animate="animate"
        exit="exit"
      >
        <Suspense fallback={<PageLoader />}>
          <Switch location={location}>
            {/* Shared routes for all authenticated users */}
            <Route path="/search" component={SearchPage} />
            <Route path="/marketplace" component={GroupMarketplace} />
            <Route path="/partner-portal" component={PartnerPortal} />
            <Route path="/profile" component={Profile} />
            <Route path="/messages" component={Messages} />
            <Route path="/subscriptions" component={Subscriptions} />
            <Route path="/subscriptions/success" component={SubscriptionSuccess} />
            <Route path="/subscriptions/cancel" component={SubscriptionCancel} />
            <Route path="/tours/:id/3d" component={Tour3DPage} />
            <Route path="/tours/:id" component={TourDetail} />
            <Route path="/packages/:id" component={PackageDetail} />
            <Route path="/services" component={ServiceList} />
            <Route path="/services/:id" component={ServiceDetail} />
            <Route path="/book/:id" component={BookTour} />
            <Route path="/booking-success" component={BookingSuccess} />
            <Route path="/sponsorship-success" component={SponsorshipSuccess} />
            <Route path="/edit-tour/:id" component={EditTour} />
            
            {/* Event routes */}
            <Route path="/events" component={Events} />
            <Route path="/events/new" component={CreateEvent} />
            <Route path="/events/my-events" component={MyEvents} />
            <Route path="/events/:id" component={EventDetails} />
            
            {/* Feed routes */}
            <Route path="/feed" component={Feed} />
            <Route path="/feed/new" component={Feed} />
            <Route path="/feed/:id" component={PostDetails} />
            
            {/* AI Itinerary Builder */}
            <Route path="/itinerary-builder" component={ItineraryBuilder} />
            
            {/* 3D Globe Explorer */}
            <Route path="/esplora-mondo" component={EsploraMondo} />
            
            {/* Discover Page - Phase 4 */}
            <Route path="/discover" component={Discover} />
            
            {/* Community Map - Phase 8 */}
            <Route path="/community-map" component={CommunityMapPage} />
            
            {user.role === 'tourist' && (
              <>
                <Route path="/" component={TouristDashboard} />
                <Route path="/bookings" component={Bookings} />
                <Route path="/saved" component={() => <div>Saved Page - Coming Soon</div>} />
                <Route path="/map" component={MapView} />
                <Route path="/map-3d" component={MapboxMap3D} />
              </>
            )}
            {user.role === 'guide' && (
              <>
                <Route path="/" component={GuideDashboard} />
                <Route path="/bookings" component={Bookings} />
                <Route path="/analytics" component={Analytics} />
                <Route path="/create-tour" component={CreateTour} />
                <Route path="/partnerships" component={PartnershipsPage} />
                <Route path="/map-3d" component={MapboxMap3D} />
              </>
            )}
            {user.role === 'provider' && (
              <>
                <Route path="/" component={ProviderDashboard} />
                <Route path="/analytics" component={Analytics} />
                <Route path="/offers" component={() => <div>Offers - Coming Soon</div>} />
                <Route path="/create-service" component={CreateService} />
                <Route path="/partnerships" component={PartnershipsPage} />
                <Route path="/map-3d" component={MapboxMap3D} />
              </>
            )}
            {user.role === 'supervisor' && (
              <>
                <Route path="/" component={SupervisorDashboard} />
                <Route path="/dashboard/supervisor" component={SupervisorDashboard} />
                <Route path="/map-3d" component={MapboxMap3D} />
              </>
            )}
            <Route component={NotFound} />
          </Switch>
        </Suspense>
      </motion.div>
    </AnimatePresence>
  );
}

function App() {
  return (
    <HelmetProvider>
      <QueryClientProvider client={queryClient}>
        <ThemeProvider defaultTheme="system" storageKey="tourconnect-theme">
          <TooltipProvider>
            <Router />
            <AIChatWidget />
            <Toaster />
          </TooltipProvider>
        </ThemeProvider>
      </QueryClientProvider>
    </HelmetProvider>
  );
}

export default App;
