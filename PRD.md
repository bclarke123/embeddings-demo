# Text Semantic Search - Product Requirements Document

## Overview
A TypeScript web application demonstrating Google's Gemini embedding model capabilities through semantic search of text documents. Users can upload any text content and perform natural language searches to find relevant passages.

## Technical Stack
- **Runtime**: Bun
- **Backend Framework**: Hono
- **Database**: PostgreSQL with pgvector extension
- **ORM**: Drizzle
- **Cache**: Redis
- **Frontend**: React with TypeScript
- **Embeddings**: Google Gemini API (`text-embedding-004`)

## Core Features

### 1. Document Upload & Processing
- Web interface with large text input for pasting any text content
- Automatic text chunking (configurable chunk size, ~500-1000 chars with overlap)
- Real-time progress indication during processing
- Batch embedding generation with rate limit handling

### 2. Semantic Search
- Natural language query input (e.g., "action scene", "dialogue", "technical details")
- Vector similarity search using pgvector
- Ranked results with relevance scores
- Context preview for each result
- Highlighting of matched sections

### 3. Performance & Reliability
- Redis caching with Read-Bypass-Once (RBO) strategy:
  - Cache embeddings for frequently searched queries
  - Bypass cache on first miss, populate on second request
- Rate limiting for Gemini API calls with exponential backoff
- Batch processing for large documents
- Connection pooling for PostgreSQL

## API Endpoints

### Backend (Hono)
- `POST /api/scripts` - Upload and process new document
- `POST /api/search` - Perform semantic search
- `GET /api/scripts` - List uploaded documents
- `DELETE /api/scripts/:id` - Remove document and its embeddings
- `GET /api/status` - Check system health and API limits

### Frontend Routes
- `/` - Main search interface
- `/upload` - Document upload page
- `/results` - Search results display

## Data Models

### PostgreSQL (with pgvector)
```sql
-- Documents table
scripts (
  id: serial primary key,
  title: text not null,
  uploaded_at: timestamp default now()
)

-- Document chunks with embeddings
script_chunks (
  id: serial primary key,
  script_id: integer references scripts(id),
  content: text not null,
  chunk_index: integer not null,
  embedding: vector(768), -- Gemini embedding dimension
  created_at: timestamp default now()
)

-- Search history (for analytics)
searches (
  id: serial primary key,
  query: text not null,
  query_embedding: vector(768),
  searched_at: timestamp default now()
)
```

### Redis Cache Structure
```
embedding:{query_hash} -> embedding vector (TTL: 1 hour)
search:{query_hash} -> search results (TTL: 15 minutes)
rate_limit:{api_key} -> request count (TTL: 1 minute)
```

## User Interface

### Upload Page
- Large textarea for document input
- Document title field
- Upload button with loading state
- Progress bar for embedding generation
- Success/error notifications

### Search Page
- Clean search bar with example queries
- Results list with:
  - Document title
  - Matching text excerpt (with context)
  - Relevance score
  - Link to full context
- Filter by document
- Sort by relevance/date

## Rate Limiting Strategy
1. Implement token bucket algorithm for Gemini API
2. Maximum 60 requests per minute (adjustable)
3. Queue system for batch processing
4. Exponential backoff on 429 errors
5. User notification for processing delays

## Error Handling
- Graceful degradation if Gemini API is unavailable
- Fallback to cached results when possible
- User-friendly error messages
- Automatic retry with backoff
- Health check endpoint for monitoring

## Security Considerations
- Input sanitization for uploaded documents
- API key management (server-side only)
- Rate limiting per IP for uploads
- Maximum document size limits (e.g., 1MB)
- CORS configuration for frontend

## Performance Targets
- Document processing: < 30 seconds for 10,000 words
- Search latency: < 200ms for cached, < 500ms for uncached
- UI responsiveness: < 100ms for all interactions
- 99% uptime for search functionality

## Future Enhancements
- Multiple embedding models comparison
- Document categorization and tagging
- Advanced search filters (category, content type)
- Batch document upload via file
- Export search results
- Analytics dashboard