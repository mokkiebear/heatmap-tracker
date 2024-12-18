import { View } from "./types";
import { useHeatmapContext } from "./context/heatmap/heatmap.context";
import { useEffect, useState } from "react";
import { useTranslation } from "react-i18next";
import { HeatmapTrackerView } from "./views/HeatmapTrackerView/HeatmapTrackerView";
import { StatisticsView } from "./views/StatisticsView/StatisticsView";
import { HeatmapHeader } from "./components/HeatmapHeader/HeatmapHeader";
import { DocumentationView } from "./views/DocumentationView/DocumentationView";
import { HeatmapTab } from "./components/HeatmapTab/HeatmapTab";
import { ShieldXIcon } from "./components/icons/ShieldXIcon";

export const ReactApp = () => {
  const { i18n } = useTranslation();
  const { currentYear, settings, view, setView } = useHeatmapContext();

  useEffect(() => {
    if (view !== View.HeatmapTracker) {
      setView(View.HeatmapTracker);
    }
  }, []);

  useEffect(() => {
    i18n.changeLanguage(settings.language);
  }, [settings]);

  if (!currentYear) {
    return null;
  }

  let content;
  switch (view) {
    case View.HeatmapTracker:
      content = <HeatmapTrackerView />;
      break;
    case View.HeatmapTrackerStatistics:
      content = <StatisticsView />;
      break;
    case View.Documentation:
      content = <DocumentationView />;
      break;
    case View.HeatmapMenu:
      content = (
        <div>
          <div>Menu</div>
          <div>
            If you find this plugin useful, you can buy me a coffee! Your
            support helps keep this project alive. ☕💖
          </div>
          <div>
            <a href="https://www.buymeacoffee.com/mrubanau">
              <img src="https://img.buymeacoffee.com/button-api/?text=Buy me a coffee&emoji=&slug=mrubanau&button_colour=FFDD00&font_colour=000000&font_family=Cookie&outline_colour=000000&coffee_colour=ffffff" />
            </a>
          </div>
        </div>
      );
      break;
    default:
      content = null;
  }

  return (
    <div className="heatmap-tracker__container">
      {settings.enableChristmasMood ? (
        <div className="snow">
          <div></div>
        </div>
      ) : null}
      <HeatmapHeader />
      {content}
      <HeatmapFooter />
    </div>
  );
};

function HeatmapFooter() {
  const { trackerData } = useHeatmapContext();

  const [isActionRequired, setIsActionRequired] = useState(false);

  useEffect(() => {
    if (
      typeof (trackerData as any)?.colors === "string" ||
      (trackerData as any)?.colors
    ) {
      setIsActionRequired(true);
    }
  }, [trackerData]);

  return (
    <div className="heatmap-tracker-footer">
      {isActionRequired && (
        <div className="heatmap-tracker-footer__important">
          <ShieldXIcon />
          <strong>Actions Required:</strong>
          <span>
            Please check documentation and update heatmapTracker object
          </span>
          <HeatmapTab view={View.Documentation} label="Documentation" />
        </div>
      )}
    </div>
  );
}
