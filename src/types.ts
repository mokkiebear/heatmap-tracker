export interface Entry {
  date: string;
  intensity?: number;
  color: string;
  customColor?: string;
  content: string | HTMLElement;
  separateMonths?: boolean;
}

export type ColorsList = string[];

export interface ColorScheme {
  paletteName?: string;
  customColors?: ColorsList;
}

export type Palettes = Record<string, ColorsList>;

export interface IntensityConfig {
  scaleStart: number | undefined;
  scaleEnd: number | undefined;
  defaultIntensity: number;
}

/**
 * Represents the data structure for the heatmap tracker.
 */
export interface TrackerData {
  /**
   * The year for which the tracker data is relevant.
   */
  year: number;
  colorScheme: ColorScheme;

  /**
   * An array of entries representing the data points in the heatmap.
   */
  entries: Entry[];

  /**
   * A flag indicating whether to show a border around the current day.
   */
  showCurrentDayBorder: boolean;

  intensityConfig: IntensityConfig;

  /**
   * A flag indicating whether to separate the months in the heatmap.
   */
  separateMonths?: boolean;
  heatmapTitle?: string;
  heatmapSubtitle?: string;
}

export interface TrackerSettings {
  palettes: Palettes;
  weekStartDay: number;
  separateMonths: boolean;
  language: string;
  enableChristmasMood: boolean;
  viewTabsVisibility: Partial<Record<IHeatmapView, boolean>>;
}

export interface Box {
  backgroundColor?: string;
  date?: string;
  content?: string | HTMLElement;
  isToday?: boolean;
  name?: string;
  showBorder?: boolean;
  hasData?: boolean;
  isSpaceBetweenBox?: boolean;
}

export enum IHeatmapView {
  HeatmapTracker = "heatmap-tracker",
  HeatmapTrackerStatistics = "heatmap-tracker-statistics",
  // HeatmapMenu = "heatmap-menu",
  Documentation = "documentation",
  Donation = "donation",
  Legend = "legend"
}
