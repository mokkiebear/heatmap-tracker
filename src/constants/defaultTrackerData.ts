import { IHeatmapView, TrackerData } from "src/types";
import { getCurrentFullYear } from "src/utils/date";

export const DEFAULT_TRACKER_DATA: TrackerData = {
  year: getCurrentFullYear(),
  entries: [
    { date: "1900-01-01", customColor: "#7bc96f", intensity: 5, content: "" },
  ],
  showCurrentDayBorder: true,
  intensityConfig: {
    scaleStart: undefined,
    scaleEnd: undefined,
    defaultIntensity: 4,
    showOutOfRange: true,
  },
  intensityScaleStart: undefined,
  intensityScaleEnd: undefined,
  defaultEntryIntensity: 4,
  colorScheme: {
    paletteName: "default",
  },
  insights: [],
  disableFileCreation: false,
  heatmapTitle: undefined,
  heatmapSubtitle: undefined,
  basePath: undefined,
  ui: {
      defaultView: IHeatmapView.HeatmapTracker,
      hideTabs: false,
      hideYear: false,
      hideTitle: false,
      hideSubtitle: false,
  }
};
