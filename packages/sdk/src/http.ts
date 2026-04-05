import type { ApiErrorEnvelope } from "@core/core";
import type { ClientConfig } from "./types";

export class ApiError extends Error {
  constructor(
    public code: string,
    public status: number,
    message: string,
    public details?: Record<string, unknown>,
  ) {
    super(message);
    this.name = "ApiError";
  }
}

export type HttpClient = {
  get: <T = unknown>(path: string) => Promise<T>;
  post: <T = unknown>(path: string, body?: unknown) => Promise<T>;
  put: <T = unknown>(path: string, body?: unknown) => Promise<T>;
  patch: <T = unknown>(path: string, body?: unknown) => Promise<T>;
  delete: (path: string) => Promise<void>;
};

/** Build a query string from params, omitting undefined values. */
export function buildQueryString(params?: Record<string, unknown>): string {
  if (!params) return "";
  const entries = Object.entries(params).filter(([, v]) => v !== undefined);
  if (entries.length === 0) return "";
  return "?" + entries.map(([k, v]) => `${k}=${encodeURIComponent(String(v))}`).join("&");
}

export function createHttpClient(config: ClientConfig): HttpClient {
  const fetchImpl = config.fetch ?? fetch;

  function buildHeaders(): Headers {
    const headers = new Headers({ "Content-Type": "application/json" });
    if (config.cookieHeader) headers.set("Cookie", config.cookieHeader);
    if (config.authToken) headers.set("Authorization", `Bearer ${config.authToken}`);
    return headers;
  }

  async function request<T>(method: string, path: string, body?: unknown): Promise<T> {
    const res = await fetchImpl(`${config.baseUrl}${path}`, {
      method,
      headers: buildHeaders(),
      credentials: "include",
      cache: "no-store",
      body: body !== undefined ? JSON.stringify(body) : undefined,
    });

    if (!res.ok) {
      let code = "UNKNOWN";
      let message = res.statusText;
      let details: Record<string, unknown> | undefined;
      try {
        const json = (await res.json()) as ApiErrorEnvelope;
        if (json.error) {
          code = json.error.code ?? code;
          message = json.error.message ?? message;
          details = json.error.details;
        }
      } catch {
        // non-JSON error response — use defaults
      }
      throw new ApiError(code, res.status, message, details);
    }

    if (res.status === 204) return undefined as T;
    return res.json() as Promise<T>;
  }

  return {
    get: <T = unknown>(path: string) => request<T>("GET", path),
    post: <T = unknown>(path: string, body?: unknown) => request<T>("POST", path, body),
    put: <T = unknown>(path: string, body?: unknown) => request<T>("PUT", path, body),
    patch: <T = unknown>(path: string, body?: unknown) => request<T>("PATCH", path, body),
    delete: (path: string) => request<void>("DELETE", path),
  };
}
