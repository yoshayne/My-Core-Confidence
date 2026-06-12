import path from "path";
import { Hono } from "hono";
import { serve } from "@hono/node-server";
import { serveStatic } from "@hono/node-server/serve-static";
import { clerkWebhook } from "./routes/webhooks.clerk";
import { meRoute } from "./routes/me";
import { withClerk } from "./middleware/auth";

const app = new Hono();

const clientDir = path.join(__dirname, "../client");

// 1. Static file serving FIRST (Railway requirement — see CLAUDE.md Section 2)
app.use("/*", serveStatic({ root: clientDir }));

// 2. Webhooks BEFORE any JSON body-parsing middleware (they need the raw body)
app.route("/api/webhooks/clerk", clerkWebhook);

// 3. Auth middleware + the rest of /api
app.use("/api/*", withClerk);
app.route("/api/me", meRoute);

app.get("/api/hello", (c) => c.json({ message: "Hello from Core Confidence" }));

// SPA fallback — let React Router handle unknown paths.
app.get("*", serveStatic({ path: path.join(clientDir, "index.html") }));

const port = Number(process.env.PORT ?? 3001);

serve({ fetch: app.fetch, port }, (info) => {
  console.log(`Core Confidence server listening on port ${info.port}`);
});
