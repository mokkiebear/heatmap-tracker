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
import { getBoxes, getEntriesForYear } from "src/utils/core";
import { getCurrentFullYear } from "src/utils/date";
import { fillEntriesWithIntensity } from "src/utils/intensity";

export const HeatmapContext = createContext<HeatmapContextProps | null>(null);

interface HeatmapProviderProps {
  children: ReactNode;
  trackerData: TrackerData;
  settings: TrackerSettings;
}

export function HeatmapProvider({
  children,
  trackerData,
  settings,
}: HeatmapProviderProps) {
  const [view, setView] = useState(trackerData.ui?.defaultView || IHeatmapView.HeatmapTracker);

  const _defaultYear = useMemo(
    () => trackerData.year ?? getCurrentFullYear(),
    [trackerData.year]
  );

  const [currentYear, setCurrentYear] = useState(_defaultYear);

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
    () => getColors(trackerData.colorScheme, settings.palettes),
    [trackerData, settings.palettes]
  );

  const entriesWithIntensity = useMemo(
    () =>
      fillEntriesWithIntensity(
        currentYearEntries,
        mergedTrackerData.intensityConfig,
        colorsList
      ),
    [currentYearEntries, mergedTrackerData.intensityConfig, colorsList]
  );

  const boxes = useMemo(
    () =>
      getBoxes(
        currentYear,
        entriesWithIntensity,
        colorsList,
        mergedTrackerData,
        settings
      ),
    [currentYear, entriesWithIntensity, colorsList, mergedTrackerData, settings]
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
        boxes,
        intensityConfig: trackerData.intensityConfig,
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
  intensityConfig: IntensityConfig;
  settings: TrackerSettings;
  view: IHeatmapView;
  setView: React.Dispatch<React.SetStateAction<IHeatmapView>>;
  colorsList: ColorsList;
  entriesWithIntensity: Record<number, Entry>;
  boxes: Box[];
}

export function useHeatmapContext(): HeatmapContextProps {
  const context = useContext(HeatmapContext);
  if (!context) {
    throw new Error("useHeatmapContext must be used within a HeatmapProvider");
  }

  return context;
}
