import {
  RangeBound,
  RangePresetSetting,
  RangeRule,
  RangeUnit,
} from "src/types";
import {
  BUILTIN_PRESETS,
  defaultPresets,
  describeRule,
  describeRuleLogic,
  describeSpan,
  mergePresets,
  newCustomPreset,
  presetLabel,
  presetRule,
  resetPresets,
} from "../rangePresets";

const periods = (
  unit: RangeUnit,
  from: RangeBound,
  to: RangeBound,
): RangeRule => ({ kind: "periods", unit, from, to });

const custom: RangePresetSetting = {
  id: "custom-a",
  visible: true,
  label: "Semester",
  rule: periods("day", "2026-09-01", 0),
};

const ids = (presets: RangePresetSetting[]) => presets.map((p) => p.id);

describe("defaultPresets", () => {
  it("orders week, month, quarter, year, showing weeks and months only", () => {
    expect(defaultPresets()).toEqual([
      { id: "logged", visible: true },
      { id: "lastWeek", visible: true },
      { id: "weekToDate", visible: true },
      { id: "lastMonth", visible: true },
      { id: "monthToDate", visible: true },
      { id: "lastQuarter", visible: false },
      { id: "quarterToDate", visible: false },
      { id: "lastYear", visible: false },
      { id: "yearToDate", visible: false },
    ]);
  });
});

describe("mergePresets", () => {
  it("uses the defaults when nothing is saved", () => {
    expect(mergePresets(undefined)).toEqual(defaultPresets());
  });

  it("keeps the saved order, visibility and custom presets", () => {
    const saved = [
      custom,
      { id: "lastWeek", visible: true },
      { id: "logged", visible: false },
    ];

    const merged = mergePresets(saved);

    expect(merged.slice(0, 3)).toEqual(saved);
  });

  it("appends built-ins missing from an older saved list", () => {
    const merged = mergePresets([{ id: "lastMonth", visible: true }]);

    expect(ids(merged)).toEqual([
      "lastMonth",
      "logged",
      "lastWeek",
      "weekToDate",
      "monthToDate",
      "lastQuarter",
      "quarterToDate",
      "lastYear",
      "yearToDate",
    ]);
  });

  it("drops unknown built-ins and custom presets without a rule", () => {
    const merged = mergePresets([
      { id: "removedBuiltin", visible: true },
      { id: "custom-broken", visible: true, label: "No rule" },
    ]);

    expect(ids(merged)).toEqual(ids(defaultPresets()));
  });

  it("drops a custom preset whose rule is of another kind", () => {
    const saved = [
      { id: "custom-old", visible: true, rule: { kind: "since" } },
      custom,
    ] as unknown as RangePresetSetting[];

    expect(ids(mergePresets(saved))).toEqual([
      custom.id,
      ...ids(defaultPresets()),
    ]);
  });

  it("keeps a built-in's saved name but never its saved rule", () => {
    const merged = mergePresets([
      {
        id: "lastYear",
        visible: true,
        label: "  Previous FY ",
        rule: periods("day", 1, 1),
      },
      { id: "lastWeek", visible: true, label: "  " },
    ]);

    expect(merged[0]).toEqual({
      id: "lastYear",
      visible: true,
      label: "Previous FY",
    });
    expect(merged[1]).toEqual({ id: "lastWeek", visible: true });
    expect(presetRule(merged[0])).toEqual(periods("year", 1, 1));
  });
});

describe("resetPresets", () => {
  it("restores built-in order, visibility and names, keeping custom presets after them", () => {
    const edited = [
      custom,
      { id: "lastWeek", visible: true, label: "Prior week" },
      { id: "logged", visible: false },
    ];

    expect(resetPresets(edited)).toEqual([...defaultPresets(), custom]);
  });
});

describe("presetRule and presetLabel", () => {
  const t = (key: string) => `t:${key}`;

  it.each(BUILTIN_PRESETS)(
    "takes $id's rule and name from the code",
    ({ id, labelKey, rule }) => {
      expect(presetRule({ id, visible: true })).toBe(rule);
      expect(presetLabel({ id, visible: true, label: " " }, t)).toBe(
        `t:report.${labelKey}`,
      );
    },
  );

  it.each([
    [{ id: "lastWeek", visible: true, label: "Prior week" }, "Prior week"],
    [custom, "Semester"],
    [
      { ...custom, label: "  ", rule: periods("week", 0, 0) },
      "t:report.presetWeekToDate",
    ],
  ])("labels %j as %s", (preset, label) => {
    expect(presetLabel(preset, t)).toBe(label);
  });
});

describe("describeRule and describeRuleLogic", () => {
  it.each([
    // A built-in's name for a single previous or current period.
    [periods("week", 1, 1), "Last week", "Weeks ago: 1 → 1"],
    [periods("quarter", 1, 1), "Last quarter", "Quarters ago: 1 → 1"],
    [periods("month", 0, 0), "MTD", "Months ago: 0 → 0"],
    [periods("day", 1, 1), "Yesterday", "Days ago: 1 → 1"],
    [periods("day", 0, 0), "Today", "Days ago: 0 → 0"],
    // Otherwise the From → To notation, which needs no plurals.
    [periods("month", 3, 1), "Months ago: 3 → 1", "Months ago: 3 → 1"],
    [periods("day", 29, 0), "Days ago: 29 → 0", "Days ago: 29 → 0"],
    [
      periods("month", "2026-01-15", 1),
      "Jan 15, 2026 → Months ago: 1",
      "Jan 15, 2026 → Months ago: 1",
    ],
    [
      periods("month", 2, "2026-12-31"),
      "Months ago: 2 → Dec 31, 2026",
      "Months ago: 2 → Dec 31, 2026",
    ],
    // Fixed dates.
    [
      periods("day", "2026-09-01", 0),
      "Since Sep 1, 2026",
      "Sep 1, 2026 → Days ago: 0",
    ],
    [periods("day", "", 0), "Since …", "… → Days ago: 0"],
    [
      periods("day", "2026-09-01", "2026-12-18"),
      "Sep 1, 2026 – Dec 18, 2026",
      "Sep 1, 2026 → Dec 18, 2026",
    ],
    [{ kind: "logged" } as const, "Logged", "First → last logged day"],
  ])("describes %j as %s, or %s", (rule, label, logic) => {
    expect(describeRule(rule)).toBe(label);
    expect(describeRuleLogic(rule)).toBe(logic);
  });
});

describe("describeSpan", () => {
  it("gives the dates, or why there are none", () => {
    const rule = periods("month", 1, 1);
    expect(describeSpan(rule, { start: "2026-09-01", end: "2026-09-30" })).toBe(
      "Sep 1, 2026 – Sep 30, 2026",
    );
    expect(describeSpan(rule, null)).toBe("Not a valid range");
    expect(describeSpan({ kind: "logged" }, null)).toBe("No logged data");
  });
});

describe("newCustomPreset", () => {
  it("makes a visible preset with a unique custom id, dropping a blank label", () => {
    const a = newCustomPreset(periods("week", 0, 0), "  ");
    const b = newCustomPreset(periods("week", 0, 0), "Week");

    expect(a.id).toMatch(/^custom-/);
    expect(a.id).not.toBe(b.id);
    expect(a).toMatchObject({ visible: true, label: undefined });
    expect(b.label).toBe("Week");
  });
});
