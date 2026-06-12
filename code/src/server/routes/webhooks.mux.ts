import { Hono } from "hono";
import { mux } from "../lib/mux";
import { query } from "../lib/db";

export const muxWebhook = new Hono();

muxWebhook.post("/", async (c) => {
  const secret = process.env.MUX_WEBHOOK_SECRET;
  if (!secret) return c.json({ error: "server not configured" }, 500);

  const body = await c.req.text(); // RAW body

  let event: any;
  try {
    event = await mux.webhooks.unwrap(body, c.req.raw.headers as any, secret);
  } catch {
    return c.json({ error: "invalid signature" }, 400);
  }

  try {
    const data = event.data ?? {};
    const workoutId = data.passthrough; // workout id set at upload time
    if (!workoutId) return c.json({ received: true });

    if (event.type === "video.asset.ready") {
      const playbackId = data.playback_ids?.[0]?.id ?? null;
      const durationSeconds = data.duration ? Math.round(data.duration) : null;
      await query(
        `UPDATE workouts
           SET mux_asset_id = $2, mux_playback_id = $3, mux_status = 'ready',
               duration_seconds = COALESCE($4, duration_seconds), updated_at = now()
         WHERE id = $1`,
        [workoutId, data.id, playbackId, durationSeconds]
      );
    } else if (event.type === "video.asset.errored") {
      await query(
        `UPDATE workouts SET mux_status = 'errored', updated_at = now() WHERE id = $1`,
        [workoutId]
      );
    }
  } catch (err) {
    console.error("Mux webhook processing error:", err);
    return c.json({ error: "processing failed" }, 500);
  }

  return c.json({ received: true });
});
