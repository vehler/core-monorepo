import { describe, it, expect } from "vitest";
import { HelloRequestSchema } from "./hello";

describe("HelloRequestSchema", () => {
  it("accepts a valid name", () => {
    expect(HelloRequestSchema.parse({ name: "Ada" })).toEqual({ name: "Ada" });
  });

  it("rejects empty names", () => {
    expect(() => HelloRequestSchema.parse({ name: "" })).toThrow();
  });

  it("rejects names over 100 characters", () => {
    expect(() => HelloRequestSchema.parse({ name: "a".repeat(101) })).toThrow();
  });
});
