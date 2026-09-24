import * as z from "zod";

export const IntensityConfigSchema = z.strictObject({
  scaleStart: z.number().or(z.undefined()),
  scaleEnd: z.number().or(z.undefined()),
  defaultIntensity: z.number(),
  showOutOfRange: z.boolean(),
  excludeFalsy: z.boolean().or(z.undefined()),
  /**
   * How a day's value is built when several values feed into it — several
   * tracked properties in one note, or several entries on the same date.
   * "sum" (default) adds them up; "average" divides by how many were actually
   * present, so a day with only a morning rating is scored on that rating
   * instead of looking like a half-empty day.
   */
  aggregation: z.enum(["sum", "average"]).optional(),
});
