export interface Entry {
  date: string;
  /**
   * This is the mapped intensity.
   * The user set intensity, then I recalculate intensity and write here new intensity. User's value write to `value`.
   */
  intensity?: number;
  /**
   * Initial user intensity (value).
   */
  value?: number;
  customColor?: string;
  content?: string | HTMLElement;
}

export type ColorsList = string[];

export interface ColorScheme {
  paletteName?: string;
  customColors?: ColorsList;
}

export type Palettes = Record<string, ColorsList>;

export interface Insight {
  name: string;
  calculate({ yearEntries }: { yearEntries: Entry[] }): string | number;
}

export interface IntensityConfig {
  scaleStart: number | undefined;
  scaleEnd: number | undefined;
  defaultIntensity: number;
  showOutOfRange: boolean;
}

export interface TrackerData {
  year: number;
  colorScheme: ColorScheme;
  entries: Entry[];
  showCurrentDayBorder: boolean;

  /**
  * @deprecated The default intensity value for an entry.
  */
  defaultEntryIntensity: number;

  /**
   * @deprecated The starting value for the intensity scale.
   */
  intensityScaleStart: number | undefined;

  /**
   * @deprecated The ending value for the intensity scale.
   */
  intensityScaleEnd: number | undefined;
  intensityConfig: IntensityConfig;
  separateMonths?: boolean;
  heatmapTitle?: string;
  heatmapSubtitle?: string;

  insights: Insight[];
  dateFormat: string;
}

export interface TrackerSettings {
  palettes: Palettes;
  weekStartDay: number;
  weekDisplayMode: WeekDisplayMode;
  separateMonths: boolean;
  language: string;
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
  Documentation = "documentation",
  // Donation = "donation",
  Legend = "legend"
}

export type WeekDisplayMode = "even" | "odd" | "none" | "all";