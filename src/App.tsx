import { IHeatmapView } from "./types";
import { useHeatmapContext } from "./context/heatmap/heatmap.context";
import React, { lazy, Suspense, useEffect } from "react";
import { useTranslation } from "react-i18next";

import { HeatmapHeader } from "./components/HeatmapHeader/HeatmapHeader";

import HeatmapFooter from "./components/HeatmapFooter/HeatmapFooter";

const HeatmapTrackerView = lazy(
  () => import("./views/HeatmapTrackerView/HeatmapTrackerView")
);
const StatisticsView = lazy(
  () => import("./views/StatisticsView/StatisticsView")
);
const DocumentationView = lazy(
  () => import("./views/DocumentationView/DocumentationView")
);

const LegendView = lazy(() => import("./views/LegendView/LegendView"));

function ReactApp() {
  const { i18n } = useTranslation();
  const { currentYear, settings, view } = useHeatmapContext();

  useEffect(() => {
    i18n.changeLanguage(settings.language);
  }, [settings]);

  let content;
  switch (view) {
    case IHeatmapView.HeatmapTracker:
      content = <HeatmapTrackerView />;
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
    default:
      content = null;
  }

  if (!currentYear) {
    return null;
  }

  return (
    <div className="heatmap-tracker__container">
      <HeatmapHeader />
      <Suspense fallback={null}>{content}</Suspense>
      <HeatmapFooter />
    </div>
  );
}

export default React.memo(ReactApp);
