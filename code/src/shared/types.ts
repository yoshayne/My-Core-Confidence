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

export type WorkoutLevel = "Beginner" | "Intermediate" | "Advanced";

export interface WorkoutSummary {
  id: number;
  title: string;
  thumbnailUrl: string | null;
  durationSeconds: number | null;
  level: WorkoutLevel;
  category: string | null;
  isFree: boolean;
  isFeatured: boolean;
  locked: boolean;
}

export interface WorkoutDetail extends WorkoutSummary {
  description: string | null;
  muxStatus: "pending" | "ready" | "errored";
  muxPlaybackId: string | null;
  playbackToken: string | null;
}

export type PlanKey = "monthly" | "annual";

export interface SubscriptionPlan {
  planKey: PlanKey;
  displayName: string;
  amountCents: number;
  currency: string;
  interval: "month" | "year";
}
