# Contributing

## Setup

```bash
pnpm install
cp .env.example .env.local
pnpm dev
```

## Workflow

1. Branch: `git checkout -b feat/my-thing`
2. Code. Tests live beside source files (`foo.ts` + `foo.test.ts`).
3. `pnpm check` — run the full gate locally.
4. Commit. Pre-commit hook runs `lint-staged` on staged files.
5. Push. Pre-push hook runs `typecheck` across the monorepo.
6. Open a PR. CI runs typecheck, lint, format:check, test, and build.

## Adding a workspace

A new app or package follows the same shape:

1. Create `apps/<name>/` or `packages/<name>/`.
2. `package.json` with `"name": "@core/<name>"`, `"private": true`, and the standard scripts: `dev`, `build`, `lint`, `typecheck`, `test`.
3. `tsconfig.json` that extends `../../tsconfig.json`.
4. Run `pnpm install` at the root — pnpm picks up new workspaces automatically.

## When touching @core/sdk or @core/core

You're changing a shared contract. Expect consumers to break — that's the point. Fix them in the same PR.

## Commit style

Short, imperative, lowercase. Prefix with the workspace if scoped:

```
add /users endpoint to api
sdk: expose ApiError.details
web: show api error codes in toast
```
