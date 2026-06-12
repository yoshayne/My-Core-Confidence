import path from "path";
import { Hono } from "hono";
import { serve } from "@hono/node-server";
import { serveStatic } from "@hono/node-server/serve-static";

const app = new Hono();

const clientDir = path.join(__dirname, "../client");

// 1. Static file serving FIRST (Railway requirement — see CLAUDE.md Section 2)
app.use("/*", serveStatic({ root: clientDir }));

// 2. Webhook routes would be mounted here, before any JSON body-parsing
//    middleware (none yet — added in later milestones).

// 3. API routes
app.get("/api/hello", (c) => c.json({ message: "Hello from Core Confidence" }));

// SPA fallback — let React Router handle unknown paths.
app.get("*", serveStatic({ path: path.join(clientDir, "index.html") }));

const port = Number(process.env.PORT ?? 3001);

serve({ fetch: app.fetch, port }, (info) => {
  console.log(`Core Confidence server listening on port ${info.port}`);
});
