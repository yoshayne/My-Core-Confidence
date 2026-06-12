import { Hono } from "hono";
import { stripe } from "../lib/stripe";
import { getAppUrl } from "../lib/appUrl";
import { requireUser } from "../middleware/auth";

export const billingPortalRoute = new Hono();

billingPortalRoute.post("/", requireUser, async (c) => {
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
