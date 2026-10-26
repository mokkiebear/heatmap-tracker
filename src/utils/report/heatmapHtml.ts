import i18n from "src/localization/i18n";
import { ColorsList, Entry, LegendEntry } from "src/types";
import { getEntryColor } from "src/utils/colors";
import { DayPlacement, countWeeks, placeDays } from "src/utils/grid";
import {
  formatDateToISO8601,
  getShiftedWeekdays,
  parseUTCDate,
} from "src/utils/date";
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
 * Week-slots per band when the grid isn't split by month: about a year, so a
 * one-year export is one band. Extra bands stack below in columns mode and
 * alongside in rows mode.
 */
export const MAX_WEEKS_PER_BAND = 53;

/**
 * Months per band when split by month, where each month has its own run of
 * week-slots. Rows mode stacks bands sideways, where width is scarce, so it
 * gets fewer months per band and at most `MAX_BANDS_ROWS` bands; past that,
 * each band takes more months instead.
 */
const MAX_MONTHS_PER_BAND_COLUMNS = 8;
const MAX_MONTHS_PER_BAND_ROWS = 6;
const MAX_BANDS_ROWS = 4;

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
}

const CELL_SIZE = 12;

const WEEKDAYS = [
  "Sunday",
  "Monday",
  "Tuesday",
  "Wednesday",
  "Thursday",
  "Friday",
  "Saturday",
];
const MONTHS = [
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

const monthLabel = (date: Date) =>
  i18n.t(`monthsShort.${MONTHS[date.getUTCMonth()]}`);

/**
 * Weekday labels from Sunday, in the plugin language. Rows mode heads narrow
 * day-cells with them, where a 3-letter label would force each column wider
 * than the cell, so it takes the one-letter form.
 */
function weekdayLabels(orientation: HeatmapOrientation): string[] {
  if (orientation === "rows") {
    const narrow = new Intl.DateTimeFormat(i18n.language, {
      weekday: "narrow",
      timeZone: "UTC",
    });
    // 2023-01-01 was a Sunday.
    return WEEKDAYS.map((_, i) => narrow.format(Date.UTC(2023, 0, 1 + i)));
  }
  return WEEKDAYS.map((day) => i18n.t(`weekdaysShort.${day}`));
}

// For labels in a cell-sized track. `min-width:0` stops the text from
// widening the track past its day-cells; the text overflows instead.
const LABEL_STYLE =
  "font-size:10px;color:var(--text-muted,#6b7280);white-space:nowrap;display:flex;align-items:center;justify-content:center;text-align:center;min-width:0;";

// For the labels right beside the grid, right-aligned. `justify-self:end` is
// needed because the grid's `justify-items:center` would otherwise center the
// box and leave the flex alignment nothing to shift.
const LEADING_LABEL_STYLE =
  "font-size:10px;color:var(--text-muted,#6b7280);white-space:nowrap;display:flex;align-items:center;justify-content:flex-end;text-align:right;margin-right:4px;justify-self:end;";

// The rows-mode year column, rotated so it stays one character wide.
const VERTICAL_LABEL_STYLE =
  "font-size:10px;color:var(--text-muted,#6b7280);white-space:nowrap;display:flex;align-items:center;justify-content:center;writing-mode:vertical-rl;text-orientation:mixed;margin-right:4px;";

// The rows-mode month column, centered across the rows it spans.
const SPANNING_LABEL_STYLE =
  "font-size:10px;color:var(--text-muted,#6b7280);white-space:nowrap;display:flex;align-items:center;justify-content:center;margin-right:4px;";

/** For each week-slot, `pick` applied to the first day placed in it. */
function perWeekSlot<T>(
  slots: DayPlacement[],
  weekCount: number,
  pick: (date: Date) => T,
): (T | null)[] {
  const values: (T | null)[] = new Array(weekCount).fill(null);
  slots.forEach((slot) => {
    if (values[slot.weekIndex] === null)
      values[slot.weekIndex] = pick(slot.date);
  });
  return values;
}

interface RunEntry {
  start: number;
  span: number;
  label: string | null;
}

/** Groups per-index labels into contiguous same-label runs; null is always its own span-1 run. */
function computeRuns(labels: (string | null)[]): RunEntry[] {
  const runs: RunEntry[] = [];
  labels.forEach((label, start) => {
    const last = runs[runs.length - 1];
    if (label !== null && last?.label === label) last.span += 1;
    else runs.push({ start, span: 1, label });
  });
  return runs;
}

/**
 * Splits `totalUnits` into the fewest bands of at most `maxPerBand` (at most
 * `maxBands` bands, which wins over `maxPerBand`), spread evenly rather than
 * leaving a small leftover band.
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
 * Band ranges as [firstWeekIndex, lastWeekIndex] pairs, by week-slot count,
 * or by whole months when split by month (every month then has its own run
 * of week-slots; the blank gap between months doesn't count as one).
 */
function computeBandRanges(
  weekCount: number,
  monthLabelByWeekIndex: (string | null)[],
  orientation: HeatmapOrientation,
  splitByMonth: boolean,
): Array<[number, number]> {
  const maxBands = orientation === "rows" ? MAX_BANDS_ROWS : undefined;

  if (!splitByMonth) {
    return computeEvenBandRanges(weekCount, MAX_WEEKS_PER_BAND, maxBands);
  }

  const monthRuns = computeRuns(monthLabelByWeekIndex).filter(
    (run) => run.label !== null,
  );
  const maxMonthsPerBand =
    orientation === "columns"
      ? MAX_MONTHS_PER_BAND_COLUMNS
      : MAX_MONTHS_PER_BAND_ROWS;

  return computeEvenBandRanges(
    monthRuns.length,
    maxMonthsPerBand,
    maxBands,
  ).map(([firstRun, lastRun]): [number, number] => [
    monthRuns[firstRun].start,
    monthRuns[lastRun].start + monthRuns[lastRun].span - 1,
  ]);
}

/**
 * A band's month runs grouped by year. Built from the month runs rather than
 * the year labels, so the blank gap between months doesn't split a year.
 */
function computeYearRunsFromMonthRuns(
  monthRuns: RunEntry[],
  yearLabelByWeekIndex: (string | null)[],
): RunEntry[] {
  const runs: RunEntry[] = [];
  monthRuns.forEach((month) => {
    if (month.label === null) return;
    const year = yearLabelByWeekIndex[month.start];
    const last = runs[runs.length - 1];
    if (last?.label === year) last.span = month.start + month.span - last.start;
    else runs.push({ start: month.start, span: month.span, label: year });
  });
  return runs;
}

/** The range's days placed on the grid, each week-slot's month, and its bands. */
function layOut(
  startDate: string,
  endDate: string,
  weekStartDay: number,
  orientation: HeatmapOrientation,
  splitByMonth: boolean,
) {
  const slots = placeDays(
    parseUTCDate(startDate),
    parseUTCDate(endDate),
    weekStartDay,
    splitByMonth,
  );
  const weekCount = countWeeks(slots);
  const monthLabels = perWeekSlot(slots, weekCount, monthLabel);
  const bands = computeBandRanges(
    weekCount,
    monthLabels,
    orientation,
    splitByMonth,
  );
  return { slots, weekCount, monthLabels, bands };
}

/** How many bands a range will render as, matching `buildHeatmapGridHtml`. */
export function countBandsInRange(
  startDate: string,
  endDate: string,
  weekStartDay: number,
  orientation: HeatmapOrientation,
  splitByMonth = false,
): number {
  return layOut(startDate, endDate, weekStartDay, orientation, splitByMonth)
    .bands.length;
}

/**
 * The heatmap as self-contained, inline-styled HTML (a CSS grid of `<div>`s,
 * blank days included), used by both report formats. Not a `<table>` and no
 * `<style>` block: inside a Markdown note, Obsidian's theme CSS restyles
 * both. Columns mode (weeks as columns) matches the in-app heatmap. Ranges
 * too long for one band wrap into several, by whole months when split by
 * month and by week-slots otherwise (see `computeBandRanges`).
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
}: HeatmapGridOptions): string {
  const start = parseUTCDate(startDate);
  const end = parseUTCDate(endDate);

  const shiftedWeekdayLabels = getShiftedWeekdays(
    weekdayLabels(orientation),
    weekStartDay,
  );
  const dayEntries = shiftedWeekdayLabels
    .map((label, weekdayIndex) => ({
      label,
      weekdayIndex,
      dow: (weekStartDay + weekdayIndex) % 7,
    }))
    .filter((d) => !skipWeekends || (d.dow !== 0 && d.dow !== 6));

  const {
    slots,
    weekCount,
    monthLabels: monthLabelByWeekIndex,
    bands,
  } = layOut(startDate, endDate, weekStartDay, orientation, splitByMonth);
  const dateByPosition = new Map(
    slots.map((slot) => [slot.position, slot.date]),
  );
  const dateAt = (weekIndex: number, weekdayIndex: number) =>
    dateByPosition.get(weekIndex * 7 + weekdayIndex) ?? null;
  const yearLabelByWeekIndex = perWeekSlot(slots, weekCount, (date) =>
    String(date.getUTCFullYear()),
  );
  // Lets `weekHeaderLabel` tell a real week start from the second half of a
  // week that a month split pushed into a new slot.
  const weekStartByWeekIndex = perWeekSlot(slots, weekCount, (date) =>
    getWeekStartDate(date, weekStartDay),
  );

  // Only with month labels, and only when the range crosses a year.
  const showYearRow =
    showMonthLabels && start.getUTCFullYear() !== end.getUTCFullYear();

  // The week-start day of month, blank on the second half of a week that a
  // month split carried into a new slot.
  const weekHeaderLabel = (weekIndex: number) => {
    const weekStart = weekStartByWeekIndex[weekIndex];
    const previous = weekStartByWeekIndex[weekIndex - 1];
    return weekStart && previous?.getTime() !== weekStart.getTime()
      ? String(weekStart.getUTCDate())
      : "";
  };

  function dayCellDiv(date: Date | null): string {
    const size = `width:${CELL_SIZE}px;height:${CELL_SIZE}px;border-radius:2px;`;

    if (!date) {
      return `<div style="${size}background-color:transparent;"></div>`;
    }

    const dateKey = formatDateToISO8601(date) as string;
    const entry = entriesByDate[dateKey];
    const color = entry ? getEntryColor(entry, colorsList) : undefined;
    const displayValue = entry
      ? resolveDisplayValue(entry.value, color, legend)
      : undefined;
    const title =
      displayValue !== undefined ? `${dateKey}: ${displayValue}` : dateKey;

    return `<div style="${size}background-color:${color ?? EMPTY_CELL_COLOR};" title="${escapeHtml(title)}"></div>`;
  }

  function buildBandHtml(bandStart: number, bandEnd: number): string {
    const bandSize = bandEnd - bandStart + 1;
    const monthRuns = showMonthLabels
      ? computeRuns(monthLabelByWeekIndex.slice(bandStart, bandEnd + 1))
      : [];
    const yearRuns = showYearRow
      ? computeYearRunsFromMonthRuns(
          monthRuns,
          yearLabelByWeekIndex.slice(bandStart, bandEnd + 1),
        )
      : [];
    const items: string[] = [];

    if (orientation === "columns") {
      const gridTemplateColumns = `auto repeat(${bandSize}, ${CELL_SIZE}px)`;
      const numHeaderRows =
        (showYearRow ? 1 : 0) +
        (showMonthLabels ? 1 : 0) +
        (showWeekStartDate ? 1 : 0);
      const gridTemplateRows =
        numHeaderRows > 0
          ? `repeat(${numHeaderRows}, auto) repeat(${dayEntries.length}, ${CELL_SIZE}px)`
          : `repeat(${dayEntries.length}, ${CELL_SIZE}px)`;

      let row = 1;

      const headerRuns: [boolean, RunEntry[]][] = [
        [showYearRow, yearRuns],
        [showMonthLabels, monthRuns],
      ];
      headerRuns.forEach(([shown, runs]) => {
        if (!shown) return;
        runs.forEach((run) => {
          const col = 2 + run.start;
          items.push(
            `<div style="grid-column:${col} / span ${run.span};grid-row:${row};${LABEL_STYLE}">${escapeHtml(
              run.label ?? "",
            )}</div>`,
          );
        });
        row += 1;
      });

      if (showWeekStartDate) {
        for (let i = 0; i < bandSize; i++) {
          const col = 2 + i;
          items.push(
            `<div style="grid-column:${col};grid-row:${row};${LABEL_STYLE}">${weekHeaderLabel(bandStart + i)}</div>`,
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
          items.push(
            `<div style="grid-column:${col};grid-row:${dayRow};">${dayCellDiv(dateAt(bandStart + i, weekdayIndex))}</div>`,
          );
        }
      });

      return `<div style="display:inline-grid;grid-template-columns:${gridTemplateColumns};grid-template-rows:${gridTemplateRows};gap:2px;align-items:center;justify-items:center;">${items.join("")}</div>`;
    }

    // rows mode: weeks as rows, weekdays as columns — a direct transpose of the above.
    const numLeadingCols =
      (showYearRow ? 1 : 0) +
      (showMonthLabels ? 1 : 0) +
      (showWeekStartDate ? 1 : 0);
    const gridTemplateColumns =
      numLeadingCols > 0
        ? `repeat(${numLeadingCols}, auto) repeat(${dayEntries.length}, ${CELL_SIZE}px)`
        : `repeat(${dayEntries.length}, ${CELL_SIZE}px)`;
    const gridTemplateRows = `auto repeat(${bandSize}, ${CELL_SIZE}px)`;

    let col = 1;
    const yearCol = showYearRow ? col++ : null;
    const monthCol = showMonthLabels ? col++ : null;
    const weekHeaderCol = showWeekStartDate ? col++ : null;
    const firstDayCol = col;

    dayEntries.forEach(({ label }, i) => {
      items.push(
        `<div style="grid-column:${firstDayCol + i};grid-row:1;${LABEL_STYLE}">${escapeHtml(label)}</div>`,
      );
    });

    if (yearCol !== null) {
      yearRuns.forEach((run) => {
        const rowStart = 2 + run.start;
        items.push(
          `<div style="grid-column:${yearCol};grid-row:${rowStart} / span ${run.span};${VERTICAL_LABEL_STYLE}">${escapeHtml(
            run.label ?? "",
          )}</div>`,
        );
      });
    }

    if (monthCol !== null) {
      monthRuns.forEach((run) => {
        const rowStart = 2 + run.start;
        items.push(
          `<div style="grid-column:${monthCol};grid-row:${rowStart} / span ${run.span};${SPANNING_LABEL_STYLE}">${escapeHtml(
            run.label ?? "",
          )}</div>`,
        );
      });
    }

    for (let i = 0; i < bandSize; i++) {
      const gridRow = 2 + i;
      if (weekHeaderCol !== null) {
        items.push(
          `<div style="grid-column:${weekHeaderCol};grid-row:${gridRow};${LEADING_LABEL_STYLE}">${weekHeaderLabel(bandStart + i)}</div>`,
        );
      }
      dayEntries.forEach(({ weekdayIndex }, j) => {
        const dayCol = firstDayCol + j;
        items.push(
          `<div style="grid-column:${dayCol};grid-row:${gridRow};">${dayCellDiv(dateAt(bandStart + i, weekdayIndex))}</div>`,
        );
      });
    }

    return `<div style="display:inline-grid;grid-template-columns:${gridTemplateColumns};grid-template-rows:${gridTemplateRows};gap:2px;align-items:center;justify-items:center;">${items.join("")}</div>`;
  }

  const bandsHtml = bands.map(([s, e]) => buildBandHtml(s, e)).join("");
  const bandsContainerStyle =
    orientation === "columns"
      ? "display:flex;flex-direction:column;gap:8px;align-items:flex-start;"
      : "display:flex;flex-direction:row;gap:16px;align-items:flex-start;";

  return `<div style="display:block;margin:0;text-align:left;"><div style="${bandsContainerStyle}">${bandsHtml}</div></div>`;
}
