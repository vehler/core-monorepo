import { createAuthClient } from "better-auth/react";

/**
 * Create a BetterAuth client for a React app.
 *
 * Usage (web):
 *   export const authClient = createClient({ baseURL: process.env.NEXT_PUBLIC_API_URL! });
 *   const { signIn, signUp, signOut, useSession } = authClient;
 *
 * Usage (React Native / Expo):
 *   Same call — BetterAuth detects the environment and uses Bearer tokens automatically
 *   when cookies aren't available.
 *
 * Add client plugins here as you add server plugins:
 *   - organizationClient() for @core/auth server `organization()`
 *   - twoFactorClient() for two-factor
 */
export function createClient(config: { baseURL: string }) {
  return createAuthClient({
    baseURL: config.baseURL,
    // plugins: [organizationClient()],
  });
}

export type AuthClient = ReturnType<typeof createClient>;
