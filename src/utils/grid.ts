import { addDays } from "src/utils/date";

/**
 * A day and the slot it occupies in the heatmap grid.
 *
 * `position` counts slots in reading order — down a week column, then on to the
 * next — including the blank slots before the range starts and the gaps
 * `separateMonths` inserts. `weekIndex`/`weekdayIndex` are that same number
 * split into the two grid axes.
 */
export interface DayPlacement {
  date: Date;
  position: number;
  /** Column index in a column-major grid, row index in a row-major one. */
  weekIndex: number;
  /** Shifted 0–6 weekday offset. Always the day's true weekday. */
  weekdayIndex: number;
}

/**
 * Assigns every day in `[start, end]` its slot in the heatmap grid.
 *
 * This is the one place the grid's shape is decided. The live year grid and the
 * exported HTML previously each carried their own copy of it, which meant a fix
 * to one could silently leave the export disagreeing with what the user sees on
 * screen.
 *
 * The rule: a day sits at its true weekday, shifted by `weekStartDay`, and
 * `separateMonths` advances the slot counter by a whole week just before each
 * month's 1st. Advancing by exactly 7 moves the grid on by one week column
 * while leaving the weekday row untouched, so a week straddling two months is
 * split across two columns rather than being redrawn.
 */
export function placeDays(
  start: Date,
  end: Date,
  weekStartDay: number,
  separateMonths = false,
): DayPlacement[] {
  if (!Number.isInteger(weekStartDay) || weekStartDay < 0 || weekStartDay > 6) {
    throw new Error("weekStartDay must be between 0 and 6");
  }

  const placements: DayPlacement[] = [];
  let position = (start.getUTCDay() - weekStartDay + 7) % 7;

  for (
    let date = start;
    date.getTime() <= end.getTime();
    date = addDays(date, 1)
  ) {
    if (
      separateMonths &&
      date.getTime() !== start.getTime() &&
      date.getUTCDate() === 1
    ) {
      position += 7;
    }

    placements.push({
      date,
      position,
      weekIndex: Math.floor(position / 7),
      weekdayIndex: position % 7,
    });

    position += 1;
  }

  return placements;
}

/** Week columns (or rows) a placed range spans. */
export function countWeeks(placements: DayPlacement[]): number {
  return placements.length === 0
    ? 0
    : placements[placements.length - 1].weekIndex + 1;
}
