import { IHeatmapView } from "../types";
import { getCurrentFullYear } from "../utils/date";

export type DateRangeMode = "full-year" | "days" | "months" | "custom";

export type FilterOperator = "equals" | "contains" | "notEmpty";

export interface FilterConditionFormState {
  property: string;
  operator: FilterOperator;
  /** Kept as a plain string in form state regardless of operator; dropped on build for "notEmpty". */
  value: string;
}

export interface HeatmapModalFormState {
  heatmapTitle: string;
  heatmapSubtitle: string;
  /** Frontmatter keys to track. More than one aggregates (sums) their intensities. */
  properties: string[];
  path: string;
  /** Only include pages with at least one of these tags. */
  tags: string[];
  /** Additional frontmatter conditions a page must satisfy (all must match). */
  filters: FilterConditionFormState[];
  year: number;
  layout: "default" | "monthly";
  dateRangeMode: DateRangeMode;
  /** Raw text input, parsed on build so the field can be empty while typing. */
  daysToShow: string;
  monthsToShow: string;
  startDate: string;
  endDate: string;
  separateMonths: boolean;
  showCurrentDayBorder: boolean;
  disableFileCreation: boolean;
  excludeFalsy: boolean;
  palette: string;
  useCustomColors: boolean;
  customColors: string[];
  scaleStart: string;
  scaleEnd: string;
  defaultIntensity: string;
  showOutOfRange: boolean;
  hideTabs: boolean;
  hideYear: boolean;
  hideTitle: boolean;
  hideSubtitle: boolean;
  showWeekNums: boolean;
  defaultView: IHeatmapView;
}

export function createInitialFormState(): HeatmapModalFormState {
  return {
    heatmapTitle: "",
    heatmapSubtitle: "",
    properties: [],
    path: "",
    tags: [],
    filters: [],
    year: getCurrentFullYear(),
    layout: "default",
    dateRangeMode: "full-year",
    daysToShow: "",
    monthsToShow: "",
    startDate: "",
    endDate: "",
    separateMonths: true,
    showCurrentDayBorder: true,
    disableFileCreation: false,
    excludeFalsy: false,
    palette: "default",
    useCustomColors: false,
    customColors: [],
    scaleStart: "",
    scaleEnd: "",
    defaultIntensity: "",
    showOutOfRange: true,
    hideTabs: false,
    hideYear: false,
    hideTitle: false,
    hideSubtitle: false,
    showWeekNums: false,
    defaultView: IHeatmapView.HeatmapTracker,
  };
}

/** Reads a value the user may have hand-written in YAML — anything goes. */
function asString(value: unknown): string | undefined {
  if (typeof value === "string") return value;
  if (typeof value === "number" && Number.isFinite(value)) return String(value);
  return undefined;
}

function asStringArray(value: unknown): string[] | undefined {
  if (typeof value === "string") return [value];
  if (Array.isArray(value)) {
    return value.map(asString).filter((v): v is string => v !== undefined);
  }
  return undefined;
}

function asBool(value: unknown): boolean | undefined {
  return typeof value === "boolean" ? value : undefined;
}

function asRecord(value: unknown): Record<string, unknown> {
  return value && typeof value === "object" && !Array.isArray(value)
    ? (value as Record<string, unknown>)
    : {};
}

function pickDateRangeMode(config: Record<string, unknown>): DateRangeMode {
  // Mirrors `resolveDateRange`'s precedence: monthsToShow > daysToShow > range.
  if (config.monthsToShow !== undefined) return "months";
  if (config.daysToShow !== undefined) return "days";
  if (config.startDate !== undefined || config.endDate !== undefined) {
    return "custom";
  }
  return "full-year";
}

/**
 * Inverse of `buildHeatmapConfig`: turns an existing codeblock's parsed YAML
 * back into form state so the modal can edit it instead of only creating.
 * Anything missing or malformed falls back to the create-mode default, so a
 * hand-written codeblock never blocks the editor.
 */
export function formStateFromConfig(
  config: Record<string, unknown>,
): HeatmapModalFormState {
  const state = createInitialFormState();

  const colorScheme = asRecord(config.colorScheme);
  const intensity = asRecord(config.intensityConfig);
  const ui = asRecord(config.ui);

  const customColors = asStringArray(colorScheme.customColors) ?? [];
  const year = Number(config.year);
  const defaultView = asString(ui.defaultView);

  return {
    ...state,
    heatmapTitle: asString(config.heatmapTitle) ?? state.heatmapTitle,
    heatmapSubtitle: asString(config.heatmapSubtitle) ?? state.heatmapSubtitle,
    properties: asStringArray(config.property) ?? state.properties,
    path: asString(config.path) ?? state.path,
    tags: asStringArray(config.tags) ?? state.tags,
    filters: (Array.isArray(config.filters) ? config.filters : [])
      .map((raw) => asRecord(raw))
      .map((f) => ({
        property: asString(f.property) ?? "",
        operator: (asString(f.operator) ?? "equals") as FilterOperator,
        value: asString(f.value) ?? "",
      }))
      .filter((f) => f.property !== ""),
    year: Number.isFinite(year) ? year : state.year,
    layout: config.layout === "monthly" ? "monthly" : "default",
    dateRangeMode: pickDateRangeMode(config),
    daysToShow: asString(config.daysToShow) ?? state.daysToShow,
    monthsToShow: asString(config.monthsToShow) ?? state.monthsToShow,
    startDate: asString(config.startDate) ?? state.startDate,
    endDate: asString(config.endDate) ?? state.endDate,
    separateMonths: asBool(config.separateMonths) ?? state.separateMonths,
    showCurrentDayBorder:
      asBool(config.showCurrentDayBorder) ?? state.showCurrentDayBorder,
    disableFileCreation:
      asBool(config.disableFileCreation) ?? state.disableFileCreation,
    palette: asString(colorScheme.paletteName) ?? state.palette,
    useCustomColors: customColors.length > 0,
    customColors,
    scaleStart: asString(intensity.scaleStart) ?? state.scaleStart,
    scaleEnd: asString(intensity.scaleEnd) ?? state.scaleEnd,
    defaultIntensity:
      asString(intensity.defaultIntensity) ?? state.defaultIntensity,
    showOutOfRange: asBool(intensity.showOutOfRange) ?? state.showOutOfRange,
    excludeFalsy: asBool(intensity.excludeFalsy) ?? state.excludeFalsy,
    hideTabs: asBool(ui.hideTabs) ?? state.hideTabs,
    hideYear: asBool(ui.hideYear) ?? state.hideYear,
    hideTitle: asBool(ui.hideTitle) ?? state.hideTitle,
    hideSubtitle: asBool(ui.hideSubtitle) ?? state.hideSubtitle,
    showWeekNums: asBool(ui.showWeekNums) ?? state.showWeekNums,
    defaultView: Object.values(IHeatmapView).includes(
      defaultView as IHeatmapView,
    )
      ? (defaultView as IHeatmapView)
      : state.defaultView,
  };
}

const ISO_DATE_RE = /^\d{4}-\d{2}-\d{2}$/;

/** A positive integer typed into a text field, or `undefined` if blank/invalid. */
function parsePositiveInt(raw: string): number | undefined {
  if (raw.trim() === "") return undefined;
  const n = Number(raw);
  return Number.isFinite(n) && Number.isInteger(n) && n > 0 ? n : undefined;
}

/** A finite number typed into a text field, or `undefined` if blank/invalid. */
function parseOptionalNumber(raw: string): number | undefined {
  if (raw.trim() === "") return undefined;
  const n = Number(raw);
  return Number.isFinite(n) ? n : undefined;
}

/**
 * Validates the parts of the form that would otherwise produce a heatmap
 * that silently renders nothing (or a codeblock that fails validation once
 * inserted). Returns a list of user-facing messages; empty means "safe to
 * insert".
 */
export function validateHeatmapForm(state: HeatmapModalFormState): string[] {
  const errors: string[] = [];

  if (state.properties.filter(Boolean).length === 0) {
    errors.push("Select or add at least one property to track.");
  }

  if (!Number.isFinite(state.year)) {
    errors.push("Enter a valid year.");
  }

  if (
    state.dateRangeMode === "days" &&
    parsePositiveInt(state.daysToShow) === undefined
  ) {
    errors.push("Enter a positive number of days to show.");
  }

  if (
    state.dateRangeMode === "months" &&
    parsePositiveInt(state.monthsToShow) === undefined
  ) {
    errors.push("Enter a positive number of months to show.");
  }

  if (state.dateRangeMode === "custom") {
    const validStart = ISO_DATE_RE.test(state.startDate);
    const validEnd = ISO_DATE_RE.test(state.endDate);

    if (!validStart || !validEnd) {
      errors.push("Enter valid start and end dates (YYYY-MM-DD).");
    } else if (state.startDate > state.endDate) {
      errors.push("Start date must not be after end date.");
    }
  }

  if (
    state.useCustomColors &&
    state.customColors.filter(Boolean).length === 0
  ) {
    errors.push("Add at least one custom color, or turn off custom colors.");
  }

  const scaleStart = parseOptionalNumber(state.scaleStart);
  const scaleEnd = parseOptionalNumber(state.scaleEnd);
  if (
    scaleStart !== undefined &&
    scaleEnd !== undefined &&
    scaleStart > scaleEnd
  ) {
    errors.push("Intensity scale start must not be greater than scale end.");
  }

  if (state.filters.some((f) => f.property.trim() === "")) {
    errors.push("Each filter condition needs a property.");
  }
  if (
    state.filters.some(
      (f) =>
        f.operator !== "notEmpty" &&
        f.property.trim() !== "" &&
        f.value.trim() === "",
    )
  ) {
    errors.push('Each filter condition needs a value, or use "Is not empty".');
  }

  return errors;
}

/** Removes `undefined` values (recursively) and now-empty nested objects. */
function stripUndefined<T>(value: T): T {
  if (Array.isArray(value)) {
    return value as T;
  }

  if (value && typeof value === "object") {
    const result: Record<string, unknown> = {};
    for (const [key, val] of Object.entries(value)) {
      if (val === undefined) continue;
      const cleaned = stripUndefined(val);
      if (
        cleaned &&
        typeof cleaned === "object" &&
        !Array.isArray(cleaned) &&
        Object.keys(cleaned).length === 0
      ) {
        continue;
      }
      result[key] = cleaned;
    }
    return result as T;
  }

  return value;
}

function buildColorScheme(state: HeatmapModalFormState) {
  if (state.useCustomColors) {
    const customColors = state.customColors.filter(Boolean);
    if (customColors.length > 0) {
      return { customColors };
    }
  }

  return { paletteName: state.palette };
}

function buildIntensityConfig(state: HeatmapModalFormState) {
  return {
    scaleStart: parseOptionalNumber(state.scaleStart),
    scaleEnd: parseOptionalNumber(state.scaleEnd),
    defaultIntensity: parseOptionalNumber(state.defaultIntensity),
    // `true` is the default, only send the key when it deviates from it.
    showOutOfRange: state.showOutOfRange ? undefined : false,
    excludeFalsy: state.excludeFalsy || undefined,
  };
}

function buildUi(state: HeatmapModalFormState) {
  return {
    hideTabs: state.hideTabs || undefined,
    hideYear: state.hideYear || undefined,
    hideTitle: state.hideTitle || undefined,
    hideSubtitle: state.hideSubtitle || undefined,
    showWeekNums: state.showWeekNums || undefined,
    defaultView:
      state.defaultView !== IHeatmapView.HeatmapTracker
        ? state.defaultView
        : undefined,
  };
}

export function buildTags(state: HeatmapModalFormState): string[] | undefined {
  const tags = state.tags.filter(Boolean);
  return tags.length > 0 ? tags : undefined;
}

export function buildFilters(
  state: HeatmapModalFormState,
):
  | Array<{ property: string; operator: FilterOperator; value?: string }>
  | undefined {
  const filters = state.filters
    .filter((f) => f.property.trim() !== "")
    .map((f) => ({
      property: f.property.trim(),
      operator: f.operator,
      value: f.operator === "notEmpty" ? undefined : f.value,
    }));

  return filters.length > 0 ? filters : undefined;
}

/**
 * Resolves the mutually-exclusive date-range fields down to the single one
 * that should be sent, matching the precedence implemented in
 * `resolveDateRange` (monthsToShow > daysToShow > startDate/endDate).
 */
function buildDateRange(state: HeatmapModalFormState) {
  switch (state.dateRangeMode) {
    case "months":
      return { monthsToShow: parsePositiveInt(state.monthsToShow) };
    case "days":
      return { daysToShow: parsePositiveInt(state.daysToShow) };
    case "custom":
      return ISO_DATE_RE.test(state.startDate) &&
        ISO_DATE_RE.test(state.endDate)
        ? { startDate: state.startDate, endDate: state.endDate }
        : {};
    case "full-year":
    default:
      return {};
  }
}

/**
 * Builds the plain object that gets written into the `heatmap-tracker`
 * codeblock (via `stringifyYaml`). Only the trackerData/params keys that
 * differ from the plugin's defaults are included, keeping the generated
 * codeblock minimal and readable.
 */
export function buildHeatmapConfig(
  state: HeatmapModalFormState,
): Record<string, unknown> {
  const properties = state.properties.filter(Boolean);
  const property = properties.length <= 1 ? properties[0] : properties;

  const config = {
    heatmapTitle: state.heatmapTitle || undefined,
    heatmapSubtitle: state.heatmapSubtitle || undefined,
    property,
    path: state.path || undefined,
    tags: buildTags(state),
    filters: buildFilters(state),
    year: state.year,
    layout: state.layout !== "default" ? state.layout : undefined,
    separateMonths: state.separateMonths,
    showCurrentDayBorder: state.showCurrentDayBorder,
    disableFileCreation: state.disableFileCreation || undefined,
    colorScheme: buildColorScheme(state),
    intensityConfig: buildIntensityConfig(state),
    ui: buildUi(state),
    ...buildDateRange(state),
  };

  return stripUndefined(config);
}

/**
 * Builds the `TrackerData`-shaped object used to render the modal's live
 * preview. Same config as `buildHeatmapConfig`, plus the supplied entries and
 * preview-only fallback title/subtitle text.
 */
export function buildPreviewTrackerData(
  state: HeatmapModalFormState,
  entries: unknown[],
): Record<string, unknown> {
  const config = buildHeatmapConfig(state);

  return {
    ...config,
    entries,
    heatmapTitle: state.heatmapTitle || "Preview title",
    heatmapSubtitle: state.heatmapSubtitle || "Preview subtitle",
  };
}
