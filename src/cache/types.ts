// src/cache/types.ts
/**
 * Options for cache-enabled methods.
 */
export interface CacheOptions {
  /**
   * If true, bypass cache read but still write the result to cache.
   * Useful for forcing fresh data while updating the cache.
   */
  skipCache?: boolean
}
