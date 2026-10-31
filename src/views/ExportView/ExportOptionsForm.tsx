import { useTranslation } from "src/localization/useTranslation";
import { HeatmapOrientation } from "src/utils/report/heatmapHtml";
import { SettingsIcon } from "src/components/icons/SettingsIcon";
import { ExportOptions } from "./useExportOptions";
import { DateSpan } from "./exportRange";

/** A visible preset button, already labelled. */
export interface PresetButton {
  id: string;
  label: string;
  span: () => DateSpan | null;
}

type Toggle = {
  [K in keyof ExportOptions]: ExportOptions[K] extends boolean ? K : never;
}[keyof ExportOptions];

/** Checkbox rows, in display order, each labelled `report.<option>`. */
export const TOGGLE_GROUPS: Toggle[][] = [
  ["splitByMonth", "showMonthLabels", "showWeekStartDate", "skipWeekends"],
  ["hideSummary", "hideTotalValue", "hideAllValues"],
];

interface Props {
  options: ExportOptions;
  setOption: <K extends keyof ExportOptions>(
    key: K,
    value: ExportOptions[K],
  ) => void;
  presets: PresetButton[];
  onConfigurePresets: () => void;
  onEditLegend: () => void;
}

function ExportOptionsForm({
  options,
  setOption,
  presets,
  onConfigurePresets,
  onEditLegend,
}: Props) {
  const { t } = useTranslation();

  function applyPreset(preset: PresetButton) {
    const range = preset.span();
    if (!range) return;
    setOption("startDate", range.start);
    setOption("endDate", range.end);
  }

  return (
    <>
      <div className="heatmap-export__controls heatmap-export__controls--range">
        <label>
          {t("report.startDate")}
          <input
            type="date"
            className="heatmap-export__date"
            value={options.startDate}
            onChange={(e) => setOption("startDate", e.currentTarget.value)}
          />
        </label>
        <label>
          {t("report.endDate")}
          <input
            type="date"
            className="heatmap-export__date"
            value={options.endDate}
            onChange={(e) => setOption("endDate", e.currentTarget.value)}
          />
        </label>
        <div className="heatmap-export__presets">
          {presets.map((preset) => (
            <button key={preset.id} onClick={() => applyPreset(preset)}>
              {preset.label}
            </button>
          ))}
          <button
            className="clickable-icon heatmap-export__presets-config"
            aria-label={t("report.configurePresets")}
            onClick={onConfigurePresets}
          >
            <SettingsIcon />
          </button>
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
            className="dropdown heatmap-export__week-start"
            value={options.weekStartDay}
            onChange={(e) => setOption("weekStartDay", Number(e.target.value))}
          >
            {/* Only these two are common enough to offer (see `initialOptions`). */}
            <option value={1}>{t("weekdaysLong.Monday")}</option>
            <option value={0}>{t("weekdaysLong.Sunday")}</option>
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
        <div
          className="heatmap-export__controls heatmap-export__controls--toggles"
          key={index}
        >
          {group.map((key) => (
            <label className="heatmap-export__toggle" key={key}>
              <input
                type="checkbox"
                checked={options[key]}
                onChange={(e) => setOption(key, e.target.checked)}
              />
              {t(`report.${key}`)}
            </label>
          ))}
        </div>
      ))}
    </>
  );
}

export default ExportOptionsForm;
