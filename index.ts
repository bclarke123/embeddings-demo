import { Hono } from "hono";
import { cors } from "hono/cors";
import { logger } from "hono/logger";
import { serveStatic } from "hono/bun";
import { scriptRoutes } from "./src/api/scripts";
import { searchRoutes } from "./src/api/search";
import { healthRoutes } from "./src/api/health";
import { generalRateLimit } from "./src/middleware/rate-limit";

const app = new Hono();

app.use("*", logger());
app.use("/api/*", cors());
app.use("/api/*", generalRateLimit);

app.route("/api/scripts", scriptRoutes);
app.route("/api/search", searchRoutes);
app.route("/health", healthRoutes);

app.onError(async (err, c) => {
  console.error("API Error:", err);
  
  if (err.message.includes("Title") || err.message.includes("Content") || err.message.includes("Query") || err.message.includes("Limit") || err.message.includes("parameter") || err.message.includes("must be")) {
    return c.json({ error: err.message, code: "VALIDATION_ERROR" }, 400);
  }
  
  if (err.message.includes("Rate limit")) {
    return c.json({ error: err.message, code: "RATE_LIMIT_ERROR" }, 429);
  }
  
  return c.json({ error: "Internal server error", code: "INTERNAL_ERROR" }, 500);
});

app.get("/", async (c) => {
  const html = await Bun.file("./public/index.html").text();
  return c.html(html);
});

app.use("/*", serveStatic({ root: "./public" }));

const server = Bun.serve({
  fetch: app.fetch,
  port: process.env.PORT || 3000,
});

console.log(`Server running at http://localhost:${server.port}`);
