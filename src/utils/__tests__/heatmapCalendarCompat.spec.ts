import {
  calendarDataToTrackerData,
  readLegacyPalettes,
} from "../heatmapCalendarCompat";
import { App } from "obsidian";

describe("calendarDataToTrackerData", () => {
  it("maps a named color ramp to a palette name", () => {
    const result = calendarDataToTrackerData({ colors: "blue", entries: [] });

    expect(result.colorScheme).toEqual({ paletteName: "blue" });
  });

  it("uses the first inline ramp as custom colors, as the old plugin did", () => {
    const result = calendarDataToTrackerData({
      colors: { red: ["#a", "#b"], green: ["#c"] },
      entries: [],
    });

    expect(result.colorScheme).toEqual({ customColors: ["#a", "#b"] });
  });

  it("leaves colorScheme untouched when no colors are supplied", () => {
    expect(
      calendarDataToTrackerData({ entries: [] }).colorScheme,
    ).toBeUndefined();
  });

  it("carries entries over and drops the per-entry ramp name", () => {
    const result = calendarDataToTrackerData({
      entries: [
        { date: "2024-01-01", intensity: 3, color: "red", content: "🏋️" },
        { date: "2024-01-02" },
      ],
    });

    expect(result.entries).toEqual([
      { date: "2024-01-01", intensity: 3, content: "🏋️" },
      { date: "2024-01-02" },
    ]);
  });

  it("passes the legacy intensity fields through for mergeTrackerData", () => {
    const result = calendarDataToTrackerData({
      year: 2022,
      showCurrentDayBorder: false,
      defaultEntryIntensity: 2,
      intensityScaleStart: 10,
      intensityScaleEnd: 100,
    });

    expect(result).toMatchObject({
      year: 2022,
      showCurrentDayBorder: false,
      defaultEntryIntensity: 2,
      intensityScaleStart: 10,
      intensityScaleEnd: 100,
    });
  });
});

describe("readLegacyPalettes", () => {
  const makeApp = (read: () => Promise<string>) =>
    ({
      vault: { configDir: ".obsidian", adapter: { read } },
    }) as unknown as App;

  it("reads the old plugin's colors", async () => {
    const read = jest
      .fn()
      .mockResolvedValue(JSON.stringify({ colors: { blue: ["#1", "#2"] } }));

    await expect(readLegacyPalettes(makeApp(read))).resolves.toEqual({
      blue: ["#1", "#2"],
    });
    expect(read).toHaveBeenCalledWith(
      ".obsidian/plugins/heatmap-calendar/data.json",
    );
  });

  it("returns nothing when the old plugin was never installed", async () => {
    const read = jest.fn().mockRejectedValue(new Error("ENOENT"));

    await expect(readLegacyPalettes(makeApp(read))).resolves.toEqual({});
  });

  it("returns nothing when the file is not valid JSON", async () => {
    const read = jest.fn().mockResolvedValue("not json");

    await expect(readLegacyPalettes(makeApp(read))).resolves.toEqual({});
  });
});
