import { db } from "../db";
import { scriptChunks, scripts, searches } from "../db/schema";
import { sql, eq } from "drizzle-orm";
import crypto from "crypto";
import { CacheManager } from "../lib/cache";
import { Logger } from "../lib/logger";
import { AppMetrics, MetricsCollector } from "../lib/metrics";
import { batchEmbeddingService } from "../lib/batch-embedding";

export interface SearchRequest {
  query: string;
  limit: number;
}

export interface SearchResult {
  content: string;
  scriptTitle: string;
  similarity: number;
  scriptId: number;
}

export interface SearchResponse {
  query: string;
  results: SearchResult[];
  cached?: boolean;
}

export class SearchService {
  private getQueryHash(query: string): string {
    return crypto.createHash("md5").update(query).digest("hex");
  }

  private getCacheKey(query: string): string {
    return `search:${this.getQueryHash(query)}`;
  }

  async search(request: SearchRequest): Promise<SearchResponse> {
    const startTime = Date.now();
    const { query, limit } = request;
    const cacheKey = this.getCacheKey(query);
    
    Logger.info("Starting search", { 
      query: query.substring(0, 100), // Log first 100 chars only
      limit 
    });

    // Check cache first
    const cached = await CacheManager.get<SearchResponse>(cacheKey);
    if (cached) {
      Logger.info("Cache hit for search", { 
        query: query.substring(0, 100),
        resultCount: cached.results.length 
      });
      AppMetrics.searchPerformed(cached.results.length, true);
      return { ...cached, cached: true };
    }

    Logger.debug("Cache miss, performing vector search");

    try {
      // Generate embedding for query with timing using batch service
      const queryEmbedding = await MetricsCollector.time(
        'embedding.generation',
        () => batchEmbeddingService.generateEmbedding(query),
        { operation: 'search' }
      );
      
      // Store search in history
      await db.insert(searches).values({
        query,
        queryEmbedding,
      });
      
      // Perform vector similarity search with timing
      const results = await MetricsCollector.time(
        'search.vector_query',
        () => db
          .select({
            id: scriptChunks.id,
            content: scriptChunks.content,
            scriptId: scriptChunks.scriptId,
            scriptTitle: scripts.title,
            similarity: sql<number>`1 - (${scriptChunks.embedding} <=> ${JSON.stringify(queryEmbedding)}::vector)`,
          })
          .from(scriptChunks)
          .innerJoin(scripts, eq(scriptChunks.scriptId, scripts.id))
          .orderBy(sql`1 - (${scriptChunks.embedding} <=> ${JSON.stringify(queryEmbedding)}::vector) DESC`)
          .limit(limit),
        { limit: limit.toString() }
      );
      
      // Get unique script IDs for cache tagging
      const scriptIds = [...new Set(results.map(r => r.scriptId))];
      
      const response: SearchResponse = {
        query,
        results: results.map(r => ({
          content: r.content,
          scriptTitle: r.scriptTitle,
          similarity: r.similarity,
          scriptId: r.scriptId,
        })),
        cached: false
      };
      
      Logger.info("Search completed", {
        query: query.substring(0, 100),
        resultCount: results.length,
        uniqueScripts: scriptIds.length
      });

      // Cache results with tags for invalidation
      const cacheTags = [
        'search',
        ...scriptIds.map(id => `script:${id}`)
      ];
      
      await CacheManager.set(cacheKey, response, {
        ttl: 900, // 15 minutes
        tags: cacheTags
      });

      // Record metrics
      AppMetrics.searchPerformed(results.length, false);
      Logger.performance('search.complete', startTime, {
        resultCount: results.length,
        cached: false
      });
      
      return response;
    } catch (error) {
      Logger.error("Search failed", error as Error, {
        query: query.substring(0, 100),
        limit
      });
      throw error;
    }
  }

  async invalidateCache(scriptIds?: number[]): Promise<void> {
    if (scriptIds && scriptIds.length > 0) {
      Logger.info("Invalidating cache for specific scripts", { scriptIds });
      const tags = scriptIds.map(id => `script:${id}`);
      await CacheManager.invalidateByTags(tags);
      AppMetrics.cacheInvalidation(tags);
    } else {
      Logger.info("Invalidating all search cache");
      await CacheManager.invalidateByTags(['search']);
      AppMetrics.cacheInvalidation(['search']);
    }
  }

  async getCacheStats() {
    Logger.debug("Fetching cache stats");
    return await CacheManager.getStats();
  }
}