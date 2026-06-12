import path from "path";
import { Hono } from "hono";
import { serve } from "@hono/node-server";
import { serveStatic } from "@hono/node-server/serve-static";
import { clerkWebhook } from "./routes/webhooks.clerk";
import { stripeWebhook } from "./routes/webhooks.stripe";
import { meRoute } from "./routes/me";
import { workoutsRoute } from "./routes/workouts";
import { categoriesRoute } from "./routes/categories";
import { plansRoute } from "./routes/plans";
import { checkoutRoute } from "./routes/checkout";
import { billingPortalRoute } from "./routes/billingPortal";
import { favoritesRoute } from "./routes/favorites";
import { progressRoute } from "./routes/progress";
import { storyRoute } from "./routes/story";
import { withClerk } from "./middleware/auth";

const app = new Hono();

const clientDir = path.join(__dirname, "../client");

// 1. Static file serving FIRST (Railway requirement — see CLAUDE.md Section 2)
app.use("/*", serveStatic({ root: clientDir }));

// 2. Webhooks BEFORE any JSON body-parsing middleware (they need the raw body)
app.route("/api/webhooks/clerk", clerkWebhook);
app.route("/api/webhooks/stripe", stripeWebhook);

// 3. Auth middleware + the rest of /api
app.use("/api/*", withClerk);
app.route("/api/me", meRoute);
app.route("/api/workouts", workoutsRoute);
app.route("/api/categories", categoriesRoute);
app.route("/api/plans", plansRoute);
app.route("/api/checkout", checkoutRoute);
app.route("/api/billing-portal", billingPortalRoute);
app.route("/api/favorites", favoritesRoute);
app.route("/api/progress", progressRoute);
app.route("/api/story", storyRoute);

app.get("/api/hello", (c) => c.json({ message: "Hello from Core Confidence" }));

// SPA fallback — let React Router handle unknown paths.
app.get("*", serveStatic({ path: path.join(clientDir, "index.html") }));

const port = Number(process.env.PORT ?? 3001);

serve({ fetch: app.fetch, port }, (info) => {
  console.log(`Core Confidence server listening on port ${info.port}`);
});
