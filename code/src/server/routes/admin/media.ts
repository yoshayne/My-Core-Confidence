import { Hono } from "hono";
import { query } from "../../lib/db";
import { mux } from "../../lib/mux";
import { uploadImage } from "../../lib/bucket";
import { getAppUrl } from "../../lib/appUrl";
import { requireUser, requireAdmin } from "../../middleware/auth";
import { rateLimit } from "../../middleware/rateLimit";

export const adminMediaRoute = new Hono();

adminMediaRoute.use("*", requireUser, requireAdmin);
adminMediaRoute.use("*", rateLimit({ windowMs: 60_000, max: 20, key: "admin-media" }));

adminMediaRoute.post("/mux-upload", async (c) => {
  const body = await c.req.json<{ workoutId?: number }>().catch(() => ({ workoutId: undefined }));
  const workoutId = body.workoutId;
  if (!Number.isInteger(workoutId)) return c.json({ error: "invalid workoutId" }, 400);

  const { rows } = await query<{ id: number }>(`SELECT id FROM workouts WHERE id = $1`, [
    workoutId,
  ]);
  if (!rows[0]) return c.json({ error: "not found" }, 404);

  const upload = await mux.video.uploads.create({
    cors_origin: getAppUrl(c),
    new_asset_settings: {
      playback_policies: ["signed"],
      passthrough: String(workoutId),
    },
  });

  await query(
    `UPDATE workouts SET mux_status = 'pending', updated_at = now() WHERE id = $1`,
    [workoutId]
  );

  return c.json({ uploadUrl: upload.url, uploadId: upload.id });
});

adminMediaRoute.post("/upload-image", async (c) => {
  const formData = await c.req.formData().catch(() => null);
  const file = formData?.get("file");
  if (!(file instanceof File)) return c.json({ error: "file is required" }, 400);

  const buffer = Buffer.from(await file.arrayBuffer());
  const url = await uploadImage(buffer, file.type || "application/octet-stream", file.name);

  return c.json({ url });
});
