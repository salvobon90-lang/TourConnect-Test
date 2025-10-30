import { sql } from 'drizzle-orm';
import {
  index,
  uniqueIndex,
  jsonb,
  pgTable,
  timestamp,
  varchar,
  text,
  integer,
  decimal,
  boolean,
  real,
} from "drizzle-orm/pg-core";
import { relations } from "drizzle-orm";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

// Session storage table - Required for Replit Auth
export const sessions = pgTable(
  "sessions",
  {
    sid: varchar("sid").primaryKey(),
    sess: jsonb("sess").notNull(),
    expire: timestamp("expire").notNull(),
  },
  (table) => [index("IDX_session_expire").on(table.expire)],
);

// User roles enum
export const userRoles = ["tourist", "guide", "provider", "supervisor"] as const;
export type UserRole = typeof userRoles[number];

// User approval status enum
export const approvalStatuses = ["pending", "approved", "rejected"] as const;
export type ApprovalStatus = typeof approvalStatuses[number];

// Service provider types enum
export const providerTypes = ["restaurant", "shop", "transport", "other"] as const;
export type ProviderType = typeof providerTypes[number];

// Tour categories enum
export const tourCategories = ["walking", "food", "adventure", "cultural", "historical", "nature", "art", "nightlife"] as const;
export type TourCategory = typeof tourCategories[number];

// Sponsorship duration enum
export const sponsorshipDurations = ["weekly", "monthly"] as const;
export type SponsorshipDuration = typeof sponsorshipDurations[number];

// Sponsorship status enum
export const sponsorshipStatuses = ["pending", "active", "expired", "cancelled"] as const;
export type SponsorshipStatus = typeof sponsorshipStatuses[number];

// Badge types enum
export const badgeTypes = ["explorer", "guide-pro", "ambassador", "premium-partner", "verified"] as const;
export type BadgeType = typeof badgeTypes[number];

// Subscription tiers enum
export const subscriptionTiers = ["free", "tourist-premium", "guide-pro"] as const;
export type SubscriptionTier = typeof subscriptionTiers[number];

export const subscriptionPrices = {
  "tourist-premium": 9.99,
  "guide-pro": 19.99,
} as const;

// Like target types enum
export const likeTargetTypes = ["profile", "tour", "service"] as const;
export type LikeTargetType = typeof likeTargetTypes[number];

// Trust levels enum (for guides and providers)
export const trustLevels = ["explorer", "pathfinder", "trailblazer", "navigator", "legend"] as const;
export type TrustLevel = typeof trustLevels[number];

// Reward action types enum (Phase 6, expanded in Phase 8, Phase 9, Phase 10, Phase 11)
export const rewardActionTypes = ["booking", "review", "like", "group_join", "referral", "tour_complete", "profile_complete", "first_booking", "streak_bonus", "smart_group_create", "smart_group_join", "smart_group_complete", "smart_group_invite", "ai_reminder_create", "ai_coordination", "ai_summary_share", "search_like", "search_review", "subscription_complete", "partnership_confirmed", "create_public_group", "join_group", "community_interaction", "complete_tour_100", "community_leader_badge", "share_completed_tour", "partner_sale", "package_created", "affiliate_conversion"] as const;
export type RewardActionType = typeof rewardActionTypes[number];

// Reward level tiers enum (Phase 6)
export const rewardLevels = ["bronze", "silver", "gold", "platinum", "diamond"] as const;
export type RewardLevel = typeof rewardLevels[number];

// Referral status enum (Phase 7.2)
export const referralStatuses = ["pending", "completed"] as const;
export type ReferralStatus = typeof referralStatuses[number];

// Smart group status enum (Phase 8)
export const smartGroupStatuses = ["active", "full", "expired", "completed"] as const;
export type SmartGroupStatus = typeof smartGroupStatuses[number];

// AI action types enum (Phase 9)
export const aiActionTypes = ["meeting_suggestion", "translation", "summary", "reminder", "coordination"] as const;
export type AIActionType = typeof aiActionTypes[number];

// Group event types enum (Phase 9)
export const groupEventTypes = ["reminder", "meeting", "schedule"] as const;
export type GroupEventType = typeof groupEventTypes[number];

// Group event status enum (Phase 9)
export const groupEventStatuses = ["pending", "notified", "completed", "cancelled"] as const;
export type GroupEventStatus = typeof groupEventStatuses[number];

// Partner types enum (Phase 12)
export const partnerTypes = ["agency", "hotel", "dmo", "ota", "transport"] as const;
export type PartnerType = typeof partnerTypes[number];

// Package item types enum (Phase 12)
export const packageItemTypes = ["tour", "service", "transport", "extra"] as const;
export type PackageItemType = typeof packageItemTypes[number];

// Package booking status enum (Phase 12)
export const packageBookingStatuses = ["pending", "confirmed", "cancelled", "completed"] as const;
export type PackageBookingStatus = typeof packageBookingStatuses[number];

// Payment status enum (Phase 12)
export const paymentStatuses = ["pending", "paid", "refunded", "failed"] as const;
export type PaymentStatus = typeof paymentStatuses[number];

// Partner account status enum (Phase 12)
export const partnerAccountStatuses = ["pending", "active", "suspended"] as const;
export type PartnerAccountStatus = typeof partnerAccountStatuses[number];

// Payout status enum (Phase 12)
export const payoutStatuses = ["pending", "processing", "completed", "failed"] as const;
export type PayoutStatus = typeof payoutStatuses[number];

// Coupon type enum (Phase 12)
export const couponTypes = ["percentage", "fixed"] as const;
export type CouponType = typeof couponTypes[number];

// Connector type enum (Phase 12)
export const connectorTypes = ["ota", "dmo", "custom"] as const;
export type ConnectorType = typeof connectorTypes[number];

// Sync status enum (Phase 12)
export const syncStatuses = ["synced", "pending", "error"] as const;
export type SyncStatus = typeof syncStatuses[number];

// Points awarded for each action (Phase 6, expanded in Phase 9, Phase 10, Phase 11)
export const rewardPoints = {
  booking: 50,
  review: 25,
  like: 5,
  group_join: 30,
  referral: 100,
  tour_complete: 75,
  profile_complete: 20,
  first_booking: 100,
  streak_bonus: 50,
  smart_group_create: 20,
  smart_group_join: 10,
  smart_group_complete: 50,
  smart_group_invite: 15,
  ai_reminder_create: 10,
  ai_coordination: 5,
  ai_summary_share: 15,
  search_like: 5,
  search_review: 10,
  subscription_complete: 25,
  partnership_confirmed: 50,
  create_public_group: 30,
  join_group: 15,
  community_interaction: 10,
  complete_tour_100: 200,
  community_leader_badge: 150,
  share_completed_tour: 25,
  // Phase 12 - Partner rewards
  partner_sale: 100,
  package_created: 50,
  affiliate_conversion: 75,
} as const;

// Points required for each level
export const levelThresholds = {
  bronze: 0,
  silver: 500,
  gold: 1500,
  platinum: 3500,
  diamond: 7500,
} as const;

// User storage table - Required for Replit Auth with role extension
export const users = pgTable("users", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  email: varchar("email").unique(),
  firstName: varchar("first_name"),
  lastName: varchar("last_name"),
  profileImageUrl: varchar("profile_image_url"),
  role: varchar("role", { length: 20 }), // tourist, guide, provider, supervisor - null until user selects
  approvalStatus: varchar("approval_status", { length: 20 }), // pending, approved, rejected - null until role selected
  approvedBy: varchar("approved_by"),
  approvedAt: timestamp("approved_at"),
  
  // Common profile fields (all roles)
  bio: text("bio"),
  phone: varchar("phone", { length: 50 }),
  country: varchar("country", { length: 100 }),
  city: varchar("city", { length: 100 }),
  latitude: real("latitude"),
  longitude: real("longitude"),
  
  // Guide-specific fields
  guideLanguages: text("guide_languages").array().default(sql`ARRAY[]::text[]`),
  guideSpecialties: text("guide_specialties").array().default(sql`ARRAY[]::text[]`),
  guideExperience: integer("guide_experience"), // years
  guideLicenseNumber: varchar("guide_license_number", { length: 100 }),
  
  // Provider-specific fields
  businessName: varchar("business_name", { length: 200 }),
  businessType: varchar("business_type", { length: 50 }), // restaurant, shop, transport, other
  businessAddress: text("business_address"),
  website: varchar("website", { length: 500 }),
  
  // New profile fields for Task 5
  socialLinks: jsonb("social_links").$type<{
    facebook?: string;
    instagram?: string;
    twitter?: string;
    website?: string;
  }>(),
  verified: boolean("verified").default(false), // Badge "Verificato" for guides/providers
  
  // Gamification fields
  badges: text("badges").array().default(sql`ARRAY[]::text[]`), // ['explorer', 'guide-pro', 'ambassador', 'premium-partner']
  trustLevel: integer("trust_level").default(0), // 0-100
  completedToursCount: integer("completed_tours_count").default(0),
  isOnline: boolean("is_online").default(false),
  lastOnlineAt: timestamp("last_online_at"),
  
  // AI consent fields (Phase 9 - GDPR compliance)
  aiConsent: boolean("ai_consent").default(false),
  aiConsentDate: timestamp("ai_consent_date"),
  
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

export const usersRelations = relations(users, ({ one, many }) => ({
  toursCreated: many(tours),
  services: many(services),
  bookings: many(bookings),
  reviews: many(reviews),
  participant1Conversations: many(conversations, { relationName: "participant1Conversations" }),
  participant2Conversations: many(conversations, { relationName: "participant2Conversations" }),
  messagesSent: many(messages),
  subscription: one(subscriptions),
  eventsCreated: many(events),
  eventParticipations: many(eventParticipants),
  posts: many(posts),
  postLikes: many(postLikes),
  postComments: many(postComments),
  apiKeys: many(apiKeys),
}));

// Tours table - created by guides
export const tours = pgTable("tours", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  guideId: varchar("guide_id").notNull().references(() => users.id, { onDelete: "cascade" }),
  title: text("title").notNull(),
  description: text("description").notNull(),
  itinerary: text("itinerary").notNull(),
  category: varchar("category", { length: 50 }).notNull(),
  price: decimal("price", { precision: 10, scale: 2 }),
  duration: integer("duration").notNull(), // in minutes
  maxGroupSize: integer("max_group_size").notNull(),
  images: text("images").array().notNull().default(sql`ARRAY[]::text[]`),
  meetingPoint: text("meeting_point").notNull(),
  latitude: real("latitude").notNull(),
  longitude: real("longitude").notNull(),
  languages: text("languages").array().notNull().default(sql`ARRAY[]::text[]`),
  included: text("included").array().notNull().default(sql`ARRAY[]::text[]`),
  excluded: text("excluded").array().notNull().default(sql`ARRAY[]::text[]`),
  availableDates: text("available_dates").array().notNull().default(sql`ARRAY[]::text[]`), // ISO date strings
  approvalStatus: varchar("approval_status", { length: 20 }).notNull().default("pending"), // pending, approved, rejected
  approvedBy: varchar("approved_by").references(() => users.id),
  approvedAt: timestamp("approved_at"),
  isActive: boolean("is_active").notNull().default(true),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

export const toursRelations = relations(tours, ({ one, many }) => ({
  guide: one(users, {
    fields: [tours.guideId],
    references: [users.id],
  }),
  bookings: many(bookings),
  reviews: many(reviews),
}));

// Services table - created by providers
export const services = pgTable("services", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  providerId: varchar("provider_id").notNull().references(() => users.id, { onDelete: "cascade" }),
  title: text("title").notNull(), // Added for consistency with tours
  name: text("name").notNull(),
  description: text("description").notNull(),
  category: varchar("category", { length: 50 }).notNull(), // Added for consistency with tours
  type: varchar("type", { length: 50 }).notNull(), // restaurant, shop, transport
  price: varchar("price", { length: 20 }), // Added for display purposes
  images: text("images").array().notNull().default(sql`ARRAY[]::text[]`),
  logoUrl: varchar("logo_url"),
  address: text("address").notNull(),
  latitude: real("latitude").notNull(),
  longitude: real("longitude").notNull(),
  operatingHours: text("operating_hours"),
  priceRange: varchar("price_range", { length: 10 }), // $, $$, $$$
  specialOffer: text("special_offer"),
  approvalStatus: varchar("approval_status", { length: 20 }).notNull().default("pending"), // pending, approved, rejected
  approvedBy: varchar("approved_by").references(() => users.id),
  approvedAt: timestamp("approved_at"),
  isActive: boolean("is_active").notNull().default(true),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

export const servicesRelations = relations(services, ({ one, many }) => ({
  provider: one(users, {
    fields: [services.providerId],
    references: [users.id],
  }),
  reviews: many(reviews),
}));

// Bookings table
export const bookings = pgTable("bookings", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  userId: varchar("user_id").notNull().references(() => users.id, { onDelete: "cascade" }),
  tourId: varchar("tour_id").notNull().references(() => tours.id, { onDelete: "cascade" }),
  groupBookingId: varchar("group_booking_id").references(() => groupBookings.id, { onDelete: "set null" }), // Optional - links to group booking (Phase 5)
  bookingDate: timestamp("booking_date").notNull(),
  participants: integer("participants").notNull().default(1),
  totalAmount: decimal("total_amount", { precision: 10, scale: 2 }).notNull(),
  status: varchar("status", { length: 20 }).notNull().default("pending"), // pending, confirmed, cancelled, completed
  paymentStatus: varchar("payment_status", { length: 20 }).notNull().default("pending"), // pending, paid, refunded
  stripePaymentIntentId: varchar("stripe_payment_intent_id"),
  specialRequests: text("special_requests"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

export const bookingsRelations = relations(bookings, ({ one }) => ({
  user: one(users, {
    fields: [bookings.userId],
    references: [users.id],
  }),
  tour: one(tours, {
    fields: [bookings.tourId],
    references: [tours.id],
  }),
  groupBooking: one(groupBookings, {
    fields: [bookings.groupBookingId],
    references: [groupBookings.id],
  }),
}));

// Reviews table - for both tours and services
export const reviews = pgTable("reviews", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  userId: varchar("user_id").notNull().references(() => users.id, { onDelete: "cascade" }),
  tourId: varchar("tour_id").references(() => tours.id, { onDelete: "cascade" }),
  serviceId: varchar("service_id").references(() => services.id, { onDelete: "cascade" }),
  rating: integer("rating").notNull(), // 1-5
  comment: text("comment").notNull(),
  images: text("images").array().notNull().default(sql`ARRAY[]::text[]`),
  response: text("response"), // guide/provider response
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

export const reviewsRelations = relations(reviews, ({ one }) => ({
  user: one(users, {
    fields: [reviews.userId],
    references: [users.id],
  }),
  tour: one(tours, {
    fields: [reviews.tourId],
    references: [tours.id],
  }),
  service: one(services, {
    fields: [reviews.serviceId],
    references: [services.id],
  }),
}));

// Sponsorships table - for promoting tours and services
export const sponsorships = pgTable("sponsorships", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  userId: varchar("user_id").notNull().references(() => users.id, { onDelete: "cascade" }),
  tourId: varchar("tour_id").references(() => tours.id, { onDelete: "cascade" }),
  serviceId: varchar("service_id").references(() => services.id, { onDelete: "cascade" }),
  duration: varchar("duration", { length: 20 }).notNull(), // weekly, monthly
  price: decimal("price", { precision: 10, scale: 2 }).notNull(),
  status: varchar("status", { length: 20 }).notNull().default("pending"), // pending, active, expired, cancelled
  startsAt: timestamp("starts_at"),
  expiresAt: timestamp("expires_at"),
  stripePaymentIntentId: varchar("stripe_payment_intent_id"),
  stripeCheckoutSessionId: varchar("stripe_checkout_session_id"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

export const sponsorshipsRelations = relations(sponsorships, ({ one }) => ({
  user: one(users, {
    fields: [sponsorships.userId],
    references: [users.id],
  }),
  tour: one(tours, {
    fields: [sponsorships.tourId],
    references: [tours.id],
  }),
  service: one(services, {
    fields: [sponsorships.serviceId],
    references: [services.id],
  }),
}));

// Conversations table - for messaging system
export const conversations = pgTable("conversations", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  participant1Id: varchar("participant1_id").notNull().references(() => users.id, { onDelete: "cascade" }),
  participant2Id: varchar("participant2_id").notNull().references(() => users.id, { onDelete: "cascade" }),
  lastMessageAt: timestamp("last_message_at"),
  lastMessagePreview: text("last_message_preview"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
}, (table) => [
  index("idx_conversations_participant1").on(table.participant1Id),
  index("idx_conversations_participant2").on(table.participant2Id),
]);

export const conversationsRelations = relations(conversations, ({ one, many }) => ({
  participant1: one(users, { 
    fields: [conversations.participant1Id], 
    references: [users.id],
    relationName: "participant1Conversations",
  }),
  participant2: one(users, { 
    fields: [conversations.participant2Id], 
    references: [users.id],
    relationName: "participant2Conversations",
  }),
  messages: many(messages),
}));

// Messages table - for messaging system
export const messages = pgTable("messages", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  conversationId: varchar("conversation_id").notNull().references(() => conversations.id, { onDelete: "cascade" }),
  senderId: varchar("sender_id").notNull().references(() => users.id, { onDelete: "cascade" }),
  content: text("content").notNull(),
  isRead: boolean("is_read").default(false),
  readAt: timestamp("read_at"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
}, (table) => [
  index("idx_messages_conversation").on(table.conversationId),
  index("idx_messages_sender").on(table.senderId),
]);

export const messagesRelations = relations(messages, ({ one }) => ({
  conversation: one(conversations, { 
    fields: [messages.conversationId], 
    references: [conversations.id],
  }),
  sender: one(users, { 
    fields: [messages.senderId], 
    references: [users.id],
  }),
}));

// Subscriptions table - for premium features
export const subscriptions = pgTable("subscriptions", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  userId: varchar("user_id").notNull().references(() => users.id, { onDelete: "cascade" }).unique(),
  tier: varchar("tier", { length: 50 }).notNull(), // 'tourist-premium', 'guide-pro', 'free'
  stripeCustomerId: varchar("stripe_customer_id"),
  stripeSubscriptionId: varchar("stripe_subscription_id"),
  stripePriceId: varchar("stripe_price_id"),
  status: varchar("status", { length: 20 }).notNull().default("active"), // active, cancelled, expired, past_due
  currentPeriodStart: timestamp("current_period_start"),
  currentPeriodEnd: timestamp("current_period_end"),
  cancelAtPeriodEnd: boolean("cancel_at_period_end").default(false),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
}, (table) => [
  index("idx_subscriptions_user").on(table.userId),
  index("idx_subscriptions_stripe_customer").on(table.stripeCustomerId),
]);

export const subscriptionsRelations = relations(subscriptions, ({ one }) => ({
  user: one(users, { 
    fields: [subscriptions.userId], 
    references: [users.id],
  }),
}));

// Events table - local events created by any user
export const events = pgTable("events", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  
  // Ownership
  createdBy: varchar("created_by").notNull().references(() => users.id, { onDelete: "cascade" }),
  
  // Event details
  title: varchar("title", { length: 200 }).notNull(),
  description: text("description").notNull(),
  category: varchar("category", { length: 50 }).notNull(), // workshop, festival, excursion, meetup
  
  // Location
  locationName: varchar("location_name", { length: 200 }),
  latitude: real("latitude"),
  longitude: real("longitude"),
  
  // Timing
  startDate: timestamp("start_date").notNull(),
  endDate: timestamp("end_date").notNull(),
  
  // Capacity & Pricing
  isPrivate: boolean("is_private").default(false),
  maxParticipants: integer("max_participants"),
  isFree: boolean("is_free").default(true),
  ticketPrice: decimal("ticket_price", { precision: 10, scale: 2 }),
  currency: varchar("currency", { length: 3 }).default("EUR"),
  
  // Stripe
  stripeProductId: varchar("stripe_product_id", { length: 255 }),
  stripePriceId: varchar("stripe_price_id", { length: 255 }),
  
  // Media
  coverImage: varchar("cover_image", { length: 500 }),
  images: text("images").array().default(sql`ARRAY[]::text[]`),
  
  // Social
  hashtags: text("hashtags").array().default(sql`ARRAY[]::text[]`),
  
  // Status
  status: varchar("status", { length: 20 }).default("active"), // active, cancelled, completed
  
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

export const eventsRelations = relations(events, ({ one, many }) => ({
  creator: one(users, {
    fields: [events.createdBy],
    references: [users.id],
  }),
  participants: many(eventParticipants),
  posts: many(posts),
}));

// Event Participants table - RSVP and ticket purchases
export const eventParticipants = pgTable("event_participants", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  
  eventId: varchar("event_id").notNull().references(() => events.id, { onDelete: "cascade" }),
  userId: varchar("user_id").notNull().references(() => users.id, { onDelete: "cascade" }),
  
  // Ticket info
  ticketsPurchased: integer("tickets_purchased").default(1),
  totalAmount: decimal("total_amount", { precision: 10, scale: 2 }),
  
  // Stripe payment
  stripeSessionId: varchar("stripe_session_id", { length: 255 }),
  paymentStatus: varchar("payment_status", { length: 20 }).default("pending"), // pending, paid, refunded
  
  // Status
  status: varchar("status", { length: 20 }).default("confirmed"), // confirmed, cancelled, attended
  
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const eventParticipantsRelations = relations(eventParticipants, ({ one }) => ({
  event: one(events, {
    fields: [eventParticipants.eventId],
    references: [events.id],
  }),
  user: one(users, {
    fields: [eventParticipants.userId],
    references: [users.id],
  }),
}));

// Posts table - social feed posts
export const posts = pgTable("posts", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  
  // Ownership
  authorId: varchar("author_id").notNull().references(() => users.id, { onDelete: "cascade" }),
  
  // Content
  content: text("content").notNull(),
  images: text("images").array().default(sql`ARRAY[]::text[]`),
  
  // Context (optional - linked to tour/service/event)
  tourId: varchar("tour_id").references(() => tours.id, { onDelete: "set null" }),
  serviceId: varchar("service_id").references(() => services.id, { onDelete: "set null" }),
  eventId: varchar("event_id").references(() => events.id, { onDelete: "set null" }),
  
  // Social
  hashtags: text("hashtags").array().default(sql`ARRAY[]::text[]`),
  
  // Engagement counters (denormalized for performance)
  likesCount: integer("likes_count").default(0),
  commentsCount: integer("comments_count").default(0),
  
  // Status
  isPublic: boolean("is_public").default(true),
  moderationStatus: varchar("moderation_status", { length: 20 }).default("approved"), // pending, approved, rejected
  
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

export const postsRelations = relations(posts, ({ one, many }) => ({
  author: one(users, {
    fields: [posts.authorId],
    references: [users.id],
  }),
  tour: one(tours, {
    fields: [posts.tourId],
    references: [tours.id],
  }),
  service: one(services, {
    fields: [posts.serviceId],
    references: [services.id],
  }),
  event: one(events, {
    fields: [posts.eventId],
    references: [events.id],
  }),
  likes: many(postLikes),
  comments: many(postComments),
}));

// Post Likes table
export const postLikes = pgTable("post_likes", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  
  postId: varchar("post_id").notNull().references(() => posts.id, { onDelete: "cascade" }),
  userId: varchar("user_id").notNull().references(() => users.id, { onDelete: "cascade" }),
  
  createdAt: timestamp("created_at").defaultNow().notNull(),
}, (table) => ({
  uniqueUserPost: uniqueIndex("unique_user_post_like").on(table.postId, table.userId),
}));

export const postLikesRelations = relations(postLikes, ({ one }) => ({
  post: one(posts, {
    fields: [postLikes.postId],
    references: [posts.id],
  }),
  user: one(users, {
    fields: [postLikes.userId],
    references: [users.id],
  }),
}));

// Post Comments table
export const postComments = pgTable("post_comments", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  
  postId: varchar("post_id").notNull().references(() => posts.id, { onDelete: "cascade" }),
  authorId: varchar("author_id").notNull().references(() => users.id, { onDelete: "cascade" }),
  
  content: text("content").notNull(),
  
  // Nested comments (replies) - self-referential foreign key
  // Type assertion needed due to TypeScript circular reference limitation
  parentCommentId: varchar("parent_comment_id").references((): any => postComments.id, { onDelete: "cascade" }),
  
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

export const postCommentsRelations = relations(postComments, ({ one, many }) => ({
  post: one(posts, {
    fields: [postComments.postId],
    references: [posts.id],
  }),
  author: one(users, {
    fields: [postComments.authorId],
    references: [users.id],
  }),
  parentComment: one(postComments, {
    fields: [postComments.parentCommentId],
    references: [postComments.id],
    relationName: "commentReplies",
  }),
  replies: many(postComments, {
    relationName: "commentReplies",
  }),
}));

// API Keys table - for external partner authentication
export const apiKeys = pgTable("api_keys", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  
  // Partner info
  partnerId: varchar("partner_id").notNull().references(() => users.id, { onDelete: "cascade" }),
  name: varchar("name", { length: 200 }).notNull(), // Friendly name: "Acme Travel Agency API Key"
  
  // Key
  keyHash: varchar("key_hash", { length: 255 }).notNull().unique(), // SHA-256 hash of actual key
  keyPrefix: varchar("key_prefix", { length: 10 }).notNull(), // First 8 chars visible: "tc_live_abc123..."
  
  // Permissions & Limits
  permissions: text("permissions").array().notNull(), // ["read:tours", "write:bookings", "read:reviews"]
  rateLimit: integer("rate_limit").default(1000), // Requests per hour
  
  // Usage tracking
  requestsToday: integer("requests_today").default(0),
  lastUsedAt: timestamp("last_used_at"),
  
  // Status
  isActive: boolean("is_active").default(true),
  expiresAt: timestamp("expires_at"), // Optional expiration
  
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow()
});

export const apiKeysRelations = relations(apiKeys, ({ one }) => ({
  partner: one(users, {
    fields: [apiKeys.partnerId],
    references: [users.id],
  }),
}));

// Analytics Events table - for tracking user behavior and insights
export const analyticsEvents = pgTable("analytics_events", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  
  // Event info
  eventType: varchar("event_type", { length: 50 }).notNull(), // view, click, conversion, booking_attempt, etc.
  eventCategory: varchar("event_category", { length: 50 }).notNull(), // tour, service, event, post, profile
  
  // Context
  userId: varchar("user_id").references(() => users.id, { onDelete: "set null" }), // Can be null for anonymous
  sessionId: varchar("session_id", { length: 100 }),
  
  // Target (cosa è stato visualizzato/cliccato)
  targetId: varchar("target_id"), // ID del tour/service/event/post
  targetType: varchar("target_type", { length: 50 }), // tour, service, event, post
  
  // Metadata
  metadata: text("metadata"), // JSON string con extra data: {"source": "homepage", "position": 3}
  
  // Location & Device
  ipAddress: varchar("ip_address", { length: 45 }), // IPv4 or IPv6
  userAgent: text("user_agent"),
  referrer: varchar("referrer", { length: 500 }),
  
  // Geographic
  country: varchar("country", { length: 2 }), // ISO country code
  city: varchar("city", { length: 100 }),
  
  createdAt: timestamp("created_at").defaultNow()
});

export const analyticsEventsRelations = relations(analyticsEvents, ({ one }) => ({
  user: one(users, {
    fields: [analyticsEvents.userId],
    references: [users.id],
  }),
}));

// Likes table - for liking profiles, tours, and services (Phase 4)
export const likes = pgTable("likes", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  
  // User who liked (must be tourist)
  userId: varchar("user_id").notNull().references(() => users.id, { onDelete: "cascade" }),
  
  // Target (what was liked)
  targetId: varchar("target_id").notNull(), // ID of profile/tour/service
  targetType: varchar("target_type", { length: 20 }).notNull(), // profile, tour, service
  
  createdAt: timestamp("created_at").defaultNow().notNull()
}, (table) => [
  uniqueIndex("unique_like").on(table.userId, table.targetId, table.targetType),
  index("idx_likes_target").on(table.targetId, table.targetType)
]);

export const likesRelations = relations(likes, ({ one }) => ({
  user: one(users, {
    fields: [likes.userId],
    references: [users.id],
  }),
}));

// Trust Levels table - for guide/provider reputation (Phase 4)
export const trustLevelsTable = pgTable("trust_levels", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  
  // User (guide or provider)
  userId: varchar("user_id").notNull().unique().references(() => users.id, { onDelete: "cascade" }),
  
  // Trust level calculation
  level: varchar("level", { length: 20 }).notNull().default("explorer"), // explorer, pathfinder, trailblazer, navigator, legend
  score: integer("score").notNull().default(0), // (likes * 2) + (avg_rating * 10)
  likesCount: integer("likes_count").notNull().default(0),
  averageRating: decimal("average_rating", { precision: 3, scale: 2 }).default("0.00"),
  
  // Timestamps
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull()
});

export const trustLevelsTableRelations = relations(trustLevelsTable, ({ one }) => ({
  user: one(users, {
    fields: [trustLevelsTable.userId],
    references: [users.id],
  }),
}));

// Group Bookings table - for collaborative tour booking with dynamic pricing (Phase 5)
export const groupBookings = pgTable("group_bookings", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  
  // Tour reference
  tourId: varchar("tour_id").notNull().references(() => tours.id, { onDelete: "cascade" }),
  tourDate: timestamp("tour_date").notNull(), // Specific date for this group
  
  // Participant tracking
  maxParticipants: integer("max_participants").notNull(),
  minParticipants: integer("min_participants").notNull().default(2),
  currentParticipants: integer("current_participants").notNull().default(0),
  
  // Dynamic pricing
  basePricePerPerson: decimal("base_price_per_person", { precision: 10, scale: 2 }).notNull(),
  currentPricePerPerson: decimal("current_price_per_person", { precision: 10, scale: 2 }).notNull(),
  discountStep: decimal("discount_step", { precision: 10, scale: 2 }).notNull().default("5.00"), // Amount to discount per additional participant
  minPriceFloor: decimal("min_price_floor", { precision: 10, scale: 2 }).notNull(), // Minimum price (60% of base)
  
  // Status and sharing
  status: varchar("status", { length: 20 }).notNull().default("open"), // open, full, confirmed, closed, cancelled
  groupCode: varchar("group_code", { length: 12 }).notNull().unique(), // Unique invite code
  
  // Payment fields
  expiresAt: timestamp("expires_at"),
  stripeCheckoutSessionId: varchar("stripe_checkout_session_id"),
  stripePaymentStatus: varchar("stripe_payment_status", { length: 20 }).default("pending"),
  
  // Timestamps
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
}, (table) => [
  index("idx_group_bookings_tour").on(table.tourId),
  index("idx_group_bookings_status").on(table.status),
  index("idx_group_bookings_date").on(table.tourDate),
]);

export const groupBookingsRelations = relations(groupBookings, ({ one, many }) => ({
  tour: one(tours, {
    fields: [groupBookings.tourId],
    references: [tours.id],
  }),
  bookings: many(bookings),
}));

// User Rewards table - for gamification points and levels (Phase 6)
export const userRewards = pgTable("user_rewards", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  
  // User reference
  userId: varchar("user_id").notNull().unique().references(() => users.id, { onDelete: "cascade" }),
  
  // Points and level tracking
  totalPoints: integer("total_points").notNull().default(0),
  currentLevel: varchar("current_level", { length: 20 }).notNull().default("bronze"), // bronze, silver, gold, platinum, diamond
  
  // Streak tracking for consecutive activity
  currentStreak: integer("current_streak").notNull().default(0), // consecutive days
  longestStreak: integer("longest_streak").notNull().default(0),
  lastActivityDate: timestamp("last_activity_date"),
  
  // Achievement tracking
  achievementsUnlocked: text("achievements_unlocked").array().default(sql`ARRAY[]::text[]`),
  
  // Timestamps
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
}, (table) => [
  index("idx_user_rewards_user").on(table.userId),
  index("idx_user_rewards_level").on(table.currentLevel),
  index("idx_user_rewards_points").on(table.totalPoints),
]);

export const userRewardsRelations = relations(userRewards, ({ one, many }) => ({
  user: one(users, {
    fields: [userRewards.userId],
    references: [users.id],
  }),
  logs: many(rewardLogs),
}));

// Reward Logs table - for tracking point transactions (Phase 6)
export const rewardLogs = pgTable("reward_logs", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  
  // User reference
  userId: varchar("user_id").notNull().references(() => users.id, { onDelete: "cascade" }),
  
  // Transaction details
  points: integer("points").notNull(), // can be positive or negative
  action: varchar("action", { length: 50 }).notNull(), // booking, review, like, group_join, referral, etc.
  
  // Context metadata
  metadata: jsonb("metadata").$type<{
    tourId?: string;
    bookingId?: string;
    reviewId?: string;
    targetId?: string;
    description?: string;
  }>(),
  
  // Timestamps
  createdAt: timestamp("created_at").defaultNow().notNull(),
}, (table) => [
  index("idx_reward_logs_user").on(table.userId),
  index("idx_reward_logs_action").on(table.action),
  index("idx_reward_logs_created").on(table.createdAt),
]);

export const rewardLogsRelations = relations(rewardLogs, ({ one }) => ({
  user: one(users, {
    fields: [rewardLogs.userId],
    references: [users.id],
  }),
}));

// Referrals table - for tracking invite system (Phase 7.2)
export const referrals = pgTable("referrals", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  
  // Referrer (user who invited)
  referrerId: varchar("referrer_id").notNull().references(() => users.id, { onDelete: "cascade" }),
  
  // Referee (user who was invited) - null until they sign up
  refereeId: varchar("referee_id").references(() => users.id, { onDelete: "cascade" }),
  
  // Unique referral code (10 chars, alphanumeric)
  referralCode: varchar("referral_code", { length: 10 }).notNull().unique(),
  
  // Status tracking
  status: varchar("status", { length: 20 }).notNull().default("pending"), // pending, completed
  pointsAwarded: boolean("points_awarded").notNull().default(false),
  
  // Anti-abuse tracking
  refereeEmail: varchar("referee_email"), // Store email when sign-up happens
  refereeIp: varchar("referee_ip"), // IP address for abuse detection
  
  // Timestamps
  createdAt: timestamp("created_at").defaultNow().notNull(),
  completedAt: timestamp("completed_at"),
}, (table) => [
  index("idx_referrals_referrer").on(table.referrerId),
  index("idx_referrals_referee").on(table.refereeId),
  index("idx_referrals_code").on(table.referralCode),
  index("idx_referrals_status").on(table.status),
  // Unique constraint to prevent duplicate referrals from same email
  uniqueIndex("idx_referrals_email_unique").on(table.refereeEmail),
]);

export const referralsRelations = relations(referrals, ({ one }) => ({
  referrer: one(users, {
    fields: [referrals.referrerId],
    references: [users.id],
    relationName: "referrer",
  }),
  referee: one(users, {
    fields: [referrals.refereeId],
    references: [users.id],
    relationName: "referee",
  }),
}));

// Smart Groups table - for collaborative sharing of tours/services (Phase 8)
export const smartGroups = pgTable("smart_groups", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  
  // Creator
  creatorId: varchar("creator_id").notNull().references(() => users.id, { onDelete: "cascade" }),
  
  // Target (tour or service to share)
  tourId: varchar("tour_id").references(() => tours.id, { onDelete: "cascade" }),
  serviceId: varchar("service_id").references(() => services.id, { onDelete: "cascade" }),
  
  // Group details
  name: varchar("name", { length: 200 }).notNull(),
  description: text("description"),
  
  // Participants tracking
  targetParticipants: integer("target_participants").notNull(), // goal number of participants
  currentParticipants: integer("current_participants").notNull().default(1), // starts with creator
  
  // Status
  status: varchar("status", { length: 20 }).notNull().default("active"), // active, full, expired, completed
  
  // Location for map display
  latitude: real("latitude").notNull(),
  longitude: real("longitude").notNull(),
  
  // Invite system
  inviteCode: varchar("invite_code", { length: 10 }).notNull().unique(), // unique 10-char code
  expiresAt: timestamp("expires_at").notNull(), // 72h from creation
  
  // Timestamps
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
}, (table) => [
  index("idx_smart_groups_creator").on(table.creatorId),
  index("idx_smart_groups_tour").on(table.tourId),
  index("idx_smart_groups_service").on(table.serviceId),
  index("idx_smart_groups_status").on(table.status),
  index("idx_smart_groups_location").on(table.latitude, table.longitude),
  index("idx_smart_groups_expires").on(table.expiresAt),
]);

export const smartGroupsRelations = relations(smartGroups, ({ one, many }) => ({
  creator: one(users, {
    fields: [smartGroups.creatorId],
    references: [users.id],
  }),
  tour: one(tours, {
    fields: [smartGroups.tourId],
    references: [tours.id],
  }),
  service: one(services, {
    fields: [smartGroups.serviceId],
    references: [services.id],
  }),
  members: many(smartGroupMembers),
  messages: many(smartGroupMessages),
  invites: many(smartGroupInvites),
}));

// Smart Group Members table - tracks who joined each group (Phase 8)
export const smartGroupMembers = pgTable("smart_group_members", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  
  // Group and user
  groupId: varchar("group_id").notNull().references(() => smartGroups.id, { onDelete: "cascade" }),
  userId: varchar("user_id").notNull().references(() => users.id, { onDelete: "cascade" }),
  
  // Tracking
  invitedBy: varchar("invited_by").references(() => users.id, { onDelete: "set null" }), // who invited this member
  joinedAt: timestamp("joined_at").defaultNow().notNull(),
}, (table) => [
  index("idx_smart_group_members_group").on(table.groupId),
  index("idx_smart_group_members_user").on(table.userId),
  uniqueIndex("idx_smart_group_members_unique").on(table.groupId, table.userId), // prevent duplicate joins
]);

export const smartGroupMembersRelations = relations(smartGroupMembers, ({ one }) => ({
  group: one(smartGroups, {
    fields: [smartGroupMembers.groupId],
    references: [smartGroups.id],
  }),
  user: one(users, {
    fields: [smartGroupMembers.userId],
    references: [users.id],
  }),
  inviter: one(users, {
    fields: [smartGroupMembers.invitedBy],
    references: [users.id],
    relationName: "inviter",
  }),
}));

// Smart Group Messages table - chat within group (Phase 8)
export const smartGroupMessages = pgTable("smart_group_messages", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  
  // Group and sender
  groupId: varchar("group_id").notNull().references(() => smartGroups.id, { onDelete: "cascade" }),
  userId: varchar("user_id").notNull().references(() => users.id, { onDelete: "cascade" }),
  
  // Message content
  message: text("message").notNull(),
  
  // Timestamp
  createdAt: timestamp("created_at").defaultNow().notNull(),
}, (table) => [
  index("idx_smart_group_messages_group").on(table.groupId),
  index("idx_smart_group_messages_created").on(table.createdAt),
]);

export const smartGroupMessagesRelations = relations(smartGroupMessages, ({ one }) => ({
  group: one(smartGroups, {
    fields: [smartGroupMessages.groupId],
    references: [smartGroups.id],
  }),
  user: one(users, {
    fields: [smartGroupMessages.userId],
    references: [users.id],
  }),
}));

// Smart Group Invites table - tracks individual invite links (Phase 8)
export const smartGroupInvites = pgTable("smart_group_invites", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  
  // Group
  groupId: varchar("group_id").notNull().references(() => smartGroups.id, { onDelete: "cascade" }),
  
  // Invite code (unique per invite, different from group's main invite code)
  inviteCode: varchar("invite_code", { length: 10 }).notNull().unique(),
  
  // Creator and usage
  createdBy: varchar("created_by").notNull().references(() => users.id, { onDelete: "cascade" }),
  usedBy: varchar("used_by").references(() => users.id, { onDelete: "set null" }), // who used this invite
  usedAt: timestamp("used_at"),
  
  // Expiration
  expiresAt: timestamp("expires_at").notNull(), // inherits from group or shorter
  
  // Timestamp
  createdAt: timestamp("created_at").defaultNow().notNull(),
}, (table) => [
  index("idx_smart_group_invites_group").on(table.groupId),
  index("idx_smart_group_invites_code").on(table.inviteCode),
  index("idx_smart_group_invites_created_by").on(table.createdBy),
]);

export const smartGroupInvitesRelations = relations(smartGroupInvites, ({ one }) => ({
  group: one(smartGroups, {
    fields: [smartGroupInvites.groupId],
    references: [smartGroups.id],
  }),
  creator: one(users, {
    fields: [smartGroupInvites.createdBy],
    references: [users.id],
    relationName: "inviteCreator",
  }),
  user: one(users, {
    fields: [smartGroupInvites.usedBy],
    references: [users.id],
    relationName: "inviteUser",
  }),
}));

// AI Logs table - Track AI interactions with GDPR compliance (Phase 9)
export const aiLogs = pgTable("ai_logs", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  
  // User and group references
  userId: varchar("user_id").notNull().references(() => users.id, { onDelete: "cascade" }),
  groupId: varchar("group_id").references(() => smartGroups.id, { onDelete: "set null" }),
  
  // AI action details
  actionType: varchar("action_type", { length: 50 }).notNull(), // meeting_suggestion, translation, summary, reminder, coordination
  
  // Input/Output data (GDPR: NO sensitive data in inputData)
  inputData: jsonb("input_data").notNull().$type<{
    query?: string;
    context?: string;
    preferences?: Record<string, any>;
  }>(),
  outputData: jsonb("output_data").notNull().$type<{
    response?: string;
    suggestions?: any[];
    translation?: string;
    summary?: string;
  }>(),
  
  // GDPR compliance
  userConsent: boolean("user_consent").notNull().default(false),
  
  // Language for translation
  language: varchar("language", { length: 10 }),
  
  // Additional metadata
  metadata: jsonb("metadata").$type<{
    model?: string;
    tokens?: number;
    duration?: number;
    [key: string]: any;
  }>(),
  
  // Timestamp
  createdAt: timestamp("created_at").defaultNow().notNull(),
}, (table) => [
  index("idx_ai_logs_user").on(table.userId),
  index("idx_ai_logs_group").on(table.groupId),
  index("idx_ai_logs_action_type").on(table.actionType),
  index("idx_ai_logs_created").on(table.createdAt),
]);

export const aiLogsRelations = relations(aiLogs, ({ one }) => ({
  user: one(users, {
    fields: [aiLogs.userId],
    references: [users.id],
  }),
  group: one(smartGroups, {
    fields: [aiLogs.groupId],
    references: [smartGroups.id],
  }),
}));

// Group Events table - Store reminders, meetings, schedules (Phase 9)
export const groupEvents = pgTable("group_events", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  
  // Group and creator references
  groupId: varchar("group_id").notNull().references(() => smartGroups.id, { onDelete: "cascade" }),
  creatorId: varchar("creator_id").notNull().references(() => users.id, { onDelete: "cascade" }),
  
  // Event details
  eventType: varchar("event_type", { length: 20 }).notNull(), // reminder, meeting, schedule
  title: varchar("title", { length: 200 }).notNull(),
  description: text("description"),
  
  // Timing
  eventDate: timestamp("event_date").notNull(),
  
  // Location (for meeting points)
  location: text("location"),
  latitude: real("latitude"),
  longitude: real("longitude"),
  
  // Notification system
  notificationTimes: jsonb("notification_times").$type<string[]>(), // array of ISO timestamps
  
  // Status
  status: varchar("status", { length: 20 }).notNull().default("pending"), // pending, notified, completed, cancelled
  
  // Timestamps
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
}, (table) => [
  index("idx_group_events_group").on(table.groupId),
  index("idx_group_events_creator").on(table.creatorId),
  index("idx_group_events_event_date").on(table.eventDate),
  index("idx_group_events_status").on(table.status),
  index("idx_group_events_created").on(table.createdAt),
]);

export const groupEventsRelations = relations(groupEvents, ({ one }) => ({
  group: one(smartGroups, {
    fields: [groupEvents.groupId],
    references: [smartGroups.id],
  }),
  creator: one(users, {
    fields: [groupEvents.creatorId],
    references: [users.id],
  }),
}));

// Partnerships table - Monetization system for guides/providers (Phase 10)
export const partnerships = pgTable("partnerships", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  userId: varchar("user_id").notNull().references(() => users.id, { onDelete: "cascade" }),
  tier: varchar("tier", { length: 20 }).notNull(), // 'standard', 'premium', 'pro'
  status: varchar("status", { length: 20 }).notNull().default('active'), // 'active', 'cancelled', 'expired'
  
  // Stripe integration
  stripeSubscriptionId: varchar("stripe_subscription_id"),
  stripeCustomerId: varchar("stripe_customer_id"),
  stripePriceId: varchar("stripe_price_id"),
  
  // Dates
  startDate: timestamp("start_date").notNull().defaultNow(),
  endDate: timestamp("end_date"),
  cancelledAt: timestamp("cancelled_at"),
  
  // Analytics (JSONB)
  analytics: jsonb("analytics").$type<{
    profileViews: number;
    tourViews: number;
    serviceViews: number;
    clicks: number;
    conversions: number;
    likes: number;
    reviews: number;
  }>().default(sql`'{}'::jsonb`),
  
  createdAt: timestamp("created_at").notNull().defaultNow(),
  updatedAt: timestamp("updated_at").notNull().defaultNow()
}, (table) => [
  index("idx_partnerships_user").on(table.userId),
  index("idx_partnerships_status").on(table.status),
]);

export const partnershipsRelations = relations(partnerships, ({ one }) => ({
  user: one(users, {
    fields: [partnerships.userId],
    references: [users.id],
  }),
}));

// Search Logs table - Track search queries and interactions (Phase 10)
export const searchLogs = pgTable("search_logs", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  userId: varchar("user_id").references(() => users.id, { onDelete: "set null" }),
  
  // Search details
  query: text("query").notNull(),
  searchType: varchar("search_type", { length: 20 }), // 'guide', 'tour', 'service', 'all'
  resultsCount: integer("results_count").notNull().default(0),
  
  // User interaction
  clicked: boolean("clicked").default(false),
  clickedEntityId: varchar("clicked_entity_id"),
  clickedEntityType: varchar("clicked_entity_type", { length: 20 }),
  
  // Metadata
  filters: jsonb("filters").$type<{
    city?: string;
    language?: string;
    priceMin?: number;
    priceMax?: number;
    rating?: number;
    availability?: boolean;
  }>(),
  
  createdAt: timestamp("created_at").notNull().defaultNow()
}, (table) => [
  index("idx_search_logs_user").on(table.userId),
  index("idx_search_logs_created").on(table.createdAt),
  index("idx_search_logs_query").on(table.query),
]);

// Embeddings table - Semantic search with vector embeddings (Phase 10)
export const embeddings = pgTable("embeddings", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  entityId: varchar("entity_id").notNull(),
  entityType: varchar("entity_type", { length: 20 }).notNull(), // 'guide', 'tour', 'service'
  
  // Content for semantic search
  content: text("content").notNull(), // Concatenated searchable text
  
  // OpenAI embedding (1536 dimensions for text-embedding-3-small)
  // Note: This will be stored as text if pgvector is not available
  embedding: text("embedding").notNull(), // JSON array of numbers or pgvector type
  
  // Metadata
  language: varchar("language", { length: 5 }),
  lastUpdated: timestamp("last_updated").notNull().defaultNow(),
  
  createdAt: timestamp("created_at").notNull().defaultNow()
}, (table) => [
  index("idx_embeddings_entity").on(table.entityId, table.entityType),
  index("idx_embeddings_type").on(table.entityType),
]);

// Content Reports table - for moderation
export const contentReports = pgTable("content_reports", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  
  // Reported content
  contentType: varchar("content_type", { length: 20 }).notNull(), // post, comment, user, tour, service
  contentId: varchar("content_id").notNull(),
  
  // Reporter
  reporterId: varchar("reporter_id").notNull().references(() => users.id, { onDelete: "cascade" }),
  
  // Report details
  reason: varchar("reason", { length: 50 }).notNull(), // spam, inappropriate, offensive, fraud, other
  description: text("description"),
  
  // Moderation status
  status: varchar("status", { length: 20 }).default("pending"), // pending, reviewed, actioned, dismissed
  reviewedBy: varchar("reviewed_by").references(() => users.id, { onDelete: "set null" }),
  reviewedAt: timestamp("reviewed_at"),
  actionTaken: text("action_taken"),
  
  createdAt: timestamp("created_at").defaultNow().notNull(),
}, (table) => [
  index("idx_content_reports_reporter").on(table.reporterId),
  index("idx_content_reports_status").on(table.status),
  index("idx_content_reports_content").on(table.contentType, table.contentId),
]);

export const contentReportsRelations = relations(contentReports, ({ one }) => ({
  reporter: one(users, {
    fields: [contentReports.reporterId],
    references: [users.id],
    relationName: "reportsMade",
  }),
  reviewer: one(users, {
    fields: [contentReports.reviewedBy],
    references: [users.id],
    relationName: "reportsReviewed",
  }),
}));

// Notifications table
export const notifications = pgTable("notifications", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  
  userId: varchar("user_id").notNull().references(() => users.id, { onDelete: "cascade" }),
  
  type: varchar("type", { length: 30 }).notNull(), // comment, like, group_invite, group_almost_full, group_confirmed, reply
  title: text("title").notNull(),
  message: text("message").notNull(),
  
  // Link to related content
  relatedId: varchar("related_id"),
  relatedType: varchar("related_type", { length: 20 }), // post, comment, group, tour
  
  isRead: boolean("is_read").default(false),
  readAt: timestamp("read_at"),
  
  createdAt: timestamp("created_at").defaultNow().notNull(),
}, (table) => [
  index("idx_notifications_user").on(table.userId),
  index("idx_notifications_unread").on(table.userId, table.isRead),
]);

export const notificationsRelations = relations(notifications, ({ one }) => ({
  user: one(users, {
    fields: [notifications.userId],
    references: [users.id],
  }),
}));

// Partners table (Phase 12 - Business Integration)
export const partners = pgTable("partners", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  ownerUserId: varchar("owner_user_id").notNull().references(() => users.id, { onDelete: "cascade" }),
  
  type: varchar("type", { length: 20 }).notNull(), // agency, hotel, dmo, ota, transport
  name: text("name").notNull(),
  logoUrl: varchar("logo_url"),
  description: text("description"),
  
  verified: boolean("verified").default(false),
  regions: text("regions").array().default(sql`ARRAY[]::text[]`), // served regions
  languages: text("languages").array().default(sql`ARRAY[]::text[]`), // supported languages
  
  contactEmail: varchar("contact_email"),
  phone: varchar("phone", { length: 50 }),
  website: varchar("website"),
  documentsUrl: text("documents_url").array().default(sql`ARRAY[]::text[]`), // KYC documents
  
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
}, (table) => [
  index("idx_partners_owner").on(table.ownerUserId),
  index("idx_partners_type").on(table.type),
  index("idx_partners_verified").on(table.verified),
]);

export const partnersRelations = relations(partners, ({ one, many }) => ({
  owner: one(users, {
    fields: [partners.ownerUserId],
    references: [users.id],
  }),
  packages: many(packages),
  account: one(partnerAccounts),
  payouts: many(payouts),
  coupons: many(coupons),
  affiliateLinks: many(affiliateLinks),
  connectors: many(externalConnectors),
}));

// Packages table (Phase 12 - Dynamic Bundling)
export const packages = pgTable("packages", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  partnerId: varchar("partner_id").notNull().references(() => partners.id, { onDelete: "cascade" }),
  
  title: text("title").notNull(),
  description: text("description").notNull(),
  
  // Package items: [{type: 'tour|service|transport', id: 'uuid', quantity: 1}]
  items: jsonb("items").$type<Array<{type: string; id: string; quantity: number}>>().notNull(),
  
  basePrice: decimal("base_price", { precision: 10, scale: 2 }).notNull(),
  
  // Discount rules: {type: 'percentage|fixed', value: 10, minParticipants: 2}
  discountRules: jsonb("discount_rules").$type<{type: string; value: number; minParticipants?: number}>(),
  
  cancellationPolicy: text("cancellation_policy"),
  
  // Availability: {dates: ['2025-01-15', ...], maxBookings: 10}
  availability: jsonb("availability").$type<{dates?: string[]; maxBookings?: number}>(),
  
  isActive: boolean("is_active").default(true),
  
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
}, (table) => [
  index("idx_packages_partner").on(table.partnerId),
  index("idx_packages_active").on(table.isActive),
]);

export const packagesRelations = relations(packages, ({ one, many }) => ({
  partner: one(partners, {
    fields: [packages.partnerId],
    references: [partners.id],
  }),
  bookings: many(packageBookings),
}));

// Package Bookings table (Phase 12)
export const packageBookings = pgTable("package_bookings", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  packageId: varchar("package_id").notNull().references(() => packages.id, { onDelete: "cascade" }),
  userId: varchar("user_id").notNull().references(() => users.id, { onDelete: "cascade" }),
  
  participants: integer("participants").notNull().default(1),
  totalPrice: decimal("total_price", { precision: 10, scale: 2 }).notNull(),
  discountApplied: decimal("discount_applied", { precision: 10, scale: 2 }).default('0'),
  
  couponCode: varchar("coupon_code"),
  affiliateCode: varchar("affiliate_code"),
  
  status: varchar("status", { length: 20 }).notNull().default("pending"), // pending, confirmed, cancelled, completed
  paymentStatus: varchar("payment_status", { length: 20 }).notNull().default("pending"), // pending, paid, refunded, failed
  
  stripePaymentIntentId: varchar("stripe_payment_intent_id"),
  specialRequests: text("special_requests"),
  
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
}, (table) => [
  index("idx_package_bookings_package").on(table.packageId),
  index("idx_package_bookings_user").on(table.userId),
  index("idx_package_bookings_status").on(table.status),
]);

export const packageBookingsRelations = relations(packageBookings, ({ one }) => ({
  package: one(packages, {
    fields: [packageBookings.packageId],
    references: [packages.id],
  }),
  user: one(users, {
    fields: [packageBookings.userId],
    references: [users.id],
  }),
}));

// Partner Accounts table (Phase 12 - Stripe Connect)
export const partnerAccounts = pgTable("partner_accounts", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  partnerId: varchar("partner_id").notNull().unique().references(() => partners.id, { onDelete: "cascade" }),
  
  stripeAccountId: varchar("stripe_account_id").unique(),
  status: varchar("status", { length: 20 }).notNull().default("pending"), // pending, active, suspended
  onboardingComplete: boolean("onboarding_complete").default(false),
  
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
}, (table) => [
  index("idx_partner_accounts_partner").on(table.partnerId),
  index("idx_partner_accounts_stripe").on(table.stripeAccountId),
]);

export const partnerAccountsRelations = relations(partnerAccounts, ({ one }) => ({
  partner: one(partners, {
    fields: [partnerAccounts.partnerId],
    references: [partners.id],
  }),
}));

// Payouts table (Phase 12 - Revenue Sharing)
export const payouts = pgTable("payouts", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  partnerId: varchar("partner_id").notNull().references(() => partners.id, { onDelete: "cascade" }),
  
  amount: decimal("amount", { precision: 10, scale: 2 }).notNull(),
  currency: varchar("currency", { length: 3 }).notNull().default("eur"),
  
  status: varchar("status", { length: 20 }).notNull().default("pending"), // pending, processing, completed, failed
  
  periodStart: timestamp("period_start").notNull(),
  periodEnd: timestamp("period_end").notNull(),
  
  stripePayoutId: varchar("stripe_payout_id"),
  
  createdAt: timestamp("created_at").defaultNow().notNull(),
  processedAt: timestamp("processed_at"),
}, (table) => [
  index("idx_payouts_partner").on(table.partnerId),
  index("idx_payouts_status").on(table.status),
  index("idx_payouts_period").on(table.periodStart, table.periodEnd),
]);

export const payoutsRelations = relations(payouts, ({ one }) => ({
  partner: one(partners, {
    fields: [payouts.partnerId],
    references: [partners.id],
  }),
}));

// Coupons table (Phase 12)
export const coupons = pgTable("coupons", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  code: varchar("code", { length: 50 }).notNull().unique(),
  partnerId: varchar("partner_id").references(() => partners.id, { onDelete: "cascade" }),
  
  type: varchar("type", { length: 20 }).notNull(), // percentage, fixed
  value: decimal("value", { precision: 10, scale: 2 }).notNull(),
  
  validFrom: timestamp("valid_from").notNull(),
  validTo: timestamp("valid_to").notNull(),
  
  usageLimit: integer("usage_limit"),
  usageCount: integer("usage_count").default(0),
  
  isActive: boolean("is_active").default(true),
  
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
}, (table) => [
  index("idx_coupons_code").on(table.code),
  index("idx_coupons_partner").on(table.partnerId),
  index("idx_coupons_active").on(table.isActive),
]);

export const couponsRelations = relations(coupons, ({ one }) => ({
  partner: one(partners, {
    fields: [coupons.partnerId],
    references: [partners.id],
  }),
}));

// Affiliate Links table (Phase 12)
export const affiliateLinks = pgTable("affiliate_links", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  partnerId: varchar("partner_id").notNull().references(() => partners.id, { onDelete: "cascade" }),
  userId: varchar("user_id").references(() => users.id, { onDelete: "set null" }), // affiliate owner (influencer/blogger)
  
  affiliateCode: varchar("affiliate_code", { length: 50 }).notNull().unique(),
  commissionPct: decimal("commission_pct", { precision: 5, scale: 2 }).notNull(), // 5.00 = 5%
  
  clicks: integer("clicks").default(0),
  conversions: integer("conversions").default(0),
  revenue: decimal("revenue", { precision: 10, scale: 2 }).default('0'),
  
  isActive: boolean("is_active").default(true),
  
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
}, (table) => [
  index("idx_affiliate_links_partner").on(table.partnerId),
  index("idx_affiliate_links_code").on(table.affiliateCode),
  index("idx_affiliate_links_user").on(table.userId),
]);

export const affiliateLinksRelations = relations(affiliateLinks, ({ one }) => ({
  partner: one(partners, {
    fields: [affiliateLinks.partnerId],
    references: [partners.id],
  }),
  user: one(users, {
    fields: [affiliateLinks.userId],
    references: [users.id],
  }),
}));

// External Connectors table (Phase 12 - OTA/DMO Integration)
export const externalConnectors = pgTable("external_connectors", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  partnerId: varchar("partner_id").notNull().references(() => partners.id, { onDelete: "cascade" }),
  
  connectorType: varchar("connector_type", { length: 20 }).notNull(), // ota, dmo, custom
  name: text("name").notNull(),
  
  apiEndpoint: varchar("api_endpoint"),
  apiKey: text("api_key"), // Should be encrypted
  webhookUrl: varchar("webhook_url"),
  
  status: varchar("status", { length: 20 }).notNull().default("active"), // active, inactive, error
  lastSyncAt: timestamp("last_sync_at"),
  
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
}, (table) => [
  index("idx_external_connectors_partner").on(table.partnerId),
  index("idx_external_connectors_type").on(table.connectorType),
]);

export const externalConnectorsRelations = relations(externalConnectors, ({ one, many }) => ({
  partner: one(partners, {
    fields: [externalConnectors.partnerId],
    references: [partners.id],
  }),
  inventoryMaps: many(externalInventoryMap),
}));

// External Inventory Map table (Phase 12 - Inventory Sync)
export const externalInventoryMap = pgTable("external_inventory_map", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  connectorId: varchar("connector_id").notNull().references(() => externalConnectors.id, { onDelete: "cascade" }),
  
  externalId: varchar("external_id").notNull(), // ID in external system
  localType: varchar("local_type", { length: 20 }).notNull(), // tour, service, package
  localId: varchar("local_id").notNull(), // ID in TourConnect
  
  lastSyncAt: timestamp("last_sync_at"),
  syncStatus: varchar("sync_status", { length: 20 }).default("synced"), // synced, pending, error
  
  createdAt: timestamp("created_at").defaultNow().notNull(),
}, (table) => [
  index("idx_inventory_map_connector").on(table.connectorId),
  index("idx_inventory_map_external").on(table.externalId),
  index("idx_inventory_map_local").on(table.localType, table.localId),
  uniqueIndex("idx_inventory_map_unique").on(table.connectorId, table.externalId),
]);

export const externalInventoryMapRelations = relations(externalInventoryMap, ({ one }) => ({
  connector: one(externalConnectors, {
    fields: [externalInventoryMap.connectorId],
    references: [externalConnectors.id],
  }),
}));

// Audit Logs table (Phase 12 - Security & Compliance)
export const auditLogs = pgTable("audit_logs", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  userId: varchar("user_id").references(() => users.id, { onDelete: "set null" }),
  
  action: varchar("action", { length: 50 }).notNull(), // create, update, delete, payment, payout, etc.
  entityType: varchar("entity_type", { length: 50 }).notNull(), // partner, package, booking, payout, etc.
  entityId: varchar("entity_id"),
  
  changes: jsonb("changes").$type<{before?: any; after?: any; metadata?: any}>(),
  
  ipAddress: varchar("ip_address", { length: 45 }),
  userAgent: text("user_agent"),
  
  createdAt: timestamp("created_at").defaultNow().notNull(),
}, (table) => [
  index("idx_audit_logs_user").on(table.userId),
  index("idx_audit_logs_entity").on(table.entityType, table.entityId),
  index("idx_audit_logs_action").on(table.action),
  index("idx_audit_logs_created").on(table.createdAt),
]);

export const auditLogsRelations = relations(auditLogs, ({ one }) => ({
  user: one(users, {
    fields: [auditLogs.userId],
    references: [users.id],
  }),
}));

// Zod schemas for validation
export const insertUserSchema = createInsertSchema(users).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export const updateProfileSchema = z.object({
  firstName: z.string().min(1).max(50).optional(),
  lastName: z.string().min(1).max(50).optional(),
  profileImageUrl: z.string().url().optional().nullable(),
  bio: z.string().max(1000).optional().nullable(),
  phone: z.string().max(50).optional().nullable(),
  country: z.string().max(100).optional().nullable(),
  city: z.string().max(100).optional().nullable(),
  // Guide fields
  guideLanguages: z.array(z.string()).max(10).optional().nullable(),
  guideSpecialties: z.array(z.string()).max(10).optional().nullable(),
  guideExperience: z.number().int().min(0).max(50).optional().nullable(),
  guideLicenseNumber: z.string().max(100).optional().nullable(),
  // Provider fields
  businessName: z.string().max(200).optional().nullable(),
  businessType: z.string().max(50).optional().nullable(),
  businessAddress: z.string().max(500).optional().nullable(),
  website: z.string().url().optional().nullable(),
  // Social links
  socialLinks: z.object({
    facebook: z.string().url().optional().or(z.literal('')),
    instagram: z.string().url().optional().or(z.literal('')),
    twitter: z.string().url().optional().or(z.literal('')),
    website: z.string().url().optional().or(z.literal(''))
  }).optional().nullable(),
});

export const insertTourSchema = createInsertSchema(tours).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
}).extend({
  title: z.string().min(3).max(100),
  description: z.string().min(50).max(5000),
  images: z.array(z.string().url()).max(10),
  included: z.array(z.string()).max(20),
  excluded: z.array(z.string()).max(20),
  languages: z.array(z.string()).max(10),
  price: z.string().refine((val) => {
    const num = parseFloat(val);
    return !isNaN(num) && num >= 0 && num <= 100000;
  }, { message: "Price must be between 0 and 100000" }),
  maxGroupSize: z.number().int().min(1).max(100),
});

export const insertServiceSchema = createInsertSchema(services).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
}).extend({
  name: z.string().min(3).max(100),
  description: z.string().min(20).max(2000),
  images: z.array(z.string().url()).max(10),
  amenities: z.array(z.string()).max(20),
});

export const insertBookingSchema = createInsertSchema(bookings).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export const insertReviewSchema = createInsertSchema(reviews).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export const insertSponsorshipSchema = createInsertSchema(sponsorships).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
}).extend({
  duration: z.enum(sponsorshipDurations),
  tourId: z.string().optional().nullable(),
  serviceId: z.string().optional().nullable(),
}).refine((data) => data.tourId || data.serviceId, {
  message: "Either tourId or serviceId must be provided",
});

// Conversations
export const insertConversationSchema = createInsertSchema(conversations).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

// Messages
export const insertMessageSchema = createInsertSchema(messages).omit({
  id: true,
  createdAt: true,
});

// Subscriptions
export const insertSubscriptionSchema = createInsertSchema(subscriptions).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

// Events
export const insertEventSchema = createInsertSchema(events).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

// Event Participants
export const insertEventParticipantSchema = createInsertSchema(eventParticipants).omit({
  id: true,
  createdAt: true,
});

// Posts
export const insertPostSchema = createInsertSchema(posts).omit({
  id: true,
  likesCount: true,
  commentsCount: true,
  createdAt: true,
  updatedAt: true,
});

// Post Likes
export const insertPostLikeSchema = createInsertSchema(postLikes).omit({
  id: true,
  createdAt: true,
});

// Post Comments
export const insertPostCommentSchema = createInsertSchema(postComments).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

// API Keys
export const insertApiKeySchema = createInsertSchema(apiKeys).omit({
  id: true,
  requestsToday: true,
  lastUsedAt: true,
  createdAt: true,
  updatedAt: true,
});

// Analytics Events
export const insertAnalyticsEventSchema = createInsertSchema(analyticsEvents).omit({
  id: true,
  createdAt: true,
});

// Likes (Phase 4)
export const insertLikeSchema = createInsertSchema(likes).omit({
  id: true,
  createdAt: true,
});

// Trust Levels (Phase 4)
export const insertTrustLevelSchema = createInsertSchema(trustLevelsTable).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

// Group Bookings (Phase 5)
export const insertGroupBookingSchema = createInsertSchema(groupBookings).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
  currentParticipants: true, // Auto-calculated
  currentPricePerPerson: true, // Auto-calculated
}).extend({
  basePricePerPerson: z.string().refine((val) => {
    const num = parseFloat(val);
    return !isNaN(num) && num >= 0 && num <= 100000;
  }, { message: "Base price must be between 0 and 100000" }),
  discountStep: z.string().refine((val) => {
    const num = parseFloat(val);
    return !isNaN(num) && num >= 0 && num <= 1000;
  }, { message: "Discount step must be between 0 and 1000" }).optional(),
});

// User Rewards (Phase 6)
export const insertUserRewardSchema = createInsertSchema(userRewards).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

// Reward Logs (Phase 6)
export const insertRewardLogSchema = createInsertSchema(rewardLogs).omit({
  id: true,
  createdAt: true,
});

export const awardPointsSchema = z.object({
  action: z.enum(['booking', 'review', 'like', 'group_join', 'referral', 'tour_complete', 'profile_complete', 'first_booking', 'streak_bonus', 'smart_group_create', 'smart_group_join', 'smart_group_complete', 'smart_group_invite', 'ai_reminder_create', 'ai_coordination', 'ai_summary_share', 'search_like', 'search_review', 'subscription_complete', 'partnership_confirmed']),
  metadata: z.object({
    tourId: z.string().optional(),
    bookingId: z.string().optional(),
    reviewId: z.string().optional(),
    targetId: z.string().optional(),
    description: z.string().optional(),
  }).optional(),
});

// Referrals (Phase 7.2)
export const insertReferralSchema = createInsertSchema(referrals).omit({
  id: true,
  createdAt: true,
  completedAt: true,
});

export const validateReferralCodeSchema = z.object({
  code: z.string().length(10, "Referral code must be exactly 10 characters"),
});

// Smart Groups (Phase 8)
export const insertSmartGroupSchema = createInsertSchema(smartGroups).omit({
  id: true,
  currentParticipants: true, // auto-managed
  inviteCode: true, // auto-generated
  createdAt: true,
  updatedAt: true,
}).extend({
  name: z.string().min(3).max(200),
  description: z.string().max(1000).optional(),
  targetParticipants: z.number().int().min(2).max(50),
}).refine((data) => data.tourId || data.serviceId, {
  message: "Either tourId or serviceId must be provided",
});

export const insertSmartGroupMemberSchema = createInsertSchema(smartGroupMembers).omit({
  id: true,
  joinedAt: true,
});

export const insertSmartGroupMessageSchema = createInsertSchema(smartGroupMessages).omit({
  id: true,
  createdAt: true,
}).extend({
  message: z.string().min(1).max(500),
});

export const insertSmartGroupInviteSchema = createInsertSchema(smartGroupInvites).omit({
  id: true,
  inviteCode: true, // auto-generated
  usedBy: true,
  usedAt: true,
  createdAt: true,
});

// AI Logs (Phase 9)
export const insertAILogSchema = createInsertSchema(aiLogs).omit({
  id: true,
  createdAt: true,
}).extend({
  actionType: z.enum(aiActionTypes),
  userConsent: z.boolean().default(false),
  language: z.string().max(10).optional().nullable(),
});

// Group Events (Phase 9)
export const insertGroupEventSchema = createInsertSchema(groupEvents).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
}).extend({
  eventType: z.enum(groupEventTypes),
  title: z.string().min(1).max(200),
  description: z.string().max(1000).optional().nullable(),
  status: z.enum(groupEventStatuses).default("pending"),
});

// Partnerships (Phase 10)
export const insertPartnershipSchema = createInsertSchema(partnerships).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
}).extend({
  tier: z.enum(['standard', 'premium', 'pro']),
  status: z.enum(['active', 'cancelled', 'expired']).default('active'),
});

// Search Logs (Phase 10)
export const insertSearchLogSchema = createInsertSchema(searchLogs).omit({
  id: true,
  createdAt: true,
});

// Embeddings (Phase 10)
export const insertEmbeddingSchema = createInsertSchema(embeddings).omit({
  id: true,
  createdAt: true,
}).extend({
  entityType: z.enum(['guide', 'tour', 'service']),
  content: z.string().min(1),
  embedding: z.string(), // JSON string of number array
  language: z.string().max(5).optional().nullable(),
});

// Content Reports
export const insertContentReportSchema = createInsertSchema(contentReports).omit({
  id: true,
  status: true,
  reviewedBy: true,
  reviewedAt: true,
  actionTaken: true,
  createdAt: true,
}).extend({
  contentType: z.enum(['post', 'comment', 'user', 'tour', 'service']),
  reason: z.enum(['spam', 'inappropriate', 'offensive', 'fraud', 'other']),
  description: z.string().max(1000).optional().nullable(),
});

// Notifications
export const insertNotificationSchema = createInsertSchema(notifications).omit({
  id: true,
  isRead: true,
  readAt: true,
  createdAt: true,
}).extend({
  type: z.enum(['comment', 'like', 'group_invite', 'group_almost_full', 'group_confirmed', 'reply', 'partner_verified']),
  title: z.string().min(1).max(200),
  message: z.string().min(1).max(500),
});

// Partners (Phase 12)
export const insertPartnerSchema = createInsertSchema(partners).omit({
  id: true,
  verified: true,
  createdAt: true,
  updatedAt: true,
}).extend({
  type: z.enum(partnerTypes),
  name: z.string().min(3).max(200),
  description: z.string().max(2000).optional().nullable(),
  contactEmail: z.string().email().optional().nullable(),
});

// Packages (Phase 12)
export const insertPackageSchema = createInsertSchema(packages).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
}).extend({
  title: z.string().min(3).max(200),
  description: z.string().min(20).max(5000),
  items: z.array(z.object({
    type: z.enum(packageItemTypes),
    id: z.string().uuid(),
    quantity: z.number().int().min(1).max(100),
  })).min(1).max(20),
  basePrice: z.string().refine((val) => {
    const num = parseFloat(val);
    return !isNaN(num) && num >= 0 && num <= 1000000;
  }),
});

// Package Bookings (Phase 12)
export const insertPackageBookingSchema = createInsertSchema(packageBookings).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

// Coupons (Phase 12)
export const insertCouponSchema = createInsertSchema(coupons).omit({
  id: true,
  usageCount: true,
  createdAt: true,
  updatedAt: true,
}).extend({
  code: z.string().min(3).max(50).toUpperCase(),
  type: z.enum(couponTypes),
  value: z.string().refine((val) => parseFloat(val) > 0),
});

// Affiliate Links (Phase 12)
export const insertAffiliateLinkSchema = createInsertSchema(affiliateLinks).omit({
  id: true,
  clicks: true,
  conversions: true,
  revenue: true,
  createdAt: true,
  updatedAt: true,
}).extend({
  affiliateCode: z.string().min(3).max(50).toUpperCase(),
  commissionPct: z.string().refine((val) => {
    const num = parseFloat(val);
    return num >= 0 && num <= 100;
  }),
});

// External Connectors (Phase 12)
export const insertExternalConnectorSchema = createInsertSchema(externalConnectors).omit({
  id: true,
  lastSyncAt: true,
  createdAt: true,
  updatedAt: true,
}).extend({
  connectorType: z.enum(connectorTypes),
  name: z.string().min(3).max(200),
});

// Audit Logs (Phase 12)
export const insertAuditLogSchema = createInsertSchema(auditLogs).omit({
  id: true,
  createdAt: true,
});

// Group Booking API validation schemas
export const joinGroupBookingSchema = z.object({
  participants: z.number().int().min(1).max(20).default(1)
});

export const leaveGroupBookingSchema = z.object({
  participants: z.number().int().min(1).max(20).default(1)
});

export const updateGroupStatusSchema = z.object({
  status: z.enum(['open', 'full', 'confirmed', 'closed', 'cancelled'])
});

// TypeScript types
export type UpsertUser = typeof users.$inferInsert;
export type User = typeof users.$inferSelect;
export type InsertTour = z.infer<typeof insertTourSchema>;
export type Tour = typeof tours.$inferSelect;
export type InsertService = z.infer<typeof insertServiceSchema>;
export type Service = typeof services.$inferSelect;
export type InsertBooking = z.infer<typeof insertBookingSchema>;
export type Booking = typeof bookings.$inferSelect;
export type InsertReview = z.infer<typeof insertReviewSchema>;
export type Review = typeof reviews.$inferSelect;
export type InsertSponsorship = z.infer<typeof insertSponsorshipSchema>;
export type Sponsorship = typeof sponsorships.$inferSelect;
export type InsertConversation = z.infer<typeof insertConversationSchema>;
export type SelectConversation = typeof conversations.$inferSelect;
export type InsertMessage = z.infer<typeof insertMessageSchema>;
export type SelectMessage = typeof messages.$inferSelect;
export type InsertSubscription = z.infer<typeof insertSubscriptionSchema>;
export type SelectSubscription = typeof subscriptions.$inferSelect;
export type InsertEvent = z.infer<typeof insertEventSchema>;
export type Event = typeof events.$inferSelect;
export type InsertEventParticipant = z.infer<typeof insertEventParticipantSchema>;
export type EventParticipant = typeof eventParticipants.$inferSelect;
export type InsertPost = z.infer<typeof insertPostSchema>;
export type Post = typeof posts.$inferSelect;
export type InsertPostLike = z.infer<typeof insertPostLikeSchema>;
export type PostLike = typeof postLikes.$inferSelect;
export type InsertPostComment = z.infer<typeof insertPostCommentSchema>;
export type PostComment = typeof postComments.$inferSelect;
export type InsertApiKey = z.infer<typeof insertApiKeySchema>;
export type ApiKey = typeof apiKeys.$inferSelect;
export type InsertAnalyticsEvent = z.infer<typeof insertAnalyticsEventSchema>;
export type AnalyticsEvent = typeof analyticsEvents.$inferSelect;
export type InsertLike = z.infer<typeof insertLikeSchema>;
export type Like = typeof likes.$inferSelect;
export type InsertTrustLevel = z.infer<typeof insertTrustLevelSchema>;
export type TrustLevelData = typeof trustLevelsTable.$inferSelect;
export type InsertGroupBooking = z.infer<typeof insertGroupBookingSchema>;
export type GroupBooking = typeof groupBookings.$inferSelect;
export type InsertUserReward = z.infer<typeof insertUserRewardSchema>;
export type UserReward = typeof userRewards.$inferSelect;
export type InsertRewardLog = z.infer<typeof insertRewardLogSchema>;
export type RewardLog = typeof rewardLogs.$inferSelect;
export type InsertReferral = z.infer<typeof insertReferralSchema>;
export type Referral = typeof referrals.$inferSelect;
export type InsertSmartGroup = z.infer<typeof insertSmartGroupSchema>;
export type SmartGroup = typeof smartGroups.$inferSelect;
export type InsertSmartGroupMember = z.infer<typeof insertSmartGroupMemberSchema>;
export type SmartGroupMember = typeof smartGroupMembers.$inferSelect;
export type InsertSmartGroupMessage = z.infer<typeof insertSmartGroupMessageSchema>;
export type SmartGroupMessage = typeof smartGroupMessages.$inferSelect;
export type InsertSmartGroupInvite = z.infer<typeof insertSmartGroupInviteSchema>;
export type SmartGroupInvite = typeof smartGroupInvites.$inferSelect;
export type InsertAILog = z.infer<typeof insertAILogSchema>;
export type AILog = typeof aiLogs.$inferSelect;
export type InsertGroupEvent = z.infer<typeof insertGroupEventSchema>;
export type GroupEvent = typeof groupEvents.$inferSelect;
export type InsertPartnership = z.infer<typeof insertPartnershipSchema>;
export type Partnership = typeof partnerships.$inferSelect;
export type InsertSearchLog = z.infer<typeof insertSearchLogSchema>;
export type SearchLog = typeof searchLogs.$inferSelect;
export type InsertEmbedding = z.infer<typeof insertEmbeddingSchema>;
export type Embedding = typeof embeddings.$inferSelect;
export type InsertContentReport = z.infer<typeof insertContentReportSchema>;
export type ContentReport = typeof contentReports.$inferSelect;
export type InsertNotification = z.infer<typeof insertNotificationSchema>;
export type Notification = typeof notifications.$inferSelect;
export type InsertPartner = z.infer<typeof insertPartnerSchema>;
export type Partner = typeof partners.$inferSelect;
export type InsertPackage = z.infer<typeof insertPackageSchema>;
export type Package = typeof packages.$inferSelect;
export type InsertPackageBooking = z.infer<typeof insertPackageBookingSchema>;
export type PackageBooking = typeof packageBookings.$inferSelect;
export type InsertCoupon = z.infer<typeof insertCouponSchema>;
export type Coupon = typeof coupons.$inferSelect;
export type InsertAffiliateLink = z.infer<typeof insertAffiliateLinkSchema>;
export type AffiliateLink = typeof affiliateLinks.$inferSelect;
export type InsertExternalConnector = z.infer<typeof insertExternalConnectorSchema>;
export type ExternalConnector = typeof externalConnectors.$inferSelect;
export type ExternalInventoryMapping = typeof externalInventoryMap.$inferSelect;
export type InsertAuditLog = z.infer<typeof insertAuditLogSchema>;
export type AuditLog = typeof auditLogs.$inferSelect;
export type PartnerAccount = typeof partnerAccounts.$inferSelect;
export type Payout = typeof payouts.$inferSelect;

// Extended types with relations
export type TourWithGuide = Tour & {
  guide: User;
  reviews?: Review[];
  _count?: { reviews: number };
  averageRating?: number;
};

export type ServiceWithProvider = Service & {
  provider: User;
  reviews?: Review[];
  _count?: { reviews: number };
  averageRating?: number;
};

export type BookingWithDetails = Booking & {
  tour: TourWithGuide;
  user: User;
};

export type ReviewWithUser = Review & {
  user: User;
};

export type SmartGroupWithDetails = SmartGroup & {
  creator: User;
  tour?: TourWithGuide;
  service?: ServiceWithProvider;
  members?: (SmartGroupMember & { user: User })[];
  _count?: { members: number; messages: number };
};
