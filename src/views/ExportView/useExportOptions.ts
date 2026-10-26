import { useCallback, useEffect, useRef, useState } from "react";
import { Entry, ExportDefaults, TrackerData, TrackerSettings } from "src/types";
import { defaultRange } from "./exportRange";
import { mergePresets } from "./rangePresets";

const SETTINGS_SAVE_DEBOUNCE_MS = 500;

/** `ExportDefaults` with every field resolved — what the form actually edits. */
export type ExportOptions = Required<ExportDefaults>;

function initialOptions(
  settings: TrackerSettings,
  trackerData: TrackerData,
  currentYear: number,
  dateRange: { start: Date; end: Date } | null,
  entriesByDate: Record<string, Entry>,
): ExportOptions {
  const saved = settings.exportDefaults;
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
    rangePresets: mergePresets(saved?.rangePresets),
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

  // The latest edit not yet written. Leaving the tab mid-debounce must flush
  // it rather than drop it with the cancelled timer.
  const pendingRef = useRef<ExportOptions | null>(null);
  const updateSettingsRef = useRef(updateSettings);
  updateSettingsRef.current = updateSettings;
  const initialRef = useRef(options);

  useEffect(() => {
    if (options === initialRef.current) return;

    pendingRef.current = options;
    const timer = window.setTimeout(() => {
      pendingRef.current = null;
      updateSettingsRef.current({ exportDefaults: options });
    }, SETTINGS_SAVE_DEBOUNCE_MS);
    return () => window.clearTimeout(timer);
  }, [options]);

  useEffect(
    () => () => {
      if (pendingRef.current) {
        updateSettingsRef.current({ exportDefaults: pendingRef.current });
      }
    },
    [],
  );

  const rangeValid = Boolean(
    options.startDate &&
    options.endDate &&
    options.startDate <= options.endDate,
  );

  return { options, setOption, setOptions, rangeValid };
}
