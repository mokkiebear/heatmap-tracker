import { useRef, useState } from "react";
import { useEffect } from "react";
import { HeatmapBoxesList } from "src/components/HeatmapBoxesList/HeatmapBoxesList";
import { HeatmapMonthsList } from "src/components/HeatmapMonthsList/HeatmapMonthsList";
import { HeatmapWeekDays } from "src/components/HeatmapWeekDays/HeatmapWeekDays";
import { useHeatmapContext } from "src/context/heatmap/heatmap.context";
import { useAppContext } from "src/main";
import { getDailyNote, createDailyNote, getAllDailyNotes } from "obsidian-daily-notes-interface";
import moment from "moment";

function HeatmapTrackerView() {
  const { boxes } = useHeatmapContext();
  const app = useAppContext();

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

  const handleBoxClick = async (box: any) => {
    if (!box.date) return;
    const date = moment(box.date);
    const allDailyNotes = getAllDailyNotes();
    let file = getDailyNote(date, allDailyNotes);
    if (!file) {
      file = await createDailyNote(date);
    }
    app.workspace.openLinkText(file.basename, file.path);
  };

  return (
    <div
      className={`heatmap-tracker ${
        isLoading ? "heatmap-tracker-loading" : ""
      }`}
    >
      <HeatmapWeekDays />
      <div className="heatmap-tracker-graph" ref={graphRef}>
        <HeatmapMonthsList />

        <HeatmapBoxesList boxes={boxes} onBoxClick={handleBoxClick} />
      </div>
    </div>
  );
}

export default HeatmapTrackerView;
