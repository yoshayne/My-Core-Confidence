// Emails that should automatically be granted admin access when their
// account is created or updated. Configurable via ADMIN_EMAILS (comma-separated).
const ADMIN_EMAILS = (process.env.ADMIN_EMAILS ?? "romediastudios@gmail.com")
  .split(",")
  .map((e) => e.trim().toLowerCase())
  .filter(Boolean);

export function isAdminEmail(email: string): boolean {
  return ADMIN_EMAILS.includes(email.toLowerCase());
}
