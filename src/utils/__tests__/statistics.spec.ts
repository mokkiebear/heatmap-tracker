import { calculateStreaks } from '../statistics';
import { Entry } from '../../types';

describe('calculateStreaks', () => {
  it('should return 0 for empty entries', () => {
    const result = calculateStreaks([]);
    expect(result.currentStreak).toBe(0);
    expect(result.longestStreak).toBe(0);
  });

  it('should calculate basic streaks correctly', () => {
    const entries: Entry[] = [
      { date: '2024-01-01', intensity: 1 },
      { date: '2024-01-02', intensity: 1 },
      { date: '2024-01-03', intensity: 1 },
    ];
    // Mocking "today" is tricky because it's hardcoded as new Date() in calculateStreaks
    // But we can check longestStreak regardless of today
    const result = calculateStreaks(entries);
    expect(result.longestStreak).toBe(3);
  });

  it('should reset streak on gaps', () => {
    const entries: Entry[] = [
      { date: '2024-01-01', intensity: 1 },
      { date: '2024-01-02', intensity: 1 },
      // Gap on 2024-01-03
      { date: '2024-01-04', intensity: 1 },
    ];
    const result = calculateStreaks(entries);
    expect(result.longestStreak).toBe(2);
  });

  it('should identify the correct dates for streaks', () => {
    const entries: Entry[] = [
      { date: '2024-01-01', intensity: 1 },
      { date: '2024-01-02', intensity: 1 },
      { date: '2024-01-04', intensity: 1 },
      { date: '2024-01-05', intensity: 1 },
      { date: '2024-01-06', intensity: 1 },
    ];
    const result = calculateStreaks(entries);
    expect(result.longestStreak).toBe(3);
    expect(result.longestStreakStartDate?.toISOString().split('T')[0]).toBe('2024-01-04');
    expect(result.longestStreakEndDate?.toISOString().split('T')[0]).toBe('2024-01-06');
  });

  it('should handle unordered entries', () => {
    const entries: Entry[] = [
      { date: '2024-01-02', intensity: 1 },
      { date: '2024-01-01', intensity: 1 },
      { date: '2024-01-03', intensity: 1 },
    ];
    const result = calculateStreaks(entries);
    expect(result.longestStreak).toBe(3);
  });

  it('should simulate excludeFalsy by passing filtered entries', () => {
    // Imagine we have entries on 1st, 2nd, 3rd, but 2nd has intensity 0 and is filtered out
    const allEntries: Entry[] = [
      { date: '2024-01-01', intensity: 1 },
      { date: '2024-01-02', intensity: 0 },
      { date: '2024-01-03', intensity: 1 },
    ];
    
    const filteredEntries = allEntries.filter(e => e.intensity !== undefined && e.intensity !== null && e.intensity > 0);
    const result = calculateStreaks(filteredEntries);
    
    // Streak should be 1 because the gap on Jan 2nd (due to filtering) breaks it
    expect(result.longestStreak).toBe(1);
  });
});
