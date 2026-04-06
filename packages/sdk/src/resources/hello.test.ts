import { describe, it, expect, vi } from "vitest";
import { helloResource } from "./hello";
import { mockHttp } from "../../tests/mock-http";

describe("helloResource", () => {
  it("calls POST /hello with the input", async () => {
    const post = vi.fn().mockResolvedValue({ message: "Hello, Ada!", greetedAt: "2026-01-01" });
    const http = mockHttp({ post });
    const hello = helloResource(http);

    const result = await hello.greet({ name: "Ada" });

    expect(post).toHaveBeenCalledWith("/hello", { name: "Ada" });
    expect(result.message).toBe("Hello, Ada!");
  });
});
