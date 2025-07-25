import React, { useState, useEffect } from 'react';
import { Layout } from './components/Layout';
import { Navigation } from './components/Navigation';
import { Search } from './components/Search';
import { Upload } from './components/Upload';
import { GlobalStyles } from './styles/GlobalStyles';
import { Document, SearchResult } from './types';

export function App() {
  const [mode, setMode] = useState<'search' | 'upload'>('search');
  const [documents, setDocuments] = useState<Document[]>([]);

  const loadDocuments = async () => {
    try {
      const response = await fetch('/api/scripts');
      const data = await response.json();
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
    const data = await response.json();
    return data.results || [];
  };

  const handleUpload = async (title: string, content: string) => {
    const response = await fetch('/api/scripts', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ title, content }),
    });
    
    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.error || `HTTP error! status: ${response.status}`);
    }
    
    return await response.json();
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