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
  content: z.union([z.string(), z.instanceof(HTMLElement)]).optional(),
});
