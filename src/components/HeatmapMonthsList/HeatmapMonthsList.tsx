import { useHeatmapContext } from "src/context/heatmap/heatmap.context";
import { useTranslation } from "src/localization/useTranslation";

const MONTH_KEYS = [
  "January",
  "February",
  "March",
  "April",
  "May",
  "June",
  "July",
  "August",
  "September",
  "October",
  "November",
  "December",
];

/**
 * Month labels above the week-column grid, derived from the boxes themselves
 * rather than assumed to be January–December: the grid can show any date range
 * (`daysToShow`, `startDate`/`endDate`, ...), and that range may start
 * mid-month or cross a year boundary.
 *
 * Each label sits in the grid column holding that month's first box, so it
 * lines up with the weeks it names. A month whose first box lands in the column
 * already used by the previous label is skipped — two labels in one box-wide
 * column would draw on top of each other.
 */
export function HeatmapMonthsList() {
  const { t } = useTranslation();
  const { boxes } = useHeatmapContext();

  const labels: { key: string; column: number; text: string }[] = [];
  let lastMonthKey: string | null = null;
  let lastColumn = -1;

  boxes.forEach((box, index) => {
    if (!box.date) return;

    const [year, month] = box.date.split("-");
    const monthKey = `${year}-${month}`;
    if (monthKey === lastMonthKey) return;
    lastMonthKey = monthKey;

    // The grid fills column by column, 7 rows per column.
    const column = Math.floor(index / 7);
    if (column === lastColumn) return;
    lastColumn = column;

    labels.push({
      key: monthKey,
      column,
      text: t(`monthsShort.${MONTH_KEYS[Number(month) - 1]}`),
    });
  });

  return (
    <div className="heatmap-tracker-months">
      {labels.map(({ key, column, text }) => (
        <div key={key} style={{ gridColumnStart: column + 1 }}>
          {text}
        </div>
      ))}
      {/* Sizes the grid to the same column count as the boxes below, so the
          last label can overflow into the columns after it instead of being
          clipped at the grid's edge. */}
      <div
        aria-hidden="true"
        style={{ gridColumnStart: Math.ceil(boxes.length / 7) }}
      />
    </div>
  );
}
