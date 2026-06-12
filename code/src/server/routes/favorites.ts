import { Hono } from "hono";
import { query } from "../lib/db";
import { requireUser } from "../middleware/auth";
import { canWatch } from "../lib/access";
import type { WorkoutSummary } from "../../shared/types";

interface FavoriteWorkoutRow {
  id: number;
  title: string;
  thumbnail_url: string | null;
  duration_seconds: number | null;
  level: string;
  category: string | null;
  is_free: boolean;
  is_featured: boolean;
}

export const favoritesRoute = new Hono();

favoritesRoute.get("/", requireUser, async (c) => {
  const user = c.get("user");

  const { rows } = await query<FavoriteWorkoutRow>(
    `SELECT w.id, w.title, w.thumbnail_url, w.duration_seconds, w.level,
            w.category, w.is_free, w.is_featured
       FROM favorites f
       JOIN workouts w ON w.id = f.workout_id
      WHERE f.user_id = $1 AND w.is_published = TRUE
      ORDER BY f.created_at DESC`,
    [user.id]
  );

  const workouts: WorkoutSummary[] = rows.map((row) => ({
    id: row.id,
    title: row.title,
    thumbnailUrl: row.thumbnail_url,
    durationSeconds: row.duration_seconds,
    level: row.level as WorkoutSummary["level"],
    category: row.category,
    isFree: row.is_free,
    isFeatured: row.is_featured,
    locked: !canWatch(user, row),
    isFavorite: true,
  }));

  return c.json({ workouts });
});

favoritesRoute.post("/", requireUser, async (c) => {
  const user = c.get("user");
  const body = await c.req.json<{ workoutId?: number }>().catch(() => ({ workoutId: undefined }));
  const workoutId = body.workoutId;
  if (!Number.isInteger(workoutId)) return c.json({ error: "invalid workoutId" }, 400);

  await query(
    `INSERT INTO favorites (user_id, workout_id) VALUES ($1, $2)
     ON CONFLICT (user_id, workout_id) DO NOTHING`,
    [user.id, workoutId]
  );

  return c.json({ ok: true });
});

favoritesRoute.delete("/:workoutId", requireUser, async (c) => {
  const user = c.get("user");
  const workoutId = Number(c.req.param("workoutId"));
  if (!Number.isInteger(workoutId)) return c.json({ error: "invalid workoutId" }, 400);

  await query(`DELETE FROM favorites WHERE user_id = $1 AND workout_id = $2`, [
    user.id,
    workoutId,
  ]);

  return c.json({ ok: true });
});
