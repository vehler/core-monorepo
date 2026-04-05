import { createClient } from "@libsql/client";
import { drizzle } from "drizzle-orm/libsql";
import { fileURLToPath } from "node:url";
import { dirname, resolve } from "node:path";
import * as schema from "./schema";

/**
 * SQLite database client via libSQL (precompiled, no native build needed).
 *
 * DATABASE_URL examples:
 *   file:/abs/path/to/dev.db                   — local file (absolute)
 *   libsql://your-db.turso.io?authToken=...    — remote Turso (prod-ready SQLite)
 *
 * If DATABASE_URL is unset, falls back to `<packages/db>/dev.db` so the file
 * lives with the package regardless of the caller's cwd.
 *
 * Swap to Postgres:
 *   1. pnpm --filter @core/db add pg; pnpm --filter @core/db remove @libsql/client
 *   2. Replace with:
 *        import { drizzle } from "drizzle-orm/node-postgres";
 *        import { Pool } from "pg";
 *        const pool = new Pool({ connectionString: process.env.DATABASE_URL });
 *        export const db = drizzle(pool, { schema });
 *   3. Update drizzle.config.ts dialect to "postgresql".
 *   4. Update schema.ts to use pgTable from "drizzle-orm/pg-core".
 *   5. Update @core/auth server.ts: provider: "sqlite" → "pg".
 */

function defaultDbUrl(): string {
  // src/client.ts → ../dev.db (packages/db/dev.db)
  const here = dirname(fileURLToPath(import.meta.url));
  return `file:${resolve(here, "../dev.db")}`;
}

const url = process.env.DATABASE_URL ?? defaultDbUrl();
const authToken = process.env.DATABASE_AUTH_TOKEN;

const client = createClient({ url, authToken });

export const db = drizzle(client, { schema });
export type Db = typeof db;
