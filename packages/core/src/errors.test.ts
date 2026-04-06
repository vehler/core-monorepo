import { describe, it, expect } from "vitest";
import { ERROR_CODES, type ApiErrorEnvelope } from "./errors";

describe("ERROR_CODES", () => {
  it("every value is a non-empty string", () => {
    for (const value of Object.values(ERROR_CODES)) {
      expect(typeof value).toBe("string");
      expect(value.length).toBeGreaterThan(0);
    }
  });

  it("contains all expected keys", () => {
    expect(ERROR_CODES.UNKNOWN).toBe("UNKNOWN");
    expect(ERROR_CODES.VALIDATION).toBe("VALIDATION");
    expect(ERROR_CODES.NOT_FOUND).toBe("NOT_FOUND");
    expect(ERROR_CODES.UNAUTHORIZED).toBe("UNAUTHORIZED");
    expect(ERROR_CODES.FORBIDDEN).toBe("FORBIDDEN");
    expect(ERROR_CODES.RATE_LIMITED).toBe("RATE_LIMITED");
  });
});

describe("ApiErrorEnvelope", () => {
  it("satisfies the expected shape with required fields", () => {
    const envelope = {
      error: {
        code: "NOT_FOUND",
        message: "Resource not found",
      },
    } satisfies ApiErrorEnvelope;

    expect(envelope.error.code).toBe("NOT_FOUND");
    expect(envelope.error.message).toBe("Resource not found");
    expect(envelope.error.details).toBeUndefined();
  });

  it("satisfies the expected shape with optional details", () => {
    const envelope = {
      error: {
        code: "VALIDATION",
        message: "Invalid request",
        details: { fields: [{ path: "name", message: "Required" }] },
      },
    } satisfies ApiErrorEnvelope;

    expect(envelope.error.details).toBeDefined();
    expect(envelope.error.details?.fields).toHaveLength(1);
  });
});
