import { Entry, Insight } from "src/types";
import { getToday, parseUTCDate } from "src/utils/date";

export interface StreakResult {
  currentStreak: number;
  longestStreak: number;
  currentStreakStartDate: Date | null;
  currentStreakEndDate: Date | null;
  longestStreakStartDate: Date | null;
  longestStreakEndDate: Date | null;
}

const MS_PER_DAY = 1000 * 60 * 60 * 24;

/**
 * Distinct, valid entry days in ascending order, as UTC midnights.
 *
 * The raw list is unordered, can hold several entries for one day, and can hold
 * unparseable dates — a streak is only meaningful over distinct, real days.
 */
function getStreakDays(entries: Entry[]): number[] {
  const uniqueDays = new Set<number>();

  for (const entry of entries) {
    const date = parseUTCDate(entry.date);
    if (!isNaN(date.getTime())) {
      uniqueDays.add(date.getTime());
    }
  }

  return Array.from(uniqueDays).sort((a, b) => a - b);
}

export function calculateStreaks(entries: Entry[]): StreakResult {
  const days = getStreakDays(entries);

  if (days.length === 0) {
    return {
      currentStreak: 0,
      longestStreak: 0,
      currentStreakStartDate: null,
      currentStreakEndDate: null,
      longestStreakStartDate: null,
      longestStreakEndDate: null,
    };
  }

  let currentStreak = 1;
  let longestStreak = 1;

  let tempStreakStart = days[0];
  let longestStreakStart = days[0];
  let longestStreakEnd = days[0];

  for (let i = 1; i < days.length; i++) {
    // Both sides are UTC midnights, so this is an exact whole-day difference
    // even across a DST boundary.
    const diffDays = (days[i] - days[i - 1]) / MS_PER_DAY;

    if (diffDays === 1) {
      currentStreak++;
    } else {
      currentStreak = 1;
      tempStreakStart = days[i];
    }

    if (currentStreak > longestStreak) {
      longestStreak = currentStreak;
      longestStreakStart = tempStreakStart;
      longestStreakEnd = days[i];
    }
  }

  // After the loop, currentStreak and tempStreakStart describe the streak
  // ending at the last entry.
  const lastDay = days[days.length - 1];
  let currentStreakStartDate: Date | null = new Date(tempStreakStart);
  let currentStreakEndDate: Date | null = new Date(lastDay);

  const daysSinceLastEntry = Math.abs(
    (getToday().getTime() - lastDay) / MS_PER_DAY,
  );

  if (daysSinceLastEntry > 1) {
    currentStreak = 0;
    currentStreakStartDate = null;
    currentStreakEndDate = null;
  }

  return {
    currentStreak,
    longestStreak,
    currentStreakStartDate,
    currentStreakEndDate,
    longestStreakStartDate: new Date(longestStreakStart),
    longestStreakEndDate: new Date(longestStreakEnd),
  };
}

export function processCustomMetrics(
  insights: Insight[],
  yearEntries: Entry[],
): Record<string, string> {
  const results: Record<string, string> = {};

  insights.forEach((insight) => {
    // `calculate` is user-supplied JS from a dataviewjs block; one that throws
    // must not take the rest of the Statistics view with it.
    try {
      const result = insight.calculate({ yearEntries });
      results[insight.name] = result?.toString() ?? "";
    } catch (error) {
      console.error(
        `Heatmap Tracker: insight "${insight.name}" threw while calculating.`,
        error,
      );
      results[insight.name] = "";
    }
  });

  return results;
}
