import { zValidator } from "@hono/zod-validator";
import type { ZodSchema } from "zod";
import { HttpError } from "../errors";
import { ERROR_CODES } from "@core/core";

/**
 * Wraps @hono/zod-validator so validation failures flow through our
 * canonical error handler, producing the ApiErrorEnvelope shape that
 * @core/sdk parses into ApiError.
 */
export function validate<T extends ZodSchema>(
  target: "json" | "query" | "param" | "header" | "form",
  schema: T,
) {
  return zValidator(target, schema, (result) => {
    if (!result.success) {
      const fields = result.error.issues.map((i) => ({
        path: i.path.join("."),
        message: i.message,
      }));
      throw new HttpError(400, ERROR_CODES.VALIDATION, "Invalid request", { fields });
    }
  });
}
