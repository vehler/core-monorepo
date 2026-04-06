import type { ErrorHandler } from "hono";
import { ZodError } from "zod";
import { ERROR_CODES, type ApiErrorEnvelope } from "@core/core";
import { HttpError } from "../errors";

export const errorHandler: ErrorHandler = (err, c) => {
  if (err instanceof HttpError) {
    const envelope: ApiErrorEnvelope = {
      error: { code: err.code, message: err.message, details: err.details },
    };
    return c.json(envelope, err.status as 400 | 401 | 403 | 404 | 429 | 500);
  }

  if (err instanceof ZodError) {
    // Only expose field paths, not full Zod internals.
    const fields = err.issues.map((i) => ({
      path: i.path.join("."),
      message: i.message,
    }));
    const envelope: ApiErrorEnvelope = {
      error: {
        code: ERROR_CODES.VALIDATION,
        message: "Invalid request",
        details: { fields },
      },
    };
    return c.json(envelope, 400);
  }

  console.error("Unhandled error:", err);
  const envelope: ApiErrorEnvelope = {
    error: { code: ERROR_CODES.UNKNOWN, message: "Internal server error" },
  };
  return c.json(envelope, 500);
};
