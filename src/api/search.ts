import { Hono } from "hono";
import { searchRateLimit } from "../middleware/rate-limit";
import { SearchService } from "../services/search-service";
import { zodValidateBody, getValidatedBody } from "../middleware/zod-validation";
import { searchRequestSchema } from "../lib/schemas";
import type { SearchRequestInput } from "../lib/schemas";

const searchService = new SearchService();

export const searchRoutes = new Hono();

searchRoutes.post("/",
  searchRateLimit,
  zodValidateBody(searchRequestSchema),
  async (c) => {
    const body = getValidatedBody<SearchRequestInput>(c);
    
    const result = await searchService.search(body);
    
    return c.json(result);
  });