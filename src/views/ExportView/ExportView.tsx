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
import { RangePresetsModal } from "src/modals/RangePresetsModal";
import { RangePresetSetting, RangeRule } from "src/types";
import { getToday } from "src/utils/date";
import ExportOptionsForm, { PresetButton } from "./ExportOptionsForm";
import { resolveRangeRule } from "./exportRange";
import { presetLabel, presetRule } from "./rangePresets";
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

  const resolveRule = (rule: RangeRule) =>
    resolveRangeRule(rule, {
      today: getToday(),
      weekStartDay: options.weekStartDay,
      entriesByDate,
    });
  const labelFor = (preset: RangePresetSetting) => presetLabel(preset, t);

  const presets: PresetButton[] = options.rangePresets
    .filter((preset) => preset.visible)
    .map((preset) => ({
      id: preset.id,
      label: labelFor(preset),
      span: () => {
        const rule = presetRule(preset);
        return rule ? resolveRule(rule) : null;
      },
    }));

  function handleConfigurePresets() {
    new RangePresetsModal(
      app,
      options.rangePresets,
      resolveRule,
      labelFor,
      (rangePresets) => setOption("rangePresets", rangePresets),
    ).open();
  }

  async function handleSaveMarkdown() {
    if (!model) return;
    const file = await writeExportFile(app, {
      ...options,
      title,
      extension: "md",
      content: buildReportMarkdown(model, reportOptions),
    });
    await openFileInLeaf(app, file);
    notify(t("report.savedMarkdown", { path: file.path }));
  }

  async function handleSaveHtml() {
    if (!reportHtmlDoc) return;
    const file = await writeExportFile(app, {
      ...options,
      title,
      extension: "html",
      content: reportHtmlDoc,
    });
    notify(t("report.savedHtml", { path: file.path }));
  }

  function handleEditLegend() {
    const baseline = buildRefreshBaseline(entriesByDate, colorsList);
    // The baseline seeds only a first-ever legend; after that the editor shows
    // what was saved, and re-syncs only on Refresh or Reset.
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
        onConfigurePresets={handleConfigurePresets}
        onEditLegend={handleEditLegend}
      />

      {rangeValid ? (
        <>
          <div className="heatmap-export__summary">
            {isLoading
              ? t("report.loading")
              : t("report.summary", {
                  days: model?.summary.totalDays ?? 0,
                  value: model?.summary.totalValue ?? 0,
                  valueLabel:
                    options.valueLabel.trim() ||
                    t("report.valueLabelPlaceholder"),
                })}
            {bandCount > 1 &&
              ` · ${t("report.bandHint", { count: bandCount })}`}
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
      ) : (
        <p className="heatmap-export__error">{t("report.invalidRange")}</p>
      )}
    </div>
  );
}

export default ExportView;
