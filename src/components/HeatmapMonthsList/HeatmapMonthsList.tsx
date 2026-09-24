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
 * Columns a label needs before the next one starts. A label ("Sep") is about
 * 20px of text sitting in a 12px column with a 2px gap, so it bleeds over
 * roughly the next column and needs one clear column after its own.
 */
const MIN_LABEL_COLUMNS = 2;

/**
 * Month labels above the week-column grid, derived from the boxes themselves
 * rather than assumed to be January–December: the grid can show any date range
 * (`daysToShow`, `startDate`/`endDate`, ...), and that range may start
 * mid-month or cross a year boundary.
 *
 * Each label sits in the grid column holding that month's first box, so it
 * lines up with the weeks it names. A month whose first box lands too close to
 * the previous label is dropped rather than drawn on top of it — a label is
 * wider than the box column it is placed in.
 */
export function HeatmapMonthsList() {
  const { t } = useTranslation();
  const { boxes } = useHeatmapContext();

  const labels: { key: string; column: number; text: string }[] = [];
  let lastMonthKey: string | null = null;

  boxes.forEach((box, index) => {
    if (!box.date) return;

    const [year, month] = box.date.split("-");
    const monthKey = `${year}-${month}`;
    if (monthKey === lastMonthKey) return;
    lastMonthKey = monthKey;

    // The grid fills column by column, 7 rows per column.
    labels.push({
      key: monthKey,
      column: Math.floor(index / 7),
      text: t(`monthsShort.${MONTH_KEYS[Number(month) - 1]}`),
    });
  });

  // A range that starts mid-month leaves a stub of a few days in the leading
  // columns, so its label would collide with the next month's. Drop the stub
  // and let the first full month own the space: a whole month spans at least
  // four columns, so this can only ever discard the leading partial one.
  const visible = labels.filter((label, index) => {
    const next = labels[index + 1];
    return !next || next.column - label.column >= MIN_LABEL_COLUMNS;
  });

  return (
    <div className="heatmap-tracker-months">
      {visible.map(({ key, column, text }) => (
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
