import {
  Box,
  ColorsList,
  Entry,
  TrackerData,
  TrackerSettings,
} from "src/types";
import {
  formatDateToISO8601,
  getDayOfYear,
  getFullYear,
  getLastDayOfYear,
  getNumberOfEmptyDaysBeforeYearStarts,
  getToday,
  isSameDate,
  isValidDate,
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
  const mapped: number =
    ((current - inMin) * (outMax - outMin)) / (inMax - inMin) + outMin;
  return clamp(mapped, outMin, outMax);
}

export function getEntriesForYear(entries: Entry[], year: number): Entry[] {
  return entries.filter((e) => {
    if (!isValidDate(e.date)) {
      return false;
    }

    return getFullYear(e.date) === year;
  });
}

function getPrefilledBoxes(numberOfEmptyDaysBeforeYearBegins: number): Box[] {
  if (isNaN(numberOfEmptyDaysBeforeYearBegins)) {
    throw new Error("numberOfEmptyDaysBeforeYearBegins must be a number");
  }

  return Array(numberOfEmptyDaysBeforeYearBegins).fill({
    backgroundColor: "transparent",
    isSpaceBetweenBox: true,
  });
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

  const boxes = getPrefilledBoxes(numberOfEmptyDaysBeforeYearStarts);

  const lastDayOfYear = getLastDayOfYear(currentYear);
  const numberOfDaysInYear = getDayOfYear(lastDayOfYear);
  const todayDate = getToday();

  for (let day = 1; day <= numberOfDaysInYear; day++) {
    const box: Box = {};

    const currentDate = new Date(Date.UTC(currentYear, 0, day));

    // We don't need to add padding before January.
    if (trackerData.separateMonths && day > 31) {
      const dayInMonth = currentDate.getUTCDate();
      if (dayInMonth === 1) {
        for (let i = 0; i < 7; i++) {
          const emptyBox = {
            isSpaceBetweenBox: true,
          };
          boxes.push(emptyBox);
        }
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
      box.filePath = entry.filePath || undefined;
      box.customHref = entry.customHref || undefined;
      box.backgroundColor =
        entry.customColor ??
        (entry.intensity !== undefined
          ? colorsList[entry.intensity - 1]
          : undefined);
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
      scaleStart: userTrackerData.intensityConfig?.scaleStart ?? intensityScaleStart,
      scaleEnd: userTrackerData.intensityConfig?.scaleEnd ?? intensityScaleEnd,
      defaultIntensity:
        userTrackerData.intensityConfig?.defaultIntensity ??
        defaultEntryIntensity ??
        defaultTrackerData.intensityConfig.defaultIntensity,
    },
  };
}

export function isEmpty<T>(array?: T[]): boolean {
  return !array || array.length === 0;
}
