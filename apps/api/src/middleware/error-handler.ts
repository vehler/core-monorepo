import type { ErrorHandler } from "hono";
import { ZodError } from "zod";
import { ERROR_CODES, type ApiErrorEnvelope } from "@core/core";

export class HttpError extends Error {
  constructor(
    public status: number,
    public code: string,
    message: string,
    public details?: Record<string, unknown>,
  ) {
    super(message);
  }
}

export const errorHandler: ErrorHandler = (err, c) => {
  if (err instanceof HttpError) {
    const envelope: ApiErrorEnvelope = {
      error: { code: err.code, message: err.message, details: err.details },
    };
    return c.json(envelope, err.status as 400 | 401 | 403 | 404 | 429 | 500);
  }

  if (err instanceof ZodError) {
    const envelope: ApiErrorEnvelope = {
      error: {
        code: ERROR_CODES.VALIDATION,
        message: "Invalid request",
        details: { issues: err.issues },
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
