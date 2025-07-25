import postgres from "postgres";

const connectionString = process.env.DATABASE_URL;
if (!connectionString) {
  throw new Error("DATABASE_URL environment variable is not set");
}

const sql = postgres(connectionString);

console.log("Applying index optimizations...");

try {
  // Drop the old embedding_idx if it exists
  await sql`DROP INDEX IF EXISTS embedding_idx`;
  
  // Create the optimized vector similarity index
  await sql`CREATE INDEX IF NOT EXISTS embedding_cosine_idx ON script_chunks USING ivfflat (embedding vector_cosine_ops)`;
  
  // Create the chunk order index
  await sql`CREATE INDEX IF NOT EXISTS chunk_order_idx ON script_chunks (script_id, chunk_index)`;
  
  // Create the searched_at index
  await sql`CREATE INDEX IF NOT EXISTS searched_at_idx ON searches (searched_at)`;
  
  console.log("Index optimizations applied successfully!");
} catch (error) {
  console.error("Index optimization failed:", error);
} finally {
  await sql.end();
}