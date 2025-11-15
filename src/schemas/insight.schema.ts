import z from "zod";
import { EntrySchema } from "./entry.schema";

export const InsightSchema = z.strictObject({
  name: z.string(),
  calculate: z.function({
    input: [
      z
        .object({
          yearEntries: z.array(EntrySchema.strict()),
        })
        .strict(),
    ],
    output: z.string(),
  }),
});
