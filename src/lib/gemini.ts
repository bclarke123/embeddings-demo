import { GoogleGenerativeAI } from "@google/generative-ai";
import { redis } from "./redis";

const apiKey = process.env.GEMINI_API_KEY;
if (!apiKey) {
  throw new Error("GEMINI_API_KEY environment variable is not set");
}

const genAI = new GoogleGenerativeAI(apiKey);

export const EMBEDDING_MODEL = "text-embedding-004";
export const EMBEDDING_DIMENSION = 768;

const RATE_LIMIT_KEY = "gemini:rate_limit";
const MAX_REQUESTS_PER_MINUTE = 40; // Conservative limit

export async function checkRateLimit(): Promise<boolean> {
  const current = await redis.incr(RATE_LIMIT_KEY);
  if (current === 1) {
    await redis.expire(RATE_LIMIT_KEY, 60);
  }

  if (current > MAX_REQUESTS_PER_MINUTE) {
    console.log(`Rate limit hit: ${current} requests in the last minute`);
    return false;
  }

  return true;
}

export async function generateEmbedding(text: string, retries = 3): Promise<number[]> {
  const canProceed = await checkRateLimit();
  if (!canProceed) {
    console.log("Local rate limit hit, waiting 60 seconds...");
    await Bun.sleep(60000);
  }

  for (let attempt = 1; attempt <= retries; attempt++) {
    try {
      const model = genAI.getGenerativeModel({ model: EMBEDDING_MODEL });
      const result = await model.embedContent(text);
      return result.embedding.values;
    } catch (error: any) {
      console.error(`Error generating embedding (attempt ${attempt}/${retries}):`, error.message);

      // Check if it's a 429 error
      if (error.message?.includes("429") || error.message?.includes("Resource has been exhausted")) {
        const waitTime = Math.min(attempt * 30000, 120000); // 30s, 60s, 120s
        console.log(`Rate limit hit, waiting ${waitTime / 1000} seconds before retry...`);
        await Bun.sleep(waitTime);
      } else if (attempt === retries) {
        throw error;
      }
    }
  }

  throw new Error("Failed to generate embedding after all retries");
}

export async function generateEmbeddings(texts: string[]): Promise<number[][]> {
  const embeddings: number[][] = [];
  console.log(`Generating embeddings for ${texts.length} chunks...`);

  for (let i = 0; i < texts.length; i++) {
    try {
      console.log(`Processing chunk ${i + 1}/${texts.length}...`);
      const embedding = await generateEmbedding(texts[i]!);
      embeddings.push(embedding);

      // Add delay to avoid hitting rate limits
      // Gemini has a limit of ~60 requests per minute
      if (i < texts.length - 1) {
        await Bun.sleep(1500); // 1.5 second delay between requests
      }
    } catch (error) {
      console.error(`Failed to generate embedding for chunk ${i + 1}:`, error);
      throw error;
    }
  }

  console.log(`Successfully generated ${embeddings.length} embeddings`);
  return embeddings;
}