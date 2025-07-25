-- Enable pgvector extension
CREATE EXTENSION IF NOT EXISTS vector;

-- Create scripts table
CREATE TABLE IF NOT EXISTS scripts (
  id SERIAL PRIMARY KEY,
  title TEXT NOT NULL,
  uploaded_at TIMESTAMP DEFAULT NOW() NOT NULL
);

-- Create script_chunks table
CREATE TABLE IF NOT EXISTS script_chunks (
  id SERIAL PRIMARY KEY,
  script_id INTEGER NOT NULL REFERENCES scripts(id) ON DELETE CASCADE,
  content TEXT NOT NULL,
  chunk_index INTEGER NOT NULL,
  embedding vector(768),
  created_at TIMESTAMP DEFAULT NOW() NOT NULL
);

-- Create searches table
CREATE TABLE IF NOT EXISTS searches (
  id SERIAL PRIMARY KEY,
  query TEXT NOT NULL,
  query_embedding vector(768),
  searched_at TIMESTAMP DEFAULT NOW() NOT NULL
);

-- Create indexes
CREATE INDEX IF NOT EXISTS embedding_idx ON script_chunks USING ivfflat (embedding vector_cosine_ops) WITH (lists = 100);
CREATE INDEX IF NOT EXISTS script_idx ON script_chunks(script_id);