import { Hono } from "hono";
import { db } from "../db";
import { scripts, scriptChunks } from "../db/schema";
import { generateEmbedding } from "../lib/gemini";
import { chunkText } from "../lib/text-chunker";
import { eq } from "drizzle-orm";
import { validateBody, validateParams } from "../middleware/validation";
import { uploadRateLimit } from "../middleware/rate-limit";

export const scriptRoutes = new Hono();

scriptRoutes.post("/", 
  // uploadRateLimit, // Temporarily disabled for testing
  validateBody({
    title: { required: true, minLength: 1, maxLength: 200 },
    content: { required: true, minLength: 10, maxLength: 1000000 }
  }),
  async (c) => {
    const { title, content } = c.get('validatedBody');

    // Create script record
    console.log("Creating script record...");
    const [script] = await db.insert(scripts).values({ title }).returning();
    console.log("Script created with ID:", script.id);
    
    // Chunk the text
    console.log("Chunking text...");
    const chunks = chunkText(content);
    console.log(`Created ${chunks.length} chunks`);
    
    // Process chunks one by one to save progress
    let processedCount = 0;
    const errors: string[] = [];
    
    for (let i = 0; i < chunks.length; i++) {
      try {
        console.log(`Processing chunk ${i + 1}/${chunks.length}...`);
        
        // Generate embedding for this chunk
        const embedding = await generateEmbedding(chunks[i]);
        
        // Save chunk immediately
        await db.insert(scriptChunks).values({
          scriptId: script.id,
          content: chunks[i],
          chunkIndex: i,
          embedding: embedding,
        });
        
        processedCount++;
        console.log(`Saved chunk ${i + 1}/${chunks.length}`);
        
        // Add delay between chunks to avoid rate limits
        if (i < chunks.length - 1) {
          await Bun.sleep(1000); // 1 second between chunks
        }
      } catch (error) {
        console.error(`Failed to process chunk ${i + 1}:`, error);
        errors.push(`Chunk ${i + 1}: ${error instanceof Error ? error.message : 'Unknown error'}`);
        // Continue processing other chunks
      }
    }
    
    console.log(`Script processing complete! Processed ${processedCount}/${chunks.length} chunks`);
    
    return c.json({ 
      success: processedCount > 0, 
      scriptId: script.id,
      chunksCreated: processedCount,
      totalChunks: chunks.length,
      errors: errors.length > 0 ? errors : undefined
    });
  });

scriptRoutes.get("/", async (c) => {
  const allScripts = await db.select().from(scripts);
  return c.json(allScripts);
});

scriptRoutes.delete("/:id", 
  validateParams("id", true),
  async (c) => {
    const id = c.get('validatedId');
    await db.delete(scripts).where(eq(scripts.id, id));
    return c.json({ success: true });
  });