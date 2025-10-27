import type { Express } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import { setupAuth, isAuthenticated } from "./replitAuth";
import { ObjectStorageService, ObjectNotFoundError, objectStorageClient } from "./objectStorage";
import { ObjectPermission } from "./objectAcl";
import Stripe from "stripe";
import { insertTourSchema, insertServiceSchema, insertBookingSchema, insertReviewSchema, updateProfileSchema, insertSponsorshipSchema } from "@shared/schema";
import { randomUUID } from "crypto";

// Try production key first, then testing key
const stripeSecretKey = process.env.STRIPE_SECRET_KEY || process.env.TESTING_STRIPE_SECRET_KEY;
const isValidSecretKey = stripeSecretKey && stripeSecretKey.startsWith('sk_');
const stripe = isValidSecretKey
  ? new Stripe(stripeSecretKey, { apiVersion: "2025-09-30.clover" })
  : null;

// Log which key is being used (helpful for debugging)
if (stripe) {
  console.log('[Stripe] Initialized with key starting with:', stripeSecretKey.substring(0, 7));
} else {
  console.warn('[Stripe] No valid secret key found. Stripe checkout will be unavailable.');
}

// Image validation constants and helpers
const MAX_IMAGE_SIZE = 5 * 1024 * 1024; // 5MB in bytes

interface ImageTypeInfo {
  extension: string;
  mimeType: string;
}

/**
 * Validates image type by checking magic bytes (file signature)
 * Returns image info if valid, null otherwise
 */
function validateImageMagicBytes(buffer: Buffer): ImageTypeInfo | null {
  // JPEG: FF D8 FF
  if (buffer.length >= 3 && 
      buffer[0] === 0xFF && 
      buffer[1] === 0xD8 && 
      buffer[2] === 0xFF) {
    return { extension: 'jpg', mimeType: 'image/jpeg' };
  }
  
  // PNG: 89 50 4E 47 0D 0A 1A 0A
  if (buffer.length >= 8 && 
      buffer[0] === 0x89 && 
      buffer[1] === 0x50 && 
      buffer[2] === 0x4E && 
      buffer[3] === 0x47 &&
      buffer[4] === 0x0D &&
      buffer[5] === 0x0A &&
      buffer[6] === 0x1A &&
      buffer[7] === 0x0A) {
    return { extension: 'png', mimeType: 'image/png' };
  }
  
  // WebP: RIFF (52 49 46 46) ... WEBP (57 45 42 50)
  if (buffer.length >= 12 && 
      buffer[0] === 0x52 && 
      buffer[1] === 0x49 && 
      buffer[2] === 0x46 && 
      buffer[3] === 0x46 &&
      buffer[8] === 0x57 &&
      buffer[9] === 0x45 &&
      buffer[10] === 0x42 &&
      buffer[11] === 0x50) {
    return { extension: 'webp', mimeType: 'image/webp' };
  }
  
  return null;
}

/**
 * Sanitizes filename to prevent path traversal attacks
 */
function sanitizeFilename(filename: string): string {
  // Remove any directory traversal attempts and dangerous characters
  return filename
    .replace(/\.\./g, '')
    .replace(/[\/\\]/g, '')
    .replace(/[^a-zA-Z0-9._-]/g, '_');
}

export async function registerRoutes(app: Express): Promise<Server> {
  // Auth middleware
  await setupAuth(app);

  // Auth routes
  app.get('/api/auth/user', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const user = await storage.getUser(userId);
      res.json(user);
    } catch (error) {
      console.error("Error fetching user:", error);
      res.status(500).json({ message: "Failed to fetch user" });
    }
  });

  app.post('/api/auth/set-role', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const { role } = req.body;
      
      if (!['tourist', 'guide', 'provider'].includes(role)) {
        return res.status(400).json({ message: "Invalid role" });
      }

      const user = await storage.setUserRole(userId, role);
      res.json(user);
    } catch (error) {
      console.error("Error setting role:", error);
      res.status(500).json({ message: "Failed to set role" });
    }
  });

  app.patch('/api/auth/update-profile', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      
      const validation = updateProfileSchema.safeParse(req.body);
      if (!validation.success) {
        return res.status(400).json({ 
          message: "Invalid profile data", 
          errors: validation.error.errors 
        });
      }

      const updatedUser = await storage.updateUserProfile(userId, validation.data);
      res.json(updatedUser);
    } catch (error) {
      console.error("Error updating profile:", error);
      res.status(500).json({ message: "Failed to update profile" });
    }
  });

  app.post('/api/auth/upload-profile-image', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const { imageData } = req.body;

      // Validate that image data is provided
      if (!imageData || typeof imageData !== 'string') {
        return res.status(400).json({ message: "Missing or invalid image data" });
      }

      // Decode base64 image
      const base64Data = imageData.replace(/^data:image\/\w+;base64,/, "");
      const buffer = Buffer.from(base64Data, 'base64');

      // SECURITY: Validate file size (5MB maximum)
      if (buffer.length > MAX_IMAGE_SIZE) {
        return res.status(400).json({ 
          message: `File size exceeds maximum allowed size of ${MAX_IMAGE_SIZE / 1024 / 1024}MB` 
        });
      }

      // SECURITY: Validate file size is not empty
      if (buffer.length === 0) {
        return res.status(400).json({ message: "Image data is empty" });
      }

      // SECURITY: Validate image type by checking magic bytes
      const imageInfo = validateImageMagicBytes(buffer);
      if (!imageInfo) {
        return res.status(400).json({ 
          message: "Invalid image type. Only JPEG, PNG, and WebP images are allowed" 
        });
      }

      // SECURITY: Generate unique filename server-side (do NOT trust client)
      const uniqueFilename = `${randomUUID()}.${imageInfo.extension}`;

      // Get public search paths from object storage service
      const objectStorage = new ObjectStorageService();
      const publicPaths = objectStorage.getPublicObjectSearchPaths();
      
      if (publicPaths.length === 0) {
        return res.status(500).json({ message: "Object storage not configured" });
      }

      // Use the first public path
      const basePath = publicPaths[0];
      // SECURITY: Use server-generated filename, sanitize userId path component
      const sanitizedUserId = sanitizeFilename(userId);
      const objectPath = `profile-images/${sanitizedUserId}/${uniqueFilename}`;
      const fullPath = `${basePath}/${objectPath}`;

      // Parse bucket and object name
      const pathParts = fullPath.split("/");
      const bucketName = pathParts[1];
      const objectName = pathParts.slice(2).join("/");

      // Upload to Google Cloud Storage
      const bucket = objectStorageClient.bucket(bucketName);
      const file = bucket.file(objectName);
      
      // SECURITY: Use validated MIME type from magic bytes, not client-provided data
      await file.save(buffer, {
        metadata: {
          contentType: imageInfo.mimeType,
        },
        public: true,
      });

      // Make the file publicly accessible
      await file.makePublic();

      // Get public URL
      const imageUrl = `https://storage.googleapis.com/${bucketName}/${objectName}`;

      // Update user profile with new image URL
      const updatedUser = await storage.updateUserProfile(userId, {
        profileImageUrl: imageUrl,
      });

      res.json({ imageUrl, user: updatedUser });
    } catch (error) {
      console.error("Error uploading profile image:", error);
      res.status(500).json({ message: "Failed to upload profile image" });
    }
  });

  app.post('/api/auth/logout', isAuthenticated, async (req: any, res) => {
    req.logout((err: any) => {
      if (err) {
        console.error("Logout error:", err);
        return res.status(500).json({ message: "Failed to logout" });
      }
      req.session.destroy((err: any) => {
        if (err) {
          console.error("Session destroy error:", err);
          return res.status(500).json({ message: "Failed to destroy session" });
        }
        res.clearCookie('connect.sid');
        res.json({ message: "Logged out successfully" });
      });
    });
  });

  // Supervisor routes
  app.get('/api/supervisor/pending-users', isAuthenticated, async (req: any, res) => {
    try {
      const user = await storage.getUser(req.user.claims.sub);
      if (user?.role !== 'supervisor') {
        return res.status(403).json({ message: "Access denied. Supervisor role required." });
      }

      const pendingUsers = await storage.getPendingUsers();
      res.json(pendingUsers);
    } catch (error) {
      console.error("Error fetching pending users:", error);
      res.status(500).json({ message: "Failed to fetch pending users" });
    }
  });

  app.post('/api/supervisor/approve-user/:userId', isAuthenticated, async (req: any, res) => {
    try {
      const supervisorId = req.user.claims.sub;
      const supervisor = await storage.getUser(supervisorId);
      
      if (supervisor?.role !== 'supervisor') {
        return res.status(403).json({ message: "Access denied. Supervisor role required." });
      }

      const user = await storage.approveUser(req.params.userId, supervisorId);
      res.json(user);
    } catch (error) {
      console.error("Error approving user:", error);
      res.status(500).json({ message: "Failed to approve user" });
    }
  });

  app.post('/api/supervisor/reject-user/:userId', isAuthenticated, async (req: any, res) => {
    try {
      const supervisorId = req.user.claims.sub;
      const supervisor = await storage.getUser(supervisorId);
      
      if (supervisor?.role !== 'supervisor') {
        return res.status(403).json({ message: "Access denied. Supervisor role required." });
      }

      const user = await storage.rejectUser(req.params.userId, supervisorId);
      res.json(user);
    } catch (error) {
      console.error("Error rejecting user:", error);
      res.status(500).json({ message: "Failed to reject user" });
    }
  });

  app.get('/api/supervisor/users', isAuthenticated, async (req: any, res) => {
    try {
      const user = await storage.getUser(req.user.claims.sub);
      if (user?.role !== 'supervisor') {
        return res.status(403).json({ message: "Access denied. Supervisor role required." });
      }

      const allUsers = await storage.getAllUsers();
      res.json(allUsers);
    } catch (error) {
      console.error("Error fetching all users:", error);
      res.status(500).json({ message: "Failed to fetch users" });
    }
  });

  app.post('/api/supervisor/promote-to-supervisor/:userId', isAuthenticated, async (req: any, res) => {
    try {
      const supervisorId = req.user.claims.sub;
      const supervisor = await storage.getUser(supervisorId);
      
      if (supervisor?.role !== 'supervisor') {
        return res.status(403).json({ message: "Access denied. Supervisor role required." });
      }

      const targetUser = await storage.getUser(req.params.userId);
      if (!targetUser) {
        return res.status(404).json({ message: "User not found" });
      }

      if (targetUser.role === 'supervisor') {
        return res.status(400).json({ message: "User is already a supervisor" });
      }

      const promotedUser = await storage.promoteToSupervisor(req.params.userId, supervisorId);
      res.json(promotedUser);
    } catch (error) {
      console.error("Error promoting user to supervisor:", error);
      res.status(500).json({ message: "Failed to promote user" });
    }
  });

  // Tour moderation routes (supervisor only)
  app.get('/api/supervisor/pending-tours', isAuthenticated, async (req: any, res) => {
    try {
      const user = await storage.getUser(req.user.claims.sub);
      if (user?.role !== 'supervisor') {
        return res.status(403).json({ message: "Access denied. Supervisor role required." });
      }

      const pendingTours = await storage.getPendingTours();
      res.json(pendingTours);
    } catch (error) {
      console.error("Error fetching pending tours:", error);
      res.status(500).json({ message: "Failed to fetch pending tours" });
    }
  });

  app.post('/api/supervisor/approve-tour/:tourId', isAuthenticated, async (req: any, res) => {
    try {
      const supervisorId = req.user.claims.sub;
      const supervisor = await storage.getUser(supervisorId);
      
      if (supervisor?.role !== 'supervisor') {
        return res.status(403).json({ message: "Access denied. Supervisor role required." });
      }

      const tour = await storage.approveTour(req.params.tourId, supervisorId);
      res.json(tour);
    } catch (error) {
      console.error("Error approving tour:", error);
      res.status(500).json({ message: "Failed to approve tour" });
    }
  });

  app.post('/api/supervisor/reject-tour/:tourId', isAuthenticated, async (req: any, res) => {
    try {
      const supervisorId = req.user.claims.sub;
      const supervisor = await storage.getUser(supervisorId);
      
      if (supervisor?.role !== 'supervisor') {
        return res.status(403).json({ message: "Access denied. Supervisor role required." });
      }

      const tour = await storage.rejectTour(req.params.tourId, supervisorId);
      res.json(tour);
    } catch (error) {
      console.error("Error rejecting tour:", error);
      res.status(500).json({ message: "Failed to reject tour" });
    }
  });

  // Tour routes
  app.get('/api/tours', async (req, res) => {
    try {
      const { category, search, minPrice, maxPrice } = req.query;
      let tours = await storage.getTours();
      
      // Apply filters
      if (category) {
        tours = tours.filter(t => t.category === category);
      }
      if (search) {
        const searchLower = (search as string).toLowerCase();
        tours = tours.filter(t => 
          t.title.toLowerCase().includes(searchLower) ||
          t.description.toLowerCase().includes(searchLower)
        );
      }
      if (minPrice) {
        tours = tours.filter(t => t.price && parseFloat(t.price.toString()) >= parseFloat(minPrice as string));
      }
      if (maxPrice) {
        tours = tours.filter(t => t.price && parseFloat(t.price.toString()) <= parseFloat(maxPrice as string));
      }
      
      res.json(tours);
    } catch (error) {
      console.error("Error fetching tours:", error);
      res.status(500).json({ message: "Failed to fetch tours" });
    }
  });

  app.get('/api/tours/:id', async (req, res) => {
    try {
      const tour = await storage.getTour(req.params.id);
      if (!tour) {
        return res.status(404).json({ message: "Tour not found" });
      }
      res.json(tour);
    } catch (error) {
      console.error("Error fetching tour:", error);
      res.status(500).json({ message: "Failed to fetch tour" });
    }
  });

  app.get('/api/my-tours', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const tours = await storage.getMyTours(userId);
      res.json(tours);
    } catch (error) {
      console.error("Error fetching my tours:", error);
      res.status(500).json({ message: "Failed to fetch tours" });
    }
  });

  app.post('/api/tours', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const user = await storage.getUser(userId);
      
      if (user?.role !== 'guide') {
        return res.status(403).json({ message: "Only guides can create tours" });
      }
      
      if (user.approvalStatus !== 'approved') {
        return res.status(403).json({ 
          message: "Your account is pending approval. Please wait for a supervisor to approve your account before creating tours.",
          approvalStatus: user.approvalStatus
        });
      }
      
      const validatedData = insertTourSchema.parse({ ...req.body, guideId: userId });
      const tour = await storage.createTour(validatedData);
      res.json(tour);
    } catch (error: any) {
      console.error("Error creating tour:", error);
      res.status(400).json({ message: error.message || "Failed to create tour" });
    }
  });

  app.put('/api/tours/:id', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const tour = await storage.getTour(req.params.id);
      if (!tour) {
        return res.status(404).json({ message: "Tour not found" });
      }
      if (tour.guideId !== userId) {
        return res.status(403).json({ message: "You can only update your own tours" });
      }
      // Validate the update data with the schema, but allow partial updates
      const validatedData = insertTourSchema.partial().parse(req.body);
      const updated = await storage.updateTour(req.params.id, validatedData);
      res.json(updated);
    } catch (error: any) {
      console.error("Error updating tour:", error);
      res.status(400).json({ message: error.message || "Failed to update tour" });
    }
  });

  app.delete('/api/tours/:id', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const tour = await storage.getTour(req.params.id);
      if (!tour) {
        return res.status(404).json({ message: "Tour not found" });
      }
      if (tour.guideId !== userId) {
        return res.status(403).json({ message: "You can only delete your own tours" });
      }
      await storage.deleteTour(req.params.id);
      res.json({ message: "Tour deleted successfully" });
    } catch (error) {
      console.error("Error deleting tour:", error);
      res.status(500).json({ message: "Failed to delete tour" });
    }
  });

  // Service routes
  app.get('/api/services', async (req, res) => {
    try {
      const { type, search, priceRange } = req.query;
      let services = await storage.getServices();
      
      // Apply filters
      if (type) {
        services = services.filter(s => s.type === type);
      }
      if (search) {
        const searchLower = (search as string).toLowerCase();
        services = services.filter(s => 
          s.name.toLowerCase().includes(searchLower) ||
          s.description.toLowerCase().includes(searchLower)
        );
      }
      if (priceRange) {
        services = services.filter(s => s.priceRange === priceRange);
      }
      
      res.json(services);
    } catch (error) {
      console.error("Error fetching services:", error);
      res.status(500).json({ message: "Failed to fetch services" });
    }
  });

  app.get('/api/services/:id', async (req, res) => {
    try {
      const service = await storage.getService(req.params.id);
      if (!service) {
        return res.status(404).json({ message: "Service not found" });
      }
      res.json(service);
    } catch (error) {
      console.error("Error fetching service:", error);
      res.status(500).json({ message: "Failed to fetch service" });
    }
  });

  app.get('/api/services/my-services', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const services = await storage.getMyServices(userId);
      res.json(services);
    } catch (error) {
      console.error("Error fetching my services:", error);
      res.status(500).json({ message: "Failed to fetch services" });
    }
  });

  app.post('/api/services', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const user = await storage.getUser(userId);
      
      if (user?.role !== 'provider') {
        return res.status(403).json({ message: "Only providers can create services" });
      }
      
      if (user.approvalStatus !== 'approved') {
        return res.status(403).json({ 
          message: "Your account is pending approval. Please wait for a supervisor to approve your account before creating services.",
          approvalStatus: user.approvalStatus
        });
      }
      
      const validatedData = insertServiceSchema.parse({ ...req.body, providerId: userId });
      const service = await storage.createService(validatedData);
      res.json(service);
    } catch (error: any) {
      console.error("Error creating service:", error);
      res.status(400).json({ message: error.message || "Failed to create service" });
    }
  });

  app.put('/api/services/:id', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const service = await storage.getService(req.params.id);
      if (!service) {
        return res.status(404).json({ message: "Service not found" });
      }
      if (service.providerId !== userId) {
        return res.status(403).json({ message: "You can only update your own services" });
      }
      // Validate the update data with the schema, but allow partial updates
      const validatedData = insertServiceSchema.partial().parse(req.body);
      const updated = await storage.updateService(req.params.id, validatedData);
      res.json(updated);
    } catch (error: any) {
      console.error("Error updating service:", error);
      res.status(400).json({ message: error.message || "Failed to update service" });
    }
  });

  app.delete('/api/services/:id', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const service = await storage.getService(req.params.id);
      if (!service) {
        return res.status(404).json({ message: "Service not found" });
      }
      if (service.providerId !== userId) {
        return res.status(403).json({ message: "You can only delete your own services" });
      }
      await storage.deleteService(req.params.id);
      res.json({ message: "Service deleted successfully" });
    } catch (error: any) {
      console.error("Error deleting service:", error);
      res.status(400).json({ message: error.message || "Failed to delete service" });
    }
  });

  // Booking routes
  app.get('/api/bookings', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const bookings = await storage.getBookings(userId);
      res.json(bookings);
    } catch (error) {
      console.error("Error fetching bookings:", error);
      res.status(500).json({ message: "Failed to fetch bookings" });
    }
  });

  app.get('/api/bookings/count', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const count = await storage.getBookingsCount(userId);
      res.json({ count });
    } catch (error) {
      console.error("Error fetching bookings count:", error);
      res.status(500).json({ message: "Failed to fetch bookings count" });
    }
  });

  app.post('/api/bookings', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const validatedData = insertBookingSchema.parse({ ...req.body, userId });
      const booking = await storage.createBooking(validatedData);
      res.json(booking);
    } catch (error: any) {
      console.error("Error creating booking:", error);
      res.status(400).json({ message: error.message || "Failed to create booking" });
    }
  });

  app.put('/api/bookings/:id', isAuthenticated, async (req, res) => {
    try {
      const booking = await storage.updateBooking(req.params.id, req.body);
      res.json(booking);
    } catch (error) {
      console.error("Error updating booking:", error);
      res.status(500).json({ message: "Failed to update booking" });
    }
  });

  // Stripe payment routes
  app.post('/api/create-checkout-session', isAuthenticated, async (req: any, res) => {
    try {
      if (!stripe) {
        return res.status(503).json({ message: "Stripe is not configured" });
      }

      const { bookingId } = req.body;
      const booking = await storage.getBookingById(bookingId);
      
      if (!booking) {
        return res.status(404).json({ message: "Booking not found" });
      }

      const tour = await storage.getTour(booking.tourId);
      if (!tour) {
        return res.status(404).json({ message: "Tour not found" });
      }

      const session = await stripe.checkout.sessions.create({
        payment_method_types: ['card'],
        line_items: [
          {
            price_data: {
              currency: 'usd',
              product_data: {
                name: tour.title,
                description: `${booking.participants} participant(s)`,
              },
              unit_amount: Math.round(Number(booking.totalAmount) * 100),
            },
            quantity: 1,
          },
        ],
        mode: 'payment',
        success_url: `${process.env.REPLIT_DEV_DOMAIN || 'http://localhost:5000'}/booking-success?session_id={CHECKOUT_SESSION_ID}&booking_id=${bookingId}`,
        cancel_url: `${process.env.REPLIT_DEV_DOMAIN || 'http://localhost:5000'}/book/${booking.tourId}`,
        metadata: {
          bookingId: booking.id,
        },
      });

      await storage.updateBooking(bookingId, { stripePaymentIntentId: session.id });

      res.json({ sessionId: session.id, url: session.url });
    } catch (error: any) {
      console.error("Error creating checkout session:", error);
      res.status(500).json({ message: error.message || "Failed to create checkout session" });
    }
  });

  app.post('/api/stripe-webhook', async (req, res) => {
    const sig = req.headers['stripe-signature'];
    
    if (!stripe || !sig) {
      return res.status(400).send('Webhook signature missing');
    }

    let event;
    try {
      const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET;
      if (webhookSecret) {
        event = stripe.webhooks.constructEvent(req.body, sig, webhookSecret);
      } else {
        event = req.body;
      }
    } catch (err: any) {
      console.error('Webhook signature verification failed:', err.message);
      return res.status(400).send(`Webhook Error: ${err.message}`);
    }

    if (event.type === 'checkout.session.completed') {
      const session = event.data.object as any;
      const bookingId = session.metadata?.bookingId;

      if (bookingId) {
        await storage.updateBooking(bookingId, {
          status: 'confirmed',
          paymentStatus: 'paid',
        });
      }
    }

    res.json({ received: true });
  });

  // Review routes
  app.get('/api/reviews', async (req, res) => {
    try {
      const { tourId, serviceId } = req.query;
      const reviews = await storage.getReviews(
        tourId as string | undefined,
        serviceId as string | undefined
      );
      res.json(reviews);
    } catch (error) {
      console.error("Error fetching reviews:", error);
      res.status(500).json({ message: "Failed to fetch reviews" });
    }
  });

  app.post('/api/reviews', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const validatedData = insertReviewSchema.parse({ ...req.body, userId });
      const review = await storage.createReview(validatedData);
      res.json(review);
    } catch (error: any) {
      console.error("Error creating review:", error);
      res.status(400).json({ message: error.message || "Failed to create review" });
    }
  });

  app.put('/api/reviews/:id/response', isAuthenticated, async (req, res) => {
    try {
      const { response } = req.body;
      const review = await storage.updateReview(req.params.id, response);
      res.json(review);
    } catch (error) {
      console.error("Error updating review:", error);
      res.status(500).json({ message: "Failed to update review" });
    }
  });

  // Stats routes
  app.get('/api/guide/stats', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const stats = await storage.getGuideStats(userId);
      res.json(stats);
    } catch (error) {
      console.error("Error fetching guide stats:", error);
      res.status(500).json({ message: "Failed to fetch stats" });
    }
  });

  app.get('/api/provider/stats', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const stats = await storage.getProviderStats(userId);
      res.json(stats);
    } catch (error) {
      console.error("Error fetching provider stats:", error);
      res.status(500).json({ message: "Failed to fetch stats" });
    }
  });

  // Sponsorship routes
  app.post('/api/sponsorships/create-checkout', isAuthenticated, async (req: any, res) => {
    try {
      if (!stripe) {
        return res.status(503).json({ message: "Stripe is not configured" });
      }

      const userId = req.user.claims.sub;
      const user = await storage.getUser(userId);
      
      if (!user) {
        return res.status(404).json({ message: "User not found" });
      }

      const { tourId, serviceId, duration } = req.body;

      // Validate that either tourId or serviceId is provided, but not both
      if ((!tourId && !serviceId) || (tourId && serviceId)) {
        return res.status(400).json({ message: "Please provide either tourId or serviceId, not both" });
      }

      // Validate duration
      if (!['weekly', 'monthly'].includes(duration)) {
        return res.status(400).json({ message: "Duration must be 'weekly' or 'monthly'" });
      }

      // Validate user role and ownership
      if (tourId) {
        if (user.role !== 'guide') {
          return res.status(403).json({ message: "Only guides can sponsor tours" });
        }
        
        const tour = await storage.getTour(tourId);
        if (!tour) {
          return res.status(404).json({ message: "Tour not found" });
        }
        
        if (tour.guideId !== userId) {
          return res.status(403).json({ message: "You can only sponsor your own tours" });
        }

        // Check if tour already has an active sponsorship
        const existingSponsorship = await storage.getActiveSponsorship(tourId, undefined);
        if (existingSponsorship) {
          return res.status(400).json({ message: "This tour already has an active sponsorship" });
        }
      }

      if (serviceId) {
        if (user.role !== 'provider') {
          return res.status(403).json({ message: "Only providers can sponsor services" });
        }
        
        const service = await storage.getService(serviceId);
        if (!service) {
          return res.status(404).json({ message: "Service not found" });
        }
        
        if (service.providerId !== userId) {
          return res.status(403).json({ message: "You can only sponsor your own services" });
        }

        // Check if service already has an active sponsorship
        const existingSponsorship = await storage.getActiveSponsorship(undefined, serviceId);
        if (existingSponsorship) {
          return res.status(400).json({ message: "This service already has an active sponsorship" });
        }
      }

      // Calculate price based on duration
      const price = duration === 'weekly' ? 49 : 149;

      // Create pending sponsorship record
      const sponsorshipData = {
        userId,
        tourId: tourId || null,
        serviceId: serviceId || null,
        duration,
        price: price.toString(),
        status: 'pending'
      };

      const validation = insertSponsorshipSchema.safeParse(sponsorshipData);
      if (!validation.success) {
        return res.status(400).json({ 
          message: "Invalid sponsorship data", 
          errors: validation.error.errors 
        });
      }

      const sponsorship = await storage.createSponsorship(validation.data);

      // Create Stripe Checkout session
      const itemName = tourId 
        ? `Tour Sponsorship - ${duration === 'weekly' ? 'Weekly' : 'Monthly'}`
        : `Service Sponsorship - ${duration === 'weekly' ? 'Weekly' : 'Monthly'}`;

      const session = await stripe.checkout.sessions.create({
        payment_method_types: ['card'],
        line_items: [
          {
            price_data: {
              currency: 'usd',
              product_data: {
                name: itemName,
                description: `${duration === 'weekly' ? '7 days' : '30 days'} of promoted visibility`,
              },
              unit_amount: price * 100, // Convert to cents
            },
            quantity: 1,
          },
        ],
        mode: 'payment',
        success_url: `${process.env.REPLIT_DEV_DOMAIN || 'http://localhost:5000'}/sponsorship-success?session_id={CHECKOUT_SESSION_ID}&sponsorshipId=${sponsorship.id}`,
        cancel_url: `${process.env.REPLIT_DEV_DOMAIN || 'http://localhost:5000'}/${tourId ? 'guide-dashboard' : 'provider-dashboard'}`,
        metadata: {
          sponsorshipId: sponsorship.id,
          userId,
        },
      });

      // Update sponsorship with Stripe session ID
      await storage.updateSponsorshipStatus(
        sponsorship.id,
        'pending',
        undefined,
        session.id
      );

      res.json({ sessionId: session.id, url: session.url });
    } catch (error: any) {
      console.error("Error creating sponsorship checkout:", error);
      res.status(500).json({ message: error.message || "Failed to create sponsorship checkout" });
    }
  });

  app.get('/api/sponsorships/my-sponsorships', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const sponsorships = await storage.getMySponsorships(userId);
      res.json(sponsorships);
    } catch (error) {
      console.error("Error fetching my sponsorships:", error);
      res.status(500).json({ message: "Failed to fetch sponsorships" });
    }
  });

  app.get('/api/sponsorships/active-tours', async (req, res) => {
    try {
      const tourIds = await storage.getActiveSponsoredTours();
      res.json(tourIds);
    } catch (error) {
      console.error('Error fetching active sponsored tours:', error);
      // Return empty array instead of 500 to prevent tourist dashboard breakage
      res.json([]);
    }
  });

  app.get('/api/sponsorships/active-services', async (req, res) => {
    try {
      const serviceIds = await storage.getActiveSponsoredServices();
      res.json(serviceIds);
    } catch (error) {
      console.error('Error fetching active sponsored services:', error);
      // Return empty array instead of 500 to prevent tourist dashboard breakage
      res.json([]);
    }
  });

  app.get('/api/sponsorships/:id', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const sponsorship = await storage.getSponsorshipById(req.params.id);
      
      if (!sponsorship) {
        return res.status(404).json({ message: "Sponsorship not found" });
      }
      
      // Ensure user owns this sponsorship
      if (sponsorship.userId !== userId) {
        return res.status(403).json({ message: "Unauthorized" });
      }
      
      res.json(sponsorship);
    } catch (error) {
      console.error("Error fetching sponsorship:", error);
      res.status(500).json({ message: "Failed to fetch sponsorship" });
    }
  });

  app.post('/api/sponsorships/activate/:id', isAuthenticated, async (req: any, res) => {
    try {
      if (!stripe) {
        return res.status(503).json({ message: "Stripe is not configured" });
      }

      const userId = req.user.claims.sub;
      const sponsorshipId = req.params.id;
      const { sessionId } = req.body;

      // SECURITY: Require session ID from Stripe
      if (!sessionId) {
        return res.status(400).json({ message: "Stripe session ID required" });
      }

      // SECURITY: Retrieve Stripe session to verify payment
      let session;
      try {
        session = await stripe.checkout.sessions.retrieve(sessionId);
      } catch (error) {
        console.error("Error retrieving Stripe session:", error);
        return res.status(400).json({ message: "Invalid Stripe session ID" });
      }

      // SECURITY: Verify payment was completed
      if (session.payment_status !== 'paid') {
        return res.status(400).json({ message: "Payment not completed" });
      }

      // SECURITY: Verify sponsorship ID matches metadata
      if (session.metadata?.sponsorshipId !== sponsorshipId) {
        return res.status(400).json({ message: "Invalid sponsorship ID" });
      }

      // SECURITY: Verify user ID matches metadata
      if (session.metadata?.userId !== userId) {
        return res.status(403).json({ message: "Unauthorized" });
      }

      // Get sponsorship to verify it exists and is pending
      const sponsorship = await storage.getSponsorshipById(sponsorshipId);

      if (!sponsorship) {
        return res.status(404).json({ message: "Sponsorship not found" });
      }

      if (sponsorship.userId !== userId) {
        return res.status(403).json({ message: "Unauthorized" });
      }

      if (sponsorship.status !== 'pending') {
        return res.status(400).json({ message: "Sponsorship already activated or cancelled" });
      }

      // Now safe to activate - payment verified
      const activatedSponsorship = await storage.activateSponsorship(sponsorshipId);
      
      res.json(activatedSponsorship);
    } catch (error: any) {
      console.error("Error activating sponsorship:", error);
      res.status(500).json({ message: error.message || "Failed to activate sponsorship" });
    }
  });

  // Stripe payment routes
  app.post("/api/create-payment-intent", isAuthenticated, async (req, res) => {
    try {
      if (!stripe) {
        return res.status(503).json({ message: "Payment processing is not configured" });
      }
      const { amount } = req.body;
      const paymentIntent = await stripe.paymentIntents.create({
        amount: Math.round(amount * 100), // Convert to cents
        currency: "usd",
      });
      res.json({ clientSecret: paymentIntent.client_secret });
    } catch (error: any) {
      res
        .status(500)
        .json({ message: "Error creating payment intent: " + error.message });
    }
  });

  // Object Storage routes for image uploads
  app.get("/objects/:objectPath(*)", isAuthenticated, async (req: any, res) => {
    const userId = req.user?.claims?.sub;
    const objectStorageService = new ObjectStorageService();
    try {
      const objectFile = await objectStorageService.getObjectEntityFile(req.path);
      const canAccess = await objectStorageService.canAccessObjectEntity({
        objectFile,
        userId: userId,
        requestedPermission: ObjectPermission.READ,
      });
      if (!canAccess) {
        return res.sendStatus(401);
      }
      objectStorageService.downloadObject(objectFile, res);
    } catch (error) {
      console.error("Error checking object access:", error);
      if (error instanceof ObjectNotFoundError) {
        return res.sendStatus(404);
      }
      return res.sendStatus(500);
    }
  });

  app.post("/api/objects/upload", isAuthenticated, async (req, res) => {
    const objectStorageService = new ObjectStorageService();
    const uploadURL = await objectStorageService.getObjectEntityUploadURL();
    res.json({ uploadURL });
  });

  app.put("/api/objects/set-acl", isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user?.claims?.sub;
      const { imageURL } = req.body;
      
      if (!imageURL) {
        return res.status(400).json({ error: "imageURL is required" });
      }

      const objectStorageService = new ObjectStorageService();
      const objectPath = await objectStorageService.trySetObjectEntityAclPolicy(
        imageURL,
        {
          owner: userId,
          visibility: "public",
        }
      );

      res.status(200).json({ objectPath });
    } catch (error) {
      console.error("Error setting ACL:", error);
      res.status(500).json({ error: "Internal server error" });
    }
  });

  const httpServer = createServer(app);
  return httpServer;
}
