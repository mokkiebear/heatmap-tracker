import z from "zod";

import { EntrySchema } from "./entry.schema";
import { IntensityConfigSchema } from "./intensityConfig.schema";
import { InsightSchema } from "./insight.schema";
import { ColorSchemeSchema } from "./colorScheme.schema";
import { UISchema } from "./ui.schema";

// TODO: change to strict when I know how to handle `property` and `path`.
// Issue: https://github.com/mokkiebear/heatmap-tracker/issues/64
export const TrackerDataSchema = z.object({
  year: z.number(),
  colorScheme: ColorSchemeSchema,
  entries: z.array(EntrySchema),
  showCurrentDayBorder: z.boolean(),
  /** Base folder used to collect entries (if applicable). */
  basePath: z.string().optional(),

  /**
   * @deprecated The default intensity value for an entry.
   */
  defaultEntryIntensity: z.number(),
  /**
   * @deprecated The starting value for the intensity scale.
   */
  intensityScaleStart: z.number().optional(),
  /**
   * @deprecated The ending value for the intensity scale.
   */
  intensityScaleEnd: z.number().optional(),

  intensityConfig: IntensityConfigSchema,
  separateMonths: z.boolean().optional(),
  heatmapTitle: z.string().or(z.number()).optional(),
  heatmapSubtitle: z.string().or(z.number()).optional(),
  insights: z.array(InsightSchema),
  /**
   * Disables the creation of a new file when clicking on a heatmap box that doesn't have a corresponding file.
   */
  disableFileCreation: z.boolean().optional(),
  ui: UISchema.optional(),

  /**
   * Layout mode for the heatmap.
   * "default" — traditional week-column grid (GitHub-style)
   * "monthly" — one row per month, days 1–31 as columns
   */
  layout: z.enum(["default", "monthly"]).optional(),
  /**
   * First date to display (format: YYYY-MM-DD). Used for partial year views.
   */
  startDate: z.string().optional(),
  /**
   * Last date to display (format: YYYY-MM-DD). Used for partial year views.
   */
  endDate: z.string().optional(),
  /**
   * Show last N days from today. Alternative to startDate/endDate.
   * Takes precedence over startDate/endDate if both are provided.
   */
  daysToShow: z.number().optional(),
  /**
   * Show the current month plus the N previous months.
   * e.g. monthsToShow: 3 shows current month + 3 prior = 4 rows.
   * Takes precedence over daysToShow and startDate/endDate.
   */
  monthsToShow: z.number().optional(),
});
