import { Hono } from "hono";
import { cors } from "hono/cors";
import { logger } from "hono/logger";
import { serveStatic } from "hono/bun";
import { scriptRoutes } from "./src/api/scripts";
import { searchRoutes } from "./src/api/search";

const app = new Hono();

app.use("*", logger());
app.use("/api/*", cors());

app.route("/api/scripts", scriptRoutes);
app.route("/api/search", searchRoutes);

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
