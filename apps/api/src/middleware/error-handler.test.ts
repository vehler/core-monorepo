import { describe, it, expect } from "vitest";
import { Hono } from "hono";
import { z } from "zod";
import { errorHandler } from "./error-handler";
import { HttpError } from "../errors";

function makeApp(throwFn: () => unknown) {
  const app = new Hono();
  app.get("/test", () => {
    throwFn();
    // Should never reach here, but satisfies return type
    throw new Error("unreachable");
  });
  app.onError(errorHandler);
  return app;
}

describe("errorHandler", () => {
  describe("HttpError", () => {
    it("returns the correct status code", async () => {
      const app = makeApp(() => {
        throw new HttpError(404, "NOT_FOUND", "Resource not found");
      });
      const res = await app.request("/test");
      expect(res.status).toBe(404);
    });

    it("returns envelope with code and message", async () => {
      const app = makeApp(() => {
        throw new HttpError(403, "FORBIDDEN", "Access denied");
      });
      const res = await app.request("/test");
      const body = await res.json();
      expect(body.error.code).toBe("FORBIDDEN");
      expect(body.error.message).toBe("Access denied");
    });

    it("includes details when provided", async () => {
      const app = makeApp(() => {
        throw new HttpError(400, "VALIDATION", "Bad input", { fields: ["name"] });
      });
      const res = await app.request("/test");
      const body = await res.json();
      expect(body.error.details).toEqual({ fields: ["name"] });
    });
  });

  describe("ZodError", () => {
    it("returns 400 status", async () => {
      const app = makeApp(() => {
        const result = z.object({ name: z.string().min(1) }).safeParse({ name: "" });
        if (!result.success) throw result.error;
      });
      const res = await app.request("/test");
      expect(res.status).toBe(400);
    });

    it("returns VALIDATION code with sanitized fields", async () => {
      const app = makeApp(() => {
        const result = z.object({ name: z.string().min(1) }).safeParse({ name: "" });
        if (!result.success) throw result.error;
      });
      const res = await app.request("/test");
      const body = await res.json();
      expect(body.error.code).toBe("VALIDATION");
      expect(body.error.details.fields).toBeInstanceOf(Array);
      const field = body.error.details.fields[0];
      // Only path + message, no raw Zod internals
      expect(field).toHaveProperty("path");
      expect(field).toHaveProperty("message");
      expect(field).not.toHaveProperty("code");
      expect(field).not.toHaveProperty("received");
    });

    it("exposes nested field path as dot-separated string", async () => {
      const app = makeApp(() => {
        const result = z
          .object({ user: z.object({ email: z.string().email() }) })
          .safeParse({ user: { email: "not-an-email" } });
        if (!result.success) throw result.error;
      });
      const res = await app.request("/test");
      const body = await res.json();
      expect(body.error.details.fields[0].path).toBe("user.email");
    });
  });

  describe("unknown Error", () => {
    it("returns 500 status", async () => {
      const app = makeApp(() => {
        throw new Error("something unexpected");
      });
      const res = await app.request("/test");
      expect(res.status).toBe(500);
    });

    it("returns UNKNOWN code with generic message", async () => {
      const app = makeApp(() => {
        throw new Error("database exploded");
      });
      const res = await app.request("/test");
      const body = await res.json();
      expect(body.error.code).toBe("UNKNOWN");
      expect(body.error.message).toBe("Internal server error");
    });

    it("does not leak the original error message or stack trace", async () => {
      const app = makeApp(() => {
        throw new Error("secret internal detail");
      });
      const res = await app.request("/test");
      const text = await res.text();
      expect(text).not.toContain("secret internal detail");
      expect(text).not.toContain("stack");
    });
  });
});
