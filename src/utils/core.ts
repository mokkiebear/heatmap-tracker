import { Box, ColorsList, Entry, TrackerData, TrackerSettings } from "src/types";
import { getDayOfYear, getLastDayOfYear, getNumberOfEmptyDaysBeforeYearStarts, isValidDate } from "./date";

export function clamp(input: number, min: number, max: number): number {
  return input < min ? min : input > max ? max : input;
}

export function mapRange(
  current: number,
  inMin: number,
  inMax: number,
  outMin: number,
  outMax: number
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

    return new Date(e.date).getFullYear() === year;
  });
}

export function getPrefilledBoxes(numberOfEmptyDaysBeforeYearBegins: number): Box[] {
  if (isNaN(numberOfEmptyDaysBeforeYearBegins)) {
    throw new Error('numberOfEmptyDaysBeforeYearBegins must be a number');
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
  settings: TrackerSettings
): Box[] {
  const numberOfEmptyDaysBeforeYearStarts =
    getNumberOfEmptyDaysBeforeYearStarts(currentYear, settings.weekStartDay);

  const boxes = getPrefilledBoxes(numberOfEmptyDaysBeforeYearStarts);

  const lastDayOfYear = getLastDayOfYear(currentYear);
  const numberOfDaysInYear = getDayOfYear(lastDayOfYear);
  const todaysDayNumberLocal = getDayOfYear(new Date());

  for (let day = 1; day <= numberOfDaysInYear; day++) {
    const box: Box = {};

    const currentDate = new Date(Date.UTC(currentYear, 0, day));

    // We don't need to add padding before January.
    if (trackerData.separateMonths && day > 31) {
      const dayInMonth = Number(
        currentDate.toLocaleString("en-us", { day: "numeric" })
      );
      if (dayInMonth === 1) {
        for (let i = 0; i < 7; i++) {
          const emptyBox = {
            isSpaceBetweenBox: true,
          };
          boxes.push(emptyBox);
        }
      }
    }

    const month = currentDate.toLocaleString("en-US", { month: "short" });
    box.name = `month-${month.toLowerCase()}`;

    if (day === todaysDayNumberLocal) {
      box.isToday = true;
      box.showBorder = trackerData.showCurrentDayBorder;
    }

    if (entriesWithIntensity[day]) {
      box.hasData = true;
      const entry = entriesWithIntensity[day];

      box.date = entry.date;

      if (entry.content) {
        box.content = entry.content;
      }

      box.backgroundColor = entry.customColor ?? (entry.intensity !== undefined ? colorsList[entry.intensity - 1] : undefined);
    } else {
      box.date = currentDate?.toISOString()?.split('T')[0];
      box.hasData = false;
    }

    boxes.push(box);
  }

  return boxes;
}

export function mergeTrackerData(defaultTrackerData: TrackerData, userTrackerData: TrackerData): TrackerData {
  if (!userTrackerData) {
    return defaultTrackerData;
  }

  return {
    ...defaultTrackerData,
    ...userTrackerData,
    colorScheme: {
      ...defaultTrackerData.colorScheme,
      ...userTrackerData.colorScheme,
    },
    intensityConfig: {
      ...defaultTrackerData.intensityConfig,
      ...userTrackerData.intensityConfig,

      scaleStart: userTrackerData.intensityScaleStart,
      scaleEnd: userTrackerData.intensityScaleEnd,
      defaultIntensity: userTrackerData.defaultEntryIntensity,
    },
  };
}