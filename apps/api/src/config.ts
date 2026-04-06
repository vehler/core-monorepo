/**
 * Shared app configuration. Single source of truth for env-derived values.
 * Validates required vars at import time — the API crashes on startup
 * instead of silently running with bad config.
 */

function required(name: string): string {
  const val = process.env[name];
  if (!val) throw new Error(`Missing required env var: ${name}`);
  return val;
}

function optional(name: string, fallback: string): string {
  return process.env[name] || fallback;
}

const isProduction = process.env.NODE_ENV === "production";

export const config = {
  port: Number(optional("API_PORT", "4000")),
  isProduction,

  /** The web app's origin — used for CORS and BetterAuth trustedOrigins. */
  webOrigin: isProduction
    ? required("WEB_ORIGIN")
    : optional("WEB_ORIGIN", "http://localhost:3000"),

  /** BetterAuth base URL — must match how the API is reachable externally. */
  authBaseUrl: isProduction
    ? required("BETTER_AUTH_URL")
    : optional("BETTER_AUTH_URL", "http://localhost:4000"),

  /** BetterAuth secret — required always. Never silently default to dev value. */
  authSecret: required("BETTER_AUTH_SECRET"),

  /** Optional cross-subdomain cookie domain (e.g. ".yourdomain.com"). */
  cookieDomain: process.env.COOKIE_DOMAIN,

  /** Extra CORS origins (comma-separated). */
  extraOrigins:
    process.env.EXTRA_CORS_ORIGINS?.split(",")
      .map((s) => s.trim())
      .filter(Boolean) ?? [],
} as const;

/**
 * All trusted origins. Used by both CORS middleware and BetterAuth.
 * Single source of truth — never parse WEB_ORIGIN / EXTRA_CORS_ORIGINS elsewhere.
 */
export function getTrustedOrigins(): string[] {
  return [config.webOrigin, ...config.extraOrigins].filter(Boolean);
}
