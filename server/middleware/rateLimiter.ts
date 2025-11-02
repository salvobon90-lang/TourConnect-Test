import rateLimit from 'express-rate-limit';

// General API rate limiter
export const apiLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100, // 100 requests per 15 minutes
  message: 'Too many requests from this IP, please try again later.',
  standardHeaders: true,
  legacyHeaders: false
});

// Auth endpoints rate limiter (stricter)
export const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 5, // 5 attempts per 15 minutes
  message: 'Too many authentication attempts, please try again later.',
  standardHeaders: true,
  legacyHeaders: false
});

// AI endpoints rate limiter (prevent API abuse)
export const aiLimiter = rateLimit({
  windowMs: 60 * 1000, // 1 minute
  max: 10, // 10 AI requests per minute
  message: 'Too many AI requests, please try again later.',
  standardHeaders: true,
  legacyHeaders: false
});

// Messaging rate limiter (prevent spam)
export const messageLimiter = rateLimit({
  windowMs: 60 * 1000, // 1 minute
  max: 30, // 30 messages per minute
  message: 'Too many messages, please slow down.',
  standardHeaders: true,
  legacyHeaders: false
});

// Review creation rate limiter
export const reviewLimiter = rateLimit({
  windowMs: 60 * 60 * 1000, // 1 hour
  max: 5, // 5 reviews per hour
  message: 'Too many reviews submitted, please try again later.',
  standardHeaders: true,
  legacyHeaders: false
});

// Booking creation rate limiter
export const bookingLimiter = rateLimit({
  windowMs: 60 * 1000, // 1 minute
  max: 5, // 5 bookings per minute
  message: 'Too many booking attempts, please slow down.',
  standardHeaders: true,
  legacyHeaders: false
});

// Geolocation update rate limiter
export const geoLimiter = rateLimit({
  windowMs: 60 * 1000, // 1 minute
  max: 30, // 30 requests per minute
  message: 'Too many geolocation updates, please slow down.',
  standardHeaders: true,
  legacyHeaders: false
});

// AI Itinerary Builder rate limiter (strict to prevent API abuse)
export const itineraryLimiter = rateLimit({
  windowMs: 60 * 1000, // 1 minute
  max: 5, // 5 requests per minute per IP
  message: 'Too many itinerary requests. Please wait before trying again.',
  standardHeaders: true,
  legacyHeaders: false,
  skipSuccessfulRequests: false,
  handler: (req, res) => {
    res.status(429).json({
      errorCode: 'RATE_LIMIT_EXCEEDED',
      message: 'Too many itinerary requests. Please wait a moment before trying again.'
    });
  }
});
