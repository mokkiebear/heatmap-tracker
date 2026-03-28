import React, { useMemo } from "react";
import { useTranslation } from "react-i18next";
import { useHeatmapContext } from "src/context/heatmap/heatmap.context";
import { HeatmapBox } from "src/components/HeatmapBox/HeatmapBox";
import { Box } from "src/types";
import { getDaysInMonth, formatDateToISO8601, getToday, isSameDate } from "src/utils/date";

interface MonthRow {
  year: number;
  month: number;
  label: string;
  boxes: (Box | null)[];
}

const MONTH_KEYS = [
  "January", "February", "March", "April", "May", "June",
  "July", "August", "September", "October", "November", "December",
];

const DAY_NUMBERS = Array.from({ length: 31 }, (_, i) => i + 1);

function MonthlyHeatmapView() {
  const { t } = useTranslation();
  const {
    currentYear,
    dateRange,
    entriesWithIntensityByDate,
    colorsList,
    trackerData,
  } = useHeatmapContext();

  const rows = useMemo<MonthRow[]>(() => {
    const todayDate = getToday();
    const result: MonthRow[] = [];

    let startMonth: number, startYear: number, endMonth: number, endYear: number;

    if (dateRange) {
      startYear = dateRange.start.getUTCFullYear();
      startMonth = dateRange.start.getUTCMonth();
      endYear = dateRange.end.getUTCFullYear();
      endMonth = dateRange.end.getUTCMonth();
    } else {
      startYear = currentYear;
      startMonth = 0;
      endYear = currentYear;
      endMonth = 11;
    }

    let y = startYear;
    let m = startMonth;
    while (y < endYear || (y === endYear && m <= endMonth)) {
      const daysInMonth = getDaysInMonth(y, m);
      const boxes: (Box | null)[] = [];

      for (let day = 1; day <= 31; day++) {
        if (day > daysInMonth) {
          boxes.push(null);
          continue;
        }

        const currentDate = new Date(Date.UTC(y, m, day));
        const dateKey = formatDateToISO8601(currentDate);
        const box: Box = {};

        box.date = dateKey ?? undefined;

        if (isSameDate(currentDate, todayDate)) {
          box.isToday = true;
          box.showBorder = trackerData.showCurrentDayBorder;
        }

        if (dateKey && entriesWithIntensityByDate[dateKey]) {
          box.hasData = true;
          const entry = entriesWithIntensityByDate[dateKey];
          box.content = entry.content || undefined;
          box.filePath = entry.filePath || undefined;
          box.customHref = entry.customHref || undefined;
          box.backgroundColor =
            entry.customColor ??
            (entry.intensity !== undefined
              ? colorsList[entry.intensity - 1]
              : undefined);
        } else {
          box.hasData = false;
        }

        boxes.push(box);
      }

      const label = t(`monthsShort.${MONTH_KEYS[m]}`);
      result.push({ year: y, month: m, label, boxes });

      m++;
      if (m > 11) {
        m = 0;
        y++;
      }
    }

    return result;
  }, [currentYear, dateRange, entriesWithIntensityByDate, colorsList, trackerData, t]);

  return (
    <div className="heatmap-tracker monthly-heatmap">
      <div className="monthly-heatmap-grid">
        {/* Header row: empty cell + day numbers */}
        <div className="monthly-heatmap-label monthly-heatmap-header-label"></div>
        {DAY_NUMBERS.map((d) => (
          <div key={`h-${d}`} className="monthly-heatmap-day-header">{d}</div>
        ))}

        {/* Month rows */}
        {rows.map((row) => (
          <React.Fragment key={`row-${row.year}-${row.month}`}>
            <div className="monthly-heatmap-label">
              {row.label}
            </div>
            {row.boxes.map((box, i) =>
              box ? (
                <HeatmapBox key={`${row.year}-${row.month}-${i}`} box={box} />
              ) : (
                <div key={`empty-${row.year}-${row.month}-${i}`} className="monthly-heatmap-empty" />
              ),
            )}
          </React.Fragment>
        ))}
      </div>
    </div>
  );
}

export default MonthlyHeatmapView;
