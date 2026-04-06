import { vi } from "vitest";

/**
 * Mock user for testing protected routes.
 *
 * Usage:
 *   vi.mock("../../src/middleware/auth", () => mockRequireAuth());
 *   // Override per-test: mockUser.id = "custom-id";
 *   // Test unauthenticated: mockUser.authenticated = false;
 */
export const mockUser = {
  authenticated: true,
  id: "test-user-id",
  email: "test@example.com",
  name: "Test User",
  image: null as string | null,
  emailVerified: false,
};

/** Inject the mock session into the Hono context. Shared by both auth mocks. */
function injectSession(c: { set: (k: string, v: unknown) => void }) {
  c.set("userId", mockUser.id);
  c.set("session", {
    user: mockUser,
    session: { id: "test-session-id" },
  });
}

/**
 * Factory for vi.mock. Call at the TOP of your test file (vi.mock is hoisted):
 *   vi.mock("../../src/middleware/auth", () => mockRequireAuth());
 */
export function mockRequireAuth() {
  return {
    requireAuth: vi.fn(
      async (c: { set: (k: string, v: unknown) => void }, next: () => Promise<void>) => {
        if (!mockUser.authenticated) {
          // Simulate what the real requireAuth does — return 401 JSON.
          // Hono test context doesn't have c.json, so throw to trigger errorHandler.
          throw Object.assign(new Error("Authentication required"), {
            status: 401,
            code: "UNAUTHORIZED",
          });
        }
        injectSession(c);
        await next();
      },
    ),
    optionalAuth: vi.fn(
      async (c: { set: (k: string, v: unknown) => void }, next: () => Promise<void>) => {
        if (mockUser.authenticated) {
          injectSession(c);
        }
        await next();
      },
    ),
  };
}

/** Reset mockUser to defaults between tests. */
export function resetMockUser() {
  mockUser.authenticated = true;
  mockUser.id = "test-user-id";
  mockUser.email = "test@example.com";
  mockUser.name = "Test User";
  mockUser.image = null;
  mockUser.emailVerified = false;
}
