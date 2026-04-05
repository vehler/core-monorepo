/**
 * Canonical error envelope returned by the API.
 * The SDK parses this shape and throws a typed error.
 */
export type ApiErrorEnvelope = {
  error: {
    code: string;
    message: string;
    details?: Record<string, unknown>;
  };
};

export const ERROR_CODES = {
  UNKNOWN: "UNKNOWN",
  VALIDATION: "VALIDATION",
  NOT_FOUND: "NOT_FOUND",
  UNAUTHORIZED: "UNAUTHORIZED",
  FORBIDDEN: "FORBIDDEN",
  RATE_LIMITED: "RATE_LIMITED",
} as const;

export type ErrorCode = (typeof ERROR_CODES)[keyof typeof ERROR_CODES];
