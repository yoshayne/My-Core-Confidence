import type { UserRow } from "../middleware/auth";

// Per CLAUDE.md Section 4.1 / 8.4: paid access requires an active
// subscription whose current period hasn't ended yet.
export function hasActiveSubscription(user: UserRow): boolean {
  return (
    user.subscription_status === "active" &&
    !!user.current_period_end &&
    new Date(user.current_period_end) > new Date()
  );
}

export function canWatch(user: UserRow, workout: { is_free: boolean }): boolean {
  return workout.is_free || hasActiveSubscription(user);
}
