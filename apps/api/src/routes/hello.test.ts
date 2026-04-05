import { describe, it, expect } from "vitest";
import { Hono } from "hono";
import { helloRoute } from "./hello";
import { errorHandler } from "../middleware/error-handler";

function makeApp() {
  const app = new Hono();
  app.route("/hello", helloRoute);
  app.onError(errorHandler);
  return app;
}

describe("POST /hello", () => {
  it("returns a greeting for a valid name", async () => {
    const app = makeApp();
    const res = await app.request("/hello", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name: "Ada" }),
    });
    expect(res.status).toBe(200);
    const body = (await res.json()) as { message: string; greetedAt: string };
    expect(body.message).toBe("Hello, Ada!");
    expect(body.greetedAt).toMatch(/\d{4}-\d{2}-\d{2}T/);
  });

  it("returns 400 for invalid input", async () => {
    const app = makeApp();
    const res = await app.request("/hello", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name: "" }),
    });
    expect(res.status).toBe(400);
  });
});
