import { Hono } from "hono";
import type { UserResponse } from "@core/core";
import { requireAuth } from "../middleware/auth";

export const meRoute = new Hono();

meRoute.use("*", requireAuth);

meRoute.get("/", (c) => {
  const { user } = c.get("session");
  const response: UserResponse = {
    id: user.id,
    email: user.email,
    name: user.name ?? null,
    image: user.image ?? null,
    emailVerified: user.emailVerified,
  };
  return c.json(response);
});
