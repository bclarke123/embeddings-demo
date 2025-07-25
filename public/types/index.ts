export interface SearchResult {
  content: string;
  scriptTitle: string;
  similarity: number;
  scriptId: number;
}

export interface Document {
  id: number;
  title: string;
  uploadedAt: string;
}

export type UploadStatus = "idle" | "success" | "error";