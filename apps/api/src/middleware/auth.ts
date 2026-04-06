import type { Context, Next } from "hono";
import { auth, type AuthSession } from "@core/auth/server";
import { HttpError } from "../errors";
import { ERROR_CODES } from "@core/core";

declare module "hono" {
  interface ContextVariableMap {
    session: AuthSession;
    userId: string;
  }
}

/**
 * Middleware: require an authenticated session.
 * Reads the session from cookies (web) or Authorization: Bearer <token> (mobile).
 * Throws 401 via the standard error envelope on failure.
 */
export async function requireAuth(c: Context, next: Next) {
  const session = await auth.api.getSession({ headers: c.req.raw.headers });
  if (!session) {
    throw new HttpError(401, ERROR_CODES.UNAUTHORIZED, "Authentication required");
  }
  c.set("session", session);
  c.set("userId", session.user.id);
  await next();
}

/**
 * Middleware: attach session if present but don't require it.
 * Useful for endpoints that behave differently for signed-in users.
 */
export async function optionalAuth(c: Context, next: Next) {
  const session = await auth.api.getSession({ headers: c.req.raw.headers });
  if (session) {
    c.set("session", session);
    c.set("userId", session.user.id);
  }
  await next();
}
