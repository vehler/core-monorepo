import { serve } from "@hono/node-server";
import { Hono } from "hono";
import { cors } from "hono/cors";
import { logger } from "hono/logger";
import { errorHandler } from "./middleware/error-handler";
import { authRateLimit, generalRateLimit } from "./middleware/rate-limit";
import { helloRoute } from "./routes/hello";
import { authRoutes } from "./routes/auth";
import { meRoute } from "./routes/me";

const app = new Hono();

// ─── Global middleware ───────────────────────────────────────────────────────

app.use("*", logger());

// CORS: only allow credentials for trusted origins.
const trustedOrigins = new Set(
  [
    process.env.WEB_ORIGIN ?? "http://localhost:3000",
    ...(process.env.EXTRA_CORS_ORIGINS?.split(",").map((s) => s.trim()) ?? []),
  ].filter(Boolean),
);

app.use(
  "*",
  cors({
    origin: (origin) => (trustedOrigins.has(origin) ? origin : ""),
    credentials: true,
    allowHeaders: ["Content-Type", "Authorization"],
    allowMethods: ["GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"],
  }),
);

// Rate limiting: stricter on auth, lighter on general API.
app.use("/api/auth/*", authRateLimit);
app.use("*", generalRateLimit);

// ─── Routes ──────────────────────────────────────────────────────────────────

app.get("/health", (c) => c.json({ ok: true }));
app.route("/api/auth", authRoutes);
app.route("/hello", helloRoute);
app.route("/me", meRoute);

app.onError(errorHandler);

// ─── Server ──────────────────────────────────────────────────────────────────

const port = Number(process.env.API_PORT ?? 4000);
serve({ fetch: app.fetch, port }, (info) => {
  console.log(`API listening on http://localhost:${info.port}`);
});

export type App = typeof app;
