import { ColorsList, Entry, IntensityConfig } from "src/types";
import { mapRange } from "./core";
import { DateHelper } from "./date";

export function getEntriesIntensities(entries: Entry[]): number[] {
  return Array.from(
    new Set(entries.filter((e) => e.intensity !== undefined).map((e) => e.intensity as number))
  );
}

/**
 * Generates an array of intensity ranges based on the given number of intensities and the start and end intensity values.
 *
 * @param numberOfIntensities - The number of intensity ranges to generate.
 * @param intensityStart - The starting value of the intensity range.
 * @param intensityEnd - The ending value of the intensity range.
 * @returns An array of objects, each containing the min and max values of the intensity range and the intensity level.
 *
 * @example
 * ```typescript
 * const ranges = getIntensitiesRanges(3, 0, 100);
 * console.log(ranges);
 * // Output:
 * // [
 * //   { min: 0, max: 33.333333333333336, intensity: 1 },
 * //   { min: 33.333333333333336, max: 66.66666666666667, intensity: 2 },
 * //   { min: 66.66666666666667, max: 100, intensity: 3 }
 * // ]
 * ```
 */
export function getIntensitiesRanges(numberOfIntensities: number, intensityStart: number, intensityEnd: number) {
  const intensityRanges = [];

  for (let i = 0; i < numberOfIntensities; i++) {
    const min = mapRange(i, 0, numberOfIntensities, intensityStart, intensityEnd);
    const max = mapRange(i + 1, 0, numberOfIntensities, intensityStart, intensityEnd);

    intensityRanges.push({ min, max, intensity: i + 1 });
  }

  return intensityRanges;
}

export function getIntensitiesInfo(intensities: number[], intensityConfig: IntensityConfig, colorsList: ColorsList) {
  const [minimumIntensity, maximumIntensity] = getMinMaxIntensities(intensities, intensityConfig);

  const numberOfColorIntensities = colorsList.length;

  return getIntensitiesRanges(numberOfColorIntensities, minimumIntensity, maximumIntensity);
}

export function fillEntriesWithIntensity(
  entries: Entry[],
  intensityConfig: IntensityConfig,
  colorsList: ColorsList,
): Record<number, Entry> {
  const entriesByDay: Record<number, Entry> = {};

  const intensities = getEntriesIntensities(entries);
  const intensitiesMap = getIntensitiesInfo(intensities, intensityConfig, colorsList);

  const [minimumIntensity, maximumIntensity] = getMinMaxIntensities(intensities, intensityConfig);

  entries.forEach((e) => {
    const currentIntensity = e.intensity ?? intensityConfig.defaultIntensity;
    const foundIntensityInfo = intensitiesMap.find((o) => currentIntensity >= o.min && currentIntensity <= o.max);

    const newIntensity = foundIntensityInfo
      ? foundIntensityInfo.intensity
      : intensityConfig.showOutOfRange
        ? Math.round(mapRange(currentIntensity, minimumIntensity, maximumIntensity, 1, colorsList.length))
        : undefined;

    const newEntry = {
      ...e,
      value: e.intensity,
      intensity: newIntensity,
    };

    const day = DateHelper.getDayOfYear(new Date(e.date));

    entriesByDay[day] = newEntry;
  });

  return entriesByDay;
}

export function getMinMaxIntensities(intensities: number[], intensityConfig: IntensityConfig): [number, number] {
  const [minimumIntensity, maximumIntensity] = intensities.length ? [
    Math.min(...intensities),
    Math.max(...intensities),
  ] : [1, 5];

  return [
    intensityConfig.scaleStart ?? minimumIntensity,
    intensityConfig.scaleEnd ?? maximumIntensity,
  ];
}