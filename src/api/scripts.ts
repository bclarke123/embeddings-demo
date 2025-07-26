import { Hono } from "hono";
import { uploadRateLimit } from "../middleware/rate-limit";
import { ScriptService } from "../services/script-service";
import { SearchService } from "../services/search-service";
import { zodValidateBody, zodValidateParams, getValidatedBody, getValidatedParams } from "../middleware/zod-validation";
import { scriptCreateSchema, scriptIdParamSchema, batchUploadSchema } from "../lib/schemas";
import type { ScriptCreateInput, ScriptIdParam, BatchUploadInput } from "../lib/schemas";

const scriptService = new ScriptService();
const searchService = new SearchService();

export const scriptRoutes = new Hono();

scriptRoutes.post("/", 
  uploadRateLimit,
  zodValidateBody(scriptCreateSchema),
  async (c) => {
    const body = getValidatedBody<ScriptCreateInput>(c);
    
    const result = await scriptService.createScript(body);
    
    // Invalidate search cache since new content was added
    await searchService.invalidateCache([result.scriptId]);
    
    return c.json(result);
  });

scriptRoutes.get("/", async (c) => {
  const scripts = await scriptService.getAllScripts();
  return c.json(scripts);
});

scriptRoutes.delete("/:id", 
  zodValidateParams(scriptIdParamSchema),
  async (c) => {
    const params = getValidatedParams<ScriptIdParam>(c);
    
    // Invalidate search cache before deleting
    await searchService.invalidateCache([params.id]);
    
    await scriptService.deleteScript(params.id);
    return c.json({ success: true });
  });

// Batch upload endpoint
scriptRoutes.post("/batch",
  uploadRateLimit,
  zodValidateBody(batchUploadSchema),
  async (c) => {
    const body = getValidatedBody<BatchUploadInput>(c);
    
    const result = await scriptService.batchUpload(body.files);
    
    // Invalidate search cache for all uploaded scripts
    const uploadedScriptIds = result.results
      .filter(r => r.success && r.scriptId)
      .map(r => r.scriptId!);
    
    if (uploadedScriptIds.length > 0) {
      await searchService.invalidateCache(uploadedScriptIds);
    }
    
    return c.json(result);
  });