export interface ChunkOptions {
  chunkSize: number;
  overlap: number;
}

export function chunkText(text: string, options: ChunkOptions = { chunkSize: 1500, overlap: 200 }): string[] {
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