export interface ChunkOptions {
  chunkSize?: number;
  overlap?: number;
}

const DEFAULT_OPTIONS: Required<ChunkOptions> = {
  chunkSize: 800,
  overlap: 100
};

export class TextChunker {
  private options: Required<ChunkOptions>;

  constructor(options: ChunkOptions = {}) {
    this.options = { ...DEFAULT_OPTIONS, ...options };
  }

  chunkText(text: string, overrideOptions?: ChunkOptions): string[] {
    const options = overrideOptions 
      ? { ...this.options, ...overrideOptions }
      : this.options;
    
    const { chunkSize, overlap } = options;
    const chunks: string[] = [];
    
    let start = 0;
    while (start < text.length) {
      const end = Math.min(start + chunkSize, text.length);
      chunks.push(text.slice(start, end));
      start += chunkSize - overlap;
    }
    
    return chunks;
  }
}

// Export a default instance for backward compatibility
export const defaultChunker = new TextChunker();
export const chunkText = (text: string, options?: ChunkOptions) => defaultChunker.chunkText(text, options);