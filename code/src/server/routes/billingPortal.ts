import { Hono } from "hono";
import { stripe } from "../lib/stripe";
import { getAppUrl } from "../lib/appUrl";
import { requireUser } from "../middleware/auth";
import { rateLimit } from "../middleware/rateLimit";

export const billingPortalRoute = new Hono();

billingPortalRoute.post("/", requireUser, rateLimit({ windowMs: 60_000, max: 5, key: "billing-portal" }), async (c) => {
  const user = c.get("user");
  if (!user.stripe_customer_id) {
    return c.json({ error: "no stripe customer" }, 400);
  }

  const appUrl = getAppUrl(c);

  const session = await stripe.billingPortal.sessions.create({
    customer: user.stripe_customer_id,
    return_url: `${appUrl}/profile`,
  });

  return c.json({ url: session.url });
});
