import { ReactNode, useEffect, useState } from "react";
import { useTranslation } from "react-i18next";
import { ShieldXIcon } from "../icons/ShieldXIcon";
import { IHeatmapView } from "src/types";
import HeatmapTab from "../HeatmapTab/HeatmapTab";
import { useHeatmapContext } from "src/context/heatmap/heatmap.context";

function HeatmapFooter() {
  const { t } = useTranslation();
  const { trackerData, selectedBox } = useHeatmapContext();

  const [isActionRequired, setIsActionRequired] = useState(false);

  useEffect(() => {
    if (
      (!isActionRequired && typeof (trackerData as any)?.colors === "string") ||
      (trackerData as any)?.colors
    ) {
      setIsActionRequired(true);
    }
  }, [trackerData]);

    const content =
      selectedBox && selectedBox.content instanceof HTMLElement ? (
        <span dangerouslySetInnerHTML={{ __html: selectedBox.content.outerHTML }} />
      ) : (
        selectedBox && (selectedBox.content as ReactNode)
      );

  return (
    <div className="heatmap-tracker-footer">
      {selectedBox && (
        <div className="heatmap-tracker-footer__selected-box">
          <strong>Selected Date:</strong> {selectedBox.date}
          {selectedBox.name && (
            <>
              {" "}
              — <em>{selectedBox.name}</em>
            </>
          )}
          <a href={selectedBox.date} target="_blank" data-href={selectedBox.date} className="internal-link" rel="noopener nofollow">Go to page</a>
          {content}
        </div>
      )}
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
