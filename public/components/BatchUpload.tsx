import React, { useState, useRef } from 'react';
import { colors, spacing } from '../styles/theme';
import { Button } from './Button';
import { Alert } from './Alert';

interface BatchUploadProps {
  onBatchUpload: (files: Array<{ title: string; content: string }>) => Promise<any>;
  onUploadComplete: () => void;
}

export function BatchUpload({ onBatchUpload, onUploadComplete }: BatchUploadProps) {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [selectedFiles, setSelectedFiles] = useState<File[]>([]);
  const [uploading, setUploading] = useState(false);
  const [uploadStatus, setUploadStatus] = useState<'idle' | 'success' | 'error'>('idle');
  const [uploadMessage, setUploadMessage] = useState('');
  const [uploadProgress, setUploadProgress] = useState(0);

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    setSelectedFiles(files);
    setUploadStatus('idle');
    setUploadMessage('');
  };

  const readFileAsText = (file: File): Promise<string> => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = (e) => resolve(e.target?.result as string);
      reader.onerror = reject;
      reader.readAsText(file);
    });
  };

  const handleBatchUpload = async () => {
    if (selectedFiles.length === 0) return;

    setUploading(true);
    setUploadStatus('idle');
    setUploadProgress(0);
    
    try {
      // Read all files
      const filesData: Array<{ title: string; content: string }> = [];
      
      for (let i = 0; i < selectedFiles.length; i++) {
        const file = selectedFiles[i];
        setUploadMessage(`Reading ${file.name}...`);
        
        try {
          const content = await readFileAsText(file);
          filesData.push({
            title: file.name,
            content
          });
        } catch (error) {
          console.error(`Failed to read ${file.name}:`, error);
        }
        
        setUploadProgress(((i + 1) / selectedFiles.length) * 50); // 50% for reading
      }

      if (filesData.length === 0) {
        throw new Error('No files could be read');
      }

      // Upload in batches of 10
      const batchSize = 10;
      const totalBatches = Math.ceil(filesData.length / batchSize);
      let totalSuccess = 0;
      let totalFailed = 0;

      for (let i = 0; i < totalBatches; i++) {
        const batch = filesData.slice(i * batchSize, (i + 1) * batchSize);
        setUploadMessage(`Uploading batch ${i + 1}/${totalBatches}...`);
        
        try {
          const result = await onBatchUpload(batch);
          
          if (result.results) {
            result.results.forEach((fileResult: any) => {
              if (fileResult.success) {
                totalSuccess++;
              } else {
                totalFailed++;
              }
            });
          }
        } catch (error) {
          console.error('Batch upload failed:', error);
          totalFailed += batch.length;
        }
        
        setUploadProgress(50 + ((i + 1) / totalBatches) * 50); // 50-100% for uploading
      }

      setUploadStatus(totalFailed === 0 ? 'success' : 'error');
      setUploadMessage(
        `Upload complete! ${totalSuccess} succeeded, ${totalFailed} failed out of ${filesData.length} files.`
      );
      
      // Clear file selection
      setSelectedFiles([]);
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
      
      // Refresh documents list
      onUploadComplete();
      
      // Clear message after 5 seconds
      setTimeout(() => {
        setUploadStatus('idle');
        setUploadMessage('');
      }, 5000);
    } catch (error) {
      console.error('Batch upload error:', error);
      setUploadStatus('error');
      setUploadMessage(error instanceof Error ? error.message : 'Upload failed');
    } finally {
      setUploading(false);
      setUploadProgress(0);
    }
  };

  return (
    <div style={styles.container}>
      <h3 style={styles.title}>Batch Upload Files</h3>
      <p style={styles.description}>
        Select multiple text files to upload them all at once. Supported formats: .txt, .md, .js, .ts, .json, .html, .css
      </p>

      <div style={styles.uploadArea}>
        <input
          ref={fileInputRef}
          type="file"
          multiple
          accept=".txt,.md,.js,.ts,.jsx,.tsx,.json,.html,.css,.xml,.yml,.yaml"
          onChange={handleFileSelect}
          style={styles.fileInput}
          disabled={uploading}
        />
        
        {selectedFiles.length > 0 && (
          <div style={styles.selectedFiles}>
            <p style={styles.selectedCount}>
              {selectedFiles.length} file{selectedFiles.length !== 1 ? 's' : ''} selected
            </p>
            <div style={styles.fileList}>
              {selectedFiles.slice(0, 5).map((file, index) => (
                <div key={index} style={styles.fileName}>
                  {file.name} ({(file.size / 1024).toFixed(1)} KB)
                </div>
              ))}
              {selectedFiles.length > 5 && (
                <div style={styles.moreFiles}>
                  ...and {selectedFiles.length - 5} more
                </div>
              )}
            </div>
          </div>
        )}

        <Button
          onClick={handleBatchUpload}
          disabled={selectedFiles.length === 0 || uploading}
          loading={uploading}
          style={{ marginTop: spacing.lg }}
        >
          {uploading ? 'Uploading...' : `Upload ${selectedFiles.length} Files`}
        </Button>

        {uploading && uploadProgress > 0 && (
          <div style={styles.progressContainer}>
            <div style={styles.progressBar}>
              <div
                style={{
                  ...styles.progressFill,
                  width: `${uploadProgress}%`
                }}
              />
            </div>
            <span style={styles.progressText}>{Math.round(uploadProgress)}%</span>
          </div>
        )}
      </div>

      {uploadMessage && (
        <div style={{ marginTop: spacing.lg }}>
          <Alert variant={uploadStatus}>
            {uploadMessage}
          </Alert>
        </div>
      )}
    </div>
  );
}

const styles = {
  container: {
    width: '100%',
    marginTop: spacing.xxl,
    padding: spacing.xl,
    border: `1px solid ${colors.gray[800]}`,
    borderRadius: '8px',
    background: colors.gray[900],
  },
  title: {
    fontSize: '18px',
    fontWeight: 600,
    color: colors.gray[100],
    margin: `0 0 ${spacing.sm} 0`,
  },
  description: {
    fontSize: '14px',
    color: colors.gray[400],
    margin: `0 0 ${spacing.lg} 0`,
  },
  uploadArea: {
    display: 'flex',
    flexDirection: 'column' as const,
    gap: spacing.md,
  },
  fileInput: {
    fontSize: '14px',
    color: colors.gray[300],
    background: colors.gray[800],
    border: `1px solid ${colors.gray[700]}`,
    borderRadius: '6px',
    padding: spacing.md,
    cursor: 'pointer',
    transition: 'all 0.2s',
    '&:hover': {
      borderColor: colors.gray[600],
    },
    '&:disabled': {
      opacity: 0.5,
      cursor: 'not-allowed',
    },
  },
  selectedFiles: {
    background: colors.gray[800],
    borderRadius: '6px',
    padding: spacing.md,
  },
  selectedCount: {
    fontSize: '14px',
    fontWeight: 500,
    color: colors.gray[200],
    margin: `0 0 ${spacing.sm} 0`,
  },
  fileList: {
    display: 'flex',
    flexDirection: 'column' as const,
    gap: spacing.xs,
  },
  fileName: {
    fontSize: '13px',
    color: colors.gray[400],
    whiteSpace: 'nowrap' as const,
    overflow: 'hidden',
    textOverflow: 'ellipsis',
  },
  moreFiles: {
    fontSize: '13px',
    color: colors.gray[500],
    fontStyle: 'italic',
  },
  progressContainer: {
    display: 'flex',
    alignItems: 'center',
    gap: spacing.sm,
  },
  progressBar: {
    flex: 1,
    height: '6px',
    background: colors.gray[800],
    borderRadius: '3px',
    overflow: 'hidden',
  },
  progressFill: {
    height: '100%',
    background: colors.primary[500],
    transition: 'width 0.3s ease',
  },
  progressText: {
    fontSize: '13px',
    color: colors.gray[400],
    minWidth: '40px',
  },
};