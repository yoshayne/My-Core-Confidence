import type { Context } from "hono";

export function getAppUrl(c: Context): string {
  return process.env.APP_URL ?? new URL(c.req.url).origin;
}
