import React, { useState, useEffect } from 'react';
import { Layout } from './components/Layout';
import { Navigation } from './components/Navigation';
import { Search } from './components/Search';
import { Upload } from './components/Upload';
import { GlobalStyles } from './styles/GlobalStyles';
import type { Document, SearchResult, UploadResponse, SearchResponse } from './types';

export function App() {
  const [mode, setMode] = useState<'search' | 'upload'>('search');
  const [documents, setDocuments] = useState<Document[]>([]);

  const loadDocuments = async (): Promise<void> => {
    try {
      const response = await fetch('/api/scripts');
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      const data: Document[] = await response.json();
      setDocuments(data);
    } catch (error) {
      console.error('Failed to load documents:', error);
    }
  };

  useEffect(() => {
    loadDocuments();
  }, []);

  const handleSearch = async (query: string): Promise<SearchResult[]> => {
    const response = await fetch('/api/search', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ query }),
    });
    
    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }
    
    const data: SearchResponse = await response.json();
    return data.results || [];
  };

  const handleUpload = async (title: string, content: string): Promise<UploadResponse> => {
    const response = await fetch('/api/scripts', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ title, content }),
    });
    
    if (!response.ok) {
      const errorData: { error?: string } = await response.json();
      throw new Error(errorData.error || `HTTP error! status: ${response.status}`);
    }
    
    return await response.json() as UploadResponse;
  };

  return (
    <>
      <GlobalStyles />
      <Layout>
        <Navigation activeMode={mode} onModeChange={setMode} />
        {mode === 'search' ? (
          <Search onSearch={handleSearch} />
        ) : (
          <Upload 
            documents={documents} 
            onUpload={handleUpload}
            onDocumentsChange={loadDocuments}
          />
        )}
      </Layout>
    </>
  );
}