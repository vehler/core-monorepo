# Decisions

Append-only log of architectural choices. Format: date, decision, alternatives, why.

## 2026-04-05 — Split API from UI via an SDK package

**Decision:** API is a standalone Hono app. All UIs consume a typed `@core/sdk` package, never the API directly.

**Alternatives considered:**

- Next.js route handlers for everything (rejected: couples API to web, blocks mobile)
- tRPC (rejected: great for JS-only shops; SDK pattern works for any client, including Swift/Kotlin via generated OpenAPI later)
- GraphQL (rejected: overkill for what's usually small REST surfaces)

**Why:** Matches Nora's architecture. Adding a mobile app should mean "pnpm add @core/sdk" in a new Expo workspace, not "port the API client." Types flow from `@core/core` → both sides, so breakage is caught at compile time.

## 2026-04-05 — pnpm workspaces, no Turborepo

**Decision:** Plain pnpm recursive scripts (`pnpm -r run ...`).

**Alternatives:** Turborepo, Nx.

**Why:** 2-4 packages don't need a build graph. `pnpm -r` is fine until builds hurt — revisit when `pnpm build` exceeds 60s.

## 2026-04-05 — `@core/core` is framework-free

**Decision:** The shared package has no runtime deps except Zod. No React, no Node built-ins.

**Why:** It runs in three places (API, web server, RN bundle). One framework import and mobile consumers break in weird ways.

---

## Template: your next decision

**Decision:**

**Alternatives considered:**

**Why:**
