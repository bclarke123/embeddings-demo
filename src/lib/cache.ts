import { redis } from "./redis";

export interface CacheOptions {
  ttl?: number; // Time to live in seconds
  tags?: string[]; // Tags for cache invalidation
}

export class CacheManager {
  private static readonly TAG_PREFIX = "tag:";
  private static readonly DEFAULT_TTL = 900; // 15 minutes

  /**
   * Store data in cache with optional tags for invalidation
   */
  static async set(key: string, data: any, options: CacheOptions = {}): Promise<void> {
    const { ttl = this.DEFAULT_TTL, tags = [] } = options;
    
    // Store the actual data
    await redis.setEx(key, ttl, JSON.stringify(data));
    
    // Associate with tags for invalidation
    if (tags.length > 0) {
      const multi = redis.multi();
      
      for (const tag of tags) {
        const tagKey = `${this.TAG_PREFIX}${tag}`;
        multi.sAdd(tagKey, key);
        multi.expire(tagKey, ttl + 60); // Tag expires slightly after data
      }
      
      await multi.exec();
    }
  }

  /**
   * Get data from cache
   */
  static async get<T>(key: string): Promise<T | null> {
    const data = await redis.get(key);
    return data ? JSON.parse(data) : null;
  }

  /**
   * Delete specific cache key
   */
  static async delete(key: string): Promise<void> {
    await redis.del(key);
  }

  /**
   * Invalidate all cache entries with specific tags
   */
  static async invalidateByTags(tags: string[]): Promise<void> {
    if (tags.length === 0) return;

    const multi = redis.multi();
    
    for (const tag of tags) {
      const tagKey = `${this.TAG_PREFIX}${tag}`;
      
      // Get all keys associated with this tag
      const keys = await redis.sMembers(tagKey);
      
      if (keys.length > 0) {
        // Delete all associated cache entries
        for (const key of keys) {
          multi.del(key);
        }
      }
      
      // Delete the tag set itself
      multi.del(tagKey);
    }
    
    await multi.exec();
  }

  /**
   * Clear all cache entries matching a pattern
   */
  static async invalidateByPattern(pattern: string): Promise<void> {
    const keys = await redis.keys(pattern);
    if (keys.length > 0) {
      for (const key of keys) {
        await redis.del(key);
      }
    }
  }

  /**
   * Get cache statistics
   */
  static async getStats(): Promise<{
    totalKeys: number;
    searchKeys: number;
    tagKeys: number;
  }> {
    const allKeys = await redis.keys('*');
    const searchKeys = allKeys.filter(key => key.startsWith('search:'));
    const tagKeys = allKeys.filter(key => key.startsWith(this.TAG_PREFIX));
    
    return {
      totalKeys: allKeys.length,
      searchKeys: searchKeys.length,
      tagKeys: tagKeys.length
    };
  }
}