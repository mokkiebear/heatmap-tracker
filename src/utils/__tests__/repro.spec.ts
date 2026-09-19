import { getDayOfYear } from "../date";
import { fillEntriesWithIntensity } from "../intensity";
import { Entry, IntensityConfig, ColorsList } from "../../types";

describe("Issue Reproductions", () => {
  // The "today" half of #7/#25/#35/#81 is covered by `timezone.spec.ts`, which
  // pins the clock to an instant where the local and UTC dates differ. The two
  // assertions that used to live here ("getToday returns a Date", "two equal
  // UTC dates are equal") passed just as happily with the bug present.
  describe("Date Offset Issues (#7, #25, #35)", () => {
    it("should parse ISO date strings consistently as UTC", () => {
      // In many environments, new Date('2024-01-01') is treated as UTC
      // but new Date('2024/01/01') or other formats might be local.
      // We want to ensure our system treats them consistently.
      const dateStr = "2024-01-01";
      const dayOfYear = getDayOfYear(new Date(dateStr));
      expect(dayOfYear).toBe(1);
    });
  });

  describe("Entry Aggregation Issue", () => {
    it("should aggregate intensities for multiple entries on the same day", () => {
      const colors: ColorsList = ["#111", "#222", "#333"];
      const config: IntensityConfig = {
        scaleStart: 0,
        scaleEnd: 100,
        defaultIntensity: 1,
        showOutOfRange: true,
        excludeFalsy: undefined,
      };

      const entries: Entry[] = [
        { date: "2024-01-01", intensity: 10 },
        { date: "2024-01-01", intensity: 20 },
      ];

      const result = fillEntriesWithIntensity(entries, config, colors);

      // After fix, result[1].value (which stores the raw aggregated intensity) should be 30.
      expect(result[1].value).toBe(30);
    });

    it("should aggregate content for multiple entries on the same day", () => {
      const colors: ColorsList = ["#111", "#222", "#333"];
      const config: IntensityConfig = {
        scaleStart: 0,
        scaleEnd: 100,
        defaultIntensity: 1,
        showOutOfRange: true,
        excludeFalsy: undefined,
      };

      const entries: Entry[] = [
        { date: "2024-01-01", intensity: 10, content: "First" },
        { date: "2024-01-01", intensity: 20, content: "Second" },
      ];

      const result = fillEntriesWithIntensity(entries, config, colors);

      expect(result[1].value).toBe(30);
      expect(result[1].content).toBe("First\nSecond");
    });

    it("should parse different date formats consistently as UTC", () => {
      const colors: ColorsList = ["#111", "#222", "#333"];
      const config: IntensityConfig = {
        scaleStart: 0,
        scaleEnd: 100,
        defaultIntensity: 1,
        showOutOfRange: true,
        excludeFalsy: undefined,
      };

      const entries: Entry[] = [
        { date: "2024-01-01", intensity: 10 },
        { date: "2024/01/01", intensity: 20 },
      ];

      const result = fillEntriesWithIntensity(entries, config, colors);

      // Both should map to the same day (1) and be aggregated
      expect(result[1].value).toBe(30);
    });
  });
});
