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
  calculate: z.function({
    input: [z.object({
      yearEntries: z.array(
        z.object({
          date: z.string(),
          intensity: z.number().optional(),
          content: z.string().optional(),
          value: z.number().optional(),
        }).strict()
      ),
    }).strict()],
    output: z.string(),
  }),
}).strict();

export type Insight = z.infer<typeof InsightSchema>;

// IntensityConfig
export const IntensityConfigSchema = z.object({
  scaleStart: z.number().or(z.undefined()),        // number | undefined
  scaleEnd: z.number().or(z.undefined()),
  defaultIntensity: z.number(),
  showOutOfRange: z.boolean(),
}).strict();

export type IntensityConfig = z.infer<typeof IntensityConfigSchema>;

