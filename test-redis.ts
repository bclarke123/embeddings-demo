import { redis } from "./src/lib/redis";

async function testRedis() {
  try {
    console.log("Testing Redis connection...");
    await redis.set("test", "hello");
    const result = await redis.get("test");
    console.log("Redis test result:", result);
    await redis.del("test");
    console.log("Redis is working!");
    process.exit(0);
  } catch (error) {
    console.error("Redis error:", error);
    process.exit(1);
  }
}

testRedis();