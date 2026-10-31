import * as z from "zod";
import { NumberLike } from "./common";

export const EntrySchema = z.strictObject({
  date: z.string(),
  /** Absolute path to the file in the vault (if known). */
  filePath: z.string().optional(),
  /** Custom href for this box; takes precedence over filePath. */
  customHref: z.string().optional(),
  /**
   * This is the mapped intensity.
   * The user set intensity, then I recalculate intensity and write here new intensity. User's value write to `value`.
   */
  intensity: NumberLike.optional(),
  /**
   * Initial user intensity (value).
   */
  value: z.number().optional(),
  customColor: z.string().optional(),
  /**
   * A short glyph rendered inside the day's box instead of a plain color
   * swatch — a habit tracker rather than a gradient ("✅" on days the habit
   * happened, "🏃" for a run). The box still takes its background color from
   * the palette, so intensity and emoji are readable together.
   *
   * Kept to a small number of characters: the box is 12px by default and a
   * longer string is unreadable at that size rather than merely clipped.
   */
  emoji: z.string().max(8).optional(),
  /**
   * How this day is counted in the export summary's day-type breakdown,
   * replacing the default of one whole day toward the legend category its
   * color matches. Keys are category labels, matched case-insensitively
   * against the export legend's labels and its gradient label; values are
   * day counts and may be fractional. A half day of leave that still shows
   * the hours worked: `{ "Workday": 0.5, "Annual Leave": 0.5 }`.
   *
   * Without a non-zero share (`{}`, or every share 0 or missing) the day is
   * counted by its color as usual, so a script can build one up
   * conditionally without dropping ordinary days. A missing value
   * (`{ "Sick Leave": page.sick_leave }` on a note without that property)
   * contributes nothing rather than failing validation. Shares bypass the
   * legend's `countWeight`; entries on the same date add their shares up.
   */
  countAs: z.record(z.string(), NumberLike.optional()).optional(),
  content: z.union([z.string(), z.instanceof(HTMLElement)]).optional(),
});
