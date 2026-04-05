import { createClient } from "@core/sdk";
import { env } from "@/env";

/**
 * SDK client for the web app. Used from Server Components.
 *
 * For authed requests from Server Components, pass the incoming cookie header:
 *   import { headers } from "next/headers";
 *   const api = apiWithAuth(headers().get("cookie"));
 *   const me = await api.me.get();
 */
export const api = createClient({ baseUrl: env.NEXT_PUBLIC_API_URL });

export function apiWithAuth(cookieHeader: string | null | undefined) {
  return createClient({
    baseUrl: env.NEXT_PUBLIC_API_URL,
    cookieHeader: cookieHeader ?? undefined,
  });
}
