import z from "zod";
import { ColorsListSchema } from "./colorsList.schema";

export const ColorSchemeSchema = z
  .object({
    paletteName: z.string().optional(),
    customColors: ColorsListSchema.optional(),
  })
  .strict();
