import type { ClerkClient } from "@clerk/backend";
import { query } from "./db";
import type { UserRow } from "../middleware/auth";
import { isAdminEmail } from "./adminEmails";

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
    `INSERT INTO users (clerk_user_id, email, name, avatar_url, is_admin)
     VALUES ($1, $2, $3, $4, $5)
     ON CONFLICT (clerk_user_id) DO UPDATE
       SET email = EXCLUDED.email, name = EXCLUDED.name,
           avatar_url = EXCLUDED.avatar_url,
           is_admin = users.is_admin OR EXCLUDED.is_admin,
           updated_at = now()
     RETURNING *`,
    [clerkUserId, email, name, avatar, isAdminEmail(email)]
  );
  return rows[0] ?? null;
}
