import {
  users,
  tours,
  services,
  serviceCategories,
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
  aiLogs,
  groupEvents,
  partnerships,
  searchLogs,
  embeddings,
  contentReports,
  notifications,
  rewardPoints,
  levelThresholds,
  partners,
  packages,
  packageBookings,
  partnerAccounts,
  payouts,
  coupons,
  affiliateLinks,
  auditLogs,
  externalConnectors,
  externalInventoryMap,
  userSettings,
  type User,
  type UpsertUser,
  type UserSettings,
  type UpdateUserSettings,
  type Tour,
  type InsertTour,
  type Service,
  type InsertService,
  type ServiceCategory,
  type InsertServiceCategory,
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
  type AILog,
  type InsertAILog,
  type GroupEvent,
  type InsertGroupEvent,
  type Partnership,
  type InsertPartnership,
  type SearchLog,
  type InsertSearchLog,
  type Embedding,
  type InsertEmbedding,
  type ContentReport,
  type InsertContentReport,
  type Notification,
  type InsertNotification,
  type RewardActionType,
  type RewardLevel,
  type TourWithGuide,
  type ServiceWithProvider,
  type BookingWithDetails,
  type UserRole,
  type LikeTargetType,
  type TrustLevel,
  type InsertPartner,
  type Partner,
  type InsertPackage,
  type Package,
  type InsertPackageBooking,
  type PackageBooking,
  type PartnerAccount,
  type Payout,
  type InsertAuditLog,
  type AuditLog,
  type InsertCoupon,
  type Coupon,
  type InsertAffiliateLink,
  type AffiliateLink,
  type InsertExternalConnector,
  type ExternalConnector,
  type ExternalInventoryMapping,
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
  getUserByUsername(username: string): Promise<User | undefined>;
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
  getPendingServices(): Promise<ServiceWithProvider[]>;
  createService(service: InsertService): Promise<Service>;
  updateService(id: string, service: Partial<InsertService>): Promise<Service>;
  deleteService(id: string): Promise<void>;
  updateServiceApprovalStatus(serviceId: string, status: 'approved' | 'rejected', supervisorId: string): Promise<Service>;
  
  // Phase 13 - Service Categories
  getServiceCategories(): Promise<ServiceCategory[]>;
  getServiceCategory(id: string): Promise<ServiceCategory | undefined>;
  moderateService(id: string, moderatedBy: string, status: string, notes?: string): Promise<Service>;
  
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
  getReviewByBookingId(bookingId: string): Promise<Review | undefined>;
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
  
  // Group Marketplace operations (Phase 11)
  getMarketplaceGroups(filters: {
    destination?: string;
    dateFrom?: Date;
    dateTo?: Date;
    minPrice?: number;
    maxPrice?: number;
    minParticipants?: number;
    maxParticipants?: number;
    language?: string;
    status?: string;
    sortBy?: 'date' | 'price' | 'popularity' | 'urgency';
    limit?: number;
  }): Promise<any[]>;
  
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
  isUserInSmartGroup(groupId: string, userId: string): Promise<boolean>;
  
  // AI Travel Companion operations (Phase 9)
  logAIInteraction(params: {
    userId: string;
    groupId?: string;
    actionType: string;
    inputData: any;
    outputData: any;
    userConsent: boolean;
    language?: string;
    metadata?: any;
  }): Promise<AILog>;
  getAILogs(params: {
    userId?: string;
    groupId?: string;
    actionType?: string;
    limit?: number;
    offset?: number;
  }): Promise<AILog[]>;
  createGroupEvent(params: {
    groupId: string;
    creatorId: string;
    eventType: string;
    title: string;
    description?: string;
    eventDate: Date;
    location?: string;
    latitude?: number;
    longitude?: number;
    notificationTimes?: Date[];
  }): Promise<GroupEvent>;
  getGroupEvents(params: {
    groupId?: string;
    creatorId?: string;
    eventType?: string;
    status?: string;
    upcomingOnly?: boolean;
    limit?: number;
    offset?: number;
  }): Promise<GroupEvent[]>;
  updateEventStatus(eventId: string, status: string): Promise<GroupEvent | null>;
  getUpcomingNotifications(windowMinutes?: number): Promise<GroupEvent[]>;
  hasUserConsentedToAI(userId: string): Promise<boolean>;
  updateAIConsent(userId: string, consent: boolean): Promise<void>;
  getAIConsentStatus(userId: string): Promise<{ hasConsented: boolean; consentDate: Date | null }>;
  
  // Partnership Management (Phase 10)
  createPartnership(data: {
    userId: string;
    tier: 'standard' | 'premium' | 'pro';
    stripeSubscriptionId?: string;
    stripeCustomerId?: string;
    stripePriceId?: string;
    endDate?: Date;
  }): Promise<Partnership>;
  getPartnershipByUserId(userId: string): Promise<Partnership | null>;
  updatePartnershipStatus(
    partnershipId: string,
    status: 'active' | 'cancelled' | 'expired'
  ): Promise<void>;
  incrementPartnershipAnalytics(
    userId: string,
    field: 'profileViews' | 'tourViews' | 'serviceViews' | 'clicks' | 'conversions' | 'likes' | 'reviews'
  ): Promise<void>;
  
  // Search Logging (Phase 10)
  logSearch(data: {
    userId?: string;
    query: string;
    searchType?: string;
    resultsCount: number;
    filters?: any;
  }): Promise<SearchLog>;
  updateSearchClick(
    searchLogId: string,
    entityId: string,
    entityType: string
  ): Promise<void>;
  
  // Embeddings Management (Phase 10)
  createEmbedding(data: {
    entityId: string;
    entityType: 'guide' | 'tour' | 'service';
    content: string;
    embedding: number[];
    language?: string;
  }): Promise<Embedding>;
  getEmbedding(
    entityId: string,
    entityType: string
  ): Promise<Embedding | null>;
  searchSimilarEmbeddings(
    queryEmbedding: number[],
    entityType?: string,
    limit?: number
  ): Promise<Array<Embedding & { similarity: number }>>;
  
  // Content Reports (Moderation)
  createContentReport(data: InsertContentReport): Promise<ContentReport>;
  getPendingReports(): Promise<ContentReport[]>;
  reviewContentReport(
    id: string,
    reviewerId: string,
    status: string,
    actionTaken: string
  ): Promise<void>;
  
  // Notifications
  createNotification(data: InsertNotification): Promise<Notification>;
  getUserNotifications(userId: string): Promise<Notification[]>;
  markNotificationAsRead(id: string, userId: string): Promise<void>;
  markAllNotificationsAsRead(userId: string): Promise<void>;
  
  // Community Leader Badge
  checkCommunityLeaderBadge(userId: string): Promise<void>;
  
  // Group Booking Payment operations
  getGroupById(groupId: string): Promise<GroupBooking | undefined>;
  getExpiredGroups(): Promise<GroupBooking[]>;
  updateGroupStatus(groupId: string, status: string): Promise<void>;
  getGroupMembers(groupId: string): Promise<Array<{ userId: string; email: string; firstName: string; lastName: string }>>;
  
  // GDPR Compliance operations
  deleteUserPosts(userId: string): Promise<void>;
  deleteUserComments(userId: string): Promise<void>;
  deleteUserLikes(userId: string): Promise<void>;
  anonymizeUserBookings(userId: string): Promise<void>;
  deactivateUser(userId: string): Promise<void>;
  getUserPosts(userId: string): Promise<Post[]>;
  getUserMessages(userId: string): Promise<SelectMessage[]>;
  
  // Partner GDPR operations
  getPartnerPackages(partnerId: string): Promise<Package[]>;
  getPartnerCoupons(partnerId: string): Promise<Coupon[]>;
  getUserAffiliateLinks(userId: string): Promise<AffiliateLink[]>;
  getPartnerPayouts(partnerId: string): Promise<Payout[]>;
  deactivatePartnerPackages(partnerId: string): Promise<void>;
  deactivatePartnerCoupons(partnerId: string): Promise<void>;
  anonymizePartnerProfile(partnerId: string): Promise<void>;
  anonymizePartnerPayouts(partnerId: string): Promise<void>;
  getUserReviews(userId: string): Promise<Review[]>;
  getUserBookings(userId: string): Promise<BookingWithDetails[]>;
  
  // User Settings (Geolocation) operations
  getUserSettings(userId: string): Promise<UserSettings | undefined>;
  upsertUserSettings(userId: string, settings: UpdateUserSettings): Promise<UserSettings>;
  
  // Like operations (Hype system)
  createLike(userId: string, targetId: string, targetType: LikeTargetType): Promise<Like | null>;
  deleteLike(userId: string, targetId: string, targetType: LikeTargetType): Promise<void>;
  getLikesByTarget(targetId: string, targetType: LikeTargetType): Promise<number>;
  getUserLikes(userId: string): Promise<Like[]>;
  checkUserLike(userId: string, targetId: string, targetType: LikeTargetType): Promise<boolean>;
  getMultipleLikesStatus(userId: string, targetIds: string[], targetType: LikeTargetType): Promise<Record<string, boolean>>;
  updateTrustLevel(userId: string): Promise<void>;
}

export class DatabaseStorage implements IStorage {
  // Expose db for advanced queries (e.g., search-service)
  public db = db;

  // User operations
  async getUser(id: string): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.id, id));
    return user;
  }

  async getUserByUsername(username: string): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.email, username));
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

  // Phase 13 - Service Categories
  async getServiceCategories(): Promise<ServiceCategory[]> {
    return await db.query.serviceCategories.findMany({
      orderBy: (categories, { asc }) => [asc(categories.name)],
    });
  }

  async getServiceCategory(id: string): Promise<ServiceCategory | undefined> {
    return await db.query.serviceCategories.findFirst({
      where: eq(serviceCategories.id, id),
    });
  }

  // Phase 13 - Service Moderation
  async moderateService(id: string, moderatedBy: string, status: string, notes?: string): Promise<Service> {
    const [moderated] = await db
      .update(services)
      .set({
        moderationStatus: status,
        moderatedBy,
        moderatedAt: new Date(),
        moderationNotes: notes,
      })
      .where(eq(services.id, id))
      .returning();
    return moderated;
  }

  async getPendingServices(): Promise<ServiceWithProvider[]> {
    const results = await db
      .select()
      .from(services)
      .leftJoin(users, eq(services.providerId, users.id))
      .where(eq(services.approvalStatus, 'pending'))
      .orderBy(desc(services.createdAt));

    return results.map(r => ({
      ...r.services,
      provider: r.users!,
    }));
  }

  async updateServiceApprovalStatus(serviceId: string, status: 'approved' | 'rejected', supervisorId: string): Promise<Service> {
    const [service] = await db
      .update(services)
      .set({ 
        approvalStatus: status,
        approvedBy: supervisorId,
        approvedAt: new Date(),
        updatedAt: new Date() 
      })
      .where(eq(services.id, serviceId))
      .returning();
    return service;
  }

  // Phase 13 Task 9 - Get services by provider with category
  async getServicesByProvider(providerId: string): Promise<ServiceWithProvider[]> {
    const results = await db
      .select()
      .from(services)
      .leftJoin(users, eq(services.providerId, users.id))
      .leftJoin(serviceCategories, eq(services.categoryId, serviceCategories.id))
      .where(eq(services.providerId, providerId))
      .orderBy(desc(services.createdAt));

    return results.map(r => ({
      ...r.services,
      provider: r.users!,
      category: r.service_categories,
    }));
  }

  // Phase 13 Task 10 - Get services by moderation status
  async getServicesByStatus(status: string): Promise<ServiceWithProvider[]> {
    const results = await db
      .select()
      .from(services)
      .leftJoin(users, eq(services.providerId, users.id))
      .leftJoin(serviceCategories, eq(services.categoryId, serviceCategories.id))
      .where(eq(services.moderationStatus, status))
      .orderBy(desc(services.createdAt));

    return results.map(r => ({
      ...r.services,
      provider: r.users!,
      category: r.service_categories,
    }));
  }

  // Phase 13 Task 11 - Calculate distance using Haversine formula
  calculateDistance(lat1: number, lon1: number, lat2: number, lon2: number): number {
    const R = 6371e3; // Earth radius in meters
    const φ1 = lat1 * Math.PI / 180;
    const φ2 = lat2 * Math.PI / 180;
    const Δφ = (lat2 - lat1) * Math.PI / 180;
    const Δλ = (lon2 - lon1) * Math.PI / 180;

    const a = Math.sin(Δφ / 2) * Math.sin(Δφ / 2) +
              Math.cos(φ1) * Math.cos(φ2) *
              Math.sin(Δλ / 2) * Math.sin(Δλ / 2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));

    return R * c; // Distance in meters
  }

  // Phase 13 Task 11 - Get nearby services with geolocation filtering
  async getNearbyServices(lat: number, lng: number, radiusMeters: number): Promise<ServiceWithProvider[]> {
    const allServices = await db
      .select()
      .from(services)
      .leftJoin(users, eq(services.providerId, users.id))
      .leftJoin(serviceCategories, eq(services.categoryId, serviceCategories.id))
      .where(eq(services.moderationStatus, 'approved'))
      .orderBy(desc(services.createdAt));

    // Filter by distance using Haversine formula
    const nearby = allServices.filter(result => {
      if (!result.services.latitude || !result.services.longitude) return false;
      const distance = this.calculateDistance(
        lat,
        lng,
        result.services.latitude,
        result.services.longitude
      );
      return distance <= radiusMeters;
    });

    return nearby.map(r => ({
      ...r.services,
      provider: r.users!,
      category: r.service_categories,
    }));
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

  async getReviewByBookingId(bookingId: string): Promise<Review | undefined> {
    const [review] = await db.select()
      .from(reviews)
      .where(eq(reviews.bookingId, bookingId))
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

  async getServiceById(id: string): Promise<ServiceWithProvider | undefined> {
    return this.getService(id);
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

  async likeService(userId: string, serviceId: string): Promise<Like> {
    return await this.addLike(userId, serviceId, 'service');
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
    await db
      .update(groupBookings)
      .set({ status, updatedAt: new Date() })
      .where(eq(groupBookings.id, groupId));
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

  // Get marketplace groups with advanced filters (Phase 11)
  async getMarketplaceGroups(filters: {
    destination?: string;
    dateFrom?: Date;
    dateTo?: Date;
    minPrice?: number;
    maxPrice?: number;
    minParticipants?: number;
    maxParticipants?: number;
    language?: string;
    status?: string;
    sortBy?: 'date' | 'price' | 'popularity' | 'urgency';
    limit?: number;
  }) {
    // Apply filters
    const conditions = [];
    
    if (filters.status) {
      conditions.push(eq(groupBookings.status, filters.status));
    }
    
    if (filters.destination) {
      conditions.push(
        sql`LOWER(${tours.meetingPoint}) LIKE LOWER(${'%' + filters.destination + '%'})`
      );
    }
    
    if (filters.dateFrom) {
      conditions.push(gte(groupBookings.tourDate, filters.dateFrom));
    }
    
    if (filters.dateTo) {
      conditions.push(lte(groupBookings.tourDate, filters.dateTo));
    }
    
    if (filters.minPrice !== undefined) {
      conditions.push(gte(groupBookings.currentPricePerPerson, filters.minPrice.toString()));
    }
    
    if (filters.maxPrice !== undefined) {
      conditions.push(lte(groupBookings.currentPricePerPerson, filters.maxPrice.toString()));
    }
    
    if (filters.minParticipants !== undefined) {
      conditions.push(gte(groupBookings.minParticipants, filters.minParticipants));
    }
    
    if (filters.maxParticipants !== undefined) {
      conditions.push(lte(groupBookings.maxParticipants, filters.maxParticipants));
    }
    
    if (filters.language) {
      conditions.push(sql`${filters.language} = ANY(${tours.languages})`);
    }

    // Build base query
    const baseQuery = this.db
      .select({
        id: groupBookings.id,
        tourId: groupBookings.tourId,
        tourDate: groupBookings.tourDate,
        maxParticipants: groupBookings.maxParticipants,
        minParticipants: groupBookings.minParticipants,
        currentParticipants: groupBookings.currentParticipants,
        basePricePerPerson: groupBookings.basePricePerPerson,
        currentPricePerPerson: groupBookings.currentPricePerPerson,
        discountStep: groupBookings.discountStep,
        minPriceFloor: groupBookings.minPriceFloor,
        status: groupBookings.status,
        groupCode: groupBookings.groupCode,
        createdAt: groupBookings.createdAt,
        updatedAt: groupBookings.updatedAt,
        // Tour details
        tourTitle: tours.title,
        tourDescription: tours.description,
        tourCategory: tours.category,
        tourDuration: tours.duration,
        tourMeetingPoint: tours.meetingPoint,
        tourLanguages: tours.languages,
        tourImages: tours.images,
        tourLatitude: tours.latitude,
        tourLongitude: tours.longitude,
        // Guide details
        guideId: users.id,
        guideName: sql<string>`CONCAT(${users.firstName}, ' ', ${users.lastName})`,
        guideImage: users.profileImageUrl,
        guideTrustLevel: users.trustLevel,
      })
      .from(groupBookings)
      .leftJoin(tours, eq(groupBookings.tourId, tours.id))
      .leftJoin(users, eq(tours.guideId, users.id))
      .$dynamic();

    // Apply where conditions
    const whereQuery = conditions.length > 0 
      ? baseQuery.where(and(...conditions)) 
      : baseQuery;

    // Apply sorting
    let sortedQuery;
    switch (filters.sortBy) {
      case 'price':
        sortedQuery = whereQuery.orderBy(asc(groupBookings.currentPricePerPerson));
        break;
      case 'popularity':
        sortedQuery = whereQuery.orderBy(desc(groupBookings.currentParticipants));
        break;
      case 'urgency':
        sortedQuery = whereQuery.orderBy(
          sql`(${groupBookings.minParticipants} - ${groupBookings.currentParticipants})`
        );
        break;
      case 'date':
      default:
        sortedQuery = whereQuery.orderBy(asc(groupBookings.tourDate));
        break;
    }

    // Apply limit
    const finalQuery = filters.limit ? sortedQuery.limit(filters.limit) : sortedQuery;
    const results = await finalQuery;

    // Calculate additional fields for each group
    return results.map(group => {
      const spotsLeft = group.maxParticipants - group.currentParticipants;
      const spotsNeeded = Math.max(0, group.minParticipants - group.currentParticipants);
      const progress = (group.currentParticipants / group.maxParticipants) * 100;
      const discountPercentage = group.basePricePerPerson 
        ? ((parseFloat(group.basePricePerPerson) - parseFloat(group.currentPricePerPerson)) / parseFloat(group.basePricePerPerson)) * 100
        : 0;

      return {
        ...group,
        spotsLeft,
        spotsNeeded,
        progress: Math.round(progress),
        discountPercentage: Math.round(discountPercentage),
        isAlmostFull: spotsLeft <= 2,
        isAlmostReady: spotsNeeded <= 2 && spotsNeeded > 0,
      };
    });
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

  // Check if user is a member of a smart group
  async isUserInSmartGroup(groupId: string, userId: string): Promise<boolean> {
    const result = await db
      .select()
      .from(smartGroupMembers)
      .where(
        and(
          eq(smartGroupMembers.groupId, groupId),
          eq(smartGroupMembers.userId, userId)
        )
      )
      .limit(1);
    
    return result.length > 0;
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
      targetId: group.id,
      description: `Created smart group: ${group.name}`,
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
        tour: r.tour as any || undefined,
        service: r.service as any || undefined,
        _count: {
          members: Number(r.memberCount),
          messages: Number(r.messageCount),
        },
        distance,
      };
    });

    return groupsWithDistance.filter(g => g.distance <= radiusKm) as any;
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
      tour: result.tour as any || undefined,
      service: result.service as any || undefined,
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
      targetId: groupId,
      description: `Joined smart group: ${group.name}`,
    });

    // Award points to group creator for each participant
    await this.awardPoints(group.creatorId, 'smart_group_join', {
      targetId: groupId,
      description: `Participant joined your group: ${group.name}`,
    });

    // If group is now complete, award completion bonus
    if (newStatus === 'full') {
      await this.awardPoints(group.creatorId, 'smart_group_complete', {
        targetId: groupId,
        description: `Smart group completed: ${group.name}`,
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
      tour: r.tour as any || undefined,
      service: r.service as any || undefined,
      _count: {
        members: Number(r.memberCount),
        messages: Number(r.messageCount),
      },
    })) as any;
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

  // AI Travel Companion operations (Phase 9)
  
  // Log AI interactions with GDPR compliance
  async logAIInteraction(params: {
    userId: string;
    groupId?: string;
    actionType: string;
    inputData: any;
    outputData: any;
    userConsent: boolean;
    language?: string;
    metadata?: any;
  }): Promise<AILog> {
    try {
      if (!params.userConsent) {
        throw new Error('User consent is required to log AI interactions');
      }

      const sanitizedInputData = this.sanitizeAIData(params.inputData);

      const [log] = await db
        .insert(aiLogs)
        .values({
          userId: params.userId,
          groupId: params.groupId || null,
          actionType: params.actionType,
          inputData: sanitizedInputData,
          outputData: params.outputData,
          userConsent: params.userConsent,
          language: params.language || null,
          metadata: params.metadata || null,
        })
        .returning();

      return log;
    } catch (error) {
      console.error('Error logging AI interaction:', error);
      throw error;
    }
  }

  // Get AI logs with filters and pagination
  async getAILogs(params: {
    userId?: string;
    groupId?: string;
    actionType?: string;
    limit?: number;
    offset?: number;
  }): Promise<AILog[]> {
    try {
      const limit = params.limit || 50;
      const offset = params.offset || 0;

      const conditions = [];
      
      if (params.userId) {
        conditions.push(eq(aiLogs.userId, params.userId));
      }
      
      if (params.groupId) {
        conditions.push(eq(aiLogs.groupId, params.groupId));
      }
      
      if (params.actionType) {
        conditions.push(eq(aiLogs.actionType, params.actionType));
      }

      const query = db
        .select()
        .from(aiLogs)
        .orderBy(desc(aiLogs.createdAt))
        .limit(limit)
        .offset(offset);

      if (conditions.length > 0) {
        return await query.where(and(...conditions));
      }

      return await query;
    } catch (error) {
      console.error('Error getting AI logs:', error);
      throw error;
    }
  }

  // Create a group event (reminder, meeting, schedule)
  async createGroupEvent(params: {
    groupId: string;
    creatorId: string;
    eventType: string;
    title: string;
    description?: string;
    eventDate: Date;
    location?: string;
    latitude?: number;
    longitude?: number;
    notificationTimes?: Date[];
  }): Promise<GroupEvent> {
    try {
      const notificationTimesJson = params.notificationTimes 
        ? params.notificationTimes.map(d => d.toISOString())
        : null;

      const [event] = await db
        .insert(groupEvents)
        .values({
          groupId: params.groupId,
          creatorId: params.creatorId,
          eventType: params.eventType,
          title: params.title,
          description: params.description || null,
          eventDate: params.eventDate,
          location: params.location || null,
          latitude: params.latitude || null,
          longitude: params.longitude || null,
          notificationTimes: notificationTimesJson,
          status: 'pending',
        })
        .returning();

      return event;
    } catch (error) {
      console.error('Error creating group event:', error);
      throw error;
    }
  }

  // Get group events with filters
  async getGroupEvents(params: {
    groupId?: string;
    creatorId?: string;
    eventType?: string;
    status?: string;
    upcomingOnly?: boolean;
    limit?: number;
    offset?: number;
  }): Promise<GroupEvent[]> {
    try {
      const limit = params.limit || 50;
      const offset = params.offset || 0;
      const conditions = [];

      if (params.groupId) {
        conditions.push(eq(groupEvents.groupId, params.groupId));
      }

      if (params.creatorId) {
        conditions.push(eq(groupEvents.creatorId, params.creatorId));
      }

      if (params.eventType) {
        conditions.push(eq(groupEvents.eventType, params.eventType));
      }

      if (params.status) {
        conditions.push(eq(groupEvents.status, params.status));
      }

      if (params.upcomingOnly) {
        conditions.push(gte(groupEvents.eventDate, new Date()));
      }

      const query = db
        .select()
        .from(groupEvents)
        .orderBy(asc(groupEvents.eventDate))
        .limit(limit)
        .offset(offset);

      if (conditions.length > 0) {
        return await query.where(and(...conditions));
      }

      return await query;
    } catch (error) {
      console.error('Error getting group events:', error);
      throw error;
    }
  }

  // Update event status
  async updateEventStatus(eventId: string, status: string): Promise<GroupEvent | null> {
    try {
      const [event] = await db
        .update(groupEvents)
        .set({
          status,
          updatedAt: new Date(),
        })
        .where(eq(groupEvents.id, eventId))
        .returning();

      return event || null;
    } catch (error) {
      console.error('Error updating event status:', error);
      throw error;
    }
  }

  // Get upcoming notifications (for background job)
  async getUpcomingNotifications(windowMinutes: number = 60): Promise<GroupEvent[]> {
    try {
      const now = new Date();
      const futureTime = new Date(now.getTime() + windowMinutes * 60000);

      const events = await db
        .select()
        .from(groupEvents)
        .where(
          and(
            eq(groupEvents.status, 'pending'),
            gte(groupEvents.eventDate, now),
            lte(groupEvents.eventDate, futureTime)
          )
        )
        .orderBy(asc(groupEvents.eventDate));

      const eventsNeedingNotification = events.filter(event => {
        if (!event.notificationTimes || event.notificationTimes.length === 0) {
          return false;
        }

        const notificationDates = (event.notificationTimes as string[]).map(t => new Date(t));
        
        return notificationDates.some(notifTime => {
          return notifTime >= now && notifTime <= futureTime;
        });
      });

      return eventsNeedingNotification;
    } catch (error) {
      console.error('Error getting upcoming notifications:', error);
      throw error;
    }
  }

  // Check if user has consented to AI features (GDPR)
  async hasUserConsentedToAI(userId: string): Promise<boolean> {
    try {
      const user = await db.query.users.findFirst({
        where: eq(users.id, userId),
        columns: { aiConsent: true }
      });
      return user?.aiConsent ?? false;
    } catch (error) {
      console.error('Error checking AI consent:', error);
      return false;
    }
  }

  // Update user's AI consent (GDPR)
  async updateAIConsent(userId: string, consent: boolean): Promise<void> {
    await db.update(users)
      .set({ 
        aiConsent: consent,
        aiConsentDate: consent ? new Date() : null
      })
      .where(eq(users.id, userId));
  }

  // Get user's AI consent status (GDPR)
  async getAIConsentStatus(userId: string): Promise<{ hasConsented: boolean; consentDate: Date | null }> {
    const user = await db.query.users.findFirst({
      where: eq(users.id, userId),
      columns: { aiConsent: true, aiConsentDate: true }
    });
    return {
      hasConsented: user?.aiConsent ?? false,
      consentDate: user?.aiConsentDate ?? null
    };
  }

  // Partnership Management (Phase 10)
  async createPartnership(data: {
    userId: string;
    tier: 'standard' | 'premium' | 'pro';
    stripeSubscriptionId?: string;
    stripeCustomerId?: string;
    stripePriceId?: string;
    endDate?: Date;
  }): Promise<Partnership> {
    const [partnership] = await db.insert(partnerships)
      .values({
        ...data,
        status: 'active',
        analytics: {
          profileViews: 0,
          tourViews: 0,
          serviceViews: 0,
          clicks: 0,
          conversions: 0,
          likes: 0,
          reviews: 0
        }
      })
      .returning();
    return partnership;
  }

  async getPartnershipByUserId(userId: string): Promise<Partnership | null> {
    const partnership = await db.query.partnerships.findFirst({
      where: eq(partnerships.userId, userId),
      orderBy: desc(partnerships.createdAt)
    });
    return partnership || null;
  }

  async updatePartnershipStatus(
    partnershipId: string,
    status: 'active' | 'cancelled' | 'expired'
  ): Promise<void> {
    await db.update(partnerships)
      .set({
        status,
        cancelledAt: status === 'cancelled' ? new Date() : null,
        updatedAt: new Date()
      })
      .where(eq(partnerships.id, partnershipId));
  }

  async incrementPartnershipAnalytics(
    userId: string,
    field: 'profileViews' | 'tourViews' | 'serviceViews' | 'clicks' | 'conversions' | 'likes' | 'reviews'
  ): Promise<void> {
    const partnership = await this.getPartnershipByUserId(userId);
    if (!partnership) return;
    
    const analytics = partnership.analytics || {
      profileViews: 0,
      tourViews: 0,
      serviceViews: 0,
      clicks: 0,
      conversions: 0,
      likes: 0,
      reviews: 0
    };
    analytics[field] = (analytics[field] || 0) + 1;
    
    await db.update(partnerships)
      .set({ analytics, updatedAt: new Date() })
      .where(eq(partnerships.id, partnership.id));
  }

  // Search Logging (Phase 10)
  async logSearch(data: {
    userId?: string;
    query: string;
    searchType?: string;
    resultsCount: number;
    filters?: any;
  }): Promise<SearchLog> {
    const [searchLog] = await db.insert(searchLogs).values(data).returning();
    return searchLog;
  }

  async updateSearchClick(
    searchLogId: string,
    entityId: string,
    entityType: string
  ): Promise<void> {
    await db.update(searchLogs)
      .set({
        clicked: true,
        clickedEntityId: entityId,
        clickedEntityType: entityType
      })
      .where(eq(searchLogs.id, searchLogId));
  }

  // Embeddings Management (Phase 10)
  async createEmbedding(data: {
    entityId: string;
    entityType: 'guide' | 'tour' | 'service';
    content: string;
    embedding: number[];
    language?: string;
  }): Promise<Embedding> {
    // Store embedding as JSON string (works without pgvector extension)
    const [embedding] = await db.insert(embeddings).values({
      entityId: data.entityId,
      entityType: data.entityType,
      content: data.content,
      embedding: JSON.stringify(data.embedding),
      language: data.language
    }).returning();
    return embedding;
  }

  async getEmbedding(
    entityId: string,
    entityType: string
  ): Promise<Embedding | null> {
    const embedding = await db.query.embeddings.findFirst({
      where: and(
        eq(embeddings.entityId, entityId),
        eq(embeddings.entityType, entityType)
      )
    });
    return embedding || null;
  }

  async searchSimilarEmbeddings(
    queryEmbedding: number[],
    entityType?: string,
    limit = 10
  ): Promise<Array<Embedding & { similarity: number }>> {
    // Fallback to text-based similarity without pgvector
    // This is a simple implementation - can be enhanced with actual vector search if pgvector is available
    const results = await db
      .select()
      .from(embeddings)
      .where(entityType ? eq(embeddings.entityType, entityType) : sql`1=1`)
      .limit(limit);
    
    // Calculate cosine similarity manually
    const withSimilarity = results.map(result => {
      const embeddingArray = JSON.parse(result.embedding);
      const similarity = this.cosineSimilarity(queryEmbedding, embeddingArray);
      return {
        ...result,
        similarity
      };
    });
    
    // Sort by similarity (highest first)
    return withSimilarity.sort((a, b) => b.similarity - a.similarity);
  }

  // Helper: Calculate cosine similarity between two vectors
  private cosineSimilarity(a: number[], b: number[]): number {
    if (a.length !== b.length) return 0;
    
    let dotProduct = 0;
    let normA = 0;
    let normB = 0;
    
    for (let i = 0; i < a.length; i++) {
      dotProduct += a[i] * b[i];
      normA += a[i] * a[i];
      normB += b[i] * b[i];
    }
    
    const denominator = Math.sqrt(normA) * Math.sqrt(normB);
    return denominator === 0 ? 0 : dotProduct / denominator;
  }

  // Helper: Sanitize AI input data to remove sensitive information
  private sanitizeAIData(data: any): any {
    if (!data) return data;
    
    const sanitized = { ...data };
    
    const sensitiveFields = [
      'password', 'token', 'secret', 'apiKey', 'creditCard', 
      'ssn', 'socialSecurity', 'passport', 'driverLicense',
      'email', 'phone', 'address'
    ];
    
    const sanitizeObject = (obj: any): any => {
      if (typeof obj !== 'object' || obj === null) {
        return obj;
      }
      
      if (Array.isArray(obj)) {
        return obj.map(item => sanitizeObject(item));
      }
      
      const result: any = {};
      for (const key in obj) {
        const lowerKey = key.toLowerCase();
        if (sensitiveFields.some(field => lowerKey.includes(field))) {
          result[key] = '[REDACTED]';
        } else {
          result[key] = sanitizeObject(obj[key]);
        }
      }
      return result;
    };
    
    return sanitizeObject(sanitized);
  }

  // Content Reports (Moderation)
  async createContentReport(data: InsertContentReport): Promise<ContentReport> {
    const [report] = await db.insert(contentReports).values(data).returning();
    return report;
  }

  async getPendingReports(): Promise<ContentReport[]> {
    return db
      .select()
      .from(contentReports)
      .where(eq(contentReports.status, 'pending'))
      .orderBy(desc(contentReports.createdAt));
  }

  async reviewContentReport(
    id: string,
    reviewerId: string,
    status: string,
    actionTaken: string
  ): Promise<void> {
    await db
      .update(contentReports)
      .set({
        status,
        reviewedBy: reviewerId,
        reviewedAt: new Date(),
        actionTaken,
      })
      .where(eq(contentReports.id, id));
  }

  // Notifications
  async createNotification(data: InsertNotification): Promise<Notification> {
    const [notification] = await db
      .insert(notifications)
      .values(data)
      .returning();
    return notification;
  }

  async getUserNotifications(userId: string): Promise<Notification[]> {
    return db
      .select()
      .from(notifications)
      .where(eq(notifications.userId, userId))
      .orderBy(desc(notifications.createdAt))
      .limit(50);
  }

  async markNotificationAsRead(id: string, userId: string): Promise<void> {
    await db
      .update(notifications)
      .set({
        isRead: true,
        readAt: new Date(),
      })
      .where(and(eq(notifications.id, id), eq(notifications.userId, userId)));
  }

  async markAllNotificationsAsRead(userId: string): Promise<void> {
    await db
      .update(notifications)
      .set({
        isRead: true,
        readAt: new Date(),
      })
      .where(eq(notifications.userId, userId));
  }

  // Community Leader Badge
  async checkCommunityLeaderBadge(userId: string): Promise<void> {
    const groupsCreated = await db
      .select({ count: sql<number>`COUNT(*)` })
      .from(smartGroups)
      .where(and(
        eq(smartGroups.creatorId, userId),
        eq(smartGroups.status, 'completed')
      ));

    if (groupsCreated[0].count >= 5) {
      await this.awardPoints(userId, 'community_interaction', {
        description: 'Earned Community Leader badge',
      });
    }
  }

  // Group Booking Payment operations
  async getExpiredGroups(): Promise<GroupBooking[]> {
    const now = new Date();
    return db
      .select()
      .from(groupBookings)
      .where(
        and(
          eq(groupBookings.status, 'open'),
          lte(groupBookings.expiresAt, now),
          sql`${groupBookings.expiresAt} IS NOT NULL`
        )
      );
  }

  async getGroupMembers(groupId: string): Promise<Array<{ userId: string; email: string; firstName: string; lastName: string }>> {
    const members = await db
      .select({
        userId: users.id,
        email: users.email,
        firstName: users.firstName,
        lastName: users.lastName,
      })
      .from(bookings)
      .innerJoin(users, eq(bookings.userId, users.id))
      .where(eq(bookings.groupBookingId, groupId));
    
    return members.map(m => ({
      userId: m.userId,
      email: m.email || '',
      firstName: m.firstName || '',
      lastName: m.lastName || '',
    }));
  }

  // GDPR Compliance operations
  async deleteUserPosts(userId: string): Promise<void> {
    await db.delete(posts).where(eq(posts.authorId, userId));
  }

  async deleteUserComments(userId: string): Promise<void> {
    await db.delete(postComments).where(eq(postComments.authorId, userId));
  }

  async deleteUserLikes(userId: string): Promise<void> {
    await db.delete(postLikes).where(eq(postLikes.userId, userId));
    await db.delete(likes).where(eq(likes.userId, userId));
  }

  async anonymizeUserBookings(userId: string): Promise<void> {
    await db
      .update(bookings)
      .set({
        userId: 'ANONYMIZED',
        updatedAt: new Date(),
      })
      .where(eq(bookings.userId, userId));
  }

  async deactivateUser(userId: string): Promise<void> {
    await db
      .update(users)
      .set({
        email: `deleted_${userId}@anonymized.com`,
        firstName: 'Deleted',
        lastName: 'User',
        profileImageUrl: null,
        bio: null,
        phone: null,
        socialLinks: null,
        isOnline: false,
        approvalStatus: 'rejected',
        updatedAt: new Date(),
      })
      .where(eq(users.id, userId));
  }

  async getUserPosts(userId: string): Promise<Post[]> {
    return db
      .select()
      .from(posts)
      .where(eq(posts.authorId, userId))
      .orderBy(desc(posts.createdAt));
  }

  async getUserMessages(userId: string): Promise<SelectMessage[]> {
    return db
      .select()
      .from(messages)
      .where(eq(messages.senderId, userId))
      .orderBy(desc(messages.createdAt));
  }

  async getUserReviews(userId: string): Promise<Review[]> {
    return db
      .select()
      .from(reviews)
      .where(eq(reviews.userId, userId))
      .orderBy(desc(reviews.createdAt));
  }

  async getUserBookings(userId: string): Promise<BookingWithDetails[]> {
    return this.getBookings(userId);
  }

  // Partner GDPR operations
  async deactivatePartnerPackages(partnerId: string): Promise<void> {
    await db.update(packages)
      .set({ isActive: false })
      .where(eq(packages.partnerId, partnerId));
  }

  async deactivatePartnerCoupons(partnerId: string): Promise<void> {
    await db.update(coupons)
      .set({ isActive: false })
      .where(eq(coupons.partnerId, partnerId));
  }

  async anonymizePartnerProfile(partnerId: string): Promise<void> {
    await db.update(partners)
      .set({
        name: 'DELETED_USER',
        contactEmail: 'deleted@example.com',
        phone: null,
        description: 'User data deleted per GDPR request',
        website: null,
      })
      .where(eq(partners.id, partnerId));
  }

  async anonymizePartnerPayouts(partnerId: string): Promise<void> {
    // Payouts table doesn't have metadata field, so nothing to anonymize
    // Payouts are kept for financial/legal compliance
  }

  // ============= PARTNERS METHODS (Phase 12) =============

  async createPartner(data: InsertPartner): Promise<Partner> {
    const [partner] = await db.insert(partners).values(data).returning();
    return partner;
  }

  async getPartner(partnerId: string): Promise<Partner | undefined> {
    const [partner] = await db.select().from(partners).where(eq(partners.id, partnerId));
    return partner;
  }

  async getPartnerByOwner(ownerUserId: string): Promise<Partner | undefined> {
    const [partner] = await db.select().from(partners).where(eq(partners.ownerUserId, ownerUserId));
    return partner;
  }

  async getAllPartners(filters?: { type?: string; verified?: boolean }): Promise<Partner[]> {
    let query = db.select().from(partners);
    
    if (filters?.type) {
      query = query.where(eq(partners.type, filters.type)) as any;
    }
    
    if (filters?.verified !== undefined) {
      const condition = filters.verified 
        ? eq(partners.verified, true)
        : eq(partners.verified, false);
      query = query.where(condition) as any;
    }
    
    return await query;
  }

  async updatePartner(partnerId: string, data: Partial<InsertPartner>): Promise<Partner> {
    const [updated] = await db
      .update(partners)
      .set({ ...data, updatedAt: new Date() })
      .where(eq(partners.id, partnerId))
      .returning();
    return updated;
  }

  async verifyPartner(partnerId: string, verifiedBy: string): Promise<Partner> {
    const [partner] = await db
      .update(partners)
      .set({ 
        verified: true,
        updatedAt: new Date(),
      })
      .where(eq(partners.id, partnerId))
      .returning();
    
    // Log audit trail
    await this.createAuditLog({
      userId: verifiedBy,
      action: 'verify_partner',
      entityType: 'partner',
      entityId: partnerId,
      changes: { 
        before: { verified: false }, 
        after: { verified: true } 
      },
    });
    
    return partner;
  }

  async deletePartner(partnerId: string): Promise<void> {
    await db.delete(partners).where(eq(partners.id, partnerId));
  }

  // Audit log helper
  async createAuditLog(data: InsertAuditLog): Promise<AuditLog> {
    const [log] = await db.insert(auditLogs).values(data).returning();
    return log;
  }

  async getPartnerAnalytics(partnerId: string): Promise<{
    totalPackages: number;
    activePackages: number;
    totalBookings: number;
    totalRevenue: string;
    conversionRate: number;
  }> {
    // Get packages count
    const partnerPackages = await db
      .select()
      .from(packages)
      .where(eq(packages.partnerId, partnerId));
    
    const totalPackages = partnerPackages.length;
    const activePackages = partnerPackages.filter(p => p.isActive).length;
    
    // Get bookings count and revenue
    const packageIds = partnerPackages.map(p => p.id);
    
    let totalBookings = 0;
    let totalRevenue = '0';
    
    if (packageIds.length > 0) {
      const bookings = await db
        .select()
        .from(packageBookings)
        .where(
          and(
            inArray(packageBookings.packageId, packageIds),
            eq(packageBookings.paymentStatus, 'paid')
          )
        );
      
      totalBookings = bookings.length;
      totalRevenue = bookings
        .reduce((sum, b) => sum + parseFloat(b.totalPrice), 0)
        .toFixed(2);
    }
    
    // Calculate conversion rate (mock analytics - in production, use analyticsEvents)
    const conversionRate = totalPackages > 0 
      ? (totalBookings / (totalPackages * 10)) * 100 // Simplified calculation
      : 0;
    
    return {
      totalPackages,
      activePackages,
      totalBookings,
      totalRevenue,
      conversionRate: Math.round(conversionRate * 100) / 100,
    };
  }

  // ============= PACKAGES METHODS (Phase 12) =============

  async createPackage(data: InsertPackage): Promise<Package> {
    const [pkg] = await db.insert(packages).values(data as any).returning();
    
    // Award points for package creation
    const partner = await this.getPartner(data.partnerId);
    if (partner) {
      await this.awardPoints(partner.ownerUserId, 'package_created', {
        description: 'Package created',
        targetId: pkg.id,
      });
    }
    
    return pkg;
  }

  async getPackage(packageId: string): Promise<Package | undefined> {
    const [pkg] = await db.select().from(packages).where(eq(packages.id, packageId));
    return pkg;
  }

  async getPackageWithDetails(packageId: string): Promise<any> {
    const pkg = await this.getPackage(packageId);
    if (!pkg) return undefined;
    
    // Fetch partner details
    const partner = await this.getPartner(pkg.partnerId);
    
    // Fetch items details (tours, services, etc.)
    const itemsDetails = await Promise.all(
      pkg.items.map(async (item: any) => {
        if (item.type === 'tour') {
          const tour = await this.getTour(item.id);
          return { ...item, details: tour };
        } else if (item.type === 'service') {
          const service = await this.getService(item.id);
          return { ...item, details: service };
        }
        return item;
      })
    );
    
    return {
      ...pkg,
      partner,
      itemsDetails,
    };
  }

  async searchPackages(filters: {
    destination?: string;
    minPrice?: number;
    maxPrice?: number;
    dateFrom?: string;
    verified?: boolean;
    sortBy?: 'price_low' | 'price_high' | 'newest';
    limit?: number;
  }): Promise<Package[]> {
    const conditions = [eq(packages.isActive, true)];
    
    // Price filters
    if (filters.minPrice !== undefined) {
      conditions.push(sql`CAST(${packages.basePrice} AS DECIMAL) >= ${filters.minPrice}`);
    }
    
    if (filters.maxPrice !== undefined) {
      conditions.push(sql`CAST(${packages.basePrice} AS DECIMAL) <= ${filters.maxPrice}`);
    }
    
    let query = db
      .select()
      .from(packages)
      .where(and(...conditions));
    
    // Sort
    if (filters.sortBy === 'price_low') {
      query = query.orderBy(asc(packages.basePrice)) as any;
    } else if (filters.sortBy === 'price_high') {
      query = query.orderBy(desc(packages.basePrice)) as any;
    } else {
      query = query.orderBy(desc(packages.createdAt)) as any;
    }
    
    // Limit
    if (filters.limit) {
      query = query.limit(filters.limit) as any;
    }
    
    const pkgs = await query;
    
    // Filter by verified partner if requested
    if (filters.verified) {
      const verifiedPkgs = await Promise.all(
        pkgs.map(async (pkg) => {
          const partner = await this.getPartner(pkg.partnerId);
          return partner?.verified ? pkg : null;
        })
      );
      return verifiedPkgs.filter(Boolean) as Package[];
    }
    
    return pkgs;
  }

  async getPartnerPackages(partnerId: string): Promise<Package[]> {
    return await db
      .select()
      .from(packages)
      .where(eq(packages.partnerId, partnerId))
      .orderBy(desc(packages.createdAt));
  }

  async updatePackage(packageId: string, data: Partial<InsertPackage>): Promise<Package> {
    const updateData: any = { ...data, updatedAt: new Date() };
    const [updated] = await db
      .update(packages)
      .set(updateData)
      .where(eq(packages.id, packageId))
      .returning();
    return updated;
  }

  async deletePackage(packageId: string): Promise<void> {
    await db.delete(packages).where(eq(packages.id, packageId));
  }

  // Calculate package final price with discounts
  calculatePackagePrice(pkg: Package, participants: number = 1): {
    basePrice: number;
    discount: number;
    finalPrice: number;
    discountPercentage: number;
  } {
    const basePrice = parseFloat(pkg.basePrice);
    let discount = 0;
    
    if (pkg.discountRules) {
      const rules = pkg.discountRules as any;
      
      // Check if participants meet minimum for discount
      if (rules.minParticipants && participants >= Number(rules.minParticipants)) {
        if (rules.type === 'percentage') {
          discount = (basePrice * Number(rules.value)) / 100;
        } else if (rules.type === 'fixed') {
          discount = Number(rules.value);
        }
      }
    }
    
    const finalPrice = Math.max(0, basePrice - discount);
    const discountPercentage = basePrice > 0 ? (discount / basePrice) * 100 : 0;
    
    return {
      basePrice,
      discount,
      finalPrice,
      discountPercentage: Math.round(discountPercentage * 100) / 100,
    };
  }

  // ============= PACKAGE BOOKINGS METHODS =============

  async createPackageBooking(data: InsertPackageBooking): Promise<PackageBooking> {
    const [booking] = await db.insert(packageBookings).values(data).returning();
    
    // Track booking event
    await this.trackEvent({
      eventType: "conversion",
      eventCategory: "package_booking",
      targetId: data.packageId,
      targetType: "package",
      userId: data.userId,
    });
    
    return booking;
  }

  async getPackageBooking(bookingId: string): Promise<PackageBooking | undefined> {
    const [booking] = await db
      .select()
      .from(packageBookings)
      .where(eq(packageBookings.id, bookingId));
    return booking;
  }

  async getUserPackageBookings(userId: string): Promise<PackageBooking[]> {
    return await db
      .select()
      .from(packageBookings)
      .where(eq(packageBookings.userId, userId))
      .orderBy(desc(packageBookings.createdAt));
  }

  async getPartnerPackageBookings(partnerId: string): Promise<PackageBooking[]> {
    // Get all packages for this partner
    const partnerPkgs = await this.getPartnerPackages(partnerId);
    const packageIds = partnerPkgs.map(p => p.id);
    
    if (packageIds.length === 0) return [];
    
    return await db
      .select()
      .from(packageBookings)
      .where(inArray(packageBookings.packageId, packageIds))
      .orderBy(desc(packageBookings.createdAt));
  }

  async updatePackageBooking(bookingId: string, data: Partial<InsertPackageBooking>): Promise<PackageBooking> {
    const [updated] = await db
      .update(packageBookings)
      .set({ ...data, updatedAt: new Date() })
      .where(eq(packageBookings.id, bookingId))
      .returning();
    return updated;
  }

  // Apply coupon to booking
  async applyCoupon(couponCode: string, packageId: string, basePrice: number): Promise<{
    valid: boolean;
    discount: number;
    finalPrice: number;
    message?: string;
  }> {
    const [coupon] = await db
      .select()
      .from(coupons)
      .where(eq(coupons.code, couponCode.toUpperCase()));
    
    if (!coupon) {
      return { valid: false, discount: 0, finalPrice: basePrice, message: 'Invalid coupon code' };
    }
    
    if (!coupon.isActive) {
      return { valid: false, discount: 0, finalPrice: basePrice, message: 'Coupon is inactive' };
    }
    
    const now = new Date();
    if (now < coupon.validFrom || now > coupon.validTo) {
      return { valid: false, discount: 0, finalPrice: basePrice, message: 'Coupon expired or not yet valid' };
    }
    
    if (coupon.usageLimit && (coupon.usageCount || 0) >= coupon.usageLimit) {
      return { valid: false, discount: 0, finalPrice: basePrice, message: 'Coupon usage limit reached' };
    }
    
    // Calculate discount
    let discount = 0;
    if (coupon.type === 'percentage') {
      discount = (basePrice * parseFloat(coupon.value)) / 100;
    } else {
      discount = parseFloat(coupon.value);
    }
    
    const finalPrice = Math.max(0, basePrice - discount);
    
    // Increment usage count
    await db
      .update(coupons)
      .set({ usageCount: (coupon.usageCount || 0) + 1 })
      .where(eq(coupons.id, coupon.id));
    
    return {
      valid: true,
      discount,
      finalPrice,
    };
  }

  // Track affiliate click
  async trackAffiliateClick(affiliateCode: string): Promise<void> {
    const [link] = await db
      .select()
      .from(affiliateLinks)
      .where(eq(affiliateLinks.affiliateCode, affiliateCode.toUpperCase()));
    
    if (link) {
      await db
        .update(affiliateLinks)
        .set({ clicks: (link.clicks || 0) + 1 })
        .where(eq(affiliateLinks.id, link.id));
    }
  }

  // Track affiliate conversion
  async trackAffiliateConversion(affiliateCode: string, revenue: number): Promise<void> {
    const [link] = await db
      .select()
      .from(affiliateLinks)
      .where(eq(affiliateLinks.affiliateCode, affiliateCode.toUpperCase()));
    
    if (link) {
      const currentRevenue = link.revenue ? parseFloat(link.revenue) : 0;
      const newRevenue = currentRevenue + revenue;
      const commission = (revenue * parseFloat(link.commissionPct)) / 100;
      
      await db
        .update(affiliateLinks)
        .set({
          conversions: (link.conversions || 0) + 1,
          revenue: newRevenue.toFixed(2),
        })
        .where(eq(affiliateLinks.id, link.id));
      
      // Award points to affiliate user if exists
      if (link.userId) {
        await this.awardPoints(link.userId, 'affiliate_conversion', {
          description: `Affiliate commission: €${commission.toFixed(2)}`,
          targetId: link.id,
        });
      }
    }
  }

  // ============= COUPONS METHODS (Phase 12) =============

  async createCoupon(data: InsertCoupon): Promise<Coupon> {
    const [coupon] = await db.insert(coupons).values(data).returning();
    return coupon;
  }

  async getCoupon(couponId: string): Promise<Coupon | undefined> {
    const [coupon] = await db.select().from(coupons).where(eq(coupons.id, couponId));
    return coupon;
  }

  async getCouponByCode(code: string): Promise<Coupon | undefined> {
    const [coupon] = await db
      .select()
      .from(coupons)
      .where(eq(coupons.code, code.toUpperCase()));
    return coupon;
  }

  async getPartnerCoupons(partnerId: string): Promise<Coupon[]> {
    return await db
      .select()
      .from(coupons)
      .where(eq(coupons.partnerId, partnerId))
      .orderBy(desc(coupons.createdAt));
  }

  async updateCoupon(couponId: string, data: Partial<InsertCoupon>): Promise<Coupon> {
    const [updated] = await db
      .update(coupons)
      .set({ ...data, updatedAt: new Date() })
      .where(eq(coupons.id, couponId))
      .returning();
    return updated;
  }

  async deleteCoupon(couponId: string): Promise<void> {
    await db.delete(coupons).where(eq(coupons.id, couponId));
  }

  async deactivateCoupon(couponId: string): Promise<Coupon> {
    const [updated] = await db
      .update(coupons)
      .set({ isActive: false, updatedAt: new Date() })
      .where(eq(coupons.id, couponId))
      .returning();
    return updated;
  }

  // ============= AFFILIATE LINKS METHODS (Phase 12) =============

  async createAffiliateLink(data: InsertAffiliateLink): Promise<AffiliateLink> {
    const [link] = await db.insert(affiliateLinks).values(data).returning();
    return link;
  }

  async getAffiliateLink(linkId: string): Promise<AffiliateLink | undefined> {
    const [link] = await db.select().from(affiliateLinks).where(eq(affiliateLinks.id, linkId));
    return link;
  }

  async getAffiliateLinkByCode(code: string): Promise<AffiliateLink | undefined> {
    const [link] = await db
      .select()
      .from(affiliateLinks)
      .where(eq(affiliateLinks.affiliateCode, code.toUpperCase()));
    return link;
  }

  async getPartnerAffiliateLinks(partnerId: string): Promise<AffiliateLink[]> {
    return await db
      .select()
      .from(affiliateLinks)
      .where(eq(affiliateLinks.partnerId, partnerId))
      .orderBy(desc(affiliateLinks.createdAt));
  }

  async getUserAffiliateLinks(userId: string): Promise<AffiliateLink[]> {
    return await db
      .select()
      .from(affiliateLinks)
      .where(eq(affiliateLinks.userId, userId))
      .orderBy(desc(affiliateLinks.createdAt));
  }

  async updateAffiliateLink(linkId: string, data: Partial<InsertAffiliateLink>): Promise<AffiliateLink> {
    const [updated] = await db
      .update(affiliateLinks)
      .set({ ...data, updatedAt: new Date() })
      .where(eq(affiliateLinks.id, linkId))
      .returning();
    return updated;
  }

  async deleteAffiliateLink(linkId: string): Promise<void> {
    await db.delete(affiliateLinks).where(eq(affiliateLinks.id, linkId));
  }

  async deactivateAffiliateLink(linkId: string): Promise<AffiliateLink> {
    const [updated] = await db
      .update(affiliateLinks)
      .set({ isActive: false, updatedAt: new Date() })
      .where(eq(affiliateLinks.id, linkId))
      .returning();
    return updated;
  }

  async getAffiliateStats(affiliateCode: string): Promise<{
    clicks: number;
    conversions: number;
    revenue: string;
    conversionRate: number;
    averageOrderValue: string;
  }> {
    const link = await this.getAffiliateLinkByCode(affiliateCode);
    
    if (!link) {
      return {
        clicks: 0,
        conversions: 0,
        revenue: '0',
        conversionRate: 0,
        averageOrderValue: '0',
      };
    }
    
    const clicks = link.clicks ?? 0;
    const conversions = link.conversions ?? 0;
    const revenue = link.revenue ?? '0';
    
    const conversionRate = clicks > 0 
      ? (conversions / clicks) * 100 
      : 0;
    
    const averageOrderValue = conversions > 0
      ? (parseFloat(revenue) / conversions).toFixed(2)
      : '0';
    
    return {
      clicks,
      conversions,
      revenue,
      conversionRate: Math.round(conversionRate * 100) / 100,
      averageOrderValue,
    };
  }

  // ============= PARTNER ACCOUNTS & PAYOUTS (Phase 12 - Stripe Connect) =============

  async createPartnerAccount(data: { partnerId: string; stripeAccountId: string }): Promise<PartnerAccount> {
    const [account] = await db.insert(partnerAccounts).values({
      partnerId: data.partnerId,
      stripeAccountId: data.stripeAccountId,
      status: 'pending',
      onboardingComplete: false,
    }).returning();
    return account;
  }

  async getPartnerAccount(partnerId: string): Promise<PartnerAccount | undefined> {
    const [account] = await db
      .select()
      .from(partnerAccounts)
      .where(eq(partnerAccounts.partnerId, partnerId));
    return account;
  }

  async updatePartnerAccount(accountId: string, data: Partial<{
    stripeAccountId: string;
    status: string;
    onboardingComplete: boolean;
  }>): Promise<PartnerAccount> {
    const [updated] = await db
      .update(partnerAccounts)
      .set({ ...data, updatedAt: new Date() })
      .where(eq(partnerAccounts.id, accountId))
      .returning();
    return updated;
  }

  async createPayout(data: {
    partnerId: string;
    amount: string;
    currency: string;
    periodStart: Date;
    periodEnd: Date;
    stripePayoutId?: string;
  }): Promise<Payout> {
    const [payout] = await db.insert(payouts).values({
      ...data,
      status: 'pending',
    }).returning();
    return payout;
  }

  async getPartnerPayouts(partnerId: string): Promise<Payout[]> {
    return await db
      .select()
      .from(payouts)
      .where(eq(payouts.partnerId, partnerId))
      .orderBy(desc(payouts.createdAt));
  }

  async updatePayoutStatus(payoutId: string, status: string, stripePayoutId?: string): Promise<Payout> {
    const [updated] = await db
      .update(payouts)
      .set({ 
        status, 
        stripePayoutId,
        processedAt: status === 'completed' ? new Date() : undefined 
      })
      .where(eq(payouts.id, payoutId))
      .returning();
    return updated;
  }

  // Calculate partner revenue for a period
  async calculatePartnerRevenue(partnerId: string, periodStart: Date, periodEnd: Date): Promise<{
    totalRevenue: string;
    platformFee: string;
    partnerAmount: string;
    bookingsCount: number;
  }> {
    const packages = await this.getPartnerPackages(partnerId);
    const packageIds = packages.map(p => p.id);
    
    if (packageIds.length === 0) {
      return {
        totalRevenue: '0',
        platformFee: '0',
        partnerAmount: '0',
        bookingsCount: 0,
      };
    }
    
    const bookings = await db
      .select()
      .from(packageBookings)
      .where(
        and(
          inArray(packageBookings.packageId, packageIds),
          eq(packageBookings.paymentStatus, 'paid'),
          gte(packageBookings.createdAt, periodStart),
          lte(packageBookings.createdAt, periodEnd)
        )
      );
    
    const totalRevenue = bookings.reduce((sum, b) => sum + parseFloat(b.totalPrice), 0);
    const platformFeePercentage = 0.15; // 15% platform fee
    const platformFee = totalRevenue * platformFeePercentage;
    const partnerAmount = totalRevenue - platformFee;
    
    return {
      totalRevenue: totalRevenue.toFixed(2),
      platformFee: platformFee.toFixed(2),
      partnerAmount: partnerAmount.toFixed(2),
      bookingsCount: bookings.length,
    };
  }

  // ============= ADVANCED PARTNER ANALYTICS (Phase 12) =============

  async getPartnerTopPackages(partnerId: string, limit: number = 10): Promise<Array<{
    package: Package;
    totalBookings: number;
    totalRevenue: string;
    averageRating?: number;
  }>> {
    const packages = await this.getPartnerPackages(partnerId);
    const packageIds = packages.map(p => p.id);
    
    if (packageIds.length === 0) return [];
    
    // Get all bookings for these packages
    const bookings = await db
      .select()
      .from(packageBookings)
      .where(
        and(
          inArray(packageBookings.packageId, packageIds),
          eq(packageBookings.paymentStatus, 'paid')
        )
      );
    
    // Calculate stats per package
    const packageStats = new Map<string, { totalBookings: number; totalRevenue: number }>();
    
    bookings.forEach(booking => {
      const current = packageStats.get(booking.packageId) || { totalBookings: 0, totalRevenue: 0 };
      current.totalBookings++;
      current.totalRevenue += parseFloat(booking.totalPrice);
      packageStats.set(booking.packageId, current);
    });
    
    // Build results
    const results = packages
      .map(pkg => {
        const stats = packageStats.get(pkg.id) || { totalBookings: 0, totalRevenue: 0 };
        return {
          package: pkg,
          totalBookings: stats.totalBookings,
          totalRevenue: stats.totalRevenue.toFixed(2),
        };
      })
      .sort((a, b) => parseFloat(b.totalRevenue) - parseFloat(a.totalRevenue))
      .slice(0, limit);
    
    return results;
  }

  async getPartnerMonthlyTrends(partnerId: string, months: number = 6): Promise<Array<{
    month: string;
    bookings: number;
    revenue: string;
    newCustomers: number;
  }>> {
    const packages = await this.getPartnerPackages(partnerId);
    const packageIds = packages.map(p => p.id);
    
    if (packageIds.length === 0) return [];
    
    const startDate = new Date();
    startDate.setMonth(startDate.getMonth() - months);
    
    const bookings = await db
      .select()
      .from(packageBookings)
      .where(
        and(
          inArray(packageBookings.packageId, packageIds),
          eq(packageBookings.paymentStatus, 'paid'),
          gte(packageBookings.createdAt, startDate)
        )
      )
      .orderBy(asc(packageBookings.createdAt));
    
    // Group by month
    const monthlyData = new Map<string, {
      bookings: number;
      revenue: number;
      customers: Set<string>;
    }>();
    
    bookings.forEach(booking => {
      const monthKey = new Date(booking.createdAt).toISOString().substring(0, 7);
      const current = monthlyData.get(monthKey) || {
        bookings: 0,
        revenue: 0,
        customers: new Set<string>(),
      };
      
      current.bookings++;
      current.revenue += parseFloat(booking.totalPrice);
      current.customers.add(booking.userId);
      
      monthlyData.set(monthKey, current);
    });
    
    // Convert to array
    const results: Array<{
      month: string;
      bookings: number;
      revenue: string;
      newCustomers: number;
    }> = [];
    
    monthlyData.forEach((data, month) => {
      results.push({
        month,
        bookings: data.bookings,
        revenue: data.revenue.toFixed(2),
        newCustomers: data.customers.size,
      });
    });
    
    return results.sort((a, b) => a.month.localeCompare(b.month));
  }

  async exportPartnerData(partnerId: string): Promise<{
    partner: Partner;
    packages: Package[];
    bookings: PackageBooking[];
    analytics: any;
    coupons: Coupon[];
    affiliates: AffiliateLink[];
  }> {
    const [
      partner,
      packages,
      bookings,
      analytics,
      coupons,
      affiliates,
    ] = await Promise.all([
      this.getPartner(partnerId),
      this.getPartnerPackages(partnerId),
      this.getPartnerPackageBookings(partnerId),
      this.getPartnerAnalytics(partnerId),
      this.getPartnerCoupons(partnerId),
      this.getPartnerAffiliateLinks(partnerId),
    ]);
    
    return {
      partner: partner!,
      packages,
      bookings,
      analytics,
      coupons,
      affiliates,
    };
  }

  // ============= EXTERNAL CONNECTORS (OTA/DMO) - Phase 12 =============

  async createExternalConnector(data: InsertExternalConnector): Promise<ExternalConnector> {
    const [connector] = await this.db.insert(externalConnectors).values(data).returning();
    
    // Log audit trail
    await this.createAuditLog({
      userId: null,
      action: 'create_connector',
      entityType: 'external_connector',
      entityId: connector.id,
      changes: { after: connector },
    });
    
    return connector;
  }

  async getExternalConnector(connectorId: string): Promise<ExternalConnector | undefined> {
    const [connector] = await this.db
      .select()
      .from(externalConnectors)
      .where(eq(externalConnectors.id, connectorId));
    return connector;
  }

  async getPartnerConnectors(partnerId: string): Promise<ExternalConnector[]> {
    return await this.db
      .select()
      .from(externalConnectors)
      .where(eq(externalConnectors.partnerId, partnerId))
      .orderBy(desc(externalConnectors.createdAt));
  }

  async updateExternalConnector(connectorId: string, data: Partial<InsertExternalConnector>): Promise<ExternalConnector> {
    const [updated] = await this.db
      .update(externalConnectors)
      .set({ ...data, updatedAt: new Date() })
      .where(eq(externalConnectors.id, connectorId))
      .returning();
    return updated;
  }

  async updateConnectorStatus(connectorId: string, status: string, lastSyncAt?: Date): Promise<ExternalConnector> {
    const [updated] = await this.db
      .update(externalConnectors)
      .set({ 
        status, 
        lastSyncAt: lastSyncAt || new Date(),
        updatedAt: new Date(),
      })
      .where(eq(externalConnectors.id, connectorId))
      .returning();
    return updated;
  }

  async deleteExternalConnector(connectorId: string): Promise<void> {
    await this.db.delete(externalConnectors).where(eq(externalConnectors.id, connectorId));
  }

  // ============= INVENTORY MAPPING =============

  async createInventoryMap(data: {
    connectorId: string;
    externalId: string;
    localType: string;
    localId: string;
  }): Promise<ExternalInventoryMapping> {
    const [mapping] = await this.db.insert(externalInventoryMap).values({
      ...data,
      lastSyncAt: new Date(),
      syncStatus: 'synced',
    }).returning();
    return mapping;
  }

  async getInventoryMap(connectorId: string, externalId: string): Promise<ExternalInventoryMapping | undefined> {
    const [mapping] = await this.db
      .select()
      .from(externalInventoryMap)
      .where(
        and(
          eq(externalInventoryMap.connectorId, connectorId),
          eq(externalInventoryMap.externalId, externalId)
        )
      );
    return mapping;
  }

  async getConnectorMappings(connectorId: string): Promise<ExternalInventoryMapping[]> {
    return await this.db
      .select()
      .from(externalInventoryMap)
      .where(eq(externalInventoryMap.connectorId, connectorId))
      .orderBy(desc(externalInventoryMap.lastSyncAt));
  }

  async updateInventoryMapStatus(
    connectorId: string,
    externalId: string,
    syncStatus: string
  ): Promise<ExternalInventoryMapping> {
    const [updated] = await this.db
      .update(externalInventoryMap)
      .set({
        syncStatus,
        lastSyncAt: new Date(),
      })
      .where(
        and(
          eq(externalInventoryMap.connectorId, connectorId),
          eq(externalInventoryMap.externalId, externalId)
        )
      )
      .returning();
    return updated;
  }

  async deleteInventoryMap(connectorId: string, externalId: string): Promise<void> {
    await this.db
      .delete(externalInventoryMap)
      .where(
        and(
          eq(externalInventoryMap.connectorId, connectorId),
          eq(externalInventoryMap.externalId, externalId)
        )
      );
  }

  // Sync scheduler simulation
  async syncConnector(connectorId: string): Promise<{
    success: boolean;
    itemsSynced: number;
    errors: string[];
  }> {
    const connector = await this.getExternalConnector(connectorId);
    
    if (!connector) {
      return { success: false, itemsSynced: 0, errors: ['Connector not found'] };
    }
    
    if (connector.status !== 'active') {
      return { success: false, itemsSynced: 0, errors: ['Connector not active'] };
    }
    
    try {
      // Get partner packages to sync
      const packages = await this.getPartnerPackages(connector.partnerId);
      
      const errors: string[] = [];
      let itemsSynced = 0;
      
      for (const pkg of packages) {
        try {
          // Check if mapping exists
          const externalId = `ext_${pkg.id.substring(0, 8)}`;
          let mapping = await this.getInventoryMap(connector.id, externalId);
          
          if (!mapping) {
            // Create new mapping
            await this.createInventoryMap({
              connectorId: connector.id,
              externalId,
              localType: 'package',
              localId: pkg.id,
            });
          } else {
            // Update existing mapping
            await this.updateInventoryMapStatus(connector.id, externalId, 'synced');
          }
          
          itemsSynced++;
        } catch (err: any) {
          errors.push(`Failed to sync package ${pkg.id}: ${err.message}`);
        }
      }
      
      // Update connector last sync
      await this.updateConnectorStatus(
        connector.id,
        errors.length > 0 ? 'error' : 'active',
        new Date()
      );
      
      return {
        success: errors.length === 0,
        itemsSynced,
        errors,
      };
    } catch (error: any) {
      await this.updateConnectorStatus(connector.id, 'error');
      return {
        success: false,
        itemsSynced: 0,
        errors: [error.message],
      };
    }
  }

  async getUserSettings(userId: string): Promise<UserSettings | undefined> {
    const [settings] = await db.select().from(userSettings).where(eq(userSettings.userId, userId));
    return settings;
  }

  async upsertUserSettings(userId: string, settings: UpdateUserSettings): Promise<UserSettings> {
    const existingSettings = await this.getUserSettings(userId);
    
    const updatePayload: any = {
      ...settings,
      updatedAt: new Date(),
    };
    
    if (settings.geoConsent !== undefined && existingSettings) {
      if (settings.geoConsent === true && existingSettings.geoConsent === false) {
        updatePayload.consentGrantedAt = new Date();
        updatePayload.consentRevokedAt = null;
      } else if (settings.geoConsent === false && existingSettings.geoConsent === true) {
        updatePayload.consentRevokedAt = new Date();
      }
    } else if (settings.geoConsent === true && !existingSettings) {
      updatePayload.consentGrantedAt = new Date();
    }
    
    const [result] = await db
      .insert(userSettings)
      .values({
        userId,
        ...updatePayload,
      })
      .onConflictDoUpdate({
        target: userSettings.userId,
        set: updatePayload,
      })
      .returning();
    return result;
  }

  async createLike(userId: string, targetId: string, targetType: LikeTargetType): Promise<Like | null> {
    return await db.transaction(async (tx) => {
      try {
        // 1. Insert like
        const [like] = await tx.insert(likes).values({
          userId,
          targetId,
          targetType,
        }).returning();
        
        // 2. Get target owner ID (inline query using tx)
        let targetOwnerId: string | undefined;
        if (targetType === 'tour') {
          const [tour] = await tx.select({ guideId: tours.guideId })
            .from(tours)
            .where(eq(tours.id, targetId));
          targetOwnerId = tour?.guideId;
        } else if (targetType === 'service') {
          const [service] = await tx.select({ providerId: services.providerId })
            .from(services)
            .where(eq(services.id, targetId));
          targetOwnerId = service?.providerId;
        } else if (targetType === 'profile') {
          targetOwnerId = targetId;
        }
        
        // 3. Update trust level for target owner (inline using tx)
        if (targetOwnerId) {
          const [user] = await tx.select({ id: users.id, role: users.role })
            .from(users)
            .where(eq(users.id, targetOwnerId));
          
          if (user && (user.role === 'guide' || user.role === 'provider')) {
            // Get user's tours and services
            const userTours = user.role === 'guide' 
              ? await tx.select({ id: tours.id }).from(tours).where(eq(tours.guideId, targetOwnerId))
              : [];
            const userServices = user.role === 'provider'
              ? await tx.select({ id: services.id }).from(services).where(eq(services.providerId, targetOwnerId))
              : [];
            
            const allTargetIds = [
              targetOwnerId,
              ...userTours.map(t => t.id),
              ...userServices.map(s => s.id)
            ];
            
            // Count likes
            const likesCountResult = await tx
              .select({ count: sql<number>`count(*)::int` })
              .from(likes)
              .where(inArray(likes.targetId, allTargetIds));
            const likesCount = likesCountResult[0]?.count || 0;
            
            // Get average rating
            let avgRating = 0;
            if (user.role === 'guide') {
              const avgRatingResult = await tx
                .select({ avg: sql<number>`COALESCE(AVG(${reviews.rating}), 0)` })
                .from(reviews)
                .innerJoin(tours, eq(reviews.tourId, tours.id))
                .where(eq(tours.guideId, targetOwnerId));
              avgRating = Number(avgRatingResult[0]?.avg || 0);
            } else {
              const avgRatingResult = await tx
                .select({ avg: sql<number>`COALESCE(AVG(${reviews.rating}), 0)` })
                .from(reviews)
                .innerJoin(services, eq(reviews.serviceId, services.id))
                .where(eq(services.providerId, targetOwnerId));
              avgRating = Number(avgRatingResult[0]?.avg || 0);
            }
            
            // Calculate trust level
            const score = (likesCount * 2) + (avgRating * 10);
            let level: TrustLevel = 'explorer';
            if (score >= 201) level = 'legend';
            else if (score >= 101) level = 'navigator';
            else if (score >= 51) level = 'trailblazer';
            else if (score >= 21) level = 'pathfinder';
            
            // Update trust level
            await tx
              .insert(trustLevelsTable)
              .values({
                userId: targetOwnerId,
                level,
                score,
                likesCount,
                averageRating: avgRating.toString(),
                updatedAt: new Date(),
              })
              .onConflictDoUpdate({
                target: trustLevelsTable.userId,
                set: {
                  level,
                  score,
                  likesCount,
                  averageRating: avgRating.toString(),
                  updatedAt: new Date(),
                },
              });
          }
        }
        
        // 4. Award points to liker (inline using tx)
        const [likerReward] = await tx.select().from(userRewards)
          .where(eq(userRewards.userId, userId));
        
        const likerPoints = rewardPoints.like;
        let likerOldLevel: RewardLevel = 'bronze';
        let likerNewTotalPoints: number;
        
        if (likerReward) {
          likerOldLevel = likerReward.currentLevel as RewardLevel;
          likerNewTotalPoints = likerReward.totalPoints + likerPoints;
          const likerNewLevel = this.calculateLevel(likerNewTotalPoints);
          
          await tx.update(userRewards)
            .set({
              totalPoints: likerNewTotalPoints,
              currentLevel: likerNewLevel,
              updatedAt: new Date()
            })
            .where(eq(userRewards.userId, userId));
        } else {
          likerNewTotalPoints = likerPoints;
          const likerNewLevel = this.calculateLevel(likerNewTotalPoints);
          
          await tx.insert(userRewards).values({
            userId,
            totalPoints: likerNewTotalPoints,
            currentLevel: likerNewLevel,
            currentStreak: 0,
            longestStreak: 0,
            achievementsUnlocked: []
          });
        }
        
        // Insert reward log for liker
        await tx.insert(rewardLogs).values({
          userId,
          points: likerPoints,
          action: 'like',
          metadata: { targetId, targetType, description: `Liked ${targetType}: ${targetId}` }
        });
        
        // 5. Award points to receiver (inline using tx)
        if (targetOwnerId && targetOwnerId !== userId) {
          const [receiverReward] = await tx.select().from(userRewards)
            .where(eq(userRewards.userId, targetOwnerId));
          
          const receiverPoints = rewardPoints.receive_like;
          let receiverNewTotalPoints: number;
          
          if (receiverReward) {
            receiverNewTotalPoints = receiverReward.totalPoints + receiverPoints;
            const receiverNewLevel = this.calculateLevel(receiverNewTotalPoints);
            
            await tx.update(userRewards)
              .set({
                totalPoints: receiverNewTotalPoints,
                currentLevel: receiverNewLevel,
                updatedAt: new Date()
              })
              .where(eq(userRewards.userId, targetOwnerId));
          } else {
            receiverNewTotalPoints = receiverPoints;
            const receiverNewLevel = this.calculateLevel(receiverNewTotalPoints);
            
            await tx.insert(userRewards).values({
              userId: targetOwnerId,
              totalPoints: receiverNewTotalPoints,
              currentLevel: receiverNewLevel,
              currentStreak: 0,
              longestStreak: 0,
              achievementsUnlocked: []
            });
          }
          
          // Insert reward log for receiver
          await tx.insert(rewardLogs).values({
            userId: targetOwnerId,
            points: receiverPoints,
            action: 'receive_like',
            metadata: { fromUserId: userId, targetType, description: `Received like on ${targetType}` }
          });
        }
        
        return like;
      } catch (error: any) {
        if (error.code === '23505') {
          return null;
        }
        throw error;
      }
    });
  }

  async deleteLike(userId: string, targetId: string, targetType: LikeTargetType): Promise<void> {
    await db.transaction(async (tx) => {
      // 1. Delete like
      await tx.delete(likes).where(
        and(
          eq(likes.userId, userId),
          eq(likes.targetId, targetId),
          eq(likes.targetType, targetType)
        )
      );
      
      // 2. Get target owner ID (inline query using tx)
      let targetOwnerId: string | undefined;
      if (targetType === 'tour') {
        const [tour] = await tx.select({ guideId: tours.guideId })
          .from(tours)
          .where(eq(tours.id, targetId));
        targetOwnerId = tour?.guideId;
      } else if (targetType === 'service') {
        const [service] = await tx.select({ providerId: services.providerId })
          .from(services)
          .where(eq(services.id, targetId));
        targetOwnerId = service?.providerId;
      } else if (targetType === 'profile') {
        targetOwnerId = targetId;
      }
      
      // 3. Update trust level for target owner (inline using tx)
      if (targetOwnerId) {
        const [user] = await tx.select({ id: users.id, role: users.role })
          .from(users)
          .where(eq(users.id, targetOwnerId));
        
        if (user && (user.role === 'guide' || user.role === 'provider')) {
          // Get user's tours and services
          const userTours = user.role === 'guide' 
            ? await tx.select({ id: tours.id }).from(tours).where(eq(tours.guideId, targetOwnerId))
            : [];
          const userServices = user.role === 'provider'
            ? await tx.select({ id: services.id }).from(services).where(eq(services.providerId, targetOwnerId))
            : [];
          
          const allTargetIds = [
            targetOwnerId,
            ...userTours.map(t => t.id),
            ...userServices.map(s => s.id)
          ];
          
          // Count likes
          const likesCountResult = await tx
            .select({ count: sql<number>`count(*)::int` })
            .from(likes)
            .where(inArray(likes.targetId, allTargetIds));
          const likesCount = likesCountResult[0]?.count || 0;
          
          // Get average rating
          let avgRating = 0;
          if (user.role === 'guide') {
            const avgRatingResult = await tx
              .select({ avg: sql<number>`COALESCE(AVG(${reviews.rating}), 0)` })
              .from(reviews)
              .innerJoin(tours, eq(reviews.tourId, tours.id))
              .where(eq(tours.guideId, targetOwnerId));
            avgRating = Number(avgRatingResult[0]?.avg || 0);
          } else {
            const avgRatingResult = await tx
              .select({ avg: sql<number>`COALESCE(AVG(${reviews.rating}), 0)` })
              .from(reviews)
              .innerJoin(services, eq(reviews.serviceId, services.id))
              .where(eq(services.providerId, targetOwnerId));
            avgRating = Number(avgRatingResult[0]?.avg || 0);
          }
          
          // Calculate trust level
          const score = (likesCount * 2) + (avgRating * 10);
          let level: TrustLevel = 'explorer';
          if (score >= 201) level = 'legend';
          else if (score >= 101) level = 'navigator';
          else if (score >= 51) level = 'trailblazer';
          else if (score >= 21) level = 'pathfinder';
          
          // Update trust level
          await tx
            .insert(trustLevelsTable)
            .values({
              userId: targetOwnerId,
              level,
              score,
              likesCount,
              averageRating: avgRating.toString(),
              updatedAt: new Date(),
            })
            .onConflictDoUpdate({
              target: trustLevelsTable.userId,
              set: {
                level,
                score,
                likesCount,
                averageRating: avgRating.toString(),
                updatedAt: new Date(),
              },
            });
        }
      }
    });
  }

  async getLikesByTarget(targetId: string, targetType: LikeTargetType): Promise<number> {
    const result = await db
      .select({ count: sql<number>`count(*)::int` })
      .from(likes)
      .where(
        and(
          eq(likes.targetId, targetId),
          eq(likes.targetType, targetType)
        )
      );
    return result[0]?.count || 0;
  }

  async getUserLikes(userId: string): Promise<Like[]> {
    return await db.select().from(likes).where(eq(likes.userId, userId));
  }

  async checkUserLike(userId: string, targetId: string, targetType: LikeTargetType): Promise<boolean> {
    const result = await db
      .select()
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

  async getMultipleLikesStatus(userId: string, targetIds: string[], targetType: LikeTargetType): Promise<Record<string, boolean>> {
    if (targetIds.length === 0) return {};
    
    const userLikes = await db
      .select()
      .from(likes)
      .where(
        and(
          eq(likes.userId, userId),
          inArray(likes.targetId, targetIds),
          eq(likes.targetType, targetType)
        )
      );
    
    const likeMap: Record<string, boolean> = {};
    targetIds.forEach(id => {
      likeMap[id] = false;
    });
    
    userLikes.forEach(like => {
      likeMap[like.targetId] = true;
    });
    
    return likeMap;
  }

  async updateTrustLevel(userId: string): Promise<void> {
    const user = await this.getUser(userId);
    if (!user || (user.role !== 'guide' && user.role !== 'provider')) {
      return;
    }
    
    const userTours = user.role === 'guide' ? await this.getMyTours(userId) : [];
    const userServices = user.role === 'provider' ? await this.getMyServices(userId) : [];
    
    const allTargetIds = [
      userId,
      ...userTours.map(t => t.id),
      ...userServices.map(s => s.id)
    ];
    
    const likesCountResult = await db
      .select({ count: sql<number>`count(*)::int` })
      .from(likes)
      .where(inArray(likes.targetId, allTargetIds));
    
    const likesCount = likesCountResult[0]?.count || 0;
    
    const avgRating = user.role === 'guide' 
      ? await this.getGuideAverageRating(userId)
      : await this.getProviderAverageRating(userId);
    
    const score = (likesCount * 2) + (avgRating * 10);
    
    let level: TrustLevel = 'explorer';
    if (score >= 201) level = 'legend';
    else if (score >= 101) level = 'navigator';
    else if (score >= 51) level = 'trailblazer';
    else if (score >= 21) level = 'pathfinder';
    else level = 'explorer';
    
    await db
      .insert(trustLevelsTable)
      .values({
        userId,
        level,
        score,
        likesCount,
        averageRating: avgRating.toString(),
        updatedAt: new Date(),
      })
      .onConflictDoUpdate({
        target: trustLevelsTable.userId,
        set: {
          level,
          score,
          likesCount,
          averageRating: avgRating.toString(),
          updatedAt: new Date(),
        },
      });
  }
}

export const storage = new DatabaseStorage();
