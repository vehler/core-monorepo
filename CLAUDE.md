# CLAUDE.md

Guidance for AI assistants working in this monorepo.

## Architecture in one sentence

API owns logic, SDK owns HTTP, UIs own presentation — types flow from `@core/core` outward.

## Dependency graph (enforced, don't break it)

```
apps/web     ──► @core/sdk  ──► @core/core
             ──► @core/auth (client) ──► (peer: React)
apps/mobile  ──► @core/sdk  ──► @core/core
             ──► @core/auth (client)
apps/api     ──► @core/core
             ──► @core/auth (server) ──► @core/db
             ──► @core/db
```

- `@core/core` depends on nothing internal. Framework-free. Must work in Node, browser, and React Native.
- `@core/sdk` depends ONLY on `@core/core`. Browser-compatible. No Node built-ins.
- `@core/db` is the only package that touches SQLite/Postgres. Imports Drizzle.
- `@core/auth/server` depends on `@core/db`. Node-only.
- `@core/auth/client` is browser/RN-safe. No `@core/db` import.
- `apps/api` depends on `@core/core` + `@core/auth/server` + `@core/db`. Never on `@core/sdk`.
- `apps/web` (and future mobile) depends on `@core/sdk` + `@core/core` + `@core/auth/client`. Never directly on `apps/api` or `@core/db`.

## Adding a new API resource

Always follow this order — it keeps types consistent:

1. **`packages/core/src/<name>.ts`** — Zod schema(s) for requests, TypeScript types for responses. Export from `src/index.ts`.
2. **`apps/api/src/routes/<name>.ts`** — Hono route using `zValidator("json", FooSchema)`, returning the typed response.
3. **`packages/sdk/src/resources/<name>.ts`** — thin wrapper: `export function fooResource(http) { return { create: (input) => http.post(...) } }`.
4. **`packages/sdk/src/index.ts`** — wire the resource into `createClient`.
5. **UI** — call `api.foo.whatever(...)`.

Write tests at each layer: schema validation in core, route in api, http parsing in sdk.

## Rules

- **`@core/core` stays framework-free.** No React, no Hono, no Node. Just types + Zod + plain functions.
- **`@core/sdk` stays browser-safe.** No `process`, no `node:*` imports. Only standard `fetch`.
- **`@core/db` is the only place that imports Drizzle.** If you need a query outside the DB package, export a typed helper from `@core/db` — don't re-import Drizzle in `apps/api`.
- **Auth rules:** Protected API routes use `requireAuth` middleware. Protected web pages fetch via `apiWithAuth(cookies)` from Server Components and redirect to `/sign-in` on 401. Mobile uses bearer tokens against the same endpoints.
- **The API returns the error envelope** defined in `@core/core` — `{ error: { code, message, details? } }`. SDK parses this into `ApiError`.
- **No feature parity between UIs.** Web and mobile can expose different subsets of SDK methods. The SDK is the full surface.
- **Env vars** validated per-app via `@t3-oss/env-nextjs` (web) or direct `process.env` reads in api/index.ts.
- **Workspace deps use `workspace:*`** — always. Never hard-pin internal package versions.

## When changing shared code

- Edit `@core/core` type → `pnpm typecheck` catches every consumer in one shot.
- Edit `@core/sdk` method → `pnpm typecheck` catches UI consumers.
- If you break the contract deliberately, update all consumers in the same PR.

## Testing

- Unit tests live next to source as `*.test.ts`.
- Run `pnpm test` for everything, `pnpm --filter @core/sdk test` for one package.
- Mock `fetch` at the SDK layer, not deeper. Test the API with Hono's `app.request()`.

### Testing protected API routes

Use the auth mock helper in `apps/api/tests/helpers/mock-auth.ts`:

```ts
import { vi, describe, it, expect, beforeEach } from "vitest";
import { mockUser, mockRequireAuth, resetMockUser } from "../../tests/helpers/mock-auth";

// Mock BEFORE importing the route (vi.mock is hoisted).
vi.mock("../middleware/auth", () => mockRequireAuth());

import { myRoute } from "./my-route";

describe("GET /my-route", () => {
  beforeEach(() => resetMockUser());

  it("returns data for the authed user", async () => {
    const app = new Hono().route("/my-route", myRoute);
    const res = await app.request("/my-route");
    expect(res.status).toBe(200);
  });
});
```

### Testing SDK resources

Mock `HttpClient` — see `packages/sdk/src/resources/hello.test.ts` for the pattern:

```ts
const post = vi.fn().mockResolvedValue({ /* expected response */ });
const http = mockHttp({ post });
const resource = myResource(http);
await resource.create({ ... });
expect(post).toHaveBeenCalledWith("/my-route", { ... });
```

## Before you finish

- `pnpm check` must pass (typecheck + lint + format + test).
- If you added a new package, add its scripts to match the others (`dev`, `build`, `lint`, `typecheck`, `test`).
- Update `docs/ARCHITECTURE.md` if you change the dependency graph.
