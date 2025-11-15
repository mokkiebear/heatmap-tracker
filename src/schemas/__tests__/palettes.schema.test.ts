import { z } from "zod";
import { PalettesSchema } from "../palettes.schema";


describe("PalettesSchema", () => {
  it("accepts a valid palettes object", () => {
    const input = {
      primary: ["#ff0000", "#00ff00"],
      secondary: ["#0000ff"],
    };

    const result = PalettesSchema.safeParse(input);

    expect(result.success).toBe(true);

    if (result.success) {
      expect(result.data).toEqual(input);
    }
  });

  it("allows an empty object", () => {
    const input = {};

    const result = PalettesSchema.safeParse(input);

    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data).toEqual({});
    }
  });

  it("rejects non-object values", () => {
    const result = PalettesSchema.safeParse("not-an-object" as any);

    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.error).toBeInstanceOf(z.ZodError);
    }
  });

  it("rejects when a palette value is not an array", () => {
    const input = {
      primary: ["#ff0000"],
      secondary: "#00ff00" as any, // ❌ не массив
    };

    const result = PalettesSchema.safeParse(input);

    expect(result.success).toBe(false);
    if (!result.success) {
      // ошибка должна быть на ключе "secondary"
      expect(result.error.issues[0].path).toEqual(["secondary"]);
    }
  });

  it("rejects when a palette contains non-string elements", () => {
    const input = {
      primary: ["#ff0000", 123 as any], // ❌ число внутри массива
    };

    const result = PalettesSchema.safeParse(input);

    expect(result.success).toBe(false);
    if (!result.success) {
      // путь до ошибки: ["primary", 1]
      expect(result.error.issues[0].path).toEqual(["primary", 1]);
      expect(result.error.issues[0].code).toBe("invalid_type");
    }
  });

  it("throws ZodError when using parse with invalid data", () => {
    const input = {
      primary: "not-an-array" as any,
    };

    expect(() => PalettesSchema.parse(input)).toThrow(z.ZodError);
  });
});
