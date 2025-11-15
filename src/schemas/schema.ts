import { z } from "zod";

export const ColorsListSchema = z.array(z.string());

export const ColorSchemeSchema = z.object({
  paletteName: z.string().optional(),
  customColors: ColorsListSchema.optional(),
}).strict();

export type ColorScheme = z.infer<typeof ColorSchemeSchema>;

export const PalettesSchema = z.record(z.string(), ColorsListSchema);
export type Palettes = z.infer<typeof PalettesSchema>;

// Insight
export const InsightSchema = z.object({
  name: z.string(),
  calculate: z.any(),
}).strict();

export type Insight = z.infer<typeof InsightSchema>;

// IntensityConfig
export const IntensityConfigSchema = z.object({
  scaleStart: z.number().optional(),        // number | undefined
  scaleEnd: z.number().optional(),
  defaultIntensity: z.number(),
  showOutOfRange: z.boolean(),
}).strict();

export type IntensityConfig = z.infer<typeof IntensityConfigSchema>;

