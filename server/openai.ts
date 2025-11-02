import OpenAI from "openai";
import { translationCache, itineraryCache } from './cache';
import { randomUUID } from "crypto";

/*
Follow these instructions when using this blueprint:
1. Note that the newest OpenAI model is "gpt-5", not "gpt-4o" or "gpt-4". gpt-5 was released August 7, 2025 after your knowledge cutoff. Always prefer using gpt-5 as it is the latest model. When copying code from this blueprint, ensure you also mention this information verbatim as a comment so that you don't revert it to older models: `// the newest OpenAI model is "gpt-5" which was released August 7, 2025. do not change this unless explicitly requested by the user`
*/

// This is using Replit's AI Integrations service, which provides OpenAI-compatible API access without requiring your own OpenAI API key.
const openai = process.env.AI_INTEGRATIONS_OPENAI_API_KEY ? new OpenAI({
  baseURL: process.env.AI_INTEGRATIONS_OPENAI_BASE_URL,
  apiKey: process.env.AI_INTEGRATIONS_OPENAI_API_KEY
}) : null;

// Export openai for use in other services (e.g., search-service)
export { openai };

function ensureOpenAI(): OpenAI {
  if (!openai) {
    throw new Error('OpenAI integration not configured. Please set up AI Integrations in Replit.');
  }
  return openai;
}

export interface ChatMessage {
  role: 'user' | 'assistant' | 'system';
  content: string;
}

export async function chatWithAssistant(
  messages: ChatMessage[],
  userId?: string
): Promise<string> {
  const systemPrompt = {
    role: 'system' as const,
    content: `You are TourConnect AI, a friendly travel assistant specializing in tours and local experiences. 
    Your role is to:
    - Recommend tours and activities based on user preferences
    - Provide local insights and cultural tips
    - Help plan itineraries
    - Answer questions about destinations
    - Suggest the best times to visit places
    
    Keep responses concise (under 300 words), friendly, and helpful. When recommending tours, mention that users can browse and book them on TourConnect.
    
    Be enthusiastic about travel while being realistic about logistics and costs.`
  };
  
  // the newest OpenAI model is "gpt-5" which was released August 7, 2025. do not change this unless explicitly requested by the user
  const completion = await ensureOpenAI().chat.completions.create({
    model: 'gpt-5',
    messages: [systemPrompt, ...messages],
    max_completion_tokens: 8192,
    user: userId
  });
  
  return completion.choices[0]?.message?.content || 'Sorry, I could not generate a response.';
}

export async function* chatWithAssistantStream(
  messages: ChatMessage[],
  userId?: string
): AsyncGenerator<string> {
  const systemPrompt = {
    role: 'system' as const,
    content: `You are TourConnect AI, a friendly travel assistant specializing in tours and local experiences. 
    Your role is to:
    - Recommend tours and activities based on user preferences
    - Provide local insights and cultural tips
    - Help plan itineraries
    - Answer questions about destinations
    - Suggest the best times to visit places
    
    Keep responses concise (under 300 words), friendly, and helpful. When recommending tours, mention that users can browse and book them on TourConnect.
    
    Be enthusiastic about travel while being realistic about logistics and costs.`
  };
  
  // the newest OpenAI model is "gpt-5" which was released August 7, 2025. do not change this unless explicitly requested by the user
  const stream = await ensureOpenAI().chat.completions.create({
    model: 'gpt-5',
    messages: [systemPrompt, ...messages],
    max_completion_tokens: 8192,
    stream: true,
    user: userId
  });
  
  for await (const chunk of stream) {
    const content = chunk.choices[0]?.delta?.content;
    if (content) {
      yield content;
    }
  }
}

export async function getTourRecommendations(
  userQuery: string,
  availableTours: Array<{ name: string; description: string; location: string; price: number }>,
  userId?: string
): Promise<string> {
  const toursContext = availableTours
    .map(t => `- ${t.name} in ${t.location}: ${t.description} ($${t.price})`)
    .join('\n');
  
  const prompt = {
    role: 'user' as const,
    content: `Based on this request: "${userQuery}"
    
    Here are available tours:
    ${toursContext}
    
    Which tours would you recommend and why? Keep it brief (under 200 words).`
  };
  
  return chatWithAssistant([prompt], userId);
}

// ========== AI ITINERARY BUILDER ==========

export interface ItineraryRequest {
  destination: string;
  days: number;
  interests: string[];
  budget: "budget" | "moderate" | "luxury";
  language: string;
  travelStyle?: "relaxed" | "balanced" | "packed";
}

export interface DayPlan {
  day: number;
  title: string;
  morning: string[];
  afternoon: string[];
  evening: string[];
  estimatedCost: number;
  tips: string[];
}

/**
 * Generate a simple rule-based fallback itinerary when AI fails
 * Supports popular destinations with basic tourist attractions
 */
function generateFallbackItinerary(destination: string, days: number): {
  destination: string;
  totalDays: number;
  dailyPlans: DayPlan[];
  estimatedTotalCost: number;
  packingList: string[];
  localTips: string[];
  isFallback: boolean;
} {
  const destinationLower = destination.toLowerCase();
  
  // Popular destinations with curated POIs
  const destinationData: Record<string, {
    pois: string[];
    dailyCost: number;
    tips: string[];
  }> = {
    'rome': {
      pois: ['Colosseum', 'Vatican Museums', 'Trevi Fountain', 'Spanish Steps', 'Pantheon', 'Roman Forum', 'Trastevere', 'Villa Borghese'],
      dailyCost: 80,
      tips: ['Book Colosseum tickets in advance', 'Wear comfortable walking shoes', 'Visit attractions early morning', 'Try authentic carbonara in Trastevere']
    },
    'siracusa': {
      pois: ['Ortigia Island', 'Archaeological Park', 'Fonte Aretusa', 'Duomo di Siracusa', 'Castello Maniace', 'Teatro Greco', 'Market of Ortigia'],
      dailyCost: 60,
      tips: ['Explore Ortigia on foot', 'Try arancini at the market', 'Visit early to avoid heat', 'Swim at Fontane Bianche beach']
    },
    'paris': {
      pois: ['Eiffel Tower', 'Louvre Museum', 'Notre-Dame', 'Champs-Élysées', 'Montmartre', 'Arc de Triomphe', 'Latin Quarter', 'Versailles'],
      dailyCost: 100,
      tips: ['Get a Paris Museum Pass', 'Use metro for transport', 'Visit bakeries early morning', 'Book Eiffel Tower tickets online']
    },
    'florence': {
      pois: ['Uffizi Gallery', 'Duomo', 'Ponte Vecchio', 'Accademia Gallery', 'Piazzale Michelangelo', 'Boboli Gardens', 'Pitti Palace'],
      dailyCost: 75,
      tips: ['Reserve Uffizi tickets ahead', 'Climb the Duomo early', 'Try gelato at local shops', 'Walk everywhere in historic center']
    },
    'barcelona': {
      pois: ['Sagrada Familia', 'Park Güell', 'Las Ramblas', 'Gothic Quarter', 'Casa Batlló', 'Barceloneta Beach', 'Camp Nou'],
      dailyCost: 85,
      tips: ['Book Gaudí sites in advance', 'Try tapas in Gothic Quarter', 'Use metro extensively', 'Visit Sagrada Familia at sunset']
    }
  };
  
  // Find matching destination
  let destinationKey = Object.keys(destinationData).find(key => 
    destinationLower.includes(key) || key.includes(destinationLower)
  );
  
  // Default fallback if destination not found
  const data = destinationKey ? destinationData[destinationKey] : {
    pois: ['City Center', 'Main Square', 'Historical Museum', 'Local Market', 'Cathedral', 'Park', 'Viewpoint'],
    dailyCost: 70,
    tips: ['Research local customs', 'Learn basic local phrases', 'Try local cuisine', 'Use public transport']
  };
  
  // Generate daily plans
  const dailyPlans: DayPlan[] = [];
  const poisPerDay = Math.ceil(data.pois.length / days);
  
  for (let day = 1; day <= days; day++) {
    const startIdx = (day - 1) * poisPerDay;
    const dayPois = data.pois.slice(startIdx, startIdx + poisPerDay);
    
    dailyPlans.push({
      day,
      title: `Day ${day}: Exploring ${destination}`,
      morning: dayPois.slice(0, Math.ceil(dayPois.length / 2)),
      afternoon: dayPois.slice(Math.ceil(dayPois.length / 2)),
      evening: ['Dinner at local restaurant', 'Evening stroll'],
      estimatedCost: data.dailyCost,
      tips: data.tips.slice(0, 2)
    });
  }
  
  return {
    destination,
    totalDays: days,
    dailyPlans,
    estimatedTotalCost: data.dailyCost * days,
    packingList: ['Comfortable walking shoes', 'Camera', 'Sunscreen', 'Hat', 'Water bottle', 'Daypack', 'Travel adapter', 'Guidebook', 'Umbrella', 'Light jacket'],
    localTips: data.tips,
    isFallback: true
  };
}

export async function generateItinerary(request: ItineraryRequest, userId?: string): Promise<{
  destination: string;
  totalDays: number;
  dailyPlans: DayPlan[];
  estimatedTotalCost: number;
  packingList: string[];
  localTips: string[];
  isFallback?: boolean;
}> {
  const requestId = randomUUID();
  const startTime = Date.now();
  
  // Check cache first (30 min TTL) - cache key from request parameters
  const cacheKey = `${request.destination}:${request.days}:${request.budget}:${request.travelStyle}:${request.interests.join(',')}`;
  const cached = itineraryCache.get(cacheKey);
  if (cached) {
    console.log(`[Itinerary] Cache hit for ${request.destination} (${request.days} days)`);
    return cached;
  }
  
  // Structured logging - START
  console.log(JSON.stringify({
    timestamp: new Date().toISOString(),
    requestId,
    userId: userId || 'anonymous',
    action: 'itinerary_build_start',
    destination: request.destination,
    days: request.days,
    budget: request.budget,
    travelStyle: request.travelStyle || 'balanced',
    interestsCount: request.interests.length
  }));
  
  try {
    const prompt = `You are an expert travel planner. Create a detailed ${request.days}-day itinerary for ${request.destination}.

Interests: ${request.interests.join(", ") || "general tourism"}
Budget: ${request.budget}
Travel Style: ${request.travelStyle || "balanced"}
Language: ${request.language}

For each day, provide:
- Morning activities (2-3 items)
- Afternoon activities (2-3 items)
- Evening activities (1-2 items)
- Estimated daily cost in EUR
- Local tips

Also include:
- Packing list (10-15 items)
- Local tips and customs (5-7 items)

Return ONLY valid JSON with this structure:
{
  "destination": string,
  "totalDays": number,
  "dailyPlans": [
    {
      "day": number,
      "title": string,
      "morning": string[],
      "afternoon": string[],
      "evening": string[],
      "estimatedCost": number,
      "tips": string[]
    }
  ],
  "estimatedTotalCost": number,
  "packingList": string[],
  "localTips": string[]
}`;

    // the newest OpenAI model is "gpt-5" which was released August 7, 2025. do not change this unless explicitly requested by the user
    const response = await ensureOpenAI().chat.completions.create({
      model: "gpt-5",
      messages: [
        { role: "system", content: "You are a travel planning expert. Always respond with valid JSON only, no markdown formatting." },
        { role: "user", content: prompt }
      ],
      temperature: 0.7
    });
    
    const content = response.choices[0].message.content || "{}";
    
    // Clean markdown if present
    const jsonContent = content.replace(/```json\n?/g, '').replace(/```\n?/g, '').trim();
    
    const result = JSON.parse(jsonContent);
    
    // Cache the successful itinerary (30 min TTL)
    itineraryCache.set(cacheKey, result);
    
    // Structured logging - SUCCESS
    const latency = Date.now() - startTime;
    console.log(JSON.stringify({
      timestamp: new Date().toISOString(),
      requestId,
      userId: userId || 'anonymous',
      action: 'itinerary_build_success',
      destination: request.destination,
      days: request.days,
      latencyMs: latency,
      daysGenerated: result.dailyPlans?.length || 0,
      isFallback: false
    }));
    
    return result;
  } catch (error: any) {
    // Structured logging - ERROR
    const latency = Date.now() - startTime;
    console.log(JSON.stringify({
      timestamp: new Date().toISOString(),
      requestId,
      userId: userId || 'anonymous',
      action: 'itinerary_build_error',
      destination: request.destination,
      days: request.days,
      latencyMs: latency,
      errorType: error.name || 'UnknownError',
      errorMessage: error.message,
      usingFallback: true
    }));
    
    // Return fallback itinerary
    console.log(JSON.stringify({
      timestamp: new Date().toISOString(),
      requestId,
      userId: userId || 'anonymous',
      action: 'itinerary_fallback_used',
      destination: request.destination,
      days: request.days
    }));
    
    return generateFallbackItinerary(request.destination, request.days);
  }
}

// ========== AI LANGUAGE TRANSLATION ==========

export interface TranslationRequest {
  text: string;
  targetLanguage: "it" | "en" | "de" | "fr" | "es";
  context: "tourism" | "service" | "event" | "general";
}

export async function translateText(request: TranslationRequest): Promise<string> {
  const languageNames = {
    it: "Italian",
    en: "English",
    de: "German",
    fr: "French",
    es: "Spanish"
  };
  
  const prompt = `Translate the following ${request.context} text to ${languageNames[request.targetLanguage]}. 
Maintain the tone and cultural appropriateness for tourism content.

Text to translate:
${request.text}

Provide ONLY the translated text, no explanations or formatting.`;

  // the newest OpenAI model is "gpt-5" which was released August 7, 2025. do not change this unless explicitly requested by the user
  const response = await ensureOpenAI().chat.completions.create({
    model: "gpt-5",
    messages: [
      { role: "system", content: "You are a professional tourism translator. Provide only the translated text, maintaining cultural sensitivity and tourism terminology." },
      { role: "user", content: prompt }
    ],
    temperature: 0.3
  });
  
  return response.choices[0].message.content?.trim() || "";
}

// ========== CONTENT TRANSLATION FOR TOURS & SERVICES ==========

export interface TranslationInput {
  sourceLanguage: string; // e.g., 'en'
  targetLanguages: string[]; // e.g., ['it', 'fr', 'de', 'es']
  contentType: 'tour' | 'service';
  content: {
    title: string;
    description: string;
    itinerary?: string; // tours only
    included?: string[]; // tours only
    excluded?: string[]; // tours only
    cancellationPolicy?: string; // tours only
    specialOffer?: string; // services only
  };
}

export async function translateContent(input: TranslationInput): Promise<{
  [languageCode: string]: typeof input.content;
}> {
  const languageNames: Record<string, string> = {
    en: "English",
    it: "Italian",
    fr: "French",
    de: "German",
    es: "Spanish",
    pt: "Portuguese",
    jp: "Japanese",
    cn: "Chinese",
    ru: "Russian"
  };

  const results: { [languageCode: string]: typeof input.content } = {};

  // Translate to each target language
  for (const targetLang of input.targetLanguages) {
    // Skip if target is same as source
    if (targetLang === input.sourceLanguage) {
      results[targetLang] = input.content;
      continue;
    }
    
    // Check cache first (1 hour TTL) - cache key includes content hash for uniqueness
    const cacheKey = `${input.sourceLanguage}:${targetLang}:${input.contentType}:${JSON.stringify(input.content)}`;
    const cached = translationCache.get(cacheKey);
    if (cached) {
      results[targetLang] = cached;
      console.log(`[Translation] Cache hit for ${input.sourceLanguage} -> ${targetLang}`);
      continue;
    }

    try {
      // Build structured JSON prompt for batch translation
      const contentToTranslate = {
        title: input.content.title,
        description: input.content.description,
        ...(input.content.itinerary && { itinerary: input.content.itinerary }),
        ...(input.content.included && { included: input.content.included }),
        ...(input.content.excluded && { excluded: input.content.excluded }),
        ...(input.content.cancellationPolicy && { cancellationPolicy: input.content.cancellationPolicy }),
        ...(input.content.specialOffer && { specialOffer: input.content.specialOffer })
      };

      const prompt = `Translate the following ${input.contentType} content from ${languageNames[input.sourceLanguage] || input.sourceLanguage} to ${languageNames[targetLang] || targetLang}.

Maintain:
- Professional, engaging tone appropriate for tourism
- Cultural appropriateness and local context
- Original formatting (line breaks, bullet points)
- Tourism-specific terminology

Content to translate (JSON format):
${JSON.stringify(contentToTranslate, null, 2)}

Return ONLY valid JSON with the same structure, translated to ${languageNames[targetLang] || targetLang}. Do not include markdown formatting or explanations.`;

      // the newest OpenAI model is "gpt-5" which was released August 7, 2025. do not change this unless explicitly requested by the user
      const response = await ensureOpenAI().chat.completions.create({
        model: "gpt-5",
        messages: [
          {
            role: "system",
            content: "You are a professional tourism content translator. Translate the following tour/service content while maintaining professional tone, cultural appropriateness, and formatting. Always respond with valid JSON only."
          },
          {
            role: "user",
            content: prompt
          }
        ],
        temperature: 0.3,
        response_format: { type: "json_object" }
      });

      const translatedContent = response.choices[0].message.content?.trim() || "{}";
      
      // Parse and validate JSON response
      try {
        const parsed = JSON.parse(translatedContent);
        results[targetLang] = parsed;
        
        // Cache the successful translation (1 hour TTL)
        translationCache.set(cacheKey, parsed);
        
        console.log(`[Translation] Successfully translated ${input.contentType} to ${targetLang}`);
      } catch (parseError) {
        console.error(`[Translation] Failed to parse JSON for ${targetLang}:`, parseError);
        // Fallback: store original content if parsing fails
        results[targetLang] = input.content;
      }
    } catch (error: any) {
      console.error(`[Translation] Error translating to ${targetLang}:`, error.message);
      // Graceful degradation: store original content if translation fails
      results[targetLang] = input.content;
    }
  }

  return results;
}

// ========== AI REVIEW SUMMARIES ==========

export interface ReviewForSummary {
  id: string;
  rating: number;
  comment: string | null;
  createdAt: Date;
}

export async function summarizeReviews(reviews: ReviewForSummary[]): Promise<{
  summary: string;
  highlights: string[];
  concerns: string[];
  averageRating: number;
}> {
  // Guard against zero reviews
  if (reviews.length === 0) {
    return {
      summary: "No reviews yet.",
      highlights: [],
      concerns: [],
      averageRating: 0  // ✅ FIXED: Return 0 instead of NaN
    };
  }

  const averageRating = reviews.reduce((sum, r) => sum + r.rating, 0) / reviews.length;
  
  const reviewTexts = reviews
    .filter(r => r.comment && r.comment.trim().length > 0)
    .map(r => `Rating ${r.rating}/5: ${r.comment}`)
    .join("\n\n");
  
  if (!reviewTexts) {
    return {
      summary: `Average rating: ${averageRating.toFixed(1)}/5 based on ${reviews.length} reviews.`,
      highlights: [],
      concerns: [],
      averageRating
    };
  }
  
  const prompt = `Analyze these tourism reviews and provide:
1. A 2-3 sentence summary
2. Top 3-5 highlights (positive aspects)
3. Top 3-5 concerns (areas for improvement)

Reviews:
${reviewTexts}

Return ONLY valid JSON:
{
  "summary": string,
  "highlights": string[],
  "concerns": string[]
}`;

  // the newest OpenAI model is "gpt-5" which was released August 7, 2025. do not change this unless explicitly requested by the user
  const response = await ensureOpenAI().chat.completions.create({
    model: "gpt-5",
    messages: [
      { role: "system", content: "You are a tourism review analyst. Always respond with valid JSON only." },
      { role: "user", content: prompt }
    ],
    temperature: 0.5
  });
  
  const content = response.choices[0].message.content || "{}";
  const jsonContent = content.replace(/```json\n?/g, '').replace(/```\n?/g, '').trim();
  const parsed = JSON.parse(jsonContent);
  
  return {
    ...parsed,
    averageRating
  };
}

// ========== AI CONTENT MODERATION ==========

/**
 * Content Moderation using OpenAI Moderation API
 * 
 * MODERATION POLICY:
 * - High severity (>0.8): Content is BLOCKED before creation
 * - Medium severity (0.5-0.8): Content is ALLOWED but flagged for review
 * - Low severity (<0.5): Content is ALLOWED
 * 
 * High severity includes:
 * - Explicit violence, gore, self-harm
 * - Sexual content involving minors
 * - Hate speech targeting protected groups
 * - Harassment and bullying
 * 
 * Medium severity is logged but allowed to support tourism discussions about:
 * - Historical violence (wars, conflicts)
 * - Alcohol/nightlife in tourism context
 * - Cultural/religious topics that may trigger false positives
 * 
 * To change policy: Adjust threshold in POST /api/posts and POST /api/reviews
 */
export async function moderateContent(
  content: string,
  contentType: "post" | "review" | "comment" | "general"
): Promise<{
  isFlagged: boolean;
  categories: string[];
  severity: "none" | "low" | "medium" | "high";
  reason: string | null;
}> {
  // Use OpenAI Moderation API
  const moderation = await ensureOpenAI().moderations.create({
    model: "omni-moderation-latest",
    input: content
  });
  
  const result = moderation.results[0];
  
  // Flagged categories
  const flaggedCategories = Object.entries(result.categories)
    .filter(([_, flagged]) => flagged)
    .map(([category]) => category);
  
  // Determine severity
  let severity: "none" | "low" | "medium" | "high" = "none";
  
  if (flaggedCategories.length > 0) {
    const scores = Object.values(result.category_scores);
    const maxScore = Math.max(...scores);
    
    if (maxScore > 0.8) severity = "high";
    else if (maxScore > 0.5) severity = "medium";
    else severity = "low";
  }
  
  return {
    isFlagged: result.flagged,
    categories: flaggedCategories,
    severity,
    reason: flaggedCategories.length > 0 
      ? `Content flagged for: ${flaggedCategories.join(", ")}`
      : null
  };
}

// ========== PHASE 9: AI TRAVEL COMPANION ==========

// Rate limiting and caching infrastructure
const rateLimitCache = new Map<string, number>();
const responseCache = new Map<string, {result: any, timestamp: number}>();

/**
 * Check if a request should be rate limited
 * @param key Unique identifier for the rate limit (e.g., "function:userId")
 * @param limitSeconds Maximum calls per period (default: 30 seconds)
 * @returns true if allowed, false if rate limited
 */
function checkRateLimit(key: string, limitSeconds: number = 30): boolean {
  const now = Date.now();
  const lastCall = rateLimitCache.get(key);
  if (lastCall && now - lastCall < limitSeconds * 1000) {
    return false; // rate limited
  }
  rateLimitCache.set(key, now);
  return true;
}

/**
 * Get cached response if still valid
 * @param key Cache key
 * @param maxAgeMinutes Cache lifetime in minutes (default: 5)
 * @returns Cached result or null if expired/not found
 */
function getCachedResponse<T>(key: string, maxAgeMinutes: number = 5): T | null {
  const cached = responseCache.get(key);
  if (cached && Date.now() - cached.timestamp < maxAgeMinutes * 60 * 1000) {
    return cached.result as T;
  }
  return null;
}

/**
 * Store response in cache
 * @param key Cache key
 * @param result Data to cache
 */
function setCachedResponse(key: string, result: any): void {
  responseCache.set(key, { result, timestamp: Date.now() });
}

/**
 * Sanitize user input to prevent prompt injection attacks
 * @param input User-provided text
 * @returns Sanitized text
 * @throws Error if suspicious patterns detected
 */
function sanitizeInput(input: string): string {
  // Remove suspicious patterns that might indicate prompt injection
  const suspiciousPatterns = [
    /ignore\s+(previous|all|above)\s+instructions?/gi,
    /disregard\s+(previous|all|above)/gi,
    /forget\s+(previous|all|above)/gi,
    /new\s+instructions?:/gi,
    /system\s*:/gi,
    /assistant\s*:/gi,
  ];
  
  let sanitized = input;
  for (const pattern of suspiciousPatterns) {
    if (pattern.test(sanitized)) {
      throw new Error("Input contains suspicious patterns");
    }
  }
  
  return sanitized.trim();
}

// ========== GEOGRAPHIC HELPERS ==========

/**
 * Calculate distance between two GPS coordinates using Haversine formula
 * @param lat1 Latitude of point 1 (degrees)
 * @param lon1 Longitude of point 1 (degrees)
 * @param lat2 Latitude of point 2 (degrees)
 * @param lon2 Longitude of point 2 (degrees)
 * @returns Distance in kilometers
 */
function calculateHaversineDistance(
  lat1: number,
  lon1: number,
  lat2: number,
  lon2: number
): number {
  const R = 6371; // Earth's radius in kilometers
  
  const dLat = (lat2 - lat1) * Math.PI / 180;
  const dLon = (lon2 - lon1) * Math.PI / 180;
  
  const a = 
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) *
    Math.sin(dLon / 2) * Math.sin(dLon / 2);
  
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  
  return R * c;
}

/**
 * Calculate geographic centroid of multiple coordinates
 * Converts to Cartesian, averages, then converts back to lat/long
 * @param points Array of lat/long coordinates
 * @returns Centroid coordinates
 */
function calculateCentroid(points: Array<{ latitude: number; longitude: number }>): {
  latitude: number;
  longitude: number;
} {
  if (points.length === 0) {
    throw new Error("Cannot calculate centroid of empty array");
  }
  
  if (points.length === 1) {
    return points[0];
  }
  
  // Convert to Cartesian coordinates
  let x = 0, y = 0, z = 0;
  
  for (const point of points) {
    const latRad = point.latitude * Math.PI / 180;
    const lonRad = point.longitude * Math.PI / 180;
    
    x += Math.cos(latRad) * Math.cos(lonRad);
    y += Math.cos(latRad) * Math.sin(lonRad);
    z += Math.sin(latRad);
  }
  
  x /= points.length;
  y /= points.length;
  z /= points.length;
  
  // Convert back to lat/long
  const lonRad = Math.atan2(y, x);
  const hyp = Math.sqrt(x * x + y * y);
  const latRad = Math.atan2(z, hyp);
  
  return {
    latitude: latRad * 180 / Math.PI,
    longitude: lonRad * 180 / Math.PI
  };
}

// ========== AI TRAVEL COMPANION FEATURES ==========

export interface ParticipantLocation {
  userId: string;
  userName: string;
  latitude: number;
  longitude: number;
}

/**
 * Suggest optimal meeting point based on participant locations
 * Uses geographic centroid and OpenAI to find a nearby landmark
 * 
 * @param params.groupId Group identifier for rate limiting
 * @param params.participants Array of participant locations
 * @param params.tourLocation Optional tour location to weight more heavily
 * @param params.language Response language
 * @returns Optimal meeting point with landmark name and distances
 */
export async function suggestMeetingPoint(params: {
  groupId: string;
  participants: ParticipantLocation[];
  tourLocation?: { latitude: number; longitude: number };
  language: string;
}): Promise<{
  optimalPoint: { latitude: number; longitude: number; name: string };
  reasoning: string;
  distanceFromParticipants: { userId: string; distance: number }[];
}> {
  // Rate limiting
  const rateLimitKey = `meeting-point:${params.groupId}`;
  if (!checkRateLimit(rateLimitKey, 30)) {
    throw new Error("Rate limit exceeded. Please wait before requesting again.");
  }
  
  // Cache key
  const cacheKey = `meeting-point:${JSON.stringify(params)}`;
  const cached = getCachedResponse<any>(cacheKey, 5);
  if (cached) return cached;
  
  // Validate participants
  if (!params.participants || params.participants.length === 0) {
    throw new Error("At least one participant is required");
  }
  
  // Calculate centroid
  const participantPoints = params.participants.map(p => ({
    latitude: p.latitude,
    longitude: p.longitude
  }));
  
  let optimalPoint: { latitude: number; longitude: number };
  
  if (params.tourLocation) {
    // Weight tour location more heavily (60% tour, 40% centroid)
    const centroid = calculateCentroid(participantPoints);
    optimalPoint = {
      latitude: params.tourLocation.latitude * 0.6 + centroid.latitude * 0.4,
      longitude: params.tourLocation.longitude * 0.6 + centroid.longitude * 0.4
    };
  } else {
    optimalPoint = calculateCentroid(participantPoints);
  }
  
  // Calculate distances
  const distanceFromParticipants = params.participants.map(p => ({
    userId: p.userId,
    distance: calculateHaversineDistance(
      p.latitude,
      p.longitude,
      optimalPoint.latitude,
      optimalPoint.longitude
    )
  }));
  
  // Use OpenAI to suggest a landmark name
  const prompt = `You are a local tour guide assistant. Find a well-known landmark, meeting point, or public place near these coordinates: ${optimalPoint.latitude.toFixed(6)}, ${optimalPoint.longitude.toFixed(6)}.

Suggest a specific, recognizable location name that would be good for a group meeting point (like a landmark, plaza, metro station, or popular café).

Respond in ${params.language} with ONLY valid JSON:
{
  "name": "Location Name",
  "reasoning": "Brief explanation why this is a good meeting point (1-2 sentences)"
}`;

  // the newest OpenAI model is "gpt-5" which was released August 7, 2025. do not change this unless explicitly requested by the user
  const response = await ensureOpenAI().chat.completions.create({
    model: "gpt-5",
    messages: [
      { role: "system", content: "You are a helpful local guide. Always respond with valid JSON only." },
      { role: "user", content: prompt }
    ],
    temperature: 0.7
  });
  
  const content = response.choices[0].message.content || "{}";
  const jsonContent = content.replace(/```json\n?/g, '').replace(/```\n?/g, '').trim();
  const aiResponse = JSON.parse(jsonContent);
  
  const result = {
    optimalPoint: {
      latitude: optimalPoint.latitude,
      longitude: optimalPoint.longitude,
      name: aiResponse.name || "Meeting Point"
    },
    reasoning: aiResponse.reasoning || "Central location for all participants",
    distanceFromParticipants
  };
  
  // Cache the result
  setCachedResponse(cacheKey, result);
  
  return result;
}

export interface TourSummaryRequest {
  groupId: string;
  tourName: string;
  tourDescription: string;
  participants: { userId: string; userName: string }[];
  messages: string[];
  stops?: string[];
  date: Date;
  language: string;
}

/**
 * Generate post-tour summary with participants, highlights, and shareable content
 * Analyzes chat messages to extract memorable moments
 * 
 * @param request Tour summary parameters
 * @returns Structured tour summary with highlights and shareable text
 */
export async function generateTourSummary(request: TourSummaryRequest): Promise<{
  title: string;
  highlights: string[];
  participantCount: number;
  participantNames: string[];
  memorableQuotes: string[];
  recommendations: string[];
  shareableText: string;
}> {
  // Rate limiting
  const rateLimitKey = `tour-summary:${request.groupId}`;
  if (!checkRateLimit(rateLimitKey, 30)) {
    throw new Error("Rate limit exceeded. Please wait before requesting again.");
  }
  
  // Cache key
  const cacheKey = `tour-summary:${JSON.stringify(request)}`;
  const cached = getCachedResponse<any>(cacheKey, 5);
  if (cached) return cached;
  
  // Sanitize inputs
  const sanitizedTourName = sanitizeInput(request.tourName);
  const sanitizedDescription = sanitizeInput(request.tourDescription);
  
  // Moderate user-generated content
  const messagesToAnalyze = request.messages.slice(0, 50); // Limit to last 50 messages
  for (const message of messagesToAnalyze.slice(0, 10)) { // Check first 10
    const moderation = await moderateContent(message, "comment");
    if (moderation.severity === "high") {
      throw new Error("Content contains inappropriate material");
    }
  }
  
  const messagesContext = messagesToAnalyze.join("\n");
  const stopsContext = request.stops?.join(", ") || "various locations";
  const participantNames = request.participants.map(p => p.userName);
  
  const prompt = `You are analyzing a completed tour experience to create a positive, engaging summary.

Tour: ${sanitizedTourName}
Description: ${sanitizedDescription}
Date: ${request.date.toLocaleDateString()}
Participants: ${participantNames.join(", ")} (${participantNames.length} people)
Stops visited: ${stopsContext}

Recent chat messages from the tour:
${messagesContext}

Create a warm, positive tour summary in ${request.language}. Extract:
1. A catchy title for the tour experience
2. 3-5 highlights or memorable moments
3. 2-3 memorable quotes from participants (if any good ones in messages)
4. 3-5 recommendations for future travelers
5. A 2-3 paragraph shareable summary text

Return ONLY valid JSON:
{
  "title": string,
  "highlights": string[],
  "memorableQuotes": string[],
  "recommendations": string[],
  "shareableText": string
}`;

  // the newest OpenAI model is "gpt-5" which was released August 7, 2025. do not change this unless explicitly requested by the user
  const response = await ensureOpenAI().chat.completions.create({
    model: "gpt-5",
    messages: [
      { role: "system", content: "You are a creative travel writer who creates engaging, positive tour summaries. Always respond with valid JSON only." },
      { role: "user", content: prompt }
    ],
    temperature: 0.8
  });
  
  const content = response.choices[0].message.content || "{}";
  const jsonContent = content.replace(/```json\n?/g, '').replace(/```\n?/g, '').trim();
  const aiResponse = JSON.parse(jsonContent);
  
  const result = {
    title: aiResponse.title || `${sanitizedTourName} Experience`,
    highlights: aiResponse.highlights || [],
    participantCount: participantNames.length,
    participantNames,
    memorableQuotes: aiResponse.memorableQuotes || [],
    recommendations: aiResponse.recommendations || [],
    shareableText: aiResponse.shareableText || `Had an amazing time on ${sanitizedTourName}!`
  };
  
  // Cache the result
  setCachedResponse(cacheKey, result);
  
  return result;
}

/**
 * Detect schedule conflicts and suggest alternative dates/times
 * 
 * @param params.proposedDate Proposed event date
 * @param params.existingEvents Array of existing scheduled events
 * @param params.groupId Group identifier for rate limiting
 * @param params.language Response language
 * @returns Conflict status and AI-suggested alternatives
 */
export async function detectScheduleConflict(params: {
  proposedDate: Date;
  existingEvents: Array<{ title: string; eventDate: Date; description?: string }>;
  groupId: string;
  language: string;
}): Promise<{
  hasConflict: boolean;
  conflictingEvents: string[];
  alternatives: Date[];
  suggestion: string;
}> {
  // Rate limiting
  const rateLimitKey = `schedule-conflict:${params.groupId}`;
  if (!checkRateLimit(rateLimitKey, 30)) {
    throw new Error("Rate limit exceeded. Please wait before requesting again.");
  }
  
  // Check for conflicts (within 2 hours)
  const conflictWindow = 2 * 60 * 60 * 1000; // 2 hours in milliseconds
  const conflictingEvents: string[] = [];
  
  for (const event of params.existingEvents) {
    const timeDiff = Math.abs(params.proposedDate.getTime() - event.eventDate.getTime());
    if (timeDiff < conflictWindow) {
      conflictingEvents.push(event.title);
    }
  }
  
  const hasConflict = conflictingEvents.length > 0;
  
  if (!hasConflict) {
    return {
      hasConflict: false,
      conflictingEvents: [],
      alternatives: [],
      suggestion: "No conflicts detected. The proposed time is available."
    };
  }
  
  // Use OpenAI to suggest alternatives
  const eventsContext = params.existingEvents
    .map(e => `- ${e.title} at ${e.eventDate.toISOString()}`)
    .join("\n");
  
  const prompt = `You are a scheduling assistant. A tour is proposed for ${params.proposedDate.toISOString()} but conflicts with:
${conflictingEvents.join(", ")}

Existing schedule:
${eventsContext}

Suggest 3 alternative dates/times that avoid conflicts. Consider:
- Time should be reasonable for tours (9 AM - 6 PM)
- Avoid too early morning or late evening
- Space events at least 3 hours apart

Respond in ${params.language} with ONLY valid JSON:
{
  "alternatives": ["ISO date string 1", "ISO date string 2", "ISO date string 3"],
  "suggestion": "Brief explanation of why these times work (1-2 sentences)"
}`;

  // the newest OpenAI model is "gpt-5" which was released August 7, 2025. do not change this unless explicitly requested by the user
  const response = await ensureOpenAI().chat.completions.create({
    model: "gpt-5",
    messages: [
      { role: "system", content: "You are a helpful scheduling assistant. Always respond with valid JSON only." },
      { role: "user", content: prompt }
    ],
    temperature: 0.7
  });
  
  const content = response.choices[0].message.content || "{}";
  const jsonContent = content.replace(/```json\n?/g, '').replace(/```\n?/g, '').trim();
  const aiResponse = JSON.parse(jsonContent);
  
  return {
    hasConflict: true,
    conflictingEvents,
    alternatives: (aiResponse.alternatives || []).map((dateStr: string) => new Date(dateStr)),
    suggestion: aiResponse.suggestion || "Consider scheduling at a different time to avoid conflicts."
  };
}
