import {
  Box,
  ColorsList,
  Entry,
  TrackerData,
  TrackerSettings,
} from "src/types";
import { getEntryColor } from "src/utils/colors";
import {
  formatDateToISO8601,
  getDayOfYear,
  getFullYear,
  getLastDayOfYear,
  getNumberOfEmptyDaysBeforeYearStarts,
  getToday,
  isSameDate,
} from "src/utils/date";

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

export function getBoxes(
  currentYear: number,
  entriesWithIntensity: Record<number, Entry>,
  colorsList: ColorsList,
  trackerData: TrackerData,
  settings: TrackerSettings,
): Box[] {
  const numberOfEmptyDaysBeforeYearStarts =
    getNumberOfEmptyDaysBeforeYearStarts(currentYear, settings.weekStartDay);

  // A factory, not `Array(n).fill(obj)` — `fill` would put the same object in
  // every slot.
  const boxes: Box[] = Array.from(
    { length: numberOfEmptyDaysBeforeYearStarts },
    () => ({ backgroundColor: "transparent", isSpaceBetweenBox: true }),
  );

  const lastDayOfYear = getLastDayOfYear(currentYear);
  const numberOfDaysInYear = getDayOfYear(lastDayOfYear);
  const todayDate = getToday();

  for (let day = 1; day <= numberOfDaysInYear; day++) {
    const box: Box = {};

    const currentDate = new Date(Date.UTC(currentYear, 0, day));

    // A blank week before each month, except the first one.
    if (
      trackerData.separateMonths &&
      day > 1 &&
      currentDate.getUTCDate() === 1
    ) {
      for (let i = 0; i < 7; i++) {
        boxes.push({ isSpaceBetweenBox: true });
      }
    }

    const month = currentDate.toLocaleString("en-US", {
      month: "short",
      timeZone: "UTC",
    });
    box.name = `month-${month.toLowerCase()}`;
    box.date = formatDateToISO8601(currentDate) ?? undefined;

    if (isSameDate(currentDate, todayDate)) {
      box.isToday = true;
      box.showBorder = trackerData.showCurrentDayBorder;
    }

    if (entriesWithIntensity[day]) {
      box.hasData = true;
      const entry = entriesWithIntensity[day];

      box.content = entry.content || undefined;
      box.value = entry.value;
      box.filePath = entry.filePath || undefined;
      box.customHref = entry.customHref || undefined;
      box.backgroundColor = getEntryColor(entry, colorsList);
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
