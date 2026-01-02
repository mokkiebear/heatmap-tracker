import { ColorsList, Entry, IntensityConfig } from "src/types";
import { mapRange } from "./core";
import { getDayOfYear } from "./date";

/**
 * Returns an array of unique intensities from the given entries.
 *
 * @param entries - The entries to extract intensities from.
 * @returns An array of unique intensities.
 *
 * @example
 * ```typescript
 * const intensities = getEntriesIntensities(entries);
 * console.log(intensities);
 * Output:
 * [1, 2, 3]
 * ```
 */
export function getEntriesIntensities(entries: Entry[]): number[] {
  const allDefined = entries.filter((e) => e.intensity !== undefined && e.intensity !== null).map((e) => e.intensity as number);

  return Array.from(
    new Set(allDefined)
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
 * Output:
 * [
 *   { min: 0, max: 33.333333333333336, intensity: 1 },
 *   { min: 33.333333333333336, max: 66.66666666666667, intensity: 2 },
 *   { min: 66.66666666666667, max: 100, intensity: 3 }
 * ]
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

  // Group and aggregate entries by day first
  const aggregatedEntries: Record<number, Entry> = {};
  
  entries.forEach((e) => {
    // Skip entries with falsy values if excludeFalsy is enabled
    if (intensityConfig.excludeFalsy && !e.intensity) {
      return;
    }

    // Standardize date string to avoid local timezone parsing
    // Robustly extract YYYY, MM, DD regardless of separator (/ or -)
    const match = e.date.match(/(\d{4})[/-](\d{1,2})[/-](\d{1,2})/);
    let utcDate: Date;

    if (match) {
      const [, year, month, day] = match;
      utcDate = new Date(Date.UTC(parseInt(year), parseInt(month) - 1, parseInt(day)));
    } else {
      // Fallback for other formats, try to force UTC by appending T00:00:00Z if missing
      const dateStr = e.date.includes('T') ? e.date : `${e.date.replace(/\//g, '-')}T00:00:00Z`;
      const date = new Date(dateStr);
      utcDate = new Date(Date.UTC(date.getUTCFullYear(), date.getUTCMonth(), date.getUTCDate()));
    }

    const day = getDayOfYear(utcDate);

    if (aggregatedEntries[day]) {
      const existing = aggregatedEntries[day];
      aggregatedEntries[day] = {
        ...existing,
        intensity: (existing.intensity || 0) + (e.intensity || 0),
        content: existing.content && e.content ? `${existing.content}\n${e.content}` : (existing.content || e.content),
      };
    } else {
      aggregatedEntries[day] = { ...e };
    }
  });

  const intensities = getEntriesIntensities(Object.values(aggregatedEntries));
  const intensitiesMap = getIntensitiesInfo(intensities, intensityConfig, colorsList);

  const [minimumIntensity, maximumIntensity] = getMinMaxIntensities(intensities, intensityConfig);

  Object.entries(aggregatedEntries).forEach(([dayStr, e]) => {
    const day = parseInt(dayStr);
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