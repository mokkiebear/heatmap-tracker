import { useEffect, useMemo, useRef, useState } from "react";
import { useTranslation } from "react-i18next";
import { ColorsList, Entry } from "src/types";
import { useHeatmapContext } from "src/context/heatmap/heatmap.context";
import { useAppContext } from "src/context/app/app.context";
import { fillEntriesWithIntensityByDate } from "src/utils/intensity";
import { formatDateToISO8601, getFirstDayOfYear, getLastDayOfYear, getToday, parseUTCDate } from "src/utils/date";
import { openFileInLeaf } from "src/utils/heatmapBox";
import { formatGeneratedAt } from "src/utils/report/dateLabels";
import { readNoteBodies } from "src/utils/report/noteBody";
import { ReportModel, buildReportModel, computeDataRange } from "src/utils/report/reportModel";
import {
  EMPTY_CELL_COLOR,
  HeatmapOrientation,
  buildHeatmapGridHtml,
  countBandsInRange,
} from "src/utils/report/heatmapHtml";
import { buildReportHtml } from "src/utils/report/reportHtml";
import { buildReportMarkdown } from "src/utils/report/reportMarkdown";
import { notify } from "src/utils/notify";
import { LegendModal, LegendDisplayMode } from "src/modals/LegendModal";
import { LegendEntry } from "src/utils/report/legend";
import { normalizeColor } from "src/utils/report/legendMatch";
import { DatePicker } from "src/components/DatePicker/DatePicker";

const PREVIEW_DEBOUNCE_MS = 300;
const SETTINGS_SAVE_DEBOUNCE_MS = 500;

// Only these two conventions are common enough to offer; anything else is
// normalized to Monday (see initial weekStartDay state below).
const WEEK_START_DAY_OPTIONS = [
  { value: 1, key: "Monday" },
  { value: 0, key: "Sunday" },
] as const;

interface DateSpan {
  start: string;
  end: string;
}

/**
 * Defaults to the heatmap's active date range if one is configured
 * (monthsToShow/daysToShow/startDate+endDate); otherwise defaults to the
 * span actually covered by logged data (not the full calendar year, which
 * would mostly be empty for a partial year of logs); falls back to the full
 * year only when there's no data at all.
 */
function defaultRange(
  currentYear: number,
  dateRange: { start: Date; end: Date } | null,
  entriesByDate: Record<string, Entry>,
): DateSpan {
  if (dateRange) {
    return {
      start: formatDateToISO8601(dateRange.start) ?? "",
      end: formatDateToISO8601(dateRange.end) ?? "",
    };
  }

  const dataRange = computeDataRange(entriesByDate);
  if (dataRange) return dataRange;

  return {
    start: formatDateToISO8601(getFirstDayOfYear(currentYear)) ?? "",
    end: formatDateToISO8601(getLastDayOfYear(currentYear)) ?? "",
  };
}

/**
 * Every color the calendar can ever show — every configured intensity color
 * (in their natural low→high order), then any other custom colors actually
 * used in the current range but outside that palette, then the blank/
 * no-entry color last. There's no manual "Add row" anymore (see
 * `LegendModal`), so this is the complete, automatic source of truth for
 * what the legend editor offers.
 *
 * A color not currently used in this range defaults to excluded from the
 * summary/gradient total (and so, per `buildSummaryModel`/`buildLegendHtml`,
 * hidden from the rendered legend/summary too) until the user explicitly
 * turns it back on — otherwise a freshly auto-populated legend would
 * immediately clutter the export with zero-count categories that have never
 * actually happened yet. The blank color follows the same rule based on
 * whether the range has any gap (unlogged) days at all.
 */
export function buildDefaultLegendEntries(model: ReportModel | null, colorsList: ColorsList): LegendEntry[] {
  const usedColors = new Set<string>();
  let loggedDayCount = 0;
  model?.weeks.forEach((week) =>
    week.days.forEach((day) => {
      loggedDayCount += 1;
      if (day.color) usedColors.add(day.color);
    }),
  );

  const extraCustomColors = [...usedColors].filter((color) => !colorsList.includes(color));
  const totalDaysInRange = model
    ? Math.round(
        (parseUTCDate(model.endDate).getTime() - parseUTCDate(model.startDate).getTime()) /
          (1000 * 60 * 60 * 24),
      ) + 1
    : 0;
  const hasBlankDays = totalDaysInRange > loggedDayCount;

  return [...colorsList, ...extraCustomColors, EMPTY_CELL_COLOR].map((color) => {
    const isBlank = normalizeColor(color) === normalizeColor(EMPTY_CELL_COLOR);
    const isUsed = isBlank ? hasBlankDays : usedColors.has(color);
    return { color, label: "", includeInSummary: isUsed ? undefined : false };
  });
}

/**
 * The "Refresh" merge target — every color used ANYWHERE in `entriesByDate`
 * (already unfiltered by the export's own start/end date pickers - see
 * `ExportView`'s own `entriesByDate`, built straight from `allFilteredEntries`),
 * not just within whichever narrower range is currently selected. Without
 * this, refreshing while viewing a short range would treat a color that's
 * only used outside that range as "gone", dropping its label/weight/
 * visibility customizations instead of just leaving them dormant until the
 * range includes one of its days again. `weekStartDay` doesn't affect which
 * colors turn up, only how days would be grouped into weeks - irrelevant
 * here, so a fixed value keeps this callable without any component state.
 */
export function buildRefreshBaseline(
  entriesByDate: Record<string, Entry>,
  colorsList: ColorsList,
): LegendEntry[] {
  const fullRange = computeDataRange(entriesByDate);
  if (!fullRange) return buildDefaultLegendEntries(null, colorsList);

  const fullModel = buildReportModel({
    entriesByDate,
    colorsList,
    bodiesByPath: {},
    startDate: fullRange.start,
    endDate: fullRange.end,
    weekStartDay: 1,
  });
  return buildDefaultLegendEntries(fullModel, colorsList);
}

function sanitizeFilename(name: string): string {
  const stripped = name.replace(/<[^>]*>/g, "").replace(/[\\/:*?"<>|]/g, "-").trim();
  return stripped || "Work Log Report";
}

function joinPath(folder: string, filename: string): string {
  const trimmed = folder.replace(/^\/+|\/+$/g, "");
  return trimmed ? `${trimmed}/${filename}` : filename;
}

async function ensureFolder(app: ReturnType<typeof useAppContext>, folderPath: string): Promise<void> {
  const trimmed = folderPath.replace(/^\/+|\/+$/g, "");
  if (!trimmed) return;
  if (app.vault.getAbstractFileByPath(trimmed)) return;
  await app.vault.createFolder(trimmed);
}

async function nextAvailablePath(
  app: ReturnType<typeof useAppContext>,
  basePath: string,
): Promise<string> {
  const dotIndex = basePath.lastIndexOf(".");
  const stem = dotIndex === -1 ? basePath : basePath.slice(0, dotIndex);
  const ext = dotIndex === -1 ? "" : basePath.slice(dotIndex);

  let candidate = basePath;
  let counter = 2;
  while (app.vault.getAbstractFileByPath(candidate)) {
    candidate = `${stem} (${counter})${ext}`;
    counter += 1;
  }
  return candidate;
}

function ExportView() {
  const { t } = useTranslation();
  const app = useAppContext();
  const { allFilteredEntries, colorsList, trackerData, settings, currentYear, dateRange, updateSettings } =
    useHeatmapContext();

  const exportDefaults = settings.exportDefaults;

  const entriesByDate = useMemo(
    () => fillEntriesWithIntensityByDate(allFilteredEntries, trackerData.intensityConfig, colorsList),
    [allFilteredEntries, trackerData.intensityConfig, colorsList],
  );

  const initialRange = useMemo(
    () => defaultRange(currentYear, dateRange, entriesByDate),
    [currentYear, dateRange, entriesByDate],
  );
  const [startDate, setStartDate] = useState(exportDefaults?.startDate ?? initialRange.start);
  const [endDate, setEndDate] = useState(exportDefaults?.endDate ?? initialRange.end);
  const [bodiesByPath, setBodiesByPath] = useState<Record<string, string>>({});
  const [isLoading, setIsLoading] = useState(false);

  const [orientation, setOrientation] = useState<HeatmapOrientation>(
    exportDefaults?.orientation ?? "columns",
  );
  const [weekStartDay, setWeekStartDay] = useState(() => {
    const initial = exportDefaults?.weekStartDay ?? settings.weekStartDay;
    return initial === 0 ? 0 : 1;
  });
  const [showWeekStartDate, setShowWeekStartDate] = useState(exportDefaults?.showWeekStartDate ?? false);
  // Defaults to whatever the live heatmap actually shows, so the export starts out looking the same.
  const [splitByMonth, setSplitByMonth] = useState(
    exportDefaults?.splitByMonth ?? trackerData.separateMonths ?? true,
  );
  const [showMonthLabels, setShowMonthLabels] = useState(exportDefaults?.showMonthLabels ?? true);
  const [skipWeekends, setSkipWeekends] = useState(exportDefaults?.skipWeekends ?? false);
  const [hideSummary, setHideSummary] = useState(exportDefaults?.hideSummary ?? false);
  const [hideTotalValue, setHideTotalValue] = useState(exportDefaults?.hideTotalValue ?? false);
  const [hideAllValues, setHideAllValues] = useState(exportDefaults?.hideAllValues ?? false);
  const [valueLabel, setValueLabel] = useState(exportDefaults?.valueLabel ?? "");
  const [legend, setLegend] = useState<LegendEntry[]>(exportDefaults?.legend ?? []);
  const [legendMode, setLegendMode] = useState<LegendDisplayMode>(exportDefaults?.legendMode ?? "separate");
  const [gradientLabel, setGradientLabel] = useState(exportDefaults?.gradientLabel ?? "");
  const [exportFolder, setExportFolder] = useState(exportDefaults?.exportFolder ?? "");

  const debounceRef = useRef<number | null>(null);
  const settingsSaveTimerRef = useRef<number | null>(null);
  const hasMountedRef = useRef(false);

  const rangeValid = Boolean(startDate && endDate && startDate <= endDate);

  // Persist export preferences (including the date range) a short while
  // after the last change, so reopening the tab doesn't require redefining
  // the legend/toggles/range every time.
  useEffect(() => {
    if (!hasMountedRef.current) {
      hasMountedRef.current = true;
      return;
    }

    if (settingsSaveTimerRef.current !== null) {
      window.clearTimeout(settingsSaveTimerRef.current);
    }
    settingsSaveTimerRef.current = window.setTimeout(() => {
      updateSettings({
        exportDefaults: {
          orientation,
          weekStartDay,
          startDate,
          endDate,
          showWeekStartDate,
          splitByMonth,
          showMonthLabels,
          skipWeekends,
          hideSummary,
          hideTotalValue,
          hideAllValues,
          valueLabel,
          legend,
          legendMode,
          gradientLabel,
          exportFolder,
        },
      });
    }, SETTINGS_SAVE_DEBOUNCE_MS);

    return () => {
      if (settingsSaveTimerRef.current !== null) {
        window.clearTimeout(settingsSaveTimerRef.current);
      }
    };
  }, [
    orientation,
    weekStartDay,
    startDate,
    endDate,
    showWeekStartDate,
    splitByMonth,
    showMonthLabels,
    skipWeekends,
    hideSummary,
    hideTotalValue,
    hideAllValues,
    valueLabel,
    legend,
    legendMode,
    gradientLabel,
    exportFolder,
  ]);

  useEffect(() => {
    if (!rangeValid) return;

    let ignore = false;
    if (debounceRef.current !== null) {
      window.clearTimeout(debounceRef.current);
    }

    debounceRef.current = window.setTimeout(() => {
      setIsLoading(true);

      const inRangePaths = Object.entries(entriesByDate)
        .filter(([date]) => date >= startDate && date <= endDate)
        .map(([, entry]) => entry.filePath)
        .filter((path): path is string => Boolean(path));

      readNoteBodies(app, inRangePaths).then((bodies) => {
        if (!ignore) {
          setBodiesByPath(bodies);
          setIsLoading(false);
        }
      });
    }, PREVIEW_DEBOUNCE_MS);

    return () => {
      ignore = true;
      if (debounceRef.current !== null) {
        window.clearTimeout(debounceRef.current);
      }
    };
  }, [app, entriesByDate, startDate, endDate, rangeValid]);

  const model = useMemo(() => {
    if (!rangeValid) return null;
    return buildReportModel({
      entriesByDate,
      colorsList,
      bodiesByPath,
      startDate,
      endDate,
      weekStartDay,
      legend,
    });
  }, [entriesByDate, colorsList, bodiesByPath, startDate, endDate, weekStartDay, legend, rangeValid]);

  const bandCount = useMemo(() => {
    if (!rangeValid) return 0;
    return countBandsInRange(startDate, endDate, weekStartDay, orientation, splitByMonth);
  }, [rangeValid, startDate, endDate, weekStartDay, orientation, splitByMonth]);

  const heatmapGridHtml = useMemo(() => {
    if (!rangeValid) return "";
    return buildHeatmapGridHtml({
      entriesByDate,
      colorsList,
      startDate,
      endDate,
      weekStartDay,
      orientation,
      showWeekStartDate,
      splitByMonth,
      showMonthLabels,
      skipWeekends,
      legend,
    });
  }, [
    entriesByDate,
    colorsList,
    startDate,
    endDate,
    weekStartDay,
    orientation,
    showWeekStartDate,
    splitByMonth,
    showMonthLabels,
    skipWeekends,
    legend,
    rangeValid,
  ]);

  const title =
    (typeof trackerData.heatmapTitle === "string" && trackerData.heatmapTitle.trim()) ||
    t("report.defaultTitle");
  const generatedAt = formatGeneratedAt(new Date());

  const reportHtmlDoc = useMemo(() => {
    if (!model) return "";
    return buildReportHtml(model, {
      title,
      generatedAt,
      heatmapHtml: heatmapGridHtml,
      valueLabel,
      legend,
      legendMode,
      gradientLabel,
      colorsList,
      hideSummary,
      hideTotalValue,
      hideAllValues,
    });
  }, [
    model,
    title,
    generatedAt,
    heatmapGridHtml,
    valueLabel,
    legend,
    legendMode,
    gradientLabel,
    colorsList,
    hideSummary,
    hideTotalValue,
    hideAllValues,
  ]);

  function applyPreset(range: DateSpan) {
    setStartDate(range.start);
    setEndDate(range.end);
  }

  function handlePresetAllLoggedData() {
    const range = computeDataRange(entriesByDate);
    if (range) applyPreset(range);
  }

  // Date-relative presets anchor to the real current date, not the heatmap's
  // (possibly year-navigated) `currentYear` — "last year"/"last month" only
  // make sense relative to today.
  function handlePresetLastYear() {
    const lastYear = getToday().getUTCFullYear() - 1;
    applyPreset({
      start: formatDateToISO8601(getFirstDayOfYear(lastYear)) ?? "",
      end: formatDateToISO8601(getLastDayOfYear(lastYear)) ?? "",
    });
  }

  function handlePresetYearToDate() {
    const today = getToday();
    applyPreset({
      start: formatDateToISO8601(getFirstDayOfYear(today.getUTCFullYear())) ?? "",
      end: formatDateToISO8601(today) ?? "",
    });
  }

  function handlePresetLastMonth() {
    const today = getToday();
    const firstOfLastMonth = new Date(Date.UTC(today.getUTCFullYear(), today.getUTCMonth() - 1, 1));
    const lastOfLastMonth = new Date(Date.UTC(today.getUTCFullYear(), today.getUTCMonth(), 0));
    applyPreset({
      start: formatDateToISO8601(firstOfLastMonth) ?? "",
      end: formatDateToISO8601(lastOfLastMonth) ?? "",
    });
  }

  function handlePresetMonthToDate() {
    const today = getToday();
    const firstOfMonth = new Date(Date.UTC(today.getUTCFullYear(), today.getUTCMonth(), 1));
    applyPreset({
      start: formatDateToISO8601(firstOfMonth) ?? "",
      end: formatDateToISO8601(today) ?? "",
    });
  }

  async function handleSaveMarkdown() {
    if (!model) return;

    const markdown = buildReportMarkdown(model, {
      title,
      generatedAt,
      heatmapHtml: heatmapGridHtml,
      valueLabel,
      legend,
      legendMode,
      gradientLabel,
      colorsList,
      hideSummary,
      hideTotalValue,
      hideAllValues,
    });
    const filename = `${sanitizeFilename(title)} ${startDate} to ${endDate}.md`;
    await ensureFolder(app, exportFolder);
    const path = await nextAvailablePath(app, joinPath(exportFolder, filename));
    const file = await app.vault.create(path, markdown);

    await openFileInLeaf(app, file);
    notify(t("report.savedMarkdown", { path }));
  }

  async function handleSaveHtml() {
    if (!reportHtmlDoc) return;

    const filename = `${sanitizeFilename(title)} ${startDate} to ${endDate}.html`;
    await ensureFolder(app, exportFolder);
    const path = await nextAvailablePath(app, joinPath(exportFolder, filename));
    await app.vault.create(path, reportHtmlDoc);

    notify(t("report.savedHtml", { path }));
  }

  function handleEditLegend() {
    // Whole-calendar-scoped, not just the export's currently selected date
    // range, so every color the calendar can ever show is available to
    // populate from/reset/refresh back to - regardless of whether any of its
    // days happen to fall within the range selected right now.
    const baseline = buildRefreshBaseline(entriesByDate, colorsList);
    // Only auto-populate from the baseline on true first-time entry (nothing
    // saved yet) - once the legend exists, reopening the editor shows
    // exactly what was last saved, untouched. Re-syncing against the palette
    // (new colors, dropped stale ones) only happens when the user explicitly
    // clicks "Refresh" or "Reset" inside the modal.
    const initialEntries = legend.length > 0 ? legend : baseline;
    new LegendModal(app, initialEntries, baseline, colorsList, legendMode, gradientLabel, (entries, mode, label) => {
      setLegend(entries);
      setLegendMode(mode);
      setGradientLabel(label);
    }).open();
  }

  return (
    <div className="heatmap-export">
      <div className="heatmap-export__controls">
        <label>
          {t("report.startDate")}
          <DatePicker value={startDate} onChange={setStartDate} weekStartDay={weekStartDay} ariaLabel={t("report.startDate")} />
        </label>
        <label>
          {t("report.endDate")}
          <DatePicker value={endDate} onChange={setEndDate} weekStartDay={weekStartDay} ariaLabel={t("report.endDate")} />
        </label>
        <div className="heatmap-export__presets">
          <button onClick={handlePresetAllLoggedData}>{t("report.presetAllLoggedData")}</button>
          <button onClick={handlePresetLastYear}>{t("report.presetLastYear")}</button>
          <button onClick={handlePresetYearToDate}>{t("report.presetYearToDate")}</button>
          <button onClick={handlePresetLastMonth}>{t("report.presetLastMonth")}</button>
          <button onClick={handlePresetMonthToDate}>{t("report.presetMonthToDate")}</button>
        </div>
      </div>

      <div className="heatmap-export__controls">
        <label>
          {t("report.orientation")}
          <select
            className="dropdown"
            value={orientation}
            onChange={(e) => setOrientation(e.target.value as HeatmapOrientation)}
          >
            <option value="columns">{t("report.orientationColumns")}</option>
            <option value="rows">{t("report.orientationRows")}</option>
          </select>
        </label>
        <label>
          {t("report.weekStartDay")}
          <select
            className="dropdown"
            value={weekStartDay}
            onChange={(e) => setWeekStartDay(Number(e.target.value))}
          >
            {WEEK_START_DAY_OPTIONS.map(({ value, key }) => (
              <option key={key} value={value}>
                {t(`weekdaysLong.${key}`)}
              </option>
            ))}
          </select>
        </label>
        <label>
          {t("report.valueLabel")}
          <input
            type="text"
            placeholder={t("report.valueLabelPlaceholder")}
            value={valueLabel}
            onChange={(e) => setValueLabel(e.target.value)}
          />
        </label>
        <button onClick={handleEditLegend}>
          {t("report.editLegend")} {legend.length > 0 ? `(${legend.length})` : ""}
        </button>
      </div>

      <div className="heatmap-export__controls">
        <label className="heatmap-export__toggle">
          <input
            type="checkbox"
            checked={splitByMonth}
            onChange={(e) => setSplitByMonth(e.target.checked)}
          />
          {t("report.splitByMonth")}
        </label>
        <label className="heatmap-export__toggle">
          <input
            type="checkbox"
            checked={showMonthLabels}
            onChange={(e) => setShowMonthLabels(e.target.checked)}
          />
          {t("report.showMonthLabels")}
        </label>
        <label className="heatmap-export__toggle">
          <input
            type="checkbox"
            checked={showWeekStartDate}
            onChange={(e) => setShowWeekStartDate(e.target.checked)}
          />
          {t("report.showWeekStartDate")}
        </label>
        <label className="heatmap-export__toggle">
          <input
            type="checkbox"
            checked={skipWeekends}
            onChange={(e) => setSkipWeekends(e.target.checked)}
          />
          {t("report.skipWeekends")}
        </label>
      </div>

      <div className="heatmap-export__controls">
        <label className="heatmap-export__toggle">
          <input
            type="checkbox"
            checked={hideSummary}
            onChange={(e) => setHideSummary(e.target.checked)}
          />
          {t("report.hideSummary")}
        </label>
        <label className="heatmap-export__toggle">
          <input
            type="checkbox"
            checked={hideTotalValue}
            onChange={(e) => setHideTotalValue(e.target.checked)}
          />
          {t("report.hideTotalValue")}
        </label>
        <label className="heatmap-export__toggle">
          <input
            type="checkbox"
            checked={hideAllValues}
            onChange={(e) => setHideAllValues(e.target.checked)}
          />
          {t("report.hideAllValues")}
        </label>
      </div>

      {!rangeValid && <p className="heatmap-export__error">{t("report.invalidRange")}</p>}

      {rangeValid && (
        <>
          <div className="heatmap-export__summary">
            {isLoading
              ? t("report.loading")
              : t("report.summary", {
                  days: model?.summary.totalDays ?? 0,
                  value: model?.summary.totalValue ?? 0,
                  valueLabel: valueLabel.trim() || "value",
                })}
            {bandCount > 1 && (
              <>
                {" · "}
                {t("report.bandHint", { count: bandCount })}
              </>
            )}
          </div>

          <div className="heatmap-export__actions">
            <button className="mod-cta" disabled={isLoading} onClick={handleSaveMarkdown}>
              {t("report.saveMarkdown")}
            </button>
            <button disabled={isLoading} onClick={handleSaveHtml}>
              {t("report.saveHtml")}
            </button>
            <label className="heatmap-export__folder-label">
              {t("report.exportFolder")}
              <input
                type="text"
                placeholder={t("report.exportFolderPlaceholder")}
                value={exportFolder}
                onChange={(e) => setExportFolder(e.target.value)}
              />
            </label>
          </div>

          <iframe
            className="heatmap-export__preview"
            title={t("report.preview")}
            srcDoc={reportHtmlDoc}
            sandbox=""
          />
        </>
      )}
    </div>
  );
}

export default ExportView;
