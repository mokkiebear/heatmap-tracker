import z from "zod";
import { ColorsListSchema } from "./colorsList.schema";

export const PalettesSchema = z.record(z.string(), ColorsListSchema);
