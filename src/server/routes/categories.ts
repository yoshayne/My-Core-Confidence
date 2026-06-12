import { Hono } from "hono";
import { query } from "../lib/db";
import { requireUser } from "../middleware/auth";

export const categoriesRoute = new Hono();

categoriesRoute.get("/", requireUser, async (c) => {
  const { rows } = await query<{ category: string }>(
    `SELECT DISTINCT category FROM workouts
      WHERE is_published = TRUE AND category IS NOT NULL
      ORDER BY category ASC`
  );
  return c.json({ categories: rows.map((r) => r.category) });
});
