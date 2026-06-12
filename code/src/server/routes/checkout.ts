import { Hono } from "hono";
import { query } from "../lib/db";
import { stripe } from "../lib/stripe";
import { requireUser } from "../middleware/auth";

export const checkoutRoute = new Hono();

checkoutRoute.post("/", requireUser, async (c) => {
  const user = c.get("user");
  const body = await c.req.json<{ plan?: string }>().catch(() => ({ plan: undefined }));
  const planKey = body.plan;

  if (planKey !== "monthly" && planKey !== "annual") {
    return c.json({ error: "invalid plan" }, 400);
  }

  const { rows } = await query<{ stripe_price_id: string | null }>(
    `SELECT stripe_price_id FROM subscription_plans WHERE plan_key = $1 AND is_active = TRUE`,
    [planKey]
  );
  const priceId = rows[0]?.stripe_price_id;
  if (!priceId) return c.json({ error: "plan not configured" }, 500);

  let customerId = user.stripe_customer_id;
  if (!customerId) {
    const customer = await stripe.customers.create({
      email: user.email,
      metadata: { clerk_user_id: user.clerk_user_id },
    });
    customerId = customer.id;
    await query(`UPDATE users SET stripe_customer_id = $2, updated_at = now() WHERE id = $1`, [
      user.id,
      customerId,
    ]);
  }

  const appUrl = process.env.APP_URL ?? new URL(c.req.url).origin;

  const session = await stripe.checkout.sessions.create({
    mode: "subscription",
    customer: customerId,
    client_reference_id: user.clerk_user_id,
    line_items: [{ price: priceId, quantity: 1 }],
    success_url: `${appUrl}/subscribe/success`,
    cancel_url: `${appUrl}/subscribe`,
  });

  return c.json({ url: session.url });
});
