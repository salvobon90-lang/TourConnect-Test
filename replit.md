# Tourism Platform - TourConnect

## Overview

TourConnect is a comprehensive tourism platform connecting tourists, tour guides, service providers, and supervisors. It features role-based dashboards, a supervisor approval workflow, interactive mapping with geolocation, booking management with Stripe payments, and a sponsorship system. Key capabilities include a gamified travel rewards system, smart tour completion with dynamic group pricing, and social engagement features. The platform offers immersive 3D/VR tours, an interactive 3D globe, and AI-powered tools, focusing on professional branding, performance, and community engagement through a group marketplace, content moderation, and partner integration.

## User Preferences

Preferred communication style: Simple, everyday language.

## System Architecture

### Frontend Architecture

The frontend is built with React and TypeScript, utilizing Vite, Wouter for routing, TanStack Query for server state, and React Hook Form with Zod for validation. Styling is achieved using Tailwind CSS and shadcn/ui, featuring a "new-york" style. i18next provides multi-language support (5 languages). The UI/UX is visual-first, discovery-driven, inspired by Airbnb and Booking.com, using a dark grey and orange (#FF6600) color scheme with consistent typography and light/dark modes, adhering to WCAG AA accessibility standards. State management uses React Query for server state and React hooks for local UI state.

### Backend Architecture

The backend uses Express.js on Node.js with Drizzle ORM for type-safe PostgreSQL operations (Neon serverless PostgreSQL). It supports WebSockets for real-time features. Authentication is handled by Passport.js with OpenID Connect for Replit and PostgreSQL-backed session management. The API is RESTful, enforcing role-based access control and supervisor approval workflows. It includes atomic transactions, Zod schemas for input validation, and secure server-side logic for sensitive actions like awarding reward points.

### Database Schema Design

Core tables include `users` (with roles, approval, and profiles), `tours`, `services`, `bookings`, `reviews`, `sponsorships`, `likes`, `user_rewards`, `reward_logs`, `group_bookings`, `notifications`, and `contentReports`. Relationships link entities such as tours to guides, bookings to users and tours. The schema uses UUID primary keys, timestamp tracking, JSONB columns for flexible data, decimal types for monetary values, and geolocation coordinates. Approval statuses, roles, and reward system details are structured to support platform features and security, including fields for community mode, participant tracking, and discount rules.

### UI/UX Decisions

The platform employs a visual-first, discovery-driven design, inspired by Airbnb and Booking.com. It utilizes a dark grey and orange (#FF6600) color scheme with consistent typography and theming for both light and dark modes, adhering to WCAG AA accessibility standards. Specific features include interactive Leaflet maps with draggable markers, dynamic pricing displays with discount badges, real-time countdown timers, and animated progress bars with Framer Motion. Dashboards are role-based and feature enhanced layouts for supervisors and partners, including multi-tab portals and integrated reward displays.

### Technical Implementations

The system features real-time WebSocket notifications, atomic SQL increments for concurrent booking loads, and dynamic content rendering. Form validation is robust with React Hook Form and Zod. Internationalization is comprehensive across all features and UI elements, supporting 5 languages (EN, IT, DE, FR, ES) with proper fallback handling and SEO metadata. Security measures include RBAC middleware, rate limiting, comprehensive audit logging, GDPR compliance (data export/deletion), and webhook signature verification for payment events. A 7-step tour creation wizard with interactive map selection streamlines content input. The search system supports multi-entity searches across tours, services, and guides with map/list toggle views.

### Feature Specifications

The platform includes a dedicated group marketplace with advanced filters, AI-powered hot deal suggestions, and dynamic pricing. An extended reward points system tracks various user actions. Payment automation is integrated with Stripe Checkout, supporting automatic refunds and split payouts to partner accounts via Stripe Connect, including a coupon system and an affiliate program. Partner onboarding includes KYC verification and profile management. Dynamic package bundling allows for multi-tour/service creation with custom pricing and cancellation policies. AI content moderation uses OpenAI for filtering and anti-spam measures.

## External Dependencies

**Payment Processing:** Stripe (Checkout Sessions, webhooks, Connect for split payouts).
**Object Storage:** Google Cloud Storage.
**Geolocation Services:** Browser Geolocation API, Leaflet with OpenStreetMap, Haversine formula.
**Authentication Provider:** Replit OpenID Connect (OIDC).
**Development Tools:** Replit-specific Vite plugins.
**PWA:** Web app manifest, service worker.
**SEO Optimization:** `react-helmet-async`.
**Database Provider:** Neon serverless PostgreSQL with Drizzle ORM.
**AI Features:** OpenAI (content moderation).
**3D/VR Integration:** WebXR, Three.js, Mapbox GL JS.