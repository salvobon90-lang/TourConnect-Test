import {
  users,
  tours,
  services,
  bookings,
  reviews,
  sponsorships,
  conversations,
  messages,
  subscriptions,
  events,
  eventParticipants,
  posts,
  postLikes,
  postComments,
  apiKeys,
  analyticsEvents,
  type User,
  type UpsertUser,
  type Tour,
  type InsertTour,
  type Service,
  type InsertService,
  type Booking,
  type InsertBooking,
  type Review,
  type InsertReview,
  type Sponsorship,
  type InsertSponsorship,
  type SelectConversation,
  type InsertConversation,
  type SelectMessage,
  type InsertMessage,
  type Event,
  type InsertEvent,
  type EventParticipant,
  type InsertEventParticipant,
  type Post,
  type InsertPost,
  type PostLike,
  type InsertPostLike,
  type PostComment,
  type InsertPostComment,
  type ApiKey,
  type InsertApiKey,
  type AnalyticsEvent,
  type InsertAnalyticsEvent,
  type TourWithGuide,
  type ServiceWithProvider,
  type BookingWithDetails,
  type UserRole,
} from "@shared/schema";
import { db } from "./db";
import { eq, and, desc, sql, gt, or, inArray, ne } from "drizzle-orm";
import { BADGES, type UserStats } from "@shared/badges";
import { calculateTrustLevel } from "@shared/trustLevel";

// Placeholder types for Analytics
export interface AnalyticsFilters {
  userId?: string;
  targetId?: string;
  targetType?: string;
  eventType?: string;
  eventCategory?: string;
  startDate?: Date;
  endDate?: Date;
  limit?: number;
  offset?: number;
}

export interface AnalyticsData {
  events: AnalyticsEvent[];
  total: number;
  summary?: {
    totalViews?: number;
    totalClicks?: number;
    totalConversions?: number;
    topSources?: Array<{ source: string; count: number }>;
  };
}

export interface TourAnalytics {
  tourId: string;
  views: number;
  clicks: number;
  bookingAttempts: number;
  conversions: number;
  conversionRate: number;
  viewsByDate: Array<{ date: string; count: number }>;
  topSources: Array<{ source: string; count: number }>;
}

export interface UserAnalytics {
  userId: string;
  totalViews: number;
  totalClicks: number;
  totalBookings: number;
  engagementRate: number;
  activityByDate: Array<{ date: string; count: number }>;
  topCategories: Array<{ category: string; count: number }>;
}

export interface IStorage {
  // User operations
  getUser(id: string): Promise<User | undefined>;
  upsertUser(user: UpsertUser): Promise<User>;
  setUserRole(userId: string, role: UserRole): Promise<User>;
  updateUserProfile(userId: string, profileData: Partial<User>): Promise<User>;
  getPendingUsers(): Promise<User[]>;
  getAllUsers(): Promise<User[]>;
  approveUser(userId: string, supervisorId: string): Promise<User>;
  rejectUser(userId: string, supervisorId: string): Promise<User>;
  promoteToSupervisor(userId: string, promotedBy: string): Promise<User>;
  verifyUser(userId: string, supervisorId: string): Promise<User>;
  
  // Tour operations
  getTours(): Promise<TourWithGuide[]>;
  getTour(id: string): Promise<TourWithGuide | undefined>;
  getMyTours(guideId: string): Promise<Tour[]>;
  getPendingTours(): Promise<TourWithGuide[]>;
  createTour(tour: InsertTour): Promise<Tour>;
  updateTour(id: string, tour: Partial<InsertTour>): Promise<Tour>;
  deleteTour(id: string): Promise<void>;
  approveTour(tourId: string, supervisorId: string): Promise<Tour>;
  rejectTour(tourId: string, supervisorId: string): Promise<Tour>;
  
  // Service operations
  getServices(): Promise<ServiceWithProvider[]>;
  getService(id: string): Promise<ServiceWithProvider | undefined>;
  getMyServices(providerId: string): Promise<Service[]>;
  createService(service: InsertService): Promise<Service>;
  updateService(id: string, service: Partial<InsertService>): Promise<Service>;
  deleteService(id: string): Promise<void>;
  
  // Booking operations
  getBookings(userId: string): Promise<BookingWithDetails[]>;
  getBooking(id: string): Promise<BookingWithDetails | undefined>;
  getBookingsCount(userId: string): Promise<number>;
  createBooking(booking: InsertBooking): Promise<Booking>;
  updateBooking(id: string, booking: Partial<InsertBooking>): Promise<Booking>;
  
  // Review operations
  getReviews(tourId?: string, serviceId?: string): Promise<Review[]>;
  getReviewsByTour(tourId: string, sortBy?: 'recent' | 'rating'): Promise<Review[]>;
  getReviewsByService(serviceId: string, sortBy?: 'recent' | 'rating'): Promise<Review[]>;
  getReviewsByUser(userId: string): Promise<Review[]>;
  getReview(id: string): Promise<Review | undefined>;
  createReview(review: InsertReview): Promise<Review>;
  updateReview(id: string, data: Partial<InsertReview>): Promise<Review>;
  updateReviewResponse(id: string, response: string): Promise<Review>;
  deleteReview(id: string): Promise<void>;
  addResponse(reviewId: string, response: string, responderId: string): Promise<void>;
  getAverageRating(tourId: string): Promise<number>;
  getAverageRatingForService(serviceId: string): Promise<number>;
  getGuideAverageRating(guideId: string): Promise<number>;
  getProviderAverageRating(providerId: string): Promise<number>;
  getReviewCount(tourId: string): Promise<number>;
  getReviewCountForService(serviceId: string): Promise<number>;
  userHasBookingForTour(userId: string, tourId: string): Promise<boolean>;
  
  // Stats operations
  getGuideStats(guideId: string): Promise<{ totalBookings: number; totalRevenue: number; avgRating: number }>;
  getProviderStats(providerId: string): Promise<{ totalOrders: number; totalRevenue: number; avgRating: number }>;
  
  // Sponsorship operations
  getSponsorships(userId?: string): Promise<Sponsorship[]>;
  getSponsorshipById(id: string): Promise<Sponsorship | undefined>;
  getActiveSponsorship(tourId?: string, serviceId?: string): Promise<Sponsorship | undefined>;
  createSponsorship(sponsorship: InsertSponsorship): Promise<Sponsorship>;
  updateSponsorshipStatus(id: string, status: string, stripePaymentIntentId?: string, stripeCheckoutSessionId?: string): Promise<Sponsorship>;
  getMySponsorships(userId: string): Promise<Sponsorship[]>;
  getActiveSponsoredTours(): Promise<string[]>;
  getActiveSponsoredServices(): Promise<string[]>;
  activateSponsorship(id: string): Promise<Sponsorship>;
  
  // Messaging operations
  getConversations(userId: string): Promise<SelectConversation[]>;
  getConversation(id: string): Promise<SelectConversation | undefined>;
  findConversationBetweenUsers(user1Id: string, user2Id: string): Promise<SelectConversation | undefined>;
  createConversation(data: InsertConversation): Promise<SelectConversation>;
  updateConversationLastMessage(id: string, preview: string): Promise<void>;
  getMessagesByConversation(conversationId: string, limit?: number): Promise<SelectMessage[]>;
  createMessage(data: InsertMessage): Promise<SelectMessage>;
  markMessageAsRead(id: string): Promise<void>;
  markConversationMessagesAsRead(conversationId: string, userId: string): Promise<void>;
  getUnreadMessageCount(userId: string): Promise<number>;
  setUserOnlineStatus(userId: string, isOnline: boolean): Promise<void>;
  updateLastOnline(userId: string): Promise<void>;
  
  // Gamification operations
  getUserStats(userId: string): Promise<UserStats>;
  updateUserBadges(userId: string): Promise<string[]>;
  recalculateTrustLevel(userId: string): Promise<number>;
  
  // Subscription operations
  getSubscription(userId: string): Promise<any | null>;
  createSubscription(data: any): Promise<any>;
  updateSubscription(id: string, data: Partial<any>): Promise<any>;
  cancelSubscription(userId: string): Promise<void>;
  getSubscriptionByStripeId(subscriptionId: string): Promise<any | null>;
  updateSubscriptionStatus(stripeSubscriptionId: string, status: string): Promise<void>;
  
  // Events operations
  createEvent(event: InsertEvent): Promise<Event>;
  getEventById(id: string): Promise<Event | null>;
  listEvents(filters?: any): Promise<Event[]>;
  updateEvent(id: string, updates: Partial<Event>): Promise<Event>;
  deleteEvent(id: string): Promise<void>;
  
  // Event Participants operations
  addEventParticipant(participant: InsertEventParticipant): Promise<EventParticipant>;
  getEventParticipants(eventId: string): Promise<EventParticipant[]>;
  
  // Posts operations
  createPost(post: InsertPost): Promise<Post>;
  getFeedPosts(filters?: any): Promise<Post[]>;
  deletePost(id: string): Promise<void>;
  
  // Post Likes operations
  togglePostLike(postId: string, userId: string): Promise<void>;
  
  // Post Comments operations
  addComment(comment: InsertPostComment): Promise<PostComment>;
  getPostComments(postId: string): Promise<PostComment[]>;
  
  // API Keys operations
  createApiKey(apiKey: InsertApiKey): Promise<ApiKey>;
  getApiKeyByHash(keyHash: string): Promise<ApiKey | null>;
  listApiKeys(partnerId: string): Promise<ApiKey[]>;
  updateApiKey(id: string, updates: Partial<ApiKey>): Promise<ApiKey>;
  deleteApiKey(id: string): Promise<void>;
  incrementApiKeyUsage(id: string): Promise<void>;
  
  // Analytics operations
  trackEvent(event: InsertAnalyticsEvent): Promise<void>;
  getAnalytics(filters: AnalyticsFilters): Promise<AnalyticsData>;
  getTourAnalytics(tourId: string, timeframe: string): Promise<TourAnalytics>;
  getUserAnalytics(userId: string, timeframe: string): Promise<UserAnalytics>;
}

export class DatabaseStorage implements IStorage {
  // User operations
  async getUser(id: string): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.id, id));
    return user;
  }

  async upsertUser(userData: UpsertUser): Promise<User> {
    const [user] = await db
      .insert(users)
      .values(userData)
      .onConflictDoUpdate({
        target: users.id,
        set: {
          ...userData,
          updatedAt: new Date(),
        },
      })
      .returning();
    return user;
  }

  async setUserRole(userId: string, role: UserRole): Promise<User> {
    const approvalStatus = (role === 'guide' || role === 'provider') ? 'pending' : 'approved';
    
    const [user] = await db
      .update(users)
      .set({ 
        role, 
        approvalStatus,
        updatedAt: new Date() 
      })
      .where(eq(users.id, userId))
      .returning();
    return user;
  }

  async getPendingUsers(): Promise<User[]> {
    return await db
      .select()
      .from(users)
      .where(eq(users.approvalStatus, 'pending'))
      .orderBy(desc(users.createdAt));
  }

  async approveUser(userId: string, supervisorId: string): Promise<User> {
    const [user] = await db
      .update(users)
      .set({ 
        approvalStatus: 'approved',
        approvedBy: supervisorId,
        approvedAt: new Date(),
        updatedAt: new Date() 
      })
      .where(eq(users.id, userId))
      .returning();
    return user;
  }

  async rejectUser(userId: string, supervisorId: string): Promise<User> {
    const [user] = await db
      .update(users)
      .set({ 
        approvalStatus: 'rejected',
        approvedBy: supervisorId,
        approvedAt: new Date(),
        updatedAt: new Date() 
      })
      .where(eq(users.id, userId))
      .returning();
    return user;
  }

  async getAllUsers(): Promise<User[]> {
    return await db
      .select()
      .from(users)
      .orderBy(desc(users.createdAt));
  }

  async promoteToSupervisor(userId: string, promotedBy: string): Promise<User> {
    const [user] = await db
      .update(users)
      .set({ 
        role: 'supervisor',
        approvalStatus: 'approved',
        approvedBy: promotedBy,
        approvedAt: new Date(),
        updatedAt: new Date() 
      })
      .where(eq(users.id, userId))
      .returning();
    return user;
  }

  async updateUserProfile(userId: string, profileData: Partial<User>): Promise<User> {
    const [user] = await db
      .update(users)
      .set({ 
        ...profileData,
        updatedAt: new Date() 
      })
      .where(eq(users.id, userId))
      .returning();
    return user;
  }

  async verifyUser(userId: string, supervisorId: string): Promise<User> {
    const [user] = await db
      .update(users)
      .set({ 
        verified: true,
        updatedAt: new Date() 
      })
      .where(eq(users.id, userId))
      .returning();
    return user;
  }

  // Tour operations
  async getTours(): Promise<TourWithGuide[]> {
    const results = await db
      .select()
      .from(tours)
      .leftJoin(users, eq(tours.guideId, users.id))
      .where(and(
        eq(tours.isActive, true),
        eq(tours.approvalStatus, 'approved')
      ))
      .orderBy(desc(tours.createdAt));

    return results.map(r => ({
      ...r.tours,
      guide: r.users!,
    }));
  }

  async getTour(id: string): Promise<TourWithGuide | undefined> {
    const [result] = await db
      .select()
      .from(tours)
      .leftJoin(users, eq(tours.guideId, users.id))
      .where(eq(tours.id, id));

    if (!result) return undefined;

    return {
      ...result.tours,
      guide: result.users!,
    };
  }

  async getMyTours(guideId: string): Promise<Tour[]> {
    return await db
      .select()
      .from(tours)
      .where(eq(tours.guideId, guideId))
      .orderBy(desc(tours.createdAt));
  }

  async createTour(tour: InsertTour): Promise<Tour> {
    const [newTour] = await db.insert(tours).values(tour).returning();
    return newTour;
  }

  async updateTour(id: string, tour: Partial<InsertTour>): Promise<Tour> {
    const [updated] = await db
      .update(tours)
      .set({ ...tour, updatedAt: new Date() })
      .where(eq(tours.id, id))
      .returning();
    return updated;
  }

  async deleteTour(id: string): Promise<void> {
    await db.delete(tours).where(eq(tours.id, id));
  }

  async getPendingTours(): Promise<TourWithGuide[]> {
    const results = await db
      .select()
      .from(tours)
      .leftJoin(users, eq(tours.guideId, users.id))
      .where(eq(tours.approvalStatus, 'pending'))
      .orderBy(desc(tours.createdAt));

    return results.map(r => ({
      ...r.tours,
      guide: r.users!,
    }));
  }

  async approveTour(tourId: string, supervisorId: string): Promise<Tour> {
    const [tour] = await db
      .update(tours)
      .set({ 
        approvalStatus: 'approved',
        approvedBy: supervisorId,
        approvedAt: new Date(),
        updatedAt: new Date() 
      })
      .where(eq(tours.id, tourId))
      .returning();
    return tour;
  }

  async rejectTour(tourId: string, supervisorId: string): Promise<Tour> {
    const [tour] = await db
      .update(tours)
      .set({ 
        approvalStatus: 'rejected',
        approvedBy: supervisorId,
        approvedAt: new Date(),
        updatedAt: new Date() 
      })
      .where(eq(tours.id, tourId))
      .returning();
    return tour;
  }

  // Service operations
  async getServices(): Promise<ServiceWithProvider[]> {
    const results = await db
      .select()
      .from(services)
      .leftJoin(users, eq(services.providerId, users.id))
      .where(eq(services.isActive, true))
      .orderBy(desc(services.createdAt));

    return results.map(r => ({
      ...r.services,
      provider: r.users!,
    }));
  }

  async getService(id: string): Promise<ServiceWithProvider | undefined> {
    const [result] = await db
      .select()
      .from(services)
      .leftJoin(users, eq(services.providerId, users.id))
      .where(eq(services.id, id));

    if (!result) return undefined;

    return {
      ...result.services,
      provider: result.users!,
    };
  }

  async getMyServices(providerId: string): Promise<Service[]> {
    return await db
      .select()
      .from(services)
      .where(eq(services.providerId, providerId))
      .orderBy(desc(services.createdAt));
  }

  async createService(service: InsertService): Promise<Service> {
    const [newService] = await db.insert(services).values(service).returning();
    return newService;
  }

  async updateService(id: string, service: Partial<InsertService>): Promise<Service> {
    const [updated] = await db
      .update(services)
      .set({ ...service, updatedAt: new Date() })
      .where(eq(services.id, id))
      .returning();
    return updated;
  }

  async deleteService(id: string): Promise<void> {
    await db.delete(services).where(eq(services.id, id));
  }

  // Booking operations
  async getBookings(userId: string): Promise<BookingWithDetails[]> {
    const results = await db
      .select()
      .from(bookings)
      .leftJoin(tours, eq(bookings.tourId, tours.id))
      .leftJoin(users, eq(tours.guideId, users.id))
      .where(eq(bookings.userId, userId))
      .orderBy(desc(bookings.createdAt));

    return results.map(r => ({
      ...r.bookings,
      tour: {
        ...r.tours!,
        guide: r.users!,
      },
      user: r.users!,
    }));
  }

  async getBooking(id: string): Promise<BookingWithDetails | undefined> {
    const [result] = await db
      .select()
      .from(bookings)
      .leftJoin(tours, eq(bookings.tourId, tours.id))
      .leftJoin(users, eq(bookings.userId, users.id))
      .where(eq(bookings.id, id));

    if (!result) return undefined;

    return {
      ...result.bookings,
      tour: {
        ...result.tours!,
        guide: result.users!,
      },
      user: result.users!,
    };
  }

  async getBookingsCount(userId: string): Promise<number> {
    const [result] = await db
      .select({ count: sql<number>`count(*)` })
      .from(bookings)
      .where(eq(bookings.userId, userId));

    return Number(result?.count || 0);
  }

  async getBookingById(id: string): Promise<Booking | undefined> {
    const [booking] = await db
      .select()
      .from(bookings)
      .where(eq(bookings.id, id));

    return booking;
  }

  async createBooking(booking: InsertBooking): Promise<Booking> {
    const [newBooking] = await db.insert(bookings).values(booking).returning();
    return newBooking;
  }

  async updateBooking(id: string, booking: Partial<InsertBooking>): Promise<Booking> {
    const [updated] = await db
      .update(bookings)
      .set({ ...booking, updatedAt: new Date() })
      .where(eq(bookings.id, id))
      .returning();
    return updated;
  }

  // Review operations
  async getReviews(tourId?: string, serviceId?: string): Promise<any[]> {
    const conditions = [];
    
    if (tourId) {
      conditions.push(eq(reviews.tourId, tourId));
    }
    if (serviceId) {
      conditions.push(eq(reviews.serviceId, serviceId));
    }

    const query = db
      .select({
        id: reviews.id,
        userId: reviews.userId,
        tourId: reviews.tourId,
        serviceId: reviews.serviceId,
        rating: reviews.rating,
        comment: reviews.comment,
        images: reviews.images,
        response: reviews.response,
        createdAt: reviews.createdAt,
        updatedAt: reviews.updatedAt,
        user: {
          id: users.id,
          email: users.email,
          firstName: users.firstName,
          lastName: users.lastName,
          role: users.role,
        },
      })
      .from(reviews)
      .leftJoin(users, eq(reviews.userId, users.id))
      .orderBy(desc(reviews.createdAt));

    if (conditions.length > 0) {
      return await query.where(conditions[0]);
    }
    
    return await query;
  }

  async getReviewsByTour(tourId: string, sortBy: 'recent' | 'rating' = 'recent'): Promise<Review[]> {
    if (sortBy === 'rating') {
      return await db.select()
        .from(reviews)
        .where(eq(reviews.tourId, tourId))
        .orderBy(desc(reviews.rating), desc(reviews.createdAt));
    }
    
    return await db.select()
      .from(reviews)
      .where(eq(reviews.tourId, tourId))
      .orderBy(desc(reviews.createdAt));
  }

  async getReviewsByService(serviceId: string, sortBy: 'recent' | 'rating' = 'recent'): Promise<Review[]> {
    if (sortBy === 'rating') {
      return await db.select()
        .from(reviews)
        .where(eq(reviews.serviceId, serviceId))
        .orderBy(desc(reviews.rating), desc(reviews.createdAt));
    }
    
    return await db.select()
      .from(reviews)
      .where(eq(reviews.serviceId, serviceId))
      .orderBy(desc(reviews.createdAt));
  }

  async getReviewsByUser(userId: string): Promise<Review[]> {
    return await db.select()
      .from(reviews)
      .where(eq(reviews.userId, userId))
      .orderBy(desc(reviews.createdAt));
  }

  async getReview(id: string): Promise<Review | undefined> {
    const [review] = await db.select()
      .from(reviews)
      .where(eq(reviews.id, id))
      .limit(1);
    return review;
  }

  async createReview(review: InsertReview): Promise<Review> {
    const [newReview] = await db.insert(reviews).values(review).returning();
    return newReview;
  }

  async updateReview(id: string, data: Partial<InsertReview>): Promise<Review> {
    const [updated] = await db
      .update(reviews)
      .set({ ...data, updatedAt: new Date() })
      .where(eq(reviews.id, id))
      .returning();
    return updated;
  }

  async updateReviewResponse(id: string, response: string): Promise<Review> {
    const [updated] = await db
      .update(reviews)
      .set({ response, updatedAt: new Date() })
      .where(eq(reviews.id, id))
      .returning();
    return updated;
  }

  async deleteReview(id: string): Promise<void> {
    await db.delete(reviews).where(eq(reviews.id, id));
  }

  async addResponse(reviewId: string, response: string, responderId: string): Promise<void> {
    await db
      .update(reviews)
      .set({ response, updatedAt: new Date() })
      .where(eq(reviews.id, reviewId));
  }

  async getAverageRating(tourId: string): Promise<number> {
    const [result] = await db.select({
      avg: sql<number>`COALESCE(AVG(${reviews.rating}), 0)`
    })
    .from(reviews)
    .where(eq(reviews.tourId, tourId));
    
    return Number(result?.avg || 0);
  }

  async getAverageRatingForService(serviceId: string): Promise<number> {
    const [result] = await db.select({
      avg: sql<number>`COALESCE(AVG(${reviews.rating}), 0)`
    })
    .from(reviews)
    .where(eq(reviews.serviceId, serviceId));
    
    return Number(result?.avg || 0);
  }

  async getGuideAverageRating(guideId: string): Promise<number> {
    const [result] = await db.select({
      avg: sql<number>`COALESCE(AVG(${reviews.rating}), 0)`
    })
    .from(reviews)
    .innerJoin(tours, eq(reviews.tourId, tours.id))
    .where(eq(tours.guideId, guideId));
    
    return Number(result?.avg || 0);
  }

  async getProviderAverageRating(providerId: string): Promise<number> {
    const [result] = await db.select({
      avg: sql<number>`COALESCE(AVG(${reviews.rating}), 0)`
    })
    .from(reviews)
    .innerJoin(services, eq(reviews.serviceId, services.id))
    .where(eq(services.providerId, providerId));
    
    return Number(result?.avg || 0);
  }

  async getReviewCount(tourId: string): Promise<number> {
    const [result] = await db.select({
      count: sql<number>`COUNT(*)`
    })
    .from(reviews)
    .where(eq(reviews.tourId, tourId));
    
    return Number(result?.count || 0);
  }

  async getReviewCountForService(serviceId: string): Promise<number> {
    const [result] = await db.select({
      count: sql<number>`COUNT(*)`
    })
    .from(reviews)
    .where(eq(reviews.serviceId, serviceId));
    
    return Number(result?.count || 0);
  }

  async userHasBookingForTour(userId: string, tourId: string): Promise<boolean> {
    const [booking] = await db.select()
      .from(bookings)
      .where(
        and(
          eq(bookings.userId, userId),
          eq(bookings.tourId, tourId),
          or(
            eq(bookings.status, 'confirmed'),
            eq(bookings.status, 'completed')
          )
        )
      )
      .limit(1);
    
    return !!booking;
  }

  // Stats operations
  async getGuideStats(guideId: string): Promise<{ totalBookings: number; totalRevenue: number; avgRating: number }> {
    const toursList = await this.getMyTours(guideId);
    const tourIds = toursList.map(t => t.id);

    if (tourIds.length === 0) {
      return { totalBookings: 0, totalRevenue: 0, avgRating: 0 };
    }

    const [bookingsResult] = await db
      .select({
        count: sql<number>`count(*)`,
        revenue: sql<number>`sum(${bookings.totalAmount})`,
      })
      .from(bookings)
      .where(inArray(bookings.tourId, tourIds));

    const [ratingsResult] = await db
      .select({
        avgRating: sql<number>`avg(${reviews.rating})`,
      })
      .from(reviews)
      .where(inArray(reviews.tourId, tourIds));

    return {
      totalBookings: Number(bookingsResult?.count || 0),
      totalRevenue: Number(bookingsResult?.revenue || 0),
      avgRating: Number(ratingsResult?.avgRating || 0),
    };
  }

  async getProviderStats(providerId: string): Promise<{ totalOrders: number; totalRevenue: number; avgRating: number }> {
    const servicesList = await this.getMyServices(providerId);
    const serviceIds = servicesList.map(s => s.id);

    if (serviceIds.length === 0) {
      return { totalOrders: 0, totalRevenue: 0, avgRating: 0 };
    }

    const [ratingsResult] = await db
      .select({
        avgRating: sql<number>`avg(${reviews.rating})`,
      })
      .from(reviews)
      .where(inArray(reviews.serviceId, serviceIds));

    return {
      totalOrders: 0, // Placeholder - would need order tracking for services
      totalRevenue: 0, // Placeholder
      avgRating: Number(ratingsResult?.avgRating || 0),
    };
  }

  // Sponsorship operations
  async getSponsorships(userId?: string): Promise<Sponsorship[]> {
    const query = db
      .select()
      .from(sponsorships)
      .orderBy(desc(sponsorships.createdAt));

    if (userId) {
      return await query.where(eq(sponsorships.userId, userId));
    }
    
    return await query;
  }

  async getSponsorshipById(id: string): Promise<Sponsorship | undefined> {
    const [sponsorship] = await db
      .select()
      .from(sponsorships)
      .where(eq(sponsorships.id, id))
      .limit(1);
    return sponsorship;
  }

  async getActiveSponsorship(tourId?: string, serviceId?: string): Promise<Sponsorship | undefined> {
    const conditions = [
      eq(sponsorships.status, 'active'),
      gt(sponsorships.expiresAt, new Date())
    ];

    if (tourId) {
      conditions.push(eq(sponsorships.tourId, tourId));
    }
    if (serviceId) {
      conditions.push(eq(sponsorships.serviceId, serviceId));
    }

    const [sponsorship] = await db
      .select()
      .from(sponsorships)
      .where(and(...conditions))
      .limit(1);

    return sponsorship;
  }

  async createSponsorship(sponsorship: InsertSponsorship): Promise<Sponsorship> {
    const [newSponsorship] = await db
      .insert(sponsorships)
      .values(sponsorship)
      .returning();
    return newSponsorship;
  }

  async updateSponsorshipStatus(
    id: string,
    status: string,
    stripePaymentIntentId?: string,
    stripeCheckoutSessionId?: string
  ): Promise<Sponsorship> {
    const updateData: any = {
      status,
      updatedAt: new Date()
    };

    if (stripePaymentIntentId) {
      updateData.stripePaymentIntentId = stripePaymentIntentId;
    }
    if (stripeCheckoutSessionId) {
      updateData.stripeCheckoutSessionId = stripeCheckoutSessionId;
    }

    const [updated] = await db
      .update(sponsorships)
      .set(updateData)
      .where(eq(sponsorships.id, id))
      .returning();
    
    return updated;
  }

  async getMySponsorships(userId: string): Promise<Sponsorship[]> {
    return await db
      .select()
      .from(sponsorships)
      .where(eq(sponsorships.userId, userId))
      .orderBy(desc(sponsorships.createdAt));
  }

  async getActiveSponsoredTours(): Promise<string[]> {
    const results = await db
      .select({ tourId: sponsorships.tourId })
      .from(sponsorships)
      .where(
        and(
          eq(sponsorships.status, 'active'),
          gt(sponsorships.expiresAt, new Date()),
          sql`${sponsorships.tourId} IS NOT NULL`
        )
      );

    return results.map(r => r.tourId!).filter(Boolean);
  }

  async getActiveSponsoredServices(): Promise<string[]> {
    const results = await db
      .select({ serviceId: sponsorships.serviceId })
      .from(sponsorships)
      .where(
        and(
          eq(sponsorships.status, 'active'),
          gt(sponsorships.expiresAt, new Date()),
          sql`${sponsorships.serviceId} IS NOT NULL`
        )
      );

    return results.map(r => r.serviceId!).filter(Boolean);
  }

  async activateSponsorship(id: string): Promise<Sponsorship> {
    const [sponsorship] = await db
      .select()
      .from(sponsorships)
      .where(eq(sponsorships.id, id))
      .limit(1);

    if (!sponsorship) {
      throw new Error('Sponsorship not found');
    }

    const startsAt = new Date();
    const expiresAt = new Date();
    
    if (sponsorship.duration === 'weekly') {
      expiresAt.setDate(expiresAt.getDate() + 7);
    } else if (sponsorship.duration === 'monthly') {
      expiresAt.setDate(expiresAt.getDate() + 30);
    }

    const [updated] = await db
      .update(sponsorships)
      .set({
        status: 'active',
        startsAt,
        expiresAt,
        updatedAt: new Date()
      })
      .where(eq(sponsorships.id, id))
      .returning();

    return updated;
  }

  // Messaging operations
  async getConversations(userId: string): Promise<SelectConversation[]> {
    return await db
      .select()
      .from(conversations)
      .where(
        or(
          eq(conversations.participant1Id, userId),
          eq(conversations.participant2Id, userId)
        )
      )
      .orderBy(desc(conversations.lastMessageAt));
  }

  async getConversation(id: string): Promise<SelectConversation | undefined> {
    const [conversation] = await db
      .select()
      .from(conversations)
      .where(eq(conversations.id, id));
    return conversation;
  }

  async findConversationBetweenUsers(user1Id: string, user2Id: string): Promise<SelectConversation | undefined> {
    const [conversation] = await db
      .select()
      .from(conversations)
      .where(
        or(
          and(
            eq(conversations.participant1Id, user1Id),
            eq(conversations.participant2Id, user2Id)
          ),
          and(
            eq(conversations.participant1Id, user2Id),
            eq(conversations.participant2Id, user1Id)
          )
        )
      );
    return conversation;
  }

  async createConversation(data: InsertConversation): Promise<SelectConversation> {
    const [conversation] = await db
      .insert(conversations)
      .values(data)
      .returning();
    return conversation;
  }

  async updateConversationLastMessage(id: string, preview: string): Promise<void> {
    await db
      .update(conversations)
      .set({
        lastMessageAt: new Date(),
        lastMessagePreview: preview,
        updatedAt: new Date()
      })
      .where(eq(conversations.id, id));
  }

  async getMessagesByConversation(conversationId: string, limit: number = 50): Promise<SelectMessage[]> {
    return await db
      .select()
      .from(messages)
      .where(eq(messages.conversationId, conversationId))
      .orderBy(desc(messages.createdAt))
      .limit(limit);
  }

  async createMessage(data: InsertMessage): Promise<SelectMessage> {
    const [message] = await db
      .insert(messages)
      .values(data)
      .returning();

    const preview = message.content.substring(0, 100);
    await this.updateConversationLastMessage(message.conversationId, preview);

    return message;
  }

  async markMessageAsRead(id: string): Promise<void> {
    await db
      .update(messages)
      .set({
        isRead: true,
        readAt: new Date()
      })
      .where(eq(messages.id, id));
  }

  async markConversationMessagesAsRead(conversationId: string, userId: string): Promise<void> {
    await db
      .update(messages)
      .set({
        isRead: true,
        readAt: new Date()
      })
      .where(
        and(
          eq(messages.conversationId, conversationId),
          ne(messages.senderId, userId),
          eq(messages.isRead, false)
        )
      );
  }

  async getUnreadMessageCount(userId: string): Promise<number> {
    const userConversations = await this.getConversations(userId);
    const conversationIds = userConversations.map(c => c.id);

    if (conversationIds.length === 0) {
      return 0;
    }

    const result = await db
      .select({ count: sql<number>`count(*)::int` })
      .from(messages)
      .where(
        and(
          inArray(messages.conversationId, conversationIds),
          ne(messages.senderId, userId),
          eq(messages.isRead, false)
        )
      );

    return result[0]?.count || 0;
  }

  async setUserOnlineStatus(userId: string, isOnline: boolean): Promise<void> {
    await db
      .update(users)
      .set({
        isOnline,
        updatedAt: new Date()
      })
      .where(eq(users.id, userId));
  }

  async updateLastOnline(userId: string): Promise<void> {
    await db
      .update(users)
      .set({
        lastOnlineAt: new Date(),
        updatedAt: new Date()
      })
      .where(eq(users.id, userId));
  }

  // Gamification operations
  async getUserStats(userId: string): Promise<UserStats> {
    const user = await this.getUser(userId);
    if (!user) {
      throw new Error('User not found');
    }

    const [completedToursResult] = await db.select({ count: sql<number>`COUNT(*)::int` })
      .from(bookings)
      .where(
        and(
          eq(bookings.userId, userId),
          eq(bookings.status, 'completed')
        )
      );

    const [toursCompletedResult] = await db.select({ count: sql<number>`COUNT(DISTINCT ${bookings.id})::int` })
      .from(bookings)
      .innerJoin(tours, eq(bookings.tourId, tours.id))
      .where(
        and(
          eq(tours.guideId, userId),
          eq(bookings.status, 'completed')
        )
      );

    const [reviewsGivenResult] = await db.select({ count: sql<number>`COUNT(*)::int` })
      .from(reviews)
      .where(eq(reviews.userId, userId));

    const [reviewsReceivedResult] = await db.select({ count: sql<number>`COUNT(*)::int` })
      .from(reviews)
      .innerJoin(tours, eq(reviews.tourId, tours.id))
      .where(eq(tours.guideId, userId));

    const avgRating = await this.getGuideAverageRating(userId);

    const subscription = await db.select()
      .from(subscriptions)
      .where(
        and(
          eq(subscriptions.userId, userId),
          eq(subscriptions.status, 'active')
        )
      )
      .limit(1);

    const isPremium = subscription.length > 0;

    const accountAgeMs = Date.now() - user.createdAt.getTime();
    const accountAgeMonths = Math.floor(accountAgeMs / (1000 * 60 * 60 * 24 * 30));

    return {
      completedTours: completedToursResult?.count || 0,
      toursCompleted: toursCompletedResult?.count || 0,
      reviewsGiven: reviewsGivenResult?.count || 0,
      reviewsReceived: reviewsReceivedResult?.count || 0,
      averageRating: avgRating,
      isPremium,
      accountAgeMonths
    };
  }

  async updateUserBadges(userId: string): Promise<string[]> {
    const stats = await this.getUserStats(userId);

    const earnedBadges = Object.values(BADGES)
      .filter(badge => badge.criteria(stats))
      .map(badge => badge.id);

    await db.update(users)
      .set({ badges: earnedBadges, updatedAt: new Date() })
      .where(eq(users.id, userId));

    return earnedBadges;
  }

  async recalculateTrustLevel(userId: string): Promise<number> {
    const stats = await this.getUserStats(userId);
    const trustLevel = calculateTrustLevel(stats);

    await db.update(users)
      .set({ trustLevel, updatedAt: new Date() })
      .where(eq(users.id, userId));

    return trustLevel;
  }

  async getSubscription(userId: string): Promise<any | null> {
    const [subscription] = await db.select()
      .from(subscriptions)
      .where(eq(subscriptions.userId, userId))
      .limit(1);
    
    return subscription || null;
  }

  async createSubscription(data: any): Promise<any> {
    const [subscription] = await db
      .insert(subscriptions)
      .values(data)
      .returning();
    
    return subscription;
  }

  async updateSubscription(id: string, data: Partial<any>): Promise<any> {
    const [subscription] = await db
      .update(subscriptions)
      .set({ 
        ...data,
        updatedAt: new Date()
      })
      .where(eq(subscriptions.id, id))
      .returning();
    
    return subscription;
  }

  async cancelSubscription(userId: string): Promise<void> {
    await db
      .update(subscriptions)
      .set({ 
        status: 'cancelled',
        updatedAt: new Date()
      })
      .where(eq(subscriptions.userId, userId));
  }

  async getSubscriptionByStripeId(subscriptionId: string): Promise<any | null> {
    const [subscription] = await db.select()
      .from(subscriptions)
      .where(eq(subscriptions.stripeSubscriptionId, subscriptionId))
      .limit(1);
    
    return subscription || null;
  }

  async updateSubscriptionStatus(stripeSubscriptionId: string, status: string): Promise<void> {
    await db.update(subscriptions)
      .set({ 
        status,
        updatedAt: new Date()
      })
      .where(eq(subscriptions.stripeSubscriptionId, stripeSubscriptionId));
  }

  // Events operations (to be implemented in next task)
  async createEvent(event: InsertEvent): Promise<Event> {
    throw new Error("Not implemented yet");
  }

  async getEventById(id: string): Promise<Event | null> {
    throw new Error("Not implemented yet");
  }

  async listEvents(filters?: any): Promise<Event[]> {
    throw new Error("Not implemented yet");
  }

  async updateEvent(id: string, updates: Partial<Event>): Promise<Event> {
    throw new Error("Not implemented yet");
  }

  async deleteEvent(id: string): Promise<void> {
    throw new Error("Not implemented yet");
  }

  // Event Participants operations (to be implemented in next task)
  async addEventParticipant(participant: InsertEventParticipant): Promise<EventParticipant> {
    throw new Error("Not implemented yet");
  }

  async getEventParticipants(eventId: string): Promise<EventParticipant[]> {
    throw new Error("Not implemented yet");
  }

  // Posts operations (to be implemented in next task)
  async createPost(post: InsertPost): Promise<Post> {
    throw new Error("Not implemented yet");
  }

  async getFeedPosts(filters?: any): Promise<Post[]> {
    throw new Error("Not implemented yet");
  }

  async deletePost(id: string): Promise<void> {
    throw new Error("Not implemented yet");
  }

  // Post Likes operations (to be implemented in next task)
  async togglePostLike(postId: string, userId: string): Promise<void> {
    throw new Error("Not implemented yet");
  }

  // Post Comments operations (to be implemented in next task)
  async addComment(comment: InsertPostComment): Promise<PostComment> {
    throw new Error("Not implemented yet");
  }

  async getPostComments(postId: string): Promise<PostComment[]> {
    throw new Error("Not implemented yet");
  }

  // API Keys operations (to be implemented in next task)
  async createApiKey(apiKey: InsertApiKey): Promise<ApiKey> {
    throw new Error("Not implemented yet");
  }

  async getApiKeyByHash(keyHash: string): Promise<ApiKey | null> {
    throw new Error("Not implemented yet");
  }

  async listApiKeys(partnerId: string): Promise<ApiKey[]> {
    throw new Error("Not implemented yet");
  }

  async updateApiKey(id: string, updates: Partial<ApiKey>): Promise<ApiKey> {
    throw new Error("Not implemented yet");
  }

  async deleteApiKey(id: string): Promise<void> {
    throw new Error("Not implemented yet");
  }

  async incrementApiKeyUsage(id: string): Promise<void> {
    throw new Error("Not implemented yet");
  }

  // Analytics operations (to be implemented in next task)
  async trackEvent(event: InsertAnalyticsEvent): Promise<void> {
    throw new Error("Not implemented yet");
  }

  async getAnalytics(filters: AnalyticsFilters): Promise<AnalyticsData> {
    throw new Error("Not implemented yet");
  }

  async getTourAnalytics(tourId: string, timeframe: string): Promise<TourAnalytics> {
    throw new Error("Not implemented yet");
  }

  async getUserAnalytics(userId: string, timeframe: string): Promise<UserAnalytics> {
    throw new Error("Not implemented yet");
  }
}

export const storage = new DatabaseStorage();
