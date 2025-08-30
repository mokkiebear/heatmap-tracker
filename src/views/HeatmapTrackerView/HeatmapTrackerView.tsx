import { useRef, useState } from "react";
import { useEffect } from "react";
import { HeatmapBoxesList } from "src/components/HeatmapBoxesList/HeatmapBoxesList";
import { HeatmapMonthsList } from "src/components/HeatmapMonthsList/HeatmapMonthsList";
import { HeatmapWeekDays } from "src/components/HeatmapWeekDays/HeatmapWeekDays";
import { useHeatmapContext } from "src/context/heatmap/heatmap.context";
import { useAppContext } from "src/main";
import {
  getDailyNote,
  createDailyNote,
  getAllDailyNotes,
  getDailyNoteSettings,
} from "obsidian-daily-notes-interface";
import moment from "moment";
import { Box } from "src/types";
import { App, TFile } from "obsidian";
import { notify } from "src/utils/notify";

async function createNewFile(app: App, fileName: string, path: string) {
  const shouldCreate = window.confirm(
    `Do you want to create a new file '${fileName}' at '${path}'?`
  );

  if (shouldCreate) {
    const createdFile = await app.vault.create(path, "");

    if (createdFile) {
      const leaf = app.workspace.getLeaf(true);
      await leaf.openFile(createdFile);
    }

    return true;
  }

  return false;
}

function HeatmapTrackerView() {
  const { boxes, trackerData } = useHeatmapContext();
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

  async function handleBoxClick(box: Box) {
    if (!box?.date) {
      return;
    }

    const date = moment(box.date);

    // 1) If box has an explicit filePath, try to open that exact file
    if (box?.filePath) {
      const abstract = app.vault.getAbstractFileByPath(box.filePath);

      if (abstract && abstract instanceof TFile) {
        const leaf = app.workspace.getLeaf(true);
        // @ts-ignore runtime supports openFile(TFile)
        await leaf.openFile(abstract);
        return;
      }

      await createNewFile(app, date.format("YYYY-MM-DD"), box.filePath);

      return;
    }

    // 2) If trackerData has a basePath, suggest creating there using the date-based filename
    if (trackerData?.basePath) {
      const normalizedBase = trackerData?.basePath.replace(/^\/+|\/+$/g, "");
      const expectedPath = `${
        normalizedBase ? normalizedBase + "/" : ""
      }${date.format("YYYY-MM-DD")}.md`;

      const abstract = app.vault.getAbstractFileByPath(expectedPath);

      if (abstract && abstract instanceof TFile) {
        const leaf = app.workspace.getLeaf(true);
        await leaf.openFile(abstract);
        return;
      }

      await createNewFile(app, date.format("YYYY-MM-DD"), expectedPath);

      return;
    }

    // 3) Fallback to Daily Notes API (uses its folder/format)
    try {
      const allDailyNotes = getAllDailyNotes();
      const existing = getDailyNote(date, allDailyNotes);

      if (existing) {
        const leaf = app.workspace.getLeaf(true);
        await leaf.openFile(existing);
        return;
      }

      const dnSettings = getDailyNoteSettings();
      const format = dnSettings?.format || "YYYY-MM-DD";
      const folder = (dnSettings?.folder || "").replace(/^\/+|\/+$/g, "");
      const filename = `${date.format(format)}.md`;
      const expectedPath = `${folder ? folder + "/" : ""}${filename}`;

      const shouldCreate = window.confirm(
        `No page found for ${date.format(format)}.\nCreate at: ${expectedPath}?`
      );

      if (!shouldCreate) {
        return;
      }

      const created = await createDailyNote(date);
      if (created) {
        const leaf = app.workspace.getLeaf(true);
        // @ts-ignore Obsidian API at runtime supports openFile(TFile)
        await leaf.openFile(created);
      }

      return;
    } catch (err) {
      console.log(err);
    }

    const fileName = `${date.format("YYYY-MM-DD")}.md`;

    const file = app.vault.getFiles().find((f) => f.name === fileName);

    if (file) {
      const leaf = app.workspace.getLeaf(true);
      await leaf.openFile(file);
    } else {
      await createNewFile(app, fileName, fileName);
      notify(
        `* Heatmap Tracker *\nWe tried to create/open a Daily Note, but something went wrong.\nTry to use:\n- 'filePath' for entry (page.file.path)\n- 'basePath' for trackerData object\n- 'customHref' to set a custom link\n- use 'daily notes' Obsidian's plugin`,
        5000
      );
    }
  }

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
