# Auth

This template ships with [BetterAuth](https://better-auth.com) wired up for email/password, with bearer-token support so mobile clients use the same backend.

## What's included

| Piece                                                     | Location                          |
| --------------------------------------------------------- | --------------------------------- |
| BetterAuth server config                                  | `packages/auth/src/server.ts`     |
| Auth client factory (React)                               | `packages/auth/src/client.ts`     |
| Drizzle schema (users, sessions, accounts, verifications) | `packages/db/src/schema.ts`       |
| SQLite dev DB                                             | `packages/db/src/client.ts`       |
| `/api/auth/**` routes                                     | `apps/api/src/routes/auth.ts`     |
| `requireAuth` / `optionalAuth` middleware                 | `apps/api/src/middleware/auth.ts` |
| Protected `/me` endpoint                                  | `apps/api/src/routes/me.ts`       |
| Web auth client                                           | `apps/web/src/lib/auth-client.ts` |
| Sign-in / sign-up pages                                   | `apps/web/src/app/(auth)/`        |
| Protected dashboard                                       | `apps/web/src/app/dashboard/`     |

## First run

```bash
pnpm install
pnpm --filter @core/db run db:push     # creates dev.db with tables
pnpm dev
```

Open http://localhost:3000/sign-up, create an account, get redirected to `/dashboard`.

## How it flows

```
┌──────────────┐   POST /api/auth/sign-up    ┌──────────────┐
│  web form    │ ─────────────────────────▶  │  apps/api    │
│              │   sets cookie (or bearer)   │  auth.handler│
└──────────────┘ ◀──────────────────────────  └──────┬───────┘
                                                     │ Drizzle
                                                     ▼
                                            ┌──────────────┐
                                            │  SQLite dev.db│
                                            └──────────────┘
```

- **Web** → cookies, set automatically by BetterAuth on sign-in.
- **Mobile** → same endpoints, but pass `Authorization: Bearer <token>` instead. The `bearer()` plugin on the server handles both.
- **SDK** → `apiWithAuth(cookieHeader)` forwards cookies from Server Components, so protected routes work in SSR.

## Protecting an API route

```ts
import { Hono } from "hono";
import { requireAuth } from "../middleware/auth";

const things = new Hono();
things.use("*", requireAuth);

things.get("/", (c) => {
  const userId = c.get("userId");
  // ... fetch things for this user
});
```

Unauthenticated requests throw `ApiError` with `code=UNAUTHORIZED`, status 401.

## Protecting a web route

Server Component approach (recommended — it's what `/dashboard` does):

```tsx
const cookieHeader = headers().get("cookie");
const api = apiWithAuth(cookieHeader);
try {
  const me = await api.me.get();
  // ... render
} catch (err) {
  if (err instanceof ApiError && err.status === 401) redirect("/sign-in");
  throw err;
}
```

For client components, use `useSession()` from `auth-client.ts`.

## Extending

### OAuth (Google, GitHub, etc.)

In `packages/auth/src/server.ts`, uncomment and fill:

```ts
socialProviders: {
  google: {
    clientId: process.env.GOOGLE_CLIENT_ID!,
    clientSecret: process.env.GOOGLE_CLIENT_SECRET!,
  },
},
```

Then in the web app, add buttons that call `signIn.social({ provider: "google" })`.

### Email verification

1. Add an email sender package (Resend, SES, Postmark) — see `packages/email` in Nora for reference.
2. In `server.ts`, uncomment the `emailVerification` block and wire up `sendVerificationEmail`.
3. Set `requireEmailVerification: true` when you're ready to enforce it.

### Organizations / teams

Add the `organization()` plugin from BetterAuth. You'll also need to add `organizations` and `members` tables to the Drizzle schema — run `pnpm exec @better-auth/cli@latest generate` from `packages/db` to produce them.

Then on the client: `organizationClient()` in `packages/auth/src/client.ts`.

### Two-factor, passkeys, magic links

All are BetterAuth plugins. Same pattern: add server plugin, add client plugin, add any required tables to the schema.

## Switching from SQLite to Postgres

1. `pnpm --filter @core/db remove @libsql/client && pnpm --filter @core/db add pg`
2. In `packages/db/src/client.ts`, swap to the pg driver (see the comment block in the file).
3. In `packages/db/src/schema.ts`, replace `sqliteTable`/`text`/`integer` imports with the `pg-core` equivalents. The column types stay the same shape.
4. In `packages/db/drizzle.config.ts`, change `dialect: "sqlite"` → `dialect: "postgresql"` and update `dbCredentials`.
5. In `packages/auth/src/server.ts`, change `provider: "sqlite"` → `provider: "pg"`.
6. `pnpm --filter @core/db run db:push` to apply the schema.

## Security

- **`BETTER_AUTH_SECRET`** must be at least 32 random bytes in production. The `init.mjs` script generates one automatically. Never use the placeholder from `.env.example`.
- **Rate limiting** is enabled on `/api/auth/*` — 10 requests per IP per 15 minutes. Adjust in `apps/api/src/middleware/rate-limit.ts`. Swap the in-memory store for Redis in production with multiple instances.
- **CORS** only returns `access-control-allow-origin` for origins listed in `trustedOrigins`. Credentials are only sent for trusted origins.
- **Passwords** are hashed with scrypt (BetterAuth default). Never store or log raw passwords.

## Cookie cache tradeoff

Session lookup (`auth.api.getSession()`) is cached for **5 minutes** (`session.cookieCache` in server.ts). This means:

- After signout, the cookie may still validate for up to 5 minutes on the API side.
- In practice, the web client clears the cookie on signout, so re-requests won't include it.
- For high-security apps (banking, admin panels), disable the cache:

```ts
session: {
  cookieCache: { enabled: false },
},
```

The tradeoff: disabling the cache means every API request hits the database for session validation instead of serving from memory.

## Notes

- `trustedOrigins` is read at server startup. If you add a new frontend origin, restart the API.
- Sessions are 30 days by default (`session.expiresIn` in server.ts).
- Auth routes are mounted at `/api/auth/**` — BetterAuth owns that path prefix entirely.
