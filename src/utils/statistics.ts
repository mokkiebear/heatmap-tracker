import { Entry, Insight } from "src/types";
import { getToday } from "src/utils/date";

export interface StreakResult {
  currentStreak: number;
  longestStreak: number;
  currentStreakStartDate: Date | null;
  currentStreakEndDate: Date | null;
  longestStreakStartDate: Date | null;
  longestStreakEndDate: Date | null;
}

export function calculateStreaks(entries: Entry[]): StreakResult {
  if (entries.length === 0) {
    return {
      currentStreak: 0,
      longestStreak: 0,
      currentStreakStartDate: null,
      currentStreakEndDate: null,
      longestStreakStartDate: null,
      longestStreakEndDate: null,
    };
  }

  const sortedEntries = entries
    .slice()
    .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());

  let currentStreak = 1;
  let longestStreak = 1;

  let currentStreakStartDate: Date | null = new Date(sortedEntries[0].date);
  let currentStreakEndDate: Date | null = new Date(sortedEntries[0].date);

  let longestStreakStartDate = new Date(sortedEntries[0].date);
  let longestStreakEndDate = new Date(sortedEntries[0].date);

  let tempStreakStartDate = new Date(sortedEntries[0].date);

  for (let i = 1; i < sortedEntries.length; i++) {
    const prevDate = new Date(sortedEntries[i - 1].date);
    const currDate = new Date(sortedEntries[i].date);

    const diffDays =
      (currDate.getTime() - prevDate.getTime()) / (1000 * 60 * 60 * 24);

    if (diffDays === 1) {
      currentStreak++;
    } else {
      currentStreak = 1;
      tempStreakStartDate = currDate;
    }

    if (currentStreak > longestStreak) {
      longestStreak = currentStreak;
      longestStreakStartDate = tempStreakStartDate;
      longestStreakEndDate = currDate;
    }

    currentStreakEndDate = currDate;
  }

  // After the loop, the final values of currentStreak and tempStreakStartDate
  // represent the streak ending at the last entry.
  currentStreakStartDate = tempStreakStartDate;

  const today = getToday();
  const lastEntryDate = new Date(sortedEntries[sortedEntries.length - 1].date);
  const diffWithToday = Math.abs(
    (today.getTime() - lastEntryDate.getTime()) / (1000 * 60 * 60 * 24),
  );

  if (diffWithToday > 1) {
    currentStreak = 0;
    currentStreakStartDate = null;
    currentStreakEndDate = null;
  }

  return {
    currentStreak,
    longestStreak,
    currentStreakStartDate,
    currentStreakEndDate,
    longestStreakStartDate,
    longestStreakEndDate,
  };
}

export function processCustomMetrics(
  insights: Insight[],
  yearEntries: Entry[],
): Record<string, string> {
  const results: Record<string, string> = {};

  insights.forEach((insight) => {
    // Calculate the result for the current metric
    const result = insight.calculate({ yearEntries });
    // Store the result with the metric name as the key
    results[insight.name] = result?.toString() || "";
  });

  return results;
}
