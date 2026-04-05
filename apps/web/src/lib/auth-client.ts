"use client";

import { createClient } from "@core/auth/client";
import { env } from "@/env";

export const authClient = createClient({ baseURL: env.NEXT_PUBLIC_API_URL });

export const { signIn, signUp, signOut, useSession, getSession } = authClient;
