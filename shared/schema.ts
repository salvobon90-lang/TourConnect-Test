import { sql } from 'drizzle-orm';
import {
  index,
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
  name: text("name").notNull(),
  description: text("description").notNull(),
  type: varchar("type", { length: 50 }).notNull(), // restaurant, shop, transport
  images: text("images").array().notNull().default(sql`ARRAY[]::text[]`),
  logoUrl: varchar("logo_url"),
  address: text("address").notNull(),
  latitude: real("latitude").notNull(),
  longitude: real("longitude").notNull(),
  operatingHours: text("operating_hours"),
  priceRange: varchar("price_range", { length: 10 }), // $, $$, $$$
  specialOffer: text("special_offer"),
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
