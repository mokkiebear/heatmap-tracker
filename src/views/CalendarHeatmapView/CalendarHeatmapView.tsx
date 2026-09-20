import { useMemo } from "react";
import { HeatmapBox } from "src/components/HeatmapBox/HeatmapBox";
import { useHeatmapContext } from "src/context/heatmap/heatmap.context";
import { useTranslation } from "src/localization/useTranslation";
import { getShiftedWeekdays } from "src/utils/date";

/**
 * A single calendar month or week (`layout: "month"` / `"week"`): weekdays as
 * columns, weeks as rows. The boxes themselves come from the context like every
 * other view's do — this only lays them out row-major under a weekday header.
 */
function CalendarHeatmapView() {
  const { boxes, settings, calendarPeriod } = useHeatmapContext();
  const { t, i18n } = useTranslation();

  const weekDays = useMemo(
    () =>
      getShiftedWeekdays(
        [
          t("weekdaysShort.Sunday"),
          t("weekdaysShort.Monday"),
          t("weekdaysShort.Tuesday"),
          t("weekdaysShort.Wednesday"),
          t("weekdaysShort.Thursday"),
          t("weekdaysShort.Friday"),
          t("weekdaysShort.Saturday"),
        ],
        settings.weekStartDay,
      ),
    [settings.weekStartDay, i18n.language, t],
  );

  return (
    <div className={`heatmap-tracker calendar-heatmap-${calendarPeriod}`}>
      <div className="calendar-heatmap-grid">
        {weekDays.map((day) => (
          <div key={day} className="calendar-heatmap-day-header">
            {day}
          </div>
        ))}
        {boxes.map((box, index) => (
          <HeatmapBox key={box.date || `empty-${index}`} box={box} />
        ))}
      </div>
    </div>
  );
}

export default CalendarHeatmapView;
