import { useMemo } from "react";
import { useTranslation } from "src/localization/useTranslation";
import { useHeatmapContext } from "src/context/heatmap/heatmap.context";
import { useAppContext } from "src/context/app/app.context";
import { fillEntriesWithIntensityByDate } from "src/utils/intensity";
import { openFileInLeaf } from "src/utils/heatmapBox";
import { asyncHandler } from "src/utils/asyncHandler";
import { formatGeneratedAt } from "src/utils/report/dateLabels";
import { buildReportMarkdown } from "src/utils/report/reportMarkdown";
import { notify } from "src/utils/notify";
import { LegendModal } from "src/modals/LegendModal";
import ExportOptionsForm from "./ExportOptionsForm";
import { buildPresets } from "./exportRange";
import { buildRefreshBaseline } from "./exportLegendDefaults";
import { useExportOptions } from "./useExportOptions";
import { useReportPreview } from "./useReportPreview";
import { writeExportFile } from "./writeExportFile";

function ExportView() {
  const { t } = useTranslation();
  const app = useAppContext();
  const {
    allFilteredEntries,
    colorsList,
    trackerData,
    settings,
    currentYear,
    dateRange,
    updateSettings,
  } = useHeatmapContext();

  const entriesByDate = useMemo(
    () =>
      fillEntriesWithIntensityByDate(
        allFilteredEntries,
        trackerData.intensityConfig,
        colorsList,
      ),
    [allFilteredEntries, trackerData.intensityConfig, colorsList],
  );

  const { options, setOption, setOptions, rangeValid } = useExportOptions({
    settings,
    trackerData,
    currentYear,
    dateRange,
    entriesByDate,
    updateSettings,
  });

  const title =
    (typeof trackerData.heatmapTitle === "string" &&
      trackerData.heatmapTitle.trim()) ||
    t("report.defaultTitle");

  const { model, isLoading, bandCount, reportOptions, reportHtmlDoc } =
    useReportPreview({
      app,
      entriesByDate,
      colorsList,
      options,
      rangeValid,
      title,
      generatedAt: formatGeneratedAt(new Date()),
    });

  const presets = useMemo(() => buildPresets(entriesByDate), [entriesByDate]);

  async function handleSaveMarkdown() {
    if (!model) return;

    const file = await writeExportFile(app, {
      folder: options.exportFolder,
      title,
      startDate: options.startDate,
      endDate: options.endDate,
      extension: "md",
      content: buildReportMarkdown(model, reportOptions),
    });

    await openFileInLeaf(app, file);
    notify(t("report.savedMarkdown", { path: file.path }));
  }

  async function handleSaveHtml() {
    if (!reportHtmlDoc) return;

    const file = await writeExportFile(app, {
      folder: options.exportFolder,
      title,
      startDate: options.startDate,
      endDate: options.endDate,
      extension: "html",
      content: reportHtmlDoc,
    });

    notify(t("report.savedHtml", { path: file.path }));
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
    const initialEntries =
      options.legend.length > 0 ? options.legend : baseline;
    new LegendModal(
      app,
      initialEntries,
      baseline,
      colorsList,
      options.legendMode,
      options.gradientLabel,
      (legend, legendMode, gradientLabel) =>
        setOptions((prev) => ({ ...prev, legend, legendMode, gradientLabel })),
    ).open();
  }

  return (
    <div className="heatmap-export">
      <ExportOptionsForm
        options={options}
        setOption={setOption}
        presets={presets}
        onEditLegend={handleEditLegend}
      />

      {!rangeValid && (
        <p className="heatmap-export__error">{t("report.invalidRange")}</p>
      )}

      {rangeValid && (
        <>
          <div className="heatmap-export__summary">
            {isLoading
              ? t("report.loading")
              : t("report.summary", {
                  days: model?.summary.totalDays ?? 0,
                  value: model?.summary.totalValue ?? 0,
                  valueLabel: options.valueLabel.trim() || "value",
                })}
            {bandCount > 1 && (
              <>
                {" · "}
                {t("report.bandHint", { count: bandCount })}
              </>
            )}
          </div>

          <div className="heatmap-export__actions">
            <button
              className="mod-cta"
              disabled={isLoading}
              onClick={asyncHandler(handleSaveMarkdown)}
            >
              {t("report.saveMarkdown")}
            </button>
            <button disabled={isLoading} onClick={asyncHandler(handleSaveHtml)}>
              {t("report.saveHtml")}
            </button>
            <label className="heatmap-export__folder-label">
              {t("report.exportFolder")}
              <input
                type="text"
                placeholder={t("report.exportFolderPlaceholder")}
                value={options.exportFolder}
                onChange={(e) => setOption("exportFolder", e.target.value)}
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
