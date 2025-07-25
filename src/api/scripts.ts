import { Hono } from "hono";
import { validateBody, validateParams } from "../middleware/validation";
import { uploadRateLimit } from "../middleware/rate-limit";
import { ScriptService } from "../services/script-service";
import { SearchService } from "../services/search-service";

const scriptService = new ScriptService();
const searchService = new SearchService();

export const scriptRoutes = new Hono();

scriptRoutes.post("/", 
  uploadRateLimit,
  validateBody({
    title: { required: true, minLength: 1, maxLength: 200 },
    content: { required: true, minLength: 10, maxLength: 1000000 }
  }),
  async (c) => {
    const validatedBody = c.get('validatedBody') as { title: string; content: string };
    const { title, content } = validatedBody;
    
    const result = await scriptService.createScript({ title, content });
    
    // Invalidate search cache since new content was added
    await searchService.invalidateCache([result.scriptId]);
    
    return c.json(result);
  });

scriptRoutes.get("/", async (c) => {
  const scripts = await scriptService.getAllScripts();
  return c.json(scripts);
});

scriptRoutes.delete("/:id", 
  validateParams("id", true),
  async (c) => {
    const id = c.get('validatedId') as number;
    
    // Invalidate search cache before deleting
    await searchService.invalidateCache([id]);
    
    await scriptService.deleteScript(id);
    return c.json({ success: true });
  });