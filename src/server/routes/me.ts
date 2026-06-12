import { Hono } from "hono";
import { requireUser } from "../middleware/auth";
import type { UserProfile } from "../../shared/types";

export const meRoute = new Hono();

meRoute.get("/", requireUser, (c) => {
  const user = c.get("user");

  const profile: UserProfile = {
    id: user.id,
    email: user.email,
    name: user.name,
    avatarUrl: user.avatar_url,
    isAdmin: user.is_admin,
    subscriptionStatus: user.subscription_status as UserProfile["subscriptionStatus"],
    subscriptionPlan: user.subscription_plan as UserProfile["subscriptionPlan"],
    currentPeriodEnd: user.current_period_end,
  };

  return c.json(profile);
});
