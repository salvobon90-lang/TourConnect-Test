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
  likes,
  trustLevelsTable,
  groupBookings,
  userRewards,
  rewardLogs,
  referrals,
  smartGroups,
  smartGroupMembers,
  smartGroupMessages,
  smartGroupInvites,
  rewardPoints,
  levelThresholds,
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
  type Like,
  type InsertLike,
  type TrustLevelData,
  type InsertTrustLevel,
  type GroupBooking,
  type InsertGroupBooking,
  type UserReward,
  type InsertUserReward,
  type RewardLog,
  type InsertRewardLog,
  type Referral,
  type InsertReferral,
  type SmartGroup,
  type InsertSmartGroup,
  type SmartGroupMember,
  type InsertSmartGroupMember,
  type SmartGroupMessage,
  type InsertSmartGroupMessage,
  type SmartGroupInvite,
  type InsertSmartGroupInvite,
  type SmartGroupWithDetails,
  type RewardActionType,
  type RewardLevel,
  type TourWithGuide,
  type ServiceWithProvider,
  type BookingWithDetails,
  type UserRole,
} from "@shared/schema";
import { db } from "./db";
import { eq, and, desc, asc, sql, gt, or, inArray, ne, gte, lte } from "drizzle-orm";
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
  getEventParticipationsByUser(userId: string): Promise<EventParticipant[]>;
  
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
  trackEvent(event: InsertAnalyticsEvent): Promise<AnalyticsEvent>;
  getEntityAnalytics(entityId: string, entityType: string, startDate?: Date, endDate?: Date): Promise<any>;
  getGuideAnalytics(guideId: string, startDate?: Date, endDate?: Date): Promise<any>;
  getProviderAnalytics(providerId: string, startDate?: Date, endDate?: Date): Promise<{
    totalViews: number;
    totalClicks: number;
    topServices: Array<{ serviceId: string; name: string; views: number; clicks: number }>;
    dailyStats: Array<{ date: string; views: number; clicks: number }>;
  }>;
  
  // Smart Groups operations (Phase 8)
  createSmartGroup(userId: string, data: Omit<InsertSmartGroup, 'creatorId'>): Promise<SmartGroup>;
  getNearbySmartGroups(latitude: number, longitude: number, radiusKm: number): Promise<SmartGroupWithDetails[]>;
  getSmartGroup(id: string): Promise<SmartGroupWithDetails | null>;
  joinSmartGroup(groupId: string, userId: string, inviteCode?: string): Promise<SmartGroupMember>;
  leaveSmartGroup(groupId: string, userId: string): Promise<void>;
  getMySmartGroups(userId: string): Promise<SmartGroupWithDetails[]>;
  getSmartGroupMessages(groupId: string, limit?: number): Promise<(SmartGroupMessage & { user: User })[]>;
  sendGroupMessage(groupId: string, userId: string, message: string): Promise<SmartGroupMessage>;
  createGroupInvite(groupId: string, userId: string, expiresAt: Date): Promise<SmartGroupInvite>;
  expireOldGroups(): Promise<number>;
  getUserActiveGroupsCount(userId: string): Promise<number>;
  getUserLastGroupCreation(userId: string): Promise<Date | null>;
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
      // @ts-expect-error Drizzle ORM type mismatch - cosmetic only
      query = query.where(and(...conditions));
    }
    
    // Order by start date ascending
    // @ts-expect-error Drizzle ORM type mismatch - cosmetic only
    query = query.orderBy(asc(events.startDate));
    
    // @ts-expect-error Drizzle ORM type mismatch - cosmetic only
    if (filters?.limit) query = query.limit(filters.limit);
    // @ts-expect-error Drizzle ORM type mismatch - cosmetic only
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

  async getEventParticipationsByUser(userId: string): Promise<EventParticipant[]> {
    return await db
      .select()
      .from(eventParticipants)
      .where(and(
        eq(eventParticipants.userId, userId),
        ne(eventParticipants.status, "cancelled")
      ))
      .orderBy(desc(eventParticipants.createdAt));
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
      // @ts-expect-error Drizzle ORM type mismatch - cosmetic only
      query = query.where(and(...conditions));
    }
    
    // Order by most recent first
    // @ts-expect-error Drizzle ORM type mismatch - cosmetic only
    query = query.orderBy(desc(posts.createdAt));
    
    // @ts-expect-error Drizzle ORM type mismatch - cosmetic only
    if (filters?.limit) query = query.limit(filters.limit);
    // @ts-expect-error Drizzle ORM type mismatch - cosmetic only
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
      if (key.requestsToday !== null && key.rateLimit !== null && key.requestsToday >= key.rateLimit) {
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
      
      return { success: true, current: updated.requestsToday ?? 0 };
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

    return results
      .filter(row => row.users !== null)
      .map(row => ({
        ...row.tours,
        guide: row.users!
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

    return results
      .filter(row => row.users !== null)
      .map(row => ({
        ...row.services,
        provider: row.users!
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
    return Array.from(new Set(allCities)).filter(city => city && city.trim().length > 0);
  }

  async getTourById(id: string): Promise<TourWithGuide | undefined> {
    return this.getTour(id);
  }

  // ========== ANALYTICS ==========
  
  async trackEvent(event: InsertAnalyticsEvent): Promise<AnalyticsEvent> {
    const [tracked] = await db.insert(analyticsEvents).values(event).returning();
    return tracked;
  }

  async getEntityAnalytics(
    entityId: string,
    entityType: string,
    startDate?: Date,
    endDate?: Date
  ): Promise<{
    totalViews: number;
    totalClicks: number;
    totalBookings: number;
    totalRevenue: number;
    conversionRate: number;
    eventsByType: Record<string, number>;
  }> {
    const conditions = [
      eq(analyticsEvents.targetId, entityId),
      eq(analyticsEvents.targetType, entityType)
    ];
    
    if (startDate) {
      conditions.push(gte(analyticsEvents.createdAt, startDate));
    }
    if (endDate) {
      conditions.push(lte(analyticsEvents.createdAt, endDate));
    }
    
    const events = await db
      .select()
      .from(analyticsEvents)
      .where(and(...conditions));
    
    const eventsByType: Record<string, number> = {};
    let totalRevenue = 0;
    
    for (const event of events) {
      eventsByType[event.eventCategory] = (eventsByType[event.eventCategory] || 0) + 1;
      
      if (event.eventCategory === "booking_paid" && event.metadata) {
        const metadata = typeof event.metadata === 'string' 
          ? JSON.parse(event.metadata) 
          : event.metadata;
        totalRevenue += (metadata as any)?.amount || 0;
      }
    }
    
    // ✅ FIX: Support both tour and service event types
    const totalViews = (eventsByType.tour_view || 0) + (eventsByType.service_view || 0);
    const totalClicks = (eventsByType.tour_click || 0) + (eventsByType.service_click || 0);
    const totalBookings = eventsByType.booking_created || 0;
    const conversionRate = totalViews > 0 ? (totalBookings / totalViews) * 100 : 0;
    
    return {
      totalViews,
      totalClicks,
      totalBookings,
      totalRevenue,
      conversionRate: Math.round(conversionRate * 100) / 100,
      eventsByType
    };
  }

  async getGuideAnalytics(
    guideId: string,
    startDate?: Date,
    endDate?: Date
  ): Promise<{
    totalViews: number;
    totalBookings: number;
    totalRevenue: number;
    topTours: Array<{ tourId: string; title: string; views: number; bookings: number; revenue: number }>;
    dailyStats: Array<{ date: string; views: number; bookings: number }>;
  }> {
    const guideTours = await db
      .select()
      .from(tours)
      .where(eq(tours.guideId, guideId));
    
    const tourIds = guideTours.map(t => t.id);
    
    if (tourIds.length === 0) {
      return {
        totalViews: 0,
        totalBookings: 0,
        totalRevenue: 0,
        topTours: [],
        dailyStats: []
      };
    }
    
    const conditions = [
      inArray(analyticsEvents.targetId, tourIds),
      eq(analyticsEvents.targetType, "tour")
    ];
    
    if (startDate) {
      conditions.push(gte(analyticsEvents.createdAt, startDate));
    }
    if (endDate) {
      conditions.push(lte(analyticsEvents.createdAt, endDate));
    }
    
    const events = await db
      .select()
      .from(analyticsEvents)
      .where(and(...conditions))
      .orderBy(analyticsEvents.createdAt);
    
    let totalViews = 0;
    let totalBookings = 0;
    let totalRevenue = 0;
    
    const tourStats: Record<string, { views: number; bookings: number; revenue: number }> = {};
    const dailyStatsMap: Record<string, { views: number; bookings: number }> = {};
    
    for (const event of events) {
      // Skip events without targetId
      if (!event.targetId) continue;
      
      if (!tourStats[event.targetId]) {
        tourStats[event.targetId] = { views: 0, bookings: 0, revenue: 0 };
      }
      
      if (event.eventCategory === "tour_view") {
        totalViews++;
        tourStats[event.targetId].views++;
      }
      
      if (event.eventCategory === "booking_created") {
        totalBookings++;
        tourStats[event.targetId].bookings++;
      }
      
      if (event.eventCategory === "booking_paid") {
        const metadata = typeof event.metadata === 'string' 
          ? JSON.parse(event.metadata) 
          : event.metadata;
        const amount = (metadata as any)?.amount || 0;
        totalRevenue += amount;
        tourStats[event.targetId].revenue += amount;
      }
      
      if (event.createdAt) {
        const dateKey = event.createdAt.toISOString().split('T')[0];
        if (!dailyStatsMap[dateKey]) {
          dailyStatsMap[dateKey] = { views: 0, bookings: 0 };
        }
        
        if (event.eventCategory === "tour_view") {
          dailyStatsMap[dateKey].views++;
        }
        if (event.eventCategory === "booking_created") {
          dailyStatsMap[dateKey].bookings++;
        }
      }
    }
    
    const topTours = guideTours
      .map(tour => ({
        tourId: tour.id,
        title: tour.title,
        views: tourStats[tour.id]?.views || 0,
        bookings: tourStats[tour.id]?.bookings || 0,
        revenue: tourStats[tour.id]?.revenue || 0
      }))
      .sort((a, b) => b.views - a.views)
      .slice(0, 5);
    
    const dailyStats = Object.entries(dailyStatsMap)
      .map(([date, stats]) => ({ date, ...stats }))
      .sort((a, b) => a.date.localeCompare(b.date));
    
    return {
      totalViews,
      totalBookings,
      totalRevenue,
      topTours,
      dailyStats
    };
  }

  async getProviderAnalytics(
    providerId: string,
    startDate?: Date,
    endDate?: Date
  ): Promise<{
    totalViews: number;
    totalClicks: number;
    topServices: Array<{ serviceId: string; name: string; views: number; clicks: number }>;
    dailyStats: Array<{ date: string; views: number; clicks: number }>;
  }> {
    const providerServices = await db
      .select()
      .from(services)
      .where(eq(services.providerId, providerId));
    
    const serviceIds = providerServices.map(s => s.id);
    
    if (serviceIds.length === 0) {
      return {
        totalViews: 0,
        totalClicks: 0,
        topServices: [],
        dailyStats: []
      };
    }
    
    const conditions = [
      inArray(analyticsEvents.targetId, serviceIds),
      eq(analyticsEvents.targetType, "service")
    ];
    
    if (startDate) {
      conditions.push(gte(analyticsEvents.createdAt, startDate));
    }
    if (endDate) {
      conditions.push(lte(analyticsEvents.createdAt, endDate));
    }
    
    const events = await db
      .select()
      .from(analyticsEvents)
      .where(and(...conditions))
      .orderBy(analyticsEvents.createdAt);
    
    let totalViews = 0;
    let totalClicks = 0;
    const serviceStats: Record<string, { views: number; clicks: number }> = {};
    const dailyStatsMap: Record<string, { views: number; clicks: number }> = {};
    
    for (const event of events) {
      // Skip events without targetId
      if (!event.targetId) continue;
      
      // Initialize service stats if not exists
      if (!serviceStats[event.targetId]) {
        serviceStats[event.targetId] = { views: 0, clicks: 0 };
      }
      
      // Track views - ✅ FIXED: eventCategory not eventType
      if (event.eventCategory === "service_view") {
        totalViews++;
        serviceStats[event.targetId].views++;
        
        if (event.createdAt) {
          const dateKey = event.createdAt.toISOString().split('T')[0];
          if (!dailyStatsMap[dateKey]) {
            dailyStatsMap[dateKey] = { views: 0, clicks: 0 };
          }
          dailyStatsMap[dateKey].views++;
        }
      }
      
      // Track clicks - ✅ FIXED: eventCategory not eventType
      if (event.eventCategory === "service_click") {
        totalClicks++;
        serviceStats[event.targetId].clicks++;
        
        if (event.createdAt) {
          const dateKey = event.createdAt.toISOString().split('T')[0];
          if (!dailyStatsMap[dateKey]) {
            dailyStatsMap[dateKey] = { views: 0, clicks: 0 };
          }
          dailyStatsMap[dateKey].clicks++;
        }
      }
    }
    
    const topServices = providerServices
      .map(service => ({
        serviceId: service.id,
        name: service.name,
        views: serviceStats[service.id]?.views || 0,
        clicks: serviceStats[service.id]?.clicks || 0
      }))
      .sort((a, b) => b.views - a.views)
      .slice(0, 5);
    
    const dailyStats = Object.entries(dailyStatsMap)
      .map(([date, stats]) => ({ date, views: stats.views, clicks: stats.clicks }))
      .sort((a, b) => a.date.localeCompare(b.date));
    
    return {
      totalViews,
      totalClicks,
      topServices,
      dailyStats
    };
  }

  // ========== LIKES (Phase 4) ==========
  
  async addLike(userId: string, targetId: string, targetType: 'profile' | 'tour' | 'service'): Promise<Like> {
    const [like] = await db.insert(likes).values({
      userId,
      targetId,
      targetType
    }).returning();
    return like;
  }

  async removeLike(userId: string, targetId: string, targetType: 'profile' | 'tour' | 'service'): Promise<void> {
    await db.delete(likes).where(
      and(
        eq(likes.userId, userId),
        eq(likes.targetId, targetId),
        eq(likes.targetType, targetType)
      )
    );
  }

  async getLikesCount(targetId: string, targetType: 'profile' | 'tour' | 'service'): Promise<number> {
    const result = await db.select({ count: sql<number>`count(*)::int` })
      .from(likes)
      .where(
        and(
          eq(likes.targetId, targetId),
          eq(likes.targetType, targetType)
        )
      );
    return result[0]?.count || 0;
  }

  async hasUserLiked(userId: string, targetId: string, targetType: 'profile' | 'tour' | 'service'): Promise<boolean> {
    const result = await db.select()
      .from(likes)
      .where(
        and(
          eq(likes.userId, userId),
          eq(likes.targetId, targetId),
          eq(likes.targetType, targetType)
        )
      )
      .limit(1);
    return result.length > 0;
  }

  async getUserTotalLikes(userId: string): Promise<number> {
    // Count likes for user's profile + tours + services
    const profileLikes = await db.select({ count: sql<number>`count(*)::int` })
      .from(likes)
      .where(
        and(
          eq(likes.targetId, userId),
          eq(likes.targetType, 'profile')
        )
      );
    
    const tourLikes = await db.select({ count: sql<number>`count(*)::int` })
      .from(likes)
      .innerJoin(tours, eq(likes.targetId, tours.id))
      .where(
        and(
          eq(tours.guideId, userId),
          eq(likes.targetType, 'tour')
        )
      );
    
    const serviceLikes = await db.select({ count: sql<number>`count(*)::int` })
      .from(likes)
      .innerJoin(services, eq(likes.targetId, services.id))
      .where(
        and(
          eq(services.providerId, userId),
          eq(likes.targetType, 'service')
        )
      );
    
    return (profileLikes[0]?.count || 0) + (tourLikes[0]?.count || 0) + (serviceLikes[0]?.count || 0);
  }

  // ========== TRUST LEVELS (Phase 4) ==========

  async calculateAndUpdateTrustLevel(userId: string): Promise<TrustLevelData> {
    // Get user's total likes
    const totalLikes = await this.getUserTotalLikes(userId);
    
    // Get user's average rating from reviews
    const userReviews = await db.select()
      .from(reviews)
      .innerJoin(tours, eq(reviews.tourId, tours.id))
      .where(eq(tours.guideId, userId));
    
    const serviceReviews = await db.select()
      .from(reviews)
      .innerJoin(services, eq(reviews.serviceId, services.id))
      .where(eq(services.providerId, userId));
    
    const allReviews = [...userReviews, ...serviceReviews];
    const avgRating = allReviews.length > 0
      ? allReviews.reduce((sum, r) => sum + r.reviews.rating, 0) / allReviews.length
      : 0;
    
    // Calculate score: (likes * 2) + (avg_rating * 10)
    const score = (totalLikes * 2) + (avgRating * 10);
    
    // Determine level based on score
    let level: 'explorer' | 'pathfinder' | 'trailblazer' | 'navigator' | 'legend' = 'explorer';
    if (score > 200) level = 'legend';
    else if (score > 100) level = 'navigator';
    else if (score > 50) level = 'trailblazer';
    else if (score > 20) level = 'pathfinder';
    
    // Upsert trust level
    const existing = await db.select().from(trustLevelsTable).where(eq(trustLevelsTable.userId, userId)).limit(1);
    
    if (existing.length > 0) {
      const [updated] = await db.update(trustLevelsTable)
        .set({
          level,
          score: Math.round(score),
          likesCount: totalLikes,
          averageRating: avgRating.toFixed(2),
          updatedAt: new Date()
        })
        .where(eq(trustLevelsTable.userId, userId))
        .returning();
      return updated;
    } else {
      const [created] = await db.insert(trustLevelsTable).values({
        userId,
        level,
        score: Math.round(score),
        likesCount: totalLikes,
        averageRating: avgRating.toFixed(2)
      }).returning();
      return created;
    }
  }

  async getTrustLevel(userId: string): Promise<TrustLevelData | null> {
    const result = await db.select().from(trustLevelsTable).where(eq(trustLevelsTable.userId, userId)).limit(1);
    return result[0] || null;
  }

  async getTrustLevelOrCreate(userId: string): Promise<TrustLevelData> {
    const existing = await this.getTrustLevel(userId);
    if (existing) return existing;
    return await this.calculateAndUpdateTrustLevel(userId);
  }

  // ============== Group Bookings (Phase 5) ==============

  // Helper: Generate unique group code
  private generateGroupCode(): string {
    const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789'; // Avoid confusing chars like I, O, 0, 1
    let code = '';
    for (let i = 0; i < 8; i++) {
      code += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    return code;
  }

  // Helper: Calculate dynamic price
  private calculateDynamicPrice(
    basePrice: number,
    currentParticipants: number,
    discountStep: number,
    minFloor: number
  ): number {
    const discount = (currentParticipants - 1) * discountStep;
    const newPrice = basePrice - discount;
    return Math.max(newPrice, minFloor);
  }

  // Create a new group booking for a tour
  async createGroupBooking(data: {
    tourId: string;
    tourDate: Date;
    maxParticipants: number;
    minParticipants?: number;
    basePricePerPerson: string;
    discountStep?: string;
  }) {
    const basePrice = parseFloat(data.basePricePerPerson);
    const discount = data.discountStep ? parseFloat(data.discountStep) : 5.00;
    const minFloor = basePrice * 0.6; // 60% of base price

    const groupCode = this.generateGroupCode();

    const [group] = await db.insert(groupBookings).values({
      tourId: data.tourId,
      tourDate: data.tourDate,
      maxParticipants: data.maxParticipants,
      minParticipants: data.minParticipants || 2,
      currentParticipants: 0,
      basePricePerPerson: data.basePricePerPerson,
      currentPricePerPerson: data.basePricePerPerson,
      discountStep: discount.toFixed(2),
      minPriceFloor: minFloor.toFixed(2),
      status: 'open',
      groupCode
    }).returning();

    return group;
  }

  // Get group by tour ID and date (for finding open groups)
  async getGroupByTourAndDate(tourId: string, tourDate: Date) {
    const result = await db
      .select()
      .from(groupBookings)
      .where(
        and(
          eq(groupBookings.tourId, tourId),
          eq(groupBookings.tourDate, tourDate),
          eq(groupBookings.status, 'open')
        )
      )
      .limit(1);

    return result[0] || null;
  }

  // Get group by ID
  async getGroupById(groupId: string) {
    const result = await db
      .select()
      .from(groupBookings)
      .where(eq(groupBookings.id, groupId))
      .limit(1);

    return result[0] || null;
  }

  // Get group by invite code
  async getGroupByCode(code: string) {
    const result = await db
      .select()
      .from(groupBookings)
      .where(eq(groupBookings.groupCode, code))
      .limit(1);

    return result[0] || null;
  }

  // Join a group booking (add participant and update pricing) - ATOMIC with transaction
  async joinGroupBooking(groupId: string, userId: string, participants: number = 1) {
    // Use transaction for atomicity
    return await db.transaction(async (tx) => {
      // Lock the group row for update to prevent concurrent modifications
      const [group] = await tx
        .select()
        .from(groupBookings)
        .where(eq(groupBookings.id, groupId))
        .for('update')
        .limit(1);

      if (!group) throw new Error('Group not found');
      
      if (group.status !== 'open' && group.status !== 'confirmed') {
        throw new Error('Group is not open for new participants');
      }

      const newParticipantCount = group.currentParticipants + participants;
      if (newParticipantCount > group.maxParticipants) {
        throw new Error('Group is full');
      }

      // Calculate new dynamic price
      const basePrice = parseFloat(group.basePricePerPerson);
      const discountStep = parseFloat(group.discountStep);
      const minFloor = parseFloat(group.minPriceFloor);
      const newPrice = this.calculateDynamicPrice(basePrice, newParticipantCount, discountStep, minFloor);

      // Determine new status
      let newStatus: 'open' | 'confirmed' | 'full' | 'closed' | 'cancelled' = 'open';
      if (newParticipantCount >= group.minParticipants && newParticipantCount < group.maxParticipants) {
        newStatus = 'confirmed'; // Minimum reached, tour confirmed
      } else if (newParticipantCount >= group.maxParticipants) {
        newStatus = 'full'; // Maximum reached
      }

      // Update group
      const [updatedGroup] = await tx
        .update(groupBookings)
        .set({
          currentParticipants: newParticipantCount,
          currentPricePerPerson: newPrice.toFixed(2),
          status: newStatus,
          updatedAt: new Date()
        })
        .where(eq(groupBookings.id, groupId))
        .returning();

      // Create booking record for this participant
      const totalAmount = (newPrice * participants).toFixed(2);
      const [booking] = await tx.insert(bookings).values({
        userId,
        tourId: group.tourId,
        groupBookingId: groupId,
        bookingDate: group.tourDate,
        participants,
        totalAmount,
        status: newStatus === 'confirmed' || newStatus === 'full' ? 'confirmed' : 'pending',
        paymentStatus: 'pending'
      }).returning();

      return { group: updatedGroup, booking };
    });
  }

  // Leave a group booking (remove participant and update pricing) - ATOMIC with transaction
  async leaveGroupBooking(groupId: string, userId: string, participants: number = 1) {
    return await db.transaction(async (tx) => {
      // Lock the group row for update
      const [group] = await tx
        .select()
        .from(groupBookings)
        .where(eq(groupBookings.id, groupId))
        .for('update')
        .limit(1);

      if (!group) throw new Error('Group not found');

      // Find user's booking in this group
      const [userBooking] = await tx
        .select()
        .from(bookings)
        .where(and(
          eq(bookings.groupBookingId, groupId),
          eq(bookings.userId, userId)
        ))
        .limit(1);

      if (!userBooking) {
        throw new Error('You are not a participant in this group');
      }

      const newParticipantCount = Math.max(0, group.currentParticipants - participants);

      // Calculate new dynamic price
      const basePrice = parseFloat(group.basePricePerPerson);
      const discountStep = parseFloat(group.discountStep);
      const minFloor = parseFloat(group.minPriceFloor);
      const newPrice = newParticipantCount > 0
        ? this.calculateDynamicPrice(basePrice, newParticipantCount, discountStep, minFloor)
        : basePrice;

      // Determine new status
      let newStatus: 'open' | 'confirmed' | 'full' | 'closed' | 'cancelled' = 'open';
      if (newParticipantCount >= group.minParticipants && newParticipantCount < group.maxParticipants) {
        newStatus = 'confirmed';
      } else if (newParticipantCount >= group.maxParticipants) {
        newStatus = 'full';
      } else if (newParticipantCount === 0) {
        newStatus = 'cancelled'; // No participants left
      }

      // Update group
      const [updatedGroup] = await tx
        .update(groupBookings)
        .set({
          currentParticipants: newParticipantCount,
          currentPricePerPerson: newPrice.toFixed(2),
          status: newStatus,
          updatedAt: new Date()
        })
        .where(eq(groupBookings.id, groupId))
        .returning();

      // Cancel user's booking
      await tx
        .update(bookings)
        .set({
          status: 'cancelled',
          updatedAt: new Date()
        })
        .where(eq(bookings.id, userBooking.id));

      return { group: updatedGroup, cancelledBooking: userBooking };
    });
  }

  // Update group status
  async updateGroupStatus(groupId: string, status: 'open' | 'full' | 'confirmed' | 'closed' | 'cancelled') {
    const [updated] = await db
      .update(groupBookings)
      .set({ status, updatedAt: new Date() })
      .where(eq(groupBookings.id, groupId))
      .returning();

    return updated;
  }

  // Get all group bookings for a user (via their bookings)
  async getUserGroupBookings(userId: string) {
    const result = await db
      .select({
        groupBooking: groupBookings,
        booking: bookings,
        tour: tours
      })
      .from(bookings)
      .innerJoin(groupBookings, eq(bookings.groupBookingId, groupBookings.id))
      .innerJoin(tours, eq(groupBookings.tourId, tours.id))
      .where(eq(bookings.userId, userId))
      .orderBy(desc(groupBookings.tourDate));

    return result;
  }

  // Get all participants in a group
  async getGroupParticipants(groupId: string) {
    const result = await db
      .select({
        user: users,
        booking: bookings
      })
      .from(bookings)
      .innerJoin(users, eq(bookings.userId, users.id))
      .where(eq(bookings.groupBookingId, groupId))
      .orderBy(bookings.createdAt);

    return result;
  }

  // Get all group bookings for a tour (for guides to see)
  async getTourGroupBookings(tourId: string) {
    const result = await db
      .select()
      .from(groupBookings)
      .where(eq(groupBookings.tourId, tourId))
      .orderBy(desc(groupBookings.tourDate));

    return result;
  }

  // ===== REWARDS SYSTEM (Phase 6) =====

  // Calculate level from total points
  calculateLevel(totalPoints: number): RewardLevel {
    if (totalPoints >= levelThresholds.diamond) return 'diamond';
    if (totalPoints >= levelThresholds.platinum) return 'platinum';
    if (totalPoints >= levelThresholds.gold) return 'gold';
    if (totalPoints >= levelThresholds.silver) return 'silver';
    return 'bronze';
  }

  // Calculate points to next level
  calculatePointsToNextLevel(totalPoints: number): { nextLevel: RewardLevel | null; pointsNeeded: number } {
    const currentLevel = this.calculateLevel(totalPoints);
    
    const levels: RewardLevel[] = ['bronze', 'silver', 'gold', 'platinum', 'diamond'];
    const currentIndex = levels.indexOf(currentLevel);
    
    if (currentIndex === levels.length - 1) {
      return { nextLevel: null, pointsNeeded: 0 }; // Max level
    }
    
    const nextLevel = levels[currentIndex + 1];
    const pointsNeeded = levelThresholds[nextLevel] - totalPoints;
    
    return { nextLevel, pointsNeeded };
  }

  // Update or create daily streak
  async updateStreak(userId: string): Promise<{ streakUpdated: boolean; currentStreak: number }> {
    const reward = await this.getUserRewardOrCreate(userId);
    
    const now = new Date();
    const lastActivity = reward.lastActivityDate ? new Date(reward.lastActivityDate) : null;
    
    // Check if activity is today
    if (lastActivity) {
      const daysSinceLastActivity = Math.floor((now.getTime() - lastActivity.getTime()) / (1000 * 60 * 60 * 24));
      
      if (daysSinceLastActivity === 0) {
        // Same day - no streak update
        return { streakUpdated: false, currentStreak: reward.currentStreak };
      } else if (daysSinceLastActivity === 1) {
        // Consecutive day - increment streak
        const newStreak = reward.currentStreak + 1;
        await db
          .update(userRewards)
          .set({
            currentStreak: newStreak,
            longestStreak: Math.max(newStreak, reward.longestStreak),
            lastActivityDate: now,
            updatedAt: now
          })
          .where(eq(userRewards.userId, userId));
        
        return { streakUpdated: true, currentStreak: newStreak };
      } else {
        // Streak broken - reset to 1
        await db
          .update(userRewards)
          .set({
            currentStreak: 1,
            lastActivityDate: now,
            updatedAt: now
          })
          .where(eq(userRewards.userId, userId));
        
        return { streakUpdated: true, currentStreak: 1 };
      }
    } else {
      // First activity
      await db
        .update(userRewards)
        .set({
          currentStreak: 1,
          lastActivityDate: now,
          updatedAt: now
        })
        .where(eq(userRewards.userId, userId));
      
      return { streakUpdated: true, currentStreak: 1 };
    }
  }

  // Get or create user reward record
  async getUserRewardOrCreate(userId: string): Promise<UserReward> {
    const existing = await db.select().from(userRewards).where(eq(userRewards.userId, userId)).limit(1);
    
    if (existing.length > 0) {
      return existing[0];
    }
    
    // Create new reward record
    const [newReward] = await db.insert(userRewards).values({
      userId,
      totalPoints: 0,
      currentLevel: 'bronze',
      currentStreak: 0,
      longestStreak: 0,
      achievementsUnlocked: []
    }).returning();
    
    return newReward;
  }

  // Award points to user
  async awardPoints(
    userId: string,
    action: RewardActionType,
    metadata?: {
      tourId?: string;
      bookingId?: string;
      reviewId?: string;
      targetId?: string;
      description?: string;
    }
  ): Promise<{ reward: UserReward; log: RewardLog; leveledUp: boolean; newLevel?: RewardLevel }> {
    return await db.transaction(async (tx) => {
      // Get current reward record
      const reward = await this.getUserRewardOrCreate(userId);
      const oldLevel = reward.currentLevel as RewardLevel;
      
      // Get points for this action
      const pointsAwarded = rewardPoints[action];
      const newTotalPoints = reward.totalPoints + pointsAwarded;
      const newLevel = this.calculateLevel(newTotalPoints);
      const leveledUp = newLevel !== oldLevel;
      
      // Update user reward
      const [updatedReward] = await tx
        .update(userRewards)
        .set({
          totalPoints: newTotalPoints,
          currentLevel: newLevel,
          updatedAt: new Date()
        })
        .where(eq(userRewards.userId, userId))
        .returning();
      
      // Create log entry
      const [log] = await tx.insert(rewardLogs).values({
        userId,
        points: pointsAwarded,
        action,
        metadata: metadata || {}
      }).returning();
      
      return {
        reward: updatedReward,
        log,
        leveledUp,
        newLevel: leveledUp ? newLevel : undefined
      };
    });
  }

  // Get user reward with stats
  async getUserReward(userId: string): Promise<UserReward | null> {
    const result = await db.select().from(userRewards).where(eq(userRewards.userId, userId)).limit(1);
    return result.length > 0 ? result[0] : null;
  }

  // Get reward history for user
  async getRewardHistory(userId: string, limit: number = 50): Promise<RewardLog[]> {
    return await db
      .select()
      .from(rewardLogs)
      .where(eq(rewardLogs.userId, userId))
      .orderBy(desc(rewardLogs.createdAt))
      .limit(limit);
  }

  // Get leaderboard
  async getRewardsLeaderboard(limit: number = 100): Promise<Array<UserReward & { user: User }>> {
    const result = await db
      .select({
        reward: userRewards,
        user: users
      })
      .from(userRewards)
      .innerJoin(users, eq(userRewards.userId, users.id))
      .orderBy(desc(userRewards.totalPoints))
      .limit(limit);
    
    return result.map(r => ({ ...r.reward, user: r.user }));
  }

  // Check if user has completed specific action before (for first-time bonuses)
  async hasCompletedActionBefore(userId: string, action: RewardActionType): Promise<boolean> {
    const result = await db
      .select()
      .from(rewardLogs)
      .where(and(
        eq(rewardLogs.userId, userId),
        eq(rewardLogs.action, action)
      ))
      .limit(1);
    
    return result.length > 0;
  }

  // Award streak bonus if eligible (7 day streak)
  async checkAndAwardStreakBonus(userId: string): Promise<boolean> {
    const reward = await this.getUserRewardOrCreate(userId);
    
    // Award bonus every 7 days of streak
    if (reward.currentStreak > 0 && reward.currentStreak % 7 === 0) {
      await this.awardPoints(userId, 'streak_bonus', {
        description: `${reward.currentStreak} day streak!`
      });
      return true;
    }
    
    return false;
  }

  // ========== REFERRAL SYSTEM (Phase 7.2) ==========

  // Generate unique random referral code (10 chars, alphanumeric)
  private generateReferralCode(): string {
    const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789'; // Exclude confusing chars (I, O, 0, 1)
    let code = '';
    for (let i = 0; i < 10; i++) {
      code += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    return code;
  }

  // Get or create referral code for a user
  async getUserReferralCode(userId: string): Promise<string> {
    // Check if user already has a referral code
    const existing = await db
      .select()
      .from(referrals)
      .where(eq(referrals.referrerId, userId))
      .limit(1);
    
    if (existing.length > 0) {
      return existing[0].referralCode;
    }

    // Generate new unique code
    let code = this.generateReferralCode();
    let attempts = 0;
    const maxAttempts = 10;

    while (attempts < maxAttempts) {
      const duplicate = await db
        .select()
        .from(referrals)
        .where(eq(referrals.referralCode, code))
        .limit(1);
      
      if (duplicate.length === 0) break;
      
      code = this.generateReferralCode();
      attempts++;
    }

    if (attempts >= maxAttempts) {
      throw new Error("Failed to generate unique referral code");
    }

    // Create referral record
    await db.insert(referrals).values({
      referrerId: userId,
      referralCode: code,
      status: 'pending',
      pointsAwarded: false,
    });

    return code;
  }

  // Validate if referral code exists and is valid
  async validateReferralCode(code: string): Promise<{ valid: boolean; referrerId?: string; message?: string }> {
    const result = await db
      .select()
      .from(referrals)
      .where(eq(referrals.referralCode, code))
      .limit(1);
    
    if (result.length === 0) {
      return { valid: false, message: "Invalid referral code" };
    }

    return {
      valid: true,
      referrerId: result[0].referrerId
    };
  }

  // Complete referral when new user signs up
  async completeReferral(
    code: string,
    newUserId: string,
    email: string,
    ip?: string
  ): Promise<{ success: boolean; message?: string; pointsAwarded?: boolean }> {
    return await db.transaction(async (tx) => {
      // Find the referral record
      const referralRecords = await tx
        .select()
        .from(referrals)
        .where(eq(referrals.referralCode, code))
        .limit(1);
      
      if (referralRecords.length === 0) {
        return { success: false, message: "Invalid referral code" };
      }

      const referral = referralRecords[0];

      // Anti-abuse check: prevent self-referral
      if (referral.referrerId === newUserId) {
        return { success: false, message: "Cannot refer yourself" };
      }

      // Anti-abuse check: check if this email was already used for a referral
      const emailCheck = await tx
        .select()
        .from(referrals)
        .where(and(
          eq(referrals.refereeEmail, email),
          eq(referrals.status, 'completed')
        ))
        .limit(1);
      
      if (emailCheck.length > 0) {
        return { success: false, message: "This email was already referred" };
      }

      // Update referral record
      await tx
        .update(referrals)
        .set({
          refereeId: newUserId,
          refereeEmail: email,
          refereeIp: ip || null,
          status: 'completed',
          completedAt: new Date(),
        })
        .where(eq(referrals.id, referral.id));

      // Award points to both users (100 points each)
      try {
        // Award to referrer (person who invited)
        await this.awardPoints(referral.referrerId, 'referral', {
          targetId: newUserId,
          description: 'Friend signed up via your referral link'
        });

        // Award to referee (new user)
        await this.awardPoints(newUserId, 'referral', {
          targetId: referral.referrerId,
          description: 'Signed up via referral link'
        });

        // Mark points as awarded
        await tx
          .update(referrals)
          .set({ pointsAwarded: true })
          .where(eq(referrals.id, referral.id));

        return { success: true, pointsAwarded: true };
      } catch (error) {
        console.error("Error awarding referral points:", error);
        return { success: true, pointsAwarded: false, message: "Referral completed but points award failed" };
      }
    });
  }

  // Get all referrals for a user (people they invited)
  async getUserReferrals(userId: string): Promise<Array<Referral & { referee?: User }>> {
    const result = await db
      .select({
        referral: referrals,
        referee: users,
      })
      .from(referrals)
      .leftJoin(users, eq(referrals.refereeId, users.id))
      .where(eq(referrals.referrerId, userId))
      .orderBy(desc(referrals.createdAt));
    
    return result.map(r => ({
      ...r.referral,
      referee: r.referee || undefined,
    }));
  }

  // Get referral statistics for a user
  async getReferralStats(userId: string): Promise<{
    totalReferrals: number;
    completedReferrals: number;
    pendingReferrals: number;
    pointsEarned: number;
  }> {
    const userReferrals = await this.getUserReferrals(userId);
    
    const completed = userReferrals.filter(r => r.status === 'completed');
    const pending = userReferrals.filter(r => r.status === 'pending');
    
    // Each completed referral earns 100 points
    const pointsEarned = completed.filter(r => r.pointsAwarded).length * 100;

    return {
      totalReferrals: userReferrals.length,
      completedReferrals: completed.length,
      pendingReferrals: pending.length,
      pointsEarned,
    };
  }

  // ========== Smart Groups Operations (Phase 8) ==========

  // Helper: Generate unique 10-character invite code
  private generateInviteCode(): string {
    const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789'; // Exclude confusing chars
    let code = '';
    for (let i = 0; i < 10; i++) {
      code += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    return code;
  }

  // Get count of active smart groups for a user
  async getUserActiveGroupsCount(userId: string): Promise<number> {
    const result = await db
      .select({ count: sql<number>`count(*)` })
      .from(smartGroups)
      .where(
        and(
          eq(smartGroups.creatorId, userId),
          inArray(smartGroups.status, ['active', 'full'])
        )
      );
    
    return Number(result[0]?.count || 0);
  }

  // Get last group creation timestamp for a user
  async getUserLastGroupCreation(userId: string): Promise<Date | null> {
    const result = await db
      .select({ createdAt: smartGroups.createdAt })
      .from(smartGroups)
      .where(eq(smartGroups.creatorId, userId))
      .orderBy(desc(smartGroups.createdAt))
      .limit(1);
    
    return result[0]?.createdAt || null;
  }

  // Create a new smart group with validations
  async createSmartGroup(userId: string, data: Omit<InsertSmartGroup, 'creatorId'>): Promise<SmartGroup> {
    // Validation 1: Check 3 active groups limit
    const activeCount = await this.getUserActiveGroupsCount(userId);
    if (activeCount >= 3) {
      throw new Error('You can have maximum 3 active groups at a time');
    }

    // Validation 2: Check 24h cooldown
    const lastCreation = await this.getUserLastGroupCreation(userId);
    if (lastCreation) {
      const hoursSinceLastCreation = (Date.now() - lastCreation.getTime()) / (1000 * 60 * 60);
      if (hoursSinceLastCreation < 24) {
        const hoursRemaining = Math.ceil(24 - hoursSinceLastCreation);
        throw new Error(`Please wait ${hoursRemaining} hours before creating another group`);
      }
    }

    // Generate unique invite code
    let inviteCode = this.generateInviteCode();
    let codeExists = true;
    while (codeExists) {
      const existing = await db
        .select()
        .from(smartGroups)
        .where(eq(smartGroups.inviteCode, inviteCode))
        .limit(1);
      if (existing.length === 0) {
        codeExists = false;
      } else {
        inviteCode = this.generateInviteCode();
      }
    }

    // Set expiration to 72 hours from now
    const expiresAt = new Date(Date.now() + 72 * 60 * 60 * 1000);

    // Create the group
    const [group] = await db
      .insert(smartGroups)
      .values({
        ...data,
        creatorId: userId,
        inviteCode,
        expiresAt,
        currentParticipants: 1, // Creator counts as first participant
      })
      .returning();

    // Add creator as first member
    await db.insert(smartGroupMembers).values({
      groupId: group.id,
      userId,
      invitedBy: null, // Creator wasn't invited
    });

    // Award points for creating group
    await this.awardPoints(userId, 'smart_group_create', {
      metadata: {
        targetId: group.id,
        description: `Created smart group: ${group.name}`,
      },
    });

    return group;
  }

  // Get nearby smart groups using geo query
  async getNearbySmartGroups(latitude: number, longitude: number, radiusKm: number = 50): Promise<SmartGroupWithDetails[]> {
    // Use Haversine formula to calculate distance
    // Earth radius in km
    const earthRadiusKm = 6371;
    
    // Convert radius to degrees (approximate)
    const latDelta = radiusKm / 111.0; // 1 degree latitude ~= 111 km
    const lngDelta = radiusKm / (111.0 * Math.cos((latitude * Math.PI) / 180));

    const results = await db
      .select({
        group: smartGroups,
        creator: users,
        tour: tours,
        service: services,
        memberCount: sql<number>`count(distinct ${smartGroupMembers.id})`,
        messageCount: sql<number>`count(distinct ${smartGroupMessages.id})`,
      })
      .from(smartGroups)
      .leftJoin(users, eq(smartGroups.creatorId, users.id))
      .leftJoin(tours, eq(smartGroups.tourId, tours.id))
      .leftJoin(services, eq(smartGroups.serviceId, services.id))
      .leftJoin(smartGroupMembers, eq(smartGroups.id, smartGroupMembers.groupId))
      .leftJoin(smartGroupMessages, eq(smartGroups.id, smartGroupMessages.groupId))
      .where(
        and(
          eq(smartGroups.status, 'active'),
          gt(smartGroups.expiresAt, new Date()),
          gte(smartGroups.latitude, latitude - latDelta),
          lte(smartGroups.latitude, latitude + latDelta),
          gte(smartGroups.longitude, longitude - lngDelta),
          lte(smartGroups.longitude, longitude + lngDelta)
        )
      )
      .groupBy(smartGroups.id, users.id, tours.id, services.id);

    // Calculate actual distance and filter
    const groupsWithDistance = results.map(r => {
      const lat1 = latitude;
      const lon1 = longitude;
      const lat2 = r.group.latitude;
      const lon2 = r.group.longitude;

      const dLat = ((lat2 - lat1) * Math.PI) / 180;
      const dLon = ((lon2 - lon1) * Math.PI) / 180;

      const a =
        Math.sin(dLat / 2) * Math.sin(dLat / 2) +
        Math.cos((lat1 * Math.PI) / 180) *
          Math.cos((lat2 * Math.PI) / 180) *
          Math.sin(dLon / 2) *
          Math.sin(dLon / 2);

      const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
      const distance = earthRadiusKm * c;

      return {
        ...r.group,
        creator: r.creator!,
        tour: r.tour || undefined,
        service: r.service || undefined,
        _count: {
          members: Number(r.memberCount),
          messages: Number(r.messageCount),
        },
        distance,
      };
    });

    return groupsWithDistance.filter(g => g.distance <= radiusKm);
  }

  // Get single smart group with details
  async getSmartGroup(id: string): Promise<SmartGroupWithDetails | null> {
    const results = await db
      .select({
        group: smartGroups,
        creator: users,
        tour: tours,
        service: services,
      })
      .from(smartGroups)
      .leftJoin(users, eq(smartGroups.creatorId, users.id))
      .leftJoin(tours, eq(smartGroups.tourId, tours.id))
      .leftJoin(services, eq(smartGroups.serviceId, services.id))
      .where(eq(smartGroups.id, id))
      .limit(1);

    if (!results.length) return null;

    const result = results[0];

    // Get members
    const membersData = await db
      .select({
        member: smartGroupMembers,
        user: users,
      })
      .from(smartGroupMembers)
      .leftJoin(users, eq(smartGroupMembers.userId, users.id))
      .where(eq(smartGroupMembers.groupId, id));

    // Get counts
    const counts = await db
      .select({
        memberCount: sql<number>`count(distinct ${smartGroupMembers.id})`,
        messageCount: sql<number>`count(distinct ${smartGroupMessages.id})`,
      })
      .from(smartGroups)
      .leftJoin(smartGroupMembers, eq(smartGroups.id, smartGroupMembers.groupId))
      .leftJoin(smartGroupMessages, eq(smartGroups.id, smartGroupMessages.groupId))
      .where(eq(smartGroups.id, id))
      .groupBy(smartGroups.id);

    return {
      ...result.group,
      creator: result.creator!,
      tour: result.tour || undefined,
      service: result.service || undefined,
      members: membersData.map(m => ({ ...m.member, user: m.user! })),
      _count: {
        members: Number(counts[0]?.memberCount || 0),
        messages: Number(counts[0]?.messageCount || 0),
      },
    };
  }

  // Join a smart group
  async joinSmartGroup(groupId: string, userId: string, inviteCode?: string): Promise<SmartGroupMember> {
    // Get the group
    const group = await this.getSmartGroup(groupId);
    if (!group) {
      throw new Error('Group not found');
    }

    // Validate status
    if (group.status === 'expired') {
      throw new Error('This group has expired');
    }
    if (group.status === 'completed') {
      throw new Error('This group is already completed');
    }
    if (group.status === 'full') {
      throw new Error('This group is full');
    }

    // Check expiration
    if (new Date(group.expiresAt) < new Date()) {
      throw new Error('This group has expired');
    }

    // Check if already a member
    const existingMember = await db
      .select()
      .from(smartGroupMembers)
      .where(
        and(
          eq(smartGroupMembers.groupId, groupId),
          eq(smartGroupMembers.userId, userId)
        )
      )
      .limit(1);

    if (existingMember.length > 0) {
      throw new Error('You are already a member of this group');
    }

    // Validate invite code if provided
    if (inviteCode && inviteCode !== group.inviteCode) {
      throw new Error('Invalid invite code');
    }

    // Check capacity
    if (group.currentParticipants >= group.targetParticipants) {
      throw new Error('This group is full');
    }

    // Add member
    const [member] = await db
      .insert(smartGroupMembers)
      .values({
        groupId,
        userId,
        invitedBy: null, // Could be enhanced to track who shared the invite
      })
      .returning();

    // Update participant count
    const newCount = group.currentParticipants + 1;
    const newStatus = newCount >= group.targetParticipants ? 'full' : 'active';

    await db
      .update(smartGroups)
      .set({
        currentParticipants: newCount,
        status: newStatus,
        updatedAt: new Date(),
      })
      .where(eq(smartGroups.id, groupId));

    // Award points to joiner
    await this.awardPoints(userId, 'smart_group_join', {
      metadata: {
        targetId: groupId,
        description: `Joined smart group: ${group.name}`,
      },
    });

    // Award points to group creator for each participant
    await this.awardPoints(group.creatorId, 'smart_group_join', {
      metadata: {
        targetId: groupId,
        description: `Participant joined your group: ${group.name}`,
      },
    });

    // If group is now complete, award completion bonus
    if (newStatus === 'full') {
      await this.awardPoints(group.creatorId, 'smart_group_complete', {
        metadata: {
          targetId: groupId,
          description: `Smart group completed: ${group.name}`,
        },
      });
    }

    return member;
  }

  // Leave a smart group
  async leaveSmartGroup(groupId: string, userId: string): Promise<void> {
    // Check if member
    const memberResult = await db
      .select()
      .from(smartGroupMembers)
      .where(
        and(
          eq(smartGroupMembers.groupId, groupId),
          eq(smartGroupMembers.userId, userId)
        )
      )
      .limit(1);

    if (!memberResult.length) {
      throw new Error('You are not a member of this group');
    }

    // Get group to check if user is creator
    const group = await this.getSmartGroup(groupId);
    if (!group) {
      throw new Error('Group not found');
    }

    if (group.creatorId === userId) {
      throw new Error('Group creators cannot leave their own group. Delete it instead.');
    }

    // Remove member
    await db
      .delete(smartGroupMembers)
      .where(
        and(
          eq(smartGroupMembers.groupId, groupId),
          eq(smartGroupMembers.userId, userId)
        )
      );

    // Update participant count
    const newCount = Math.max(0, group.currentParticipants - 1);
    await db
      .update(smartGroups)
      .set({
        currentParticipants: newCount,
        status: 'active', // Reset to active if was full
        updatedAt: new Date(),
      })
      .where(eq(smartGroups.id, groupId));
  }

  // Get user's smart groups (created or joined)
  async getMySmartGroups(userId: string): Promise<SmartGroupWithDetails[]> {
    // Get groups where user is a member
    const memberGroups = await db
      .select({ groupId: smartGroupMembers.groupId })
      .from(smartGroupMembers)
      .where(eq(smartGroupMembers.userId, userId));

    const groupIds = memberGroups.map(m => m.groupId);

    if (groupIds.length === 0) {
      return [];
    }

    // Get full group details
    const results = await db
      .select({
        group: smartGroups,
        creator: users,
        tour: tours,
        service: services,
        memberCount: sql<number>`count(distinct ${smartGroupMembers.id})`,
        messageCount: sql<number>`count(distinct ${smartGroupMessages.id})`,
      })
      .from(smartGroups)
      .leftJoin(users, eq(smartGroups.creatorId, users.id))
      .leftJoin(tours, eq(smartGroups.tourId, tours.id))
      .leftJoin(services, eq(smartGroups.serviceId, services.id))
      .leftJoin(smartGroupMembers, eq(smartGroups.id, smartGroupMembers.groupId))
      .leftJoin(smartGroupMessages, eq(smartGroups.id, smartGroupMessages.groupId))
      .where(inArray(smartGroups.id, groupIds))
      .groupBy(smartGroups.id, users.id, tours.id, services.id);

    return results.map(r => ({
      ...r.group,
      creator: r.creator!,
      tour: r.tour || undefined,
      service: r.service || undefined,
      _count: {
        members: Number(r.memberCount),
        messages: Number(r.messageCount),
      },
    }));
  }

  // Get messages for a smart group
  async getSmartGroupMessages(groupId: string, limit: number = 50): Promise<(SmartGroupMessage & { user: User })[]> {
    const results = await db
      .select({
        message: smartGroupMessages,
        user: users,
      })
      .from(smartGroupMessages)
      .leftJoin(users, eq(smartGroupMessages.userId, users.id))
      .where(eq(smartGroupMessages.groupId, groupId))
      .orderBy(desc(smartGroupMessages.createdAt))
      .limit(limit);

    return results.map(r => ({ ...r.message, user: r.user! })).reverse();
  }

  // Send a message in a smart group
  async sendGroupMessage(groupId: string, userId: string, message: string): Promise<SmartGroupMessage> {
    // Verify user is a member
    const isMember = await db
      .select()
      .from(smartGroupMembers)
      .where(
        and(
          eq(smartGroupMembers.groupId, groupId),
          eq(smartGroupMembers.userId, userId)
        )
      )
      .limit(1);

    if (!isMember.length) {
      throw new Error('You must be a member to send messages');
    }

    // Create message
    const [newMessage] = await db
      .insert(smartGroupMessages)
      .values({
        groupId,
        userId,
        message,
      })
      .returning();

    return newMessage;
  }

  // Create a personal invite for a smart group
  async createGroupInvite(groupId: string, userId: string, expiresAt: Date): Promise<SmartGroupInvite> {
    // Verify user is a member
    const isMember = await db
      .select()
      .from(smartGroupMembers)
      .where(
        and(
          eq(smartGroupMembers.groupId, groupId),
          eq(smartGroupMembers.userId, userId)
        )
      )
      .limit(1);

    if (!isMember.length) {
      throw new Error('You must be a member to create invites');
    }

    // Generate unique invite code
    let inviteCode = this.generateInviteCode();
    let codeExists = true;
    while (codeExists) {
      const existing = await db
        .select()
        .from(smartGroupInvites)
        .where(eq(smartGroupInvites.inviteCode, inviteCode))
        .limit(1);
      if (existing.length === 0) {
        codeExists = false;
      } else {
        inviteCode = this.generateInviteCode();
      }
    }

    // Create invite
    const [invite] = await db
      .insert(smartGroupInvites)
      .values({
        groupId,
        inviteCode,
        createdBy: userId,
        expiresAt,
      })
      .returning();

    return invite;
  }

  // Expire old smart groups (groups older than 72h)
  async expireOldGroups(): Promise<number> {
    const now = new Date();

    const result = await db
      .update(smartGroups)
      .set({
        status: 'expired',
        updatedAt: now,
      })
      .where(
        and(
          lte(smartGroups.expiresAt, now),
          inArray(smartGroups.status, ['active', 'full'])
        )
      )
      .returning({ id: smartGroups.id });

    return result.length;
  }
}

export const storage = new DatabaseStorage();
