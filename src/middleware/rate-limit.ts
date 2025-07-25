import type { Context, Next } from "hono";
import { redis } from "../lib/redis";
import { RateLimitError } from "./error-handler";

interface RateLimitOptions {
  windowMs: number;
  maxRequests: number;
  keyGenerator?: (c: Context) => string;
}

export function rateLimit(options: RateLimitOptions) {
  return async (c: Context, next: Next) => {
    const key = options.keyGenerator 
      ? options.keyGenerator(c)
      : `ratelimit:${c.req.header('x-forwarded-for') || 'unknown'}`;
    
    const current = await redis.incr(key);
    
    if (current === 1) {
      // First request, set expiration
      await redis.expire(key, Math.ceil(options.windowMs / 1000));
    }
    
    if (current > options.maxRequests) {
      const ttl = await redis.ttl(key);
      
      c.header('X-RateLimit-Limit', options.maxRequests.toString());
      c.header('X-RateLimit-Remaining', '0');
      c.header('X-RateLimit-Reset', (Date.now() + ttl * 1000).toString());
      
      throw new Error(`Rate limit exceeded. Try again in ${ttl} seconds.`);
    }
    
    // Set rate limit headers
    c.header('X-RateLimit-Limit', options.maxRequests.toString());
    c.header('X-RateLimit-Remaining', (options.maxRequests - current).toString());
    
    await next();
  };
}

// Predefined rate limiters
export const generalRateLimit = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  maxRequests: 100, // 100 requests per window
});

export const uploadRateLimit = rateLimit({
  windowMs: 60 * 60 * 1000, // 1 hour
  maxRequests: 10, // 10 uploads per hour
});

export const searchRateLimit = rateLimit({
  windowMs: 1 * 60 * 1000, // 1 minute
  maxRequests: 30, // 30 searches per minute
});