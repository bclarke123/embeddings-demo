import { db } from "../db";
import { scriptChunks, scripts, searches } from "../db/schema";
import { sql, eq } from "drizzle-orm";
import crypto from "crypto";
import { CacheManager } from "../lib/cache";
import { Logger } from "../lib/logger";
import { AppMetrics, MetricsCollector } from "../lib/metrics";
import { batchEmbeddingService } from "../lib/batch-embedding";
import type { SearchRequestInput } from "../lib/schemas";

// Use Zod-generated type instead of custom interface
export type SearchRequest = SearchRequestInput;

export interface SearchResult {
  content: string;
  scriptTitle: string;
  similarity: number;
  scriptId: number;
  chunkIndex: number;
}

export interface GroupedSearchResult {
  scriptId: number;
  scriptTitle: string;
  avgSimilarity: number;
  content: string;
  chunkIndices: number[];
}

export interface SearchResponse {
  query: string;
  results: GroupedSearchResult[];
  cached?: boolean;
}

export class SearchService {
  private getQueryHash(query: string): string {
    return crypto.createHash("md5").update(query).digest("hex");
  }

  private getCacheKey(query: string): string {
    return `search:${this.getQueryHash(query)}`;
  }

  private findOverlap(text1: string, text2: string, minOverlap: number = 50): number {
    // Try to find where text1 ends and text2 begins with overlap
    // Start from the minimum overlap and work up
    for (let overlapSize = Math.min(text1.length, text2.length); overlapSize >= minOverlap; overlapSize--) {
      const text1End = text1.slice(-overlapSize);
      const text2Start = text2.slice(0, overlapSize);
      
      if (text1End === text2Start) {
        return overlapSize;
      }
    }
    return 0;
  }

  private groupAndStitchResults(results: any[], limit: number): GroupedSearchResult[] {
    // Group by script ID
    const groupedByScript = new Map<number, any[]>();
    
    for (const result of results) {
      if (!groupedByScript.has(result.scriptId)) {
        groupedByScript.set(result.scriptId, []);
      }
      groupedByScript.get(result.scriptId)!.push(result);
    }
    
    // Process each script group - now we'll create one result per script
    const processedGroups: GroupedSearchResult[] = [];
    
    for (const [scriptId, chunks] of groupedByScript) {
      // Calculate average similarity for the entire script
      const avgSimilarity = chunks.reduce((sum, chunk) => sum + chunk.similarity, 0) / chunks.length;
      
      // Sort chunks by chunk index for proper ordering
      chunks.sort((a, b) => a.chunkIndex - b.chunkIndex);
      
      // Find overlapping chunk sequences and stitch them
      const sequences: any[][] = [];
      const used = new Set<number>();
      
      for (let i = 0; i < chunks.length; i++) {
        if (used.has(i)) continue;
        
        const currentSequence: any[] = [chunks[i]];
        used.add(i);
        
        // Look for chunks that overlap with the current sequence
        let lastChunkContent = chunks[i].content;
        let foundOverlap = true;
        
        while (foundOverlap) {
          foundOverlap = false;
          
          for (let j = 0; j < chunks.length; j++) {
            if (used.has(j)) continue;
            
            // Check if this chunk overlaps with the end of our current sequence
            const overlap = this.findOverlap(lastChunkContent, chunks[j].content);
            if (overlap > 0) {
              currentSequence.push(chunks[j]);
              used.add(j);
              lastChunkContent = chunks[j].content;
              foundOverlap = true;
              break;
            }
          }
        }
        
        sequences.push(currentSequence);
      }
      
      // Stitch all sequences together for this script
      let fullContent = '';
      
      for (let seqIdx = 0; seqIdx < sequences.length; seqIdx++) {
        const sequence = sequences[seqIdx];
        
        // Stitch content within each sequence by removing overlaps
        let sequenceContent = sequence[0].content;
        
        for (let i = 1; i < sequence.length; i++) {
          const overlap = this.findOverlap(sequence[i-1].content, sequence[i].content);
          if (overlap > 0) {
            // Remove the overlapping part from the beginning of the next chunk
            sequenceContent += sequence[i].content.slice(overlap);
          } else {
            // No overlap found, just concatenate
            sequenceContent += sequence[i].content;
          }
        }
        
        // Add sequence to full content with separator if not first sequence
        if (seqIdx > 0) {
          fullContent += '\n\n[...]\n\n';  // Visual separator for non-contiguous sections
        }
        fullContent += sequenceContent;
      }
      
      processedGroups.push({
        scriptId,
        scriptTitle: chunks[0].scriptTitle,
        avgSimilarity,
        content: fullContent,
        chunkIndices: chunks.map(chunk => chunk.chunkIndex).sort((a, b) => a - b)
      });
    }
    
    // Sort by average similarity and limit results
    processedGroups.sort((a, b) => b.avgSimilarity - a.avgSimilarity);
    return processedGroups.slice(0, limit);
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
            chunkIndex: scriptChunks.chunkIndex,
            similarity: sql<number>`1 - (${scriptChunks.embedding} <=> ${JSON.stringify(queryEmbedding)}::vector)`,
          })
          .from(scriptChunks)
          .innerJoin(scripts, eq(scriptChunks.scriptId, scripts.id))
          .orderBy(sql`1 - (${scriptChunks.embedding} <=> ${JSON.stringify(queryEmbedding)}::vector) DESC`)
          .limit(limit * 3), // Get more results to have better grouping
        { limit: limit.toString() }
      );
      
      // Group results by script and stitch consecutive chunks
      const groupedResults = this.groupAndStitchResults(results, limit);
      
      // Get unique script IDs for cache tagging
      const scriptIds = [...new Set(groupedResults.map(r => r.scriptId))];
      
      const response: SearchResponse = {
        query,
        results: groupedResults,
        cached: false
      };
      
      Logger.info("Search completed", {
        query: query.substring(0, 100),
        rawResultCount: results.length,
        groupedResultCount: groupedResults.length,
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
      AppMetrics.searchPerformed(groupedResults.length, false);
      Logger.performance('search.complete', startTime, {
        resultCount: groupedResults.length,
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