import { createClient } from "@libsql/client";
import { drizzle } from "drizzle-orm/libsql";
import { fileURLToPath } from "node:url";
import { dirname, resolve } from "node:path";
import * as schema from "./schema";

/**
 * Create a database instance. Injectable for tests and alternate configs.
 *
 * DATABASE_URL examples:
 *   file:/abs/path/to/dev.db                   — local file
 *   libsql://your-db.turso.io?authToken=...    — remote Turso (prod-ready SQLite)
 *
 * Swap to Postgres:
 *   1. pnpm --filter @core/db remove @libsql/client && pnpm --filter @core/db add pg
 *   2. Replace createDb with:
 *        import { drizzle } from "drizzle-orm/node-postgres";
 *        import { Pool } from "pg";
 *        export function createDb(url: string) {
 *          return drizzle(new Pool({ connectionString: url }), { schema });
 *        }
 *   3. Update drizzle.config.ts dialect to "postgresql".
 *   4. Update schema.ts to use pgTable from "drizzle-orm/pg-core".
 *   5. Update @core/auth server.ts: provider: "sqlite" → "pg".
 */
export function createDb(url: string, authToken?: string) {
  const client = createClient({ url, authToken });
  return drizzle(client, { schema });
}

export type Db = ReturnType<typeof createDb>;

// ─── Default singleton ──────────────────────────────────────────────────────

function defaultDbUrl(): string {
  const here = dirname(fileURLToPath(import.meta.url));
  return `file:${resolve(here, "../dev.db")}`;
}

export const db = createDb(
  process.env.DATABASE_URL ?? defaultDbUrl(),
  process.env.DATABASE_AUTH_TOKEN,
);
