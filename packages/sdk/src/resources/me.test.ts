import { describe, it, expect, vi } from "vitest";
import { meResource } from "./me";
import { mockHttp } from "../../tests/mock-http";

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
