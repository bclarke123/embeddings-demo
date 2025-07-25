# Text Semantic Search Demo

A TypeScript application demonstrating Google's Gemini embedding model (`text-embedding-004`) for semantic search of text documents.

## Features

- **Document Upload**: Upload any text content through a web interface
- **Semantic Search**: Natural language queries to find relevant passages
- **Vector Similarity**: Uses pgvector for efficient similarity search
- **Redis Caching**: RBO (Read-Bypass-Once) strategy for rate limit optimization
- **Rate Limiting**: Respects Gemini API limits with automatic throttling and retry

## Tech Stack

- **Runtime**: Bun
- **Backend**: Hono (lightweight web framework)
- **Database**: PostgreSQL with pgvector extension
- **ORM**: Drizzle
- **Cache**: Redis
- **Frontend**: React with TypeScript
- **Embeddings**: Google Gemini API (`text-embedding-004`)

## Setup

1. **Prerequisites**:
   - PostgreSQL with pgvector extension installed
   - Redis server running
   - Bun installed

2. **Environment Variables** (`.env`):
   ```
   GEMINI_API_KEY=your_api_key_here
   DATABASE_URL=postgres://user:pass@localhost:5432/embeddings_demo
   REDIS_URL=redis://localhost:6379
   ```

3. **Install Dependencies**:
   ```bash
   bun install
   ```

4. **Run Database Migrations**:
   ```bash
   bun run migrate
   ```

5. **Start the Server**:
   ```bash
   bun run dev
   ```

## API Endpoints

- `POST /api/scripts` - Upload and process a new document
- `GET /api/scripts` - List all uploaded documents
- `DELETE /api/scripts/:id` - Remove a document
- `POST /api/search` - Perform semantic search

## Architecture

1. **Text Processing**: Documents are chunked into ~1500 character segments with overlap
2. **Embedding Generation**: Each chunk is embedded using Gemini's 768-dimensional model
3. **Storage**: Embeddings stored in PostgreSQL with pgvector for efficient similarity search
4. **Caching**: Search results cached in Redis for 15 minutes
5. **Rate Limiting**: Max 40 requests/minute to Gemini API with automatic retry on 429 errors

## Usage

1. Navigate to `http://localhost:3000`
2. Click "Upload Document" to add any text content
3. Switch to "Search" tab and try natural language queries like:
   - "technical details"
   - "action scenes"
   - "dialogue between characters"
   - "descriptive passages"

## Performance

- Document processing: ~1.5 seconds per chunk due to rate limiting
- Search latency: < 200ms cached, < 500ms uncached
- Embedding dimension: 768 (text-embedding-004 standard)
- Automatic retry with exponential backoff for rate limits

## Example Use Cases

- **Scripts & Screenplays**: Search for specific scenes or dialogue
- **Technical Documentation**: Find relevant sections quickly
- **Meeting Notes**: Search across multiple meetings
- **Research Papers**: Find specific topics or methodologies
- **Books & Articles**: Semantic search through long-form content