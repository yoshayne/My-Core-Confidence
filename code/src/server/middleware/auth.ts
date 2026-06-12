import { clerkMiddleware, getAuth } from "@hono/clerk-auth";
import type { MiddlewareHandler } from "hono";
import { query } from "../lib/db";
import { upsertUserFromClerk } from "../lib/userSync";

// Verifies the Clerk session token on every /api request.
// Reuse the frontend's publishable key (not secret) so only one Clerk key
// pair needs configuring, per CLAUDE.md Section 3.
export const withClerk = clerkMiddleware({
  secretKey: process.env.CLERK_SECRET_KEY,
  publishableKey: process.env.VITE_CLERK_PUBLISHABLE_KEY,
});

export interface UserRow {
  id: number;
  clerk_user_id: string;
  email: string;
  name: string | null;
  avatar_url: string | null;
  is_admin: boolean;
  stripe_customer_id: string | null;
  stripe_subscription_id: string | null;
  subscription_status: string;
  subscription_plan: string | null;
  current_period_end: string | null;
}

declare module "hono" {
  interface ContextVariableMap {
    user: UserRow;
  }
}

// Requires a valid Clerk session AND a matching `users` row.
export const requireUser: MiddlewareHandler = async (c, next) => {
  const auth = getAuth(c);
  if (!auth?.userId) return c.json({ error: "unauthorized" }, 401);

  const { rows } = await query<UserRow>(
    `SELECT * FROM users WHERE clerk_user_id = $1`,
    [auth.userId]
  );

  let user = rows[0];
  if (!user) {
    // The user.created webhook may not have landed yet — sync directly from Clerk.
    const synced = await upsertUserFromClerk(c.get("clerk"), auth.userId);
    if (!synced) return c.json({ error: "user not found" }, 404);
    user = synced;
  }

  c.set("user", user);
  await next();
};

// Requires requireUser to have run first, and users.is_admin = TRUE.
export const requireAdmin: MiddlewareHandler = async (c, next) => {
  const user = c.get("user");
  if (!user?.is_admin) return c.json({ error: "forbidden" }, 403);
  await next();
};
