import { getColors } from "../colors";

describe("getColors", () => {
  test("should return palette colors in case when paletteName is provided", () => {
    const colorScheme = {
      paletteName: "warm",
    };

    const settingsColors = {
      warm: ["#FF5733", "#FFBD33", "#FF8D1A"],
      default: ["#FFFFFF", "#000000"],
    };

    const colors = getColors(colorScheme, settingsColors);

    expect(colors).toEqual(settingsColors.warm);
  });

  test("should return custom colors in case when customColors is provided", () => {
    const colorScheme = {
      customColors: ["#FF5733", "#FFBD33"],
    };

    const settingsColors = {
      warm: ["#FF5733", "#FFBD33", "#FF8D1A"],
      default: ["#FFFFFF", "#000000"],
    };

    const colors = getColors(colorScheme, settingsColors);

    expect(colors).toEqual(colorScheme.customColors);
  });

  test("should return customColors in case when paletteName and customColors are provided", () => {
    const colorScheme = {
      paletteName: "warm",
      customColors: ["#FF5733", "#FFBD33"],
    };

    const settingsColors = {
      warm: ["#FF5733", "#FFBD33", "#FF8D1A"],
      default: ["#FFFFFF", "#000000"],
    };

    const colors = getColors(colorScheme, settingsColors);

    expect(colors).toEqual(colorScheme.customColors);
  });

  test("should return default palette colors in case when paletteName and customColors are not provided", () => {
    const colorScheme = {};

    const settingsColors = {
      warm: ["#FF5733", "#FFBD33", "#FF8D1A"],
      default: ["#FFFFFF", "#000000"],
    };

    const colors = getColors(colorScheme, settingsColors);

    expect(colors).toEqual(settingsColors.default);
  });
});

describe("getColors palette fallbacks", () => {
  it("falls back to another palette when both the named one and 'default' are gone", () => {
    // Palettes are user-editable in settings; deleting `default` used to make
    // this return `undefined` and crash the heatmap on `colorsList.length`.
    const colors = getColors({ paletteName: "missing" }, { mine: ["#111"] });

    expect(colors).toEqual(["#111"]);
  });

  it("falls back to a built-in ramp when no palette holds any colors", () => {
    const colors = getColors({ paletteName: "missing" }, { default: [] });

    expect(colors.length).toBeGreaterThan(0);
    expect(colors.every((color) => typeof color === "string")).toBe(true);
  });

  it("ignores an empty named palette in favour of default", () => {
    const colors = getColors(
      { paletteName: "empty" },
      { empty: [], default: ["#abc"] },
    );

    expect(colors).toEqual(["#abc"]);
  });
});
