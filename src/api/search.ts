import { Hono } from "hono";
import { db } from "../db";
import { scriptChunks, scripts, searches } from "../db/schema";
import { generateEmbedding } from "../lib/gemini";
import { redis } from "../lib/redis";
import { sql, eq } from "drizzle-orm";
import crypto from "crypto";

export const searchRoutes = new Hono();

function getQueryHash(query: string): string {
  return crypto.createHash("md5").update(query).digest("hex");
}

searchRoutes.post("/", async (c) => {
  try {
    const { query, limit = 10 } = await c.req.json<{ query: string; limit?: number }>();
    
    if (!query) {
      return c.json({ error: "Query is required" }, 400);
    }

    const queryHash = getQueryHash(query);
    const cacheKey = `search:${queryHash}`;
    
    // Check cache
    const cached = await redis.get(cacheKey);
    if (cached) {
      return c.json(JSON.parse(cached));
    }

    // Generate embedding for query
    const queryEmbedding = await generateEmbedding(query);
    
    // Store search in history
    await db.insert(searches).values({
      query,
      queryEmbedding,
    });
    
    // Perform vector similarity search
    const results = await db
      .select({
        id: scriptChunks.id,
        content: scriptChunks.content,
        scriptId: scriptChunks.scriptId,
        scriptTitle: scripts.title,
        similarity: sql<number>`1 - (${scriptChunks.embedding} <=> ${JSON.stringify(queryEmbedding)}::vector)`,
      })
      .from(scriptChunks)
      .innerJoin(scripts, eq(scriptChunks.scriptId, scripts.id))
      .orderBy(sql`1 - (${scriptChunks.embedding} <=> ${JSON.stringify(queryEmbedding)}::vector) DESC`)
      .limit(limit);
    
    const response = {
      query,
      results: results.map(r => ({
        content: r.content,
        scriptTitle: r.scriptTitle,
        similarity: r.similarity,
        scriptId: r.scriptId,
      })),
    };
    
    // Cache results for 15 minutes
    await redis.setEx(cacheKey, 900, JSON.stringify(response));
    
    return c.json(response);
  } catch (error) {
    console.error("Error performing search:", error);
    return c.json({ error: "Failed to perform search" }, 500);
  }
});