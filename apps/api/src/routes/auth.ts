import { Hono } from "hono";
import { auth } from "@core/auth/server";

/**
 * Mount BetterAuth. It owns all `/api/auth/*` routes:
 * sign-up, sign-in, sign-out, session, verify-email, reset-password, OAuth callbacks, etc.
 */
export const authRoutes = new Hono();
authRoutes.all("/*", (c) => auth.handler(c.req.raw));
