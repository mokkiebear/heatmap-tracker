import { Box } from "src/types";
import { HeatmapBox } from "../HeatmapBox/HeatmapBox";
import { useHeatmapContext } from "src/context/heatmap/heatmap.context";

interface HeatmapBoxesListProps {
  boxes: Box[];
  onBoxClick?: (box: Box) => void;
}

export function HeatmapBoxesList({ boxes, onBoxClick }: HeatmapBoxesListProps) {
  const { trackerData } = useHeatmapContext();

  return (
    <div
      className={`heatmap-tracker-boxes ${
        trackerData.separateMonths ? "separate-months" : ""
      }`}
    >
      {boxes.map((box, index) => {
        return <HeatmapBox key={index} box={box} onClick={onBoxClick} />;
      })}
    </div>
  );
}
