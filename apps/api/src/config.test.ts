import { describe, it, expect, vi, afterEach } from "vitest";

// We cannot import the top-level `config` object directly in tests because it
// reads env vars at module evaluation time. Instead we re-test the internal
// helper logic by dynamically importing after stubbing the environment.

afterEach(() => {
  vi.unstubAllEnvs();
  vi.resetModules();
});

describe("required() helper", () => {
  it("throws when the env var is absent", async () => {
    vi.stubEnv("BETTER_AUTH_SECRET", "");
    await expect(import("./config")).rejects.toThrow(
      "Missing required env var: BETTER_AUTH_SECRET",
    );
  });

  it("returns the value when the env var is set", async () => {
    vi.stubEnv("BETTER_AUTH_SECRET", "super-secret-value");
    const { config } = await import("./config");
    expect(config.authSecret).toBe("super-secret-value");
  });
});

describe("optional() helper", () => {
  it("returns the fallback when env var is absent", async () => {
    vi.stubEnv("BETTER_AUTH_SECRET", "secret");
    vi.stubEnv("API_PORT", "");
    const { config } = await import("./config");
    expect(config.port).toBe(4000);
  });

  it("returns the env var when it is set", async () => {
    vi.stubEnv("BETTER_AUTH_SECRET", "secret");
    vi.stubEnv("API_PORT", "9000");
    const { config } = await import("./config");
    expect(config.port).toBe(9000);
  });
});

describe("getTrustedOrigins()", () => {
  it("returns webOrigin only when no extras are configured", async () => {
    vi.stubEnv("BETTER_AUTH_SECRET", "secret");
    vi.stubEnv("WEB_ORIGIN", "http://localhost:3000");
    vi.stubEnv("EXTRA_CORS_ORIGINS", "");
    const { getTrustedOrigins } = await import("./config");
    const origins = getTrustedOrigins();
    expect(origins).toContain("http://localhost:3000");
    expect(origins).toHaveLength(1);
  });

  it("combines WEB_ORIGIN and EXTRA_CORS_ORIGINS", async () => {
    vi.stubEnv("BETTER_AUTH_SECRET", "secret");
    vi.stubEnv("WEB_ORIGIN", "https://app.example.com");
    vi.stubEnv("EXTRA_CORS_ORIGINS", "https://admin.example.com,https://mobile.example.com");
    const { getTrustedOrigins } = await import("./config");
    const origins = getTrustedOrigins();
    expect(origins).toEqual([
      "https://app.example.com",
      "https://admin.example.com",
      "https://mobile.example.com",
    ]);
  });

  it("trims whitespace from EXTRA_CORS_ORIGINS entries", async () => {
    vi.stubEnv("BETTER_AUTH_SECRET", "secret");
    vi.stubEnv("WEB_ORIGIN", "https://app.example.com");
    vi.stubEnv("EXTRA_CORS_ORIGINS", " https://a.example.com , https://b.example.com ");
    const { getTrustedOrigins } = await import("./config");
    const origins = getTrustedOrigins();
    expect(origins).toContain("https://a.example.com");
    expect(origins).toContain("https://b.example.com");
  });
});
