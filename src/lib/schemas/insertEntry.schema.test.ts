import { describe, expect, it } from "vitest";
import { InsertEntryBodySchema } from "./insertEntry.schema";
import { ENTRY_BODY_MAX_LENGTH } from "@/constants";

describe("InsertEntryBodySchema", () => {
  it("trims, and enforces the shared length limit", () => {
    expect(InsertEntryBodySchema.parse({ body: "  hi  " })).toEqual({
      body: "hi",
    });
    expect(InsertEntryBodySchema.safeParse({ body: "   " }).success).toBe(
      false,
    );
    expect(
      InsertEntryBodySchema.safeParse({
        body: "x".repeat(ENTRY_BODY_MAX_LENGTH + 1),
      }).success,
    ).toBe(false);
  });
});
