import { IHeatmapView } from "../../types";
import {
  HeatmapModalFormState,
  buildHeatmapConfig,
  buildPreviewTrackerData,
  createInitialFormState,
  validateHeatmapForm,
} from "../heatmapModal.utils";

function makeState(overrides: Partial<HeatmapModalFormState> = {}): HeatmapModalFormState {
  return {
    ...createInitialFormState(),
    ...overrides,
  };
}

describe("createInitialFormState", () => {
  it("defaults to sane, mostly-empty values", () => {
    const state = createInitialFormState();

    expect(state.properties).toEqual([]);
    expect(state.layout).toBe("default");
    expect(state.dateRangeMode).toBe("full-year");
    expect(state.separateMonths).toBe(true);
    expect(state.showCurrentDayBorder).toBe(true);
    expect(state.showOutOfRange).toBe(true);
    expect(state.palette).toBe("default");
    expect(state.defaultView).toBe(IHeatmapView.HeatmapTracker);
  });
});

describe("validateHeatmapForm", () => {
  it("requires at least one property", () => {
    const errors = validateHeatmapForm(makeState({ properties: [] }));
    expect(errors).toContain("Select or add at least one property to track.");
  });

  it("passes with a single valid property and no other overrides", () => {
    const errors = validateHeatmapForm(makeState({ properties: ["exercise"] }));
    expect(errors).toEqual([]);
  });

  it("requires a positive integer when dateRangeMode is 'days'", () => {
    const base = { properties: ["exercise"], dateRangeMode: "days" as const };

    expect(validateHeatmapForm(makeState({ ...base, daysToShow: "" }))).toContain(
      "Enter a positive number of days to show.",
    );
    expect(validateHeatmapForm(makeState({ ...base, daysToShow: "0" }))).toContain(
      "Enter a positive number of days to show.",
    );
    expect(validateHeatmapForm(makeState({ ...base, daysToShow: "-5" }))).toContain(
      "Enter a positive number of days to show.",
    );
    expect(validateHeatmapForm(makeState({ ...base, daysToShow: "30" }))).toEqual([]);
  });

  it("requires a positive integer when dateRangeMode is 'months'", () => {
    const base = { properties: ["exercise"], dateRangeMode: "months" as const };

    expect(validateHeatmapForm(makeState({ ...base, monthsToShow: "" }))).toContain(
      "Enter a positive number of months to show.",
    );
    expect(validateHeatmapForm(makeState({ ...base, monthsToShow: "3" }))).toEqual([]);
  });

  it("requires valid, ordered ISO dates when dateRangeMode is 'custom'", () => {
    const base = { properties: ["exercise"], dateRangeMode: "custom" as const };

    expect(
      validateHeatmapForm(makeState({ ...base, startDate: "", endDate: "" })),
    ).toContain("Enter valid start and end dates (YYYY-MM-DD).");

    expect(
      validateHeatmapForm(
        makeState({ ...base, startDate: "07/01/2026", endDate: "2026-07-31" }),
      ),
    ).toContain("Enter valid start and end dates (YYYY-MM-DD).");

    expect(
      validateHeatmapForm(
        makeState({ ...base, startDate: "2026-08-01", endDate: "2026-07-01" }),
      ),
    ).toContain("Start date must not be after end date.");

    expect(
      validateHeatmapForm(
        makeState({ ...base, startDate: "2026-07-01", endDate: "2026-07-31" }),
      ),
    ).toEqual([]);
  });

  it("requires at least one custom color when useCustomColors is on", () => {
    const base = { properties: ["exercise"], useCustomColors: true };

    expect(validateHeatmapForm(makeState({ ...base, customColors: [] }))).toContain(
      "Add at least one custom color, or turn off custom colors.",
    );
    expect(
      validateHeatmapForm(makeState({ ...base, customColors: ["#ffffff"] })),
    ).toEqual([]);
  });

  it("rejects an intensity scale start greater than its end", () => {
    const errors = validateHeatmapForm(
      makeState({ properties: ["exercise"], scaleStart: "10", scaleEnd: "5" }),
    );
    expect(errors).toContain("Intensity scale start must not be greater than scale end.");
  });

  it("allows an intensity scale with only one bound set", () => {
    const errors = validateHeatmapForm(
      makeState({ properties: ["exercise"], scaleStart: "10", scaleEnd: "" }),
    );
    expect(errors).toEqual([]);
  });
});

describe("buildHeatmapConfig", () => {
  it("collapses a single property to a plain string", () => {
    const config = buildHeatmapConfig(makeState({ properties: ["exercise"] }));
    expect(config.property).toBe("exercise");
  });

  it("keeps multiple properties as an array", () => {
    const config = buildHeatmapConfig(
      makeState({ properties: ["exercise", "steps"] }),
    );
    expect(config.property).toEqual(["exercise", "steps"]);
  });

  it("omits optional fields left at their defaults", () => {
    const config = buildHeatmapConfig(makeState({ properties: ["exercise"] }));

    expect(config.heatmapTitle).toBeUndefined();
    expect(config.heatmapSubtitle).toBeUndefined();
    expect(config.path).toBeUndefined();
    expect(config.layout).toBeUndefined();
    expect(config.disableFileCreation).toBeUndefined();
    expect(config.ui).toBeUndefined();
    expect(config.intensityConfig).toBeUndefined();
    expect(config.monthsToShow).toBeUndefined();
    expect(config.daysToShow).toBeUndefined();
    expect(config.startDate).toBeUndefined();
    expect(config.endDate).toBeUndefined();

    // Always sent, matching prior modal behavior.
    expect(config.year).toBe(makeState().year);
    expect(config.separateMonths).toBe(true);
    expect(config.showCurrentDayBorder).toBe(true);
    expect(config.colorScheme).toEqual({ paletteName: "default" });
  });

  it("includes layout only when set to 'monthly'", () => {
    expect(buildHeatmapConfig(makeState({ properties: ["p"], layout: "monthly" })).layout).toBe(
      "monthly",
    );
    expect(buildHeatmapConfig(makeState({ properties: ["p"], layout: "default" })).layout).toBeUndefined();
  });

  it("resolves the date-range mode to the matching single field", () => {
    expect(
      buildHeatmapConfig(
        makeState({ properties: ["p"], dateRangeMode: "months", monthsToShow: "3" }),
      ),
    ).toMatchObject({ monthsToShow: 3 });

    expect(
      buildHeatmapConfig(
        makeState({ properties: ["p"], dateRangeMode: "days", daysToShow: "14" }),
      ),
    ).toMatchObject({ daysToShow: 14 });

    expect(
      buildHeatmapConfig(
        makeState({
          properties: ["p"],
          dateRangeMode: "custom",
          startDate: "2026-01-01",
          endDate: "2026-01-31",
        }),
      ),
    ).toMatchObject({ startDate: "2026-01-01", endDate: "2026-01-31" });

    const fullYearConfig = buildHeatmapConfig(
      makeState({ properties: ["p"], dateRangeMode: "full-year" }),
    );
    expect(fullYearConfig.monthsToShow).toBeUndefined();
    expect(fullYearConfig.daysToShow).toBeUndefined();
    expect(fullYearConfig.startDate).toBeUndefined();
    expect(fullYearConfig.endDate).toBeUndefined();
  });

  it("uses customColors instead of paletteName when enabled and non-empty", () => {
    const config = buildHeatmapConfig(
      makeState({
        properties: ["p"],
        useCustomColors: true,
        customColors: ["#111111", "#222222"],
        palette: "danger",
      }),
    );
    expect(config.colorScheme).toEqual({ customColors: ["#111111", "#222222"] });
  });

  it("falls back to the palette when custom colors is on but empty", () => {
    const config = buildHeatmapConfig(
      makeState({ properties: ["p"], useCustomColors: true, customColors: [], palette: "danger" }),
    );
    expect(config.colorScheme).toEqual({ paletteName: "danger" });
  });

  it("builds intensityConfig only from non-default fields", () => {
    const config = buildHeatmapConfig(
      makeState({
        properties: ["p"],
        scaleStart: "10",
        scaleEnd: "100",
        defaultIntensity: "2",
        showOutOfRange: false,
        excludeFalsy: true,
      }),
    );

    expect(config.intensityConfig).toEqual({
      scaleStart: 10,
      scaleEnd: 100,
      defaultIntensity: 2,
      showOutOfRange: false,
      excludeFalsy: true,
    });
  });

  it("builds the ui object only from toggled-on fields", () => {
    const config = buildHeatmapConfig(
      makeState({
        properties: ["p"],
        hideTabs: true,
        showWeekNums: true,
        defaultView: IHeatmapView.Legend,
      }),
    );

    expect(config.ui).toEqual({
      hideTabs: true,
      showWeekNums: true,
      defaultView: IHeatmapView.Legend,
    });
  });
});

describe("buildPreviewTrackerData", () => {
  it("falls back to placeholder title/subtitle and carries through the given entries", () => {
    const entries = [{ date: "2026-01-01", intensity: 1 }];
    const preview = buildPreviewTrackerData(makeState({ properties: ["p"] }), entries);

    expect(preview.heatmapTitle).toBe("Preview title");
    expect(preview.heatmapSubtitle).toBe("Preview subtitle");
    expect(preview.entries).toBe(entries);
  });

  it("uses the user-entered title/subtitle when provided", () => {
    const preview = buildPreviewTrackerData(
      makeState({ properties: ["p"], heatmapTitle: "My habit", heatmapSubtitle: "Daily" }),
      [],
    );

    expect(preview.heatmapTitle).toBe("My habit");
    expect(preview.heatmapSubtitle).toBe("Daily");
  });
});
