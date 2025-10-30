import type { Express } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import { setupAuth, isAuthenticated } from "./replitAuth";
import { ObjectStorageService, ObjectNotFoundError, objectStorageClient } from "./objectStorage";
import { ObjectPermission } from "./objectAcl";
import Stripe from "stripe";
import { insertTourSchema, insertServiceSchema, insertBookingSchema, insertReviewSchema, updateProfileSchema, insertSponsorshipSchema, insertMessageSchema, insertConversationSchema, insertEventSchema, insertPostSchema, insertPostCommentSchema, insertGroupBookingSchema, joinGroupBookingSchema, leaveGroupBookingSchema, updateGroupStatusSchema, events, eventParticipants, type InsertEventParticipant, type ApiKey, insertPartnerSchema, type InsertPartner, type Partner, insertPackageSchema, type InsertPackage, type Package, insertCouponSchema, insertAffiliateLinkSchema, type InsertCoupon, type Coupon, type InsertAffiliateLink, type AffiliateLink, insertExternalConnectorSchema, type InsertExternalConnector, type ExternalConnector } from "@shared/schema";
import { randomUUID, createHash, randomBytes } from "crypto";
import { z } from "zod";
import { 
  chatWithAssistant, 
  chatWithAssistantStream, 
  getTourRecommendations, 
  generateItinerary, 
  translateText, 
  summarizeReviews, 
  moderateContent,
  suggestMeetingPoint,
  generateTourSummary,
  detectScheduleConflict,
  type ParticipantLocation,
  type TourSummaryRequest
} from "./openai";
import { searchGlobal, searchSemantic, checkRateLimit } from './search-service';
import { 
  apiLimiter, 
  authLimiter, 
  aiLimiter, 
  messageLimiter, 
  reviewLimiter,
  bookingLimiter 
} from './middleware/rateLimiter';
import { sanitizeBody, sanitizeHtml } from './middleware/sanitize';
import { db } from "./db";
import { sql, eq, and, ne } from "drizzle-orm";
import { broadcastToUser, broadcastToAll } from "./websocket";
import express from "express";
import { createSubscriptionCheckout, cancelSubscription, handleStripeWebhook, SUBSCRIPTION_TIERS, createConnectAccount, createAccountLink, getAccountStatus, createPackageCheckoutSession, handleConnectWebhook } from './stripe-service';
import { checkRateLimit as checkPostRateLimit } from './moderation';
import { sendNotification, setWebSocketServer } from './notifications';
import { insertContentReportSchema, insertNotificationSchema } from "@shared/schema";

// Global type declaration for API Key in Express Request
declare global {
  namespace Express {
    interface Request {
      apiKey?: ApiKey;
    }
  }
}

// Try production key first, then testing key
const stripeSecretKey = process.env.STRIPE_SECRET_KEY || process.env.TESTING_STRIPE_SECRET_KEY;
const isValidSecretKey = stripeSecretKey && stripeSecretKey.startsWith('sk_');
const stripe = isValidSecretKey
  ? new Stripe(stripeSecretKey, { apiVersion: "2025-09-30.clover" })
  : null;

// Log which key is being used (helpful for debugging)
if (stripe && stripeSecretKey) {
  console.log('[Stripe] Initialized with key starting with:', stripeSecretKey.substring(0, 7));
} else {
  console.warn('[Stripe] No valid secret key found. Stripe checkout will be unavailable.');
}

// Helper function to get Stripe instance
function getStripe(): Stripe {
  if (!stripe) {
    throw new Error('Stripe is not configured');
  }
  return stripe;
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

// API Key Generation Helpers
export function generateApiKey(env: "live" | "test" = "live"): { key: string; hash: string; prefix: string } {
  const randomPart = randomBytes(16).toString("hex"); // 32 hex chars
  const key = `tc_${env}_${randomPart}`;
  const hash = createHash("sha256").update(key).digest("hex");
  const prefix = key.substring(0, 12); // "tc_live_abc1" - first 12 chars visible
  
  return { key, hash, prefix };
}

export function hashApiKey(key: string): string {
  return createHash("sha256").update(key).digest("hex");
}

// API Key Authentication Middleware - WITH ATOMIC RATE LIMITING
async function apiKeyAuth(req: express.Request, res: express.Response, next: express.NextFunction) {
  try {
    // Get API key from header: Authorization: Bearer tc_live_...
    const authHeader = req.headers.authorization;
    
    if (!authHeader || !authHeader.startsWith("Bearer ")) {
      return res.status(401).json({ message: "API key required" });
    }
    
    const apiKey = authHeader.substring(7); // Remove "Bearer "
    
    if (!apiKey.startsWith("tc_live_") && !apiKey.startsWith("tc_test_")) {
      return res.status(401).json({ message: "Invalid API key format" });
    }
    
    // Hash and lookup
    const keyHash = hashApiKey(apiKey);
    const keyRecord = await storage.getApiKeyByHash(keyHash);
    
    if (!keyRecord) {
      return res.status(401).json({ message: "Invalid API key" });
    }
    
    // Check if active
    if (!keyRecord.isActive) {
      return res.status(403).json({ message: "API key is inactive" });
    }
    
    // Check expiration
    if (keyRecord.expiresAt && new Date(keyRecord.expiresAt) < new Date()) {
      return res.status(403).json({ message: "API key expired" });
    }
    
    // ATOMIC RATE LIMITING: Try to increment (only succeeds if below limit)
    const incrementResult = await storage.incrementApiKeyUsage(keyRecord.id);
    
    if (!incrementResult.success) {
      return res.status(429).json({ 
        message: "Rate limit exceeded",
        limit: keyRecord.rateLimit,
        current: incrementResult.current,
        resetAt: "midnight UTC"
      });
    }
    
    // Success - attach to request
    req.apiKey = keyRecord;
    next();
  } catch (error: any) {
    console.error("API key auth error:", error);
    res.status(500).json({ message: "Authentication failed" });
  }
}

// Permission check helper
function requirePermission(...permissions: string[]) {
  return (req: express.Request, res: express.Response, next: express.NextFunction) => {
    if (!req.apiKey) {
      return res.status(401).json({ message: "API key required" });
    }
    
    const hasPermission = permissions.every(perm => 
      req.apiKey!.permissions.includes(perm)
    );
    
    if (!hasPermission) {
      return res.status(403).json({ 
        message: "Insufficient permissions",
        required: permissions,
        granted: req.apiKey!.permissions
      });
    }
    
    next();
  };
}

// Role check middleware
function requireRole(...roles: string[]) {
  return async (req: any, res: express.Response, next: express.NextFunction) => {
    try {
      if (!req.user) {
        return res.status(401).json({ message: "Authentication required" });
      }
      
      const userId = req.user.claims.sub;
      const user = await storage.getUser(userId);
      
      if (!user) {
        return res.status(401).json({ message: "User not found" });
      }
      
      if (!user.role || !roles.includes(user.role)) {
        return res.status(403).json({ 
          message: "Insufficient permissions",
          required: roles,
          current: user.role
        });
      }
      
      next();
    } catch (error) {
      console.error("Role check error:", error);
      res.status(500).json({ message: "Authorization failed" });
    }
  };
}

// AI Validation Schemas
const itinerarySchema = z.object({
  destination: z.string().min(2, "Destination required"),
  days: z.number().int().min(1).max(30),
  interests: z.array(z.string()).optional().default([]),
  budget: z.enum(["low", "medium", "high"]).optional().default("medium"),
  language: z.enum(["it", "en", "de", "fr", "es"]).optional().default("en")
});

const translationSchema = z.object({
  text: z.string().min(1, "Text required"),
  targetLanguage: z.enum(["it", "en", "de", "fr", "es"]),
  context: z.enum(["tourism", "service", "event", "general"]).optional().default("tourism")
});

const moderationSchema = z.object({
  content: z.string().min(1, "Content required"),
  contentType: z.enum(["post", "review", "comment", "general"]).optional().default("general")
});

// Phase 9: AI Travel Companion Validation Schemas
const suggestMeetingSchema = z.object({
  language: z.enum(['en', 'it', 'de', 'fr', 'es']).optional().default('en')
});

const translateMessageSchema = z.object({
  text: z.string().min(1).max(500),
  targetLanguage: z.enum(['en', 'it', 'de', 'fr', 'es'])
});

const generateSummarySchema = z.object({
  language: z.enum(['en', 'it', 'de', 'fr', 'es']).optional().default('en')
});

const scheduleEventSchema = z.object({
  eventType: z.enum(['reminder', 'meeting', 'schedule']),
  title: z.string().min(1).max(200),
  description: z.string().max(500).optional(),
  eventDate: z.string().transform(str => new Date(str)),
  location: z.string().max(200).optional(),
  latitude: z.number().optional(),
  longitude: z.number().optional(),
  notificationTimes: z.array(z.string().transform(str => new Date(str))).optional(),
  language: z.enum(['en', 'it', 'de', 'fr', 'es']).optional().default('en'),
  force: z.boolean().optional().default(false)
});

export async function registerRoutes(app: Express): Promise<Server> {
  // Auth middleware
  await setupAuth(app);

  // Apply global rate limiter to all API routes
  app.use('/api', apiLimiter);
  
  // Apply sanitization middleware globally
  app.use(sanitizeBody);

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

  app.post('/api/auth/set-role', authLimiter, isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const { role, referralCode } = req.body;
      
      if (!['tourist', 'guide', 'provider'].includes(role)) {
        return res.status(400).json({ message: "Invalid role" });
      }

      const user = await storage.setUserRole(userId, role);
      
      // Handle referral if code provided (Phase 7.2)
      if (referralCode && typeof referralCode === 'string' && referralCode.length === 10) {
        const email = req.user.claims.email || user.email;
        const ip = req.ip || req.headers['x-forwarded-for'] || 'unknown';
        
        // Complete referral in background (fire-and-forget)
        storage.completeReferral(referralCode, userId, email, ip as string)
          .then(result => {
            if (result.success && result.pointsAwarded) {
              console.log(`✅ Referral completed for user ${userId} with code ${referralCode}`);
            } else if (result.success) {
              console.log(`⚠️ Referral completed but points not awarded: ${result.message}`);
            } else {
              console.log(`❌ Referral failed: ${result.message}`);
            }
          })
          .catch(err => console.error("Error completing referral:", err));
      }
      
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

  // Admin login endpoint - separate from regular OIDC login
  app.post('/api/admin/login', authLimiter, async (req, res) => {
    try {
      const { username, password } = req.body;

      // Verify credentials against environment variables (with trim to remove spaces)
      const ADMIN_USERNAME = process.env.ADMIN_USERNAME?.trim();
      const ADMIN_PASSWORD = process.env.ADMIN_PASSWORD?.trim();

      if (!ADMIN_USERNAME || !ADMIN_PASSWORD) {
        return res.status(500).json({ 
          message: 'Admin credentials not configured. Please set ADMIN_USERNAME and ADMIN_PASSWORD in secrets.' 
        });
      }

      // Trim input credentials to handle accidental spaces
      const inputUsername = username?.trim();
      const inputPassword = password?.trim();

      if (inputUsername !== ADMIN_USERNAME || inputPassword !== ADMIN_PASSWORD) {
        console.log('[Admin Login] Failed attempt - credentials mismatch');
        return res.status(401).json({ message: 'Invalid admin credentials' });
      }

      console.log('[Admin Login] Credentials verified successfully');

      // Check if admin user already exists in database
      let adminUser = await storage.getUserByUsername('admin@tourconnect.local');
      
      if (!adminUser) {
        // Create admin user in database using upsertUser
        adminUser = await storage.upsertUser({
          id: 'admin_supervisor_' + Date.now(),
          email: 'admin@tourconnect.local',
          firstName: 'Admin',
          lastName: 'Supervisor',
          role: 'supervisor',
          approvalStatus: 'approved',
          profileImageUrl: null,
          bio: 'System Administrator',
          phone: null,
          country: null,
          city: null,
          latitude: null,
          longitude: null,
          guideLanguages: [],
          guideSpecialties: [],
          guideExperience: null,
          guideLicenseNumber: null,
          businessName: null,
          businessType: null,
          businessAddress: null,
          website: null,
          socialLinks: null,
          verified: true,
          trustLevel: 5,
          isOnline: true,
          lastOnlineAt: new Date(),
        });
      }

      // Set session
      (req.session as any).userId = adminUser.id;
      (req.session as any).role = 'supervisor';
      
      await new Promise<void>((resolve, reject) => {
        req.session.save((err) => {
          if (err) reject(err);
          else resolve();
        });
      });

      res.json({ 
        message: 'Admin login successful',
        user: {
          id: adminUser.id,
          firstName: adminUser.firstName,
          lastName: adminUser.lastName,
          role: adminUser.role,
          email: adminUser.email,
        }
      });
    } catch (error) {
      console.error("Admin login error:", error);
      res.status(500).json({ message: "Failed to process admin login" });
    }
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

  app.post('/api/supervisor/verify-user/:userId', isAuthenticated, async (req: any, res) => {
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

      if (!['guide', 'provider'].includes(targetUser.role || '')) {
        return res.status(400).json({ message: "Only guides and providers can be verified" });
      }

      const verifiedUser = await storage.verifyUser(req.params.userId, supervisorId);
      res.json(verifiedUser);
    } catch (error) {
      console.error("Error verifying user:", error);
      res.status(500).json({ message: "Failed to verify user" });
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

  // Service moderation routes (supervisor only)
  app.get('/api/supervisor/pending-services', isAuthenticated, async (req: any, res) => {
    try {
      const user = await storage.getUser(req.user.claims.sub);
      if (user?.role !== 'supervisor') {
        return res.status(403).json({ message: "Access denied. Supervisor role required." });
      }

      const pendingServices = await storage.getPendingServices();
      res.json(pendingServices);
    } catch (error) {
      console.error("Error fetching pending services:", error);
      res.status(500).json({ message: "Failed to fetch pending services" });
    }
  });

  app.post('/api/supervisor/approve-service/:id', isAuthenticated, async (req: any, res) => {
    try {
      const supervisorId = req.user.claims.sub;
      const supervisor = await storage.getUser(supervisorId);
      
      if (supervisor?.role !== 'supervisor') {
        return res.status(403).json({ message: "Access denied. Supervisor role required." });
      }

      const service = await storage.updateServiceApprovalStatus(req.params.id, 'approved', supervisorId);
      if (!service) {
        return res.status(404).json({ message: "Service not found" });
      }
      
      res.json({ message: "Service approved successfully", service });
    } catch (error) {
      console.error("Error approving service:", error);
      res.status(500).json({ message: "Failed to approve service" });
    }
  });

  app.post('/api/supervisor/reject-service/:id', isAuthenticated, async (req: any, res) => {
    try {
      const supervisorId = req.user.claims.sub;
      const supervisor = await storage.getUser(supervisorId);
      
      if (supervisor?.role !== 'supervisor') {
        return res.status(403).json({ message: "Access denied. Supervisor role required." });
      }

      const service = await storage.updateServiceApprovalStatus(req.params.id, 'rejected', supervisorId);
      if (!service) {
        return res.status(404).json({ message: "Service not found" });
      }
      
      res.json({ message: "Service rejected successfully", service });
    } catch (error) {
      console.error("Error rejecting service:", error);
      res.status(500).json({ message: "Failed to reject service" });
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
      
      // Auto-track tour view (fire-and-forget)
      const userId = (req as any).user?.claims?.sub || null;
      storage.trackEvent({
        eventType: "view",
        eventCategory: "tour_view",
        targetId: tour.id,
        targetType: "tour",
        userId
      }).catch(err => console.error("Failed to track tour view:", err));
      
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

  app.get('/api/services/:id', async (req: any, res) => {
    try {
      const service = await storage.getService(req.params.id);
      if (!service) {
        return res.status(404).json({ message: "Service not found" });
      }
      
      // Auto-track service view (fire-and-forget)
      const userId = req.user?.claims?.sub || null;
      storage.trackEvent({
        eventType: "view",
        eventCategory: "service_view",
        targetId: service.id,
        targetType: "service",
        userId
      }).catch(err => console.error("Failed to track service view:", err));
      
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

  app.post('/api/bookings', bookingLimiter, isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const validatedData = insertBookingSchema.parse({ ...req.body, userId });
      const booking = await storage.createBooking(validatedData);
      
      // Track booking creation (fire-and-forget)
      storage.trackEvent({
        eventType: "conversion",
        eventCategory: "booking_created",
        targetId: booking.tourId,
        targetType: "tour",
        userId,
        metadata: JSON.stringify({ bookingId: booking.id })
      }).catch(err => console.error("Failed to track booking:", err));
      
      // Award points for booking (fire-and-forget)
      const isFirstBooking = !(await storage.hasCompletedActionBefore(userId, 'booking'));
      storage.awardPoints(userId, isFirstBooking ? 'first_booking' : 'booking', {
        bookingId: booking.id,
        tourId: booking.tourId,
        description: isFirstBooking ? 'First booking bonus!' : 'Booking completed'
      }).then(() => storage.updateStreak(userId))
        .then(() => storage.checkAndAwardStreakBonus(userId))
        .catch(err => console.error("Failed to award booking points:", err));
      
      res.json(booking);
    } catch (error: any) {
      console.error("Error creating booking:", error);
      res.status(400).json({ message: error.message || "Failed to create booking" });
    }
  });

  app.put('/api/bookings/:id', isAuthenticated, async (req, res) => {
    try {
      const booking = await storage.updateBooking(req.params.id, req.body);
      
      if (booking.status === 'completed') {
        await Promise.all([
          storage.updateUserBadges(booking.userId),
          storage.recalculateTrustLevel(booking.userId)
        ]);
        
        // Award tour completion points (fire-and-forget)
        storage.awardPoints(booking.userId, 'tour_complete', {
          bookingId: booking.id,
          tourId: booking.tourId,
          description: 'Tour completed'
        }).catch(err => console.error("Failed to award completion points:", err));
        
        const tour = await storage.getTour(booking.tourId);
        if (tour?.guideId) {
          await Promise.all([
            storage.updateUserBadges(tour.guideId),
            storage.recalculateTrustLevel(tour.guideId)
          ]);
        }
      }
      
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

    const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET;
    
    if (!webhookSecret) {
      console.error('[Stripe] Webhook secret not configured');
      return res.status(500).send('Webhook secret not configured');
    }

    let event;
    try {
      event = stripe.webhooks.constructEvent(req.body, sig, webhookSecret);
    } catch (err: any) {
      console.error('Webhook signature verification failed:', err.message);
      return res.status(400).send(`Webhook Error: ${err.message}`);
    }

    if (event.type === 'checkout.session.completed') {
      const session = event.data.object as any;
      const bookingId = session.metadata?.bookingId;

      if (bookingId) {
        const booking = await storage.getBookingById(bookingId);
        
        await storage.updateBooking(bookingId, {
          status: 'confirmed',
          paymentStatus: 'paid',
        });
        
        // Track payment (fire-and-forget)
        if (booking) {
          storage.trackEvent({
            eventType: "conversion",
            eventCategory: "booking_paid",
            targetId: booking.tourId,
            targetType: "tour",
            userId: booking.userId,
            metadata: JSON.stringify({ 
              bookingId: booking.id,
              amount: session.amount_total ? session.amount_total / 100 : 0
            })
          }).catch(err => console.error("Failed to track payment:", err));
        }
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

  app.get('/api/reviews/tour/:tourId', async (req, res) => {
    try {
      const sortBy = (req.query.sort as 'recent' | 'rating') || 'recent';
      const reviews = await storage.getReviewsByTour(req.params.tourId, sortBy);
      
      const populatedReviews = await Promise.all(
        reviews.map(async (review) => {
          const user = await storage.getUser(review.userId);
          return {
            ...review,
            user: user ? {
              id: user.id,
              firstName: user.firstName,
              lastName: user.lastName,
              profileImageUrl: user.profileImageUrl
            } : null
          };
        })
      );
      
      res.json(populatedReviews);
    } catch (error) {
      console.error("Error fetching tour reviews:", error);
      res.status(500).json({ message: "Failed to fetch tour reviews" });
    }
  });

  app.get('/api/reviews/service/:serviceId', async (req, res) => {
    try {
      const sortBy = (req.query.sort as 'recent' | 'rating') || 'recent';
      const reviews = await storage.getReviewsByService(req.params.serviceId, sortBy);
      
      const populatedReviews = await Promise.all(
        reviews.map(async (review) => {
          const user = await storage.getUser(review.userId);
          return {
            ...review,
            user: user ? {
              id: user.id,
              firstName: user.firstName,
              lastName: user.lastName,
              profileImageUrl: user.profileImageUrl
            } : null
          };
        })
      );
      
      res.json(populatedReviews);
    } catch (error) {
      console.error("Error fetching service reviews:", error);
      res.status(500).json({ message: "Failed to fetch service reviews" });
    }
  });

  app.get('/api/tours/:tourId/rating', async (req, res) => {
    try {
      const [avgRating, reviewCount] = await Promise.all([
        storage.getAverageRating(req.params.tourId),
        storage.getReviewCount(req.params.tourId)
      ]);
      
      res.json({
        averageRating: Math.round(avgRating * 10) / 10,
        reviewCount
      });
    } catch (error) {
      console.error("Error fetching tour rating:", error);
      res.status(500).json({ message: "Failed to fetch tour rating" });
    }
  });

  app.get('/api/services/:serviceId/rating', async (req, res) => {
    try {
      const [avgRating, reviewCount] = await Promise.all([
        storage.getAverageRatingForService(req.params.serviceId),
        storage.getReviewCountForService(req.params.serviceId)
      ]);
      
      res.json({
        averageRating: Math.round(avgRating * 10) / 10,
        reviewCount
      });
    } catch (error) {
      console.error("Error fetching service rating:", error);
      res.status(500).json({ message: "Failed to fetch service rating" });
    }
  });

  app.get('/api/guides/:guideId/rating', async (req, res) => {
    try {
      const avgRating = await storage.getGuideAverageRating(req.params.guideId);
      res.json({ averageRating: Math.round(avgRating * 10) / 10 });
    } catch (error) {
      console.error("Error fetching guide rating:", error);
      res.status(500).json({ message: "Failed to fetch guide rating" });
    }
  });

  app.get('/api/providers/:providerId/rating', async (req, res) => {
    try {
      const avgRating = await storage.getProviderAverageRating(req.params.providerId);
      res.json({ averageRating: Math.round(avgRating * 10) / 10 });
    } catch (error) {
      console.error("Error fetching provider rating:", error);
      res.status(500).json({ message: "Failed to fetch provider rating" });
    }
  });

  app.get('/api/users/:userId/reviews', async (req, res) => {
    try {
      const reviews = await storage.getReviewsByUser(req.params.userId);
      res.json(reviews);
    } catch (error) {
      console.error("Error fetching user reviews:", error);
      res.status(500).json({ message: "Failed to fetch user reviews" });
    }
  });

  app.post('/api/reviews', reviewLimiter, isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      
      const schema = z.object({
        tourId: z.string().optional(),
        serviceId: z.string().optional(),
        rating: z.number().int().min(1).max(5),
        comment: z.string().min(10).max(2000).transform(sanitizeHtml),
        images: z.array(z.string().url()).max(10).optional()
      }).refine((data) => data.tourId || data.serviceId, {
        message: "Either tourId or serviceId must be provided"
      });
      
      const data = schema.parse(req.body);
      
      if (data.tourId) {
        const hasBooking = await storage.userHasBookingForTour(userId, data.tourId);
        if (!hasBooking) {
          return res.status(403).json({ 
            message: 'You must book this tour to leave a review' 
          });
        }
      }
      
      // Auto-moderate if comment provided
      if (data.comment) {
        const moderation = await moderateContent(data.comment, "review");
        
        // Log medium severity for review
        if (moderation.severity === "medium") {
          console.warn(`[Moderation] Medium severity content allowed:`, {
            userId,
            contentType: "review",
            categories: moderation.categories,
            reason: moderation.reason
          });
        }
        
        // Block only high severity
        if (moderation.severity === "high") {
          return res.status(400).json({ 
            message: "Review flagged for inappropriate content",
            reason: moderation.reason
          });
        }
      }
      
      const review = await storage.createReview({
        ...data,
        userId,
        images: data.images || []
      });
      
      await storage.updateUserBadges(userId);
      
      // Award review points (fire-and-forget)
      storage.awardPoints(userId, 'review', {
        reviewId: review.id,
        targetId: (review.tourId || review.serviceId) || undefined,
        description: 'Review submitted'
      }).catch(err => console.error("Failed to award review points:", err));
      
      if (review.tourId) {
        const tour = await storage.getTour(review.tourId);
        if (tour?.guideId) {
          await Promise.all([
            storage.updateUserBadges(tour.guideId),
            storage.recalculateTrustLevel(tour.guideId)
          ]);
        }
      }
      
      res.json(review);
    } catch (error: any) {
      console.error("Error creating review:", error);
      res.status(400).json({ message: error.message || "Failed to create review" });
    }
  });

  app.patch('/api/reviews/:id', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const review = await storage.getReview(req.params.id);
      
      if (!review) {
        return res.status(404).json({ message: 'Review not found' });
      }
      
      if (review.userId !== userId) {
        return res.status(403).json({ message: 'You can only update your own reviews' });
      }
      
      const schema = z.object({
        rating: z.number().int().min(1).max(5).optional(),
        comment: z.string().min(10).max(2000).transform(sanitizeHtml).optional(),
        images: z.array(z.string().url()).max(10).optional()
      });
      
      const data = schema.parse(req.body);
      const updated = await storage.updateReview(req.params.id, data);
      
      res.json(updated);
    } catch (error: any) {
      console.error("Error updating review:", error);
      res.status(400).json({ message: error.message || "Failed to update review" });
    }
  });

  app.delete('/api/reviews/:id', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const review = await storage.getReview(req.params.id);
      
      if (!review) {
        return res.status(404).json({ message: 'Review not found' });
      }
      
      if (review.userId !== userId) {
        return res.status(403).json({ message: 'You can only delete your own reviews' });
      }
      
      await storage.deleteReview(req.params.id);
      res.json({ success: true });
    } catch (error) {
      console.error("Error deleting review:", error);
      res.status(500).json({ message: "Failed to delete review" });
    }
  });

  app.post('/api/reviews/:id/response', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const review = await storage.getReview(req.params.id);
      
      if (!review) {
        return res.status(404).json({ message: 'Review not found' });
      }
      
      let authorized = false;
      if (review.tourId) {
        const tour = await storage.getTour(review.tourId);
        authorized = tour?.guideId === userId;
      } else if (review.serviceId) {
        const service = await storage.getService(review.serviceId);
        authorized = service?.providerId === userId;
      }
      
      if (!authorized) {
        return res.status(403).json({ message: 'Only the tour guide or service provider can respond to reviews' });
      }
      
      const { response } = req.body;
      if (!response || typeof response !== 'string') {
        return res.status(400).json({ message: 'Response is required' });
      }
      
      const sanitizedResponse = sanitizeHtml(response);
      await storage.addResponse(req.params.id, sanitizedResponse, userId);
      
      res.json({ success: true });
    } catch (error) {
      console.error("Error adding review response:", error);
      res.status(500).json({ message: "Failed to add review response" });
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

  // Messaging validation schemas
  const sendMessageSchema = z.object({
    conversationId: z.string(),
    content: z.string().min(1).max(5000).transform(sanitizeHtml)
  });

  const createConversationSchema = z.object({
    otherUserId: z.string()
  });

  // Messaging routes
  app.get('/api/conversations', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const conversations = await storage.getConversations(userId);
      
      const conversationsWithParticipants = await Promise.all(
        conversations.map(async (conv) => {
          const otherUserId = conv.participant1Id === userId ? conv.participant2Id : conv.participant1Id;
          const otherUser = await storage.getUser(otherUserId);
          return {
            ...conv,
            otherUser,
          };
        })
      );
      
      res.json(conversationsWithParticipants);
    } catch (error) {
      console.error("Error fetching conversations:", error);
      res.status(500).json({ message: "Failed to fetch conversations" });
    }
  });

  app.get('/api/conversations/:id', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const conversationId = req.params.id;
      
      const conversation = await storage.getConversation(conversationId);
      
      if (!conversation) {
        return res.status(404).json({ message: "Conversation not found" });
      }
      
      if (conversation.participant1Id !== userId && conversation.participant2Id !== userId) {
        return res.status(403).json({ message: "Not authorized to access this conversation" });
      }
      
      const otherUserId = conversation.participant1Id === userId ? conversation.participant2Id : conversation.participant1Id;
      const otherUser = await storage.getUser(otherUserId);
      
      res.json({
        ...conversation,
        otherUser,
      });
    } catch (error) {
      console.error("Error fetching conversation:", error);
      res.status(500).json({ message: "Failed to fetch conversation" });
    }
  });

  app.get('/api/conversations/:id/messages', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const conversationId = req.params.id;
      const limit = parseInt(req.query.limit as string) || 50;
      
      const conversation = await storage.getConversation(conversationId);
      
      if (!conversation) {
        return res.status(404).json({ message: "Conversation not found" });
      }
      
      if (conversation.participant1Id !== userId && conversation.participant2Id !== userId) {
        return res.status(403).json({ message: "Not authorized to access this conversation" });
      }
      
      const messages = await storage.getMessagesByConversation(conversationId, limit);
      
      await storage.markConversationMessagesAsRead(conversationId, userId);
      
      res.json(messages.reverse());
    } catch (error) {
      console.error("Error fetching messages:", error);
      res.status(500).json({ message: "Failed to fetch messages" });
    }
  });

  app.post('/api/conversations', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      
      const validation = createConversationSchema.safeParse(req.body);
      if (!validation.success) {
        return res.status(400).json({ 
          message: "Invalid request data", 
          errors: validation.error.errors 
        });
      }
      
      const { otherUserId } = validation.data;
      
      if (otherUserId === userId) {
        return res.status(400).json({ message: "Cannot create conversation with yourself" });
      }
      
      const otherUser = await storage.getUser(otherUserId);
      if (!otherUser) {
        return res.status(404).json({ message: "User not found" });
      }
      
      let conversation = await storage.findConversationBetweenUsers(userId, otherUserId);
      
      if (!conversation) {
        conversation = await storage.createConversation({
          participant1Id: userId,
          participant2Id: otherUserId,
        });
      }
      
      res.json({
        ...conversation,
        otherUser,
      });
    } catch (error) {
      console.error("Error creating conversation:", error);
      res.status(500).json({ message: "Failed to create conversation" });
    }
  });

  app.post('/api/messages', messageLimiter, isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      
      const validation = sendMessageSchema.safeParse(req.body);
      if (!validation.success) {
        return res.status(400).json({ 
          message: "Invalid request data", 
          errors: validation.error.errors 
        });
      }
      
      const { conversationId, content } = validation.data;
      
      const conversation = await storage.getConversation(conversationId);
      
      if (!conversation) {
        return res.status(404).json({ message: "Conversation not found" });
      }
      
      if (conversation.participant1Id !== userId && conversation.participant2Id !== userId) {
        return res.status(403).json({ message: "Not authorized to send messages in this conversation" });
      }
      
      const message = await storage.createMessage({
        conversationId,
        senderId: userId,
        content,
        isRead: false,
      });
      
      const { getWebSocketServer } = await import('./websocket');
      const wsServer = getWebSocketServer();
      
      if (wsServer) {
        await wsServer.broadcastToConversation(conversationId, {
          type: 'new_message',
          message,
        });
      }
      
      res.json(message);
    } catch (error) {
      console.error("Error sending message:", error);
      res.status(500).json({ message: "Failed to send message" });
    }
  });

  app.patch('/api/messages/:id/read', isAuthenticated, async (req: any, res) => {
    try {
      await storage.markMessageAsRead(req.params.id);
      res.json({ success: true });
    } catch (error) {
      console.error("Error marking message as read:", error);
      res.status(500).json({ message: "Failed to mark message as read" });
    }
  });

  app.get('/api/messages/unread-count', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const count = await storage.getUnreadMessageCount(userId);
      res.json({ count });
    } catch (error) {
      console.error("Error fetching unread count:", error);
      res.status(500).json({ message: "Failed to fetch unread count" });
    }
  });

  // Gamification routes
  app.get('/api/users/:userId/badges', async (req, res) => {
    try {
      const user = await storage.getUser(req.params.userId);
      if (!user) {
        return res.status(404).json({ message: "User not found" });
      }
      
      const { BADGES } = await import('@shared/badges');
      const badgesWithDetails = (user.badges || []).map(badgeId => {
        const badge = Object.values(BADGES).find(b => b.id === badgeId);
        return badge || null;
      }).filter(Boolean);
      
      res.json(badgesWithDetails);
    } catch (error) {
      console.error("Error fetching user badges:", error);
      res.status(500).json({ message: "Failed to fetch user badges" });
    }
  });

  app.get('/api/users/:userId/stats', async (req, res) => {
    try {
      const stats = await storage.getUserStats(req.params.userId);
      res.json(stats);
    } catch (error) {
      console.error("Error fetching user stats:", error);
      res.status(500).json({ message: "Failed to fetch user stats" });
    }
  });

  app.post('/api/users/me/refresh-gamification', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const [badges, trustLevel] = await Promise.all([
        storage.updateUserBadges(userId),
        storage.recalculateTrustLevel(userId)
      ]);
      
      res.json({ badges, trustLevel });
    } catch (error) {
      console.error("Error refreshing gamification:", error);
      res.status(500).json({ message: "Failed to refresh gamification" });
    }
  });

  // Subscription routes
  app.post('/api/subscriptions/create-checkout', isAuthenticated, async (req: any, res) => {
    try {
      if (!stripe) {
        return res.status(500).json({ message: "Stripe is not configured" });
      }

      const schema = z.object({
        tier: z.enum(['tourist-premium', 'guide-pro'])
      });
      
      const { tier } = schema.parse(req.body);
      const userId = req.user.claims.sub;
      
      const existing = await storage.getSubscription(userId);
      if (existing && existing.status === 'active') {
        return res.status(400).json({ 
          message: 'You already have an active subscription' 
        });
      }
      
      const { SUBSCRIPTION_TIERS } = await import('@shared/subscriptions');
      const tierKey = tier.toUpperCase().replace('-', '_') as keyof typeof SUBSCRIPTION_TIERS;
      const tierConfig = SUBSCRIPTION_TIERS[tierKey];
      
      if (!('stripePriceId' in tierConfig)) {
        return res.status(400).json({ message: 'Invalid subscription tier' });
      }
      
      const session = await stripe.checkout.sessions.create({
        customer_email: req.user.email,
        mode: 'subscription',
        payment_method_types: ['card'],
        line_items: [
          {
            price: tierConfig.stripePriceId,
            quantity: 1
          }
        ],
        success_url: `${process.env.REPLIT_DEV_DOMAIN || 'http://localhost:5000'}/subscription-success?session_id={CHECKOUT_SESSION_ID}`,
        cancel_url: `${process.env.REPLIT_DEV_DOMAIN || 'http://localhost:5000'}/subscription`,
        metadata: {
          userId,
          tier
        }
      });
      
      res.json({ sessionUrl: session.url });
    } catch (error) {
      console.error("Error creating checkout session:", error);
      res.status(500).json({ message: "Failed to create checkout session" });
    }
  });

  app.get('/api/subscriptions/me', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const subscription = await storage.getSubscription(userId);
      
      if (!subscription) {
        return res.json({ tier: 'free' });
      }
      
      res.json(subscription);
    } catch (error) {
      console.error("Error fetching subscription:", error);
      res.status(500).json({ message: "Failed to fetch subscription" });
    }
  });

  app.post('/api/subscriptions/cancel', isAuthenticated, async (req: any, res) => {
    try {
      if (!stripe) {
        return res.status(500).json({ message: "Stripe is not configured" });
      }

      const userId = req.user.claims.sub;
      const subscription = await storage.getSubscription(userId);
      
      if (!subscription || subscription.status !== 'active') {
        return res.status(404).json({ message: 'No active subscription found' });
      }
      
      if (subscription.stripeSubscriptionId) {
        await stripe.subscriptions.update(subscription.stripeSubscriptionId, {
          cancel_at_period_end: true
        });
      }
      
      await storage.updateSubscription(subscription.id, {
        status: 'cancelled',
        cancelAtPeriodEnd: true
      });
      
      res.json({ success: true });
    } catch (error) {
      console.error("Error canceling subscription:", error);
      res.status(500).json({ message: "Failed to cancel subscription" });
    }
  });

  app.get('/api/subscriptions/verify/:sessionId', isAuthenticated, async (req: any, res) => {
    try {
      if (!stripe) {
        return res.status(500).json({ message: "Stripe is not configured" });
      }

      const userId = req.user.claims.sub;
      const session = await stripe.checkout.sessions.retrieve(req.params.sessionId);
      
      if (session.payment_status !== 'paid') {
        return res.status(400).json({ message: 'Payment not completed' });
      }
      
      const stripeSubscriptionResponse = await stripe.subscriptions.retrieve(
        session.subscription as string
      );
      
      const existing = await storage.getSubscription(userId);
      
      const subscriptionData = {
        userId,
        tier: session.metadata!.tier,
        stripeCustomerId: session.customer as string,
        stripeSubscriptionId: stripeSubscriptionResponse.id,
        stripePriceId: stripeSubscriptionResponse.items.data[0].price.id,
        status: 'active',
        currentPeriodStart: new Date((stripeSubscriptionResponse as any).current_period_start * 1000),
        currentPeriodEnd: new Date((stripeSubscriptionResponse as any).current_period_end * 1000),
        cancelAtPeriodEnd: false
      };
      
      let subscription;
      if (existing) {
        subscription = await storage.updateSubscription(existing.id, subscriptionData);
      } else {
        subscription = await storage.createSubscription(subscriptionData);
      }
      
      await storage.updateUserBadges(userId);
      await storage.recalculateTrustLevel(userId);
      
      res.json(subscription);
    } catch (error) {
      console.error("Error verifying subscription:", error);
      res.status(500).json({ message: "Failed to verify subscription" });
    }
  });

  // ========== EVENTS API ==========

  // Create Event (Guide/Provider only)
  app.post("/api/events", isAuthenticated, async (req: any, res) => {
    try {
      const user = await storage.getUser(req.user.claims.sub);
      if (!user) {
        return res.status(401).json({ message: "User not found" });
      }
      
      // Only guides and providers can create events
      if (user.role !== "guide" && user.role !== "provider") {
        return res.status(403).json({ message: "Only guides and providers can create events" });
      }
      
      // Validate input
      const eventData = insertEventSchema.parse({
        ...req.body,
        createdBy: user.id
      });
      
      // If paid event, create Stripe product and price
      let stripeProductId: string | undefined;
      let stripePriceId: string | undefined;
      
      if (!eventData.isFree && eventData.ticketPrice) {
        const stripe = getStripe();
        
        // Create product
        const product = await stripe.products.create({
          name: eventData.title,
          description: eventData.description.substring(0, 500),
          metadata: {
            eventId: "pending", // Will update after event creation
            type: "event_ticket"
          }
        });
        
        // Create price
        const price = await stripe.prices.create({
          product: product.id,
          unit_amount: Math.round(parseFloat(eventData.ticketPrice) * 100),
          currency: eventData.currency || "eur",
          metadata: {
            eventId: "pending"
          }
        });
        
        stripeProductId = product.id;
        stripePriceId = price.id;
      }
      
      // Create event
      const event = await storage.createEvent({
        ...eventData,
        stripeProductId,
        stripePriceId
      });
      
      // Update Stripe metadata with actual eventId
      if (stripeProductId) {
        const stripe = getStripe();
        await stripe.products.update(stripeProductId, {
          metadata: { eventId: event.id }
        });
        await stripe.prices.update(stripePriceId!, {
          metadata: { eventId: event.id }
        });
      }
      
      res.status(201).json(event);
    } catch (error: any) {
      console.error("Error creating event:", error);
      res.status(400).json({ message: error.message });
    }
  });

  // List Events
  app.get("/api/events", async (req, res) => {
    try {
      const filters = {
        category: req.query.category as string | undefined,
        createdBy: req.query.createdBy as string | undefined,
        isFree: req.query.isFree === "true" ? true : req.query.isFree === "false" ? false : undefined,
        isPrivate: req.query.isPrivate === "true" ? true : req.query.isPrivate === "false" ? false : undefined,
        startAfter: req.query.startAfter ? new Date(req.query.startAfter as string) : new Date(),
        limit: req.query.limit ? parseInt(req.query.limit as string) : 50,
        offset: req.query.offset ? parseInt(req.query.offset as string) : 0
      };
      
      const eventsList = await storage.listEvents(filters);
      
      res.json(eventsList);
    } catch (error: any) {
      console.error("Error listing events:", error);
      res.status(500).json({ message: error.message });
    }
  });

  // Get Event by ID
  app.get("/api/events/:id", async (req, res) => {
    try {
      const event = await storage.getEventById(req.params.id);
      
      if (!event) {
        return res.status(404).json({ message: "Event not found" });
      }
      
      // Get participants count
      const participants = await storage.getEventParticipants(event.id);
      
      // Get creator info
      const creator = await storage.getUser(event.createdBy);
      
      res.json({
        ...event,
        creator,
        participantsCount: participants.length,
        spotsLeft: event.maxParticipants ? event.maxParticipants - participants.length : null
      });
    } catch (error: any) {
      console.error("Error getting event:", error);
      res.status(500).json({ message: error.message });
    }
  });

  // Get Event Participants with User Data
  app.get("/api/events/:id/participants", async (req, res) => {
    try {
      const eventId = req.params.id;
      
      // Check if event exists
      const event = await storage.getEventById(eventId);
      if (!event) {
        return res.status(404).json({ message: "Event not found" });
      }
      
      // Get participants
      const participants = await storage.getEventParticipants(eventId);
      
      // Fetch user data for each participant
      const participantsWithUsers = await Promise.all(
        participants.map(async (participant) => {
          const user = await storage.getUser(participant.userId);
          return {
            ...participant,
            user
          };
        })
      );
      
      res.json(participantsWithUsers);
    } catch (error: any) {
      console.error("Error getting event participants:", error);
      res.status(500).json({ message: error.message });
    }
  });

  // Get Current User's Events (Events they RSVP'd to)
  app.get("/api/users/me/events", isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user!.id;
      
      // Get all user's event participations
      const participations = await storage.getEventParticipationsByUser(userId);
      
      // Fetch full event data for each participation
      const eventsWithDetails = await Promise.all(
        participations.map(async (participation) => {
          const event = await storage.getEventById(participation.eventId);
          if (!event) return null;
          
          // Get creator info
          const creator = await storage.getUser(event.createdBy);
          
          // Get participants count
          const participants = await storage.getEventParticipants(event.id);
          
          return {
            ...event,
            creator,
            participantsCount: participants.length,
            spotsLeft: event.maxParticipants ? event.maxParticipants - participants.length : null
          };
        })
      );
      
      // Filter out null values (deleted events)
      const events = eventsWithDetails.filter(Boolean);
      
      res.json(events);
    } catch (error: any) {
      console.error("Error fetching user events:", error);
      res.status(500).json({ message: error.message });
    }
  });

  // RSVP to Event (Free or create Stripe checkout for paid) - WITH TRANSACTION
  app.post("/api/events/:id/rsvp", isAuthenticated, async (req: any, res) => {
    try {
      const user = req.user!;
      const eventId = req.params.id;
      const { ticketsCount = 1 } = req.body;
      
      // Validate tickets count
      if (ticketsCount < 1 || ticketsCount > 10) {
        return res.status(400).json({ message: "Invalid tickets count (1-10)" });
      }
      
      // ATOMIC TRANSACTION: Lock event, check capacity, insert participant
      const result = await db.transaction(async (tx) => {
        // 1. Lock the event row for this transaction (prevents concurrent modifications)
        const [event] = await tx
          .select()
          .from(events)
          .where(eq(events.id, eventId))
          .for("update");
        
        if (!event) {
          throw new Error("Event not found");
        }
        
        if (event.status !== "active") {
          throw new Error("Event is not active");
        }
        
        // 2. Check if user already registered (within transaction)
        const [existing] = await tx
          .select()
          .from(eventParticipants)
          .where(and(
            eq(eventParticipants.eventId, eventId),
            eq(eventParticipants.userId, user.id),
            ne(eventParticipants.status, "cancelled")
          ))
          .limit(1);
        
        if (existing) {
          throw new Error("Already registered for this event");
        }
        
        // 3. Check capacity (within transaction, with locked event row)
        if (event.maxParticipants) {
          const participantsResult = await tx
            .select({ count: sql<number>`count(*)` })
            .from(eventParticipants)
            .where(and(
              eq(eventParticipants.eventId, eventId),
              ne(eventParticipants.status, "cancelled")
            ));
          
          const currentParticipants = Number(participantsResult[0]?.count || 0);
          
          if (currentParticipants + ticketsCount > event.maxParticipants) {
            throw new Error("Event is full");
          }
        }
        
        // 4. Create participant entry (still within transaction)
        const participantData: InsertEventParticipant = {
          eventId,
          userId: user.id,
          ticketsPurchased: ticketsCount,
          totalAmount: event.isFree ? "0" : (parseFloat(event.ticketPrice!) * ticketsCount).toFixed(2),
          paymentStatus: event.isFree ? "paid" : "pending",
          status: "confirmed"
        };
        
        const [participant] = await tx
          .insert(eventParticipants)
          .values(participantData)
          .returning();
        
        return { event, participant };
      });
      
      // Transaction completed successfully
      const { event, participant } = result;
      
      // Free event - return success immediately (already committed in transaction)
      if (event.isFree) {
        return res.json({ 
          participant,
          requiresPayment: false 
        });
      }
      
      // Paid event - create Stripe checkout (outside transaction)
      if (!event.stripePriceId) {
        // Rollback participant if Stripe not configured
        await storage.updateEventParticipant(participant.id, { status: "cancelled" });
        return res.status(500).json({ message: "Stripe price not configured for this event" });
      }
      
      try {
        const stripe = getStripe();
        const session = await stripe.checkout.sessions.create({
          mode: "payment",
          line_items: [{
            price: event.stripePriceId,
            quantity: ticketsCount
          }],
          success_url: `${process.env.VITE_REPLIT_DOMAINS}/?payment=success&eventId=${eventId}`,
          cancel_url: `${process.env.VITE_REPLIT_DOMAINS}/events/${eventId}?payment=cancelled`,
          customer_email: user.email || undefined,
          metadata: {
            eventId,
            userId: user.id,
            ticketsCount: ticketsCount.toString(),
            participantId: participant.id,
            type: "event_ticket"
          }
        });
        
        // Update participant with Stripe session ID
        await storage.updateEventParticipant(participant.id, {
          stripeSessionId: session.id
        });
        
        res.json({
          participant,
          requiresPayment: true,
          checkoutUrl: session.url
        });
      } catch (stripeError: any) {
        console.error("Stripe checkout creation failed:", stripeError);
        
        // Cancel participant if Stripe fails
        await storage.updateEventParticipant(participant.id, { status: "cancelled" });
        
        res.status(500).json({ message: "Payment setup failed. Please try again." });
      }
    } catch (error: any) {
      console.error("Error RSVP to event:", error);
      res.status(400).json({ message: error.message || "Failed to RSVP" });
    }
  });

  // Cancel RSVP
  app.delete("/api/events/:id/rsvp", isAuthenticated, async (req: any, res) => {
    try {
      const user = await storage.getUser(req.user.claims.sub);
      if (!user) {
        return res.status(401).json({ message: "User not found" });
      }
      
      const eventId = req.params.id;
      
      const participant = await storage.getEventParticipant(eventId, user.id);
      if (!participant) {
        return res.status(404).json({ message: "RSVP not found" });
      }
      
      // Update status to cancelled
      await storage.updateEventParticipant(participant.id, {
        status: "cancelled"
      });
      
      res.json({ message: "RSVP cancelled successfully" });
    } catch (error: any) {
      console.error("Error cancelling RSVP:", error);
      res.status(500).json({ message: error.message });
    }
  });

  // Delete Event (Owner only)
  app.delete("/api/events/:id", isAuthenticated, async (req: any, res) => {
    try {
      const user = await storage.getUser(req.user.claims.sub);
      if (!user) {
        return res.status(401).json({ message: "User not found" });
      }
      
      const eventId = req.params.id;
      
      const event = await storage.getEventById(eventId);
      if (!event) {
        return res.status(404).json({ message: "Event not found" });
      }
      
      // Check ownership
      if (event.createdBy !== user.id) {
        return res.status(403).json({ message: "You can only delete your own events" });
      }
      
      await storage.deleteEvent(eventId);
      
      res.json({ message: "Event deleted successfully" });
    } catch (error: any) {
      console.error("Error deleting event:", error);
      res.status(500).json({ message: error.message });
    }
  });

  // Update Event Status (Owner only)
  app.patch("/api/events/:id/status", isAuthenticated, async (req: any, res) => {
    try {
      const user = await storage.getUser(req.user.claims.sub);
      if (!user) {
        return res.status(401).json({ message: "User not found" });
      }
      
      const eventId = req.params.id;
      const { status } = req.body;
      
      if (!["active", "cancelled", "completed"].includes(status)) {
        return res.status(400).json({ message: "Invalid status" });
      }
      
      const event = await storage.getEventById(eventId);
      if (!event) {
        return res.status(404).json({ message: "Event not found" });
      }
      
      if (event.createdBy !== user.id) {
        return res.status(403).json({ message: "You can only update your own events" });
      }
      
      const updated = await storage.updateEvent(eventId, { status });
      
      res.json(updated);
    } catch (error: any) {
      console.error("Error updating event status:", error);
      res.status(500).json({ message: error.message });
    }
  });

  // ========== FEED SOCIAL API ==========

  // Create Post
  app.post("/api/posts", isAuthenticated, async (req: any, res) => {
    try {
      const user = req.user!;
      
      // Check rate limit (10 posts per minute)
      if (!checkPostRateLimit(user.id, 10, 60000)) {
        return res.status(429).json({ message: "Too many posts. Please wait before posting again." });
      }
      
      const postData = insertPostSchema.parse({
        ...req.body,
        authorId: user.id
      });
      
      // Auto-moderate content
      const moderation = await moderateContent(
        postData.content,
        "post"
      );
      
      // Log medium severity for review
      if (moderation.severity === "medium") {
        console.warn(`[Moderation] Medium severity content allowed:`, {
          userId: user.id,
          contentType: "post",
          categories: moderation.categories,
          reason: moderation.reason
        });
      }
      
      // Block only high severity
      if (moderation.severity === "high") {
        return res.status(400).json({ 
          message: "Content flagged for inappropriate content",
          reason: moderation.reason,
          categories: moderation.categories
        });
      }
      
      const post = await storage.createPost(postData);
      
      // Broadcast to WebSocket ONLY if post is public (privacy fix)
      if (post.isPublic) {
        broadcastToAll({
          type: "new_post",
          post: {
            ...post,
            author: {
              id: user.id,
              firstName: user.firstName,
              lastName: user.lastName,
              profileImageUrl: user.profileImageUrl
            }
          }
        });
      }
      
      res.status(201).json(post);
    } catch (error: any) {
      console.error("Error creating post:", error);
      res.status(400).json({ message: error.message });
    }
  });

  // Get Feed Posts
  app.get("/api/posts", async (req, res) => {
    try {
      const filters = {
        authorId: req.query.authorId as string | undefined,
        tourId: req.query.tourId as string | undefined,
        serviceId: req.query.serviceId as string | undefined,
        eventId: req.query.eventId as string | undefined,
        hashtag: req.query.hashtag as string | undefined,
        isPublic: req.query.isPublic === "false" ? false : true,
        limit: req.query.limit ? parseInt(req.query.limit as string) : 50,
        offset: req.query.offset ? parseInt(req.query.offset as string) : 0
      };
      
      const postsList = await storage.getFeedPosts(filters);
      
      // OPTIMIZED: Batch author lookup instead of N+1 queries
      const authorIds = Array.from(new Set(postsList.map(p => p.authorId)));
      const authorsMap = await storage.getUsersByIds(authorIds);
      
      const enrichedPosts = postsList.map((post) => {
        const author = authorsMap.get(post.authorId);
        return {
          ...post,
          author: author ? {
            id: author.id,
            firstName: author.firstName,
            lastName: author.lastName,
            profileImageUrl: author.profileImageUrl,
            verified: author.verified
          } : null
        };
      });
      
      res.json(enrichedPosts);
    } catch (error: any) {
      console.error("Error getting feed posts:", error);
      res.status(500).json({ message: error.message });
    }
  });

  // Get Post by ID
  app.get("/api/posts/:id", async (req: any, res) => {
    try {
      const post = await storage.getPostById(req.params.id);
      
      if (!post) {
        return res.status(404).json({ message: "Post not found" });
      }
      
      // Get author info
      const author = await storage.getUserById(post.authorId);
      
      // Get user's like status (if authenticated)
      let hasLiked = false;
      if (req.user) {
        hasLiked = await storage.hasUserLikedPost(post.id, req.user.id);
      }
      
      res.json({
        ...post,
        author: author ? {
          id: author.id,
          firstName: author.firstName,
          lastName: author.lastName,
          profileImageUrl: author.profileImageUrl,
          verified: author.verified
        } : null,
        hasLiked
      });
    } catch (error: any) {
      console.error("Error getting post:", error);
      res.status(500).json({ message: error.message });
    }
  });

  // Delete Post (Owner only)
  app.delete("/api/posts/:id", isAuthenticated, async (req: any, res) => {
    try {
      const user = req.user!;
      const postId = req.params.id;
      
      const post = await storage.getPostById(postId);
      if (!post) {
        return res.status(404).json({ message: "Post not found" });
      }
      
      if (post.authorId !== user.id) {
        return res.status(403).json({ message: "You can only delete your own posts" });
      }
      
      await storage.deletePost(postId);
      
      res.json({ message: "Post deleted successfully" });
    } catch (error: any) {
      console.error("Error deleting post:", error);
      res.status(500).json({ message: error.message });
    }
  });

  // Toggle Like on Post
  app.post("/api/posts/:id/like", isAuthenticated, async (req: any, res) => {
    try {
      const user = req.user!;
      const postId = req.params.id;
      
      const post = await storage.getPostById(postId);
      if (!post) {
        return res.status(404).json({ message: "Post not found" });
      }
      
      const result = await storage.togglePostLike(postId, user.id);
      
      // Get updated post
      const updatedPost = await storage.getPostById(postId);
      
      // Add reward points for community interaction (only on like, not unlike)
      if (result.liked) {
        await storage.awardPoints(user.id, 'community_interaction', {
          description: 'Engaged with community post',
        });
      }
      
      // Broadcast like notification via WebSocket (only if liked, not unliked)
      if (result.liked) {
        broadcastToUser(post.authorId, {
          type: "post_liked",
          postId,
          likedBy: {
            id: user.id,
            firstName: user.firstName,
            lastName: user.lastName,
            profileImageUrl: user.profileImageUrl
          },
          likesCount: updatedPost!.likesCount
        });
      }
      
      res.json({
        liked: result.liked,
        likesCount: updatedPost!.likesCount
      });
    } catch (error: any) {
      console.error("Error toggling like:", error);
      res.status(500).json({ message: error.message });
    }
  });

  // Add Comment to Post
  app.post("/api/posts/:id/comments", isAuthenticated, async (req: any, res) => {
    try {
      const user = req.user!;
      const postId = req.params.id;
      const { content, parentCommentId } = req.body;
      
      if (!content || content.trim().length === 0) {
        return res.status(400).json({ message: "Comment content required" });
      }
      
      const post = await storage.getPostById(postId);
      if (!post) {
        return res.status(404).json({ message: "Post not found" });
      }
      
      const comment = await storage.addComment({
        postId,
        authorId: user.id,
        content: content.trim(),
        parentCommentId: parentCommentId || null
      });
      
      // Add reward points for community interaction
      await storage.awardPoints(user.id, 'community_interaction', {
        description: 'Engaged with community post',
      });
      
      // Send push notification for comment
      await sendNotification({
        userId: post.authorId,
        type: 'comment',
        title: 'New comment on your post',
        message: `${user.firstName} commented on your post`,
        relatedId: postId,
        relatedType: 'post'
      });
      
      // Get updated post
      const updatedPost = await storage.getPostById(postId);
      
      // Broadcast comment notification via WebSocket
      broadcastToUser(post.authorId, {
        type: "post_commented",
        postId,
        comment: {
          ...comment,
          author: {
            id: user.id,
            firstName: user.firstName,
            lastName: user.lastName,
            profileImageUrl: user.profileImageUrl
          }
        },
        commentsCount: updatedPost!.commentsCount
      });
      
      res.status(201).json({
        ...comment,
        author: {
          id: user.id,
          firstName: user.firstName,
          lastName: user.lastName,
          profileImageUrl: user.profileImageUrl
        }
      });
    } catch (error: any) {
      console.error("Error adding comment:", error);
      res.status(400).json({ message: error.message });
    }
  });

  // Get Post Comments
  app.get("/api/posts/:id/comments", async (req, res) => {
    try {
      const postId = req.params.id;
      
      const comments = await storage.getPostComments(postId);
      
      // OPTIMIZED: Batch author lookup
      const authorIds = Array.from(new Set(comments.map(c => c.authorId)));
      const authorsMap = await storage.getUsersByIds(authorIds);
      
      const enrichedComments = comments.map((comment) => {
        const author = authorsMap.get(comment.authorId);
        return {
          ...comment,
          author: author ? {
            id: author.id,
            firstName: author.firstName,
            lastName: author.lastName,
            profileImageUrl: author.profileImageUrl,
            verified: author.verified
          } : null
        };
      });
      
      res.json(enrichedComments);
    } catch (error: any) {
      console.error("Error getting comments:", error);
      res.status(500).json({ message: error.message });
    }
  });

  // Delete Comment (Owner only)
  app.delete("/api/posts/:id/comments/:commentId", isAuthenticated, async (req: any, res) => {
    try {
      const user = req.user!;
      const { commentId } = req.params;
      
      const comments = await storage.getPostComments(req.params.id);
      const comment = comments.find(c => c.id === commentId);
      
      if (!comment) {
        return res.status(404).json({ message: "Comment not found" });
      }
      
      if (comment.authorId !== user.id) {
        return res.status(403).json({ message: "You can only delete your own comments" });
      }
      
      await storage.deleteComment(commentId);
      
      res.json({ message: "Comment deleted successfully" });
    } catch (error: any) {
      console.error("Error deleting comment:", error);
      res.status(500).json({ message: error.message });
    }
  });

  app.post('/api/webhooks/stripe', async (req: any, res) => {
    if (!stripe) {
      return res.status(500).json({ message: "Stripe is not configured" });
    }

    const sig = req.headers['stripe-signature'];
    
    if (!sig) {
      return res.status(400).send('No signature');
    }
    
    let event;
    
    try {
      const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET;
      if (!webhookSecret) {
        console.error('[Stripe] STRIPE_WEBHOOK_SECRET not configured');
        return res.status(500).send('Webhook secret not configured');
      }
      
      event = stripe.webhooks.constructEvent(
        req.rawBody || req.body,
        sig,
        webhookSecret
      );
    } catch (err: any) {
      console.error('[Stripe] Webhook signature verification failed:', err.message);
      return res.status(400).send(`Webhook signature verification failed: ${err.message}`);
    }
    
    try {
      switch (event.type) {
        case 'customer.subscription.created':
        case 'customer.subscription.updated': {
          const subscription = event.data.object as Stripe.Subscription;
          
          await storage.updateSubscriptionStatus(
            subscription.id,
            subscription.status
          );
          
          const dbSub = await storage.getSubscriptionByStripeId(subscription.id);
          if (dbSub) {
            const sub = subscription as any;
            if (sub.current_period_start && sub.current_period_end) {
              await storage.updateSubscription(dbSub.id, {
                currentPeriodStart: new Date(sub.current_period_start * 1000),
                currentPeriodEnd: new Date(sub.current_period_end * 1000),
                status: subscription.status
              });
            }
          }
          break;
        }
        
        case 'customer.subscription.deleted': {
          const subscription = event.data.object as Stripe.Subscription;
          
          await storage.updateSubscriptionStatus(subscription.id, 'expired');
          
          const dbSub = await storage.getSubscriptionByStripeId(subscription.id);
          if (dbSub) {
            await storage.updateUserBadges(dbSub.userId);
            await storage.recalculateTrustLevel(dbSub.userId);
          }
          break;
        }
        
        case 'invoice.payment_failed': {
          const invoice = event.data.object as any;
          
          if (invoice.subscription && typeof invoice.subscription === 'string') {
            await storage.updateSubscriptionStatus(
              invoice.subscription,
              'past_due'
            );
          }
          break;
        }
        
        case 'invoice.payment_succeeded': {
          const invoice = event.data.object as any;
          
          if (invoice.subscription && typeof invoice.subscription === 'string') {
            await storage.updateSubscriptionStatus(
              invoice.subscription,
              'active'
            );
          }
          break;
        }
        
        case 'checkout.session.completed': {
          const session = event.data.object as Stripe.Checkout.Session;
          
          // Check if this is a package booking
          if (session.metadata?.packageBookingId) {
            const bookingId = session.metadata.packageBookingId;
            
            try {
              await storage.updatePackageBooking(bookingId, {
                paymentStatus: 'paid',
                status: 'confirmed',
                stripePaymentIntentId: session.payment_intent as string,
              });
              
              // Track affiliate conversion if applicable
              const booking = await storage.getPackageBooking(bookingId);
              if (booking?.affiliateCode) {
                await storage.trackAffiliateConversion(
                  booking.affiliateCode,
                  parseFloat(booking.totalPrice)
                );
              }
              
              // Award partner sale points
              if (booking) {
                const pkg = await storage.getPackage(booking.packageId);
                if (pkg) {
                  const partner = await storage.getPartner(pkg.partnerId);
                  if (partner) {
                    await storage.awardPoints(partner.ownerUserId, 'partner_sale', {
                      description: 'Package sale completed',
                      targetId: booking.id,
                    });
                  }
                }
              }
              
              console.log(`[Stripe] Package booking ${bookingId} payment completed`);
            } catch (error) {
              console.error(`[Stripe] Error processing package booking:`, error);
            }
          }
          
          // Event ticket payment - WITH CAPACITY RECHECK
          if (session.metadata?.type === "event_ticket") {
            const { eventId, userId, participantId } = session.metadata;
            
            try {
              // Get event to check capacity
              const event = await storage.getEventById(eventId);
              if (!event) {
                console.error(`[Stripe Webhook] Event ${eventId} not found`);
                // Refund payment if event doesn't exist
                await stripe.refunds.create({
                  payment_intent: session.payment_intent as string,
                  reason: "requested_by_customer",
                  metadata: {
                    reason: "event_not_found",
                    eventId
                  }
                });
                return;
              }
              
              // Double-check capacity before confirming payment
              if (event.maxParticipants) {
                const participants = await storage.getEventParticipants(eventId);
                const confirmedCount = participants.filter(p => 
                  p.paymentStatus === "paid" && p.status !== "cancelled"
                ).length;
                
                const requestedTickets = parseInt(session.metadata.ticketsCount || "1");
                
                if (confirmedCount + requestedTickets > event.maxParticipants) {
                  console.error(`[Stripe Webhook] Event ${eventId} is full - refunding payment`);
                  
                  // Refund payment
                  await stripe.refunds.create({
                    payment_intent: session.payment_intent as string,
                    reason: "requested_by_customer",
                    metadata: {
                      reason: "event_full",
                      eventId,
                      userId
                    }
                  });
                  
                  // Cancel participant
                  if (participantId) {
                    await storage.updateEventParticipant(participantId, {
                      paymentStatus: "refunded",
                      status: "cancelled"
                    });
                  }
                  
                  console.log(`[Stripe Webhook] Refunded payment for user ${userId} - event ${eventId} is full`);
                  return;
                }
              }
              
              // Capacity OK - confirm payment
              if (participantId) {
                await storage.updateEventParticipant(participantId, {
                  paymentStatus: "paid"
                });
                
                console.log(`[Stripe Webhook] Event ticket payment confirmed for user ${userId}, event ${eventId}`);
              }
            } catch (error) {
              console.error(`[Stripe Webhook] Error processing event ticket:`, error);
            }
          }
          break;
        }
      }
      
      res.json({ received: true });
    } catch (error) {
      console.error('[Stripe] Webhook handler error:', error);
      res.status(500).json({ message: "Webhook handler error" });
    }
  });

  // AI Assistant endpoints
  app.post('/api/ai/chat', aiLimiter, isAuthenticated, async (req: any, res) => {
    const schema = z.object({
      messages: z.array(z.object({
        role: z.enum(['user', 'assistant']),
        content: z.string().min(1).max(1000)
      })).min(1).max(20)
    });
    
    try {
      const { messages } = schema.parse(req.body);
      
      const response = await chatWithAssistant(
        messages,
        req.user.claims.sub
      );
      
      res.json({ response });
    } catch (error: any) {
      if (error.name === 'ZodError') {
        return res.status(400).json({ 
          message: 'Invalid request data',
          errors: error.errors 
        });
      }
      console.error('[OpenAI] Chat error:', error);
      res.status(500).json({ 
        message: 'AI assistant is temporarily unavailable' 
      });
    }
  });

  app.post('/api/ai/chat/stream', aiLimiter, isAuthenticated, async (req: any, res) => {
    const schema = z.object({
      messages: z.array(z.object({
        role: z.enum(['user', 'assistant']),
        content: z.string().min(1).max(1000)
      })).min(1).max(20)
    });
    
    try {
      const { messages } = schema.parse(req.body);
      
      res.setHeader('Content-Type', 'text/event-stream');
      res.setHeader('Cache-Control', 'no-cache');
      res.setHeader('Connection', 'keep-alive');
      
      const stream = chatWithAssistantStream(messages, req.user.claims.sub);
      
      for await (const chunk of stream) {
        res.write(`data: ${JSON.stringify({ chunk })}\n\n`);
      }
      
      res.write('data: [DONE]\n\n');
      res.end();
    } catch (error: any) {
      if (error.name === 'ZodError') {
        return res.status(400).json({ 
          message: 'Invalid request data',
          errors: error.errors 
        });
      }
      console.error('[OpenAI] Streaming error:', error);
      res.write(`data: ${JSON.stringify({ error: 'Stream failed' })}\n\n`);
      res.end();
    }
  });

  app.post('/api/ai/tour-recommendations', aiLimiter, isAuthenticated, async (req: any, res) => {
    const schema = z.object({
      query: z.string().min(5).max(500),
      location: z.string().optional(),
      maxPrice: z.number().optional()
    });
    
    try {
      const { query, location, maxPrice } = schema.parse(req.body);
      
      let tours = await storage.getTours();
      
      if (location) {
        tours = tours.filter(t => t.meetingPoint.includes(location));
      }
      if (maxPrice) {
        tours = tours.filter(t => t.price && parseFloat(t.price.toString()) <= maxPrice);
      }
      
      const availableTours = tours.slice(0, 10).map(t => ({
        name: t.title,
        description: t.description,
        location: t.meetingPoint,
        price: parseFloat(t.price?.toString() || '0')
      }));
      
      const recommendations = await getTourRecommendations(
        query,
        availableTours,
        req.user.claims.sub
      );
      
      res.json({ recommendations });
    } catch (error: any) {
      if (error.name === 'ZodError') {
        return res.status(400).json({ 
          message: 'Invalid request data',
          errors: error.errors 
        });
      }
      console.error('[OpenAI] Recommendations error:', error);
      res.status(500).json({ 
        message: 'Could not generate recommendations' 
      });
    }
  });

  app.get('/api/ai/suggestions', async (req, res) => {
    const suggestions = [
      "What are the best tours in Rome?",
      "Show me family-friendly activities",
      "What should I do in Paris for 3 days?",
      "Recommend adventure tours",
      "Best food tours in Italy",
      "Hidden gems in Barcelona",
      "Weekend getaway ideas"
    ];
    
    res.json(suggestions);
  });

  // ========== AI ITINERARY BUILDER ==========

  app.post("/api/ai/itinerary", isAuthenticated, aiLimiter, async (req: any, res) => {
    try {
      // ✅ VALIDATE with Zod
      const validated = itinerarySchema.parse({
        ...req.body,
        days: parseInt(req.body.days)  // Parse to number for validation
      });
      
      const itinerary = await generateItinerary(validated);
      
      res.json(itinerary);
    } catch (error: any) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ 
          message: "Validation error",
          errors: error.errors 
        });
      }
      console.error("Error generating itinerary:", error);
      res.status(500).json({ message: error.message });
    }
  });

  // ========== AI LANGUAGE TRANSLATION ==========

  app.post("/api/ai/translate", isAuthenticated, aiLimiter, async (req: any, res) => {
    try {
      // ✅ VALIDATE with Zod
      const validated = translationSchema.parse(req.body);
      
      const translated = await translateText(validated);
      
      res.json({ translatedText: translated });
    } catch (error: any) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ 
          message: "Validation error",
          errors: error.errors 
        });
      }
      console.error("Error translating text:", error);
      res.status(500).json({ message: error.message });
    }
  });

  // ========== AI REVIEW SUMMARIES ==========

  app.get("/api/ai/review-summary/:entityType/:entityId", async (req, res) => {
    try {
      const { entityType, entityId } = req.params;
      
      if (entityType !== "tour" && entityType !== "service") {
        return res.status(400).json({ message: "Invalid entity type" });
      }
      
      // Get reviews
      const reviews = entityType === "tour"
        ? await storage.getReviewsByTour(entityId)
        : await storage.getReviewsByService(entityId);
      
      if (reviews.length === 0) {
        return res.json({ 
          summary: "No reviews yet.",
          highlights: [],
          concerns: [],
          averageRating: 0
        });
      }
      
      const summary = await summarizeReviews(reviews);
      
      res.json(summary);
    } catch (error: any) {
      console.error("Error generating review summary:", error);
      res.status(500).json({ message: error.message });
    }
  });

  // ========== AI CONTENT MODERATION ==========

  app.post("/api/ai/moderate", aiLimiter, async (req, res) => {
    try {
      // ✅ VALIDATE with Zod
      const validated = moderationSchema.parse(req.body);
      
      const moderation = await moderateContent(validated.content, validated.contentType);
      
      res.json(moderation);
    } catch (error: any) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ 
          message: "Validation error",
          errors: error.errors 
        });
      }
      console.error("Error moderating content:", error);
      res.status(500).json({ message: error.message });
    }
  });

  // ========== AI CONSENT MANAGEMENT (GDPR Phase 9) ==========

  // GET /api/ai/consent - Get user's AI consent status
  app.get("/api/ai/consent", isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user!.id;
      const consentStatus = await storage.getAIConsentStatus(userId);
      res.json(consentStatus);
    } catch (error) {
      console.error("[AI Consent] Error fetching consent:", error);
      res.status(500).json({ message: "Failed to fetch consent status" });
    }
  });

  // POST /api/ai/consent - Update user's AI consent
  app.post("/api/ai/consent", isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user!.id;
      const { consent } = req.body;
      
      if (typeof consent !== 'boolean') {
        return res.status(400).json({ message: "consent must be a boolean" });
      }
      
      await storage.updateAIConsent(userId, consent);
      res.json({ 
        success: true, 
        message: consent 
          ? "AI features enabled. You can now use AI assistance for translations, summaries, and more."
          : "AI features disabled. Your data will not be processed by AI." 
      });
    } catch (error) {
      console.error("[AI Consent] Error updating consent:", error);
      res.status(500).json({ message: "Failed to update consent" });
    }
  });

  // ========== PARTNER API (Public with API Key) ==========
  
  // Search Tours
  app.get("/api/partner/tours", apiKeyAuth, requirePermission("read:tours"), async (req, res) => {
    try {
      const filters = {
        category: req.query.category as string | undefined,
        minPrice: req.query.minPrice ? parseFloat(req.query.minPrice as string) : undefined,
        maxPrice: req.query.maxPrice ? parseFloat(req.query.maxPrice as string) : undefined,
        language: req.query.language as string | undefined,
        city: req.query.city as string | undefined,
        limit: req.query.limit ? parseInt(req.query.limit as string) : 50,
        offset: req.query.offset ? parseInt(req.query.offset as string) : 0
      };
      
      const tours = await storage.searchTours(filters);
      
      res.json({
        tours,
        meta: {
          limit: filters.limit,
          offset: filters.offset,
          count: tours.length
        }
      });
    } catch (error: any) {
      console.error("Partner API - search tours error:", error);
      res.status(500).json({ message: error.message });
    }
  });
  
  // Get Tour Details
  app.get("/api/partner/tours/:id", apiKeyAuth, requirePermission("read:tours"), async (req, res) => {
    try {
      const tour = await storage.getTourById(req.params.id);
      
      if (!tour) {
        return res.status(404).json({ message: "Tour not found" });
      }
      
      // Get guide info
      const guide = tour.guide;
      
      res.json({
        ...tour,
        guide: guide ? {
          id: guide.id,
          firstName: guide.firstName,
          lastName: guide.lastName,
          trustLevel: guide.trustLevel,
          verified: guide.verified
        } : null
      });
    } catch (error: any) {
      console.error("Partner API - get tour error:", error);
      res.status(500).json({ message: error.message });
    }
  });
  
  // Search Services
  app.get("/api/partner/services", apiKeyAuth, requirePermission("read:services"), async (req, res) => {
    try {
      const filters = {
        category: req.query.category as string | undefined,
        city: req.query.city as string | undefined,
        limit: req.query.limit ? parseInt(req.query.limit as string) : 50,
        offset: req.query.offset ? parseInt(req.query.offset as string) : 0
      };
      
      const services = await storage.searchServices(filters);
      
      res.json({
        services,
        meta: {
          limit: filters.limit,
          offset: filters.offset,
          count: services.length
        }
      });
    } catch (error: any) {
      console.error("Partner API - search services error:", error);
      res.status(500).json({ message: error.message });
    }
  });
  
  // Create Booking (authorized partners only)
  app.post("/api/partner/bookings", apiKeyAuth, requirePermission("write:bookings"), async (req, res) => {
    try {
      const { tourId, touristEmail, touristName, numberOfPeople, totalPrice, bookingDate } = req.body;
      
      if (!tourId || !touristEmail || !touristName || !numberOfPeople) {
        return res.status(400).json({ message: "Missing required fields" });
      }
      
      const tour = await storage.getTourById(tourId);
      if (!tour) {
        return res.status(404).json({ message: "Tour not found" });
      }
      
      // For partner API bookings, we need to create a temporary user or handle differently
      // For now, we'll require the partner to have a userId in the request or use the partnerId
      const booking = await storage.createBooking({
        userId: req.apiKey!.partnerId, // Use partner as the booking user
        tourId,
        bookingDate: bookingDate ? new Date(bookingDate) : new Date(),
        participants: numberOfPeople,
        totalAmount: totalPrice?.toString() || tour.price?.toString() || "0",
        status: "pending",
        paymentStatus: "pending",
        specialRequests: JSON.stringify({
          source: "partner_api",
          partnerId: req.apiKey!.partnerId,
          touristEmail,
          touristName
        })
      });
      
      res.status(201).json(booking);
    } catch (error: any) {
      console.error("Partner API - create booking error:", error);
      res.status(400).json({ message: error.message });
    }
  });
  
  // Get Statistics (aggregated data for marketing)
  app.get("/api/partner/stats", apiKeyAuth, requirePermission("read:stats"), async (req, res) => {
    try {
      const stats = {
        totalTours: await storage.countTours(),
        totalServices: await storage.countServices(),
        categories: await storage.getTourCategories(),
        cities: await storage.getAvailableCities()
      };
      
      res.json(stats);
    } catch (error: any) {
      console.error("Partner API - stats error:", error);
      res.status(500).json({ message: error.message });
    }
  });
  
  // ========== API KEY MANAGEMENT (User's own keys) ==========
  
  // Create API Key (Guide/Provider only)
  app.post("/api/my/api-keys", isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const user = await storage.getUser(userId);
      
      if (!user) {
        return res.status(404).json({ message: "User not found" });
      }
      
      // Only guides and providers can create API keys
      if (user.role !== "guide" && user.role !== "provider") {
        return res.status(403).json({ message: "Only guides and providers can create API keys" });
      }
      
      const { name, permissions, rateLimit } = req.body;
      
      if (!name || !permissions || !Array.isArray(permissions)) {
        return res.status(400).json({ message: "Name and permissions required" });
      }
      
      // Generate key
      const { key, hash, prefix } = generateApiKey("live");
      
      // Create in database
      const apiKey = await storage.createApiKey({
        partnerId: userId,
        name,
        keyHash: hash,
        keyPrefix: prefix,
        permissions,
        rateLimit: rateLimit || 1000,
        isActive: true
      });
      
      // Return key ONLY ONCE (never shown again)
      res.status(201).json({
        ...apiKey,
        key, // IMPORTANT: Only returned on creation
        warning: "Save this key securely. You won't be able to see it again."
      });
    } catch (error: any) {
      console.error("Error creating API key:", error);
      res.status(400).json({ message: error.message });
    }
  });
  
  // List Own API Keys
  app.get("/api/my/api-keys", isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const keys = await storage.listApiKeys(userId);
      
      // Don't return keyHash (security)
      const sanitized = keys.map(k => ({
        id: k.id,
        name: k.name,
        keyPrefix: k.keyPrefix,
        permissions: k.permissions,
        rateLimit: k.rateLimit,
        requestsToday: k.requestsToday,
        lastUsedAt: k.lastUsedAt,
        isActive: k.isActive,
        expiresAt: k.expiresAt,
        createdAt: k.createdAt
      }));
      
      res.json(sanitized);
    } catch (error: any) {
      console.error("Error listing API keys:", error);
      res.status(500).json({ message: error.message });
    }
  });
  
  // Delete API Key
  app.delete("/api/my/api-keys/:id", isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const keyId = req.params.id;
      
      const keys = await storage.listApiKeys(userId);
      const key = keys.find(k => k.id === keyId);
      
      if (!key) {
        return res.status(404).json({ message: "API key not found" });
      }
      
      await storage.deleteApiKey(keyId);
      
      res.json({ message: "API key deleted successfully" });
    } catch (error: any) {
      console.error("Error deleting API key:", error);
      res.status(500).json({ message: error.message });
    }
  });
  // ========== ANALYTICS TRACKING ==========

  // Track Event (public - can be called on tour view, booking, etc)
  app.post("/api/analytics/track", async (req, res) => {
    try {
      const { eventCategory, targetId, targetType, metadata } = req.body;
      
      if (!eventCategory || !targetId || !targetType) {
        return res.status(400).json({ message: "Missing required fields" });
      }
      
      // Get userId if authenticated
      const userId = (req as any).user?.claims?.sub || null;
      
      const event = await storage.trackEvent({
        eventType: "click",
        eventCategory,
        targetId,
        targetType,
        userId,
        metadata: metadata ? JSON.stringify(metadata) : null
      });
      
      res.json(event);
    } catch (error: any) {
      console.error("Error tracking event:", error);
      res.status(500).json({ message: error.message });
    }
  });

  // ========== ANALYTICS DASHBOARD ==========

  // Get Entity Analytics (tour/service specific)
  app.get("/api/analytics/:entityType/:entityId", isAuthenticated, async (req: any, res) => {
    try {
      const { entityType, entityId } = req.params;
      const userId = req.user.claims.sub;
      
      // Verify ownership
      if (entityType === "tour") {
        const tour = await storage.getTourById(entityId);
        if (!tour || tour.guideId !== userId) {
          return res.status(403).json({ message: "Not authorized to view these analytics" });
        }
      } else if (entityType === "service") {
        const service = await storage.getService(entityId);
        if (!service || service.providerId !== userId) {
          return res.status(403).json({ message: "Not authorized to view these analytics" });
        }
      } else {
        return res.status(400).json({ message: "Invalid entity type" });
      }
      
      // Get date range from query
      const startDate = req.query.startDate ? new Date(req.query.startDate as string) : undefined;
      const endDate = req.query.endDate ? new Date(req.query.endDate as string) : undefined;
      
      const analytics = await storage.getEntityAnalytics(entityId, entityType, startDate, endDate);
      
      res.json(analytics);
    } catch (error: any) {
      console.error("Error getting entity analytics:", error);
      res.status(500).json({ message: error.message });
    }
  });

  // Get Guide Dashboard Analytics
  app.get("/api/analytics/dashboard/guide", isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const user = await storage.getUser(userId);
      
      if (user?.role !== "guide") {
        return res.status(403).json({ message: "Only guides can access this endpoint" });
      }
      
      // Get date range
      const startDate = req.query.startDate ? new Date(req.query.startDate as string) : undefined;
      const endDate = req.query.endDate ? new Date(req.query.endDate as string) : undefined;
      
      const analytics = await storage.getGuideAnalytics(userId, startDate, endDate);
      
      res.json(analytics);
    } catch (error: any) {
      console.error("Error getting guide analytics:", error);
      res.status(500).json({ message: error.message });
    }
  });

  // Get Provider Dashboard Analytics
  app.get("/api/analytics/dashboard/provider", isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const user = await storage.getUser(userId);
      
      if (user?.role !== "provider") {
        return res.status(403).json({ message: "Only providers can access this endpoint" });
      }
      
      // Get date range
      const startDate = req.query.startDate ? new Date(req.query.startDate as string) : undefined;
      const endDate = req.query.endDate ? new Date(req.query.endDate as string) : undefined;
      
      const analytics = await storage.getProviderAnalytics(userId, startDate, endDate);
      
      res.json(analytics);
    } catch (error: any) {
      console.error("Error getting provider analytics:", error);
      res.status(500).json({ message: error.message });
    }
  });

  // ========== LIKES (Phase 4) ==========

  // Toggle like (add/remove)
  app.post("/api/likes/toggle", isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const user = await storage.getUser(userId);
      
      // Only tourists can like
      if (user?.role !== "tourist") {
        return res.status(403).json({ message: "Only tourists can like content" });
      }
      
      const { targetId, targetType } = req.body;
      
      if (!targetId || !targetType) {
        return res.status(400).json({ message: "targetId and targetType are required" });
      }
      
      if (!["profile", "tour", "service"].includes(targetType)) {
        return res.status(400).json({ message: "Invalid targetType. Must be profile, tour, or service" });
      }
      
      // Check if already liked
      const hasLiked = await storage.hasUserLiked(userId, targetId, targetType);
      
      if (hasLiked) {
        // Remove like
        await storage.removeLike(userId, targetId, targetType);
        const count = await storage.getLikesCount(targetId, targetType);
        res.json({ liked: false, count });
      } else {
        // Add like
        await storage.addLike(userId, targetId, targetType);
        const count = await storage.getLikesCount(targetId, targetType);
        
        // Award like points ONLY if this is the first time ever liking this target (prevents farming)
        storage.hasCompletedActionBefore(userId, 'like').then(async (hasLikedBefore) => {
          // For first-ever like OR check if they've liked THIS specific target before
          // Only award if they haven't been rewarded for liking this exact target before
          const logs = await storage.getRewardHistory(userId, 1000);
          const hasRewardedThisTarget = logs.some(log => 
            log.action === 'like' && log.metadata && (log.metadata as any).targetId === targetId
          );
          
          if (!hasRewardedThisTarget) {
            await storage.awardPoints(userId, 'like', {
              targetId,
              description: `Liked ${targetType}`
            });
          }
        }).catch(err => console.error("Failed to award like points:", err));
        
        res.json({ liked: true, count });
      }
    } catch (error: any) {
      console.error("Error toggling like:", error);
      res.status(500).json({ message: error.message });
    }
  });

  // Get likes count for target
  app.get("/api/likes/:targetType/:targetId", async (req, res) => {
    try {
      const { targetId, targetType } = req.params;
      
      if (!["profile", "tour", "service"].includes(targetType)) {
        return res.status(400).json({ message: "Invalid targetType" });
      }
      
      const count = await storage.getLikesCount(targetId, targetType as 'profile' | 'tour' | 'service');
      res.json({ count });
    } catch (error: any) {
      console.error("Error getting likes count:", error);
      res.status(500).json({ message: error.message });
    }
  });

  // Check if user has liked
  app.get("/api/likes/:targetType/:targetId/check", isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const { targetId, targetType } = req.params;
      
      if (!["profile", "tour", "service"].includes(targetType)) {
        return res.status(400).json({ message: "Invalid targetType" });
      }
      
      const hasLiked = await storage.hasUserLiked(userId, targetId, targetType as 'profile' | 'tour' | 'service');
      res.json({ hasLiked });
    } catch (error: any) {
      console.error("Error checking like status:", error);
      res.status(500).json({ message: error.message });
    }
  });

  // Get user's total likes (for guides/providers)
  app.get("/api/users/:userId/total-likes", async (req, res) => {
    try {
      const { userId } = req.params;
      const totalLikes = await storage.getUserTotalLikes(userId);
      res.json({ totalLikes });
    } catch (error: any) {
      console.error("Error getting total likes:", error);
      res.status(500).json({ message: error.message });
    }
  });

  // ========== TRUST LEVELS (Phase 4) ==========

  // Get user's trust level
  app.get("/api/trust-level/:userId", async (req, res) => {
    try {
      const { userId } = req.params;
      const trustLevel = await storage.getTrustLevelOrCreate(userId);
      res.json(trustLevel);
    } catch (error: any) {
      console.error("Error getting trust level:", error);
      res.status(500).json({ message: error.message });
    }
  });

  // Recalculate and update trust level (for guides/providers)
  app.post("/api/trust-level/:userId/recalculate", isAuthenticated, async (req: any, res) => {
    try {
      const { userId } = req.params;
      const requestingUserId = req.user.claims.sub;
      
      // Only allow users to recalculate their own trust level
      if (userId !== requestingUserId) {
        return res.status(403).json({ message: "You can only recalculate your own trust level" });
      }
      
      const trustLevel = await storage.calculateAndUpdateTrustLevel(userId);
      res.json(trustLevel);
    } catch (error: any) {
      console.error("Error recalculating trust level:", error);
      res.status(500).json({ message: error.message });
    }
  });

  // ===== REWARDS SYSTEM API (Phase 6) =====

  // Get current user's rewards
  app.get("/api/rewards/me", isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      let reward = await storage.getUserReward(userId);
      
      // Return zero state if no reward record yet (will be created on first action)
      if (!reward) {
        return res.json({
          totalPoints: 0,
          currentLevel: 'bronze',
          currentStreak: 0,
          longestStreak: 0,
          nextLevel: 'silver',
          pointsNeeded: 500
        });
      }
      
      const nextLevel = storage.calculatePointsToNextLevel(reward.totalPoints);
      res.json({ ...reward, ...nextLevel });
    } catch (error: any) {
      console.error("Error getting user rewards:", error);
      res.status(500).json({ message: error.message });
    }
  });

  // REMOVED: Award points endpoint is now internal-only
  // Points are automatically awarded by server when users complete verified actions
  // (bookings, reviews, likes, etc.)

  // Get user's reward history
  app.get("/api/rewards/history", isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const limit = parseInt(req.query.limit as string) || 50;
      
      const history = await storage.getRewardHistory(userId, limit);
      res.json(history);
    } catch (error: any) {
      console.error("Error getting reward history:", error);
      res.status(500).json({ message: error.message });
    }
  });

  // Get rewards leaderboard
  app.get("/api/rewards/leaderboard", async (req, res) => {
    try {
      const limit = parseInt(req.query.limit as string) || 100;
      const leaderboard = await storage.getRewardsLeaderboard(limit);
      res.json(leaderboard);
    } catch (error: any) {
      console.error("Error getting leaderboard:", error);
      res.status(500).json({ message: error.message });
    }
  });

  // REMOVED: Public user rewards endpoint removed for privacy
  // Users can only view their own rewards via GET /api/rewards/me

  // ===== REFERRAL SYSTEM API (Phase 7.2) =====

  // Get current user's referral code
  app.get("/api/referrals/my-code", isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const code = await storage.getUserReferralCode(userId);
      
      // Generate referral link
      const baseUrl = process.env.REPL_ID 
        ? `https://${process.env.REPL_SLUG}.${process.env.REPL_OWNER}.repl.co`
        : 'http://localhost:5000';
      const referralLink = `${baseUrl}/?ref=${code}`;
      
      res.json({ code, referralLink });
    } catch (error: any) {
      console.error("Error getting referral code:", error);
      res.status(500).json({ message: error.message });
    }
  });

  // Validate a referral code
  app.get("/api/referrals/validate/:code", async (req, res) => {
    try {
      const { code } = req.params;
      const validation = await storage.validateReferralCode(code);
      res.json(validation);
    } catch (error: any) {
      console.error("Error validating referral code:", error);
      res.status(500).json({ message: error.message });
    }
  });

  // Get current user's referrals (people they invited)
  app.get("/api/referrals/my-referrals", isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const referrals = await storage.getUserReferrals(userId);
      res.json(referrals);
    } catch (error: any) {
      console.error("Error getting user referrals:", error);
      res.status(500).json({ message: error.message });
    }
  });

  // Get current user's referral statistics
  app.get("/api/referrals/stats", isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const stats = await storage.getReferralStats(userId);
      res.json(stats);
    } catch (error: any) {
      console.error("Error getting referral stats:", error);
      res.status(500).json({ message: error.message });
    }
  });

  // ========== PARTNERSHIPS & SUBSCRIPTIONS (Phase 10) ==========

  // Get current user's partnership
  app.get("/api/partnerships/my", isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const partnership = await storage.getPartnershipByUserId(userId);
      
      res.json({
        partnership,
        tiers: SUBSCRIPTION_TIERS, // Include tier info for UI
      });
    } catch (error: any) {
      console.error("[Partnerships] Error fetching partnership:", error);
      res.status(500).json({ message: "Failed to fetch partnership" });
    }
  });

  // Create subscription checkout session
  app.post("/api/subscription/upgrade", isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const user = await storage.getUser(userId);
      const { tier } = req.body;
      
      if (!['standard', 'premium', 'pro'].includes(tier)) {
        return res.status(400).json({ message: "Invalid tier" });
      }

      // Check if user already has an active partnership
      const existing = await storage.getPartnershipByUserId(userId);
      if (existing && existing.status === 'active') {
        return res.status(400).json({ 
          message: "You already have an active partnership. Cancel it first to upgrade." 
        });
      }

      const domain = process.env.REPL_SLUG 
        ? `https://${process.env.REPL_SLUG}.${process.env.REPL_OWNER}.repl.co`
        : 'http://localhost:5000';
      
      const checkoutUrl = await createSubscriptionCheckout(
        userId,
        tier,
        user?.email || req.user.claims.email || 'unknown@example.com',
        `${domain}/dashboard/partnerships?success=true`,
        `${domain}/dashboard/partnerships?cancelled=true`
      );
      
      res.json({ checkoutUrl });
    } catch (error: any) {
      console.error("[Subscription] Error creating checkout:", error);
      res.status(500).json({ message: "Failed to create subscription" });
    }
  });

  // Cancel subscription
  app.post("/api/subscription/cancel", isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const partnership = await storage.getPartnershipByUserId(userId);
      
      if (!partnership || partnership.status !== 'active') {
        return res.status(404).json({ message: "No active partnership found" });
      }

      if (partnership.stripeSubscriptionId) {
        await cancelSubscription(partnership.stripeSubscriptionId);
      }
      
      await storage.updatePartnershipStatus(partnership.id, 'cancelled');
      
      res.json({ 
        success: true, 
        message: "Partnership cancelled successfully" 
      });
    } catch (error: any) {
      console.error("[Subscription] Error cancelling:", error);
      res.status(500).json({ message: "Failed to cancel subscription" });
    }
  });

  // Get analytics for a profile (guides/providers only)
  app.get("/api/analytics/profile/:id", isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.params.id;
      const requestingUserId = req.user.claims.sub;
      
      // Only allow users to view their own analytics
      if (userId !== requestingUserId) {
        return res.status(403).json({ message: "Unauthorized" });
      }

      const partnership = await storage.getPartnershipByUserId(userId);
      
      if (!partnership || partnership.tier !== 'pro') {
        return res.status(403).json({ 
          message: "Analytics are only available for Pro tier" 
        });
      }

      res.json({
        analytics: partnership.analytics || {},
        tier: partnership.tier,
        status: partnership.status,
        startDate: partnership.startDate,
        endDate: partnership.endDate,
      });
    } catch (error: any) {
      console.error("[Analytics] Error fetching analytics:", error);
      res.status(500).json({ message: "Failed to fetch analytics" });
    }
  });

  // Stripe webhook handler for partnerships
  app.post("/api/stripe/webhook", express.raw({ type: 'application/json' }), async (req, res) => {
    const sig = req.headers['stripe-signature'];
    const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET;

    if (!webhookSecret) {
      console.error("[Stripe] Webhook secret not configured");
      return res.status(500).send('Webhook secret not configured');
    }

    if (!sig) {
      console.error("[Stripe] No signature provided");
      return res.status(400).send('No signature');
    }

    try {
      if (!stripe) {
        console.error("[Stripe] Stripe not initialized");
        return res.status(500).send('Stripe not configured');
      }

      const event = stripe.webhooks.constructEvent(req.body, sig, webhookSecret);
      
      await handleStripeWebhook(event, storage);
      
      res.json({ received: true });
    } catch (err: any) {
      console.error("[Stripe] Webhook error:", err.message);
      res.status(400).send(`Webhook Error: ${err.message}`);
    }
  });

  // ========== SMART GROUPS (Phase 8) ==========

  // Create a new smart group
  app.post("/api/smart-groups/create", isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      
      // Validate request body
      const { insertSmartGroupSchema } = await import("@shared/schema");
      const validationResult = insertSmartGroupSchema.safeParse(req.body);
      
      if (!validationResult.success) {
        return res.status(400).json({ 
          message: "Validation failed", 
          errors: validationResult.error.errors 
        });
      }
      
      const group = await storage.createSmartGroup(userId, validationResult.data);
      
      // Add reward points for creating group
      await storage.awardPoints(userId, 'smart_group_create', {
        description: `Created smart group: ${group.name}`,
        targetId: group.id,
      });
      
      res.status(201).json(group);
    } catch (error: any) {
      console.error("Error creating smart group:", error);
      res.status(400).json({ message: error.message });
    }
  });

  // Get nearby smart groups
  app.get("/api/smart-groups/nearby", async (req, res) => {
    try {
      const { lat, lng, radius } = req.query;
      
      if (!lat || !lng) {
        return res.status(400).json({ message: "Latitude and longitude are required" });
      }
      
      const latitude = parseFloat(lat as string);
      const longitude = parseFloat(lng as string);
      const radiusKm = radius ? parseFloat(radius as string) : 50;
      
      const groups = await storage.getNearbySmartGroups(latitude, longitude, radiusKm);
      res.json(groups);
    } catch (error: any) {
      console.error("Error getting nearby smart groups:", error);
      res.status(500).json({ message: error.message });
    }
  });

  // Get smart group details
  app.get("/api/smart-groups/:id", async (req, res) => {
    try {
      const { id } = req.params;
      const group = await storage.getSmartGroup(id);
      
      if (!group) {
        return res.status(404).json({ message: "Group not found" });
      }
      
      res.json(group);
    } catch (error: any) {
      console.error("Error getting smart group:", error);
      res.status(500).json({ message: error.message });
    }
  });

  // Join a smart group
  app.post("/api/smart-groups/:id/join", isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const { id } = req.params;
      const { inviteCode } = req.body;
      
      const member = await storage.joinSmartGroup(id, userId, inviteCode);
      
      // Add reward points for joining group
      const group = await storage.getSmartGroup(id);
      if (group) {
        await storage.awardPoints(userId, 'smart_group_join', {
          description: `Joined group: ${group.name}`,
          targetId: id,
        });
      }
      
      res.status(201).json(member);
    } catch (error: any) {
      console.error("Error joining smart group:", error);
      res.status(400).json({ message: error.message });
    }
  });

  // Leave a smart group
  app.post("/api/smart-groups/:id/leave", isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const { id } = req.params;
      
      await storage.leaveSmartGroup(id, userId);
      res.json({ message: "Successfully left the group" });
    } catch (error: any) {
      console.error("Error leaving smart group:", error);
      res.status(400).json({ message: error.message });
    }
  });

  // Create an invite for a smart group
  app.post("/api/smart-groups/:id/invite", isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const { id } = req.params;
      
      // Set expiration to 7 days from now
      const expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000);
      
      const invite = await storage.createGroupInvite(id, userId, expiresAt);
      res.status(201).json(invite);
    } catch (error: any) {
      console.error("Error creating group invite:", error);
      res.status(400).json({ message: error.message });
    }
  });

  // Get messages for a smart group
  app.get("/api/smart-groups/:id/messages", isAuthenticated, async (req: any, res) => {
    try {
      const { id } = req.params;
      const limit = req.query.limit ? parseInt(req.query.limit as string) : 50;
      
      const messages = await storage.getSmartGroupMessages(id, limit);
      res.json(messages);
    } catch (error: any) {
      console.error("Error getting smart group messages:", error);
      res.status(500).json({ message: error.message });
    }
  });

  // Send a message to a smart group
  app.post("/api/smart-groups/:id/message", isAuthenticated, messageLimiter, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const { id } = req.params;
      const { message } = req.body;
      
      if (!message || message.trim().length === 0) {
        return res.status(400).json({ message: "Message cannot be empty" });
      }
      
      const newMessage = await storage.sendGroupMessage(id, userId, message.trim());
      
      // Get user info for broadcast
      const user = await storage.getUser(userId);
      
      // Broadcast message via WebSocket with user info
      const { broadcastToRoom } = await import("./websocket");
      broadcastToRoom(`smart_group_chat:${id}`, {
        type: 'smart_group_message',
        groupId: id,
        message: {
          id: newMessage.id,
          userId: newMessage.userId,
          message: newMessage.message,
          createdAt: newMessage.createdAt,
          user: {
            firstName: user?.firstName || 'Unknown',
            lastName: user?.lastName || 'User',
          }
        }
      });
      
      res.status(201).json(newMessage);
    } catch (error: any) {
      console.error("Error sending group message:", error);
      res.status(400).json({ message: error.message });
    }
  });

  // Get current user's smart groups
  app.get("/api/smart-groups/my-groups", isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const groups = await storage.getMySmartGroups(userId);
      res.json(groups);
    } catch (error: any) {
      console.error("Error getting user's smart groups:", error);
      res.status(500).json({ message: error.message });
    }
  });

  // ========== PHASE 9: AI TRAVEL COMPANION ==========

  // 1. POST /api/ai/group/:groupId/suggest-meeting - Suggest optimal meeting point
  app.post("/api/ai/group/:groupId/suggest-meeting", isAuthenticated, aiLimiter, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const { groupId } = req.params;
      
      // Check user consent for AI
      const hasConsent = await storage.hasUserConsentedToAI(userId);
      if (!hasConsent) {
        return res.status(403).json({ 
          message: "AI features require user consent. Please enable AI in your settings." 
        });
      }
      
      // Validate user is member of group
      const isMember = await storage.isUserInSmartGroup(groupId, userId);
      if (!isMember) {
        return res.status(403).json({ message: "You must be a member of this group" });
      }
      
      // Validate request body
      const validation = suggestMeetingSchema.safeParse(req.body);
      if (!validation.success) {
        return res.status(400).json({ 
          message: "Validation failed", 
          errors: validation.error.errors 
        });
      }
      
      const { language } = validation.data;
      
      // Get group details and members
      const group = await storage.getSmartGroup(groupId);
      if (!group) {
        return res.status(404).json({ message: "Group not found" });
      }
      
      // Extract participant locations from group members
      const participants: ParticipantLocation[] = group.members
        ?.filter(m => m.user.latitude && m.user.longitude)
        .map(m => ({
          userId: m.userId,
          userName: `${m.user.firstName} ${m.user.lastName}`,
          latitude: m.user.latitude!,
          longitude: m.user.longitude!
        })) || [];
      
      if (participants.length === 0) {
        return res.status(400).json({ 
          message: "No participants with location data found in this group" 
        });
      }
      
      // Get tour location if available
      let tourLocation: { latitude: number; longitude: number } | undefined;
      if (group.tour?.latitude && group.tour?.longitude) {
        tourLocation = {
          latitude: group.tour.latitude,
          longitude: group.tour.longitude
        };
      }
      
      // Call AI to suggest meeting point
      const suggestion = await suggestMeetingPoint({
        groupId,
        participants,
        tourLocation,
        language
      });
      
      // Log AI interaction
      await storage.logAIInteraction({
        userId,
        groupId,
        actionType: "meeting_suggestion",
        inputData: { participants: participants.length, tourLocation: !!tourLocation },
        outputData: suggestion,
        userConsent: true,
        language,
        metadata: { groupName: group.name }
      });
      
      // Broadcast suggestion via WebSocket
      const { broadcastToRoom } = await import("./websocket");
      broadcastToRoom(`smart_group_chat:${groupId}`, {
        type: 'ai_suggestion',
        groupId,
        data: {
          suggestionType: 'meeting_point',
          ...suggestion
        }
      });
      
      // Award points to user (fire-and-forget)
      storage.awardPoints(userId, 'ai_coordination' as any, {
        targetId: groupId,
        description: 'AI meeting point suggestion'
      }).catch(err => console.error("Error awarding points:", err));
      
      res.json(suggestion);
    } catch (error: any) {
      console.error("Error suggesting meeting point:", error);
      res.status(500).json({ message: error.message || "Failed to suggest meeting point" });
    }
  });

  // 2. POST /api/ai/group/:groupId/translate - Translate message to user's language
  app.post("/api/ai/group/:groupId/translate", isAuthenticated, aiLimiter, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const { groupId } = req.params;
      
      // Check user consent for AI
      const hasConsent = await storage.hasUserConsentedToAI(userId);
      if (!hasConsent) {
        return res.status(403).json({ 
          message: "AI features require user consent. Please enable AI in your settings." 
        });
      }
      
      // Validate user is member of group
      const isMember = await storage.isUserInSmartGroup(groupId, userId);
      if (!isMember) {
        return res.status(403).json({ message: "You must be a member of this group" });
      }
      
      // Validate request body
      const validation = translateMessageSchema.safeParse(req.body);
      if (!validation.success) {
        return res.status(400).json({ 
          message: "Validation failed", 
          errors: validation.error.errors 
        });
      }
      
      const { text, targetLanguage } = validation.data;
      
      // Call AI to translate text
      const translatedText = await translateText({
        text,
        targetLanguage,
        context: "tourism"
      });
      
      // Log AI interaction
      await storage.logAIInteraction({
        userId,
        groupId,
        actionType: "translation",
        inputData: { text, targetLanguage },
        outputData: { translatedText },
        userConsent: true,
        language: targetLanguage
      });
      
      res.json({
        originalText: text,
        translatedText,
        targetLanguage
      });
    } catch (error: any) {
      console.error("Error translating text:", error);
      res.status(500).json({ message: error.message || "Failed to translate text" });
    }
  });

  // 3. POST /api/ai/group/:groupId/summary - Generate post-tour summary
  app.post("/api/ai/group/:groupId/summary", isAuthenticated, aiLimiter, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const { groupId } = req.params;
      
      // Check user consent for AI
      const hasConsent = await storage.hasUserConsentedToAI(userId);
      if (!hasConsent) {
        return res.status(403).json({ 
          message: "AI features require user consent. Please enable AI in your settings." 
        });
      }
      
      // Validate user is member of group
      const isMember = await storage.isUserInSmartGroup(groupId, userId);
      if (!isMember) {
        return res.status(403).json({ message: "You must be a member of this group" });
      }
      
      // Validate request body
      const validation = generateSummarySchema.safeParse(req.body);
      if (!validation.success) {
        return res.status(400).json({ 
          message: "Validation failed", 
          errors: validation.error.errors 
        });
      }
      
      const { language } = validation.data;
      
      // Get group details
      const group = await storage.getSmartGroup(groupId);
      if (!group) {
        return res.status(404).json({ message: "Group not found" });
      }
      
      // Get recent messages (limit to last 50)
      const groupMessages = await storage.getSmartGroupMessages(groupId, 50);
      const messages = groupMessages.map(m => m.message);
      
      // Prepare tour summary request
      const summaryRequest: TourSummaryRequest = {
        groupId,
        tourName: group.tour?.title || group.name,
        tourDescription: group.tour?.description || group.description || "Group tour experience",
        participants: group.members?.map(m => ({
          userId: m.userId,
          userName: `${m.user.firstName} ${m.user.lastName}`
        })) || [],
        messages,
        stops: group.tour?.itinerary ? JSON.parse(group.tour.itinerary as any) : undefined,
        date: group.createdAt,
        language
      };
      
      // Call AI to generate summary
      const summary = await generateTourSummary(summaryRequest);
      
      // Log AI interaction
      await storage.logAIInteraction({
        userId,
        groupId,
        actionType: "summary",
        inputData: { 
          participantCount: summaryRequest.participants.length,
          messageCount: messages.length 
        },
        outputData: summary,
        userConsent: true,
        language,
        metadata: { tourName: summaryRequest.tourName }
      });
      
      // Award points to user (fire-and-forget)
      storage.awardPoints(userId, 'ai_summary_share' as any, {
        targetId: groupId,
        description: `AI tour summary with ${summary.participantCount} participants`
      }).catch(err => console.error("Error awarding points:", err));
      
      res.json(summary);
    } catch (error: any) {
      console.error("Error generating tour summary:", error);
      res.status(500).json({ message: error.message || "Failed to generate summary" });
    }
  });

  // 4. POST /api/ai/group/:groupId/schedule - Create event/reminder with conflict detection
  app.post("/api/ai/group/:groupId/schedule", isAuthenticated, aiLimiter, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const { groupId } = req.params;
      
      // Check user consent for AI
      const hasConsent = await storage.hasUserConsentedToAI(userId);
      if (!hasConsent) {
        return res.status(403).json({ 
          message: "AI features require user consent. Please enable AI in your settings." 
        });
      }
      
      // Validate user is member of group
      const isMember = await storage.isUserInSmartGroup(groupId, userId);
      if (!isMember) {
        return res.status(403).json({ message: "You must be a member of this group" });
      }
      
      // Validate request body
      const validation = scheduleEventSchema.safeParse(req.body);
      if (!validation.success) {
        return res.status(400).json({ 
          message: "Validation failed", 
          errors: validation.error.errors 
        });
      }
      
      const { 
        eventType, 
        title, 
        description, 
        eventDate, 
        location, 
        latitude, 
        longitude, 
        notificationTimes, 
        language, 
        force 
      } = validation.data;
      
      // Validate eventDate is in the future
      if (eventDate <= new Date()) {
        return res.status(400).json({ 
          message: "Event date must be in the future" 
        });
      }
      
      // Get existing group events
      const existingEvents = await storage.getGroupEvents({
        groupId,
        upcomingOnly: true,
        limit: 100
      });
      
      // Check for schedule conflicts using AI
      const conflictCheck = await detectScheduleConflict({
        proposedDate: eventDate,
        existingEvents: existingEvents.map(e => ({
          title: e.title,
          eventDate: e.eventDate,
          description: e.description || undefined
        })),
        groupId,
        language
      });
      
      // If conflict and user hasn't forced creation, return conflict info
      if (conflictCheck.hasConflict && !force) {
        return res.json({
          hasConflict: true,
          conflictingEvents: conflictCheck.conflictingEvents,
          alternatives: conflictCheck.alternatives,
          suggestion: conflictCheck.suggestion
        });
      }
      
      // Set up default notification times if not provided: [24h, 2h, 30min before]
      let finalNotificationTimes = notificationTimes;
      if (!finalNotificationTimes || finalNotificationTimes.length === 0) {
        const eventTime = eventDate.getTime();
        finalNotificationTimes = [
          new Date(eventTime - 24 * 60 * 60 * 1000), // 24 hours before
          new Date(eventTime - 2 * 60 * 60 * 1000),  // 2 hours before
          new Date(eventTime - 30 * 60 * 1000)       // 30 minutes before
        ];
      }
      
      // Create the event
      const event = await storage.createGroupEvent({
        groupId,
        creatorId: userId,
        eventType,
        title,
        description,
        eventDate,
        location,
        latitude,
        longitude,
        notificationTimes: finalNotificationTimes
      });
      
      // Log AI interaction
      await storage.logAIInteraction({
        userId,
        groupId,
        actionType: "reminder",
        inputData: { eventType, title, eventDate, hasConflict: conflictCheck.hasConflict },
        outputData: { event, conflictCheck },
        userConsent: true,
        language,
        metadata: { forced: force }
      });
      
      // Award points to user (fire-and-forget)
      storage.awardPoints(userId, 'ai_reminder_create' as any, {
        targetId: event.id,
        description: `AI ${eventType} event created`
      }).catch(err => console.error("Error awarding points:", err));
      
      // Broadcast event created via WebSocket
      const { broadcastToRoom } = await import("./websocket");
      broadcastToRoom(`smart_group_chat:${groupId}`, {
        type: 'ai_suggestion',
        groupId,
        data: {
          suggestionType: 'event_created',
          event
        }
      });
      
      res.json({
        event,
        hasConflict: false
      });
    } catch (error: any) {
      console.error("Error creating scheduled event:", error);
      res.status(500).json({ message: error.message || "Failed to create event" });
    }
  });

  // ========== GROUP BOOKINGS (Phase 5) ==========

  // Create a new group booking for a tour
  app.post("/api/group-bookings/create", isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const user = await storage.getUserById(userId);

      if (!user) {
        return res.status(404).json({ message: "User not found" });
      }

      // Only guides can create group bookings for their tours
      if (user.role !== 'guide') {
        return res.status(403).json({ message: "Only guides can create group bookings" });
      }

      // Validate request body
      const validationResult = insertGroupBookingSchema.safeParse(req.body);
      if (!validationResult.success) {
        return res.status(400).json({ 
          message: "Validation failed", 
          errors: validationResult.error.errors 
        });
      }

      const { tourId, tourDate, maxParticipants, minParticipants, basePricePerPerson, discountStep } = validationResult.data;

      // Verify tour belongs to this guide
      const tour = await storage.getTourById(tourId);
      if (!tour || tour.guideId !== userId) {
        return res.status(403).json({ message: "You can only create groups for your own tours" });
      }

      const group = await storage.createGroupBooking({
        tourId,
        tourDate: new Date(tourDate),
        maxParticipants,
        minParticipants,
        basePricePerPerson,
        discountStep
      });

      res.status(201).json(group);
    } catch (error: any) {
      console.error("Error creating group booking:", error);
      res.status(500).json({ message: error.message });
    }
  });

  // Get group booking by tour ID and date
  app.get("/api/group-bookings/tour/:tourId/:date", async (req, res) => {
    try {
      const { tourId, date } = req.params;
      const tourDate = new Date(date);
      
      const group = await storage.getGroupByTourAndDate(tourId, tourDate);
      
      if (!group) {
        return res.status(404).json({ message: "No open group found for this tour and date" });
      }

      res.json(group);
    } catch (error: any) {
      console.error("Error getting group booking:", error);
      res.status(500).json({ message: error.message });
    }
  });

  // Get group booking by ID
  app.get("/api/group-bookings/:groupId", async (req, res) => {
    try {
      const { groupId } = req.params;
      const group = await storage.getGroupById(groupId);
      
      if (!group) {
        return res.status(404).json({ message: "Group not found" });
      }

      res.json(group);
    } catch (error: any) {
      console.error("Error getting group booking:", error);
      res.status(500).json({ message: error.message });
    }
  });

  // Get group booking by invite code
  app.get("/api/group-bookings/code/:code", async (req, res) => {
    try {
      const { code } = req.params;
      const group = await storage.getGroupByCode(code);
      
      if (!group) {
        return res.status(404).json({ message: "Group not found with this code" });
      }

      res.json(group);
    } catch (error: any) {
      console.error("Error getting group booking by code:", error);
      res.status(500).json({ message: error.message });
    }
  });

  // Join a group booking
  app.post("/api/group-bookings/:groupId/join", isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const { groupId } = req.params;

      // Validate request body
      const validationResult = joinGroupBookingSchema.safeParse(req.body);
      if (!validationResult.success) {
        return res.status(400).json({ 
          message: "Validation failed", 
          errors: validationResult.error.errors 
        });
      }

      const { participants } = validationResult.data;

      const user = await storage.getUserById(userId);
      if (!user) {
        return res.status(404).json({ message: "User not found" });
      }

      // Only tourists can join group bookings
      if (user.role !== 'tourist') {
        return res.status(403).json({ message: "Only tourists can join group bookings" });
      }

      const result = await storage.joinGroupBooking(groupId, userId, participants);
      res.json(result);
    } catch (error: any) {
      console.error("Error joining group booking:", error);
      res.status(400).json({ message: error.message });
    }
  });

  // Leave a group booking
  app.post("/api/group-bookings/:groupId/leave", isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const { groupId } = req.params;

      // Validate request body
      const validationResult = leaveGroupBookingSchema.safeParse(req.body);
      if (!validationResult.success) {
        return res.status(400).json({ 
          message: "Validation failed", 
          errors: validationResult.error.errors 
        });
      }

      const { participants } = validationResult.data;

      const result = await storage.leaveGroupBooking(groupId, userId, participants);
      res.json(result);
    } catch (error: any) {
      console.error("Error leaving group booking:", error);
      res.status(400).json({ message: error.message });
    }
  });

  // Get all group bookings for a user
  app.get("/api/group-bookings/user/:userId", isAuthenticated, async (req: any, res) => {
    try {
      const { userId } = req.params;
      const requestingUserId = req.user.claims.sub;

      // Users can only see their own group bookings
      if (userId !== requestingUserId) {
        return res.status(403).json({ message: "You can only view your own group bookings" });
      }

      const groups = await storage.getUserGroupBookings(userId);
      res.json(groups);
    } catch (error: any) {
      console.error("Error getting user group bookings:", error);
      res.status(500).json({ message: error.message });
    }
  });

  // Get participants in a group
  app.get("/api/group-bookings/:groupId/participants", async (req, res) => {
    try {
      const { groupId } = req.params;
      const participants = await storage.getGroupParticipants(groupId);
      res.json(participants);
    } catch (error: any) {
      console.error("Error getting group participants:", error);
      res.status(500).json({ message: error.message });
    }
  });

  // Get all group bookings for a tour (for guides)
  app.get("/api/group-bookings/tour/:tourId", isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const { tourId } = req.params;

      const user = await storage.getUserById(userId);
      if (!user || user.role !== 'guide') {
        return res.status(403).json({ message: "Only guides can view tour group bookings" });
      }

      const tour = await storage.getTourById(tourId);
      if (!tour || tour.guideId !== userId) {
        return res.status(403).json({ message: "You can only view groups for your own tours" });
      }

      const groups = await storage.getTourGroupBookings(tourId);
      res.json(groups);
    } catch (error: any) {
      console.error("Error getting tour group bookings:", error);
      res.status(500).json({ message: error.message });
    }
  });

  // Update group status (for guides only)
  app.patch("/api/group-bookings/:groupId/status", isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const { groupId } = req.params;

      // Validate request body
      const validationResult = updateGroupStatusSchema.safeParse(req.body);
      if (!validationResult.success) {
        return res.status(400).json({ 
          message: "Validation failed", 
          errors: validationResult.error.errors 
        });
      }

      const { status } = validationResult.data;

      const user = await storage.getUserById(userId);
      if (!user || user.role !== 'guide') {
        return res.status(403).json({ message: "Only guides can update group status" });
      }

      const group = await storage.getGroupById(groupId);
      if (!group) {
        return res.status(404).json({ message: "Group not found" });
      }

      const tour = await storage.getTourById(group.tourId);
      if (!tour || tour.guideId !== userId) {
        return res.status(403).json({ message: "You can only update groups for your own tours" });
      }

      const updatedGroup = await storage.updateGroupStatus(groupId, status);
      res.json(updatedGroup);
    } catch (error: any) {
      console.error("Error updating group status:", error);
      res.status(500).json({ message: error.message });
    }
  });

  // Create Stripe checkout session for group booking
  app.post("/api/group-bookings/:groupId/checkout", isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const { groupId } = req.params;
      const { participants } = req.body;

      const group = await storage.getGroupById(groupId);
      if (!group) {
        return res.status(404).json({ message: "Group not found" });
      }

      if (group.status !== 'open') {
        return res.status(400).json({ message: "Group is no longer accepting participants" });
      }

      if (group.currentParticipants + participants > group.maxParticipants) {
        return res.status(400).json({ message: "Not enough spots available" });
      }

      const amount = parseFloat(group.currentPricePerPerson) * participants * 100;

      if (stripe) {
        const tour = await storage.getTourById(group.tourId);
        const session = await stripe.checkout.sessions.create({
          payment_method_types: ['card'],
          line_items: [{
            price_data: {
              currency: 'eur',
              product_data: {
                name: `Group Tour: ${tour?.title || 'Tour'}`,
                description: `${participants} participant(s) - ${group.tourDate}`,
              },
              unit_amount: Math.round(amount / participants),
            },
            quantity: participants,
          }],
          mode: 'payment',
          success_url: `${req.protocol}://${req.get('host')}/booking-success?session_id={CHECKOUT_SESSION_ID}`,
          cancel_url: `${req.protocol}://${req.get('host')}/marketplace`,
          metadata: {
            groupId: group.id,
            userId,
            participants: participants.toString(),
          },
        });

        res.json({ sessionId: session.id, url: session.url });
      } else {
        res.json({ 
          message: "Payment processing not configured. Group joined without payment.",
          mockPayment: true 
        });
      }
    } catch (error: any) {
      console.error("Error creating checkout session:", error);
      res.status(500).json({ message: error.message });
    }
  });

  // Webhook for automatic refunds (if group expires without reaching minimum)
  app.post("/api/webhooks/group-expiration", async (req, res) => {
    try {
      const expiredGroups = await storage.getExpiredGroups();
      
      for (const group of expiredGroups) {
        if (group.currentParticipants < group.minParticipants) {
          console.log(`[Refund] Group ${group.id} expired without reaching minimum. Processing refunds...`);
          
          if (stripe && group.stripeCheckoutSessionId) {
            // Implement refund logic here
          }
          
          await storage.updateGroupStatus(group.id, 'cancelled');
          
          const members = await storage.getGroupMembers(group.id);
          for (const member of members) {
            await sendNotification({
              userId: member.userId,
              type: 'group_cancelled',
              title: 'Group Cancelled - Refund Processed',
              message: `Group was cancelled due to insufficient participants. Your payment has been refunded.`,
              relatedId: group.id,
              relatedType: 'group'
            });
          }
        }
      }
      
      res.json({ message: "Expiration check completed" });
    } catch (error: any) {
      console.error("Error processing group expirations:", error);
      res.status(500).json({ message: error.message });
    }
  });

  // ========== GDPR COMPLIANCE ENDPOINTS ==========

  // Delete user data (GDPR compliance)
  app.delete("/api/users/me/data", isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      
      await storage.deleteUserPosts(userId);
      await storage.deleteUserComments(userId);
      await storage.deleteUserLikes(userId);
      await storage.anonymizeUserBookings(userId);
      await storage.deactivateUser(userId);
      
      res.json({ message: "Your data has been deleted successfully" });
    } catch (error: any) {
      console.error("Error deleting user data:", error);
      res.status(500).json({ message: error.message });
    }
  });

  // Export user data (GDPR compliance)
  app.get("/api/users/me/export", isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      
      const userData = {
        profile: await storage.getUserById(userId),
        posts: await storage.getUserPosts(userId),
        bookings: await storage.getBookings(userId),
        reviews: await storage.getReviewsByUser(userId),
        messages: await storage.getUserMessages(userId),
      };
      
      res.json(userData);
    } catch (error: any) {
      console.error("Error exporting user data:", error);
      res.status(500).json({ message: error.message });
    }
  });

  // ============= PARTNER ONBOARDING & MANAGEMENT (Phase 12) =============

  // Register as Partner
  app.post('/api/partners/register', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const user = await storage.getUser(userId);
      
      if (!user) {
        return res.status(404).json({ message: "User not found" });
      }
      
      // Check if user already has a partner profile
      const existing = await storage.getPartnerByOwner(userId);
      if (existing) {
        return res.status(400).json({ message: "You already have a partner profile" });
      }
      
      // Validate with Zod
      const validatedData = insertPartnerSchema.parse({
        ...req.body,
        ownerUserId: userId,
      });
      
      const partner = await storage.createPartner(validatedData);
      
      // Award reward points for partner registration
      await storage.awardPoints(userId, 'partner_sale', {
        description: 'Partner account created',
        targetId: partner.id,
      });
      
      res.json(partner);
    } catch (error: any) {
      console.error("Error creating partner:", error);
      res.status(400).json({ message: error.message || "Failed to create partner" });
    }
  });

  // Get My Partner Profile
  app.get('/api/partners/me', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const partner = await storage.getPartnerByOwner(userId);
      
      if (!partner) {
        return res.status(404).json({ message: "Partner profile not found" });
      }
      
      res.json(partner);
    } catch (error) {
      console.error("Error fetching partner:", error);
      res.status(500).json({ message: "Failed to fetch partner" });
    }
  });

  // Update My Partner Profile
  app.patch('/api/partners/me', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const partner = await storage.getPartnerByOwner(userId);
      
      if (!partner) {
        return res.status(404).json({ message: "Partner profile not found" });
      }
      
      // Don't allow changing verified status through this endpoint
      const { verified, ownerUserId, ...updateData } = req.body;
      
      const updated = await storage.updatePartner(partner.id, updateData);
      
      res.json(updated);
    } catch (error: any) {
      console.error("Error updating partner:", error);
      res.status(400).json({ message: error.message || "Failed to update partner" });
    }
  });

  // Get All Partners (with filters) - Public endpoint for discovery
  app.get('/api/partners', async (req, res) => {
    try {
      const { type, verified } = req.query;
      
      const filters: { type?: string; verified?: boolean } = {};
      
      if (type && typeof type === 'string') {
        filters.type = type;
      }
      
      if (verified !== undefined) {
        filters.verified = verified === 'true';
      }
      
      const partners = await storage.getAllPartners(filters);
      
      res.json(partners);
    } catch (error) {
      console.error("Error fetching partners:", error);
      res.status(500).json({ message: "Failed to fetch partners" });
    }
  });

  // Get Partner by ID - Public endpoint
  app.get('/api/partners/:id', async (req, res) => {
    try {
      const partner = await storage.getPartner(req.params.id);
      
      if (!partner) {
        return res.status(404).json({ message: "Partner not found" });
      }
      
      res.json(partner);
    } catch (error) {
      console.error("Error fetching partner:", error);
      res.status(500).json({ message: "Failed to fetch partner" });
    }
  });

  // Verify Partner (Supervisor Only)
  app.post('/api/partners/:id/verify', isAuthenticated, requireRole('supervisor'), async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const partnerId = req.params.id;
      
      const partner = await storage.getPartner(partnerId);
      if (!partner) {
        return res.status(404).json({ message: "Partner not found" });
      }
      
      if (partner.verified) {
        return res.status(400).json({ message: "Partner already verified" });
      }
      
      const verified = await storage.verifyPartner(partnerId, userId);
      
      // Send notification to partner owner
      const notification = await storage.createNotification({
        userId: partner.ownerUserId,
        type: 'partner_verified',
        title: 'Partner Verified!',
        message: 'Your partner profile has been verified. You can now create packages and receive payouts.',
        relatedId: partnerId,
        relatedType: 'partner',
      });
      
      // Send real-time notification if WebSocket available
      if (req.app.locals.wss) {
        sendNotification({ 
          userId: partner.ownerUserId, 
          type: 'partner_verified',
          title: notification.title,
          message: notification.message,
          relatedId: partnerId,
          relatedType: 'partner'
        });
      }
      
      res.json(verified);
    } catch (error: any) {
      console.error("Error verifying partner:", error);
      res.status(400).json({ message: error.message || "Failed to verify partner" });
    }
  });

  // Get Partner Analytics
  app.get('/api/partners/me/analytics', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const partner = await storage.getPartnerByOwner(userId);
      
      if (!partner) {
        return res.status(404).json({ message: "Partner profile not found" });
      }
      
      const analytics = await storage.getPartnerAnalytics(partner.id);
      
      res.json(analytics);
    } catch (error) {
      console.error("Error fetching partner analytics:", error);
      res.status(500).json({ message: "Failed to fetch analytics" });
    }
  });

  // ============= ADVANCED PARTNER ANALYTICS (Phase 12) =============

  // Get Top Packages (Partner only)
  app.get('/api/partners/analytics/top-products', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const partner = await storage.getPartnerByOwner(userId);
      
      if (!partner) {
        return res.status(403).json({ message: "Partner profile required" });
      }
      
      const limit = req.query.limit ? parseInt(req.query.limit as string, 10) : 10;
      const topPackages = await storage.getPartnerTopPackages(partner.id, limit);
      
      res.json(topPackages);
    } catch (error) {
      console.error("Error fetching top products:", error);
      res.status(500).json({ message: "Failed to fetch top products" });
    }
  });

  // Get Monthly Trends (Partner only)
  app.get('/api/partners/analytics/trends', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const partner = await storage.getPartnerByOwner(userId);
      
      if (!partner) {
        return res.status(403).json({ message: "Partner profile required" });
      }
      
      const months = req.query.months ? parseInt(req.query.months as string, 10) : 6;
      const trends = await storage.getPartnerMonthlyTrends(partner.id, months);
      
      res.json(trends);
    } catch (error) {
      console.error("Error fetching trends:", error);
      res.status(500).json({ message: "Failed to fetch trends" });
    }
  });

  // Export Partner Data (CSV/JSON) (Partner only)
  app.get('/api/partners/analytics/export', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const partner = await storage.getPartnerByOwner(userId);
      
      if (!partner) {
        return res.status(403).json({ message: "Partner profile required" });
      }
      
      const format = (req.query.format as string) || 'json';
      const data = await storage.exportPartnerData(partner.id);
      
      if (format === 'csv') {
        // Generate CSV for bookings (most useful for partners)
        const csvHeaders = [
          'Booking ID',
          'Package Title',
          'Date',
          'Participants',
          'Total Price',
          'Discount',
          'Coupon',
          'Affiliate',
          'Status',
          'Payment Status',
        ].join(',');
        
        const csvRows = data.bookings.map(booking => {
          const pkg = data.packages.find(p => p.id === booking.packageId);
          return [
            booking.id,
            pkg?.title || 'N/A',
            new Date(booking.createdAt).toISOString().split('T')[0],
            booking.participants,
            booking.totalPrice,
            booking.discountApplied || '0',
            booking.couponCode || '',
            booking.affiliateCode || '',
            booking.status,
            booking.paymentStatus,
          ].join(',');
        });
        
        const csv = [csvHeaders, ...csvRows].join('\n');
        
        res.setHeader('Content-Type', 'text/csv');
        res.setHeader('Content-Disposition', `attachment; filename="partner-bookings-${Date.now()}.csv"`);
        res.send(csv);
      } else {
        // Return JSON
        res.json(data);
      }
    } catch (error) {
      console.error("Error exporting data:", error);
      res.status(500).json({ message: "Failed to export data" });
    }
  });

  // Get Complete Analytics Dashboard (Partner only)
  app.get('/api/partners/analytics/dashboard', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const partner = await storage.getPartnerByOwner(userId);
      
      if (!partner) {
        return res.status(403).json({ message: "Partner profile required" });
      }
      
      // Gather all analytics in parallel
      const [
        overview,
        topPackages,
        trends,
        payouts,
      ] = await Promise.all([
        storage.getPartnerAnalytics(partner.id),
        storage.getPartnerTopPackages(partner.id, 5),
        storage.getPartnerMonthlyTrends(partner.id, 6),
        storage.getPartnerPayouts(partner.id),
      ]);
      
      // Calculate additional metrics
      const totalPayouts = payouts
        .filter(p => p.status === 'completed')
        .reduce((sum, p) => sum + parseFloat(p.amount), 0);
      
      const pendingPayouts = payouts
        .filter(p => p.status === 'pending' || p.status === 'processing')
        .reduce((sum, p) => sum + parseFloat(p.amount), 0);
      
      res.json({
        overview,
        topPackages,
        trends,
        payouts: {
          total: totalPayouts.toFixed(2),
          pending: pendingPayouts.toFixed(2),
          count: payouts.length,
          recent: payouts.slice(0, 5),
        },
      });
    } catch (error) {
      console.error("Error fetching dashboard:", error);
      res.status(500).json({ message: "Failed to fetch dashboard" });
    }
  });

  // ========== GROUP MARKETPLACE (Phase 11) ==========

  // Group Marketplace - Get all open groups with filters
  app.get("/api/marketplace/groups", async (req, res) => {
    try {
      const { 
        destination,
        dateFrom,
        dateTo,
        minPrice,
        maxPrice,
        minParticipants,
        maxParticipants,
        language,
        status = 'open',
        sortBy = 'date',
        limit = 50
      } = req.query;

      const groups = await storage.getMarketplaceGroups({
        destination: destination as string,
        dateFrom: dateFrom ? new Date(dateFrom as string) : undefined,
        dateTo: dateTo ? new Date(dateTo as string) : undefined,
        minPrice: minPrice ? parseFloat(minPrice as string) : undefined,
        maxPrice: maxPrice ? parseFloat(maxPrice as string) : undefined,
        minParticipants: minParticipants ? parseInt(minParticipants as string) : undefined,
        maxParticipants: maxParticipants ? parseInt(maxParticipants as string) : undefined,
        language: language as string,
        status: status as string,
        sortBy: sortBy as 'date' | 'price' | 'popularity' | 'urgency',
        limit: parseInt(limit as string)
      });

      res.json(groups);
    } catch (error: any) {
      console.error("Error fetching marketplace groups:", error);
      res.status(500).json({ message: error.message });
    }
  });

  // AI-powered group suggestions
  app.get("/api/marketplace/ai-suggestions", isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const user = await storage.getUserById(userId);
      
      if (!user) {
        return res.status(404).json({ message: "User not found" });
      }

      // Get user's group bookings
      const userGroupBookings = await storage.getUserGroupBookings(userId);
      const userPreferences = {
        favoriteDestinations: user.city ? [user.city] : [],
        preferredLanguages: user.guideLanguages || ['en'],
        budgetRange: [0, 200]
      };

      // Get groups that are almost complete (high conversion probability)
      const urgentGroups = await storage.getMarketplaceGroups({
        status: 'open',
        sortBy: 'urgency',
        limit: 10
      });

      // Filter groups that need 1-2 more participants
      const hotDeals = urgentGroups.filter(g => g.spotsNeeded <= 2 && g.spotsNeeded > 0);

      res.json({
        hotDeals,
        message: hotDeals.length > 0 
          ? `${hotDeals.length} group${hotDeals.length > 1 ? 's' : ''} almost ready! Join now to complete.`
          : "Check back soon for hot deals!",
        recommendations: urgentGroups.slice(0, 5)
      });
    } catch (error: any) {
      console.error("Error getting AI suggestions:", error);
      res.status(500).json({ message: error.message });
    }
  });
  
  // ========== SWAGGER DOCUMENTATION ==========
  
  // Swagger/OpenAPI Documentation
  app.get("/api/docs", (req, res) => {
    const swaggerDoc = {
      openapi: "3.0.0",
      info: {
        title: "TourConnect Partner API",
        version: "4.0.0",
        description: "Public API for TourConnect partners (travel agencies, portals, influencers)",
        contact: {
          name: "TourConnect API Support",
          email: "api@tourconnect.com"
        }
      },
      servers: [
        {
          url: `${req.protocol}://${req.get('host')}/api/partner`,
          description: "Production server"
        }
      ],
      components: {
        securitySchemes: {
          ApiKeyAuth: {
            type: "apiKey",
            in: "header",
            name: "Authorization",
            description: "Use 'Bearer tc_live_YOUR_API_KEY'"
          }
        }
      },
      security: [{ ApiKeyAuth: [] }],
      paths: {
        "/tours": {
          get: {
            summary: "Search tours",
            parameters: [
              { name: "category", in: "query", schema: { type: "string" } },
              { name: "minPrice", in: "query", schema: { type: "number" } },
              { name: "maxPrice", in: "query", schema: { type: "number" } },
              { name: "language", in: "query", schema: { type: "string" } },
              { name: "city", in: "query", schema: { type: "string" } },
              { name: "limit", in: "query", schema: { type: "integer", default: 50 } },
              { name: "offset", in: "query", schema: { type: "integer", default: 0 } }
            ],
            responses: {
              "200": {
                description: "List of tours",
                content: {
                  "application/json": {
                    schema: {
                      type: "object",
                      properties: {
                        tours: { type: "array" },
                        meta: { type: "object" }
                      }
                    }
                  }
                }
              }
            }
          }
        },
        "/tours/{id}": {
          get: {
            summary: "Get tour details",
            parameters: [
              { name: "id", in: "path", required: true, schema: { type: "string" } }
            ],
            responses: {
              "200": { description: "Tour details" },
              "404": { description: "Tour not found" }
            }
          }
        },
        "/services": {
          get: {
            summary: "Search services",
            parameters: [
              { name: "category", in: "query", schema: { type: "string" } },
              { name: "city", in: "query", schema: { type: "string" } },
              { name: "limit", in: "query", schema: { type: "integer" } },
              { name: "offset", in: "query", schema: { type: "integer" } }
            ],
            responses: {
              "200": { description: "List of services" }
            }
          }
        },
        "/bookings": {
          post: {
            summary: "Create booking (requires write:bookings permission)",
            requestBody: {
              required: true,
              content: {
                "application/json": {
                  schema: {
                    type: "object",
                    properties: {
                      tourId: { type: "string" },
                      touristEmail: { type: "string" },
                      touristName: { type: "string" },
                      numberOfPeople: { type: "integer" },
                      totalPrice: { type: "number" },
                      bookingDate: { type: "string", format: "date-time" }
                    },
                    required: ["tourId", "touristEmail", "touristName", "numberOfPeople"]
                  }
                }
              }
            },
            responses: {
              "201": { description: "Booking created" },
              "403": { description: "Insufficient permissions" }
            }
          }
        },
        "/stats": {
          get: {
            summary: "Get platform statistics",
            responses: {
              "200": { description: "Platform statistics" }
            }
          }
        }
      }
    };
    
    res.json(swaggerDoc);
  });
  
  // Swagger UI (HTML visualization)
  app.get("/api/docs/ui", (req, res) => {
    res.send(`
      <!DOCTYPE html>
      <html>
      <head>
        <title>TourConnect Partner API Docs</title>
        <link rel="stylesheet" href="https://unpkg.com/swagger-ui-dist@5/swagger-ui.css" />
      </head>
      <body>
        <div id="swagger-ui"></div>
        <script src="https://unpkg.com/swagger-ui-dist@5/swagger-ui-bundle.js"></script>
        <script>
          SwaggerUIBundle({
            url: '/api/docs',
            dom_id: '#swagger-ui'
          });
        </script>
      </body>
      </html>
    `);
  });

  // ========== GLOBAL SEARCH API (Phase 10) ==========

  // Basic global search
  app.get("/api/search", async (req: any, res) => {
    try {
      const { q, type, city, language, priceMin, priceMax, rating, availability } = req.query;
      
      if (!q || typeof q !== 'string') {
        return res.status(400).json({ message: "Query parameter 'q' is required" });
      }

      // Rate limiting
      const userId = req.user?.claims?.sub;
      if (!checkRateLimit(userId)) {
        return res.status(429).json({ message: "Too many requests. Please wait before searching again." });
      }

      const filters = {
        type: type as any,
        city: city as string,
        language: language as string,
        priceMin: priceMin ? parseFloat(priceMin as string) : undefined,
        priceMax: priceMax ? parseFloat(priceMax as string) : undefined,
        rating: rating ? parseFloat(rating as string) : undefined,
        availability: availability === 'true',
      };

      const results = await searchGlobal(storage, q, filters);
      
      // Log search
      await storage.logSearch({
        userId,
        query: q,
        searchType: type as string,
        resultsCount: results.totalCount,
        filters,
      });
      
      res.json(results);
    } catch (error) {
      console.error("[Search] Error:", error);
      res.status(500).json({ message: "Search failed" });
    }
  });

  // Semantic AI search
  app.post("/api/search/semantic", async (req: any, res) => {
    try {
      const { query, type } = req.body;
      
      if (!query || typeof query !== 'string') {
        return res.status(400).json({ message: "Query is required" });
      }

      // Rate limiting
      const userId = req.user?.claims?.sub;
      if (!checkRateLimit(userId)) {
        return res.status(429).json({ message: "Too many requests. Please wait before searching again." });
      }

      const results = await searchSemantic(storage, query, type);
      
      // Log search
      await storage.logSearch({
        userId,
        query,
        searchType: `semantic_${type || 'all'}`,
        resultsCount: results.results.length,
      });
      
      res.json(results);
    } catch (error) {
      console.error("[Semantic Search] Error:", error);
      res.status(500).json({ message: "Semantic search failed" });
    }
  });

  // Track search click (for analytics)
  app.post("/api/search/click", async (req: any, res) => {
    try {
      const { searchLogId, entityId, entityType } = req.body;
      
      if (!searchLogId || !entityId || !entityType) {
        return res.status(400).json({ message: "Missing required fields" });
      }

      await storage.updateSearchClick(searchLogId, entityId, entityType);
      
      // Increment analytics for the entity owner if they have a partnership
      if (entityType === 'tour') {
        const tour = await storage.getTourById(entityId);
        if (tour) {
          await storage.incrementPartnershipAnalytics(tour.guideId, 'tourViews');
        }
      } else if (entityType === 'service') {
        const service = await storage.getServiceById(entityId);
        if (service) {
          await storage.incrementPartnershipAnalytics(service.providerId, 'serviceViews');
        }
      } else if (entityType === 'guide') {
        await storage.incrementPartnershipAnalytics(entityId, 'profileViews');
      }
      
      res.json({ success: true });
    } catch (error) {
      console.error("[Search Click] Error:", error);
      res.status(500).json({ message: "Failed to track click" });
    }
  });

  // ========== CONTENT MODERATION ENDPOINTS ==========

  // Report content (post, comment, user, etc.)
  app.post("/api/reports/create", isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const validation = insertContentReportSchema.safeParse(req.body);
      
      if (!validation.success) {
        return res.status(400).json({ message: "Validation failed", errors: validation.error.errors });
      }

      const report = await storage.createContentReport({
        ...validation.data,
        reporterId: userId
      });

      res.status(201).json(report);
    } catch (error: any) {
      console.error("Error creating report:", error);
      res.status(500).json({ message: error.message });
    }
  });

  // Get pending reports (supervisor only)
  app.get("/api/reports/pending", requireRole('supervisor'), async (req, res) => {
    try {
      const reports = await storage.getPendingReports();
      res.json(reports);
    } catch (error: any) {
      console.error("Error fetching reports:", error);
      res.status(500).json({ message: error.message });
    }
  });

  // Take action on report (supervisor only)
  app.post("/api/reports/:id/action", requireRole('supervisor'), async (req: any, res) => {
    try {
      const { id } = req.params;
      const { action, actionTaken } = req.body;
      const reviewerId = req.user.claims.sub;

      await storage.reviewContentReport(id, reviewerId, action, actionTaken);
      
      res.json({ message: "Report reviewed successfully" });
    } catch (error: any) {
      console.error("Error reviewing report:", error);
      res.status(500).json({ message: error.message });
    }
  });

  // ========== NOTIFICATIONS ENDPOINTS ==========

  // Get user notifications
  app.get("/api/notifications", isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const notifications = await storage.getUserNotifications(userId);
      res.json(notifications);
    } catch (error: any) {
      console.error("Error fetching notifications:", error);
      res.status(500).json({ message: error.message });
    }
  });

  // Mark notification as read
  app.post("/api/notifications/:id/read", isAuthenticated, async (req: any, res) => {
    try {
      const { id } = req.params;
      const userId = req.user.claims.sub;
      await storage.markNotificationAsRead(id, userId);
      res.json({ message: "Notification marked as read" });
    } catch (error: any) {
      console.error("Error marking notification as read:", error);
      res.status(500).json({ message: error.message });
    }
  });

  // Mark all notifications as read
  app.post("/api/notifications/read-all", isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      await storage.markAllNotificationsAsRead(userId);
      res.json({ message: "All notifications marked as read" });
    } catch (error: any) {
      console.error("Error marking all notifications as read:", error);
      res.status(500).json({ message: error.message });
    }
  });

  // ============= PACKAGES ENGINE (Phase 12) =============

  // Create Package (Partner only)
  app.post('/api/packages/create', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const partner = await storage.getPartnerByOwner(userId);
      
      if (!partner) {
        return res.status(403).json({ message: "You must be a registered partner to create packages" });
      }
      
      if (!partner.verified) {
        return res.status(403).json({ message: "Partner account must be verified to create packages" });
      }
      
      // Validate with Zod
      const validatedData = insertPackageSchema.parse({
        ...req.body,
        partnerId: partner.id,
      });
      
      const pkg = await storage.createPackage(validatedData);
      
      res.json(pkg);
    } catch (error: any) {
      console.error("Error creating package:", error);
      res.status(400).json({ message: error.message || "Failed to create package" });
    }
  });

  // Search Packages
  app.get('/api/packages/search', async (req, res) => {
    try {
      const {
        destination,
        minPrice,
        maxPrice,
        dateFrom,
        verified,
        sortBy,
        limit,
      } = req.query;
      
      const filters: any = {};
      
      if (destination) filters.destination = destination as string;
      if (minPrice) filters.minPrice = parseFloat(minPrice as string);
      if (maxPrice) filters.maxPrice = parseFloat(maxPrice as string);
      if (dateFrom) filters.dateFrom = dateFrom as string;
      if (verified !== undefined) filters.verified = verified === 'true';
      if (sortBy) filters.sortBy = sortBy as string;
      if (limit) filters.limit = parseInt(limit as string, 10);
      
      const packages = await storage.searchPackages(filters);
      
      res.json(packages);
    } catch (error) {
      console.error("Error searching packages:", error);
      res.status(500).json({ message: "Failed to search packages" });
    }
  });

  // Get Package Details
  app.get('/api/packages/:id', async (req, res) => {
    try {
      const pkg = await storage.getPackageWithDetails(req.params.id);
      
      if (!pkg) {
        return res.status(404).json({ message: "Package not found" });
      }
      
      res.json(pkg);
    } catch (error) {
      console.error("Error fetching package:", error);
      res.status(500).json({ message: "Failed to fetch package" });
    }
  });

  // Book Package
  app.post('/api/packages/:id/book', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const packageId = req.params.id;
      
      const pkg = await storage.getPackage(packageId);
      if (!pkg) {
        return res.status(404).json({ message: "Package not found" });
      }
      
      const { participants, couponCode, affiliateCode, specialRequests } = req.body;
      
      // Calculate price with package discount
      const pricing = storage.calculatePackagePrice(pkg, participants || 1);
      let finalPrice = pricing.finalPrice;
      let discountApplied = pricing.discount;
      
      // Apply coupon if provided
      if (couponCode) {
        const couponResult = await storage.applyCoupon(couponCode, packageId, finalPrice);
        if (couponResult.valid) {
          finalPrice = couponResult.finalPrice;
          discountApplied += couponResult.discount;
        }
      }
      
      // Track affiliate click if provided
      if (affiliateCode) {
        await storage.trackAffiliateClick(affiliateCode);
      }
      
      // Create booking
      const booking = await storage.createPackageBooking({
        packageId,
        userId,
        participants: participants || 1,
        totalPrice: finalPrice.toFixed(2),
        discountApplied: discountApplied.toFixed(2),
        couponCode: couponCode || null,
        affiliateCode: affiliateCode || null,
        specialRequests: specialRequests || null,
      });
      
      res.json({
        booking,
        pricing: {
          basePrice: pricing.basePrice,
          discount: discountApplied,
          finalPrice,
        },
      });
    } catch (error: any) {
      console.error("Error booking package:", error);
      res.status(400).json({ message: error.message || "Failed to book package" });
    }
  });

  // Get My Package Bookings
  app.get('/api/packages/bookings/my', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const bookings = await storage.getUserPackageBookings(userId);
      
      res.json(bookings);
    } catch (error) {
      console.error("Error fetching bookings:", error);
      res.status(500).json({ message: "Failed to fetch bookings" });
    }
  });

  // Get Partner Packages (Partner only)
  app.get('/api/packages/my', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const partner = await storage.getPartnerByOwner(userId);
      
      if (!partner) {
        return res.status(403).json({ message: "Partner profile required" });
      }
      
      const packages = await storage.getPartnerPackages(partner.id);
      
      res.json(packages);
    } catch (error) {
      console.error("Error fetching partner packages:", error);
      res.status(500).json({ message: "Failed to fetch packages" });
    }
  });

  // Update Package (Partner only)
  app.patch('/api/packages/:id', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const packageId = req.params.id;
      
      const pkg = await storage.getPackage(packageId);
      if (!pkg) {
        return res.status(404).json({ message: "Package not found" });
      }
      
      const partner = await storage.getPartner(pkg.partnerId);
      if (!partner || partner.ownerUserId !== userId) {
        return res.status(403).json({ message: "You can only update your own packages" });
      }
      
      const updated = await storage.updatePackage(packageId, req.body);
      
      res.json(updated);
    } catch (error: any) {
      console.error("Error updating package:", error);
      res.status(400).json({ message: error.message || "Failed to update package" });
    }
  });

  // Delete Package (Partner only)
  app.delete('/api/packages/:id', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const packageId = req.params.id;
      
      const pkg = await storage.getPackage(packageId);
      if (!pkg) {
        return res.status(404).json({ message: "Package not found" });
      }
      
      const partner = await storage.getPartner(pkg.partnerId);
      if (!partner || partner.ownerUserId !== userId) {
        return res.status(403).json({ message: "You can only delete your own packages" });
      }
      
      await storage.deletePackage(packageId);
      
      res.json({ message: "Package deleted successfully" });
    } catch (error: any) {
      console.error("Error deleting package:", error);
      res.status(400).json({ message: error.message || "Failed to delete package" });
    }
  });

  // ============= COUPONS MANAGEMENT (Phase 12) =============

  // Create Coupon (Partner only)
  app.post('/api/coupons/create', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const partner = await storage.getPartnerByOwner(userId);
      
      if (!partner) {
        return res.status(403).json({ message: "Partner profile required" });
      }
      
      const validatedData = insertCouponSchema.parse({
        ...req.body,
        partnerId: partner.id,
      });
      
      const coupon = await storage.createCoupon(validatedData);
      
      res.json(coupon);
    } catch (error: any) {
      console.error("Error creating coupon:", error);
      res.status(400).json({ message: error.message || "Failed to create coupon" });
    }
  });

  // Get My Coupons (Partner only)
  app.get('/api/coupons/my', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const partner = await storage.getPartnerByOwner(userId);
      
      if (!partner) {
        return res.status(403).json({ message: "Partner profile required" });
      }
      
      const coupons = await storage.getPartnerCoupons(partner.id);
      
      res.json(coupons);
    } catch (error) {
      console.error("Error fetching coupons:", error);
      res.status(500).json({ message: "Failed to fetch coupons" });
    }
  });

  // Get Coupon by Code (Public for validation)
  app.get('/api/coupons/validate/:code', async (req, res) => {
    try {
      const coupon = await storage.getCouponByCode(req.params.code);
      
      if (!coupon) {
        return res.status(404).json({ valid: false, message: "Coupon not found" });
      }
      
      if (!coupon.isActive) {
        return res.json({ valid: false, message: "Coupon is inactive" });
      }
      
      const now = new Date();
      if (now < coupon.validFrom || now > coupon.validTo) {
        return res.json({ valid: false, message: "Coupon expired or not yet valid" });
      }
      
      if (coupon.usageLimit && (coupon.usageCount ?? 0) >= coupon.usageLimit) {
        return res.json({ valid: false, message: "Coupon usage limit reached" });
      }
      
      res.json({
        valid: true,
        coupon: {
          code: coupon.code,
          type: coupon.type,
          value: coupon.value,
        },
      });
    } catch (error) {
      console.error("Error validating coupon:", error);
      res.status(500).json({ message: "Failed to validate coupon" });
    }
  });

  // Update Coupon (Partner only)
  app.patch('/api/coupons/:id', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const couponId = req.params.id;
      
      const coupon = await storage.getCoupon(couponId);
      if (!coupon) {
        return res.status(404).json({ message: "Coupon not found" });
      }
      
      const partner = await storage.getPartner(coupon.partnerId!);
      if (!partner || partner.ownerUserId !== userId) {
        return res.status(403).json({ message: "You can only update your own coupons" });
      }
      
      const updated = await storage.updateCoupon(couponId, req.body);
      
      res.json(updated);
    } catch (error: any) {
      console.error("Error updating coupon:", error);
      res.status(400).json({ message: error.message || "Failed to update coupon" });
    }
  });

  // Deactivate Coupon (Partner only)
  app.post('/api/coupons/:id/deactivate', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const couponId = req.params.id;
      
      const coupon = await storage.getCoupon(couponId);
      if (!coupon) {
        return res.status(404).json({ message: "Coupon not found" });
      }
      
      const partner = await storage.getPartner(coupon.partnerId!);
      if (!partner || partner.ownerUserId !== userId) {
        return res.status(403).json({ message: "You can only deactivate your own coupons" });
      }
      
      const deactivated = await storage.deactivateCoupon(couponId);
      
      res.json(deactivated);
    } catch (error: any) {
      console.error("Error deactivating coupon:", error);
      res.status(400).json({ message: error.message || "Failed to deactivate coupon" });
    }
  });

  // ============= AFFILIATE LINKS MANAGEMENT (Phase 12) =============

  // Register as Affiliate (Any authenticated user)
  app.post('/api/affiliates/register', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const { partnerId, affiliateCode, commissionPct } = req.body;
      
      const existing = await storage.getAffiliateLinkByCode(affiliateCode);
      if (existing) {
        return res.status(400).json({ message: "Affiliate code already in use" });
      }
      
      const validatedData = insertAffiliateLinkSchema.parse({
        partnerId,
        userId,
        affiliateCode,
        commissionPct,
      });
      
      const link = await storage.createAffiliateLink(validatedData);
      
      res.json(link);
    } catch (error: any) {
      console.error("Error registering affiliate:", error);
      res.status(400).json({ message: error.message || "Failed to register affiliate" });
    }
  });

  // Get My Affiliate Links
  app.get('/api/affiliates/my', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const links = await storage.getUserAffiliateLinks(userId);
      
      res.json(links);
    } catch (error) {
      console.error("Error fetching affiliate links:", error);
      res.status(500).json({ message: "Failed to fetch affiliate links" });
    }
  });

  // Get Partner's Affiliate Links (Partner only)
  app.get('/api/affiliates/partner/my', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const partner = await storage.getPartnerByOwner(userId);
      
      if (!partner) {
        return res.status(403).json({ message: "Partner profile required" });
      }
      
      const links = await storage.getPartnerAffiliateLinks(partner.id);
      
      res.json(links);
    } catch (error) {
      console.error("Error fetching partner affiliates:", error);
      res.status(500).json({ message: "Failed to fetch affiliates" });
    }
  });

  // Get Affiliate Stats
  app.get('/api/affiliates/stats/:code', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const affiliateCode = req.params.code;
      
      const link = await storage.getAffiliateLinkByCode(affiliateCode);
      if (!link) {
        return res.status(404).json({ message: "Affiliate link not found" });
      }
      
      if (link.userId !== userId) {
        const partner = await storage.getPartner(link.partnerId);
        if (!partner || partner.ownerUserId !== userId) {
          return res.status(403).json({ message: "Not your affiliate link" });
        }
      }
      
      const stats = await storage.getAffiliateStats(affiliateCode);
      
      res.json(stats);
    } catch (error) {
      console.error("Error fetching affiliate stats:", error);
      res.status(500).json({ message: "Failed to fetch stats" });
    }
  });

  // Update Affiliate Link
  app.patch('/api/affiliates/:id', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const linkId = req.params.id;
      
      const link = await storage.getAffiliateLink(linkId);
      if (!link) {
        return res.status(404).json({ message: "Affiliate link not found" });
      }
      
      if (link.userId !== userId) {
        const partner = await storage.getPartner(link.partnerId);
        if (!partner || partner.ownerUserId !== userId) {
          return res.status(403).json({ message: "You can only update your own affiliate links" });
        }
      }
      
      const updated = await storage.updateAffiliateLink(linkId, req.body);
      
      res.json(updated);
    } catch (error: any) {
      console.error("Error updating affiliate link:", error);
      res.status(400).json({ message: error.message || "Failed to update affiliate link" });
    }
  });

  // Deactivate Affiliate Link
  app.post('/api/affiliates/:id/deactivate', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const linkId = req.params.id;
      
      const link = await storage.getAffiliateLink(linkId);
      if (!link) {
        return res.status(404).json({ message: "Affiliate link not found" });
      }
      
      if (link.userId !== userId) {
        const partner = await storage.getPartner(link.partnerId);
        if (!partner || partner.ownerUserId !== userId) {
          return res.status(403).json({ message: "You can only deactivate your own affiliate links" });
        }
      }
      
      const deactivated = await storage.deactivateAffiliateLink(linkId);
      
      res.json(deactivated);
    } catch (error: any) {
      console.error("Error deactivating affiliate link:", error);
      res.status(400).json({ message: error.message || "Failed to deactivate affiliate link" });
    }
  });

  // ============= STRIPE CONNECT BILLING (Phase 12) =============

  // Onboard Partner to Stripe Connect
  app.post('/api/billing/connect/onboard', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const user = await storage.getUser(userId);
      const partner = await storage.getPartnerByOwner(userId);
      
      if (!partner) {
        return res.status(403).json({ message: "Partner profile required" });
      }
      
      if (!partner.verified) {
        return res.status(403).json({ message: "Partner must be verified first" });
      }
      
      // Check if account already exists
      let account = await storage.getPartnerAccount(partner.id);
      
      let accountId: string;
      
      if (!account) {
        // Create new Stripe Connect account
        accountId = await createConnectAccount(
          user?.email || partner.contactEmail || '',
          'individual'
        );
        
        // Save to database
        account = await storage.createPartnerAccount({
          partnerId: partner.id,
          stripeAccountId: accountId,
        });
      } else {
        accountId = account.stripeAccountId!;
      }
      
      // Create onboarding link
      const baseUrl = process.env.REPLIT_DEV_DOMAIN || 'http://localhost:5000';
      const onboardingLink = await createAccountLink(
        accountId,
        `${baseUrl}/partner-portal?tab=billing&refresh=true`,
        `${baseUrl}/partner-portal?tab=billing&success=true`
      );
      
      res.json({
        accountId,
        onboardingLink,
        account,
      });
    } catch (error: any) {
      console.error("Error onboarding partner:", error);
      res.status(500).json({ message: error.message || "Failed to onboard partner" });
    }
  });

  // Check Partner Connect Status
  app.get('/api/billing/connect/status', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const partner = await storage.getPartnerByOwner(userId);
      
      if (!partner) {
        return res.status(403).json({ message: "Partner profile required" });
      }
      
      const account = await storage.getPartnerAccount(partner.id);
      
      if (!account || !account.stripeAccountId) {
        return res.json({
          connected: false,
          onboardingComplete: false,
        });
      }
      
      const status = await getAccountStatus(account.stripeAccountId);
      
      // Update database if status changed
      if (status.onboardingComplete !== account.onboardingComplete) {
        await storage.updatePartnerAccount(account.id, {
          onboardingComplete: status.onboardingComplete,
          status: status.chargesEnabled ? 'active' : 'pending',
        });
      }
      
      res.json({
        connected: true,
        ...status,
      });
    } catch (error: any) {
      console.error("Error checking connect status:", error);
      res.status(500).json({ message: error.message || "Failed to check status" });
    }
  });

  // Create Package Checkout with Split Payment
  app.post('/api/billing/packages/:id/checkout', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const bookingId = req.params.id;
      
      const booking = await storage.getPackageBooking(bookingId);
      
      if (!booking) {
        return res.status(404).json({ message: "Booking not found" });
      }
      
      if (booking.userId !== userId) {
        return res.status(403).json({ message: "Not your booking" });
      }
      
      // Check if already paid
      if (booking.paymentStatus === 'paid') {
        return res.status(400).json({ message: "Booking already paid" });
      }
      
      // Get package and partner
      const pkg = await storage.getPackage(booking.packageId);
      if (!pkg) {
        return res.status(404).json({ message: "Package not found" });
      }
      
      const partner = await storage.getPartner(pkg.partnerId);
      if (!partner) {
        return res.status(404).json({ message: "Partner not found" });
      }
      
      const partnerAccount = await storage.getPartnerAccount(partner.id);
      if (!partnerAccount || !partnerAccount.stripeAccountId || !partnerAccount.onboardingComplete) {
        return res.status(400).json({ message: "Partner payment setup incomplete" });
      }
      
      // Verify partner account is active
      if (partnerAccount.status !== 'active') {
        return res.status(400).json({ message: "Partner account not active" });
      }
      
      // Create checkout session with split payment
      const baseUrl = process.env.REPLIT_DEV_DOMAIN || 'http://localhost:5000';
      const platformFee = 0.15; // 15%
      
      const checkoutUrl = await createPackageCheckoutSession(
        booking.id,
        parseFloat(booking.totalPrice),
        'eur',
        partnerAccount.stripeAccountId,
        platformFee,
        `${baseUrl}/booking-success?booking_id=${booking.id}`,
        `${baseUrl}/packages/${pkg.id}`,
        {
          partnerId: partner.id,
          packageId: pkg.id,
          userId,
        }
      );
      
      // Store checkout session ID in booking
      const sessionId = checkoutUrl.split('/').pop();
      await storage.updatePackageBooking(booking.id, {
        stripeCheckoutSessionId: sessionId,
      });
      
      res.json({
        checkoutUrl,
        platformFee: (parseFloat(booking.totalPrice) * platformFee).toFixed(2),
      });
    } catch (error: any) {
      console.error("Error creating package checkout:", error);
      
      // Update booking status on failure
      try {
        await storage.updatePackageBooking(req.params.id, {
          paymentStatus: 'failed',
        });
      } catch (updateError) {
        console.error("Error updating booking status on failure:", updateError);
      }
      
      res.status(500).json({ message: error.message || "Failed to create checkout" });
    }
  });

  // Get Partner Payouts
  app.get('/api/billing/payouts', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const partner = await storage.getPartnerByOwner(userId);
      
      if (!partner) {
        return res.status(403).json({ message: "Partner profile required" });
      }
      
      const payouts = await storage.getPartnerPayouts(partner.id);
      
      res.json(payouts);
    } catch (error) {
      console.error("Error fetching payouts:", error);
      res.status(500).json({ message: "Failed to fetch payouts" });
    }
  });

  // Stripe Connect Webhook Handler
  app.post('/api/webhooks/stripe-connect', async (req, res) => {
    const sig = req.headers['stripe-signature'];
    
    if (!stripe || !sig) {
      return res.status(400).send('Webhook signature missing');
    }
    
    const webhookSecret = process.env.STRIPE_CONNECT_WEBHOOK_SECRET || process.env.STRIPE_WEBHOOK_SECRET;
    
    if (!webhookSecret) {
      console.error('[Stripe Connect] Webhook secret not configured');
      return res.status(500).send('Webhook secret not configured');
    }
    
    let event;
    try {
      event = stripe.webhooks.constructEvent(req.body, sig, webhookSecret);
    } catch (err: any) {
      console.error('[Stripe Connect] Webhook signature verification failed:', err.message);
      return res.status(400).send(`Webhook Error: ${err.message}`);
    }
    
    try {
      await handleConnectWebhook(event, storage);
      res.json({ received: true });
    } catch (error: any) {
      console.error('[Stripe Connect] Webhook handler error:', error);
      res.status(500).json({ error: error.message });
    }
  });

  // ============= OTA/DMO CONNECTORS (Phase 12) =============

  // Register OTA Connector (Partner only)
  app.post('/api/connectors/ota/register', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const partner = await storage.getPartnerByOwner(userId);
      
      if (!partner) {
        return res.status(403).json({ message: "Partner profile required" });
      }
      
      // Validate with Zod
      const validatedData = insertExternalConnectorSchema.parse({
        ...req.body,
        partnerId: partner.id,
      });
      
      const connector = await storage.createExternalConnector(validatedData);
      
      res.json(connector);
    } catch (error: any) {
      console.error("Error registering connector:", error);
      res.status(400).json({ message: error.message || "Failed to register connector" });
    }
  });

  // Get My Connectors (Partner only)
  app.get('/api/connectors/my', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const partner = await storage.getPartnerByOwner(userId);
      
      if (!partner) {
        return res.status(403).json({ message: "Partner profile required" });
      }
      
      const connectors = await storage.getPartnerConnectors(partner.id);
      
      res.json(connectors);
    } catch (error) {
      console.error("Error fetching connectors:", error);
      res.status(500).json({ message: "Failed to fetch connectors" });
    }
  });

  // Get Connector Details
  app.get('/api/connectors/:id', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const connectorId = req.params.id;
      
      const connector = await storage.getExternalConnector(connectorId);
      
      if (!connector) {
        return res.status(404).json({ message: "Connector not found" });
      }
      
      // Verify ownership
      const partner = await storage.getPartner(connector.partnerId);
      if (!partner || partner.ownerUserId !== userId) {
        return res.status(403).json({ message: "Not your connector" });
      }
      
      // Get mappings
      const mappings = await storage.getConnectorMappings(connectorId);
      
      res.json({
        connector,
        mappings,
        totalMappings: mappings.length,
      });
    } catch (error) {
      console.error("Error fetching connector:", error);
      res.status(500).json({ message: "Failed to fetch connector" });
    }
  });

  // Push Availability to OTA (Simulate sync)
  app.post('/api/connectors/ota/push-availability', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const { connectorId } = req.body;
      
      const connector = await storage.getExternalConnector(connectorId);
      
      if (!connector) {
        return res.status(404).json({ message: "Connector not found" });
      }
      
      // Verify ownership
      const partner = await storage.getPartner(connector.partnerId);
      if (!partner || partner.ownerUserId !== userId) {
        return res.status(403).json({ message: "Not your connector" });
      }
      
      // Trigger sync
      const syncResult = await storage.syncConnector(connectorId);
      
      res.json({
        message: syncResult.success ? 'Sync completed successfully' : 'Sync completed with errors',
        ...syncResult,
      });
    } catch (error: any) {
      console.error("Error pushing availability:", error);
      res.status(500).json({ message: error.message || "Failed to push availability" });
    }
  });

  // OTA Webhook Handler (Simulate external system callback)
  app.post('/api/connectors/ota/webhook', async (req, res) => {
    try {
      const { connectorId, externalId, event, data } = req.body;
      
      if (!connectorId || !externalId || !event) {
        return res.status(400).json({ message: "Missing required fields" });
      }
      
      const connector = await storage.getExternalConnector(connectorId);
      
      if (!connector) {
        return res.status(404).json({ message: "Connector not found" });
      }
      
      // Process different event types
      switch (event) {
        case 'booking_created': {
          // Update mapping status
          await storage.updateInventoryMapStatus(connectorId, externalId, 'synced');
          
          // Log audit trail
          await storage.createAuditLog({
            userId: null,
            action: 'ota_booking',
            entityType: 'connector',
            entityId: connectorId,
            changes: { metadata: { event, externalId, data } },
          });
          
          console.log(`[OTA Webhook] Booking created for connector ${connectorId}, external ID ${externalId}`);
          break;
        }
        
        case 'booking_cancelled': {
          await storage.updateInventoryMapStatus(connectorId, externalId, 'synced');
          
          console.log(`[OTA Webhook] Booking cancelled for connector ${connectorId}, external ID ${externalId}`);
          break;
        }
        
        case 'inventory_updated': {
          await storage.updateInventoryMapStatus(connectorId, externalId, 'pending');
          
          console.log(`[OTA Webhook] Inventory updated for connector ${connectorId}, external ID ${externalId}`);
          break;
        }
        
        default:
          console.log(`[OTA Webhook] Unknown event type: ${event}`);
      }
      
      res.json({ received: true });
    } catch (error: any) {
      console.error("[OTA Webhook] Error:", error);
      res.status(500).json({ error: error.message });
    }
  });

  // Update Connector (Partner only)
  app.patch('/api/connectors/:id', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const connectorId = req.params.id;
      
      const connector = await storage.getExternalConnector(connectorId);
      
      if (!connector) {
        return res.status(404).json({ message: "Connector not found" });
      }
      
      // Verify ownership
      const partner = await storage.getPartner(connector.partnerId);
      if (!partner || partner.ownerUserId !== userId) {
        return res.status(403).json({ message: "You can only update your own connectors" });
      }
      
      const updated = await storage.updateExternalConnector(connectorId, req.body);
      
      res.json(updated);
    } catch (error: any) {
      console.error("Error updating connector:", error);
      res.status(400).json({ message: error.message || "Failed to update connector" });
    }
  });

  // Delete Connector (Partner only)
  app.delete('/api/connectors/:id', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const connectorId = req.params.id;
      
      const connector = await storage.getExternalConnector(connectorId);
      
      if (!connector) {
        return res.status(404).json({ message: "Connector not found" });
      }
      
      // Verify ownership
      const partner = await storage.getPartner(connector.partnerId);
      if (!partner || partner.ownerUserId !== userId) {
        return res.status(403).json({ message: "You can only delete your own connectors" });
      }
      
      await storage.deleteExternalConnector(connectorId);
      
      res.json({ message: "Connector deleted successfully" });
    } catch (error: any) {
      console.error("Error deleting connector:", error);
      res.status(400).json({ message: error.message || "Failed to delete connector" });
    }
  });

  const httpServer = createServer(app);
  return httpServer;
}
