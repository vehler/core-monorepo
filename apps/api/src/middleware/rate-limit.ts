import { rateLimiter } from "hono-rate-limiter";

/**
 * Rate limiter for auth endpoints.
 * 10 attempts per IP per 15 minutes — prevents brute-force on sign-in/sign-up.
 *
 * Customize by importing and chaining:
 *   app.use("/api/auth/*", authRateLimit);
 *
 * For production with multiple instances, swap the default in-memory store
 * for Redis: https://github.com/rhinobase/hono-rate-limiter#stores
 */
export const authRateLimit = rateLimiter({
  windowMs: 15 * 60 * 1000, // 15 minutes
  limit: 10, // 10 requests per window per key
  standardHeaders: "draft-6",
  keyGenerator: (c) => {
    // Use X-Forwarded-For behind a reverse proxy, fall back to remote address
    return (
      c.req.header("x-forwarded-for")?.split(",")[0]?.trim() ??
      c.req.header("x-real-ip") ??
      "unknown"
    );
  },
  handler: (c) => {
    return c.json(
      {
        error: {
          code: "RATE_LIMITED",
          message: "Too many requests. Try again later.",
        },
      },
      429,
    );
  },
});

/**
 * General-purpose rate limiter for API routes.
 * 100 requests per IP per minute — adjust as needed.
 */
export const generalRateLimit = rateLimiter({
  windowMs: 60 * 1000,
  limit: 100,
  standardHeaders: "draft-6",
  keyGenerator: (c) => {
    return (
      c.req.header("x-forwarded-for")?.split(",")[0]?.trim() ??
      c.req.header("x-real-ip") ??
      "unknown"
    );
  },
  handler: (c) => {
    return c.json(
      {
        error: {
          code: "RATE_LIMITED",
          message: "Too many requests. Try again later.",
        },
      },
      429,
    );
  },
});
