import { Hono } from "hono";
import { query } from "../lib/db";
import { requireUser } from "../middleware/auth";
import type { ProgressStats, RecentCompletion, WeeklyActivity } from "../../shared/types";

const DAY_LABELS = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];

interface RecentRow {
  id: number;
  workout_id: number;
  title: string;
  thumbnail_url: string | null;
  level: string;
  category: string | null;
  duration_seconds: number | null;
  completed_at: string;
}

interface DailyRow {
  day: string;
  count: string;
  seconds: string;
}

export const progressRoute = new Hono();

progressRoute.get("/", requireUser, async (c) => {
  const user = c.get("user");

  const [recentResult, dailyResult, totalResult] = await Promise.all([
    query<RecentRow>(
      `SELECT c.id, c.workout_id, w.title, w.thumbnail_url, w.level, w.category,
              w.duration_seconds, c.completed_at
         FROM workout_completions c
         JOIN workouts w ON w.id = c.workout_id
        WHERE c.user_id = $1
        ORDER BY c.completed_at DESC
        LIMIT 10`,
      [user.id]
    ),
    query<DailyRow>(
      `SELECT to_char(date_trunc('day', c.completed_at), 'YYYY-MM-DD') AS day,
              COUNT(*) AS count,
              COALESCE(SUM(COALESCE(c.duration_watched_seconds, w.duration_seconds, 0)), 0) AS seconds
         FROM workout_completions c
         JOIN workouts w ON w.id = c.workout_id
        WHERE c.user_id = $1 AND c.completed_at >= now() - interval '6 days'
        GROUP BY day`,
      [user.id]
    ),
    query<{ count: string }>(
      `SELECT COUNT(*) AS count FROM workout_completions WHERE user_id = $1`,
      [user.id]
    ),
  ]);

  const dailyByDate = new Map(dailyResult.rows.map((row) => [row.day, row]));

  const weekly: WeeklyActivity[] = [];
  let thisWeekSessions = 0;
  let thisWeekSeconds = 0;
  for (let i = 6; i >= 0; i--) {
    const date = new Date();
    date.setUTCDate(date.getUTCDate() - i);
    const key = date.toISOString().slice(0, 10);
    const row = dailyByDate.get(key);
    const count = row ? Number(row.count) : 0;
    thisWeekSessions += count;
    thisWeekSeconds += row ? Number(row.seconds) : 0;
    weekly.push({ day: DAY_LABELS[date.getUTCDay()], count });
  }

  const recent: RecentCompletion[] = recentResult.rows.map((row) => ({
    id: row.id,
    workoutId: row.workout_id,
    title: row.title,
    thumbnailUrl: row.thumbnail_url,
    level: row.level as RecentCompletion["level"],
    category: row.category,
    durationSeconds: row.duration_seconds,
    completedAt: row.completed_at,
  }));

  const stats: ProgressStats = {
    thisWeekSessions,
    thisWeekMinutes: Math.round(thisWeekSeconds / 60),
    totalSessions: Number(totalResult.rows[0]?.count ?? 0),
    weekly,
    recent,
  };

  return c.json(stats);
});
