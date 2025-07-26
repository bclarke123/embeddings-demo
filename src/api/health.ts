import { Hono } from "hono";
import { sql } from "drizzle-orm";
import { db } from "../db";
import { redis } from "../lib/redis";
import { Logger } from "../lib/logger";
import { MetricsCollector } from "../lib/metrics";
import { SearchService } from "../services/search-service";
import { zodValidateQuery, getValidatedQuery } from "../middleware/zod-validation";
import { healthMetricsQuerySchema } from "../lib/schemas";
import type { HealthMetricsQuery } from "../lib/schemas";

const searchService = new SearchService();

export const healthRoutes = new Hono();

interface HealthCheck {
  status: 'ok' | 'error';
  message?: string;
  duration?: number;
}

interface HealthResponse {
  status: 'healthy' | 'unhealthy';
  timestamp: string;
  uptime: number;
  checks: {
    database: HealthCheck;
    redis: HealthCheck;
    gemini: HealthCheck;
  };
  metrics?: {
    cache: {
      totalKeys: number;
      searchKeys: number;  
      tagKeys: number;
    };
    recent: Array<{
      timestamp: Date;
      name: string;
      value: number;
      tags?: Record<string, string>;
    }>;
  };
}

async function checkDatabase(): Promise<HealthCheck> {
  const start = Date.now();
  try {
    await db.execute(sql`SELECT 1`);
    return {
      status: 'ok',
      duration: Date.now() - start
    };
  } catch (error) {
    Logger.error("Database health check failed", error as Error);
    return {
      status: 'error',
      message: error instanceof Error ? error.message : 'Unknown error',
      duration: Date.now() - start
    };
  }
}

async function checkRedis(): Promise<HealthCheck> {
  const start = Date.now();
  try {
    await redis.ping();
    return {
      status: 'ok',
      duration: Date.now() - start
    };
  } catch (error) {
    Logger.error("Redis health check failed", error as Error);
    return {
      status: 'error',
      message: error instanceof Error ? error.message : 'Unknown error',
      duration: Date.now() - start
    };
  }
}

async function checkGemini(): Promise<HealthCheck> {
  const start = Date.now();
  try {
    // We'll do a simple check by seeing if the API key is configured
    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey) {
      return {
        status: 'error',
        message: 'GEMINI_API_KEY not configured',
        duration: Date.now() - start
      };
    }
    
    return {
      status: 'ok',
      duration: Date.now() - start
    };
  } catch (error) {
    Logger.error("Gemini health check failed", error as Error);
    return {
      status: 'error',
      message: error instanceof Error ? error.message : 'Unknown error',
      duration: Date.now() - start
    };
  }
}

healthRoutes.get("/", async (c) => {
  const startTime = Date.now();
  
  Logger.info("Health check requested");

  // Run all health checks in parallel
  const [database, redis, gemini] = await Promise.all([
    checkDatabase(),
    checkRedis(),
    checkGemini()
  ]);

  const checks = { database, redis, gemini };
  const allHealthy = Object.values(checks).every(check => check.status === 'ok');
  
  const response: HealthResponse = {
    status: allHealthy ? 'healthy' : 'unhealthy',
    timestamp: new Date().toISOString(),
    uptime: process.uptime(),
    checks
  };

  const statusCode = allHealthy ? 200 : 503;
  
  Logger.info("Health check completed", {
    status: response.status,
    checks: Object.fromEntries(
      Object.entries(checks).map(([key, value]) => [key, value.status])
    ),
    duration: Date.now() - startTime
  });

  return c.json(response, statusCode);
});

// Detailed health check with metrics
healthRoutes.get("/detailed", async (c) => {
  const startTime = Date.now();
  
  Logger.info("Detailed health check requested");

  // Run all health checks in parallel
  const [database, redis, gemini] = await Promise.all([
    checkDatabase(),
    checkRedis(),
    checkGemini()
  ]);

  const checks = { database, redis, gemini };
  const allHealthy = Object.values(checks).every(check => check.status === 'ok');
  
  // Get additional metrics
  const cacheStats = await searchService.getCacheStats();
  const recentMetrics = MetricsCollector.getMetrics(
    new Date(Date.now() - 5 * 60 * 1000) // Last 5 minutes
  );

  const response: HealthResponse = {
    status: allHealthy ? 'healthy' : 'unhealthy',
    timestamp: new Date().toISOString(),
    uptime: process.uptime(),
    checks,
    metrics: {
      cache: cacheStats,
      recent: recentMetrics.slice(-20) // Last 20 metrics
    }
  };

  const statusCode = allHealthy ? 200 : 503;
  
  Logger.info("Detailed health check completed", {
    status: response.status,
    metricsCount: recentMetrics.length,
    duration: Date.now() - startTime
  });

  return c.json(response, statusCode);
});

// Metrics endpoint
healthRoutes.get("/metrics", 
  zodValidateQuery(healthMetricsQuerySchema),
  async (c) => {
    Logger.debug("Metrics endpoint requested");

    const query = getValidatedQuery<HealthMetricsQuery>(c);
    const sinceDate = query.since;
    
    const metrics = MetricsCollector.getMetrics(sinceDate);
    const cacheStats = await searchService.getCacheStats();

  // Aggregate common metrics
  const aggregated = {
    'script.created': MetricsCollector.getAggregatedMetrics('script.created', sinceDate),
    'search.performed': MetricsCollector.getAggregatedMetrics('search.performed', sinceDate),
    'embedding.generation': MetricsCollector.getAggregatedMetrics('embedding.generation', sinceDate),
  };

  return c.json({
    period: {
      since: sinceDate.toISOString(),
      until: new Date().toISOString()
    },
    cache: cacheStats,
    metrics: {
      raw: metrics,
      aggregated
    }
  });
});