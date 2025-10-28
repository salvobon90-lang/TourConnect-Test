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
import { eq, and, desc, asc, sql, gt, or, inArray, ne } from "drizzle-orm";
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
  getEventParticipant(eventId: string, userId: string): Promise<EventParticipant | null>;
  updateEventParticipant(id: string, updates: Partial<EventParticipant>): Promise<EventParticipant>;
  
  // Posts operations
  createPost(post: InsertPost): Promise<Post>;
  getFeedPosts(filters?: any): Promise<Post[]>;
  getPostById(id: string): Promise<Post | null>;
  deletePost(id: string): Promise<void>;
  getUserById(id: string): Promise<User | undefined>;
  getUsersByIds(ids: string[]): Promise<Map<string, User>>;
  
  // Post Likes operations
  togglePostLike(postId: string, userId: string): Promise<{ liked: boolean }>;
  getPostLikes(postId: string): Promise<PostLike[]>;
  hasUserLikedPost(postId: string, userId: string): Promise<boolean>;
  
  // Post Comments operations
  addComment(comment: InsertPostComment): Promise<PostComment>;
  getPostComments(postId: string): Promise<PostComment[]>;
  deleteComment(id: string): Promise<{ postId: string }>;
  
  // API Keys operations
  createApiKey(apiKey: InsertApiKey): Promise<ApiKey>;
  getApiKeyByHash(keyHash: string): Promise<ApiKey | null>;
  listApiKeys(partnerId: string): Promise<ApiKey[]>;
  updateApiKey(id: string, updates: Partial<ApiKey>): Promise<ApiKey>;
  deleteApiKey(id: string): Promise<void>;
  incrementApiKeyUsage(id: string): Promise<{ success: boolean; current: number }>;
  
  // Partner API helper methods
  searchTours(filters: any): Promise<TourWithGuide[]>;
  searchServices(filters: any): Promise<ServiceWithProvider[]>;
  countTours(): Promise<number>;
  countServices(): Promise<number>;
  getTourCategories(): Promise<string[]>;
  getAvailableCities(): Promise<string[]>;
  getTourById(id: string): Promise<TourWithGuide | undefined>;
  
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

  // ========== EVENTS ==========
  async createEvent(event: InsertEvent): Promise<Event> {
    const [newEvent] = await db.insert(events).values(event).returning();
    return newEvent;
  }

  async getEventById(id: string): Promise<Event | null> {
    const result = await db.select().from(events).where(eq(events.id, id)).limit(1);
    return result[0] || null;
  }

  async listEvents(filters?: {
    category?: string;
    createdBy?: string;
    isFree?: boolean;
    isPrivate?: boolean;
    startAfter?: Date;
    limit?: number;
    offset?: number;
  }): Promise<Event[]> {
    let query = db.select().from(events);
    
    const conditions = [];
    if (filters?.category) conditions.push(eq(events.category, filters.category));
    if (filters?.createdBy) conditions.push(eq(events.createdBy, filters.createdBy));
    if (filters?.isFree !== undefined) conditions.push(eq(events.isFree, filters.isFree));
    if (filters?.isPrivate !== undefined) conditions.push(eq(events.isPrivate, filters.isPrivate));
    if (filters?.startAfter) conditions.push(gt(events.startDate, filters.startAfter));
    
    // Status active by default
    conditions.push(eq(events.status, "active"));
    
    if (conditions.length > 0) {
      query = query.where(and(...conditions));
    }
    
    // Order by start date ascending
    query = query.orderBy(asc(events.startDate));
    
    if (filters?.limit) query = query.limit(filters.limit);
    if (filters?.offset) query = query.offset(filters.offset);
    
    return await query;
  }

  async updateEvent(id: string, updates: Partial<Event>): Promise<Event> {
    const [updated] = await db.update(events)
      .set({ ...updates, updatedAt: new Date() })
      .where(eq(events.id, id))
      .returning();
    return updated;
  }

  async deleteEvent(id: string): Promise<void> {
    await db.delete(events).where(eq(events.id, id));
  }

  // ========== EVENT PARTICIPANTS ==========
  async addEventParticipant(participant: InsertEventParticipant): Promise<EventParticipant> {
    const [newParticipant] = await db.insert(eventParticipants).values(participant).returning();
    return newParticipant;
  }

  async getEventParticipants(eventId: string): Promise<EventParticipant[]> {
    return await db.select().from(eventParticipants).where(eq(eventParticipants.eventId, eventId));
  }

  async getEventParticipant(eventId: string, userId: string): Promise<EventParticipant | null> {
    const result = await db.select().from(eventParticipants)
      .where(and(
        eq(eventParticipants.eventId, eventId),
        eq(eventParticipants.userId, userId)
      ))
      .limit(1);
    return result[0] || null;
  }

  async updateEventParticipant(id: string, updates: Partial<EventParticipant>): Promise<EventParticipant> {
    const [updated] = await db.update(eventParticipants)
      .set(updates)
      .where(eq(eventParticipants.id, id))
      .returning();
    return updated;
  }

  // ========== POSTS ==========
  async createPost(post: InsertPost): Promise<Post> {
    const [newPost] = await db.insert(posts).values(post).returning();
    return newPost;
  }

  async getFeedPosts(filters?: {
    authorId?: string;
    tourId?: string;
    serviceId?: string;
    eventId?: string;
    hashtag?: string;
    isPublic?: boolean;
    limit?: number;
    offset?: number;
  }): Promise<Post[]> {
    let query = db.select().from(posts);
    
    const conditions = [];
    if (filters?.authorId) conditions.push(eq(posts.authorId, filters.authorId));
    if (filters?.tourId) conditions.push(eq(posts.tourId, filters.tourId));
    if (filters?.serviceId) conditions.push(eq(posts.serviceId, filters.serviceId));
    if (filters?.eventId) conditions.push(eq(posts.eventId, filters.eventId));
    if (filters?.isPublic !== undefined) conditions.push(eq(posts.isPublic, filters.isPublic));
    
    // Hashtag filter - check if hashtag exists in array
    if (filters?.hashtag) {
      conditions.push(sql`${filters.hashtag} = ANY(${posts.hashtags})`);
    }
    
    // Only approved posts by default
    conditions.push(eq(posts.moderationStatus, "approved"));
    
    if (conditions.length > 0) {
      query = query.where(and(...conditions));
    }
    
    // Order by most recent first
    query = query.orderBy(desc(posts.createdAt));
    
    if (filters?.limit) query = query.limit(filters.limit);
    if (filters?.offset) query = query.offset(filters.offset);
    
    return await query;
  }

  async getPostById(id: string): Promise<Post | null> {
    const result = await db.select().from(posts).where(eq(posts.id, id)).limit(1);
    return result[0] || null;
  }

  async deletePost(id: string): Promise<void> {
    await db.delete(posts).where(eq(posts.id, id));
  }

  async getUserById(id: string): Promise<User | undefined> {
    return this.getUser(id);
  }

  async getUsersByIds(ids: string[]): Promise<Map<string, User>> {
    if (ids.length === 0) return new Map();
    
    const usersList = await db.select().from(users).where(
      sql`${users.id} = ANY(${ids})`
    );
    
    return new Map(usersList.map(user => [user.id, user]));
  }

  // ========== POST LIKES ==========
  async togglePostLike(postId: string, userId: string): Promise<{ liked: boolean }> {
    // Atomic transaction: check + insert/delete + counter update together
    return await db.transaction(async (tx) => {
      // Lock post row to prevent concurrent counter updates
      const [post] = await tx
        .select()
        .from(posts)
        .where(eq(posts.id, postId))
        .for("update");
      
      if (!post) {
        throw new Error("Post not found");
      }
      
      // Check if already liked
      const [existing] = await tx
        .select()
        .from(postLikes)
        .where(and(
          eq(postLikes.postId, postId),
          eq(postLikes.userId, userId)
        ))
        .limit(1);
      
      if (existing) {
        // Unlike - delete like + decrement counter atomically
        await tx.delete(postLikes).where(eq(postLikes.id, existing.id));
        await tx.update(posts)
          .set({ likesCount: sql`${posts.likesCount} - 1` })
          .where(eq(posts.id, postId));
        
        return { liked: false };
      } else {
        // Like - insert like + increment counter atomically
        await tx.insert(postLikes).values({ postId, userId });
        await tx.update(posts)
          .set({ likesCount: sql`${posts.likesCount} + 1` })
          .where(eq(posts.id, postId));
        
        return { liked: true };
      }
    });
  }

  async getPostLikes(postId: string): Promise<PostLike[]> {
    return await db.select().from(postLikes).where(eq(postLikes.postId, postId));
  }

  async hasUserLikedPost(postId: string, userId: string): Promise<boolean> {
    const result = await db.select().from(postLikes)
      .where(and(
        eq(postLikes.postId, postId),
        eq(postLikes.userId, userId)
      ))
      .limit(1);
    return result.length > 0;
  }

  // ========== POST COMMENTS ==========
  async addComment(comment: InsertPostComment): Promise<PostComment> {
    return await db.transaction(async (tx) => {
      // Insert comment + increment counter atomically
      const [newComment] = await tx.insert(postComments).values(comment).returning();
      
      await tx.update(posts)
        .set({ commentsCount: sql`${posts.commentsCount} + 1` })
        .where(eq(posts.id, comment.postId));
      
      return newComment;
    });
  }

  async getPostComments(postId: string): Promise<PostComment[]> {
    return await db.select().from(postComments)
      .where(eq(postComments.postId, postId))
      .orderBy(asc(postComments.createdAt));
  }

  async deleteComment(id: string): Promise<{ postId: string }> {
    return await db.transaction(async (tx) => {
      const [comment] = await tx
        .select()
        .from(postComments)
        .where(eq(postComments.id, id))
        .limit(1);
      
      if (!comment) {
        throw new Error("Comment not found");
      }
      
      // Delete comment + decrement counter atomically
      await tx.delete(postComments).where(eq(postComments.id, id));
      
      await tx.update(posts)
        .set({ commentsCount: sql`${posts.commentsCount} - 1` })
        .where(eq(posts.id, comment.postId));
      
      return { postId: comment.postId };
    });
  }

  // API Keys operations
  async createApiKey(apiKey: InsertApiKey): Promise<ApiKey> {
    const [newKey] = await db.insert(apiKeys).values(apiKey).returning();
    return newKey;
  }

  async getApiKeyByHash(keyHash: string): Promise<ApiKey | null> {
    const result = await db.select().from(apiKeys)
      .where(eq(apiKeys.keyHash, keyHash))
      .limit(1);
    return result[0] || null;
  }

  async listApiKeys(partnerId: string): Promise<ApiKey[]> {
    return await db.select().from(apiKeys)
      .where(eq(apiKeys.partnerId, partnerId))
      .orderBy(desc(apiKeys.createdAt));
  }

  async updateApiKey(id: string, updates: Partial<ApiKey>): Promise<ApiKey> {
    const [updated] = await db.update(apiKeys)
      .set({ ...updates, updatedAt: new Date() })
      .where(eq(apiKeys.id, id))
      .returning();
    return updated;
  }

  async deleteApiKey(id: string): Promise<void> {
    await db.delete(apiKeys).where(eq(apiKeys.id, id));
  }

  async incrementApiKeyUsage(id: string): Promise<{ success: boolean; current: number }> {
    // Atomic increment: only increment if below rate limit
    const result = await db.transaction(async (tx) => {
      // Lock and get current API key
      const [key] = await tx
        .select()
        .from(apiKeys)
        .where(eq(apiKeys.id, id))
        .for("update"); // Row-level lock
      
      if (!key) {
        throw new Error("API key not found");
      }
      
      // Check if below limit
      if (key.requestsToday >= key.rateLimit) {
        return { success: false, current: key.requestsToday };
      }
      
      // Increment counter atomically
      const [updated] = await tx
        .update(apiKeys)
        .set({
          requestsToday: sql`${apiKeys.requestsToday} + 1`,
          lastUsedAt: new Date()
        })
        .where(eq(apiKeys.id, id))
        .returning();
      
      return { success: true, current: updated.requestsToday };
    });
    
    return result;
  }

  // Partner API helper methods
  async searchTours(filters: any): Promise<TourWithGuide[]> {
    let query = db.select().from(tours)
      .leftJoin(users, eq(tours.guideId, users.id))
      .where(and(
        eq(tours.isActive, true),
        eq(tours.approvalStatus, 'approved')
      ));

    const conditions: any[] = [
      eq(tours.isActive, true),
      eq(tours.approvalStatus, 'approved')
    ];

    if (filters.category) {
      conditions.push(eq(tours.category, filters.category));
    }

    if (filters.language) {
      conditions.push(sql`${filters.language} = ANY(${tours.languages})`);
    }

    if (filters.city) {
      conditions.push(sql`LOWER(${tours.meetingPoint}) LIKE LOWER(${'%' + filters.city + '%'})`);
    }

    if (filters.minPrice) {
      conditions.push(sql`${tours.price}::numeric >= ${filters.minPrice}`);
    }

    if (filters.maxPrice) {
      conditions.push(sql`${tours.price}::numeric <= ${filters.maxPrice}`);
    }

    const results = await db.select().from(tours)
      .leftJoin(users, eq(tours.guideId, users.id))
      .where(and(...conditions))
      .orderBy(desc(tours.createdAt))
      .limit(filters.limit || 50)
      .offset(filters.offset || 0);

    return results.map(row => ({
      ...row.tours,
      guide: row.users || undefined
    }));
  }

  async searchServices(filters: any): Promise<ServiceWithProvider[]> {
    const conditions: any[] = [eq(services.isActive, true)];

    if (filters.category) {
      conditions.push(eq(services.type, filters.category));
    }

    if (filters.city) {
      conditions.push(sql`LOWER(${services.address}) LIKE LOWER(${'%' + filters.city + '%'})`);
    }

    const results = await db.select().from(services)
      .leftJoin(users, eq(services.providerId, users.id))
      .where(and(...conditions))
      .orderBy(desc(services.createdAt))
      .limit(filters.limit || 50)
      .offset(filters.offset || 0);

    return results.map(row => ({
      ...row.services,
      provider: row.users || undefined
    }));
  }

  async countTours(): Promise<number> {
    const result = await db.select({ count: sql<number>`count(*)` })
      .from(tours)
      .where(and(
        eq(tours.isActive, true),
        eq(tours.approvalStatus, 'approved')
      ));
    return Number(result[0]?.count || 0);
  }

  async countServices(): Promise<number> {
    const result = await db.select({ count: sql<number>`count(*)` })
      .from(services)
      .where(eq(services.isActive, true));
    return Number(result[0]?.count || 0);
  }

  async getTourCategories(): Promise<string[]> {
    const result = await db.selectDistinct({ category: tours.category })
      .from(tours)
      .where(and(
        eq(tours.isActive, true),
        eq(tours.approvalStatus, 'approved')
      ));
    return result.map(r => r.category);
  }

  async getAvailableCities(): Promise<string[]> {
    const tourCities = await db.selectDistinct({ city: sql<string>`split_part(${tours.meetingPoint}, ',', 1)` })
      .from(tours)
      .where(and(
        eq(tours.isActive, true),
        eq(tours.approvalStatus, 'approved')
      ));
    
    const serviceCities = await db.selectDistinct({ city: sql<string>`split_part(${services.address}, ',', 1)` })
      .from(services)
      .where(eq(services.isActive, true));

    const allCities = [...tourCities.map(r => r.city), ...serviceCities.map(r => r.city)];
    return [...new Set(allCities)].filter(city => city && city.trim().length > 0);
  }

  async getTourById(id: string): Promise<TourWithGuide | undefined> {
    return this.getTour(id);
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
