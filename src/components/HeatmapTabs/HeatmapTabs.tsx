import { useTranslation } from "react-i18next";
import HeatmapTab from "../HeatmapTab/HeatmapTab";
import { IHeatmapView } from "src/types";
import { useHeatmapContext } from "src/context/heatmap/heatmap.context";

export function HeatmapTabs() {
  const { settings } = useHeatmapContext();
  const { t } = useTranslation();

  return (
    <div className="heatmap-tracker-header__tabs">
      <HeatmapTab view={IHeatmapView.Donation} label={"Donate"} />
      {settings.enableChristmasMood ? (
        <div className="santa-claus-hat">🎄</div>
      ) : null}
      <HeatmapTab view={IHeatmapView.HeatmapTracker} label={"Heatmap"} />
      <HeatmapTab
        view={IHeatmapView.HeatmapTrackerStatistics}
        label={t("statistics.title")}
      />
      <HeatmapTab view={IHeatmapView.Documentation} label="Documentation" />
      <HeatmapTab view={IHeatmapView.Legend} label={"Legend"} />
    </div>
  );
}
