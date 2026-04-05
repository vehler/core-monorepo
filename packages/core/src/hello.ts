import { z } from "zod";

/**
 * Example domain: "hello". Replace with real resources as the app grows.
 * Each domain exports:
 *  - a Zod schema for request validation (used by API)
 *  - a TypeScript type for responses (used by API and SDK)
 */

export const HelloRequestSchema = z.object({
  name: z.string().min(1).max(100),
});
export type HelloRequest = z.infer<typeof HelloRequestSchema>;

export type HelloResponse = {
  message: string;
  greetedAt: string; // ISO timestamp
};
