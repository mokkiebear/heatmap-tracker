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
