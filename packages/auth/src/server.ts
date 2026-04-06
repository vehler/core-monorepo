import { betterAuth } from "better-auth";
import { bearer } from "better-auth/plugins";
import { drizzleAdapter } from "better-auth/adapters/drizzle";
import { db, type Db } from "@core/db/client";
import * as schema from "@core/db/schema";

// ─── Types ───────────────────────────────────────────────────────────────────

export type AuthConfig = {
  db: Db;
  secret: string;
  baseURL: string;
  trustedOrigins: string[];
  cookieDomain?: string;
};

// ─── Factory ─────────────────────────────────────────────────────────────────

/**
 * Create a BetterAuth instance with explicit dependencies.
 * Use this in tests or when you need a custom configuration.
 *
 * Extension hooks (see docs/AUTH.md):
 *  - socialProviders: Google / GitHub / etc
 *  - emailVerification: wire up email sender
 *  - plugins: organization(), twoFactor(), magicLink(), admin(), passkey()
 *  - databaseHooks: run logic on user create/update
 */
export function createAuth(config: AuthConfig) {
  return betterAuth({
    database: drizzleAdapter(config.db, {
      provider: "sqlite",
      schema: {
        user: schema.users,
        session: schema.sessions,
        account: schema.accounts,
        verification: schema.verifications,
      },
    }),

    baseURL: config.baseURL,
    secret: config.secret,

    emailAndPassword: {
      enabled: true,
      minPasswordLength: 8,
      autoSignIn: true,
    },

    session: {
      expiresIn: 60 * 60 * 24 * 30,
      updateAge: 60 * 60 * 24,
      cookieCache: { enabled: true, maxAge: 60 * 5 },
    },

    advanced: config.cookieDomain
      ? { crossSubDomainCookies: { enabled: true, domain: config.cookieDomain } }
      : undefined,

    plugins: [bearer()],

    trustedOrigins: config.trustedOrigins,
  });
}

// ─── Default singleton ───────────────────────────────────────────────────────

function requiredEnv(name: string): string {
  const val = process.env[name];
  if (!val) throw new Error(`Missing required env var: ${name}`);
  return val;
}

export const auth = createAuth({
  db,
  secret: requiredEnv("BETTER_AUTH_SECRET"),
  baseURL: process.env.BETTER_AUTH_URL ?? "http://localhost:4000",
  trustedOrigins: [
    process.env.WEB_ORIGIN ?? "http://localhost:3000",
    ...(process.env.EXTRA_CORS_ORIGINS?.split(",").map((s) => s.trim()) ?? []),
  ].filter(Boolean),
  cookieDomain: process.env.COOKIE_DOMAIN,
});

export type Auth = typeof auth;
export type AuthSession = typeof auth.$Infer.Session;
