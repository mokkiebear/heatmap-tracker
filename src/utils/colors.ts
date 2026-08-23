import { ColorScheme, ColorsList, Entry, Palettes } from "src/types";

function isEmpty<T>(array?: T[]): boolean {
  return !array || array.length === 0;
}

/** Last-resort ramp, used only when the settings hold no usable palette at all. */
const FALLBACK_COLORS: ColorsList = [
  "#c6e48b",
  "#7bc96f",
  "#49af5d",
  "#2e8840",
  "#196127",
];

/**
 * The colors to paint the heatmap with, in order of preference: the tracker's
 * own `customColors`, its named palette, the `default` palette, then any other
 * palette that still has colors in it.
 *
 * Every step can come up empty — the settings UI lets a user remove a palette
 * or strip all the colors out of one — and returning nothing here used to crash
 * the heatmap on the first `colorsList.length`, hence the final fallback.
 */
export function getColors(
  colorScheme: ColorScheme,
  settingsColors: Palettes,
): ColorsList {
  const { paletteName, customColors } = colorScheme ?? {};

  const candidates: (ColorsList | undefined)[] = [
    customColors,
    paletteName ? settingsColors?.[paletteName] : undefined,
    settingsColors?.["default"],
    ...Object.values(settingsColors ?? {}),
  ];

  return candidates.find((colors) => !isEmpty(colors)) ?? FALLBACK_COLORS;
}

/**
 * The color a day should be painted: its own `customColor` if it has one,
 * otherwise the palette color for its mapped intensity (1-based).
 */
export function getEntryColor(
  entry: Entry,
  colorsList: ColorsList,
): string | undefined {
  if (entry.customColor) {
    return entry.customColor;
  }

  return entry.intensity !== undefined
    ? colorsList[entry.intensity - 1]
    : undefined;
}
