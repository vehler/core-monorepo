import { betterAuth } from "better-auth";
import { bearer } from "better-auth/plugins";
import { drizzleAdapter } from "better-auth/adapters/drizzle";
import { db } from "@core/db/client";
import * as schema from "@core/db/schema";

/**
 * BetterAuth server instance. Owns:
 *  - email/password auth
 *  - session management (cookie for web, bearer token for mobile)
 *  - user/session/account/verification storage via Drizzle + SQLite
 *
 * Extension hooks (see README docs/AUTH.md for full guide):
 *  - socialProviders: Google / GitHub / etc
 *  - emailVerification: wire up email sender
 *  - plugins: organization(), twoFactor(), magicLink(), admin(), passkey()
 *  - databaseHooks: run logic on user create/update
 */
export const auth = betterAuth({
  database: drizzleAdapter(db, {
    provider: "sqlite",
    schema: {
      user: schema.users,
      session: schema.sessions,
      account: schema.accounts,
      verification: schema.verifications,
    },
  }),

  baseURL: process.env.BETTER_AUTH_URL ?? "http://localhost:4000",
  secret: process.env.BETTER_AUTH_SECRET!,

  emailAndPassword: {
    enabled: true,
    minPasswordLength: 8,
    autoSignIn: true,
    // sendResetPassword: async ({ user, url }) => { /* wire up email */ },
  },

  // emailVerification: {
  //   sendVerificationEmail: async ({ user, url }) => { /* wire up email */ },
  //   sendOnSignUp: true,
  //   requireEmailVerification: false,
  // },

  // socialProviders: {
  //   google: {
  //     clientId: process.env.GOOGLE_CLIENT_ID!,
  //     clientSecret: process.env.GOOGLE_CLIENT_SECRET!,
  //   },
  // },

  session: {
    expiresIn: 60 * 60 * 24 * 30, // 30 days
    updateAge: 60 * 60 * 24, // refresh cookie daily
    cookieCache: { enabled: true, maxAge: 60 * 5 },
  },

  // Cross-subdomain cookies for staging/prod where api + web share a parent domain.
  advanced: process.env.COOKIE_DOMAIN
    ? {
        crossSubDomainCookies: {
          enabled: true,
          domain: process.env.COOKIE_DOMAIN,
        },
      }
    : undefined,

  plugins: [
    // Bearer tokens for mobile / non-browser clients.
    // Pass `Authorization: Bearer <token>` — the token comes from the same
    // session endpoints, so web cookies and mobile tokens share one backend.
    bearer(),
  ],

  trustedOrigins: [
    process.env.WEB_ORIGIN ?? "http://localhost:3000",
    ...(process.env.EXTRA_CORS_ORIGINS?.split(",").map((s) => s.trim()) ?? []),
  ].filter(Boolean),
});

export type Auth = typeof auth;
export type AuthSession = typeof auth.$Infer.Session;
