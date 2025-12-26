import { getToday, isSameDate, getDayOfYear } from '../date';
import { fillEntriesWithIntensity } from '../intensity';
import { Entry, IntensityConfig, ColorsList } from '../../types';

describe('Issue Reproductions', () => {
  describe('Date Offset Issues (#7, #25, #35)', () => {
    it('should identify today correctly regardless of local time (simulated)', () => {
      // This is hard to test without heavy mocking, but we can check if getToday returns a Date object
      // and if isSameDate works as expected for UTC dates.
      const today = getToday();
      expect(today).toBeInstanceOf(Date);
      
      const d1 = new Date(Date.UTC(2024, 0, 1));
      const d2 = new Date(Date.UTC(2024, 0, 1));
      expect(isSameDate(d1, d2)).toBe(true);
    });

    it('should parse ISO date strings consistently as UTC', () => {
      // In many environments, new Date('2024-01-01') is treated as UTC
      // but new Date('2024/01/01') or other formats might be local.
      // We want to ensure our system treats them consistently.
      const dateStr = '2024-01-01';
      const dayOfYear = getDayOfYear(new Date(dateStr));
      expect(dayOfYear).toBe(1);
    });
  });

  describe('Entry Aggregation Issue', () => {
    it('should aggregate intensities for multiple entries on the same day', () => {
      const colors: ColorsList = ["#111", "#222", "#333"];
      const config: IntensityConfig = {
        scaleStart: 0,
        scaleEnd: 100,
        defaultIntensity: 1,
        showOutOfRange: true,
      };
      
      const entries: Entry[] = [
        { date: "2024-01-01", intensity: 10 },
        { date: "2024-01-01", intensity: 20 },
      ];

      const result = fillEntriesWithIntensity(entries, config, colors);
      
      // After fix, result[1].value (which stores the raw aggregated intensity) should be 30.
      expect(result[1].value).toBe(30);
    });

    it('should aggregate content for multiple entries on the same day', () => {
      const colors: ColorsList = ["#111", "#222", "#333"];
      const config: IntensityConfig = {
        scaleStart: 0,
        scaleEnd: 100,
        defaultIntensity: 1,
        showOutOfRange: true,
      };
      
      const entries: Entry[] = [
        { date: "2024-01-01", intensity: 10, content: "First" },
        { date: "2024-01-01", intensity: 20, content: "Second" },
      ];

      const result = fillEntriesWithIntensity(entries, config, colors);
      
      expect(result[1].value).toBe(30);
      expect(result[1].content).toBe("First\nSecond");
    });

    it('should parse different date formats consistently as UTC', () => {
      const colors: ColorsList = ["#111", "#222", "#333"];
      const config: IntensityConfig = {
        scaleStart: 0,
        scaleEnd: 100,
        defaultIntensity: 1,
        showOutOfRange: true,
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
