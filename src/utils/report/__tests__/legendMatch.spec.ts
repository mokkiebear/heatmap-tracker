import { LegendEntry } from "src/types";
import { matchLegendEntry, normalizeColor, resolveDisplayValue } from "../legendMatch";

describe("normalizeColor", () => {
  it("trims and lowercases", () => {
    expect(normalizeColor(" #ABC123 ")).toBe("#abc123");
  });
});

describe("matchLegendEntry", () => {
  const legend: LegendEntry[] = [
    { color: "#7BC96F", label: "Workday" },
    { color: "#8b949e", label: "Leave", valueOverride: 0 },
  ];

  it("matches case- and whitespace-insensitively", () => {
    expect(matchLegendEntry(" #7bc96f ", legend)?.label).toBe("Workday");
  });

  it("returns undefined when no color is given", () => {
    expect(matchLegendEntry(undefined, legend)).toBeUndefined();
  });

  it("returns undefined when no entry matches", () => {
    expect(matchLegendEntry("#000000", legend)).toBeUndefined();
  });
});

describe("resolveDisplayValue", () => {
  const legend: LegendEntry[] = [
    { color: "#7bc96f", label: "Workday" },
    { color: "#8b949e", label: "Leave", valueOverride: 0 },
  ];

  it("returns the override when the matching legend entry has one", () => {
    expect(resolveDisplayValue(1, "#8b949e", legend)).toBe(0);
  });

  it("returns the raw value when the matching legend entry has no override", () => {
    expect(resolveDisplayValue(8, "#7bc96f", legend)).toBe(8);
  });

  it("returns the raw value when no legend entry matches", () => {
    expect(resolveDisplayValue(5, "#000000", legend)).toBe(5);
  });

  it("returns the raw value when there is no legend at all", () => {
    expect(resolveDisplayValue(5, "#8b949e", [])).toBe(5);
  });

  it("passes through undefined when there is no raw value and no override applies", () => {
    expect(resolveDisplayValue(undefined, "#7bc96f", legend)).toBeUndefined();
  });
});
