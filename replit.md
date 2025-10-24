# Tourism Platform - TourConnect

## Overview

TourConnect is a comprehensive tourism platform that connects three distinct user groups: tourists seeking authentic experiences, tour guides offering local expertise, and service providers (restaurants, shops, transport). The application features role-based dashboards, interactive mapping with geolocation, booking management with Stripe payment integration, and multi-language support (English, Italian, German, French, Spanish).

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
- RESTful API endpoints organized by resource type (tours, services, bookings, reviews)
- Role-based access control enforced at route level using `isAuthenticated` middleware
- Request/response logging middleware for API calls
- JSON-based communication with credential-based authentication

**Authentication Flow:**
- OpenID Connect integration with Replit's identity provider
- Session-based authentication with PostgreSQL session storage
- User role assignment after initial login (tourist/guide/provider)
- Protected routes requiring authentication middleware
- Token refresh handled automatically by OpenID client

### Database Schema Design

**Core Tables:**
- `users` - User accounts with role discrimination (tourist/guide/provider)
- `tours` - Tour offerings created by guides with geolocation data
- `services` - Services offered by providers (restaurants, shops, transport)
- `bookings` - Tour bookings with Stripe payment tracking
- `reviews` - User reviews for tours with ratings and images
- `sessions` - PostgreSQL-backed session storage for authentication

**Key Relationships:**
- Tours belong to guides (one-to-many via `guideId`)
- Services belong to providers (one-to-many via `providerId`)
- Bookings reference both users and tours with payment metadata
- Reviews reference users and tours with optional service reviews

**Schema Features:**
- UUID primary keys with PostgreSQL's `gen_random_uuid()`
- Timestamp tracking with `created_at` and `updated_at` columns
- JSONB columns for flexible array storage (images, languages, included items)
- Decimal type for precise monetary values
- Geolocation coordinates stored as real numbers (latitude/longitude)
- Enum-style fields using varchar with Zod validation

### External Dependencies

**Payment Processing:**
- Stripe integration for secure payment handling
- Stripe Checkout Sessions for hosted payment pages
- Webhook support for payment confirmation (prepared via `rawBody` middleware)
- Client-side Stripe.js and React Stripe components

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

**Database Provider:**
- Neon serverless PostgreSQL with connection pooling
- WebSocket-based connections for serverless compatibility
- Drizzle Kit for schema migrations
- Environment-based connection string configuration