import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { Entry, ExportDefaults, TrackerData, TrackerSettings } from "src/types";
import { HeatmapOrientation } from "src/utils/report/heatmapHtml";
import { LegendEntry } from "src/utils/report/legend";
import { LegendDisplayMode } from "src/modals/LegendModal";
import { defaultRange } from "./exportRange";

const SETTINGS_SAVE_DEBOUNCE_MS = 500;

/** `ExportDefaults` with every field resolved — what the form actually edits. */
export interface ExportOptions {
  orientation: HeatmapOrientation;
  weekStartDay: number;
  startDate: string;
  endDate: string;
  showWeekStartDate: boolean;
  splitByMonth: boolean;
  showMonthLabels: boolean;
  skipWeekends: boolean;
  hideSummary: boolean;
  hideTotalValue: boolean;
  hideAllValues: boolean;
  valueLabel: string;
  legend: LegendEntry[];
  legendMode: LegendDisplayMode;
  gradientLabel: string;
  exportFolder: string;
}

/**
 * One state object rather than sixteen `useState` pairs: the saved object
 * doubles as the persistence effect's dependency, so a new option can't be
 * saved-but-not-watched — and adding one means adding a single field here.
 */
function initialOptions(
  saved: ExportDefaults | undefined,
  settings: TrackerSettings,
  trackerData: TrackerData,
  currentYear: number,
  dateRange: { start: Date; end: Date } | null,
  entriesByDate: Record<string, Entry>,
): ExportOptions {
  const range = defaultRange(currentYear, dateRange, entriesByDate);
  const weekStartDay = saved?.weekStartDay ?? settings.weekStartDay;

  return {
    orientation: saved?.orientation ?? "columns",
    // Anything other than Sunday normalizes to Monday — the only two
    // conventions the form offers.
    weekStartDay: weekStartDay === 0 ? 0 : 1,
    startDate: saved?.startDate ?? range.start,
    endDate: saved?.endDate ?? range.end,
    showWeekStartDate: saved?.showWeekStartDate ?? false,
    // Defaults to whatever the live heatmap actually shows, so the export
    // starts out looking the same.
    splitByMonth: saved?.splitByMonth ?? trackerData.separateMonths ?? true,
    showMonthLabels: saved?.showMonthLabels ?? true,
    skipWeekends: saved?.skipWeekends ?? false,
    hideSummary: saved?.hideSummary ?? false,
    hideTotalValue: saved?.hideTotalValue ?? false,
    hideAllValues: saved?.hideAllValues ?? false,
    valueLabel: saved?.valueLabel ?? "",
    legend: saved?.legend ?? [],
    legendMode: saved?.legendMode ?? "separate",
    gradientLabel: saved?.gradientLabel ?? "",
    exportFolder: saved?.exportFolder ?? "",
  };
}

/**
 * The export form's state, persisted into `settings.exportDefaults` a short
 * while after the last change so reopening the tab doesn't require
 * redefining the legend/toggles/range every time.
 */
export function useExportOptions(args: {
  settings: TrackerSettings;
  trackerData: TrackerData;
  currentYear: number;
  dateRange: { start: Date; end: Date } | null;
  entriesByDate: Record<string, Entry>;
  updateSettings: (patch: Partial<TrackerSettings>) => void;
}) {
  const { settings, updateSettings } = args;
  const [options, setOptions] = useState<ExportOptions>(() =>
    initialOptions(
      settings.exportDefaults,
      settings,
      args.trackerData,
      args.currentYear,
      args.dateRange,
      args.entriesByDate,
    ),
  );

  const setOption = useCallback(
    <K extends keyof ExportOptions>(key: K, value: ExportOptions[K]) =>
      setOptions((prev) => ({ ...prev, [key]: value })),
    [],
  );

  const saveTimerRef = useRef<number | null>(null);
  const hasMountedRef = useRef(false);

  useEffect(() => {
    if (!hasMountedRef.current) {
      hasMountedRef.current = true;
      return;
    }

    if (saveTimerRef.current !== null) {
      window.clearTimeout(saveTimerRef.current);
    }
    saveTimerRef.current = window.setTimeout(() => {
      updateSettings({ exportDefaults: options });
    }, SETTINGS_SAVE_DEBOUNCE_MS);

    return () => {
      if (saveTimerRef.current !== null) {
        window.clearTimeout(saveTimerRef.current);
      }
    };
  }, [options]);

  const rangeValid = useMemo(
    () =>
      Boolean(
        options.startDate &&
        options.endDate &&
        options.startDate <= options.endDate,
      ),
    [options.startDate, options.endDate],
  );

  return { options, setOption, setOptions, rangeValid };
}
