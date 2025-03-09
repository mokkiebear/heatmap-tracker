import { useMemo } from "react";
import { useTranslation } from "react-i18next";
import { useHeatmapContext } from "src/context/heatmap/heatmap.context";
import { DateHelper } from "src/utils/date";

export function HeatmapWeekDays() {
  const { settings } = useHeatmapContext();
  const { t, i18n } = useTranslation();

  const weekDays = useMemo(() => {
    return DateHelper.getShiftedWeekdays(
      [
        t("weekdaysShort.Sunday"),
        t("weekdaysShort.Monday"),
        t("weekdaysShort.Tuesday"),
        t("weekdaysShort.Wednesday"),
        t("weekdaysShort.Thursday"),
        t("weekdaysShort.Friday"),
        t("weekdaysShort.Saturday"),
      ],
      settings.weekStartDay
    );
  }, [settings.weekStartDay, i18n.language]);

  return (
    <div className={`heatmap-tracker-days heatmap-tracker-days--${settings.weekDisplayMode}`}>
      {weekDays.map((day) => (
        <div key={day} className="heatmap-tracker-days__week-day">
          {day}
        </div>
      ))}
    </div>
  );
}
