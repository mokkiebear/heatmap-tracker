import z from "zod";
import { ColorsListSchema } from "./schemas/schema";
import { EntrySchema } from "./schemas/entry.schema";
import { TrackerDataSchema } from "./schemas/trackerData.schema";

export type Entry = z.infer<typeof EntrySchema>;

export type ColorsList = z.infer<typeof ColorsListSchema>;

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

export type TrackerData = z.infer<typeof TrackerDataSchema>;

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
  /** Absolute path to the file in the vault (if known). */
  filePath?: string;
  /** Custom href for this box; takes precedence over filePath. */
  customHref?: string;
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
  Legend = "legend"
}

export type WeekDisplayMode = "even" | "odd" | "none" | "all";

export interface TrackerParams {
  path?: string;
  property: string | string[];
}
