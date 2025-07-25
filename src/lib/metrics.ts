import { Logger } from "./logger";

export interface MetricData {
  timestamp: Date;
  name: string;
  value: number;
  tags?: Record<string, string>;
}

export class MetricsCollector {
  private static metrics: MetricData[] = [];
  private static readonly MAX_METRICS = 1000; // Keep last 1000 metrics in memory

  /**
   * Record a counter metric (incremental)
   */
  static counter(name: string, value: number = 1, tags?: Record<string, string>) {
    this.record(name, value, tags);
    Logger.metric(name, value, { tags });
  }

  /**
   * Record a gauge metric (point-in-time value)
   */
  static gauge(name: string, value: number, tags?: Record<string, string>) {
    this.record(name, value, tags);
    Logger.metric(name, value, { type: 'gauge', tags });
  }

  /**
   * Record a timing metric (duration in ms)
   */
  static timing(name: string, duration: number, tags?: Record<string, string>) {
    this.record(name, duration, { ...tags, type: 'timing' });
    Logger.metric(name, duration, { type: 'timing', unit: 'ms', tags });
  }

  /**
   * Time a function execution
   */
  static async time<T>(name: string, fn: () => Promise<T>, tags?: Record<string, string>): Promise<T> {
    const start = Date.now();
    try {
      const result = await fn();
      this.timing(name, Date.now() - start, tags);
      return result;
    } catch (error) {
      this.timing(name, Date.now() - start, { ...tags, status: 'error' });
      throw error;
    }
  }

  private static record(name: string, value: number, tags?: Record<string, string>) {
    const metric: MetricData = {
      timestamp: new Date(),
      name,
      value,
      tags
    };

    this.metrics.push(metric);

    // Keep only the most recent metrics
    if (this.metrics.length > this.MAX_METRICS) {
      this.metrics = this.metrics.slice(-this.MAX_METRICS);
    }
  }

  /**
   * Get recent metrics for monitoring
   */
  static getMetrics(since?: Date): MetricData[] {
    if (!since) {
      return [...this.metrics];
    }

    return this.metrics.filter(m => m.timestamp >= since);
  }

  /**
   * Get aggregated metrics by name
   */
  static getAggregatedMetrics(name: string, since?: Date): {
    count: number;
    sum: number;
    avg: number;
    min: number;
    max: number;
  } {
    const filtered = this.getMetrics(since).filter(m => m.name === name);
    
    if (filtered.length === 0) {
      return { count: 0, sum: 0, avg: 0, min: 0, max: 0 };
    }

    const values = filtered.map(m => m.value);
    const sum = values.reduce((a, b) => a + b, 0);
    
    return {
      count: filtered.length,
      sum,
      avg: sum / filtered.length,
      min: Math.min(...values),
      max: Math.max(...values)
    };
  }

  /**
   * Clear old metrics
   */
  static clearOldMetrics(olderThan: Date) {
    this.metrics = this.metrics.filter(m => m.timestamp >= olderThan);
  }
}

// Application-specific metrics
export const AppMetrics = {
  // Script operations
  scriptCreated: (scriptId: number, chunksCount: number) => {
    MetricsCollector.counter('script.created', 1, { scriptId: scriptId.toString() });
    MetricsCollector.gauge('script.chunks', chunksCount, { scriptId: scriptId.toString() });
  },

  scriptDeleted: (scriptId: number) => {
    MetricsCollector.counter('script.deleted', 1, { scriptId: scriptId.toString() });
  },

  // Search operations
  searchPerformed: (resultCount: number, cached: boolean) => {
    MetricsCollector.counter('search.performed', 1, { cached: cached.toString() });
    MetricsCollector.gauge('search.results', resultCount);
  },

  // Embedding operations
  embeddingGenerated: (duration: number, success: boolean) => {
    MetricsCollector.timing('embedding.generation', duration, { 
      success: success.toString() 
    });
  },

  // Cache operations
  cacheHit: (key: string) => {
    const keyType = key.split(':')[0] || 'unknown';
    MetricsCollector.counter('cache.hit', 1, { type: keyType });
  },

  cacheMiss: (key: string) => {
    const keyType = key.split(':')[0] || 'unknown';
    MetricsCollector.counter('cache.miss', 1, { type: keyType });
  },

  cacheInvalidation: (tags: string[]) => {
    MetricsCollector.counter('cache.invalidation', 1, { 
      tags: tags.join(',') 
    });
  }
};