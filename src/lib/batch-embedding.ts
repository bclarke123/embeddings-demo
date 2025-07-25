import { generateEmbedding } from "./gemini";
import { BatchProcessor } from "./batch-processor";
import { Logger } from "./logger";
import { AppMetrics } from "./metrics";

export class BatchEmbeddingService {
  private batchProcessor: BatchProcessor<string, number[]>;

  constructor() {
    this.batchProcessor = new BatchProcessor({
      maxBatchSize: 5, // Process up to 5 embeddings at once
      maxWaitTime: 2000, // Wait max 2 seconds before processing
      concurrency: 2, // Allow 2 concurrent batches
      processor: this.processBatch.bind(this),
      onError: (error, items) => {
        Logger.error("Batch embedding failed", error, {
          itemCount: items.length
        });
      }
    });
  }

  private async processBatch(texts: string[]): Promise<number[][]> {
    Logger.info("Processing embedding batch", { 
      batchSize: texts.length 
    });

    const startTime = Date.now();
    const results: number[][] = [];

    // Process embeddings with delays to respect rate limits
    for (let i = 0; i < texts.length; i++) {
      try {
        const text = texts[i];
        if (!text) {
          throw new Error(`Text at index ${i} is undefined`);
        }
        const embedding = await generateEmbedding(text);
        results.push(embedding);
        
        AppMetrics.embeddingGenerated(Date.now() - startTime, true);

        // Add delay between requests within batch
        if (i < texts.length - 1) {
          await Bun.sleep(500); // 500ms between embeddings in batch
        }
      } catch (error) {
        Logger.error(`Failed to generate embedding for item ${i}`, error as Error);
        AppMetrics.embeddingGenerated(Date.now() - startTime, false);
        throw error; // This will fail the entire batch
      }
    }

    Logger.info("Embedding batch completed", {
      batchSize: texts.length,
      duration: Date.now() - startTime
    });

    return results;
  }

  async generateEmbedding(text: string): Promise<number[]> {
    return await this.batchProcessor.process(text);
  }

  async generateEmbeddings(texts: string[]): Promise<number[][]> {
    const promises = texts.map(text => this.generateEmbedding(text));
    return await Promise.all(promises);
  }

  async waitForCompletion(): Promise<void> {
    await this.batchProcessor.waitForEmpty();
  }

  getStats() {
    return this.batchProcessor.getStats();
  }
}

// Global instance for application use
export const batchEmbeddingService = new BatchEmbeddingService();