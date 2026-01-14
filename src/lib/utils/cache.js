/**
 * In-Memory Cache Utility
 * 
 * Provides simple TTL-based caching for expensive database queries.
 * Cache is automatically invalidated after TTL expires.
 */

const cache = new Map();

/**
 * Cache duration constants (in seconds)
 */
export const CACHE_TTL = {
  SHORT: 60,        // 1 minute - for frequently changing data
  MEDIUM: 300,      // 5 minutes - for dashboard data
  LONG: 900,        // 15 minutes - for analytics/standings
  VERY_LONG: 3600,  // 1 hour - for historical data
};

/**
 * Execute a function with caching.
 * If cached value exists and hasn't expired, returns cached value.
 * Otherwise executes the function and caches the result.
 * 
 * @param {string} key - Unique cache key
 * @param {number} ttlSeconds - Time to live in seconds
 * @param {Function} fn - Async function to execute if cache miss
 * @returns {Promise<any>} - Cached or fresh result
 * 
 * @example
 * const data = await cached('standings:all', CACHE_TTL.LONG, async () => {
 *   return await db.query('SELECT * FROM standings');
 * });
 */
export async function cached(key, ttlSeconds, fn) {
  const entry = cache.get(key);
  const now = Date.now();
  
  // Return cached value if valid
  if (entry && now < entry.expires) {
    return entry.value;
  }
  
  // Execute function and cache result
  const value = await fn();
  cache.set(key, {
    value,
    expires: now + ttlSeconds * 1000,
    createdAt: now,
  });
  
  return value;
}

/**
 * Clear all cached entries.
 * Call this after sync operations complete.
 */
export function clearCache() {
  const size = cache.size;
  cache.clear();
  if (size > 0) {
    console.log(`🧹 Cache cleared (${size} entries)`);
  }
}

/**
 * Clear specific cache entries by key prefix.
 * 
 * @param {string} prefix - Key prefix to match (e.g., 'standings:')
 */
export function clearCacheByPrefix(prefix) {
  let cleared = 0;
  for (const key of cache.keys()) {
    if (key.startsWith(prefix)) {
      cache.delete(key);
      cleared++;
    }
  }
  if (cleared > 0) {
    console.log(`🧹 Cleared ${cleared} cache entries with prefix '${prefix}'`);
  }
}

/**
 * Get cache statistics for debugging.
 * 
 * @returns {{ size: number, keys: string[] }}
 */
export function getCacheStats() {
  return {
    size: cache.size,
    keys: Array.from(cache.keys()),
  };
}
