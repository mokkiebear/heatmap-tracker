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
});
