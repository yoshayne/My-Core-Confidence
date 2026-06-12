import { Hono } from "hono";
import { query } from "../lib/db";
import { requireUser } from "../middleware/auth";
import { canWatch } from "../lib/access";
import { mintPlaybackToken } from "../lib/muxToken";
import type { WorkoutDetail, WorkoutSummary } from "../../shared/types";

interface WorkoutRow {
  id: number;
  title: string;
  description: string | null;
  thumbnail_url: string | null;
  mux_playback_id: string | null;
  mux_status: string;
  duration_seconds: number | null;
  level: string;
  category: string | null;
  is_free: boolean;
  is_featured: boolean;
  is_favorite: boolean;
}

export const workoutsRoute = new Hono();

workoutsRoute.get("/", requireUser, async (c) => {
  const user = c.get("user");

  const { rows } = await query<WorkoutRow>(
    `SELECT w.id, w.title, w.description, w.thumbnail_url, w.mux_playback_id, w.mux_status,
            w.duration_seconds, w.level, w.category, w.is_free, w.is_featured,
            (f.id IS NOT NULL) AS is_favorite
       FROM workouts w
       LEFT JOIN favorites f ON f.workout_id = w.id AND f.user_id = $1
      WHERE w.is_published = TRUE
      ORDER BY w.is_featured DESC, w.sort_order ASC, w.id ASC`,
    [user.id]
  );

  const workouts: WorkoutSummary[] = rows.map((row) => {
    const locked = !canWatch(user, row);
    return {
      id: row.id,
      title: row.title,
      thumbnailUrl: row.thumbnail_url,
      durationSeconds: row.duration_seconds,
      level: row.level as WorkoutSummary["level"],
      category: row.category,
      isFree: row.is_free,
      isFeatured: row.is_featured,
      locked,
      isFavorite: row.is_favorite,
    };
  });

  return c.json({ workouts });
});

workoutsRoute.get("/:id", requireUser, async (c) => {
  const user = c.get("user");
  const id = Number(c.req.param("id"));
  if (!Number.isInteger(id)) return c.json({ error: "invalid id" }, 400);

  const { rows } = await query<WorkoutRow>(
    `SELECT w.id, w.title, w.description, w.thumbnail_url, w.mux_playback_id, w.mux_status,
            w.duration_seconds, w.level, w.category, w.is_free, w.is_featured,
            (f.id IS NOT NULL) AS is_favorite
       FROM workouts w
       LEFT JOIN favorites f ON f.workout_id = w.id AND f.user_id = $2
      WHERE w.id = $1 AND w.is_published = TRUE`,
    [id, user.id]
  );
  const row = rows[0];
  if (!row) return c.json({ error: "not found" }, 404);

  const locked = !canWatch(user, row);

  let playbackToken: string | null = null;
  let muxPlaybackId: string | null = null;
  if (!locked && row.mux_status === "ready" && row.mux_playback_id) {
    muxPlaybackId = row.mux_playback_id;
    playbackToken = mintPlaybackToken(row.mux_playback_id);
  }

  const workout: WorkoutDetail = {
    id: row.id,
    title: row.title,
    description: row.description,
    thumbnailUrl: row.thumbnail_url,
    durationSeconds: row.duration_seconds,
    level: row.level as WorkoutDetail["level"],
    category: row.category,
    isFree: row.is_free,
    isFeatured: row.is_featured,
    locked,
    isFavorite: row.is_favorite,
    muxStatus: row.mux_status as WorkoutDetail["muxStatus"],
    muxPlaybackId,
    playbackToken,
  };

  return c.json(workout);
});

workoutsRoute.post("/:id/complete", requireUser, async (c) => {
  const user = c.get("user");
  const id = Number(c.req.param("id"));
  if (!Number.isInteger(id)) return c.json({ error: "invalid id" }, 400);

  const body = await c.req
    .json<{ durationWatchedSeconds?: number }>()
    .catch(() => ({ durationWatchedSeconds: undefined }));

  const { rows } = await query<{ is_free: boolean }>(
    `SELECT is_free FROM workouts WHERE id = $1 AND is_published = TRUE`,
    [id]
  );
  const workout = rows[0];
  if (!workout) return c.json({ error: "not found" }, 404);
  if (!canWatch(user, workout)) return c.json({ error: "forbidden" }, 403);

  await query(
    `INSERT INTO workout_completions (user_id, workout_id, duration_watched_seconds)
     VALUES ($1, $2, $3)`,
    [user.id, id, body.durationWatchedSeconds ?? null]
  );

  return c.json({ ok: true });
});
