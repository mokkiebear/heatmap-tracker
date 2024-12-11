import { useTranslation } from "react-i18next";
import { useHeatmapContext } from "src/context/heatmap/heatmap.context";
import { Entry } from "src/types";

interface StatisticsMetricProps {
  label: string;
  value: number;
}

interface StreakResult {
  currentStreak: number;
  longestStreak: number;
  currentStreakStartDate: Date | null;
  currentStreakEndDate: Date | null;
  longestStreakStartDate: Date | null;
  longestStreakEndDate: Date | null;
}

function calculateStreaks(entries: Entry[]): StreakResult {
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

  const today = new Date();
  const lastEntryDate = new Date(sortedEntries[sortedEntries.length - 1].date);
  const diffWithToday =
    (today.getTime() - lastEntryDate.getTime()) / (1000 * 60 * 60 * 24);

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

function StatisticsMetric({ label, value }: StatisticsMetricProps) {
  return (
    <div>
      <span>{label}: </span>
      <span>{value}</span>
    </div>
  );
}

export function StatisticsView() {
  const { t } = useTranslation();
  const { entriesWithIntensity, trackerData } = useHeatmapContext();

  const {
    currentStreak,
    longestStreak,
    longestStreakEndDate,
    longestStreakStartDate,
    currentStreakStartDate,
    currentStreakEndDate,
  } = calculateStreaks(trackerData.entries);

  return (
    <div className="heatmap-statistics">
      <div className="heatmap-statistics__content">
        <StatisticsMetric
          label={t("statistics.totalTrackingDaysThisYear")}
          value={Object.keys(entriesWithIntensity).length}
        />
        <StatisticsMetric
          label={t("statistics.totalTrackingDays")}
          value={Object.keys(trackerData.entries).length}
        />
        <br />
        <StatisticsMetric
          label={t("statistics.currentStreak")}
          value={currentStreak}
        />
        <StatisticsMetric
          label={t("statistics.longestStreak")}
          value={longestStreak}
        />
        {currentStreakStartDate?.toString()}
        {currentStreakEndDate?.toString()}
        {longestStreakStartDate?.toString()}
        {longestStreakEndDate?.toString()}
        <hr />
        <div>{t("statistics.developmentNote")}</div>
      </div>
    </div>
  );
}

/**
 *   const activityByMonth = Object.values(entriesWithIntensity).reduce(
    (acc, entry) => {
      const month = new Date(entry.date).toLocaleString("en-US", {
        month: "long",
      });
      acc[month] = (acc[month] || 0) + 1;
      return acc;
    },
    {} as Record<string, number>
  );
 */

// Ideas for metrics
/**
 * <div>
        <div>
          Average intensity:
          {(
            Object.values(entriesWithIntensity).reduce(
              (sum, entry) => sum + (entry.intensity as number),
              0
            ) / Object.keys(entriesWithIntensity).length
          ).toFixed(2)}
        </div>
        <div>
          Maximum intensity:{" "}
          {Math.max(
            ...Object.values(entriesWithIntensity).map(
              (entry) => entry.intensity as number
            )
          )}
        </div>
        <div>
          Minimum intensity:{" "}
          {Math.min(
            ...Object.values(entriesWithIntensity).map(
              (entry) => entry.intensity as number
            )
          )}
        </div>
        <div>
          {(() => {
            return (
              <div>
                <div>Activity distribution by month:</div>
                <ul>
                  {Object.entries(activityByMonth).map(([month, days]) => (
                    <li key={month}>
                      {month}: {days} days
                    </li>
                  ))}
                </ul>
              </div>
            );
          })()}
        </div>
        <div>
          Самый активный месяц:{" "}
          {
            Object.entries(activityByMonth).reduce(
              (max, entry) => (entry[1] > max[1] ? entry : max),
              ["", 0]
            )[0]
          }
        </div>
        <div>
          Самая длинная последовательность дней с активностью:{" "}
          {(() => {
            let maxStreak = 0;
            let currentStreak = 0;
            let lastDate: any = null;

            Object.values(entriesWithIntensity).forEach((entry) => {
              const currentDate = new Date(entry.date);
              if (
                lastDate &&
                (currentDate.getTime() - lastDate.getTime()) /
                  (1000 * 3600 * 24) ===
                  1
              ) {
                currentStreak++;
              } else {
                currentStreak = 1;
              }
              if (currentStreak > maxStreak) {
                maxStreak = currentStreak;
              }
              lastDate = currentDate;
            });

            return maxStreak;
          })()}
        </div>
      </div>
 */
