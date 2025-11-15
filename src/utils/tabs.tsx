import { HeatmapIcon } from "src/components/icons/HeatmapIcon";
import { StatisticsIcon } from "src/components/icons/StatisticsIcon";
import { DocumentationIcon } from "src/components/icons/DocumentationIcon";
import { ReactNode } from "react";
import { IHeatmapView } from "src/types";
import { LegendIcon } from "src/components/icons/LegendIcon";

export const TabIconForView: Record<IHeatmapView, ReactNode> = {
  [IHeatmapView.HeatmapTracker]: <HeatmapIcon />,
  [IHeatmapView.HeatmapTrackerStatistics]: <StatisticsIcon />,
  [IHeatmapView.Documentation]: <DocumentationIcon />,
  [IHeatmapView.Legend]: <LegendIcon />,
};
