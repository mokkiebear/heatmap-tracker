import { useMemo } from "react";
import { useTranslation } from "react-i18next";
import { useHeatmapContext } from "src/context/heatmap/heatmap.context";
import { Entry } from "src/types";
import { DateHelper } from "src/utils/date";
import { processCustomMetrics } from "src/utils/statistics";

interface StatisticsMetricProps {
  label: string;
  value: number | string;
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

function StatisticsMetric({ label, value }: StatisticsMetricProps) {
  return (
    <div>
      <span>{label}: </span>
      <span>{value}</span>
    </div>
  );
}

function StatisticsView() {
  const { t } = useTranslation();
  const { entriesWithIntensity, trackerData } = useHeatmapContext();

  const {
    currentStreak,
    longestStreak,
    longestStreakEndDate,
    longestStreakStartDate,
    currentStreakStartDate,
    currentStreakEndDate,
  } = useMemo(
    () => calculateStreaks(trackerData.entries),
    [trackerData.entries]
  );

  const currentStreakValue = useMemo(() => {
    if (!currentStreakStartDate || !currentStreakEndDate) {
      return `${currentStreak}`;
    }

    return `${currentStreak} (${
      DateHelper.formatDateToISO8601(currentStreakStartDate) ?? ""
    } - ${DateHelper.formatDateToISO8601(currentStreakEndDate) ?? ""})`;
  }, [currentStreak, currentStreakStartDate, currentStreakEndDate]);

  const longestStreakValue = useMemo(() => {
    if (!longestStreakStartDate || !longestStreakEndDate) {
      return `${longestStreak}`;
    }

    return `${longestStreak} (${
      DateHelper.formatDateToISO8601(longestStreakStartDate) ?? ""
    } - ${DateHelper.formatDateToISO8601(longestStreakEndDate) ?? ""})`;
  }, [longestStreak, longestStreakStartDate, longestStreakEndDate]);

  const userInsights = useMemo(
    () =>
      processCustomMetrics(
        trackerData.insights,
        Object.values(entriesWithIntensity)
      ),
    [trackerData.insights, entriesWithIntensity]
  );

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
          value={currentStreakValue}
        />
        <StatisticsMetric
          label={t("statistics.longestStreak")}
          value={longestStreakValue}
        />
        <br />
        {Object.entries(userInsights).map(([key, value]) => (
          <StatisticsMetric key={key} label={key} value={value} />
        ))}
      </div>
    </div>
  );
}

export default StatisticsView;
