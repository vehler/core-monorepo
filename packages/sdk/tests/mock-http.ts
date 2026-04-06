import { vi } from "vitest";
import type { HttpClient } from "../src/http";

/** Create a mock HttpClient. Override individual methods per-test. */
export function mockHttp(overrides: Partial<HttpClient> = {}): HttpClient {
  return {
    get: vi.fn(),
    post: vi.fn(),
    put: vi.fn(),
    patch: vi.fn(),
    delete: vi.fn(),
    ...overrides,
  };
}
