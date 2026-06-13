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
  isFavorite: boolean;
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

export interface RecentCompletion {
  id: number;
  workoutId: number;
  title: string;
  thumbnailUrl: string | null;
  level: WorkoutLevel;
  category: string | null;
  durationSeconds: number | null;
  completedAt: string;
}

export interface WeeklyActivity {
  day: string;
  count: number;
}

export interface ProgressStats {
  thisWeekSessions: number;
  thisWeekMinutes: number;
  totalSessions: number;
  weekly: WeeklyActivity[];
  recent: RecentCompletion[];
}

export type StoryContent = Record<string, string>;

export interface AdminWorkout {
  id: number;
  title: string;
  description: string | null;
  thumbnail_url: string | null;
  mux_playback_id: string | null;
  mux_asset_id: string | null;
  mux_status: "pending" | "ready" | "errored" | null;
  duration_seconds: number | null;
  level: WorkoutLevel;
  category: string | null;
  is_free: boolean;
  is_featured: boolean;
  is_published: boolean;
  sort_order: number;
}

export interface AdminPlan {
  plan_key: PlanKey;
  display_name: string;
  amount_cents: number;
  currency: string;
  interval: "month" | "year";
  stripe_price_id: string | null;
}
