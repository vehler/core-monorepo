import { describe, it, expect } from "vitest";
import { Hono } from "hono";
import { z } from "zod";
import { validate } from "./validate";
import { errorHandler } from "./error-handler";

const TestSchema = z.object({
  name: z.string().min(1, "Name is required"),
  age: z.number().int().positive().optional(),
});

function makeApp() {
  const app = new Hono();
  app.post("/resource", validate("json", TestSchema), (c) =>
    c.json({ received: c.req.valid("json") }),
  );
  app.onError(errorHandler);
  return app;
}

describe("validate middleware", () => {
  it("passes valid input through to the handler", async () => {
    const app = makeApp();
    const res = await app.request("/resource", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name: "Ada", age: 30 }),
    });
    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body.received).toEqual({ name: "Ada", age: 30 });
  });

  it("returns 400 for invalid input", async () => {
    const app = makeApp();
    const res = await app.request("/resource", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name: "" }),
    });
    expect(res.status).toBe(400);
  });

  it("returns VALIDATION error code", async () => {
    const app = makeApp();
    const res = await app.request("/resource", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name: "" }),
    });
    const body = await res.json();
    expect(body.error.code).toBe("VALIDATION");
    expect(body.error.message).toBe("Invalid request");
  });

  it("includes fields array with path and message", async () => {
    const app = makeApp();
    const res = await app.request("/resource", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name: "" }),
    });
    const body = await res.json();
    const fields: { path: string; message: string }[] = body.error.details.fields;
    expect(fields).toBeInstanceOf(Array);
    expect(fields.length).toBeGreaterThan(0);
    expect(fields[0]).toHaveProperty("path");
    expect(fields[0]).toHaveProperty("message");
  });

  it("reports correct field path for nested invalid field", async () => {
    const NestedSchema = z.object({
      user: z.object({ email: z.string().email("Invalid email") }),
    });
    const app = new Hono();
    app.post("/nested", validate("json", NestedSchema), (c) => c.json({}));
    app.onError(errorHandler);

    const res = await app.request("/nested", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ user: { email: "bad" } }),
    });
    const body = await res.json();
    expect(body.error.details.fields[0].path).toBe("user.email");
    expect(body.error.details.fields[0].message).toBe("Invalid email");
  });
});
