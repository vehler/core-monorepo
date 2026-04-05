import { Hono } from "hono";
import { HelloRequestSchema, type HelloResponse } from "@core/core";
import { validate } from "../middleware/validate";

export const helloRoute = new Hono();

helloRoute.post("/", validate("json", HelloRequestSchema), (c) => {
  const { name } = c.req.valid("json");
  const response: HelloResponse = {
    message: `Hello, ${name}!`,
    greetedAt: new Date().toISOString(),
  };
  return c.json(response);
});
