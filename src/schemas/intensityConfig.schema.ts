import z from "zod";

export const IntensityConfigSchema = z.strictObject({
  scaleStart: z.number().or(z.undefined()),
  scaleEnd: z.number().or(z.undefined()),
  defaultIntensity: z.number(),
  showOutOfRange: z.boolean(),
  excludeFalsy: z.boolean().or(z.undefined()),
});
