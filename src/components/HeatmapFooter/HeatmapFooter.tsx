import { useEffect, useState } from "react";
import { ShieldXIcon } from "../icons/ShieldXIcon";
import { IHeatmapView } from "src/types";
import HeatmapTab from "../HeatmapTab/HeatmapTab";
import { useHeatmapContext } from "src/context/heatmap/heatmap.context";

function HeatmapFooter() {
  const { trackerData } = useHeatmapContext();

  const [isActionRequired, setIsActionRequired] = useState(false);

  useEffect(() => {
    if ((trackerData as any)?.colors) {
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
          <HeatmapTab view={IHeatmapView.Documentation} label="Documentation" />
        </div>
      )}
    </div>
  );
}

export default HeatmapFooter;
