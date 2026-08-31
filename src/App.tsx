import { IHeatmapView } from "./types";
import { useHeatmapContext } from "./context/heatmap/heatmap.context";
import React, { lazy, Suspense, useEffect } from "react";
import { useTranslation } from "react-i18next";

import { HeatmapHeader } from "./components/HeatmapHeader/HeatmapHeader";

import HeatmapFooter from "./components/HeatmapFooter/HeatmapFooter";
import { ViewSkeleton } from "./components/ViewSkeleton/ViewSkeleton";

const HeatmapTrackerView = lazy(
  () => import("./views/HeatmapTrackerView/HeatmapTrackerView"),
);
const StatisticsView = lazy(
  () => import("./views/StatisticsView/StatisticsView"),
);
const DocumentationView = lazy(
  () => import("./views/DocumentationView/DocumentationView"),
);

const LegendView = lazy(() => import("./views/LegendView/LegendView"));
const MonthlyHeatmapView = lazy(
  () => import("./views/MonthlyHeatmapView/MonthlyHeatmapView"),
);
const ExportView = lazy(() => import("./views/ExportView/ExportView"));

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
      <Suspense fallback={<ViewSkeleton />}>{content}</Suspense>
      <HeatmapFooter />
    </div>
  );
}

export default React.memo(ReactApp);
