import { Hono } from "hono";
import Stripe from "stripe";
import { query } from "../lib/db";
import { stripe } from "../lib/stripe";

export const stripeWebhook = new Hono();

function mapStatus(s: string): string {
  if (s === "active" || s === "trialing") return "active";
  if (s === "past_due") return "past_due";
  return "canceled";
}

async function planKeyForPrice(priceId?: string | null) {
  if (!priceId) return null;
  const r = await query(
    `SELECT plan_key FROM subscription_plans WHERE stripe_price_id = $1`,
    [priceId]
  );
  return r.rows[0]?.plan_key ?? null;
}

async function applySubscription(sub: Stripe.Subscription) {
  const customerId =
    typeof sub.customer === "string" ? sub.customer : sub.customer.id;
  const priceId = sub.items.data[0]?.price?.id ?? null;
  const plan = await planKeyForPrice(priceId);
  const status = mapStatus(sub.status);

  // current_period_end moved across Stripe API versions — check both spots.
  const anySub = sub as any;
  const endUnix =
    anySub.current_period_end ?? anySub.items?.data?.[0]?.current_period_end;
  const periodEnd = endUnix ? new Date(endUnix * 1000) : null;

  await query(
    `UPDATE users
       SET subscription_status = $2, subscription_plan = $3,
           stripe_subscription_id = $4, current_period_end = $5, updated_at = now()
     WHERE stripe_customer_id = $1`,
    [customerId, status, plan, sub.id, periodEnd]
  );
}

stripeWebhook.post("/", async (c) => {
  const secret = process.env.STRIPE_WEBHOOK_SECRET;
  const sig = c.req.header("stripe-signature");
  if (!secret || !sig) return c.json({ error: "missing signature" }, 400);

  const body = await c.req.text(); // RAW body — required for verification

  let event: Stripe.Event;
  try {
    event = stripe.webhooks.constructEvent(body, sig, secret);
  } catch {
    return c.json({ error: "invalid signature" }, 400);
  }

  try {
    switch (event.type) {
      case "checkout.session.completed": {
        const session = event.data.object as Stripe.Checkout.Session;
        const customerId =
          typeof session.customer === "string"
            ? session.customer
            : session.customer?.id;

        // Link the Stripe customer to the user row.
        if (session.client_reference_id && customerId) {
          await query(
            `UPDATE users SET stripe_customer_id = $2, updated_at = now()
             WHERE clerk_user_id = $1`,
            [session.client_reference_id, customerId]
          );
        }
        if (session.subscription) {
          const subId =
            typeof session.subscription === "string"
              ? session.subscription
              : session.subscription.id;
          const sub = await stripe.subscriptions.retrieve(subId);
          await applySubscription(sub);
        }
        break;
      }
      case "customer.subscription.created":
      case "customer.subscription.updated":
        await applySubscription(event.data.object as Stripe.Subscription);
        break;
      case "customer.subscription.deleted": {
        const sub = event.data.object as Stripe.Subscription;
        const customerId =
          typeof sub.customer === "string" ? sub.customer : sub.customer.id;
        await query(
          `UPDATE users SET subscription_status = 'canceled', updated_at = now()
           WHERE stripe_customer_id = $1`,
          [customerId]
        );
        break;
      }
      case "invoice.payment_failed": {
        const inv = event.data.object as Stripe.Invoice;
        const customerId =
          typeof inv.customer === "string" ? inv.customer : inv.customer?.id;
        if (customerId) {
          await query(
            `UPDATE users SET subscription_status = 'past_due', updated_at = now()
             WHERE stripe_customer_id = $1`,
            [customerId]
          );
        }
        break;
      }
      default:
        break; // ignore everything else
    }
  } catch (err) {
    console.error("Stripe webhook processing error:", err);
    return c.json({ error: "processing failed" }, 500);
  }

  return c.json({ received: true });
});
