import { serve } from "@hono/node-server";
import { Hono } from "hono";
import { cors } from "hono/cors";
import { logger } from "hono/logger";
import { config, getTrustedOrigins } from "./config";
import { errorHandler } from "./middleware/error-handler";
import { authRateLimit, generalRateLimit } from "./middleware/rate-limit";
import { helloRoute } from "./routes/hello";
import { authRoutes } from "./routes/auth";
import { meRoute } from "./routes/me";

const app = new Hono();

// ─── Global middleware ───────────────────────────────────────────────────────

app.use("*", logger());

const trusted = new Set(getTrustedOrigins());
app.use(
  "*",
  cors({
    origin: (origin) => (trusted.has(origin) ? origin : ""),
    credentials: true,
    allowHeaders: ["Content-Type", "Authorization"],
    allowMethods: ["GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"],
  }),
);

app.use("/api/auth/*", authRateLimit);
app.use("*", generalRateLimit);

// ─── Routes ──────────────────────────────────────────────────────────────────

app.get("/health", (c) => c.json({ ok: true }));
app.route("/api/auth", authRoutes);
app.route("/hello", helloRoute);
app.route("/me", meRoute);

app.onError(errorHandler);

// ─── Server ──────────────────────────────────────────────────────────────────

serve({ fetch: app.fetch, port: config.port }, (info) => {
  console.log(`API listening on http://localhost:${info.port}`);
});

export type App = typeof app;
