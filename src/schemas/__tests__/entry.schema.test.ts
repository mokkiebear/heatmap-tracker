import { EntrySchema } from "../entry.schema";

describe("EntrySchema emoji", () => {
  it("accepts a short glyph", () => {
    for (const emoji of ["✅", "🏃", "x", "✓", "🏋️‍♀️"]) {
      const result = EntrySchema.safeParse({ date: "2024-01-01", emoji });
      expect(result.success).toBe(true);
    }
  });

  it("is optional", () => {
    expect(EntrySchema.safeParse({ date: "2024-01-01" }).success).toBe(true);
  });

  it("rejects a string long enough to be a mistaken `content`", () => {
    // The box is 12px: a sentence here renders as unreadable clipped pixels,
    // so it is refused with a validation message rather than drawn.
    const result = EntrySchema.safeParse({
      date: "2024-01-01",
      emoji: "meditation done today",
    });

    expect(result.success).toBe(false);
  });
});

describe("EntrySchema countAs", () => {
  it("accepts fractional day counts, as numbers or numeric strings", () => {
    const result = EntrySchema.safeParse({
      date: "2024-01-01",
      countAs: { Workday: 0.5, "Annual Leave": "0.5" },
    });

    expect(result.success).toBe(true);
    expect(result.data?.countAs).toEqual({ Workday: 0.5, "Annual Leave": 0.5 });
  });

  it("is optional, and accepts an empty object", () => {
    expect(EntrySchema.safeParse({ date: "2024-01-01" }).success).toBe(true);
    expect(
      EntrySchema.safeParse({ date: "2024-01-01", countAs: {} }).success,
    ).toBe(true);
  });

  it("accepts a missing share, as from a note without that property", () => {
    const result = EntrySchema.safeParse({
      date: "2024-01-01",
      countAs: { "Sick Leave": undefined },
    });

    expect(result.success).toBe(true);
  });

  it("rejects a share that isn't a number, naming the label", () => {
    const result = EntrySchema.safeParse({
      date: "2024-01-01",
      countAs: { "Annual Leave": "half" },
    });

    expect(result.success).toBe(false);
    expect(result.error?.issues[0].path).toEqual(["countAs", "Annual Leave"]);
  });
});
