// Utility script to clear rate limit cache for development
import { redis } from "./src/lib/redis";

async function clearRateLimits() {
  console.log("Clearing rate limit cache...");
  
  try {
    // Get all rate limit keys
    const keys = await redis.keys('ratelimit:*');
    console.log(`Found ${keys.length} rate limit keys`);
    
    if (keys.length > 0) {
      // Delete all rate limit keys
      await redis.del(...keys);
      console.log(`✅ Cleared ${keys.length} rate limit entries`);
    } else {
      console.log("✅ No rate limit entries to clear");
    }
    
    // Also clear any tag keys that might be stale
    const tagKeys = await redis.keys('tag:*');
    if (tagKeys.length > 0) {
      await redis.del(...tagKeys);
      console.log(`✅ Cleared ${tagKeys.length} cache tag entries`);
    }
    
    console.log("🎉 Rate limit cache cleared successfully!");
  } catch (error) {
    console.error("❌ Error clearing rate limits:", error);
  } finally {
    process.exit(0);
  }
}

clearRateLimits();