import { ColorScheme, ColorsList, Palettes } from "src/types";
import { isEmpty } from "./core";

/**
 * Retrieves the color scheme for the tracker data based on the provided settings.
 *
 * @param trackerData - The data containing the color scheme information.
 * @param settingsColors - The available color palettes.
 * @returns The list of colors to be used.
 */
export function getColors(colorScheme: ColorScheme, settingsColors: Palettes): ColorsList {
  const { paletteName, customColors } = colorScheme ?? {};

  if (!isEmpty(customColors)) {
    return customColors as ColorsList;
  }

  return paletteName && settingsColors[paletteName] ? settingsColors[paletteName] : settingsColors['default'];
}