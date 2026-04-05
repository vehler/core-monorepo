export type ClientConfig = {
  /** Base URL of the API, e.g. http://localhost:4000 */
  baseUrl: string;
  /** Bearer token for Authorization header */
  authToken?: string;
  /** Cookie header (for server-to-server calls that need to forward auth) */
  cookieHeader?: string;
  /** Optional fetch override (for SSR, tests, or React Native) */
  fetch?: typeof fetch;
};
