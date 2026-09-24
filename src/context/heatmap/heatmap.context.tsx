import { createContext, ReactNode, useContext, useMemo, useState } from "react";
import {
  Box,
  ColorsList,
  Entry,
  TrackerData,
  TrackerSettings,
  IHeatmapView,
  IntensityConfig,
} from "src/types";
import { getColors } from "src/utils/colors";
import { getBoxes, getBoxesForRange, getEntriesForYear } from "src/utils/core";
import {
  CalendarPeriod,
  DateRange,
  getCalendarPeriodRange,
  getCurrentFullYear,
  getToday,
  resolveDateRange,
  shiftCalendarPeriod,
} from "src/utils/date";
import {
  fillEntriesWithIntensity,
  fillEntriesWithIntensityByDate,
} from "src/utils/intensity";

export const HeatmapContext = createContext<HeatmapContextProps | null>(null);

interface HeatmapProviderProps {
  children: ReactNode;
  trackerData: TrackerData;
  settings: TrackerSettings;
  /** Called after `updateSettings` mutates `settings`, to persist it (see src/render.tsx). */
  onSettingsChange?: (settings: TrackerSettings) => void;
}

export function HeatmapProvider({
  children,
  trackerData,
  settings,
  onSettingsChange,
}: HeatmapProviderProps) {
  const [view, setView] = useState(
    trackerData.ui?.defaultView || IHeatmapView.HeatmapTracker,
  );

  const _defaultYear = useMemo(
    () => trackerData.year ?? getCurrentFullYear(),
    [trackerData.year],
  );

  const [currentYear, setCurrentYear] = useState(_defaultYear);

  const isMonthlyLayout = trackerData.layout === "monthly";

  const calendarPeriod: CalendarPeriod | null =
    trackerData.layout === "month" || trackerData.layout === "week"
      ? trackerData.layout
      : null;

  /** Any day inside the month/week currently shown; moved by `shiftPeriod`. */
  const [periodAnchor, setPeriodAnchor] = useState(getToday);

  const explicitDateRange = useMemo<DateRange | null>(
    () =>
      resolveDateRange(
        trackerData.startDate,
        trackerData.endDate,
        trackerData.daysToShow,
        trackerData.monthsToShow,
      ),
    [
      trackerData.startDate,
      trackerData.endDate,
      trackerData.daysToShow,
      trackerData.monthsToShow,
    ],
  );

  // A month/week layout without an explicit range gets the calendar period
  // around its anchor, so the header arrows page through months/weeks the way
  // they page through years in the default layout.
  const dateRange = useMemo<DateRange | null>(
    () =>
      explicitDateRange ??
      (calendarPeriod
        ? getCalendarPeriodRange(
            periodAnchor,
            calendarPeriod,
            settings.weekStartDay,
          )
        : null),
    [explicitDateRange, calendarPeriod, periodAnchor, settings.weekStartDay],
  );

  /** Whether the header pages through periods instead of years. */
  const canShiftPeriod = calendarPeriod !== null && !explicitDateRange;

  function shiftPeriod(delta: number) {
    if (!calendarPeriod) return;
    setPeriodAnchor((prev) => shiftCalendarPeriod(prev, calendarPeriod, delta));
  }

  const allFilteredEntries = useMemo(() => {
    return trackerData.entries.filter((e) => {
      if (trackerData.intensityConfig?.excludeFalsy && !e.intensity) {
        return false;
      }
      return true;
    });
  }, [trackerData.entries, trackerData.intensityConfig?.excludeFalsy]);

  // Boxes for a date range are keyed by ISO date: the range can cross a year
  // boundary, where day-of-year keys would collide.
  const usesDateKeyedBoxes =
    calendarPeriod !== null || isMonthlyLayout || explicitDateRange !== null;

  // Stays year-scoped even when the grid shows a range: this is what the
  // statistics view counts as "this year", and the full-year grid keys off it.
  const currentYearEntries = useMemo(
    () => getEntriesForYear(allFilteredEntries, currentYear),
    [allFilteredEntries, currentYear],
  );

  const mergedTrackerData: TrackerData = useMemo(() => {
    return {
      separateMonths: settings.separateMonths,
      ...trackerData,
    };
  }, [trackerData, settings]);

  const colorsList = useMemo(
    () => getColors(trackerData.colorScheme, settings.palettes),
    [trackerData, settings.palettes],
  );

  const entriesWithIntensity = useMemo(
    () =>
      fillEntriesWithIntensity(
        currentYearEntries,
        mergedTrackerData.intensityConfig,
        colorsList,
      ),
    [currentYearEntries, mergedTrackerData.intensityConfig, colorsList],
  );

  const entriesWithIntensityByDate = useMemo(
    () =>
      usesDateKeyedBoxes
        ? fillEntriesWithIntensityByDate(
            allFilteredEntries,
            mergedTrackerData.intensityConfig,
            colorsList,
          )
        : {},
    [
      usesDateKeyedBoxes,
      allFilteredEntries,
      mergedTrackerData.intensityConfig,
      colorsList,
    ],
  );

  const boxes = useMemo(() => {
    if (isMonthlyLayout) {
      // Monthly layout builds its own grid, not boxes.
      return [];
    }

    if (dateRange) {
      return getBoxesForRange(
        dateRange,
        entriesWithIntensityByDate,
        colorsList,
        mergedTrackerData,
        settings.weekStartDay,
        // The calendar layouts are a fixed 7-column grid; only the default
        // week-column grid can absorb the gap columns.
        calendarPeriod ? false : mergedTrackerData.separateMonths,
      );
    }

    return getBoxes(
      currentYear,
      entriesWithIntensity,
      colorsList,
      mergedTrackerData,
      settings,
    );
  }, [
    isMonthlyLayout,
    calendarPeriod,
    dateRange,
    currentYear,
    entriesWithIntensity,
    entriesWithIntensityByDate,
    colorsList,
    mergedTrackerData,
    settings,
  ]);

  function updateSettings(patch: Partial<TrackerSettings>) {
    Object.assign(settings, patch);
    onSettingsChange?.(settings);
  }

  return (
    <HeatmapContext.Provider
      value={{
        currentYear,
        currentYearEntries,
        settings,
        trackerData: mergedTrackerData,
        view,
        colorsList,
        entriesWithIntensity,
        entriesWithIntensityByDate,
        allFilteredEntries,
        boxes,
        dateRange,
        calendarPeriod,
        canShiftPeriod,
        shiftPeriod,
        intensityConfig: trackerData.intensityConfig,
        setCurrentYear,
        setView,
        updateSettings,
      }}
    >
      {children}
    </HeatmapContext.Provider>
  );
}

interface HeatmapContextProps {
  currentYear: number;
  currentYearEntries: Entry[];
  trackerData: TrackerData;
  intensityConfig: IntensityConfig;
  settings: TrackerSettings;
  view: IHeatmapView;
  colorsList: ColorsList;
  entriesWithIntensity: Record<number, Entry>;
  entriesWithIntensityByDate: Record<string, Entry>;
  allFilteredEntries: Entry[];
  boxes: Box[];
  dateRange: DateRange | null;
  /** Set when `layout` is `"month"` or `"week"`; null for every other layout. */
  calendarPeriod: CalendarPeriod | null;
  /** True when the header should page through months/weeks instead of years. */
  canShiftPeriod: boolean;
  shiftPeriod: (delta: number) => void;
  setCurrentYear: React.Dispatch<React.SetStateAction<number>>;
  setView: React.Dispatch<React.SetStateAction<IHeatmapView>>;
  updateSettings: (patch: Partial<TrackerSettings>) => void;
}

export function useHeatmapContext(): HeatmapContextProps {
  const context = useContext(HeatmapContext);
  if (!context) {
    throw new Error("useHeatmapContext must be used within a HeatmapProvider");
  }

  return context;
}
