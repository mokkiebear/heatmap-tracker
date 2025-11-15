import z from "zod";

import { EntrySchema } from "./schemas/entry.schema";
import { TrackerDataSchema } from "./schemas/trackerData.schema";
import { IntensityConfigSchema } from "./schemas/intensityConfig.schema";
import { InsightSchema } from "./schemas/insight.schema";
import { ColorsListSchema } from "./schemas/colorsList.schema";
import { ColorSchemeSchema } from "./schemas/colorScheme.schema";
import { PalettesSchema } from "./schemas/palettes.schema";

export type Entry = z.infer<typeof EntrySchema>;

export type ColorsList = z.infer<typeof ColorsListSchema>;

export type ColorScheme = z.infer<typeof ColorSchemeSchema>;

export type Palettes = z.infer<typeof PalettesSchema>;

export type Insight = z.infer<typeof InsightSchema>;

export type IntensityConfig = z.infer<typeof IntensityConfigSchema>;

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
  Legend = "legend",
}

export type WeekDisplayMode = "even" | "odd" | "none" | "all";

export interface TrackerParams {
  path?: string;
  property: string | string[];
}
