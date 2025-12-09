import { useRef, useState } from "react";
import { useEffect } from "react";
import { HeatmapBoxesList } from "src/components/HeatmapBoxesList/HeatmapBoxesList";
import { HeatmapMonthsList } from "src/components/HeatmapMonthsList/HeatmapMonthsList";
import { HeatmapWeekDays } from "src/components/HeatmapWeekDays/HeatmapWeekDays";
import { HeatmapWeekNums } from "src/components/HeatmapWeekNums/HeatmapWeekNums";
import { useHeatmapContext } from "src/context/heatmap/heatmap.context";

function HeatmapTrackerView() {
  const { boxes } = useHeatmapContext();

  const graphRef = useRef<HTMLDivElement>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    graphRef.current?.scrollTo?.({
      top: 0,
      left:
        (graphRef.current?.querySelector(".today") as HTMLElement)?.offsetLeft -
        graphRef.current?.offsetWidth / 2,
    });

    setIsLoading(false);
  }, [boxes]);

  return (
    <div
      className={`heatmap-tracker ${
        isLoading ? "heatmap-tracker-loading" : ""
      }`}
    >
      <HeatmapWeekDays />
      <div className="heatmap-tracker-graph" ref={graphRef}>
        <HeatmapMonthsList />

        <HeatmapBoxesList boxes={boxes} />
        <HeatmapWeekNums />
      </div>
    </div>
  );
}

export default HeatmapTrackerView;
