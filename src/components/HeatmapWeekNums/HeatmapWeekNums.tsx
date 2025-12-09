import { useHeatmapContext } from "src/context/heatmap/heatmap.context";
import { getISOWeekNumber } from "src/utils/date";

export function HeatmapWeekNums() {
  const { trackerData, boxes, settings } = useHeatmapContext();
  
  const showWeekNums = trackerData.ui?.showWeekNums ?? settings.showWeekNums;

  if (!showWeekNums) {
    return null;
  }

  const columns = [];
  // The grid fills column by column, 7 rows per column
  for (let i = 0; i < boxes.length; i += 7) {
    const chunk = boxes.slice(i, i + 7);
    const firstBoxWithDate = chunk.find((b) => b.date);
    
    if (firstBoxWithDate && firstBoxWithDate.date) {
        const weekNum = getISOWeekNumber(new Date(firstBoxWithDate.date));
        columns.push(weekNum);
    } else {
        columns.push(null);
    }
  }

  let lastWeekNum: number | null = null;

  return (
    <div
      className={`heatmap-tracker-week-nums ${
        trackerData.separateMonths ? "separate-months" : ""
      }`}
    >
      {columns.map((weekNum, index) => {
        // If empty column, render nothing
        if (weekNum === null) {
            lastWeekNum = null; // Reset if we hit a pure gap
            return <div key={index}></div>;
        }

        // If same as last week (split week), render nothing to avoid duplicate
        if (weekNum === lastWeekNum) {
            return <div key={index}></div>;
        }

        lastWeekNum = weekNum;
        return <div key={index}>{weekNum}</div>;
      })}
    </div>
  );
}
