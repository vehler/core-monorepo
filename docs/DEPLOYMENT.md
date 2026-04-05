# Deployment

Two apps, deployed independently. That's the point of splitting them.

## apps/api

**Defaults:** Node 20, Hono, listens on `API_PORT` (default 4000).

**Options:**

- **Fly.io / Railway / Render** — `pnpm --filter @core/api build && pnpm --filter @core/api start`. Add a `Dockerfile` when you need it.
- **Cloudflare Workers** — swap `@hono/node-server` for the Workers adapter in `apps/api/src/index.ts`. Hono is runtime-agnostic.
- **AWS Lambda** — use `@hono/aws-lambda`.

**Required env:**

- `API_PORT`
- `WEB_ORIGIN` — for CORS
- Whatever secrets your data layer needs

## apps/web

**Default:** Vercel. Next.js 14 App Router.

1. Point Vercel at the repo, set root to `apps/web`.
2. Install command: `cd ../.. && pnpm install --frozen-lockfile`
3. Build command: `cd ../.. && pnpm --filter @core/web build`
4. Output directory: `apps/web/.next`
5. Set `NEXT_PUBLIC_API_URL` to the deployed API URL.

**Alt:** any Node host. `pnpm --filter @core/web build && pnpm --filter @core/web start`.

## Env vars

Every required var is declared in:

- `apps/api` — `process.env.X` reads (validate at startup if strict).
- `apps/web` — `apps/web/src/env.mjs` (t3-env, fails build if missing).

## Preview environments

- Web preview deploys point at a long-lived staging API.
- Or spin up per-branch API previews (Fly.io apps, Railway services) and pass the URL in as a Vercel env var per deployment.

## Monitoring gaps

This template ships no observability. When you add it, put it in `apps/api/src/middleware/` and don't leak it into `@core/core` or `@core/sdk`.
