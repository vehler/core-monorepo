#!/usr/bin/env node
/**
 * Initialize the template for a new project.
 *
 * Replaces the @core/* scope throughout the repo with your chosen scope,
 * updates the root project name, sets ports, creates .env.local files,
 * removes the template's git history, and deletes this script.
 *
 * Usage:
 *   node scripts/init.mjs                    # interactive
 *   node scripts/init.mjs --name=my-app --scope=myorg --api-port=4000 --web-port=3000 --yes
 */

import { readFileSync, writeFileSync, readdirSync, statSync, rmSync, existsSync } from "node:fs";
import { join, relative } from "node:path";
import { createInterface } from "node:readline/promises";
import { stdin, stdout, exit, argv, cwd } from "node:process";

const ROOT = cwd();
const SKIP_DIRS = new Set([
  "node_modules",
  ".git",
  ".next",
  "dist",
  "coverage",
  "playwright-report",
  ".pnpm-store",
]);
const TEXT_EXTENSIONS = new Set([
  ".json",
  ".ts",
  ".tsx",
  ".js",
  ".jsx",
  ".mjs",
  ".cjs",
  ".md",
  ".yml",
  ".yaml",
  ".css",
  ".html",
  ".env",
  ".example",
]);

// ────────────────────────────────────────────────────────────────────────────
// Arg parsing

function parseArgs() {
  const out = { yes: false };
  for (const arg of argv.slice(2)) {
    if (arg === "--yes" || arg === "-y") {
      out.yes = true;
      continue;
    }
    const m = arg.match(/^--([^=]+)=(.*)$/);
    if (m) out[m[1]] = m[2];
  }
  return out;
}

// ────────────────────────────────────────────────────────────────────────────
// Prompts

async function prompt(rl, question, fallback) {
  const hint = fallback ? ` (${fallback})` : "";
  const answer = (await rl.question(`${question}${hint}: `)).trim();
  return answer || fallback || "";
}

function validateName(name) {
  if (!/^[a-z0-9][a-z0-9-]*$/.test(name)) {
    throw new Error(
      `Invalid name "${name}". Use lowercase letters, digits, and hyphens; must start with a letter/digit.`,
    );
  }
  return name;
}

function validateScope(scope) {
  const clean = scope.replace(/^@/, "");
  if (!/^[a-z0-9][a-z0-9-]*$/.test(clean)) {
    throw new Error(
      `Invalid scope "${scope}". Use lowercase letters, digits, and hyphens (no leading @).`,
    );
  }
  return clean;
}

function validatePort(port) {
  const n = Number(port);
  if (!Number.isInteger(n) || n < 1 || n > 65535) {
    throw new Error(`Invalid port "${port}". Must be an integer between 1 and 65535.`);
  }
  return String(n);
}

// ────────────────────────────────────────────────────────────────────────────
// File walking & replacement

function* walk(dir) {
  for (const entry of readdirSync(dir)) {
    if (SKIP_DIRS.has(entry)) continue;
    const full = join(dir, entry);
    const st = statSync(full);
    if (st.isDirectory()) {
      yield* walk(full);
    } else if (st.isFile()) {
      yield full;
    }
  }
}

function hasTextExtension(path) {
  const idx = path.lastIndexOf(".");
  if (idx < 0) return false;
  return TEXT_EXTENSIONS.has(path.slice(idx));
}

function replaceInFile(path, replacements) {
  const original = readFileSync(path, "utf8");
  let updated = original;
  for (const [from, to] of replacements) {
    updated = updated.split(from).join(to);
  }
  if (updated !== original) {
    writeFileSync(path, updated);
    return true;
  }
  return false;
}

// ────────────────────────────────────────────────────────────────────────────
// Main

async function main() {
  const args = parseArgs();
  const rl = args.yes ? null : createInterface({ input: stdin, output: stdout });

  console.log("\n» core-monorepo init\n");

  const name = validateName(
    args.name || (rl ? await prompt(rl, "Project name", "my-app") : "my-app"),
  );
  const scope = validateScope(
    args.scope || (rl ? await prompt(rl, "Package scope (no @)", name) : name),
  );
  const apiPort = validatePort(
    args["api-port"] || (rl ? await prompt(rl, "API port", "4000") : "4000"),
  );
  const webPort = validatePort(
    args["web-port"] || (rl ? await prompt(rl, "Web port", "3000") : "3000"),
  );

  if (rl) rl.close();

  console.log("\nConfiguration:");
  console.log(`  project name:  ${name}`);
  console.log(`  package scope: @${scope}/*`);
  console.log(`  api port:      ${apiPort}`);
  console.log(`  web port:      ${webPort}\n`);

  // Scope replacement is the dangerous one — only rewrite `@core/` (with slash)
  // so we don't accidentally touch comments or prose mentioning "core".
  const replacements = [
    ["@core/", `@${scope}/`],
    ['"name": "core-monorepo"', `"name": "${name}"`],
    ["core-monorepo@", `${name}@`],
  ];

  // Port replacements only in env.example files and specific config spots.
  // We avoid a blanket port swap because 3000/4000 might appear in prose.

  let changed = 0;
  for (const file of walk(ROOT)) {
    if (!hasTextExtension(file)) continue;
    if (replaceInFile(file, replacements)) changed++;
  }
  console.log(`Updated scope in ${changed} file${changed === 1 ? "" : "s"}.`);

  // Port rewrites — targeted
  const portReplacements = [
    [".env.example", [["API_PORT=4000", `API_PORT=${apiPort}`], ["http://localhost:4000", `http://localhost:${apiPort}`], ["http://localhost:3000", `http://localhost:${webPort}`]]],
    ["apps/web/.env.example", [["http://localhost:4000", `http://localhost:${apiPort}`]]],
    ["apps/web/package.json", [["--port 3000", `--port ${webPort}`], ["--port 3000", `--port ${webPort}`]]],
    ["apps/api/src/index.ts", [["?? 4000", `?? ${apiPort}`], ['"http://localhost:3000"', `"http://localhost:${webPort}"`]]],
    ["apps/web/src/app/page.tsx", [["port 4000", `port ${apiPort}`]]],
    ["README.md", [["(4000)", `(${apiPort})`], ["(3000)", `(${webPort})`], ["port 4000", `port ${apiPort}`]]],
  ];

  for (const [relPath, pairs] of portReplacements) {
    const full = join(ROOT, relPath);
    if (!existsSync(full)) continue;
    replaceInFile(full, pairs);
  }
  console.log("Updated ports in env examples and configs.");

  // Generate a real BETTER_AUTH_SECRET for this project
  const { randomBytes } = await import("node:crypto");
  const secret = randomBytes(32).toString("base64");

  // Create .env.local from .env.example, injecting the generated secret
  const rootEnv = join(ROOT, ".env.example");
  const rootLocal = join(ROOT, ".env.local");
  if (existsSync(rootEnv) && !existsSync(rootLocal)) {
    const content = readFileSync(rootEnv, "utf8").replace(
      /BETTER_AUTH_SECRET=.*/,
      `BETTER_AUTH_SECRET=${secret}`,
    );
    writeFileSync(rootLocal, content);
    console.log("Created .env.local (with generated BETTER_AUTH_SECRET)");
  }
  const webEnv = join(ROOT, "apps/web/.env.example");
  const webLocal = join(ROOT, "apps/web/.env.local");
  if (existsSync(webEnv) && !existsSync(webLocal)) {
    writeFileSync(webLocal, readFileSync(webEnv, "utf8"));
    console.log("Created apps/web/.env.local");
  }

  // Fresh git init (removes template history)
  const gitDir = join(ROOT, ".git");
  if (existsSync(gitDir)) {
    rmSync(gitDir, { recursive: true, force: true });
    console.log("Removed template git history.");
  }

  // Self-delete
  const thisFile = join(ROOT, "scripts/init.mjs");
  rmSync(thisFile);
  console.log("Removed scripts/init.mjs");

  // Remove scripts/ dir if empty
  try {
    if (readdirSync(join(ROOT, "scripts")).length === 0) {
      rmSync(join(ROOT, "scripts"), { recursive: true, force: true });
    }
  } catch {
    /* dir not empty or gone */
  }

  // Remove init script reference from package.json
  const pkgPath = join(ROOT, "package.json");
  const pkg = JSON.parse(readFileSync(pkgPath, "utf8"));
  if (pkg.scripts?.init) {
    delete pkg.scripts.init;
    writeFileSync(pkgPath, JSON.stringify(pkg, null, 2) + "\n");
  }

  console.log("\n✓ Done. Next steps:");
  console.log("  pnpm install                        # regenerates lockfile with renamed packages");
  console.log("  pnpm format                         # realigns markdown tables shifted by scope rename");
  console.log("  pnpm --filter @" + scope + "/db run db:push   # create SQLite tables");
  console.log("  git init && git add -A && git commit -m 'initial commit'");
  console.log("  pnpm dev\n");
  exit(0);
}

main().catch((err) => {
  console.error("\n✗ init failed:", err.message);
  exit(1);
});
