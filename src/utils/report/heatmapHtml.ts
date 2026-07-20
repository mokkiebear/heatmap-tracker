import { ColorsList, Entry, LegendEntry } from "src/types";
import { addDays, formatDateToISO8601, getShiftedWeekdays, parseUTCDate } from "src/utils/date";
import { getWeekStartDate } from "src/utils/report/reportModel";
import { resolveDisplayValue } from "src/utils/report/legendMatch";

export function escapeHtml(value: string): string {
  return value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}

export type HeatmapOrientation = "columns" | "rows";

/**
 * Max week-slots rendered in a single band before wrapping into a new one —
 * ~1 year, matching the native plugin's normal per-year width (a typical
 * single-year export is exactly one band, unchanged from a non-wrapped
 * grid). Used as the band-wrapping unit when `splitByMonth` is off (there's
 * no clean "whole month" grouping to band by instead — see
 * `MAX_MONTHS_PER_BAND_COLUMNS`/`_ROWS` for when it's on). Columns mode
 * (weeks as columns) stacks extra bands vertically — a new horizontal line
 * below; rows mode (weeks as rows) stacks them horizontally — a new
 * vertical line alongside.
 */
export const MAX_WEEKS_PER_BAND = 53;

/**
 * Max whole months rendered in a single band when `splitByMonth` is on.
 * Under that option every month lands on its own, non-straddling run of
 * week-slots (see `placeDays`'s +7 jump), so bands can be — and read much
 * better when — apportioned by month count instead of raw week-slot count.
 * Columns mode stacks extra bands vertically (adding height is cheap), so it
 * tolerates a bigger band; rows mode stacks them horizontally, where a long
 * export would otherwise grow uncomfortably wide, so it gets a smaller cap
 * — see `MAX_BANDS_ROWS` below for the other half of that constraint.
 */
export const MAX_MONTHS_PER_BAND_COLUMNS = 10;
export const MAX_MONTHS_PER_BAND_ROWS = 6;

/**
 * Hard cap on the total *number* of bands for rows mode. Columns mode has
 * no such cap — stacking more bands just adds height, which is cheap — but
 * rows mode stacks bands horizontally, side by side, and beyond a handful
 * they'd overflow/overlap the page instead of just growing taller. Past
 * this cap, band *count* stays fixed at 4 and per-band month count grows
 * beyond `MAX_MONTHS_PER_BAND_ROWS` instead (still spread evenly).
 */
export const MAX_BANDS_ROWS = 4;

/** Fallback color for an in-range day with no entry — matches an empty/blank cell in the live heatmap. */
export const EMPTY_CELL_COLOR = "var(--background-modifier-border, #ebedf0)";

export interface HeatmapGridOptions {
  entriesByDate: Record<string, Entry>;
  colorsList: ColorsList;
  startDate: string;
  endDate: string;
  weekStartDay: number;
  orientation: HeatmapOrientation;
  showWeekStartDate?: boolean;
  /** Splits the grid at month boundaries with a blank gap, like the native plugin's `separateMonths`. */
  splitByMonth?: boolean;
  /** Renders a month-name header (run-spanning label), independent of whether the grid is actually split. */
  showMonthLabels?: boolean;
  /** Renders 5 days per week (Mon–Fri) instead of 7, dropping Sat/Sun entirely. */
  skipWeekends?: boolean;
  /** When a day's color matches an entry with `valueOverride` set, that fixed value replaces the day's own raw value in its tooltip. */
  legend?: LegendEntry[];
  cellSize?: number;
}

const WEEKDAY_LABELS = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
// Rows mode uses weekdays as column headers above narrow day-cells, where a
// 3-letter label would force each column wider than the cell itself; columns
// mode uses them in the leading label column (unconstrained), so it keeps
// the full abbreviation, matching the native plugin's own look.
const WEEKDAY_LABELS_SHORT = ["S", "M", "T", "W", "T", "F", "S"];
const MONTH_LABELS = [
  "Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec",
];

// `min-width:0` overrides the grid item default of `min-width:auto`, which
// would otherwise let a header label's own text width force its track wider
// than the fixed-size day-cell tracks below/beside it — the label must stay
// pinned to the exact same column/row size as its cells, even if its text
// has to overflow that size visually to stay readable. Used for labels that
// sit inside a fixed-size (cellSize) track: month runs and (in columns mode)
// the week-start-date row.
const LABEL_STYLE =
  "font-size:10px;color:var(--text-muted,#6b7280);white-space:nowrap;display:flex;align-items:center;justify-content:center;text-align:center;min-width:0;";

// The label column/row that sits directly beside the color grid — weekday
// names in columns mode, the week-start-date column in rows mode — is
// right-aligned with a bit of extra margin so it reads close to its own
// row/column but doesn't crowd the actual cells. These sit in an `auto`-sized
// track (grows to fit), so no `min-width:0` guard is needed here. `justify-
// self:end` is required on top of the inner flexbox alignment — the grid
// container sets `justify-items:center`, which otherwise centers this whole
// (content-sized) box within its track and leaves no slack for the inner
// `justify-content:flex-end` to actually shift the text by.
const LEADING_LABEL_STYLE =
  "font-size:10px;color:var(--text-muted,#6b7280);white-space:nowrap;display:flex;align-items:center;justify-content:flex-end;text-align:right;margin-right:4px;justify-self:end;";

// The year column in rows mode spans many week-rows but sits in its own
// leading column alongside every other band's — with horizontal text, a
// 4-digit year would force that column (and so every band) noticeably
// wider. Rotating it vertical keeps the column about as narrow as a single
// character, which matters here since rows-mode bands stack side by side.
const VERTICAL_LABEL_STYLE =
  "font-size:10px;color:var(--text-muted,#6b7280);white-space:nowrap;display:flex;align-items:center;justify-content:center;writing-mode:vertical-rl;text-orientation:mixed;";

interface DaySlot {
  date: Date;
  /** Column index in columns mode, row index in rows mode. */
  weekIndex: number;
  /** Shifted 0–6 weekday offset. */
  weekdayIndex: number;
}

/**
 * Places each real day of [start,end] into a (weekIndex, weekdayIndex) slot.
 * `weekdayIndex` is always the day's true (shifted) weekday. When
 * `splitByMonth` is on, a hard +7 position jump is inserted right before
 * each month's 1st day (after the very first day) — this is exactly the
 * native plugin's own `getBoxes()` day-by-day fill/gap algorithm (see
 * src/utils/core.ts), generalized from a fixed calendar year to an arbitrary
 * date range: the jump always advances the week-index by exactly one while
 * leaving the weekday row unchanged, splitting a straddling week across two
 * slots exactly where the live grid does.
 */
function placeDays(start: Date, end: Date, weekStartDay: number, splitByMonth: boolean): DaySlot[] {
  const slots: DaySlot[] = [];
  let position = (start.getUTCDay() - weekStartDay + 7) % 7;

  for (let date = start; date.getTime() <= end.getTime(); date = addDays(date, 1)) {
    if (splitByMonth && date.getTime() !== start.getTime() && date.getUTCDate() === 1) {
      position += 7;
    }
    slots.push({ date, weekIndex: Math.floor(position / 7), weekdayIndex: position % 7 });
    position += 1;
  }

  return slots;
}

/** How many week-slots (columns in columns mode, rows in rows mode) a range needs. */
export function countWeeksInRange(
  startDate: string,
  endDate: string,
  weekStartDay: number,
  splitByMonth = false,
): number {
  const slots = placeDays(parseUTCDate(startDate), parseUTCDate(endDate), weekStartDay, splitByMonth);
  return slots.length === 0 ? 0 : slots[slots.length - 1].weekIndex + 1;
}

interface RunEntry {
  start: number;
  span: number;
  label: string | null;
}

/** Groups a (possibly sparse) array of per-index labels into contiguous same-label runs; null is always its own span-1 run. */
function computeRuns(labels: (string | null)[]): RunEntry[] {
  const runs: RunEntry[] = [];
  let i = 0;

  while (i < labels.length) {
    const label = labels[i];
    let span = 1;
    while (label !== null && i + span < labels.length && labels[i + span] === label) {
      span += 1;
    }
    runs.push({ start: i, span, label });
    i += span;
  }

  return runs;
}

/**
 * Splits `totalUnits` into the fewest bands that keep each one at or under
 * `maxPerBand` (capped at `maxBands` if given), then spreads units evenly
 * across exactly that many bands — instead of greedily filling earlier
 * bands to the max and dumping whatever is left over into a small, lopsided
 * final band. When the `maxBands` cap is what actually limits the band
 * count (rather than `maxPerBand`), per-band count grows past `maxPerBand`
 * as needed — the band-count cap always wins.
 */
function computeEvenBandRanges(
  totalUnits: number,
  maxPerBand: number,
  maxBands?: number,
): Array<[number, number]> {
  if (totalUnits <= 0) return [];

  const naturalBands = Math.ceil(totalUnits / maxPerBand);
  const numBands = maxBands ? Math.min(naturalBands, maxBands) : naturalBands;
  const perBand = Math.ceil(totalUnits / numBands);
  const ranges: Array<[number, number]> = [];

  for (let unitStart = 0; unitStart < totalUnits; unitStart += perBand) {
    ranges.push([unitStart, Math.min(unitStart + perBand - 1, totalUnits - 1)]);
  }

  return ranges;
}

/**
 * Band ranges as [firstWeekIndex, lastWeekIndex] pairs. When `splitByMonth`
 * is off, bands are apportioned by week-slot count (`MAX_WEEKS_PER_BAND`).
 * When it's on, every month occupies its own contiguous run of week-slots
 * (see `placeDays`), so bands are apportioned by whole-month count instead —
 * using the orientation-specific month cap — with each band's week-slot
 * range widened out to cover its months' full span. The blank gap slot
 * `placeDays` inserts between two months (a `null`-labeled run) is not
 * itself a month, so it's excluded from the count. Rows mode additionally
 * caps the total band count at `MAX_BANDS_ROWS`.
 */
function computeBandRanges(
  maxWeekIndex: number,
  monthLabelByWeekIndex: (string | null)[],
  orientation: HeatmapOrientation,
  splitByMonth: boolean,
): Array<[number, number]> {
  if (maxWeekIndex === -1) return [];

  const maxBands = orientation === "rows" ? MAX_BANDS_ROWS : undefined;

  if (!splitByMonth) {
    return computeEvenBandRanges(maxWeekIndex + 1, MAX_WEEKS_PER_BAND, maxBands);
  }

  const monthRuns = computeRuns(monthLabelByWeekIndex).filter((run) => run.label !== null);
  const maxMonthsPerBand = orientation === "columns" ? MAX_MONTHS_PER_BAND_COLUMNS : MAX_MONTHS_PER_BAND_ROWS;

  return computeEvenBandRanges(monthRuns.length, maxMonthsPerBand, maxBands).map(
    ([firstRun, lastRun]): [number, number] => [
      monthRuns[firstRun].start,
      monthRuns[lastRun].start + monthRuns[lastRun].span - 1,
    ],
  );
}

/**
 * Groups a band's month runs into year runs, one per calendar year present.
 * Built from the month runs (not `computeRuns` directly on year labels)
 * because the blank gap slot between two months would otherwise fracture a
 * single year's label into multiple pieces around it; going via non-gap
 * month runs merges across those gaps so the year's span stays continuous.
 */
function computeYearRunsFromMonthRuns(monthRuns: RunEntry[], yearLabelByWeekIndex: (string | null)[]): RunEntry[] {
  const realMonthRuns = monthRuns.filter((run) => run.label !== null);
  const runs: RunEntry[] = [];
  let i = 0;

  while (i < realMonthRuns.length) {
    const year = yearLabelByWeekIndex[realMonthRuns[i].start];
    let span = 1;
    while (i + span < realMonthRuns.length && yearLabelByWeekIndex[realMonthRuns[i + span].start] === year) {
      span += 1;
    }
    const lastRun = realMonthRuns[i + span - 1];
    runs.push({
      start: realMonthRuns[i].start,
      span: lastRun.start + lastRun.span - realMonthRuns[i].start,
      label: year,
    });
    i += span;
  }

  return runs;
}

/** How many bands a range will render as, matching `buildHeatmapGridHtml`'s own band-wrapping. */
export function countBandsInRange(
  startDate: string,
  endDate: string,
  weekStartDay: number,
  orientation: HeatmapOrientation,
  splitByMonth = false,
): number {
  const slots = placeDays(parseUTCDate(startDate), parseUTCDate(endDate), weekStartDay, splitByMonth);
  const maxWeekIndex = slots.length === 0 ? -1 : Math.max(...slots.map((s) => s.weekIndex));

  const monthLabelByWeekIndex: (string | null)[] = new Array(maxWeekIndex + 1).fill(null);
  if (splitByMonth) {
    slots.forEach((slot) => {
      if (monthLabelByWeekIndex[slot.weekIndex] === null) {
        monthLabelByWeekIndex[slot.weekIndex] = MONTH_LABELS[slot.date.getUTCMonth()];
      }
    });
  }

  return computeBandRanges(maxWeekIndex, monthLabelByWeekIndex, orientation, splitByMonth).length;
}

/**
 * Renders a self-contained, fully inline-styled HTML heatmap (CSS Grid via
 * plain `<div>`s — no `<table>`, no `<style>` block, no class-name-based
 * rules) for the given range, blank days included so the shape reads as a
 * real calendar. This mirrors the native plugin's own rendering technique
 * (`display:grid` via inline-styled elements) rather than depending on any
 * external stylesheet — a `<table>` embedded in a Markdown note is subject to
 * Obsidian's own theme table CSS (padding, centering, borders), which fights
 * any styling supplied via an embedded `<style>` tag. Used verbatim by both
 * the Markdown and HTML report exports.
 *
 * `orientation: "columns"` (weeks as columns) matches the native plugin
 * heatmap; `"rows"` (weeks as rows) is a compact alternative. Ranges too
 * long for a single band are cut into multiple, stacked vertically for
 * columns / horizontally for rows — apportioned by whole months when
 * `splitByMonth` is on, by week-slots otherwise (see `computeBandRanges`).
 */
export function buildHeatmapGridHtml({
  entriesByDate,
  colorsList,
  startDate,
  endDate,
  weekStartDay,
  orientation,
  showWeekStartDate = false,
  splitByMonth = false,
  showMonthLabels = false,
  skipWeekends = false,
  legend = [],
  cellSize = 12,
}: HeatmapGridOptions): string {
  const start = parseUTCDate(startDate);
  const end = parseUTCDate(endDate);

  const weekdayLabelSource = orientation === "rows" ? WEEKDAY_LABELS_SHORT : WEEKDAY_LABELS;
  const shiftedWeekdayLabels = getShiftedWeekdays(weekdayLabelSource, weekStartDay);
  const dayEntries = shiftedWeekdayLabels
    .map((label, weekdayIndex) => ({ label, weekdayIndex, dow: (weekStartDay + weekdayIndex) % 7 }))
    .filter((d) => !skipWeekends || (d.dow !== 0 && d.dow !== 6));

  const slots = placeDays(start, end, weekStartDay, splitByMonth);
  const maxWeekIndex = slots.length === 0 ? -1 : Math.max(...slots.map((s) => s.weekIndex));

  const dateByPosition = new Map<string, Date>();
  const monthLabelByWeekIndex: (string | null)[] = new Array(maxWeekIndex + 1).fill(null);
  const yearLabelByWeekIndex: (string | null)[] = new Array(maxWeekIndex + 1).fill(null);
  // The calendar week (its Monday-equivalent start) each week-slot's earliest
  // day belongs to — precomputed once per slot so `weekHeaderLabel` can tell
  // whether a slot is a genuine week start or just the tail half of a week
  // that a month-split pushed into a new slot (see below).
  const weekStartByWeekIndex: (Date | null)[] = new Array(maxWeekIndex + 1).fill(null);

  slots.forEach((slot) => {
    dateByPosition.set(`${slot.weekIndex}:${slot.weekdayIndex}`, slot.date);
    if (monthLabelByWeekIndex[slot.weekIndex] === null) {
      monthLabelByWeekIndex[slot.weekIndex] = MONTH_LABELS[slot.date.getUTCMonth()];
    }
    if (yearLabelByWeekIndex[slot.weekIndex] === null) {
      yearLabelByWeekIndex[slot.weekIndex] = String(slot.date.getUTCFullYear());
    }
    if (weekStartByWeekIndex[slot.weekIndex] === null) {
      weekStartByWeekIndex[slot.weekIndex] = getWeekStartDate(slot.date, weekStartDay);
    }
  });

  // Only worth a header row/column when the month header is itself shown
  // (it reads relative to "on top of"/"left of" the month) and the range
  // actually crosses a year boundary — a single-year export doesn't need it.
  const showYearRow = showMonthLabels && start.getUTCFullYear() !== end.getUTCFullYear();

  /**
   * The week-start day-of-month for a slot, or "" if this slot doesn't show
   * one — either because the option is off, or because this slot is the
   * *second* half of a week a month-split cut in two (its first half, an
   * earlier slot, already showed the same date; repeating it here would look
   * like the same week appearing twice).
   */
  function weekHeaderLabel(weekIndex: number): string {
    if (!showWeekStartDate) return "";

    const weekStart = weekStartByWeekIndex[weekIndex];
    if (!weekStart) return "";

    const previousWeekStart = weekIndex > 0 ? weekStartByWeekIndex[weekIndex - 1] : null;
    const isContinuationOfSplitWeek =
      previousWeekStart !== null && previousWeekStart.getTime() === weekStart.getTime();
    if (isContinuationOfSplitWeek) return "";

    return String(weekStart.getUTCDate());
  }

  function dayCellDiv(date: Date | null): string {
    const size = `width:${cellSize}px;height:${cellSize}px;border-radius:2px;`;

    if (!date) {
      return `<div style="${size}background-color:transparent;"></div>`;
    }

    const dateKey = formatDateToISO8601(date) as string;
    const entry = entriesByDate[dateKey];
    const color = entry
      ? (entry.customColor ?? (entry.intensity !== undefined ? colorsList[entry.intensity - 1] : undefined))
      : undefined;
    const displayValue = entry ? resolveDisplayValue(entry.value, color, legend) : undefined;
    const title = displayValue !== undefined ? `${dateKey}: ${displayValue}` : dateKey;

    return `<div style="${size}background-color:${color ?? EMPTY_CELL_COLOR};" title="${escapeHtml(title)}"></div>`;
  }

  function buildBandHtml(bandStart: number, bandEnd: number): string {
    const bandSize = bandEnd - bandStart + 1;
    const monthRuns = showMonthLabels ? computeRuns(monthLabelByWeekIndex.slice(bandStart, bandEnd + 1)) : [];
    const yearRuns = showYearRow
      ? computeYearRunsFromMonthRuns(monthRuns, yearLabelByWeekIndex.slice(bandStart, bandEnd + 1))
      : [];
    const items: string[] = [];

    if (orientation === "columns") {
      const gridTemplateColumns = `auto repeat(${bandSize}, ${cellSize}px)`;
      const numHeaderRows = (showYearRow ? 1 : 0) + (showMonthLabels ? 1 : 0) + (showWeekStartDate ? 1 : 0);
      const gridTemplateRows =
        numHeaderRows > 0
          ? `repeat(${numHeaderRows}, auto) repeat(${dayEntries.length}, ${cellSize}px)`
          : `repeat(${dayEntries.length}, ${cellSize}px)`;

      let row = 1;

      if (showYearRow) {
        yearRuns.forEach((run) => {
          const col = 2 + run.start;
          items.push(
            `<div style="grid-column:${col} / span ${run.span};grid-row:${row};${LABEL_STYLE}">${
              run.label ? escapeHtml(run.label) : ""
            }</div>`,
          );
        });
        row += 1;
      }

      if (showMonthLabels) {
        monthRuns.forEach((run) => {
          const col = 2 + run.start;
          items.push(
            `<div style="grid-column:${col} / span ${run.span};grid-row:${row};${LABEL_STYLE}">${
              run.label ? escapeHtml(run.label) : ""
            }</div>`,
          );
        });
        row += 1;
      }

      if (showWeekStartDate) {
        for (let i = 0; i < bandSize; i++) {
          const col = 2 + i;
          items.push(
            `<div style="grid-column:${col};grid-row:${row};${LABEL_STYLE}">${escapeHtml(
              weekHeaderLabel(bandStart + i),
            )}</div>`,
          );
        }
        row += 1;
      }

      dayEntries.forEach(({ label, weekdayIndex }, dayRowOffset) => {
        const dayRow = row + dayRowOffset;
        items.push(
          `<div style="grid-column:1;grid-row:${dayRow};${LEADING_LABEL_STYLE}">${escapeHtml(label)}</div>`,
        );
        for (let i = 0; i < bandSize; i++) {
          const col = 2 + i;
          const date = dateByPosition.get(`${bandStart + i}:${weekdayIndex}`) ?? null;
          items.push(`<div style="grid-column:${col};grid-row:${dayRow};">${dayCellDiv(date)}</div>`);
        }
      });

      return `<div style="display:inline-grid;grid-template-columns:${gridTemplateColumns};grid-template-rows:${gridTemplateRows};gap:2px;align-items:center;justify-items:center;">${items.join("")}</div>`;
    }

    // rows mode: weeks as rows, weekdays as columns — a direct transpose of the above.
    const numLeadingCols = (showYearRow ? 1 : 0) + (showMonthLabels ? 1 : 0) + (showWeekStartDate ? 1 : 0);
    const gridTemplateColumns =
      numLeadingCols > 0
        ? `repeat(${numLeadingCols}, auto) repeat(${dayEntries.length}, ${cellSize}px)`
        : `repeat(${dayEntries.length}, ${cellSize}px)`;
    const gridTemplateRows = `auto repeat(${bandSize}, ${cellSize}px)`;

    let col = 1;
    const yearCol = showYearRow ? col++ : null;
    const monthCol = showMonthLabels ? col++ : null;
    const weekHeaderCol = showWeekStartDate ? col++ : null;
    const firstDayCol = col;

    dayEntries.forEach(({ label }, i) => {
      items.push(`<div style="grid-column:${firstDayCol + i};grid-row:1;${LABEL_STYLE}">${escapeHtml(label)}</div>`);
    });

    if (yearCol !== null) {
      yearRuns.forEach((run) => {
        const rowStart = 2 + run.start;
        items.push(
          `<div style="grid-column:${yearCol};grid-row:${rowStart} / span ${run.span};${VERTICAL_LABEL_STYLE}">${
            run.label ? escapeHtml(run.label) : ""
          }</div>`,
        );
      });
    }

    if (monthCol !== null) {
      monthRuns.forEach((run) => {
        const rowStart = 2 + run.start;
        items.push(
          `<div style="grid-column:${monthCol};grid-row:${rowStart} / span ${run.span};${LABEL_STYLE}">${
            run.label ? escapeHtml(run.label) : ""
          }</div>`,
        );
      });
    }

    for (let i = 0; i < bandSize; i++) {
      const gridRow = 2 + i;
      if (weekHeaderCol !== null) {
        items.push(
          `<div style="grid-column:${weekHeaderCol};grid-row:${gridRow};${LEADING_LABEL_STYLE}">${escapeHtml(
            weekHeaderLabel(bandStart + i),
          )}</div>`,
        );
      }
      dayEntries.forEach(({ weekdayIndex }, j) => {
        const dayCol = firstDayCol + j;
        const date = dateByPosition.get(`${bandStart + i}:${weekdayIndex}`) ?? null;
        items.push(`<div style="grid-column:${dayCol};grid-row:${gridRow};">${dayCellDiv(date)}</div>`);
      });
    }

    return `<div style="display:inline-grid;grid-template-columns:${gridTemplateColumns};grid-template-rows:${gridTemplateRows};gap:2px;align-items:center;justify-items:center;">${items.join("")}</div>`;
  }

  const bandRanges = computeBandRanges(maxWeekIndex, monthLabelByWeekIndex, orientation, splitByMonth);

  const bandsHtml = bandRanges.map(([s, e]) => buildBandHtml(s, e)).join("");
  const bandsContainerStyle =
    orientation === "columns"
      ? "display:flex;flex-direction:column;gap:8px;align-items:flex-start;"
      : "display:flex;flex-direction:row;gap:16px;align-items:flex-start;";

  return `<div style="display:block;margin:0;text-align:left;"><div style="${bandsContainerStyle}">${bandsHtml}</div></div>`;
}
