import { Hono } from "hono";
import { validateBody } from "../middleware/validation";
import { searchRateLimit } from "../middleware/rate-limit";
import { SearchService } from "../services/search-service";

const searchService = new SearchService();

export const searchRoutes = new Hono();

searchRoutes.post("/",
  searchRateLimit,
  validateBody({
    query: { required: true, minLength: 1, maxLength: 500 },
    limit: { min: 1, max: 50, default: 10 }
  }),
  async (c) => {
    const validatedBody = c.get('validatedBody') as { query: string; limit: number };
    const { query, limit } = validatedBody;
    
    const result = await searchService.search({ query, limit });
    
    return c.json(result);
  });