import { useTranslation } from "react-i18next";
import HeatmapTab from "../HeatmapTab/HeatmapTab";
import { IHeatmapView } from "src/types";

export function HeatmapTabs() {
  const { t } = useTranslation();

  return (
    <div className="heatmap-tracker-header__tabs">
      <HeatmapTab view={IHeatmapView.HeatmapTracker} label={t('view.heatmap-tracker')} />
      <HeatmapTab
        view={IHeatmapView.HeatmapTrackerStatistics}
        label={t('view.heatmap-tracker-statistics')}
      />
      <HeatmapTab view={IHeatmapView.Legend} label={t('view.legend')} />
      <HeatmapTab view={IHeatmapView.Documentation} label={t('view.documentation')} />
    </div>
  );
}
