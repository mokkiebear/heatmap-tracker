import { useTranslation } from "src/localization/useTranslation";
import { HeatmapOrientation } from "src/utils/report/heatmapHtml";
import { ExportOptions } from "./useExportOptions";
import { RangePreset } from "./exportRange";

// Only these two conventions are common enough to offer; anything else is
// normalized to Monday (see `initialOptions`).
const WEEK_START_DAY_OPTIONS = [
  { value: 1, key: "Monday" },
  { value: 0, key: "Sunday" },
] as const;

/** Booleans rendered as a plain checkbox row, in display order. */
const TOGGLE_GROUPS: { key: keyof ExportOptions; label: string }[][] = [
  [
    { key: "splitByMonth", label: "report.splitByMonth" },
    { key: "showMonthLabels", label: "report.showMonthLabels" },
    { key: "showWeekStartDate", label: "report.showWeekStartDate" },
    { key: "skipWeekends", label: "report.skipWeekends" },
  ],
  [
    { key: "hideSummary", label: "report.hideSummary" },
    { key: "hideTotalValue", label: "report.hideTotalValue" },
    { key: "hideAllValues", label: "report.hideAllValues" },
  ],
];

interface Props {
  options: ExportOptions;
  setOption: <K extends keyof ExportOptions>(
    key: K,
    value: ExportOptions[K],
  ) => void;
  presets: RangePreset[];
  onEditLegend: () => void;
}

function ExportOptionsForm({
  options,
  setOption,
  presets,
  onEditLegend,
}: Props) {
  const { t } = useTranslation();

  function applyPreset(preset: RangePreset) {
    const range = preset.span();
    if (!range) return;
    setOption("startDate", range.start);
    setOption("endDate", range.end);
  }

  return (
    <>
      <div className="heatmap-export__controls">
        <label>
          {t("report.startDate")}
          <input
            type="date"
            value={options.startDate}
            aria-label={t("report.startDate")}
            onChange={(e) => setOption("startDate", e.currentTarget.value)}
          />
        </label>
        <label>
          {t("report.endDate")}
          <input
            type="date"
            value={options.endDate}
            aria-label={t("report.endDate")}
            onChange={(e) => setOption("endDate", e.currentTarget.value)}
          />
        </label>
        <div className="heatmap-export__presets">
          {presets.map((preset) => (
            <button key={preset.key} onClick={() => applyPreset(preset)}>
              {t(`report.${preset.key}`)}
            </button>
          ))}
        </div>
      </div>

      <div className="heatmap-export__controls">
        <label>
          {t("report.orientation")}
          <select
            className="dropdown"
            value={options.orientation}
            onChange={(e) =>
              setOption("orientation", e.target.value as HeatmapOrientation)
            }
          >
            <option value="columns">{t("report.orientationColumns")}</option>
            <option value="rows">{t("report.orientationRows")}</option>
          </select>
        </label>
        <label>
          {t("report.weekStartDay")}
          <select
            className="dropdown"
            value={options.weekStartDay}
            onChange={(e) => setOption("weekStartDay", Number(e.target.value))}
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
            value={options.valueLabel}
            onChange={(e) => setOption("valueLabel", e.target.value)}
          />
        </label>
        <button onClick={onEditLegend}>
          {t("report.editLegend")}{" "}
          {options.legend.length > 0 ? `(${options.legend.length})` : ""}
        </button>
      </div>

      {TOGGLE_GROUPS.map((group, index) => (
        <div className="heatmap-export__controls" key={index}>
          {group.map(({ key, label }) => (
            <label className="heatmap-export__toggle" key={key}>
              <input
                type="checkbox"
                checked={options[key] as boolean}
                onChange={(e) =>
                  setOption(key, e.target.checked as ExportOptions[typeof key])
                }
              />
              {t(label)}
            </label>
          ))}
        </div>
      ))}
    </>
  );
}

export default ExportOptionsForm;
