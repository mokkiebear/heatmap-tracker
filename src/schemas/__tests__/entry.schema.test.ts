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
