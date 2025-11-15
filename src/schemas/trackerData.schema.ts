import z from "zod";

import { EntrySchema } from "./entry.schema";
import { IntensityConfigSchema } from "./intensityConfig.schema";
import { InsightSchema } from "./insight.schema";
import { ColorSchemeSchema } from "./colorScheme.schema";

export const TrackerDataSchema = z.strictObject({
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
  heatmapTitle: z.string().optional(),
  heatmapSubtitle: z.string().optional(),
  insights: z.array(InsightSchema),
});
