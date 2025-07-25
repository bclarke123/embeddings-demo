import { db } from "../db";
import { scripts, scriptChunks } from "../db/schema";
import { chunkText } from "../lib/text-chunker";
import { eq } from "drizzle-orm";
import { Logger } from "../lib/logger";
import { AppMetrics, MetricsCollector } from "../lib/metrics";
import { batchEmbeddingService } from "../lib/batch-embedding";

export interface CreateScriptRequest {
  title: string;
  content: string;
}

export interface CreateScriptResponse {
  success: boolean;
  scriptId: number;
  chunksCreated: number;
  totalChunks: number;
  errors?: string[];
}

export interface ScriptSummary {
  id: number;
  title: string;
  uploadedAt: Date;
}

export class ScriptService {
  async createScript(request: CreateScriptRequest): Promise<CreateScriptResponse> {
    const startTime = Date.now();
    const { title, content } = request;

    Logger.info("Starting script creation", { 
      title, 
      contentLength: content.length 
    });

    try {
      // Create script record
      Logger.debug("Creating script record");
      const results = await db.insert(scripts).values({ title }).returning();
      const script = results[0];
      if (!script) {
        throw new Error("Failed to create script record");
      }
      Logger.info("Script created", { scriptId: script.id });
      
      // Chunk the text
      Logger.debug("Chunking text");
      const chunks = chunkText(content);
      Logger.info("Text chunked", { 
        scriptId: script.id,
        chunksCount: chunks.length 
      });
      
      // Generate embeddings for all chunks using batch processing
      Logger.info("Generating embeddings for chunks", {
        scriptId: script.id,
        chunksCount: chunks.length
      });

      let processedCount = 0;
      const errors: string[] = [];

      try {
        // Generate all embeddings in parallel using batch processor
        const embeddings = await MetricsCollector.time(
          'embeddings.batch_generation',
          () => batchEmbeddingService.generateEmbeddings(chunks),
          { 
            scriptId: script.id.toString(),
            chunksCount: chunks.length.toString()
          }
        );

        Logger.info("All embeddings generated, saving to database", {
          scriptId: script.id,
          embeddingsCount: embeddings.length
        });

        // Save all chunks to database
        for (let i = 0; i < chunks.length; i++) {
          try {
            const chunk = chunks[i];
            const embedding = embeddings[i];
            if (!chunk || !embedding) {
              throw new Error(`Missing chunk or embedding at index ${i}`);
            }
            await db.insert(scriptChunks).values({
              scriptId: script.id,
              content: chunk,
              chunkIndex: i,
              embedding: embedding,
            });
            
            processedCount++;
            
            if (i % 10 === 0) { // Log progress every 10 chunks
              Logger.debug(`Saved ${i + 1}/${chunks.length} chunks`, {
                scriptId: script.id,
                processedCount
              });
            }
          } catch (error) {
            const errorMsg = `Chunk ${i + 1}: ${error instanceof Error ? error.message : 'Unknown error'}`;
            Logger.error(`Failed to save chunk ${i + 1}`, error as Error, {
              scriptId: script.id,
              chunkIndex: i
            });
            errors.push(errorMsg);
          }
        }
      } catch (error) {
        // If batch embedding fails, fall back to sequential processing
        Logger.warn("Batch embedding failed, falling back to sequential processing", {
          scriptId: script.id,
          error: error instanceof Error ? error.message : 'Unknown error'
        });

        for (let i = 0; i < chunks.length; i++) {
          try {
            Logger.debug(`Processing chunk ${i + 1}/${chunks.length} (sequential fallback)`, {
              scriptId: script.id,
              chunkIndex: i
            });
            
            const chunk = chunks[i];
            if (!chunk) {
              throw new Error(`Chunk at index ${i} is undefined`);
            }
            
            // Generate embedding individually
            const embedding = await MetricsCollector.time(
              'embedding.generation_fallback',
              () => batchEmbeddingService.generateEmbedding(chunk),
              { scriptId: script.id.toString() }
            );
            
            // Save chunk immediately
            await db.insert(scriptChunks).values({
              scriptId: script.id,
              content: chunk,
              chunkIndex: i,
              embedding: embedding,
            });
            
            processedCount++;
            
            // Add delay between chunks to avoid rate limits
            if (i < chunks.length - 1) {
              await Bun.sleep(1000); // 1 second between chunks
            }
          } catch (error) {
            const errorMsg = `Chunk ${i + 1}: ${error instanceof Error ? error.message : 'Unknown error'}`;
            Logger.error(`Failed to process chunk ${i + 1} (fallback)`, error as Error, {
              scriptId: script.id,
              chunkIndex: i
            });
            errors.push(errorMsg);
          }
        }
      }
      
      const result = {
        success: processedCount > 0,
        scriptId: script.id,
        chunksCreated: processedCount,
        totalChunks: chunks.length,
        errors: errors.length > 0 ? errors : undefined
      };

      Logger.info("Script processing complete", {
        scriptId: script.id,
        processedCount,
        totalChunks: chunks.length,
        success: result.success,
        errorCount: errors.length
      });

      // Record metrics
      AppMetrics.scriptCreated(script.id, processedCount);
      Logger.performance('script.creation', startTime, {
        scriptId: script.id,
        chunksProcessed: processedCount
      });
      
      return result;
    } catch (error) {
      Logger.error("Script creation failed", error as Error, {
        title,
        contentLength: content.length
      });
      throw error;
    }
  }

  async getAllScripts(): Promise<ScriptSummary[]> {
    Logger.debug("Fetching all scripts");
    const startTime = Date.now();
    
    try {
      const allScripts = await db.select().from(scripts);
      
      Logger.info("Scripts fetched", { count: allScripts.length });
      Logger.performance('scripts.fetch', startTime, { 
        scriptsCount: allScripts.length 
      });
      
      return allScripts.map(script => ({
        id: script.id,
        title: script.title,
        uploadedAt: script.uploadedAt
      }));
    } catch (error) {
      Logger.error("Failed to fetch scripts", error as Error);
      throw error;
    }
  }

  async deleteScript(id: number): Promise<void> {
    Logger.info("Deleting script", { scriptId: id });
    const startTime = Date.now();
    
    try {
      await db.delete(scripts).where(eq(scripts.id, id));
      
      Logger.info("Script deleted", { scriptId: id });
      Logger.performance('script.deletion', startTime, { scriptId: id });
      AppMetrics.scriptDeleted(id);
    } catch (error) {
      Logger.error("Failed to delete script", error as Error, { scriptId: id });
      throw error;
    }
  }
}