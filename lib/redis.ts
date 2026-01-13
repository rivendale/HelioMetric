/**
 * Upstash Redis Client
 * Provides caching for NOAA data, geocoding results, and expensive calculations
 */

import { Redis } from '@upstash/redis';

// Lazy initialization - only create client when actually used
let redisClient: Redis | null = null;

/**
 * Get Redis client instance (singleton pattern)
 * Returns null if credentials are not configured
 */
export function getRedisClient(): Redis | null {
  if (redisClient) return redisClient;

  const url = process.env.UPSTASH_REDIS_REST_URL;
  const token = process.env.UPSTASH_REDIS_REST_TOKEN;

  if (!url || !token) {
    console.warn('Redis not configured: UPSTASH_REDIS_REST_URL or UPSTASH_REDIS_REST_TOKEN missing');
    return null;
  }

  redisClient = new Redis({
    url,
    token,
  });

  return redisClient;
}

/**
 * Cache keys used throughout the application
 */
export const CacheKeys = {
  NOAA_KINDEX: 'noaa:kindex:latest',
  NOAA_KINDEX_HISTORY: 'noaa:kindex:history',
  GEOCODE_PREFIX: 'geocode:',
  SOLAR_TERMS: 'astronomy:solar_terms:',
  ZODIAC_CALC: 'zodiac:calc:',
} as const;

/**
 * Cache TTLs in seconds
 */
export const CacheTTL = {
  NOAA_DATA: 300,          // 5 minutes - NOAA updates every 15 min
  GEOCODE: 86400 * 30,     // 30 days - locations don't change
  SOLAR_TERMS: 86400,      // 1 day - solar terms are deterministic per year
  ZODIAC: 86400 * 365,     // 1 year - zodiac calculations are static
} as const;

/**
 * Get cached value with type safety
 */
export async function getCached<T>(key: string): Promise<T | null> {
  const redis = getRedisClient();
  if (!redis) return null;

  try {
    const value = await redis.get<T>(key);
    return value;
  } catch (error) {
    console.error(`Redis GET error for key ${key}:`, error);
    return null;
  }
}

/**
 * Set cached value with TTL
 */
export async function setCached<T>(
  key: string,
  value: T,
  ttlSeconds: number
): Promise<boolean> {
  const redis = getRedisClient();
  if (!redis) return false;

  try {
    await redis.set(key, value, { ex: ttlSeconds });
    return true;
  } catch (error) {
    console.error(`Redis SET error for key ${key}:`, error);
    return false;
  }
}

/**
 * Delete cached value
 */
export async function deleteCached(key: string): Promise<boolean> {
  const redis = getRedisClient();
  if (!redis) return false;

  try {
    await redis.del(key);
    return true;
  } catch (error) {
    console.error(`Redis DEL error for key ${key}:`, error);
    return false;
  }
}

/**
 * Get or compute pattern - fetches from cache or computes and stores
 */
export async function getOrCompute<T>(
  key: string,
  computeFn: () => Promise<T>,
  ttlSeconds: number
): Promise<T> {
  // Try cache first
  const cached = await getCached<T>(key);
  if (cached !== null) {
    return cached;
  }

  // Compute fresh value
  const value = await computeFn();

  // Store in cache (don't await - fire and forget)
  setCached(key, value, ttlSeconds);

  return value;
}
