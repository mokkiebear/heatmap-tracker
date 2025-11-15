import z from "zod";

export const NumberLike = z.preprocess((val: number | undefined) => {
  const num = Number(val);
  return Number.isNaN(num) ? val : num;
}, z.number());
