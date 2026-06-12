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
}

export const workoutsRoute = new Hono();

workoutsRoute.get("/", requireUser, async (c) => {
  const user = c.get("user");

  const { rows } = await query<WorkoutRow>(
    `SELECT id, title, description, thumbnail_url, mux_playback_id, mux_status,
            duration_seconds, level, category, is_free, is_featured
       FROM workouts
      WHERE is_published = TRUE
      ORDER BY is_featured DESC, sort_order ASC, id ASC`
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
    };
  });

  return c.json({ workouts });
});

workoutsRoute.get("/:id", requireUser, async (c) => {
  const user = c.get("user");
  const id = Number(c.req.param("id"));
  if (!Number.isInteger(id)) return c.json({ error: "invalid id" }, 400);

  const { rows } = await query<WorkoutRow>(
    `SELECT id, title, description, thumbnail_url, mux_playback_id, mux_status,
            duration_seconds, level, category, is_free, is_featured
       FROM workouts
      WHERE id = $1 AND is_published = TRUE`,
    [id]
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
    muxStatus: row.mux_status as WorkoutDetail["muxStatus"],
    muxPlaybackId,
    playbackToken,
  };

  return c.json(workout);
});
