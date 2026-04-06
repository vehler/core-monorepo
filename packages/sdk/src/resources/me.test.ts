import { describe, it, expect, vi } from "vitest";
import { meResource } from "./me";
import type { HttpClient } from "../http";

function mockHttp(overrides: Partial<HttpClient> = {}): HttpClient {
  return {
    get: vi.fn(),
    post: vi.fn(),
    put: vi.fn(),
    patch: vi.fn(),
    delete: vi.fn(),
    ...overrides,
  };
}

describe("meResource", () => {
  it("calls GET /me", async () => {
    const get = vi.fn().mockResolvedValue({
      id: "abc",
      email: "a@b.com",
      name: "A",
      image: null,
      emailVerified: true,
    });
    const http = mockHttp({ get });
    const me = meResource(http);

    const result = await me.get();

    expect(get).toHaveBeenCalledWith("/me");
    expect(result.email).toBe("a@b.com");
  });
});
