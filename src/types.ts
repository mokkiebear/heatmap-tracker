import z from "zod";

import { EntrySchema } from "./schemas/entry.schema";
import { TrackerDataSchema } from "./schemas/trackerData.schema";
import { IntensityConfigSchema } from "./schemas/intensityConfig.schema";
import { InsightSchema } from "./schemas/insight.schema";
import { ColorsListSchema } from "./schemas/colorsList.schema";
import { ColorSchemeSchema } from "./schemas/colorScheme.schema";
import { PalettesSchema } from "./schemas/palettes.schema";
import { FilterConditionSchema } from "./schemas/filterCondition.schema";

export type Entry = z.infer<typeof EntrySchema>;

export type FilterCondition = z.infer<typeof FilterConditionSchema>;

export type ColorsList = z.infer<typeof ColorsListSchema>;

export type ColorScheme = z.infer<typeof ColorSchemeSchema>;

export type Palettes = z.infer<typeof PalettesSchema>;

export type Insight = z.infer<typeof InsightSchema>;

export type IntensityConfig = z.infer<typeof IntensityConfigSchema>;

export type TrackerData = z.infer<typeof TrackerDataSchema>;

export interface LegendEntry {
  color: string;
  label: string;
  /** Whether this category's count appears in the summary line. Default: true. */
  includeInSummary?: boolean;
  /**
   * Fixed value every day matching this color contributes, replacing the
   * day's own raw value. For categories like "Leave" whose underlying entry
   * still carries a non-zero placeholder intensity (needed just to keep the
   * day colored/logged), this forces the real reported value (e.g. 0 hours).
   */
  valueOverride?: number;
}

/** Remembered Export-tab preferences, persisted across sessions. */
export interface ExportDefaults {
  orientation?: "columns" | "rows";
  weekStartDay?: number;
  startDate?: string;
  endDate?: string;
  showWeekStartDate?: boolean;
  /** Splits the grid at month boundaries with a blank gap. */
  splitByMonth?: boolean;
  /** Shows a month-name header, independent of whether the grid is split. */
  showMonthLabels?: boolean;
  skipWeekends?: boolean;
  valueLabel?: string;
  legend?: LegendEntry[];
  exportFolder?: string;
  /** Omits the day-count/day-type breakdown line entirely. */
  hideSummary?: boolean;
  /** Omits the "Total <value label>" line. */
  hideTotalValue?: boolean;
  /** Omits every value — the total line and each day's own value in the write-up. */
  hideAllValues?: boolean;
}

export interface TrackerSettings {
  palettes: Palettes;
  weekStartDay: number;
  weekDisplayMode: WeekDisplayMode;
  separateMonths: boolean;
  showWeekNums: boolean;
  language: string;
  viewTabsVisibility: Partial<Record<IHeatmapView, boolean>>;
  exportDefaults?: ExportDefaults;
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
  Export = "export",
}

export type WeekDisplayMode = "even" | "odd" | "none" | "all";

export interface TrackerParams {
  path?: string;
  property: string | string[];
  /** Only include pages with at least one of these tags (e.g. "#journal"). */
  tags?: string[];
  /** Additional frontmatter conditions a page must satisfy (all must match). */
  filters?: FilterCondition[];
}
