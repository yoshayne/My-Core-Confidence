import { Hono } from "hono";
import { query } from "../../lib/db";
import { stripe } from "../../lib/stripe";
import { requireUser, requireAdmin } from "../../middleware/auth";
import { rateLimit } from "../../middleware/rateLimit";

export const adminPricingRoute = new Hono();

adminPricingRoute.use("*", requireUser, requireAdmin);

interface PlanRow {
  plan_key: string;
  display_name: string;
  amount_cents: number;
  currency: string;
  interval: string;
  stripe_price_id: string | null;
}

adminPricingRoute.get("/", async (c) => {
  const { rows } = await query<PlanRow>(
    `SELECT plan_key, display_name, amount_cents, currency, interval, stripe_price_id
       FROM subscription_plans
      ORDER BY interval ASC`
  );
  return c.json({ plans: rows });
});

adminPricingRoute.put("/", rateLimit({ windowMs: 60_000, max: 10, key: "admin-pricing" }), async (c) => {
  const body = await c.req
    .json<{ plan_key?: string; amount_cents?: number }>()
    .catch(() => ({ plan_key: undefined, amount_cents: undefined }));
  const { plan_key, amount_cents } = body;

  if (plan_key !== "monthly" && plan_key !== "annual") {
    return c.json({ error: "invalid plan_key" }, 400);
  }
  if (!Number.isInteger(amount_cents) || amount_cents! <= 0) {
    return c.json({ error: "invalid amount_cents" }, 400);
  }

  const { rows } = await query<PlanRow>(
    `SELECT plan_key, display_name, amount_cents, currency, interval, stripe_price_id
       FROM subscription_plans WHERE plan_key = $1`,
    [plan_key]
  );
  const plan = rows[0];
  if (!plan) return c.json({ error: "plan not found" }, 404);

  const productId = process.env.STRIPE_PRODUCT_ID;
  if (!productId) return c.json({ error: "STRIPE_PRODUCT_ID not configured" }, 500);

  const newPrice = await stripe.prices.create({
    product: productId,
    currency: plan.currency,
    unit_amount: amount_cents,
    recurring: { interval: plan.interval as "month" | "year" },
  });

  if (plan.stripe_price_id) {
    await stripe.prices.update(plan.stripe_price_id, { active: false }).catch((err) => {
      console.error("Failed to archive old Stripe price:", err);
    });
  }

  const { rows: updatedRows } = await query<PlanRow>(
    `UPDATE subscription_plans
        SET amount_cents = $2, stripe_price_id = $3, updated_at = now()
      WHERE plan_key = $1
      RETURNING plan_key, display_name, amount_cents, currency, interval, stripe_price_id`,
    [plan_key, amount_cents, newPrice.id]
  );

  return c.json(updatedRows[0]);
});
