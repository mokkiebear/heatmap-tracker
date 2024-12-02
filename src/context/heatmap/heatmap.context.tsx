import React, { useMemo } from "react";
import { Entry, TrackerData, TrackerSettings, View } from "src/types";
import { getEntriesForYear } from "src/utils/core";

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

  const mergedTrackerData = useMemo(() => {
    return {
      ...settings,
      ...trackerData,
    };
  }, [trackerData, settings]);

  return (
    <HeatmapContext.Provider
      value={{
        currentYear,
        setCurrentYear,
        currentYearEntries,
        trackerData,
        settings,
        mergedTrackerData,
        view,
        setView,
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
  mergedTrackerData: TrackerData;
  view: View;
  setView: React.Dispatch<React.SetStateAction<View>>;
}

export function useHeatmapContext(): HeatmapContextProps {
  const context = React.useContext(HeatmapContext);
  if (!context) {
    throw new Error("useHeatmapContext must be used within a HeatmapProvider");
  }

  return context;
}
