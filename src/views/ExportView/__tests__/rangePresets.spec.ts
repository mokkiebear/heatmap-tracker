import {
  RangeBound,
  RangePresetSetting,
  RangeRule,
  RangeUnit,
} from "src/types";
import {
  BUILTIN_PRESETS,
  defaultPresetLabel,
  defaultPresets,
  describeRule,
  describeRuleLogic,
  describeSpan,
  mergePresets,
  newCustomPreset,
  presetLabel,
  presetRule,
  reorderPresets,
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

  it("takes a built-in's rule and translated label from the code", () => {
    const lastWeek = { id: "lastWeek", visible: true };

    expect(presetRule(lastWeek)).toEqual(periods("week", 1, 1));
    expect(presetLabel(lastWeek, t)).toBe("t:report.presetLastWeek");
  });

  it("prefers a built-in's own name, falling back to the translated one", () => {
    const renamed = { id: "lastWeek", visible: true, label: "Prior week" };

    expect(presetLabel(renamed, t)).toBe("Prior week");
    expect(defaultPresetLabel(renamed, t)).toBe("t:report.presetLastWeek");
  });

  it("uses a custom preset's own label, or describes its rule when unnamed", () => {
    expect(presetLabel(custom, t)).toBe("Semester");
    expect(
      presetLabel({ ...custom, label: "  ", rule: periods("week", 0, 0) }, t),
    ).toBe("t:report.presetWeekToDate");
  });

  it("labels every built-in through a locale key", () => {
    for (const builtin of BUILTIN_PRESETS) {
      expect(presetLabel({ id: builtin.id, visible: true }, t)).toBe(
        `t:report.${builtin.labelKey}`,
      );
    }
  });
});

describe("describeRule", () => {
  it("reuses a built-in's name for a single previous or current period", () => {
    expect(describeRule(periods("week", 1, 1))).toBe("Last week");
    expect(describeRule(periods("quarter", 1, 1))).toBe("Last quarter");
    expect(describeRule(periods("month", 0, 0))).toBe("MTD");
    expect(describeRule(periods("day", 1, 1))).toBe("Yesterday");
    expect(describeRule(periods("day", 0, 0))).toBe("Today");
  });

  it("falls back to the From → To notation, which needs no plurals", () => {
    expect(describeRule(periods("month", 3, 1))).toBe("Months ago: 3 → 1");
    expect(describeRule(periods("day", 29, 0))).toBe("Days ago: 29 → 0");
    expect(describeRule(periods("month", "2026-01-15", 1))).toBe(
      "Jan 15, 2026 → Months ago: 1",
    );
  });

  it("names fixed dates", () => {
    expect(describeRule(custom.rule!)).toBe("Since Sep 1, 2026");
    expect(describeRule(periods("day", "", 0))).toBe("Since …");
    expect(describeRule(periods("day", "2026-09-01", "2026-12-18"))).toBe(
      "Sep 1, 2026 – Dec 18, 2026",
    );
  });

  it("translates through the given t", () => {
    const t = (key: string) => `t:${key}`;
    expect(describeRule(periods("week", 1, 1), t)).toBe(
      "t:report.presetLastWeek",
    );
  });
});

describe("describeRuleLogic", () => {
  it("states the rule as a unit label and its From → To counts", () => {
    expect(describeRuleLogic(periods("month", 1, 1))).toBe("Months ago: 1 → 1");
    expect(describeRuleLogic(periods("week", 0, 0))).toBe("Weeks ago: 0 → 0");
    expect(describeRuleLogic(periods("quarter", 3, 1))).toBe(
      "Quarters ago: 3 → 1",
    );
  });

  it("puts a fixed date in place of a count", () => {
    expect(describeRuleLogic(periods("day", "2026-09-01", 0))).toBe(
      "Sep 1, 2026 → Days ago: 0",
    );
    expect(describeRuleLogic(periods("month", 2, "2026-12-31"))).toBe(
      "Months ago: 2 → Dec 31, 2026",
    );
    expect(describeRuleLogic(periods("day", "2026-09-01", "2026-12-18"))).toBe(
      "Sep 1, 2026 → Dec 18, 2026",
    );
  });

  it("describes Logged by the data it spans", () => {
    expect(describeRuleLogic({ kind: "logged" })).toBe(
      "First → last logged day",
    );
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

describe("reorderPresets", () => {
  const list = defaultPresets();

  it("moves a preset to sit immediately before the target", () => {
    expect(
      ids(reorderPresets(list, "lastMonth", "lastWeek")).slice(0, 3),
    ).toEqual(["logged", "lastMonth", "lastWeek"]);
  });

  it("moves a preset to the end for a null target", () => {
    const moved = ids(reorderPresets(list, "logged", null));
    expect(moved[moved.length - 1]).toBe("logged");
  });

  it("is a no-op for a drop onto itself or an unknown id", () => {
    expect(reorderPresets(list, "logged", "logged")).toBe(list);
    expect(reorderPresets(list, "nope", "logged")).toBe(list);
    expect(reorderPresets(list, "logged", "nope")).toBe(list);
  });
});
