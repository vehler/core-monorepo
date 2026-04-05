# Architecture

## Why this shape

Most apps start as "Next.js with an API folder" and accumulate business logic in `app/api/*` route handlers. That works — until:

- You want a mobile app. Now you rewrite the API client in Swift/Kotlin/RN.
- You want a CLI. Now you wrap the HTTP calls again.
- You want to deploy the API separately from the web. Can't — they're the same deployable.
- You want background jobs that reuse "create user" logic. Can't — it's buried in a route handler.

This template makes those splits cheap from day one.

## The layers

### `packages/core` — the source of truth

- **Zod schemas** for every request shape (used by API for validation).
- **TypeScript response types** for every endpoint.
- **Error codes** and **error envelope** shape.
- **Domain logic** that's pure (no I/O): calculators, validators, formatters.

Must work in Node, browsers, and React Native. No framework imports.

### `apps/api` — the only thing that touches data

- Hono routes that validate with `@core/core` schemas.
- Whatever data layer you add (Drizzle, Prisma, external APIs) lives here.
- Returns the `ApiErrorEnvelope` shape on errors.
- This is what you deploy to talk to your database.

### `packages/sdk` — the only HTTP client

- Wraps `fetch`. Knows how to:
  - Build auth headers.
  - Parse the error envelope into a typed `ApiError`.
  - Serialize query strings.
- Exposes **resources** — one per domain (e.g. `api.users.list()`).
- Re-exports types from `@core/core` so consumers only need `@core/sdk`.

Browser-safe. Works in any JS runtime.

### `apps/web` (and future `apps/mobile`) — the UIs

- Import `@core/sdk`. Call methods. Render results.
- Handle loading/error states with `ApiError`.
- No knowledge of HTTP verbs, URLs, or backend internals.

## When to add what

### Add a new route

Edit `apps/api/src/routes/*` + add the SDK resource. 4 files.

### Add a new UI surface (mobile, desktop, CLI)

Add a workspace under `apps/`, depend on `@core/sdk`, done.

### Add background jobs / workers

Add `apps/worker/` that imports from `@core/core` directly (not SDK — it's in the same process as the DB logic). Extract shared business logic from `apps/api` into a new `packages/services/` if needed.

### Add a new shared package

- `packages/db` — when you introduce a database (Drizzle/Prisma schemas live here, consumed by `apps/api`).
- `packages/auth` — when auth gets complex enough to extract.
- `packages/ui` — when you add a second web/native UI that shares components.

### Don't add these until you need them

- Turborepo / Nx — pnpm `-r` is fine until build times hurt.
- A separate `tsconfig` package — this template uses a single root config.
- Per-package eslint configs — the root config is enough until you have framework-specific rules (web already has one for Next.js).

## Testing strategy

| Layer        | What to test                       | Tool                         |
| ------------ | ---------------------------------- | ---------------------------- |
| `@core/core` | Schema validation, pure logic      | Vitest                       |
| `apps/api`   | Route handlers via `app.request()` | Vitest + Hono                |
| `@core/sdk`  | Fetch mocking, error parsing       | Vitest                       |
| `apps/web`   | E2E critical flows                 | Playwright (add when needed) |

Don't test the SDK by booting the API. Mock `fetch`. The API's contract tests live in the API package.

## The SDK is your product

Treat `@core/sdk` like you'd treat a public npm package even though it's internal. A stable SDK makes every UI cheaper. A churning SDK blocks every UI.
