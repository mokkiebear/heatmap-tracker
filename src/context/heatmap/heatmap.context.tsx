import React, { useMemo } from "react";
import {
  ColorsList,
  Entry,
  TrackerData,
  TrackerSettings,
  View,
} from "src/types";
import {
  fillEntriesWithIntensity,
  getColors,
  getEntriesForYear,
} from "src/utils/core";

export const HeatmapContext = React.createContext<HeatmapContextProps | null>(
  null
);

interface HeatmapProviderProps {
  children: React.ReactNode;
  trackerData: TrackerData;
  settings: TrackerSettings;
}

export function HeatmapProvider({
  children,
  trackerData,
  settings,
}: HeatmapProviderProps) {
  const [view, setView] = React.useState(View.HeatmapTracker);

  const defaultYear = useMemo(
    () => trackerData.year ?? new Date().getFullYear(),
    [trackerData.year]
  );

  const [currentYear, setCurrentYear] = React.useState(defaultYear);

  const currentYearEntries = useMemo(
    () => getEntriesForYear(trackerData.entries, currentYear),
    [trackerData.entries, currentYear]
  );

  const mergedTrackerData: TrackerData = useMemo(() => {
    return {
      separateMonths: settings.separateMonths,
      ...trackerData,
    };
  }, [trackerData, settings]);

  const colorsList = useMemo(
    () => getColors(trackerData, settings.palettes),
    [trackerData, settings.palettes]
  );

  const entriesWithIntensity = useMemo(
    () =>
      fillEntriesWithIntensity(
        currentYearEntries,
        mergedTrackerData,
        colorsList
      ),
    [currentYearEntries, mergedTrackerData, colorsList]
  );

  return (
    <HeatmapContext.Provider
      value={{
        currentYear,
        setCurrentYear,
        currentYearEntries,
        settings,
        trackerData: mergedTrackerData,
        view,
        setView,
        colorsList,
        entriesWithIntensity,
      }}
    >
      {children}
    </HeatmapContext.Provider>
  );
}

interface HeatmapContextProps {
  currentYear: number;
  setCurrentYear: React.Dispatch<React.SetStateAction<number>>;
  currentYearEntries: Entry[];
  trackerData: TrackerData;
  settings: TrackerSettings;
  view: View;
  setView: React.Dispatch<React.SetStateAction<View>>;
  colorsList: ColorsList;
  entriesWithIntensity: Record<number, Entry>;
}

export function useHeatmapContext(): HeatmapContextProps {
  const context = React.useContext(HeatmapContext);
  if (!context) {
    throw new Error("useHeatmapContext must be used within a HeatmapProvider");
  }

  return context;
}
