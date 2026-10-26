import * as z from "zod";

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
   * Whether this category appears in the legend at all (its swatch+label
   * line in separate mode, or its own independent line in gradient mode).
   * Default: true. Setting this to `false` implies `includeInSummary: false`
   * too — there's no sensible "counted but not shown anywhere" state.
   */
  includeInLegend?: boolean;
  /**
   * Fixed value every day matching this color contributes, replacing the
   * day's own raw value. For categories like "Leave" whose underlying entry
   * still carries a non-zero placeholder intensity (needed just to keep the
   * day colored/logged), this forces the real reported value (e.g. 0 hours).
   */
  valueOverride?: number;
  /**
   * Multiplies this color's day count when it's combined into the gradient
   * mode's shared total (see `buildSummaryModel`'s "gradient" legendMode) —
   * e.g. 0.5 for a lighter "half day" color so its days count as half a day
   * toward the shared count instead of a full one. Default: 1. Has no effect
   * in separate-rows mode, where each color already shows its own raw count.
   */
  countWeight?: number;
}

export type RangeUnit = "day" | "week" | "month" | "quarter" | "year";

/**
 * One end of a preset's range. A number counts whole periods back from the
 * current one — 0 is the current period, 1 the previous complete one — and a
 * string is a fixed date (YYYY-MM-DD).
 */
export type RangeBound = number | string;

/** How a date-range preset turns today into a range (see `resolveRangeRule`). */
export type RangeRule =
  | { kind: "logged" }
  /**
   * From the start of the `from` period to the end of the `to` period, both
   * included, in calendar `unit`s (days are single days). A relative `to` of
   * 0 ends today, not at the end of the current period. Last month is
   * `{ unit: "month", from: 1, to: 1 }`; month to date is `from: 0, to: 0`.
   */
  | { kind: "periods"; unit: RangeUnit; from: RangeBound; to: RangeBound };

/** One Export-tab range preset, in display order. A built-in's rule lives in code, not here. */
export interface RangePresetSetting {
  id: string;
  visible: boolean;
  /** The button's name. Blank falls back to a built-in's translated name, or a custom preset's rule description. */
  label?: string;
  /** Custom presets only. */
  rule?: RangeRule;
}

/**
 * "separate": one legend/summary line per color. "gradient": the palette
 * colors combine into one swatch strip with a shared label and count; other
 * colors, including the blank one, keep their own lines either way.
 */
export type LegendDisplayMode = "separate" | "gradient";

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
  /** Default "separate". */
  legendMode?: LegendDisplayMode;
  /** Shared label shown next to the gradient swatch strip when legendMode is "gradient". */
  gradientLabel?: string;
  exportFolder?: string;
  /** Omits the day-count/day-type breakdown line entirely. */
  hideSummary?: boolean;
  /** Omits the "Total <value label>" line. */
  hideTotalValue?: boolean;
  /** Omits every value — the total line and each day's own value in the write-up. */
  hideAllValues?: boolean;
  rangePresets?: RangePresetSetting[];
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
  /**
   * Set once the user dismisses the supporter card in the Statistics view.
   * Never reset — dismissing it is permanent by design.
   */
  supporterCardDismissed?: boolean;
}

export interface Box {
  backgroundColor?: string;
  date?: string;
  /** Absolute path to the file in the vault (if known). */
  filePath?: string;
  /** Custom href for this box; takes precedence over filePath. */
  customHref?: string;
  content?: string | HTMLElement;
  /** Short glyph rendered inside the box (see `Entry.emoji`). */
  emoji?: string;
  /** Raw user value for this day, used for the accessible label. */
  value?: number;
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
  /**
   * The user's `intensityConfig`, as written in the codeblock — partial, since
   * every field is optional there. Only `aggregation` is read at query time
   * (it decides how several tracked properties on one page combine); the rest
   * is filled in by `mergeTrackerData` further down.
   */
  intensityConfig?: Partial<IntensityConfig>;
}
