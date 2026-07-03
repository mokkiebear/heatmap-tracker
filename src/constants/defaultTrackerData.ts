import { IHeatmapView, TrackerData } from "src/types";
import { getCurrentFullYear } from "src/utils/date";

export const DEFAULT_TRACKER_DATA: TrackerData = {
  year: getCurrentFullYear(),
  entries: [],
  showCurrentDayBorder: true,
  intensityConfig: {
    scaleStart: undefined,
    scaleEnd: undefined,
    defaultIntensity: 4,
    showOutOfRange: true,
    excludeFalsy: undefined,
  },
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
