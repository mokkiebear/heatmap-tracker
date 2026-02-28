import { useMemo } from "react";
import { useTranslation } from "react-i18next";
import { useHeatmapContext } from "src/context/heatmap/heatmap.context";
import { formatDateToISO8601 } from "src/utils/date";
import { calculateStreaks, processCustomMetrics } from "src/utils/statistics";

interface StatisticsMetricProps {
  label: string;
  value: number | string;
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
  const { entriesWithIntensity, trackerData, allFilteredEntries } = useHeatmapContext();

  const {
    currentStreak,
    longestStreak,
    longestStreakEndDate,
    longestStreakStartDate,
    currentStreakStartDate,
    currentStreakEndDate,
  } = useMemo(
    () => calculateStreaks(allFilteredEntries),
    [allFilteredEntries]
  );

  const currentStreakValue = useMemo(() => {
    if (!currentStreakStartDate || !currentStreakEndDate) {
      return `${currentStreak}`;
    }

    return `${currentStreak} (${
      formatDateToISO8601(currentStreakStartDate) ?? ""
    } - ${formatDateToISO8601(currentStreakEndDate) ?? ""})`;
  }, [currentStreak, currentStreakStartDate, currentStreakEndDate]);

  const longestStreakValue = useMemo(() => {
    if (!longestStreakStartDate || !longestStreakEndDate) {
      return `${longestStreak}`;
    }

    return `${longestStreak} (${
      formatDateToISO8601(longestStreakStartDate) ?? ""
    } - ${formatDateToISO8601(longestStreakEndDate) ?? ""})`;
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
          value={allFilteredEntries.length}
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
