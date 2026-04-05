import { describe, it, expect, vi } from "vitest";
import { createHttpClient, ApiError } from "./http";

describe("createHttpClient", () => {
  it("parses JSON success responses", async () => {
    const mockFetch = vi.fn().mockResolvedValue(
      new Response(JSON.stringify({ ok: true }), {
        status: 200,
        headers: { "Content-Type": "application/json" },
      }),
    );
    const http = createHttpClient({ baseUrl: "http://api.test", fetch: mockFetch });
    const result = await http.get<{ ok: boolean }>("/ping");
    expect(result).toEqual({ ok: true });
  });

  it("throws ApiError with code + message from error envelope", async () => {
    const mockFetch = vi
      .fn()
      .mockResolvedValue(
        new Response(
          JSON.stringify({ error: { code: "NOT_FOUND", message: "Missing resource" } }),
          { status: 404, headers: { "Content-Type": "application/json" } },
        ),
      );
    const http = createHttpClient({ baseUrl: "http://api.test", fetch: mockFetch });
    await expect(http.get("/missing")).rejects.toMatchObject({
      name: "ApiError",
      code: "NOT_FOUND",
      status: 404,
      message: "Missing resource",
    });
  });

  it("falls back to UNKNOWN code when error body is not JSON", async () => {
    const mockFetch = vi
      .fn()
      .mockResolvedValue(new Response("oops", { status: 500, statusText: "Server Error" }));
    const http = createHttpClient({ baseUrl: "http://api.test", fetch: mockFetch });
    try {
      await http.get("/boom");
      expect.fail("should have thrown");
    } catch (err) {
      expect(err).toBeInstanceOf(ApiError);
      expect((err as ApiError).code).toBe("UNKNOWN");
    }
  });

  it("sets auth and cookie headers", async () => {
    const mockFetch = vi.fn().mockResolvedValue(new Response(null, { status: 204 }));
    const http = createHttpClient({
      baseUrl: "http://api.test",
      authToken: "abc",
      cookieHeader: "session=xyz",
      fetch: mockFetch,
    });
    await http.delete("/thing/1");
    const [, init] = mockFetch.mock.calls[0];
    const headers = init.headers as Headers;
    expect(headers.get("Authorization")).toBe("Bearer abc");
    expect(headers.get("Cookie")).toBe("session=xyz");
  });
});
