import { createHttpClient } from "./http";
import type { ClientConfig } from "./types";
import { helloResource } from "./resources/hello";
import { meResource } from "./resources/me";

/**
 * Create a typed client for the API.
 * Use this from web, mobile, CLI, or any other consumer.
 *
 * @example
 * const api = createClient({ baseUrl: "http://localhost:4000" });
 * const me = await api.me.get();
 * const greeting = await api.hello.greet({ name: me.name ?? "stranger" });
 */
export function createClient(config: ClientConfig) {
  const http = createHttpClient(config);
  return {
    http,
    hello: helloResource(http),
    me: meResource(http),
  };
}

export type Client = ReturnType<typeof createClient>;

export { ApiError } from "./http";
export type { HttpClient } from "./http";
export type { ClientConfig } from "./types";

// Re-export types from @core/core so consumers can import everything from the SDK.
export type {
  HelloRequest,
  HelloResponse,
  UserResponse,
  ApiErrorEnvelope,
  ErrorCode,
} from "@core/core";
