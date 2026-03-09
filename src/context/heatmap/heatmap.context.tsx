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
  const [view, setView] = useState(
    trackerData.ui?.defaultView || IHeatmapView.HeatmapTracker,
  );

  const _defaultYear = useMemo(
    () => trackerData.year ?? getCurrentFullYear(),
    [trackerData.year],
  );

  const [currentYear, setCurrentYear] = useState(_defaultYear);

  const allFilteredEntries = useMemo(() => {
    return trackerData.entries.filter((e) => {
      if (trackerData.intensityConfig?.excludeFalsy && !e.intensity) {
        return false;
      }
      return true;
    });
  }, [trackerData.entries, trackerData.intensityConfig?.excludeFalsy]);

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

  const boxes = useMemo(
    () =>
      getBoxes(
        currentYear,
        entriesWithIntensity,
        colorsList,
        mergedTrackerData,
        settings,
      ),
    [
      currentYear,
      entriesWithIntensity,
      colorsList,
      mergedTrackerData,
      settings,
    ],
  );

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
        allFilteredEntries,
        boxes,
        intensityConfig: trackerData.intensityConfig,
        setCurrentYear,
        setView,
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
  allFilteredEntries: Entry[];
  boxes: Box[];
  setCurrentYear: React.Dispatch<React.SetStateAction<number>>;
  setView: React.Dispatch<React.SetStateAction<IHeatmapView>>;
}

export function useHeatmapContext(): HeatmapContextProps {
  const context = useContext(HeatmapContext);
  if (!context) {
    throw new Error("useHeatmapContext must be used within a HeatmapProvider");
  }

  return context;
}
