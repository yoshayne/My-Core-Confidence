import type { MiddlewareHandler } from "hono";

interface Bucket {
  count: number;
  resetAt: number;
}

const buckets = new Map<string, Bucket>();

// Simple in-memory sliding-window limiter, keyed per authenticated user.
// Good enough for a single Railway instance; protects expensive routes
// (Stripe, Mux, bucket uploads) from accidental or abusive bursts.
export function rateLimit(opts: { windowMs: number; max: number; key: string }): MiddlewareHandler {
  return async (c, next) => {
    const user = c.get("user");
    const id = user?.id ?? c.req.header("x-forwarded-for") ?? "anon";
    const bucketKey = `${opts.key}:${id}`;

    const now = Date.now();
    const bucket = buckets.get(bucketKey);

    if (!bucket || bucket.resetAt <= now) {
      buckets.set(bucketKey, { count: 1, resetAt: now + opts.windowMs });
    } else {
      bucket.count += 1;
      if (bucket.count > opts.max) {
        const retryAfter = Math.ceil((bucket.resetAt - now) / 1000);
        c.header("Retry-After", String(retryAfter));
        return c.json({ error: "too many requests" }, 429);
      }
    }

    await next();
  };
}
