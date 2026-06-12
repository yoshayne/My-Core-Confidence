import { Hono } from "hono";
import { query } from "../lib/db";
import { requireUser } from "../middleware/auth";
import type { SubscriptionPlan } from "../../shared/types";

interface PlanRow {
  plan_key: string;
  display_name: string;
  amount_cents: number;
  currency: string;
  interval: string;
}

export const plansRoute = new Hono();

plansRoute.get("/", requireUser, async (c) => {
  const { rows } = await query<PlanRow>(
    `SELECT plan_key, display_name, amount_cents, currency, interval
       FROM subscription_plans
      WHERE is_active = TRUE
      ORDER BY interval ASC`
  );

  const plans: SubscriptionPlan[] = rows.map((row) => ({
    planKey: row.plan_key as SubscriptionPlan["planKey"],
    displayName: row.display_name,
    amountCents: row.amount_cents,
    currency: row.currency,
    interval: row.interval as SubscriptionPlan["interval"],
  }));

  return c.json({ plans });
});
