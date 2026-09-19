/**
 * Regression guards for the off-by-one date bug reported four separate times:
 * #7, #25, #35 and #81 ("Off-by-one 'Today' border/streak in non-UTC
 * timezones"). The cause each time was deriving "today" from UTC, so for the
 * hours between local midnight and UTC midnight the plugin highlighted, and
 * counted streaks against, tomorrow.
 *
 * These assertions are meaningful only when the suite runs in a zone whose
 * calendar date differs from UTC's at the pinned instant — that is what
 * `npm run test:usa` (TZ=America/New_York) is for. Node resolves TZ once at
 * startup, so the zone cannot be switched from inside a test; CI runs the whole
 * suite three times instead.
 */
import { getBoxes } from "src/utils/core";
import {
  formatDateToISO8601,
  getCurrentFullYear,
  getToday,
} from "src/utils/date";
import { calculateStreaks } from "src/utils/statistics";
import { makeEntries, makeSettings, makeTrackerData } from "src/test-utils";
import { ColorsList } from "src/types";

/**
 * The local calendar date, derived without touching the code under test — so a
 * bug in `getToday` cannot cancel itself out in the expectation.
 */
function localDateISO(at: Date): string {
  return new Intl.DateTimeFormat("en-CA", {
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).format(at);
}

function shiftISO(dateISO: string, days: number): string {
  const shifted = new Date(`${dateISO}T00:00:00Z`);
  shifted.setUTCDate(shifted.getUTCDate() + days);
  return shifted.toISOString().slice(0, 10);
}

// 02:30 UTC: still the previous day everywhere west of Greenwich. Under
// TZ=America/New_York this instant is 2026-03-14 22:30 local.
const LATE_EVENING = new Date("2026-03-15T02:30:00Z");
// 03:00 UTC on New Year's Day: the previous *year* in the Americas.
const NEW_YEAR = new Date("2026-01-01T03:00:00Z");

const colors: ColorsList = ["#111", "#222", "#333"];

describe("timezone handling", () => {
  afterEach(() => {
    jest.useRealTimers();
  });

  it("treats today as the local calendar day, not the UTC one", () => {
    jest.useFakeTimers().setSystemTime(LATE_EVENING);

    expect(formatDateToISO8601(getToday())).toBe(localDateISO(LATE_EVENING));
  });

  it("uses the local year across the New Year boundary", () => {
    jest.useFakeTimers().setSystemTime(NEW_YEAR);

    expect(getCurrentFullYear()).toBe(
      Number(localDateISO(NEW_YEAR).slice(0, 4)),
    );
    expect(formatDateToISO8601(getToday())).toBe(localDateISO(NEW_YEAR));
  });

  it("puts the today border on the local day and nowhere else", () => {
    jest.useFakeTimers().setSystemTime(LATE_EVENING);
    const today = localDateISO(LATE_EVENING);

    const boxes = getBoxes(
      Number(today.slice(0, 4)),
      {},
      colors,
      makeTrackerData({ showCurrentDayBorder: true }),
      makeSettings({ weekStartDay: 1 }),
    );

    const marked = boxes.filter((box) => box.isToday);

    expect(marked).toHaveLength(1);
    expect(marked[0].date).toBe(today);
    expect(marked[0].showBorder).toBe(true);
  });

  it("counts a streak that ends today in the local zone", () => {
    jest.useFakeTimers().setSystemTime(LATE_EVENING);
    const today = localDateISO(LATE_EVENING);

    const streaks = calculateStreaks(makeEntries(shiftISO(today, -2), 3));

    expect(streaks.currentStreak).toBe(3);
    expect(formatDateToISO8601(streaks.currentStreakEndDate)).toBe(today);
  });

  it("does not credit a streak that stopped two days ago", () => {
    jest.useFakeTimers().setSystemTime(LATE_EVENING);
    const today = localDateISO(LATE_EVENING);

    const streaks = calculateStreaks(makeEntries(shiftISO(today, -5), 3));

    expect(streaks.currentStreak).toBe(0);
    expect(streaks.longestStreak).toBe(3);
  });
});
