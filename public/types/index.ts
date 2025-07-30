export interface SearchResult {
  content: string;
  scriptTitle: string;
  avgSimilarity: number;
  scriptId: number;
  chunkIndices: number[];
}

export interface Document {
  id: number;
  title: string;
  uploadedAt: string;
}

export type UploadStatus = "idle" | "success" | "error";

export interface UploadResponse {
  success: boolean;
  scriptId?: number;
  chunksCreated?: number;
  totalChunks?: number;
  errors?: string[];
  error?: string;
}

export interface SearchResponse {
  results: SearchResult[];
}