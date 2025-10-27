# Tourism Platform - TourConnect

## Overview

TourConnect is a comprehensive tourism platform that connects four distinct user groups: tourists seeking authentic experiences, tour guides offering local expertise, service providers (restaurants, shops, transport), and supervisors who manage platform access. The application features role-based dashboards, supervisor approval workflow for guides/providers, interactive mapping with geolocation, booking management with Stripe payment integration, sponsorship system for promoting tours and services, and multi-language support (English, Italian, German, French, Spanish).

**Recent Upgrades (October 2025):**
- Professional brand refresh with dark grey + orange (#FF6600) color scheme
- TourConnect logo integration across all touchpoints (header, favicon, loading screens)
- 3-screen onboarding flow for new users (welcome, role selection, feature showcase)
- Extended user profiles with photo upload, bio, social links, and verified badges
- Progressive Web App (PWA) capabilities with installable experience
- Advanced SEO optimization with dynamic meta tags and Schema.org structured data in 5 languages

## User Preferences

Preferred communication style: Simple, everyday language.

## System Architecture

### Frontend Architecture

**Technology Stack:**
- React with TypeScript for type-safe component development
- Vite as the build tool and development server
- Wouter for lightweight client-side routing
- TanStack Query (React Query) for server state management and caching
- React Hook Form with Zod for form validation
- Tailwind CSS with shadcn/ui component library following a "new-york" style variant
- i18next for internationalization supporting 5 languages
- Leaflet for interactive map visualization

**Design System:**
- Custom typography using Inter (UI) and Playfair Display (display headings)
- Consistent spacing primitives using Tailwind's spacing scale
- Theme system supporting light/dark modes via CSS custom properties
- Component library based on Radix UI primitives with custom styling
- Visual-first, discovery-driven UX inspired by Airbnb and Booking.com
- **Brand Colors (October 2025)**: Primary orange #FF6600 (HSL 25 100% 50%) paired with dark grey backgrounds
  - Light mode: Grey tones at 220° hue (background: 220 15% 96%)
  - Dark mode: Darker greys at 220° hue (background: 220 15% 12%)
  - Maintains WCAG AA accessibility standards for contrast
  - See design_guidelines.md for complete color palette documentation

**State Management Approach:**
- Server state managed through React Query with optimistic updates
- Local UI state managed through React hooks
- Authentication state accessed via `useAuth` hook
- Form state isolated using React Hook Form controllers
- No global state management library (Redux/Zustand) - leveraging React Query cache

### Backend Architecture

**Technology Stack:**
- Express.js server running on Node.js
- Drizzle ORM for type-safe database operations
- Neon serverless PostgreSQL as the database
- WebSocket support via `ws` package for Neon connections
- Passport.js with OpenID Connect for Replit-based authentication
- Session management using PostgreSQL-backed session store
- Stripe SDK for payment processing

**API Design:**
- RESTful API endpoints organized by resource type (tours, services, bookings, reviews, supervisor)
- Role-based access control enforced at route level using `isAuthenticated` middleware
- Approval status checks preventing unapproved guides/providers from creating content
- Supervisor-only endpoints for user approval management
- Request/response logging middleware for API calls
- JSON-based communication with credential-based authentication

**Authentication Flow:**
- OpenID Connect integration with Replit's identity provider
- Session-based authentication with PostgreSQL session storage
- Multi-step onboarding flow (October 2025 upgrade):
  1. Language selection (5 languages: it, en, de, fr, es)
  2. 3-screen onboarding (welcome, role selection with features, how it works)
  3. Dashboard access based on selected role
- Role-based approval workflow: tourists auto-approved, guides/providers require supervisor approval
- Supervisor approval system with approve/reject functionality
- Protected routes requiring authentication and approval status checks
- Token refresh handled automatically by OpenID client

### Database Schema Design

**Core Tables:**
- `users` - User accounts with role discrimination (tourist/guide/provider/supervisor) and approval status tracking
  - Extended profiles (October 2025): profileImageUrl, bio, socialLinks (jsonb: facebook, instagram, twitter, website), verified badge
- `tours` - Tour offerings created by approved guides with geolocation data
- `services` - Services offered by approved providers (restaurants, shops, transport)
- `bookings` - Tour bookings with Stripe payment tracking
- `reviews` - User reviews for tours with ratings and images
- `sponsorships` - Paid promotions for tours/services with Stripe payment tracking and expiration management
- `sessions` - PostgreSQL-backed session storage for authentication

**Key Relationships:**
- Tours belong to guides (one-to-many via `guideId`)
- Services belong to providers (one-to-many via `providerId`)
- Bookings reference both users and tours with payment metadata
- Reviews reference users and tours with optional service reviews
- Sponsorships reference either tours or services (mutually exclusive via `tourId` or `serviceId`) with user ownership tracking

**Schema Features:**
- UUID primary keys with PostgreSQL's `gen_random_uuid()`
- Timestamp tracking with `created_at` and `updated_at` columns
- Nullable role and approval status fields (null until role selection)
- Approval tracking with `approval_status` ('pending', 'approved', 'rejected'), `approved_by`, and `approved_at` fields
- JSONB columns for flexible array storage (images, languages, included items)
- Decimal type for precise monetary values
- Geolocation coordinates stored as real numbers (latitude/longitude)
- Enum-style fields using varchar with Zod validation

### External Dependencies

**Payment Processing:**
- Stripe integration for secure payment handling (tour bookings and sponsorships)
- Stripe Checkout Sessions for hosted payment pages
- Webhook support for payment confirmation (prepared via `rawBody` middleware)
- Client-side Stripe.js and React Stripe components
- Payment verification with session ID validation and metadata checks
- Test/production mode with automatic fallback to TESTING_STRIPE_SECRET_KEY

**Object Storage:**
- Google Cloud Storage for file uploads
- Replit sidecar integration for credential management
- Access control lists (ACL) for object permissions
- Public/private object visibility policies

**Geolocation Services:**
- Browser Geolocation API for user location tracking
- Leaflet mapping library with OpenStreetMap tiles
- Haversine formula for distance calculations
- Local storage caching of user location

**Authentication Provider:**
- Replit OpenID Connect (OIDC) provider
- External account credentials via sidecar endpoint
- Session management with `connect-pg-simple`
- Memoized OIDC configuration with 1-hour cache

**Development Tools:**
- Replit-specific Vite plugins for cartographer and dev banner
- Runtime error overlay for development debugging
- Hot module replacement (HMR) via Vite

**Progressive Web App (PWA) - October 2025:**
- Web app manifest (manifest.json) for installability
- Service worker with network-first cache strategy
- Custom PWA icons (192x192, 512x512, maskable variants)
- Standalone display mode (hides browser UI)
- Theme colors matching brand (#FF6600 orange, dark grey)
- Installable on desktop and mobile devices

**SEO Optimization - October 2025:**
- react-helmet-async for dynamic meta tag management
- Unique titles and descriptions for all pages
- Open Graph tags for social media sharing (Facebook, LinkedIn, Twitter)
- Twitter Card support for enhanced sharing
- Schema.org structured data (JSON-LD) for tour pages (TouristAttraction type)
- Canonical URLs to prevent duplicate content
- Multi-language SEO support (5 languages with localized meta tags)
- Rich snippets potential in search results

**Database Provider:**
- Neon serverless PostgreSQL with connection pooling
- WebSocket-based connections for serverless compatibility
- Drizzle Kit for schema migrations
- Environment-based connection string configuration