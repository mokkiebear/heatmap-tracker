import { IHeatmapView } from "./types";
import { useHeatmapContext } from "./context/heatmap/heatmap.context";
import React, { useEffect } from "react";
import { useTranslation } from "src/localization/useTranslation";

import { HeatmapHeader } from "./components/HeatmapHeader/HeatmapHeader";

// Static imports: an Obsidian plugin ships as a single main.js (esbuild runs
// with no `splitting`), so lazy() + Suspense only added a skeleton that never
// had a chance to render.
import HeatmapTrackerView from "./views/HeatmapTrackerView/HeatmapTrackerView";
import StatisticsView from "./views/StatisticsView/StatisticsView";
import DocumentationView from "./views/DocumentationView/DocumentationView";
import LegendView from "./views/LegendView/LegendView";
import MonthlyHeatmapView from "./views/MonthlyHeatmapView/MonthlyHeatmapView";
import ExportView from "./views/ExportView/ExportView";

function ReactApp() {
  const { i18n } = useTranslation();
  const { currentYear, settings, view, trackerData } = useHeatmapContext();

  useEffect(() => {
    // Resources are bundled, so this only rejects if i18next itself is broken;
    // surface that instead of losing it to an unhandled rejection.
    i18n.changeLanguage(settings.language).catch((error) => {
      console.error("Heatmap Tracker: could not switch language.", error);
    });
  }, [settings]);

  let content;
  switch (view) {
    case IHeatmapView.HeatmapTracker:
      content =
        trackerData.layout === "monthly" ? (
          <MonthlyHeatmapView />
        ) : (
          <HeatmapTrackerView />
        );
      break;
    case IHeatmapView.HeatmapTrackerStatistics:
      content = <StatisticsView />;
      break;
    case IHeatmapView.Documentation:
      content = <DocumentationView />;
      break;
    case IHeatmapView.Legend:
      content = <LegendView />;
      break;
    case IHeatmapView.Export:
      content = <ExportView />;
      break;
    default:
      content = null;
  }

  if (!currentYear) {
    return null;
  }

  return (
    <div className="heatmap-tracker__container">
      <HeatmapHeader />
      {content}
    </div>
  );
}

export default React.memo(ReactApp);
