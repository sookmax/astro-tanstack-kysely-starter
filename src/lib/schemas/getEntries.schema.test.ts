import { describe, expect, it } from "vitest";
import { GetEntriesSearchParamsSchema } from "./getEntries.schema";

describe("GetEntriesSearchParamsSchema", () => {
  it("coerces query-string values", () => {
    expect(
      GetEntriesSearchParamsSchema.parse({ cursor: "42", limit: "5" }),
    ).toEqual({ cursor: 42, limit: 5 });
  });

  it("leaves absent params undefined", () => {
    expect(GetEntriesSearchParamsSchema.parse({})).toEqual({});
  });

  it("rejects bad values", () => {
    for (const params of [
      { cursor: "abc" },
      { cursor: "0" },
      { limit: "51" },
    ]) {
      expect(GetEntriesSearchParamsSchema.safeParse(params).success).toBe(
        false,
      );
    }
  });
});
