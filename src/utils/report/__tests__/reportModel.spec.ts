import { Entry } from "src/types";
import {
  BuildReportModelParams,
  ReportModel,
  buildReportModel,
  computeDataRange,
  getWeekStartDate,
} from "../reportModel";

const colorsList = ["#ebedf0", "#c6e48b", "#7bc96f", "#239a3b", "#196127"];

type Fields = Omit<Entry, "date">;

/** Entries keyed by date, from each date's own fields. */
const entries = (byDate: Record<string, Fields>): Record<string, Entry> =>
  Object.fromEntries(
    Object.entries(byDate).map(([date, fields]) => [date, { date, ...fields }]),
  );

/** The report for `startDate`–`endDate`, in Monday-start weeks. */
function build(
  byDate: Record<string, Fields>,
  startDate: string,
  endDate: string,
  params: Partial<BuildReportModelParams> = {},
): ReportModel {
  return buildReportModel({
    entriesByDate: entries(byDate),
    colorsList,
    bodiesByPath: {},
    startDate,
    endDate,
    weekStartDay: 1,
    ...params,
  });
}

const days = (model: ReportModel) => model.weeks.flatMap((week) => week.days);

describe("getWeekStartDate", () => {
  it.each([
    ["2026-07-13", 1, "2026-07-13"], // already a Monday
    ["2026-07-16", 1, "2026-07-13"], // a Thursday
    ["2026-07-16", 0, "2026-07-12"], // the same Thursday, Sunday weeks
  ])(
    "starts %s's week (weekStartDay %i) on %s",
    (date, weekStartDay, start) => {
      expect(
        getWeekStartDate(new Date(date), weekStartDay)
          .toISOString()
          .slice(0, 10),
      ).toBe(start);
    },
  );
});

describe("buildReportModel", () => {
  it.each([
    [
      "leaves out days outside the range",
      ["2026-07-09", "2026-07-15", "2026-07-20"],
      ["2026-07-10", "2026-07-16"],
      [["2026-07-13", "2026-07-15"]],
    ],
    [
      "groups days into weeks by weekStartDay",
      ["2026-07-13", "2026-07-16", "2026-07-20"],
      ["2026-07-13", "2026-07-20"],
      [
        ["2026-07-13", "2026-07-13", "2026-07-16"],
        ["2026-07-20", "2026-07-20"],
      ],
    ],
    [
      "keeps a week that straddles a year boundary together",
      ["2025-12-30", "2026-01-02"],
      ["2025-12-29", "2026-01-04"],
      [["2025-12-29", "2025-12-30", "2026-01-02"]],
    ],
    ["is empty when nothing is in range", [], ["2026-07-01", "2026-07-07"], []],
  ])("%s", (_, logged, [start, end], weeks) => {
    const model = build(
      Object.fromEntries(logged.map((date) => [date, { value: 8 }])),
      start,
      end,
    );

    // Each week's start, then its days.
    expect(
      model.weeks.map((week) => [
        week.weekStart,
        ...week.days.map((d) => d.date),
      ]),
    ).toEqual(weeks);
  });

  it("totals the days and values in range", () => {
    expect(
      build(
        { "2026-07-13": { value: 8 }, "2026-07-14": { value: 5 } },
        "2026-07-13",
        "2026-07-14",
      ).summary,
    ).toEqual({ totalDays: 2, totalValue: 13 });
    expect(build({}, "2026-07-01", "2026-07-07").summary).toEqual({
      totalDays: 0,
      totalValue: 0,
    });
  });

  it("resolves the day color from customColor first, then the mapped intensity", () => {
    const [custom, mapped] = days(
      build(
        {
          "2026-07-13": { intensity: 3, customColor: "#d18616" },
          "2026-07-14": { intensity: 2 },
        },
        "2026-07-13",
        "2026-07-14",
      ),
    );

    expect(custom.color).toBe("#d18616");
    expect(mapped.color).toBe(colorsList[1]); // intensity 2 -> index 1
  });

  // `emoji` decorates the grid; `content` is the day's text. Putting a glyph
  // in `content` (the pre-`emoji` workaround) made the exported report a
  // column of lone "✅"s, which is what the separate field avoids.
  it.each([
    ["the note behind filePath", { filePath: "a.md" }, "- did a thing"],
    [
      "nothing for a filePath with no note",
      { filePath: "missing.md" },
      undefined,
    ],
    [
      "its content, not its emoji",
      { content: "5km, felt good", emoji: "🏃" },
      "5km, felt good",
    ],
    ["nothing for an emoji-only day", { emoji: "🧘" }, undefined],
  ])("takes a day's body from %s", (_, fields: Fields, body) => {
    const model = build({ "2026-07-13": fields }, "2026-07-13", "2026-07-13", {
      bodiesByPath: { "a.md": "- did a thing" },
    });

    expect(days(model)[0].body).toBe(body);
  });

  it("attaches the rendered HTML for the note behind each day", () => {
    const [a, b] = days(
      build(
        {
          "2026-01-05": { value: 1, filePath: "a.md" },
          "2026-01-06": { value: 1, filePath: "b.md" },
        },
        "2026-01-05",
        "2026-01-06",
        {
          bodiesByPath: { "a.md": "$x$", "b.md": "text" },
          bodyHtmlByPath: { "a.md": '<span class="katex"></span>' },
        },
      ),
    );

    expect(a.bodyHtml).toBe('<span class="katex"></span>');
    expect(a.body).toBe("$x$");
    expect(b.bodyHtml).toBeUndefined();
  });

  it("carries each entry's countAs shares onto its day", () => {
    const [shared, plain] = days(
      build(
        {
          "2026-01-01": {
            value: 3,
            countAs: { Workday: 0.5, "Annual Leave": 0.5 },
          },
          "2026-01-02": { value: 8 },
        },
        "2026-01-01",
        "2026-01-02",
      ),
    );

    expect(shared.countAs).toEqual({ Workday: 0.5, "Annual Leave": 0.5 });
    expect(plain.countAs).toBeUndefined();
  });

  it("replaces a day's value with its legend entry's valueOverride", () => {
    // A leave day keeps a placeholder value so it stays colored, but the
    // legend says Leave always reports as 0.
    const model = build(
      { "2026-07-13": { value: 1, intensity: 1, customColor: "#8b949e" } },
      "2026-07-13",
      "2026-07-13",
      { legend: [{ color: "#8b949e", label: "Leave", valueOverride: 0 }] },
    );

    expect(days(model)[0].value).toBe(0);
    expect(model.summary.totalValue).toBe(0);
  });
});

describe("computeDataRange", () => {
  it.each([
    [[], null],
    [["2026-01-01"], { start: "2026-01-01", end: "2026-01-01" }],
    [
      ["2026-06-01", "2026-03-15", "2026-05-20"],
      { start: "2026-03-15", end: "2026-06-01" },
    ],
  ])("spans %j as %j, whatever the order", (dates, range) => {
    const byDate = Object.fromEntries(dates.map((date) => [date, {}]));

    expect(computeDataRange(entries(byDate))).toEqual(range);
  });
});
