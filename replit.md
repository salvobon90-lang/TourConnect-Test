# Tourism Platform - TourConnect

## Overview

TourConnect is a comprehensive tourism platform designed to connect tourists, tour guides, service providers, and supervisors. It offers role-based dashboards, a supervisor approval workflow for guides and providers, interactive mapping with geolocation, booking management with Stripe payments, a sponsorship system for promoting tours and services, and multi-language support. Recent significant additions include a secure gamified travel rewards system, a smart tour completion system with dynamic group pricing, and social engagement features like a "like" system and trust levels. The platform also features immersive experiences with 3D/VR tours, an interactive 3D globe, AI-powered tools, and robust community engagement features, all built on a foundation of professional branding and performance optimization.

## User Preferences

Preferred communication style: Simple, everyday language.

## System Architecture

### Frontend Architecture

The frontend is built with React and TypeScript, using Vite for development and Wouter for routing. TanStack Query manages server state, and React Hook Form with Zod handles form validation. Styling is achieved with Tailwind CSS and shadcn/ui, featuring a "new-york" style. i18next provides multi-language support for 5 languages. UI/UX is visual-first, discovery-driven, inspired by Airbnb and Booking.com, using a dark grey and orange (#FF6600) color scheme with consistent typography and theming for light/dark modes, adhering to WCAG AA accessibility standards. State management leverages React Query for server state and React hooks for local UI state, avoiding global state libraries.

### Backend Architecture

The backend utilizes Express.js on Node.js with Drizzle ORM for type-safe PostgreSQL operations (Neon serverless PostgreSQL). It supports WebSockets for real-time features. Authentication is handled by Passport.js with OpenID Connect for Replit-based authentication and PostgreSQL-backed session management. The API is RESTful, enforcing role-based access control and supervisor approval workflows. Key features include atomic transactions for critical operations (e.g., group bookings, reward points), Zod schemas for input validation, and secure server-side logic for all sensitive actions like awarding reward points.

### Database Schema Design

Core tables include `users` (with roles, approval status, and extended profiles), `tours`, `services`, `bookings`, `reviews`, `sponsorships`, `likes`, `user_rewards`, `reward_logs`, and `group_bookings`. Relationships link tours to guides, services to providers, bookings to users and tours, and reviews to users and tours. The schema uses UUID primary keys, timestamp tracking, JSONB columns for flexible data storage (e.g., social links, images), decimal types for monetary values, and geolocation coordinates. Approval statuses, roles, and reward system details are carefully structured to support the platform's features and security.

## External Dependencies

**Payment Processing:** Stripe for secure payments, Stripe Checkout Sessions, and webhook support.
**Object Storage:** Google Cloud Storage for file uploads.
**Geolocation Services:** Browser Geolocation API, Leaflet with OpenStreetMap tiles, Haversine formula for distance calculations.
**Authentication Provider:** Replit OpenID Connect (OIDC) provider.
**Development Tools:** Replit-specific Vite plugins.
**Progressive Web App (PWA):** Web app manifest, service worker with network-first caching, custom icons, and standalone display mode.
**SEO Optimization:** `react-helmet-async` for dynamic meta tags, Open Graph tags, Twitter Card support, Schema.org structured data, and multi-language SEO.
**Database Provider:** Neon serverless PostgreSQL with Drizzle ORM for migrations.
**AI Features:** OpenAI (for itinerary builder, language translation, review summaries, content moderation).
**3D/VR Integration:** WebXR for VR tours, Three.js for 360° panoramas, Mapbox GL JS for 3D maps.