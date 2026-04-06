import { vi } from "vitest";

/**
 * Mock user for testing protected routes.
 *
 * Usage in a test file:
 *
 *   import { mockUser, mockRequireAuth } from "../../tests/helpers/mock-auth";
 *   vi.mock("../../src/middleware/auth", () => mockRequireAuth());
 *
 *   // Now any route using `requireAuth` will see `mockUser` on the context.
 *   // Override per-test:
 *   mockUser.id = "custom-id";
 */
export const mockUser = {
  id: "test-user-id",
  email: "test@example.com",
  name: "Test User",
  image: null as string | null,
  emailVerified: false,
};

/**
 * Returns a vi.mock factory that replaces `requireAuth` with a middleware
 * that injects `mockUser` into the Hono context. `optionalAuth` does the same.
 *
 * Call this at the TOP of your test file (vi.mock is hoisted):
 *
 *   vi.mock("../../src/middleware/auth", () => mockRequireAuth());
 */
export function mockRequireAuth() {
  return {
    requireAuth: vi.fn(
      async (c: { set: (k: string, v: unknown) => void }, next: () => Promise<void>) => {
        c.set("userId", mockUser.id);
        c.set("session", {
          user: mockUser,
          session: { id: "test-session-id" },
        });
        await next();
      },
    ),
    optionalAuth: vi.fn(
      async (c: { set: (k: string, v: unknown) => void }, next: () => Promise<void>) => {
        c.set("userId", mockUser.id);
        c.set("session", {
          user: mockUser,
          session: { id: "test-session-id" },
        });
        await next();
      },
    ),
  };
}

/**
 * Reset mockUser to defaults between tests.
 */
export function resetMockUser() {
  mockUser.id = "test-user-id";
  mockUser.email = "test@example.com";
  mockUser.name = "Test User";
  mockUser.image = null;
  mockUser.emailVerified = false;
}
