import {
  users,
  tours,
  services,
  bookings,
  reviews,
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
  type TourWithGuide,
  type ServiceWithProvider,
  type BookingWithDetails,
  type UserRole,
} from "@shared/schema";
import { db } from "./db";
import { eq, and, desc, sql } from "drizzle-orm";

export interface IStorage {
  // User operations
  getUser(id: string): Promise<User | undefined>;
  upsertUser(user: UpsertUser): Promise<User>;
  setUserRole(userId: string, role: UserRole): Promise<User>;
  getPendingUsers(): Promise<User[]>;
  getAllUsers(): Promise<User[]>;
  approveUser(userId: string, supervisorId: string): Promise<User>;
  rejectUser(userId: string, supervisorId: string): Promise<User>;
  promoteToSupervisor(userId: string, promotedBy: string): Promise<User>;
  
  // Tour operations
  getTours(): Promise<TourWithGuide[]>;
  getTour(id: string): Promise<TourWithGuide | undefined>;
  getMyTours(guideId: string): Promise<Tour[]>;
  createTour(tour: InsertTour): Promise<Tour>;
  updateTour(id: string, tour: Partial<InsertTour>): Promise<Tour>;
  deleteTour(id: string): Promise<void>;
  
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
  createReview(review: InsertReview): Promise<Review>;
  updateReview(id: string, response: string): Promise<Review>;
  
  // Stats operations
  getGuideStats(guideId: string): Promise<{ totalBookings: number; totalRevenue: number; avgRating: number }>;
  getProviderStats(providerId: string): Promise<{ totalOrders: number; totalRevenue: number; avgRating: number }>;
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

  // Tour operations
  async getTours(): Promise<TourWithGuide[]> {
    const results = await db
      .select()
      .from(tours)
      .leftJoin(users, eq(tours.guideId, users.id))
      .where(eq(tours.isActive, true))
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

  async createReview(review: InsertReview): Promise<Review> {
    const [newReview] = await db.insert(reviews).values(review).returning();
    return newReview;
  }

  async updateReview(id: string, response: string): Promise<Review> {
    const [updated] = await db
      .update(reviews)
      .set({ response, updatedAt: new Date() })
      .where(eq(reviews.id, id))
      .returning();
    return updated;
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
      .where(sql`${bookings.tourId} = ANY(${tourIds})`);

    const [ratingsResult] = await db
      .select({
        avgRating: sql<number>`avg(${reviews.rating})`,
      })
      .from(reviews)
      .where(sql`${reviews.tourId} = ANY(${tourIds})`);

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
      .where(sql`${reviews.serviceId} = ANY(${serviceIds})`);

    return {
      totalOrders: 0, // Placeholder - would need order tracking for services
      totalRevenue: 0, // Placeholder
      avgRating: Number(ratingsResult?.avgRating || 0),
    };
  }
}

export const storage = new DatabaseStorage();
