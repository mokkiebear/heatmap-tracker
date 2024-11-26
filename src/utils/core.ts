import { Colors, Entry, TrackerData } from "src/types";

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

export function isValidDate(dateString: string): boolean {
  const date = new Date(dateString);
  return !isNaN(date.getTime());
}

export function getDayOfYear(date: Date): number {
  const startOfYear = new Date(date.getFullYear(), 0, 0);
  const diff = date.getTime() - startOfYear.getTime();
  return Math.floor(diff / (1000 * 60 * 60 * 24));
}

export function getWeekdayShort(dayNumber: number, weekStartDay: number): string {
  return new Date(1970, 0, dayNumber + weekStartDay + 4).toLocaleDateString('en-US', {
    weekday: 'short',
  });
}

export function getFirstDayOfYear(year: number): Date {
  return new Date(Date.UTC(year, 0, 1));
}

export function getNumberOfEmptyDaysBeforeYearStarts(year: number, weekStartDay: number): number {
  const firstDayOfYear = getFirstDayOfYear(year);
  const firstWeekday = firstDayOfYear.getUTCDay();
  return (firstWeekday - weekStartDay + 7) % 7;
}

export function getLastDayOfYear(year: number): Date {
  return new Date(Date.UTC(year, 11, 31));
}

export function getEntriesForYear(entries: Entry[], year: number): Entry[] {
  return entries.filter((e) => {
    if (!isValidDate(e.date)) {
      return false;
    }

    return new Date(e.date).getFullYear() === year;
  });
}

export function getMinMaxIntensities(intensities: number[], [intensityScaleStart, intensityScaleEnd]: [number, number]): [number, number] {
  if (!intensities.length) {
    return [intensityScaleStart, intensityScaleEnd];
  }

  return [
    Math.min(...intensities),
    Math.max(...intensities),
  ];
}

export function getColors(trackerData: TrackerData, settingsColors: Colors): Colors {
  if (typeof trackerData.colors === 'string') {
    return settingsColors[trackerData.colors]
      ? { [trackerData.colors]: settingsColors[trackerData.colors] }
      : settingsColors;
  }

  return trackerData.colors ?? settingsColors;
}