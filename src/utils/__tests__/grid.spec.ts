import { countWeeks, placeDays } from "../grid";
import { getBoxes } from "../core";
import { countWeeksInRange } from "../report/heatmapHtml";
import {
  formatDateToISO8601,
  getFirstDayOfYear,
  getLastDayOfYear,
  parseUTCDate,
} from "../date";
import { ColorsList, TrackerData, TrackerSettings } from "src/types";

const d = (iso: string) => parseUTCDate(iso);

describe("placeDays", () => {
  it("starts a range at its shifted weekday offset", () => {
    // 2021-01-01 is a Friday. Week starting Monday puts it 4 slots in.
    expect(placeDays(d("2021-01-01"), d("2021-01-01"), 1)[0]).toMatchObject({
      position: 4,
      weekIndex: 0,
      weekdayIndex: 4,
    });

    // Week starting Sunday puts the same day 5 slots in.
    expect(placeDays(d("2021-01-01"), d("2021-01-01"), 0)[0]).toMatchObject({
      position: 5,
      weekdayIndex: 5,
    });
  });

  it("advances one slot per day and wraps into the next week", () => {
    const placements = placeDays(d("2026-07-13"), d("2026-07-20"), 1);

    expect(placements).toHaveLength(8);
    expect(placements[0]).toMatchObject({ weekIndex: 0, weekdayIndex: 0 });
    expect(placements[6]).toMatchObject({ weekIndex: 0, weekdayIndex: 6 });
    expect(placements[7]).toMatchObject({ weekIndex: 1, weekdayIndex: 0 });
  });

  it("keeps every day on its true weekday row", () => {
    for (const weekStartDay of [0, 1, 6]) {
      for (const { date, weekdayIndex } of placeDays(
        d("2024-01-01"),
        d("2024-03-31"),
        weekStartDay,
        true,
      )) {
        expect(weekdayIndex).toBe((date.getUTCDay() - weekStartDay + 7) % 7);
      }
    }
  });

  it("inserts exactly one week before each month when separateMonths is on", () => {
    const plain = placeDays(d("2026-01-01"), d("2026-03-31"), 1);
    const split = placeDays(d("2026-01-01"), d("2026-03-31"), 1, true);

    // February and March each gain a week; January is the first month.
    const last = (p: typeof plain) => p[p.length - 1].position;
    expect(last(split) - last(plain)).toBe(14);
  });

  it("rejects an invalid weekStartDay", () => {
    expect(() => placeDays(d("2026-01-01"), d("2026-01-02"), 7)).toThrow(
      "weekStartDay must be between 0 and 6",
    );
    expect(() => placeDays(d("2026-01-01"), d("2026-01-02"), NaN)).toThrow(
      "weekStartDay must be between 0 and 6",
    );
  });

  it("returns nothing when the range is inverted", () => {
    expect(placeDays(d("2026-01-10"), d("2026-01-01"), 1)).toEqual([]);
    expect(countWeeks([])).toBe(0);
  });
});

describe("the live grid and the exported grid agree", () => {
  const colors: ColorsList = ["#1", "#2", "#3", "#4", "#5"];

  const boxesFor = (year: number, weekStartDay: number, separate: boolean) =>
    getBoxes(
      year,
      {},
      colors,
      { separateMonths: separate, showCurrentDayBorder: false } as TrackerData,
      { weekStartDay } as TrackerSettings,
    );

  // The two used to be separate implementations of the same algorithm, so a fix
  // to one could leave the export silently disagreeing with what's on screen.
  it.each([
    [2021, 1, false],
    [2021, 0, false],
    [2024, 1, true],
    [2024, 6, true],
    [2026, 0, true],
  ])(
    "year %i, weekStartDay %i, separateMonths %s",
    (year, weekStartDay, separate) => {
      const boxes = boxesFor(year, weekStartDay, separate);
      const placements = placeDays(
        getFirstDayOfYear(year),
        getLastDayOfYear(year),
        weekStartDay,
        separate,
      );

      const positionByDate = new Map(
        placements.map((p) => [formatDateToISO8601(p.date), p.position]),
      );

      // Every dated box sits at exactly the slot the export would place it in.
      let dated = 0;
      boxes.forEach((box, index) => {
        if (!box.date) return;
        dated++;
        expect(positionByDate.get(box.date)).toBe(index);
      });

      expect(dated).toBe(placements.length);

      // And both agree on how many week columns the year needs.
      expect(
        countWeeksInRange(
          formatDateToISO8601(getFirstDayOfYear(year)) as string,
          formatDateToISO8601(getLastDayOfYear(year)) as string,
          weekStartDay,
          separate,
        ),
      ).toBe(Math.ceil(boxes.length / 7));
    },
  );
});
