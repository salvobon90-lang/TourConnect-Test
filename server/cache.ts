/**
 * In-memory TTL-based caching system for TourConnect
 * Provides reusable cache instances for different data types
 * with configurable time-to-live (TTL) and automatic expiration
 */

const caches = new Map<string, Map<string, { data: any; timestamp: number }>>();

export interface Cache {
  get(key: string): any | null;
  set(key: string, data: any): void;
  invalidate(key: string): void;
  clear(): void;
  has(key: string): boolean;
}

/**
 * Creates a named cache with TTL-based expiration
 * @param name - Unique name for the cache
 * @param ttlMs - Time-to-live in milliseconds
 * @returns Cache interface with get, set, invalidate, and clear methods
 */
export function createCache(name: string, ttlMs: number): Cache {
  if (!caches.has(name)) {
    caches.set(name, new Map());
  }
  
  const cache = caches.get(name)!;
  
  return {
    get(key: string) {
      const entry = cache.get(key);
      if (!entry) return null;
      
      // Check if expired
      if (Date.now() - entry.timestamp > ttlMs) {
        cache.delete(key);
        return null;
      }
      
      return entry.data;
    },
    
    set(key: string, data: any) {
      cache.set(key, { data, timestamp: Date.now() });
    },
    
    invalidate(key: string) {
      cache.delete(key);
    },
    
    clear() {
      cache.clear();
    },
    
    has(key: string): boolean {
      const entry = cache.get(key);
      if (!entry) return false;
      
      // Check if expired
      if (Date.now() - entry.timestamp > ttlMs) {
        cache.delete(key);
        return false;
      }
      
      return true;
    }
  };
}

// ========== CACHE INSTANCES ==========

/**
 * Tour listings cache
 * TTL: 5 minutes
 * Used for: GET /api/tours endpoint results
 */
export const tourListCache = createCache('tourList', 5 * 60 * 1000);

/**
 * Service listings cache
 * TTL: 5 minutes
 * Used for: GET /api/services endpoint results
 */
export const serviceListCache = createCache('serviceList', 5 * 60 * 1000);

/**
 * Guide profile cache
 * TTL: 10 minutes
 * Used for: GET /api/guides/:id endpoint results
 */
export const guideProfileCache = createCache('guideProfile', 10 * 60 * 1000);

/**
 * Translation cache
 * TTL: 1 hour
 * Used for: Translation results to avoid re-translating same content
 */
export const translationCache = createCache('translation', 60 * 60 * 1000);

/**
 * AI itinerary cache
 * TTL: 30 minutes
 * Used for: Successful AI-generated itinerary responses
 */
export const itineraryCache = createCache('itinerary', 30 * 60 * 1000);

/**
 * Invalidates tour-related caches when a tour is created, updated, or deleted
 * Call this whenever tour data changes to ensure cache consistency
 */
export function invalidateTourCaches(tourId?: string) {
  tourListCache.clear(); // Clear all tour listings
  if (tourId) {
    guideProfileCache.clear(); // Guide profile contains tour listings
  }
}

/**
 * Invalidates service-related caches when a service is created, updated, or deleted
 * Call this whenever service data changes to ensure cache consistency
 */
export function invalidateServiceCaches() {
  serviceListCache.clear();
}

/**
 * Clears all caches - use for system maintenance or when needed
 */
export function clearAllCaches() {
  tourListCache.clear();
  serviceListCache.clear();
  guideProfileCache.clear();
  translationCache.clear();
  itineraryCache.clear();
  console.log('[Cache] All caches cleared');
}
