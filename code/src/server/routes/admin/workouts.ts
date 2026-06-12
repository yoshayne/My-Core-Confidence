import { Hono } from "hono";
import { query } from "../../lib/db";
import { mux } from "../../lib/mux";
import { requireUser, requireAdmin } from "../../middleware/auth";

export const adminWorkoutsRoute = new Hono();

adminWorkoutsRoute.use("*", requireUser, requireAdmin);

interface AdminWorkoutRow {
  id: number;
  title: string;
  description: string | null;
  thumbnail_url: string | null;
  mux_playback_id: string | null;
  mux_asset_id: string | null;
  mux_status: string;
  duration_seconds: number | null;
  level: string;
  category: string | null;
  is_free: boolean;
  is_featured: boolean;
  is_published: boolean;
  sort_order: number;
}

adminWorkoutsRoute.get("/", async (c) => {
  const { rows } = await query<AdminWorkoutRow>(
    `SELECT id, title, description, thumbnail_url, mux_playback_id, mux_asset_id, mux_status,
            duration_seconds, level, category, is_free, is_featured, is_published, sort_order
       FROM workouts
      ORDER BY is_featured DESC, sort_order ASC, id ASC`
  );
  return c.json({ workouts: rows });
});

adminWorkoutsRoute.post("/", async (c) => {
  const body = await c.req.json<Partial<AdminWorkoutRow>>().catch(() => ({} as Partial<AdminWorkoutRow>));
  if (!body.title) return c.json({ error: "title is required" }, 400);

  const { rows } = await query<AdminWorkoutRow>(
    `INSERT INTO workouts (title, description, level, category, thumbnail_url,
                            is_free, is_featured, is_published, sort_order)
     VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
     RETURNING id, title, description, thumbnail_url, mux_playback_id, mux_asset_id, mux_status,
               duration_seconds, level, category, is_free, is_featured, is_published, sort_order`,
    [
      body.title,
      body.description ?? null,
      body.level ?? "Beginner",
      body.category ?? null,
      body.thumbnail_url ?? null,
      body.is_free ?? false,
      body.is_featured ?? false,
      body.is_published ?? false,
      body.sort_order ?? 0,
    ]
  );

  return c.json(rows[0], 201);
});

adminWorkoutsRoute.put("/:id", async (c) => {
  const id = Number(c.req.param("id"));
  if (!Number.isInteger(id)) return c.json({ error: "invalid id" }, 400);

  const body = await c.req.json<Partial<AdminWorkoutRow>>().catch(() => ({} as Partial<AdminWorkoutRow>));

  const { rows: existingRows } = await query<AdminWorkoutRow>(
    `SELECT id FROM workouts WHERE id = $1`,
    [id]
  );
  if (!existingRows[0]) return c.json({ error: "not found" }, 404);

  const { rows } = await query<AdminWorkoutRow>(
    `UPDATE workouts SET
       title = COALESCE($2, title),
       description = COALESCE($3, description),
       level = COALESCE($4, level),
       category = COALESCE($5, category),
       thumbnail_url = COALESCE($6, thumbnail_url),
       is_free = COALESCE($7, is_free),
       is_featured = COALESCE($8, is_featured),
       is_published = COALESCE($9, is_published),
       sort_order = COALESCE($10, sort_order),
       updated_at = now()
     WHERE id = $1
     RETURNING id, title, description, thumbnail_url, mux_playback_id, mux_asset_id, mux_status,
               duration_seconds, level, category, is_free, is_featured, is_published, sort_order`,
    [
      id,
      body.title ?? null,
      body.description ?? null,
      body.level ?? null,
      body.category ?? null,
      body.thumbnail_url ?? null,
      body.is_free ?? null,
      body.is_featured ?? null,
      body.is_published ?? null,
      body.sort_order ?? null,
    ]
  );

  return c.json(rows[0]);
});

adminWorkoutsRoute.delete("/:id", async (c) => {
  const id = Number(c.req.param("id"));
  if (!Number.isInteger(id)) return c.json({ error: "invalid id" }, 400);

  const { rows } = await query<{ mux_asset_id: string | null }>(
    `DELETE FROM workouts WHERE id = $1 RETURNING mux_asset_id`,
    [id]
  );
  if (!rows[0]) return c.json({ error: "not found" }, 404);

  if (rows[0].mux_asset_id) {
    await mux.video.assets.delete(rows[0].mux_asset_id).catch((err) => {
      console.error("Failed to delete Mux asset:", err);
    });
  }

  return c.json({ ok: true });
});
