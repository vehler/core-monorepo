/**
 * Auth response shapes. Kept in @core/core so the API and SDK agree on
 * the wire format, and any UI can render users without depending on BetterAuth.
 */

export type UserResponse = {
  id: string;
  email: string;
  name: string | null;
  image: string | null;
  emailVerified: boolean;
};
