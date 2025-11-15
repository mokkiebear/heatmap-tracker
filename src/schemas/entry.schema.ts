import { z } from "zod";
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
  content: z.union([
    z.string(),
    z.instanceof(HTMLElement)
  ]).optional(),
});