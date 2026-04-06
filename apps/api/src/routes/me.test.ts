import { describe, it, expect, vi, beforeEach } from "vitest";
import { Hono } from "hono";
import { mockUser, mockRequireAuth, resetMockUser } from "../../tests/helpers/mock-auth";

// Mock requireAuth BEFORE importing the route (vi.mock is hoisted).
vi.mock("../middleware/auth", () => mockRequireAuth());

import { meRoute } from "./me";
import { errorHandler } from "../middleware/error-handler";

function makeApp() {
  const app = new Hono();
  app.route("/me", meRoute);
  app.onError(errorHandler);
  return app;
}

describe("GET /me (protected)", () => {
  beforeEach(() => resetMockUser());

  it("returns the authenticated user", async () => {
    const app = makeApp();
    const res = await app.request("/me");
    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body).toMatchObject({
      id: "test-user-id",
      email: "test@example.com",
      name: "Test User",
    });
  });

  it("reflects overridden mock user", async () => {
    mockUser.name = "Custom Name";
    mockUser.email = "custom@example.com";
    const app = makeApp();
    const res = await app.request("/me");
    const body = await res.json();
    expect(body.name).toBe("Custom Name");
    expect(body.email).toBe("custom@example.com");
  });
});
