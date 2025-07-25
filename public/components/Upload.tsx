import React, { useState } from 'react';
import { colors, spacing } from '../styles/theme';
import { Button } from './Button';
import { Input } from './Input';
import { TextArea } from './TextArea';
import { Alert } from './Alert';
import type { Document, UploadStatus, UploadResponse } from '../types';

interface UploadProps {
  documents: Document[];
  onUpload: (title: string, content: string) => Promise<UploadResponse>;
  onDocumentsChange: () => void;
}

export function Upload({ documents, onUpload, onDocumentsChange }: UploadProps) {
  const [title, setTitle] = useState("");
  const [content, setContent] = useState("");
  const [loading, setLoading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState("");
  const [uploadStatus, setUploadStatus] = useState<UploadStatus>("idle");

  const handleUpload = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim() || !content.trim()) {
      alert("Please provide both title and content");
      return;
    }

    setLoading(true);
    setUploadStatus("idle");
    setUploadProgress("Uploading and processing document...");
    
    try {
      const result = await onUpload(title, content);
      
      if (result.success) {
        setUploadStatus("success");
        if (result.chunksCreated && result.totalChunks && result.chunksCreated < result.totalChunks) {
          setUploadProgress(`Partial success: ${result.chunksCreated}/${result.totalChunks} chunks processed. Some chunks failed due to rate limits.`);
        } else {
          setUploadProgress(`Success! Created ${result.chunksCreated} chunks.`);
        }
        setTitle("");
        setContent("");
        onDocumentsChange();
        setTimeout(() => {
          setUploadProgress("");
          setUploadStatus("idle");
        }, 5000);
      } else {
        throw new Error(result.error || "Unknown error occurred");
      }
    } catch (error) {
      console.error("Upload failed:", error);
      setUploadStatus("error");
      const errorMessage = error instanceof Error ? error.message : "Unknown error";
      setUploadProgress(`Upload failed: ${errorMessage}`);
      setTimeout(() => {
        setUploadProgress("");
        setUploadStatus("idle");
      }, 5000);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={styles.container}>
      <form onSubmit={handleUpload} style={styles.uploadForm}>
        <Input
          label="Document Title"
          type="text"
          value={title}
          onChange={(e: React.ChangeEvent<HTMLInputElement>) => setTitle(e.target.value)}
          placeholder="Enter a title for your document"
          disabled={loading}
        />
        
        <TextArea
          label="Content"
          value={content}
          onChange={(e: React.ChangeEvent<HTMLTextAreaElement>) => setContent(e.target.value)}
          placeholder="Paste your text content here..."
          disabled={loading}
        />
        
        <Button type="submit" loading={loading}>
          {loading ? "Processing..." : "Upload Document"}
        </Button>
      </form>
      
      {uploadProgress && (
        <div style={{ marginTop: spacing.lg }}>
          <Alert variant={uploadStatus === "idle" ? "info" : uploadStatus}>
            {uploadProgress}
          </Alert>
        </div>
      )}

      <div style={styles.documentsSection}>
        <h2 style={styles.sectionTitle}>Uploaded Documents</h2>
        {documents.length > 0 ? (
          <div style={styles.documentsList}>
            {documents.map((doc) => (
              <div key={doc.id} style={styles.documentItem}>
                <div>
                  <h4 style={styles.documentTitle}>{doc.title}</h4>
                  <p style={styles.documentDate}>
                    Uploaded {new Date(doc.uploadedAt).toLocaleDateString('en-US', { 
                      year: 'numeric', 
                      month: 'short', 
                      day: 'numeric' 
                    })}
                  </p>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div style={styles.emptyDocuments}>
            <p style={styles.emptyStateText}>No documents uploaded yet</p>
            <p style={styles.emptyStateSubtext}>Upload your first document to get started</p>
          </div>
        )}
      </div>
    </div>
  );
}

const styles = {
  container: {
    width: "100%",
  },
  uploadForm: {
    display: "flex",
    flexDirection: "column" as const,
    gap: spacing.xl,
  },
  documentsSection: {
    marginTop: spacing.xxxl,
  },
  sectionTitle: {
    fontSize: "20px",
    fontWeight: 600,
    color: colors.gray[100],
    marginBottom: spacing.lg,
  },
  documentsList: {
    display: "flex",
    flexDirection: "column" as const,
    gap: spacing.sm,
  },
  documentItem: {
    padding: spacing.lg,
    border: `1px solid ${colors.gray[800]}`,
    borderRadius: "8px",
    background: colors.gray[900],
    transition: "all 0.2s",
  },
  documentTitle: {
    fontSize: "14px",
    fontWeight: 500,
    color: colors.gray[100],
    margin: `0 0 ${spacing.xs} 0`,
  },
  documentDate: {
    fontSize: "13px",
    color: colors.gray[500],
    margin: 0,
  },
  emptyDocuments: {
    textAlign: "center" as const,
    padding: spacing.xxl,
    border: `1px solid ${colors.gray[800]}`,
    borderRadius: "8px",
    background: colors.gray[900],
  },
  emptyStateText: {
    fontSize: "16px",
    fontWeight: 500,
    color: colors.gray[300],
    margin: `0 0 ${spacing.xs} 0`,
  },
  emptyStateSubtext: {
    fontSize: "14px",
    color: colors.gray[500],
    margin: 0,
  },
};