import { openai } from './openai';
import { sql, or, and, ilike, gte, lte, desc, eq } from 'drizzle-orm';
import type { DatabaseStorage } from './storage';

// Cache for search results (5 minutes TTL)
const searchCache = new Map<string, { results: any; timestamp: number }>();
const CACHE_TTL = 5 * 60 * 1000; // 5 minutes

// Rate limiting map (userId -> last search timestamp)
const rateLimitMap = new Map<string, number>();
const RATE_LIMIT_MS = 6000; // 10 searches per minute = 6000ms between searches

export function checkRateLimit(userId?: string): boolean {
  if (!userId) return true; // Allow anonymous searches
  
  const now = Date.now();
  const lastSearch = rateLimitMap.get(userId);
  
  if (lastSearch && now - lastSearch < RATE_LIMIT_MS) {
    return false;
  }
  
  rateLimitMap.set(userId, now);
  return true;
}

// Generate search cache key
function getCacheKey(query: string, filters: any): string {
  return `${query}:${JSON.stringify(filters)}`;
}

// Basic SQL search with fuzzy matching (pg_trgm)
export async function searchGlobal(
  storage: DatabaseStorage,
  query: string,
  filters: {
    type?: 'guide' | 'tour' | 'service' | 'all';
    city?: string;
    language?: string;
    priceMin?: number;
    priceMax?: number;
    rating?: number;
    availability?: boolean;
  }
): Promise<{
  guides: any[];
  tours: any[];
  services: any[];
  totalCount: number;
}> {
  const { type = 'all', city, language, priceMin, priceMax, rating, availability } = filters;
  
  // Check cache first
  const cacheKey = getCacheKey(query, filters);
  const cached = searchCache.get(cacheKey);
  if (cached && Date.now() - cached.timestamp < CACHE_TTL) {
    console.log('[Search] Returning cached results for:', query);
    return cached.results;
  }

  const results = {
    guides: [] as any[],
    tours: [] as any[],
    services: [] as any[],
    totalCount: 0,
  };

  // Search guides (if type is 'guide' or 'all')
  if (type === 'guide' || type === 'all') {
    const guideConditions = [
      sql`role = 'guide'`,
      sql`approval_status = 'approved'`,
      or(
        ilike(sql`first_name || ' ' || last_name`, `%${query}%`),
        ilike(sql`bio`, `%${query}%`)
      )
    ];

    if (city) {
      guideConditions.push(ilike(sql`city`, `%${city}%`));
    }

    if (language) {
      guideConditions.push(sql`${language} = ANY(guide_languages)`);
    }

    if (rating) {
      guideConditions.push(gte(sql`trust_level`, rating * 20)); // trust_level is 0-100, rating is 0-5
    }

    const guideResults = await storage.db.query.users.findMany({
      where: and(...guideConditions.filter(Boolean)),
      limit: 20,
    });
    results.guides = guideResults;
  }

  // Search tours (if type is 'tour' or 'all')
  if (type === 'tour' || type === 'all') {
    const tourConditions = [
      sql`approval_status = 'approved'`,
      sql`is_active = true`,
      or(
        ilike(sql`title`, `%${query}%`),
        ilike(sql`description`, `%${query}%`)
      )
    ];

    if (city) {
      tourConditions.push(ilike(sql`meeting_point`, `%${city}%`));
    }

    if (priceMin !== undefined) {
      tourConditions.push(gte(sql`price::numeric`, priceMin));
    }

    if (priceMax !== undefined) {
      tourConditions.push(lte(sql`price::numeric`, priceMax));
    }

    if (rating !== undefined) {
      tourConditions.push(gte(sql`average_rating`, rating));
    }

    if (language) {
      tourConditions.push(sql`${language} = ANY(languages)`);
    }

    const tourResults = await storage.db.query.tours.findMany({
      where: and(...tourConditions.filter(Boolean)),
      with: {
        guide: {
          columns: {
            id: true,
            firstName: true,
            lastName: true,
            profileImageUrl: true,
          },
        },
      },
      limit: 20,
    });
    results.tours = tourResults;
  }

  // Search services (if type is 'service' or 'all')
  if (type === 'service' || type === 'all') {
    const serviceConditions = [
      sql`is_active = true`,
      or(
        ilike(sql`name`, `%${query}%`),
        ilike(sql`description`, `%${query}%`)
      )
    ];

    if (city) {
      serviceConditions.push(ilike(sql`address`, `%${city}%`));
    }

    if (priceMin !== undefined) {
      serviceConditions.push(gte(sql`price::numeric`, priceMin));
    }

    if (priceMax !== undefined) {
      serviceConditions.push(lte(sql`price::numeric`, priceMax));
    }

    if (rating !== undefined) {
      serviceConditions.push(gte(sql`average_rating`, rating));
    }

    const serviceResults = await storage.db.query.services.findMany({
      where: and(...serviceConditions.filter(Boolean)),
      with: {
        provider: {
          columns: {
            id: true,
            firstName: true,
            lastName: true,
            profileImageUrl: true,
            businessName: true,
          },
        },
      },
      limit: 20,
    });
    results.services = serviceResults;
  }

  results.totalCount = results.guides.length + results.tours.length + results.services.length;
  
  // Cache results
  searchCache.set(cacheKey, { results, timestamp: Date.now() });
  
  return results;
}

// Semantic search using OpenAI embeddings
export async function searchSemantic(
  storage: DatabaseStorage,
  query: string,
  type?: 'guide' | 'tour' | 'service'
): Promise<{
  results: any[];
  explanation: string;
  confidence: number;
}> {
  try {
    // Generate embedding for the search query
    const embeddingResponse = await openai.embeddings.create({
      model: 'text-embedding-3-small',
      input: query,
    });
    
    const queryEmbedding = embeddingResponse.data[0].embedding;
    
    // Search similar embeddings using pgvector
    const similarResults = await storage.searchSimilarEmbeddings(queryEmbedding, type, 10);
    
    // Get full entities based on embedding results
    const results = [];
    for (const embed of similarResults) {
      let entity;
      if (embed.entityType === 'guide') {
        entity = await storage.db.query.users.findFirst({
          where: eq(sql`id`, embed.entityId),
        });
      } else if (embed.entityType === 'tour') {
        entity = await storage.db.query.tours.findFirst({
          where: eq(sql`id`, embed.entityId),
          with: { guide: true },
        });
      } else if (embed.entityType === 'service') {
        entity = await storage.db.query.services.findFirst({
          where: eq(sql`id`, embed.entityId),
          with: { provider: true },
        });
      }
      
      if (entity) {
        results.push({
          ...entity,
          _type: embed.entityType,
          _similarity: embed.similarity,
        });
      }
    }
    
    // Generate AI explanation
    const aiPrompt = `The user searched for: "${query}". 
Based on semantic analysis, we found ${results.length} relevant results.
Provide a brief, friendly explanation (2-3 sentences) of what we found and why it matches their search.`;

    // the newest OpenAI model is "gpt-5" which was released August 7, 2025. do not change this unless explicitly requested by the user
    const completion = await openai.chat.completions.create({
      model: 'gpt-5',
      messages: [{ role: 'user', content: aiPrompt }],
      max_completion_tokens: 100,
    });
    
    const explanation = completion.choices[0].message.content || 
      `Found ${results.length} results matching "${query}"`;
    
    // Calculate average confidence
    const avgConfidence = results.length > 0
      ? results.reduce((sum, r) => sum + (r._similarity || 0), 0) / results.length
      : 0;
    
    return {
      results,
      explanation,
      confidence: avgConfidence,
    };
  } catch (error) {
    console.error('[Semantic Search] Error:', error);
    throw new Error('Semantic search failed');
  }
}

// Generate embedding for an entity (to be called when creating/updating guides/tours/services)
export async function generateEntityEmbedding(
  storage: DatabaseStorage,
  entityId: string,
  entityType: 'guide' | 'tour' | 'service',
  content: string,
  language?: string
): Promise<void> {
  try {
    // Generate embedding
    const embeddingResponse = await openai.embeddings.create({
      model: 'text-embedding-3-small',
      input: content,
    });
    
    const embedding = embeddingResponse.data[0].embedding;
    
    // Check if embedding exists
    const existing = await storage.getEmbedding(entityId, entityType);
    
    if (existing) {
      // Update existing embedding - store as JSON string (no pgvector needed)
      await storage.db.execute(sql`
        UPDATE embeddings 
        SET embedding = ${JSON.stringify(embedding)},
            content = ${content},
            language = ${language},
            last_updated = NOW()
        WHERE entity_id = ${entityId} AND entity_type = ${entityType}
      `);
    } else {
      // Create new embedding
      await storage.createEmbedding({
        entityId,
        entityType,
        content,
        embedding,
        language,
      });
    }
    
    console.log(`[Embeddings] Generated embedding for ${entityType} ${entityId}`);
  } catch (error) {
    console.error('[Embeddings] Error generating embedding:', error);
    // Don't throw - embedding generation is non-critical
  }
}
