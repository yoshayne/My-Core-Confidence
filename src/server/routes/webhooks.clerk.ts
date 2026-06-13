import { Hono } from "hono";
import { Webhook } from "svix";
import { query } from "../lib/db";
import { sendWelcomeEmail } from "../lib/brevo";
import { isAdminEmail } from "../lib/adminEmails";

export const clerkWebhook = new Hono();

clerkWebhook.post("/", async (c) => {
  const secret = process.env.CLERK_WEBHOOK_SECRET;
  if (!secret) return c.json({ error: "server not configured" }, 500);

  // Clerk signs with Svix — verify against the RAW body.
  const payload = await c.req.text();
  const headers = {
    "svix-id": c.req.header("svix-id") ?? "",
    "svix-timestamp": c.req.header("svix-timestamp") ?? "",
    "svix-signature": c.req.header("svix-signature") ?? "",
  };

  let evt: any;
  try {
    evt = new Webhook(secret).verify(payload, headers);
  } catch {
    return c.json({ error: "invalid signature" }, 400);
  }

  const { type, data } = evt as { type: string; data: any };

  try {
    if (type === "user.created" || type === "user.updated") {
      const email = data.email_addresses?.[0]?.email_address ?? "";
      const name =
        [data.first_name, data.last_name].filter(Boolean).join(" ") || null;
      const avatar = data.image_url ?? null;

      if (type === "user.created") {
        // Idempotent insert — safe if Clerk retries delivery.
        await query(
          `INSERT INTO users (clerk_user_id, email, name, avatar_url, is_admin)
           VALUES ($1, $2, $3, $4, $5)
           ON CONFLICT (clerk_user_id) DO UPDATE
             SET email = EXCLUDED.email, name = EXCLUDED.name,
                 avatar_url = EXCLUDED.avatar_url,
                 is_admin = users.is_admin OR EXCLUDED.is_admin,
                 updated_at = now()`,
          [data.id, email, name, avatar, isAdminEmail(email)]
        );
        await sendWelcomeEmail(email, name ?? undefined);
      } else {
        await query(
          `UPDATE users SET email = $2, name = $3, avatar_url = $4,
             is_admin = is_admin OR $5, updated_at = now()
           WHERE clerk_user_id = $1`,
          [data.id, email, name, avatar, isAdminEmail(email)]
        );
      }
    } else if (type === "user.deleted") {
      await query(`DELETE FROM users WHERE clerk_user_id = $1`, [data.id]);
    }
  } catch (err) {
    console.error("Clerk webhook DB error:", err);
    return c.json({ error: "processing failed" }, 500);
  }

  return c.json({ received: true });
});
