import { createClient } from "redis";

const redisUrl = process.env.REDIS_URL;
if (!redisUrl) {
  throw new Error("REDIS_URL environment variable is not set");
}

export const redis = createClient({ url: redisUrl });

redis.on("error", (err) => console.error("Redis Client Error", err));

await redis.connect();