import { Entry, Insight } from "src/types";

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

  const today = new Date();
  const lastEntryDate = new Date(sortedEntries[sortedEntries.length - 1].date);
  const diffWithToday = Math.abs(
    (today.getTime() - lastEntryDate.getTime()) / (1000 * 60 * 60 * 24)
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

export function processCustomMetrics(insights: Insight[], yearEntries: Entry[]): Record<string, string> {
  const results: Record<string, string> = {};

  insights.forEach((insight) => {
    // Calculate the result for the current metric
    const result = insight.calculate({ yearEntries });
    // Store the result with the metric name as the key
    results[insight.name] = result?.toString() || "";
  });

  return results;
}

const mostActiveDayMetric: Insight = {
  name: "The most active day of the week",
  calculate: ({ yearEntries }: { yearEntries: Entry[] }): string => {
    const dayCounts: Record<string, number> = {};

    // Map each box to the day of the week
    yearEntries.forEach((entry) => {
      const date = new Date(entry.date);
      const day = date.toLocaleDateString("en-US", { weekday: "long" });

      if (!dayCounts[day]) {
        dayCounts[day] = 0;
      }

      dayCounts[day]++;
    });

    // Find the day with the highest count
    const mostActiveDay = Object.entries(dayCounts).reduce(
      (maxDay, [day, count]) => (count > maxDay.count ? { day, count } : maxDay),
      { day: "", count: 0 }
    );

    return mostActiveDay.day;
  },
};

const totalValueMetric: Insight = {
  name: "Total Value",
  calculate: ({ yearEntries }: { yearEntries: Entry[] }) => {
    const total = yearEntries.reduce((sum, entry) => sum + (entry.value || 0), 0);
    return total.toString();
  },
};

const averageValueMetric: Insight = {
  name: "Average Value",
  calculate: ({ yearEntries }: { yearEntries: Entry[] }) => {
    const total = yearEntries.reduce((sum, entry) => sum + (entry.value || 0), 0);
    return (total / yearEntries.length).toFixed(2); // Two decimal places
  },
};

const mostFrequentIntensityMetric: Insight = {
  name: "Most Frequent Intensity",
  calculate: ({ yearEntries }: { yearEntries: Entry[] }) => {
    const intensityCounts: Record<number, number> = {};

    yearEntries.forEach((entry) => {
      const intensity = entry.intensity || 0;
      intensityCounts[intensity] = (intensityCounts[intensity] || 0) + 1;
    });

    const mostFrequent = Object.entries(intensityCounts).reduce((a, b) =>
      b[1] > a[1] ? b : a
    );

    return mostFrequent[0]; // Return the intensity level
  },
};

const highestValueDayMetric: Insight = {
  name: "Day with the Highest Value",
  calculate: ({ yearEntries }: { yearEntries: Entry[] }) => {
    const maxEntry = yearEntries.reduce((max, entry) =>
      (entry.value || 0) > (max.value || 0) ? entry : max
    );
    return maxEntry.date || "No data";
  },
};

const intensityDistributionMetric: Insight = {
  name: "Intensity Distribution",
  calculate: ({ yearEntries }: { yearEntries: Entry[] }) => {
    const distribution: Record<number, number> = {};

    yearEntries.forEach((entry) => {
      const intensity = entry.intensity || 0;
      distribution[intensity] = (distribution[intensity] || 0) + 1;
    });

    return Object.entries(distribution)
      .map(([intensity, count]) => `Intensity ${intensity}: ${count}`)
      .join(", ");
  },
};