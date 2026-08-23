import { ColorsList, Entry, IntensityConfig } from "src/types";
import { mapRange } from "./core";
import { formatDateToISO8601, getDayOfYear, parseUTCDate } from "./date";

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
  // Non-finite values are dropped too: one NaN poisons `Math.min`/`Math.max`
  // and leaves every day of the year uncoloured.
  const allDefined = entries
    .map((e) => e.intensity)
    .filter((intensity): intensity is number => Number.isFinite(intensity));

  return Array.from(new Set(allDefined));
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
export function getIntensitiesRanges(
  numberOfIntensities: number,
  intensityStart: number,
  intensityEnd: number,
) {
  const intensityRanges = [];

  for (let i = 0; i < numberOfIntensities; i++) {
    const min = mapRange(
      i,
      0,
      numberOfIntensities,
      intensityStart,
      intensityEnd,
    );
    const max = mapRange(
      i + 1,
      0,
      numberOfIntensities,
      intensityStart,
      intensityEnd,
    );

    intensityRanges.push({ min, max, intensity: i + 1 });
  }

  return intensityRanges;
}

export function getIntensitiesInfo(
  intensities: number[],
  intensityConfig: IntensityConfig,
  colorsList: ColorsList,
) {
  const [minimumIntensity, maximumIntensity] = getMinMaxIntensities(
    intensities,
    intensityConfig,
  );

  const numberOfColorIntensities = colorsList.length;

  return getIntensitiesRanges(
    numberOfColorIntensities,
    minimumIntensity,
    maximumIntensity,
  );
}

/**
 * Merges an entry into whatever is already recorded for its day: intensities
 * add up, content is joined by newlines.
 */
function mergeIntoDay(existing: Entry | undefined, entry: Entry): Entry {
  if (!existing) {
    return { ...entry };
  }

  return {
    ...existing,
    intensity: (existing.intensity || 0) + (entry.intensity || 0),
    content:
      existing.content && entry.content
        ? `${existing.content}\n${entry.content}`
        : existing.content || entry.content,
  };
}

/**
 * Groups entries by day, sums their intensities, joins their content, and maps
 * each day's total onto a colour intensity level (1..N).
 *
 * `getKey` decides both how a day is identified and which dates count: it
 * returns `null` for an entry whose date can't be used, which drops the entry
 * before it can reach the colour scale.
 */
function fillEntriesByKey(
  entries: Entry[],
  intensityConfig: IntensityConfig,
  colorsList: ColorsList,
  getKey: (date: string) => string | number | null,
): Record<string, Entry> {
  const aggregated: Record<string, Entry> = {};

  for (const entry of entries) {
    if (intensityConfig.excludeFalsy && !entry.intensity) {
      continue;
    }

    const key = getKey(entry.date);
    if (key === null) {
      continue;
    }

    aggregated[key] = mergeIntoDay(aggregated[key], entry);
  }

  const intensities = getEntriesIntensities(Object.values(aggregated));
  const [minimumIntensity, maximumIntensity] = getMinMaxIntensities(
    intensities,
    intensityConfig,
  );
  const ranges = getIntensitiesRanges(
    colorsList.length,
    minimumIntensity,
    maximumIntensity,
  );

  const filled: Record<string, Entry> = {};

  for (const [key, entry] of Object.entries(aggregated)) {
    const intensity = entry.intensity ?? intensityConfig.defaultIntensity;
    const range = ranges.find((r) => intensity >= r.min && intensity <= r.max);

    let mappedIntensity: number | undefined;

    if (range) {
      mappedIntensity = range.intensity;
    } else if (intensityConfig.showOutOfRange && intensity !== 0) {
      mappedIntensity = Math.round(
        mapRange(
          intensity,
          minimumIntensity,
          maximumIntensity,
          1,
          colorsList.length,
        ),
      );
    }

    filled[key] = {
      ...entry,
      value: entry.intensity,
      intensity: mappedIntensity,
    };
  }

  return filled;
}

/**
 * Entries mapped to colour intensities, keyed by day of the year (1..366).
 *
 * @example
 * ```typescript
 * const entries = [
 *   { date: "2024-01-01", intensity: 5, content: "Task A" },
 *   { date: "2024-01-01", intensity: 10, content: "Task B" }
 * ];
 *
 * fillEntriesWithIntensity(entries, config, colors);
 * // Day 1 holds { value: 15, content: "Task A\nTask B", intensity: <1..N> }
 * ```
 */
export function fillEntriesWithIntensity(
  entries: Entry[],
  intensityConfig: IntensityConfig,
  colorsList: ColorsList,
): Record<number, Entry> {
  return fillEntriesByKey(entries, intensityConfig, colorsList, (date) => {
    const utcDate = parseUTCDate(date);
    return isNaN(utcDate.getTime()) ? null : getDayOfYear(utcDate);
  });
}

/**
 * Like {@link fillEntriesWithIntensity} but keyed by ISO date string
 * (`YYYY-MM-DD`), so it also works across a range spanning several years.
 */
export function fillEntriesWithIntensityByDate(
  entries: Entry[],
  intensityConfig: IntensityConfig,
  colorsList: ColorsList,
): Record<string, Entry> {
  return fillEntriesByKey(entries, intensityConfig, colorsList, (date) =>
    formatDateToISO8601(parseUTCDate(date)),
  );
}

export function getMinMaxIntensities(
  intensities: number[],
  intensityConfig: IntensityConfig,
): [number, number] {
  const [minimumIntensity, maximumIntensity] = intensities.length
    ? [Math.min(...intensities), Math.max(...intensities)]
    : [1, 5];

  return [
    intensityConfig.scaleStart ?? minimumIntensity,
    intensityConfig.scaleEnd ?? maximumIntensity,
  ];
}

/**
 * Parses a value into a numeric intensity.
 * Supports numbers, numeric strings, and booleans.
 *
 * @param val - The value to parse.
 * @returns The parsed numeric intensity.
 */
export function parseIntensity(val: unknown): number {
  if (typeof val === "number") {
    // A frontmatter value that isn't a real number counts as none; letting
    // NaN/Infinity through would blank out the whole scale.
    return Number.isFinite(val) ? val : 0;
  }
  if (typeof val === "string") {
    const num = parseFloat(val);
    if (Number.isFinite(num)) return num;
    return val ? 1 : 0;
  }
  return val ? 1 : 0;
}
