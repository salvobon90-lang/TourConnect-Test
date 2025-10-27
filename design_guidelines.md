# Tourism Platform Design Guidelines

## Design Approach

**Reference-Based Approach**: Drawing inspiration from industry leaders in travel and booking platforms including Airbnb (for service provider connection and booking flows), Booking.com (for search and filtering patterns), GetYourGuide (for tour discovery and booking), and Google Maps (for location-based services).

**Core Principle**: Create a visual-first, discovery-driven experience that balances rich imagery with functional clarity across three distinct user journeys while maintaining consistent design language.

---

## Color Palette

**Brand Identity**: TourConnect's visual identity is built on a vibrant orange primary color paired with sophisticated dark grey tones, creating a modern and professional tourism platform that stands out while maintaining excellent readability and accessibility.

### Primary Color - Orange #FF6600

**Orange** (HSL: 25 100% 50%) is the signature brand color, derived directly from the TourConnect logo. This vibrant, energetic orange conveys excitement, adventure, and warmth - perfect for a tourism platform.

**Usage:**
- Primary action buttons (Book Now, Create Tour, Confirm Booking)
- Important CTAs and conversion points
- Active/selected states in navigation
- Focus rings and interactive highlights
- Logo and brand elements
- Links and clickable elements requiring emphasis

**Accessibility**: The orange #FF6600 provides sufficient contrast against both light and dark backgrounds when used for buttons with white text, meeting WCAG AA standards.

### Background Colors - Dark Grey Theme

**Light Mode Palette:**
- **Background**: HSL(220 15% 96%) - #F5F5F7 - Soft light grey for main application background
- **Card**: HSL(220 12% 98%) - Almost white for elevated surfaces and content cards
- **Sidebar**: HSL(220 15% 94%) - Slightly darker grey for navigation areas
- **Border**: HSL(220 10% 88%) - Subtle grey for dividers and outlines

**Dark Mode Palette:**
- **Background**: HSL(220 15% 12%) - #1A1D23 - Deep charcoal grey for main background
- **Card**: HSL(220 15% 16%) - Lighter charcoal for elevated cards
- **Sidebar**: HSL(220 15% 10%) - Nearly black for navigation areas
- **Foreground**: HSL(0 0% 98%) - Off-white for text, ensuring high contrast

**Design Rationale**: The dark grey theme creates a sophisticated, modern appearance while:
- Reducing eye strain compared to pure black or white
- Providing subtle depth through layered grey tones
- Creating visual hierarchy without relying solely on color
- Maintaining consistency with the orange brand color across both modes

### Text & Foreground Colors

**Light Mode:**
- **Primary Text**: HSL(220 8% 12%) - Dark grey-blue for main content
- **Secondary Text**: HSL(220 8% 15%) - Slightly lighter for supporting text
- **Tertiary Text**: HSL(220 5% 35%) - Muted grey for least important information

**Dark Mode:**
- **Primary Text**: HSL(0 0% 98%) - Near white for optimal readability
- **Secondary Text**: HSL(0 0% 90%) - Slightly dimmed for hierarchy
- **Tertiary Text**: HSL(220 4% 65%) - Muted for supporting information

### Accent & Semantic Colors

**Secondary**: Warm brown tones for subtle emphasis without competing with primary orange
**Destructive/Error**: Red HSL(0 75% 42%) for warnings and delete actions
**Success**: Derived from charts - use sparingly for confirmations
**Muted**: Low-contrast backgrounds for disabled states and subtle UI elements

### Color Usage Guidelines

**Do:**
- Use orange primary for all major CTAs and conversion points
- Maintain dark grey backgrounds in both light and dark themes
- Ensure text always has sufficient contrast (4.5:1 minimum for body text)
- Use grey tones to create visual hierarchy and depth
- Keep the orange vibrant and consistent across all touchpoints

**Don't:**
- Use orange for backgrounds (except buttons and small badges)
- Mix warm and cool greys - stick to the 220° hue consistently
- Use pure black (#000000) or pure white (#FFFFFF) for backgrounds
- Apply orange to large text areas - use for accents only
- Deviate from the HSL values specified in the design system

**Accessibility Considerations:**
- All text meets WCAG AA contrast requirements (4.5:1 for normal text, 3:1 for large text)
- Orange buttons use white text for maximum readability
- Focus indicators are clearly visible in both light and dark modes
- Interactive elements maintain consistent hover and active states

---

## Typography System

**Font Families**:
- Primary: Inter (via Google Fonts CDN) - UI elements, navigation, body text
- Display: Playfair Display - Hero sections, tour titles, feature headings

**Hierarchy**:
- Hero Headlines: 3xl-5xl (48-64px), Display font, font-semibold
- Section Headers: 2xl-3xl (32-40px), Display font, font-medium
- Card Titles: lg-xl (20-24px), Primary font, font-semibold
- Body Text: base (16px), Primary font, font-normal
- Captions/Meta: sm (14px), Primary font, font-medium
- Buttons/CTAs: base (16px), Primary font, font-semibold

---

## Layout System

**Spacing Primitives**: Use Tailwind units of 2, 4, 6, 8, 12, 16, 20, 24 for consistent rhythm
- Component padding: p-4 to p-6 (mobile), p-6 to p-8 (desktop)
- Section spacing: py-12 to py-16 (mobile), py-20 to py-24 (desktop)
- Card gaps: gap-4 to gap-6
- Content margins: mb-4, mb-6, mb-8 for vertical flow

**Container Strategy**:
- Full-width sections: w-full with max-w-7xl mx-auto px-4
- Content sections: max-w-6xl
- Form containers: max-w-2xl
- Reading content: max-w-prose

**Grid Patterns**:
- Tour/Service Cards: grid-cols-1 md:grid-cols-2 lg:grid-cols-3
- Featured Tours: grid-cols-1 lg:grid-cols-2 (larger cards)
- Service Provider Grid: grid-cols-2 md:grid-cols-3 lg:grid-cols-4
- Dashboard Stats: grid-cols-2 lg:grid-cols-4

---

## Component Library

### Navigation (All Roles)

**Top Navigation Bar**:
- Fixed position with backdrop blur effect
- Height: h-16 to h-20
- Logo left-aligned, navigation center, user menu right
- Language selector in top-right with flag icons (Font Awesome)
- Mobile: Hamburger menu with slide-out drawer

**Role-Based Navigation Items**:
- Tourists: Discover Tours, My Bookings, Saved, Map View
- Tour Guides: My Tours, Create Tour, Bookings, Analytics
- Service Providers: My Services, Offers, Bookings, Insights

### Hero Sections

**Landing Page Hero** (Pre-Login):
- Full viewport height (90vh-100vh)
- Large hero image showcasing destination (full-bleed background)
- Centered content with search/filter bar overlay
- Search bar with location input, date picker, category dropdown
- CTA buttons with backdrop-blur-md background
- Trust indicators below search (e.g., "10,000+ Tours Available")

**Dashboard Heroes** (Post-Login):
- Reduced height (40vh-50vh) with welcome message
- Personalized greeting: "Welcome back, [Name]"
- Quick stats or action cards overlaid on subtle background

### Discovery & Listing Components

**Tour/Service Cards**:
- Aspect ratio 4:3 for main image
- Image with rounded corners (rounded-lg to rounded-xl)
- Overlay gradient on image with title and price
- Rating stars with review count (Heroicons star icons)
- Quick info badges (duration, group size, category)
- Hover effect: subtle scale transform and shadow increase
- Card structure: Image → Title → Meta Info → Price → CTA

**Featured Tour Showcase**:
- Large cards in 2-column grid on desktop
- More prominent images (aspect-ratio 16:9)
- Detailed preview with itinerary highlights
- Multiple images in carousel format
- "Featured" or "Popular" badge overlay

**Search & Filter Panel**:
- Sticky sidebar on desktop (w-64 to w-72)
- Collapsible sections for filter categories
- Price range slider component
- Multi-select checkboxes for amenities/features
- Date range picker for availability
- Sort dropdown (price, rating, popularity, nearest)
- Clear all filters button

### Map Integration

**Interactive Map View**:
- Full-height map container (min-h-screen)
- Side panel for list view (w-96) that slides in/out
- Custom map markers with category-based icons
- Cluster markers for dense areas
- Info popup on marker click with mini-card preview
- "View Details" button in popup leading to full page
- Current location marker with radius indicator
- Toggle between map view and list view on mobile

### Booking Flow Components

**Multi-Step Booking Form**:
- Progress indicator at top (steps: Select → Details → Payment → Confirm)
- Step 1: Date/time picker, participant count selector
- Step 2: User details form, special requests textarea
- Step 3: Payment method selection (Stripe integration)
- Step 4: Booking summary with all details
- Sidebar summary card showing tour details and total price (sticky on scroll)
- Large confirmation CTA button

**Calendar/Date Picker**:
- Month view with available dates highlighted
- Disabled dates shown with reduced opacity
- Selected date range with connecting highlight
- Time slot selector below calendar
- Availability indicators (slots remaining)

### Dashboard Components

**Stats Overview Cards** (All Roles):
- 2x2 or 4-column grid on desktop
- Icon + Number + Label + Trend indicator
- Tourist: Bookings, Favorites, Reviews Written, Points Earned
- Guide: Active Tours, Total Bookings, Avg Rating, Revenue
- Provider: Services Listed, Orders, Reviews, Monthly Revenue

**Tour Management** (Guides):
- Table view with columns: Tour Name, Status, Bookings, Rating, Actions
- Inline edit capabilities
- Quick actions dropdown (Edit, View, Duplicate, Archive)
- "Create New Tour" prominent CTA button

**Create/Edit Tour Form** (Guides):
- Multi-section form with clear section headers
- Image upload zone with drag-and-drop (multiple images)
- Rich text editor for description and itinerary
- Pricing section with multiple price tiers
- Availability calendar
- Meeting point with map picker
- Language options checklist
- Included/Excluded items lists

### Review & Rating Components

**Review Cards**:
- User avatar (left), name, date (top)
- Star rating display (Heroicons)
- Review text with "Read more" expansion
- Photos attached to review in gallery
- Guide/Provider response shown indented below
- Helpful/Not Helpful buttons

**Rating Summary**:
- Overall rating number (large, prominent)
- Star breakdown histogram (5 stars to 1 star)
- Total review count
- Filter reviews by rating

### Service Provider Components

**Service Listing Card**:
- Logo/image with business category badge
- Operating hours display
- Distance from user
- Quick stats (rating, price range, cuisine type)
- Special offers banner if applicable
- "Contact" and "View Menu/Details" CTAs

**Special Offers Section**:
- Banner-style cards with promotional imagery
- Discount percentage prominently displayed
- Valid dates and terms
- "Claim Offer" CTA

### Messaging/Communication

**In-App Chat Interface**:
- Chat list view showing conversations
- Message bubbles (sent vs received styling)
- Timestamp on messages
- Typing indicator
- Image/attachment sharing
- Quick reply suggestions for common questions

### Notifications

**Notification Center**:
- Slide-out panel from top-right
- Categorized tabs: All, Bookings, Messages, System
- Unread badge count
- Clear notification action
- Settings link for notification preferences

**Push Notification Display**:
- Toast notifications in bottom-right
- Auto-dismiss after 5 seconds
- Icon based on type (booking, message, offer, update)

---

## Images

**Hero Images**:
- Landing page: Large, inspiring destination photograph showcasing iconic tourism location (1920x1080 minimum)
- Tourist dashboard: Scenic landscape or adventure activity
- Guide dashboard: Professional guide interacting with tourists
- Provider dashboard: Vibrant service environment (restaurant, shop interior)

**Tour/Service Images**:
- High-quality destination photos for each tour card
- Service provider logos and establishment photos
- User-generated content in reviews section
- Gallery format for tour detail pages (4-6 images)

**Icon Usage**:
- Font Awesome for general UI icons (location, calendar, users, star, etc.)
- Custom category icons for tour types (walking, food, adventure, cultural)

---

## Responsive Behavior

**Mobile-First Breakpoints**:
- Base: Single column, stacked layout
- md (768px): 2-column grids where appropriate
- lg (1024px): 3-column grids, sidebar layouts
- xl (1280px): Full desktop experience with max-width containers

**Mobile Specific**:
- Bottom navigation bar for primary actions
- Collapsible filters with drawer
- Swipeable tour cards
- Map view toggles to full screen
- Simplified booking form with accordion sections

---

## Accessibility & Interactions

**Focus States**: 
- Visible focus rings (ring-2 ring-offset-2)
- Skip to content link for keyboard navigation

**Touch Targets**:
- Minimum 44x44px for all interactive elements
- Adequate spacing between clickable items (gap-2 minimum)

**Loading States**:
- Skeleton screens for card grids
- Progress indicators for form submissions
- Shimmer effect on loading images

**Error States**:
- Inline validation messages
- Error summary at form top
- Retry actions for failed requests

---

This design system creates a cohesive, intuitive multi-role platform that prioritizes visual discovery, efficient booking flows, and role-appropriate functionality while maintaining consistency across the entire application.