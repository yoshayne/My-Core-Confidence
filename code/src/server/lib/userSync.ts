import type { ClerkClient } from "@clerk/backend";
import { query } from "./db";
import type { UserRow } from "../middleware/auth";

// Upserts a `users` row from Clerk, used as a fallback when a request
// arrives before the user.created webhook has been processed.
export async function upsertUserFromClerk(
  clerk: ClerkClient,
  clerkUserId: string
): Promise<UserRow | null> {
  const clerkUser = await clerk.users.getUser(clerkUserId).catch(() => null);
  if (!clerkUser) return null;

  const email = clerkUser.emailAddresses[0]?.emailAddress ?? "";
  const name = [clerkUser.firstName, clerkUser.lastName].filter(Boolean).join(" ") || null;
  const avatar = clerkUser.imageUrl ?? null;

  const { rows } = await query<UserRow>(
    `INSERT INTO users (clerk_user_id, email, name, avatar_url)
     VALUES ($1, $2, $3, $4)
     ON CONFLICT (clerk_user_id) DO UPDATE
       SET email = EXCLUDED.email, name = EXCLUDED.name,
           avatar_url = EXCLUDED.avatar_url, updated_at = now()
     RETURNING *`,
    [clerkUserId, email, name, avatar]
  );
  return rows[0] ?? null;
}
