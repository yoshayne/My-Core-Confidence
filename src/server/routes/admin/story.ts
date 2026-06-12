import { Hono } from "hono";
import { query } from "../../lib/db";
import { requireUser, requireAdmin } from "../../middleware/auth";
import { rateLimit } from "../../middleware/rateLimit";

export const adminStoryRoute = new Hono();

adminStoryRoute.use("*", requireUser, requireAdmin);

adminStoryRoute.put("/", rateLimit({ windowMs: 60_000, max: 10, key: "admin-story" }), async (c) => {
  const body = await c.req.json<Record<string, string>>().catch(() => ({}));
  const entries = Object.entries(body);
  if (entries.length === 0) return c.json({ error: "no fields to update" }, 400);

  for (const [key, value] of entries) {
    await query(
      `INSERT INTO story_content (content_key, content_value)
       VALUES ($1, $2)
       ON CONFLICT (content_key) DO UPDATE
         SET content_value = EXCLUDED.content_value, updated_at = now()`,
      [key, value]
    );
  }

  return c.json({ ok: true });
});
