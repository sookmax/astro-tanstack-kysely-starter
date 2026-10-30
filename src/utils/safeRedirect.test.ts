import { describe, expect, it } from "vitest";
import { safeRedirect } from "./safeRedirect";

describe("safeRedirect", () => {
  it("keeps same-origin paths with their search and hash", () => {
    expect(safeRedirect("/new")).toBe("/new");
    expect(safeRedirect("/entries/1?x=1#top")).toBe("/entries/1?x=1#top");
  });

  it("falls back for missing or non-path targets", () => {
    expect(safeRedirect(null)).toBe("/");
    expect(safeRedirect("")).toBe("/");
    expect(safeRedirect("new")).toBe("/");
    expect(safeRedirect("https://evil.com")).toBe("/");
  });

  it("rejects protocol-relative tricks the URL parser normalizes", () => {
    expect(safeRedirect("//evil.com")).toBe("/");
    expect(safeRedirect("/\\evil.com")).toBe("/");
    expect(safeRedirect("/\t/evil.com")).toBe("/");
  });

  it("uses the given fallback", () => {
    expect(safeRedirect("//evil.com", "/me")).toBe("/me");
  });
});
