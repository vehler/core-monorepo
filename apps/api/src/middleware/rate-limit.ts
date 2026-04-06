import { rateLimiter } from "hono-rate-limiter";
import type { Context } from "hono";
import { ERROR_CODES, type ApiErrorEnvelope } from "@core/core";

/**
 * Extract client IP from proxy headers or fall back to unknown.
 *
 * ⚠️  X-Forwarded-For is client-spoofable unless your reverse proxy (nginx,
 * Cloudflare, etc.) overwrites it. In production, configure your proxy to set
 * a trusted header (e.g., CF-Connecting-IP) and update this function.
 */
function extractClientIp(c: Context): string {
  return (
    c.req.header("x-forwarded-for")?.split(",")[0]?.trim() ?? c.req.header("x-real-ip") ?? "unknown"
  );
}

/** Standard 429 response using the canonical error envelope. */
function rateLimitResponse(c: Context) {
  const envelope: ApiErrorEnvelope = {
    error: {
      code: ERROR_CODES.RATE_LIMITED,
      message: "Too many requests. Try again later.",
    },
  };
  return c.json(envelope, 429);
}

/**
 * Rate limiter for auth endpoints.
 * 10 attempts per IP per 15 minutes — prevents brute-force on sign-in/sign-up.
 *
 * For production with multiple instances, swap the in-memory store
 * for Redis: https://github.com/rhinobase/hono-rate-limiter#stores
 */
export const authRateLimit = rateLimiter({
  windowMs: 15 * 60 * 1000,
  limit: 10,
  standardHeaders: "draft-6",
  keyGenerator: extractClientIp,
  handler: rateLimitResponse,
});

/**
 * General-purpose rate limiter for API routes.
 * 100 requests per IP per minute.
 */
export const generalRateLimit = rateLimiter({
  windowMs: 60 * 1000,
  limit: 100,
  standardHeaders: "draft-6",
  keyGenerator: extractClientIp,
  handler: rateLimitResponse,
});
