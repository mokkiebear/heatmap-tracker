import z from "zod";

export const FilterConditionSchema = z.strictObject({
  /** Frontmatter key to read from the page. */
  property: z.string(),
  operator: z.enum(["equals", "contains", "notEmpty"]),
  /** Ignored (and not required) when operator is "notEmpty". */
  value: z.string().optional(),
});
