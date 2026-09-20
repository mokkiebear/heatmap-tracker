import {
  Box,
  ColorsList,
  Entry,
  TrackerData,
  TrackerSettings,
} from "src/types";
import { getEntryColor } from "src/utils/colors";
import {
  DateRange,
  formatDateToISO8601,
  getDayOfYear,
  getFirstDayOfYear,
  getFullYear,
  getLastDayOfYear,
  getToday,
  isSameDate,
} from "src/utils/date";
import { placeDays } from "src/utils/grid";

export function clamp(input: number, min: number, max: number): number {
  return input < min ? min : input > max ? max : input;
}

export function mapRange(
  current: number,
  inMin: number,
  inMax: number,
  outMin: number,
  outMax: number,
): number {
  // Zero-width input range: every input maps to the same point, and the
  // division would be NaN or Infinity.
  if (inMin === inMax) {
    return outMin;
  }

  const mapped: number =
    ((current - inMin) * (outMax - outMin)) / (inMax - inMin) + outMin;
  return clamp(mapped, outMin, outMax);
}

export function getEntriesForYear(entries: Entry[], year: number): Entry[] {
  // An unparseable date yields NaN, which matches no year.
  return entries.filter((e) => getFullYear(e.date) === year);
}

/** Copies an entry's renderable fields onto its day's box. */
function applyEntryToBox(box: Box, entry: Entry, colorsList: ColorsList): void {
  box.hasData = true;
  box.content = entry.content || undefined;
  box.emoji = entry.emoji || undefined;
  box.value = entry.value;
  box.filePath = entry.filePath || undefined;
  box.customHref = entry.customHref || undefined;
  box.backgroundColor = getEntryColor(entry, colorsList);
}

export function getBoxes(
  currentYear: number,
  entriesWithIntensity: Record<number, Entry>,
  colorsList: ColorsList,
  trackerData: TrackerData,
  settings: TrackerSettings,
): Box[] {
  const placements = placeDays(
    getFirstDayOfYear(currentYear),
    getLastDayOfYear(currentYear),
    settings.weekStartDay,
    trackerData.separateMonths,
  );

  const firstPosition = placements.length ? placements[0].position : 0;
  const todayDate = getToday();
  const boxes: Box[] = [];

  for (const { date, position } of placements) {
    // `position` already accounts for the run-up to the first day and for the
    // week `separateMonths` inserts before each month; fill whatever it skipped
    // with blanks so the array index and the grid slot stay in step.
    while (boxes.length < position) {
      boxes.push(
        boxes.length < firstPosition
          ? { backgroundColor: "transparent", isSpaceBetweenBox: true }
          : { isSpaceBetweenBox: true },
      );
    }

    const month = date.toLocaleString("en-US", {
      month: "short",
      timeZone: "UTC",
    });

    const box: Box = {
      name: `month-${month.toLowerCase()}`,
      date: formatDateToISO8601(date) ?? undefined,
    };

    if (isSameDate(date, todayDate)) {
      box.isToday = true;
      box.showBorder = trackerData.showCurrentDayBorder;
    }

    const entry = entriesWithIntensity[getDayOfYear(date)];

    if (entry) {
      applyEntryToBox(box, entry, colorsList);
    } else {
      box.hasData = false;
    }

    boxes.push(box);
  }

  return boxes;
}

/**
 * Boxes for one calendar month or week, laid out row-major in a 7-column grid:
 * blank leading slots for the days before the range starts, then one box per
 * day. Keyed by ISO date rather than day-of-year, so a range crossing a year
 * boundary works.
 */
export function getBoxesForRange(
  range: DateRange,
  entriesWithIntensityByDate: Record<string, Entry>,
  colorsList: ColorsList,
  trackerData: TrackerData,
  weekStartDay: number,
): Box[] {
  const placements = placeDays(range.start, range.end, weekStartDay);
  const todayDate = getToday();
  const boxes: Box[] = [];

  for (const { date, position } of placements) {
    while (boxes.length < position) {
      boxes.push({ backgroundColor: "transparent", isSpaceBetweenBox: true });
    }

    const dateKey = formatDateToISO8601(date);
    const box: Box = { date: dateKey ?? undefined };

    if (isSameDate(date, todayDate)) {
      box.isToday = true;
      box.showBorder = trackerData.showCurrentDayBorder;
    }

    const entry = dateKey ? entriesWithIntensityByDate[dateKey] : undefined;

    if (entry) {
      applyEntryToBox(box, entry, colorsList);
    } else {
      box.hasData = false;
    }

    boxes.push(box);
  }

  return boxes;
}

/**
 * Pre-2.x `trackerData` shape, before `intensityConfig` existed. Kept only so
 * `mergeTrackerData` can fold old codeblocks/dataviewjs scripts forward —
 * these are no longer part of the TrackerData schema/type.
 */
interface LegacyIntensityFields {
  defaultEntryIntensity?: number;
  intensityScaleStart?: number;
  intensityScaleEnd?: number;
}

export function mergeTrackerData(
  defaultTrackerData: TrackerData,
  userTrackerData: TrackerData,
): TrackerData {
  if (!userTrackerData) {
    return defaultTrackerData;
  }

  const {
    defaultEntryIntensity,
    intensityScaleStart,
    intensityScaleEnd,
    ...restUserTrackerData
  } = userTrackerData as TrackerData & LegacyIntensityFields;

  return {
    ...defaultTrackerData,
    ...restUserTrackerData,
    colorScheme: {
      ...defaultTrackerData.colorScheme,
      ...userTrackerData.colorScheme,
    },
    intensityConfig: {
      ...defaultTrackerData.intensityConfig,
      ...userTrackerData.intensityConfig,

      // `intensityConfig` (current API) wins when set; the legacy fields are
      // only used as a fallback so old codeblocks keep working.
      scaleStart:
        userTrackerData.intensityConfig?.scaleStart ?? intensityScaleStart,
      scaleEnd: userTrackerData.intensityConfig?.scaleEnd ?? intensityScaleEnd,
      defaultIntensity:
        userTrackerData.intensityConfig?.defaultIntensity ??
        defaultEntryIntensity ??
        defaultTrackerData.intensityConfig.defaultIntensity,
    },
  };
}
