// Shared TypeScript types between the React app and the Hono server.

export interface UserProfile {
  id: number;
  email: string;
  name: string | null;
  avatarUrl: string | null;
  isAdmin: boolean;
  subscriptionStatus: "free" | "active" | "past_due" | "canceled";
  subscriptionPlan: "monthly" | "annual" | null;
  currentPeriodEnd: string | null;
}
