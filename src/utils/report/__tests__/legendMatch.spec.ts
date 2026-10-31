import { LegendEntry } from "src/types";
import {
  matchLegendEntry,
  normalizeColor,
  resolveDisplayValue,
} from "../legendMatch";

describe("normalizeColor", () => {
  it("trims and lowercases", () => {
    expect(normalizeColor(" #ABC123 ")).toBe("#abc123");
  });
});

const legend: LegendEntry[] = [
  { color: "#7BC96F", label: "Workday" },
  { color: "#8b949e", label: "Leave", valueOverride: 0 },
];

describe("matchLegendEntry", () => {
  it.each([
    // Case- and whitespace-insensitively.
    [" #7bc96f ", "Workday"],
    [undefined, undefined],
    ["#000000", undefined],
  ])("matches %p to %p", (color, label) => {
    expect(matchLegendEntry(color, legend)?.label).toBe(label);
  });
});

describe("resolveDisplayValue", () => {
  it.each([
    ["the matching entry's override", 1, "#8b949e", legend, 0],
    ["the raw value for an entry with no override", 8, "#7bc96f", legend, 8],
    ["the raw value when no entry matches", 5, "#000000", legend, 5],
    ["the raw value with no legend", 5, "#8b949e", [], 5],
    [
      "undefined with no raw value to pass on",
      undefined,
      "#7bc96f",
      legend,
      undefined,
    ],
  ])("returns %s", (_, raw, color, entries, expected) => {
    expect(resolveDisplayValue(raw, color, entries)).toBe(expected);
  });
});
