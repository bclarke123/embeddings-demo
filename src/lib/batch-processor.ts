import { Logger } from "./logger";
import { MetricsCollector } from "./metrics";

export interface BatchItem<T, R> {
  id: string;
  data: T;
  resolve: (result: R) => void;
  reject: (error: Error) => void;
}

export interface BatchProcessorOptions<T, R> {
  maxBatchSize: number;
  maxWaitTime: number; // milliseconds
  concurrency: number;
  processor: (items: T[]) => Promise<R[]>;
  onError?: (error: Error, items: T[]) => void;
}

export class BatchProcessor<T, R> {
  private pending: BatchItem<T, R>[] = [];
  private processing: Set<Promise<void>> = new Set();
  private timer: Timer | null = null;

  constructor(private options: BatchProcessorOptions<T, R>) {}

  async process(data: T): Promise<R> {
    return new Promise<R>((resolve, reject) => {
      const item: BatchItem<T, R> = {
        id: Math.random().toString(36).substring(7),
        data,
        resolve,
        reject
      };

      this.pending.push(item);

      // Start timer if not already running
      if (!this.timer) {
        this.timer = setTimeout(() => {
          this.flush();
        }, this.options.maxWaitTime);
      }

      // Process immediately if batch is full
      if (this.pending.length >= this.options.maxBatchSize) {
        this.flush();
      }
    });
  }

  private async flush() {
    if (this.pending.length === 0) return;

    // Clear timer
    if (this.timer) {
      clearTimeout(this.timer);
      this.timer = null;
    }

    // Wait for concurrency slot
    while (this.processing.size >= this.options.concurrency) {
      await Promise.race(this.processing);
    }

    // Take items from pending queue
    const batchItems = this.pending.splice(0, this.options.maxBatchSize);
    const batchData = batchItems.map(item => item.data);

    Logger.debug(`Processing batch`, {
      batchSize: batchItems.length,
      activeBatches: this.processing.size
    });

    // Process the batch
    const batchPromise = this.processBatch(batchItems, batchData);
    this.processing.add(batchPromise);

    // Clean up when done
    batchPromise.finally(() => {
      this.processing.delete(batchPromise);
    });

    // Continue processing if there are more pending items
    if (this.pending.length > 0) {
      setTimeout(() => this.flush(), 0);
    }
  }

  private async processBatch(items: BatchItem<T, R>[], data: T[]): Promise<void> {
    const startTime = Date.now();
    
    try {
      const results = await this.options.processor(data);
      
      if (results.length !== items.length) {
        throw new Error(`Processor returned ${results.length} results for ${items.length} items`);
      }

      // Resolve all items with their results
      items.forEach((item, index) => {
        const result = results[index];
        if (result === undefined) {
          item.reject(new Error(`Result at index ${index} is undefined`));
        } else {
          item.resolve(result);
        }
      });

      Logger.debug("Batch processed successfully", {
        batchSize: items.length,
        duration: Date.now() - startTime
      });

      MetricsCollector.timing('batch.processing', Date.now() - startTime, {
        batchSize: items.length.toString(),
        status: 'success'
      });

    } catch (error) {
      Logger.error("Batch processing failed", error as Error, {
        batchSize: items.length
      });

      // Reject all items with the error
      items.forEach(item => {
        item.reject(error as Error);
      });

      MetricsCollector.timing('batch.processing', Date.now() - startTime, {
        batchSize: items.length.toString(),
        status: 'error'
      });

      // Call error handler if provided
      if (this.options.onError) {
        this.options.onError(error as Error, data);
      }
    }
  }

  async waitForEmpty(): Promise<void> {
    // Process any remaining items
    if (this.pending.length > 0) {
      this.flush();
    }

    // Wait for all processing to complete
    while (this.processing.size > 0) {
      await Promise.all(this.processing);
    }
  }

  getStats() {
    return {
      pending: this.pending.length,
      processing: this.processing.size,
      hasTimer: this.timer !== null
    };
  }
}