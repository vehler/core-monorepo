# core-monorepo

Monorepo starter: **Hono API** + **typed SDK** + **Next.js web** (mobile-ready via SDK). All business logic lives behind the API; every UI is a thin face over the SDK.

## Architecture

```
┌─────────────┐     ┌──────────────┐     ┌──────────────────┐
│  apps/web   │     │ apps/mobile  │     │   apps/cli etc   │
│  (Next.js)  │     │  (Expo, RN)  │     │                  │
└──────┬──────┘     └──────┬───────┘     └────────┬─────────┘
       │                   │                      │
       └───────────┬───────┴──────────────────────┘
                   │  imports @core/sdk
                   ▼
        ┌────────────────────┐
        │  packages/sdk      │  typed HTTP client, ApiError
        └─────────┬──────────┘
                  │ HTTPS
                  ▼
        ┌────────────────────┐
        │  apps/api (Hono)   │  routes, auth, rate limits
        └─────────┬──────────┘
                  │ imports
                  ▼
        ┌────────────────────┐
        │  packages/core     │  types, Zod schemas, logic
        └────────────────────┘
```

**The rule:** UIs never know about database tables, Hono, or raw HTTP. They call `api.things.doWhatever(...)` on the SDK. Adding a mobile app means `pnpm create expo apps/mobile`, add `@core/sdk` as a dep, and the whole API is available, typed.

## Stack

| Layer       | Choice                                          |
| ----------- | ----------------------------------------------- |
| Monorepo    | pnpm workspaces 9                               |
| Language    | TypeScript 5 strict + `verbatimModuleSyntax`    |
| API         | Hono 4 on Node (tsx in dev)                     |
| SDK         | Zero-dep fetch wrapper, typed errors            |
| Web         | Next.js 14 App Router, Tailwind, shadcn/ui      |
| Validation  | Zod (shared between API + SDK via `@core/core`) |
| Test        | Vitest                                          |
| Lint/Format | ESLint + Prettier                               |

## Quick start

```bash
# 1. After cloning the template, personalize it (interactive):
node scripts/init.mjs

# ...or non-interactive:
node scripts/init.mjs --name=my-app --scope=myorg --api-port=4000 --web-port=3000 --yes

# 2. Install and run:
pnpm install
pnpm format                              # realigns markdown tables shifted by the scope rename
pnpm --filter @core/db run db:push       # create SQLite tables
pnpm dev                                 # runs api (4000) + web (3000) together
```

The init script:

- Renames `@core/*` packages to `@<yourscope>/*`
- Sets the root project name
- Updates ports in env examples and configs
- Creates `.env.local` files from examples
- Removes the template's git history
- Deletes itself

Open http://localhost:3000 — the home page is a Server Component calling the API via SDK.

## Scripts

| Command                        | What it does                                      |
| ------------------------------ | ------------------------------------------------- |
| `pnpm dev`                     | Run api + web in parallel                         |
| `pnpm dev:api` / `dev:web`     | Run just one                                      |
| `pnpm build`                   | Build every workspace                             |
| `pnpm typecheck`               | `tsc --noEmit` across all packages                |
| `pnpm lint` / `lint:fix`       | ESLint across all packages                        |
| `pnpm format` / `format:check` | Prettier on the whole tree                        |
| `pnpm test`                    | Vitest across all packages                        |
| `pnpm check`                   | typecheck + lint + format + test (run before PRs) |
| `pnpm clean`                   | Nuke build artifacts + caches                     |

## Workspaces

```
apps/
  api/     @core/api   Hono API — owns all business logic
  web/     @core/web   Next.js — sign-in/up + protected dashboard
packages/
  core/    @core/core  Shared types, Zod schemas, error codes
  sdk/     @core/sdk   Typed HTTP client (used by all UIs)
  auth/    @core/auth  BetterAuth config (email/password + bearer)
  db/      @core/db    Drizzle schema + SQLite client
```

## Auth

Email/password + sessions are wired up by default via **BetterAuth**. Web uses cookies; mobile will use bearer tokens (`bearer()` plugin already enabled). SDK's `apiWithAuth(cookies)` forwards the session from Server Components.

See **docs/AUTH.md** for the full guide — extending with OAuth, email verification, organizations, 2FA, and swapping SQLite for Postgres.

## Adding a new resource end-to-end

The `hello` resource demonstrates the full loop. To add a new one (e.g. `users`):

1. **Types + schema** → `packages/core/src/users.ts` exports `UserResponse`, `CreateUserSchema`
2. **API route** → `apps/api/src/routes/users.ts` validates with Zod, returns `UserResponse`
3. **SDK resource** → `packages/sdk/src/resources/users.ts` exports `usersResource(http)`
4. **SDK client** → add `users: usersResource(http)` in `packages/sdk/src/index.ts`
5. **Consume** → `api.users.create({ ... })` from any UI

Types flow one way: `core` → `api` + `sdk` → `web`/`mobile`. No duplication.

## Adding a mobile app

```bash
cd apps && pnpm create expo mobile
cd mobile && pnpm add @core/sdk@workspace:*
```

Then in the Expo app:

```ts
import { createClient } from "@core/sdk";
const api = createClient({ baseUrl: process.env.EXPO_PUBLIC_API_URL! });
```

Same client, same types, same errors. The SDK uses `fetch`, which is polyfilled in React Native.

## Rename after cloning

Just run `node scripts/init.mjs` — it handles renames, ports, env files, and git reset in one pass.

## Docs

- `docs/ARCHITECTURE.md` — how the pieces fit and when to add packages
- `docs/DEPLOYMENT.md` — deploying API + web independently
- `docs/DECISIONS.md` — why these defaults
- `CLAUDE.md` — AI assistant guidance
