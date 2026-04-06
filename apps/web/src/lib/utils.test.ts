import { describe, it, expect } from "vitest";
import { cn } from "./utils";

describe("cn()", () => {
  it("returns an empty string with no arguments", () => {
    expect(cn()).toBe("");
  });

  it("returns a single class unchanged", () => {
    expect(cn("flex")).toBe("flex");
  });

  it("merges multiple class strings", () => {
    expect(cn("flex", "items-center", "gap-4")).toBe("flex items-center gap-4");
  });

  it("filters out falsy values", () => {
    expect(cn("flex", false && "hidden", null, undefined, "gap-4")).toBe("flex gap-4");
  });

  it("handles conditional class objects", () => {
    expect(cn({ flex: true, hidden: false, "items-center": true })).toBe("flex items-center");
  });

  it("resolves Tailwind padding conflicts — last one wins", () => {
    expect(cn("p-4", "p-8")).toBe("p-8");
  });

  it("resolves Tailwind text color conflicts — last one wins", () => {
    expect(cn("text-red-500", "text-blue-500")).toBe("text-blue-500");
  });

  it("resolves directional padding conflicts correctly", () => {
    // px-4 sets horizontal padding; later p-8 should override both
    expect(cn("px-4", "p-8")).toBe("p-8");
  });

  it("handles arrays of class values", () => {
    expect(cn(["flex", "gap-2"], "mt-4")).toBe("flex gap-2 mt-4");
  });
});
