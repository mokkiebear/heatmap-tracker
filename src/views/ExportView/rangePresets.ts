import {
  RangeBound,
  RangePresetSetting,
  RangeRule,
  RangeUnit,
} from "src/types";
import i18n, { TranslationParams } from "src/localization/i18n";
import { formatWeekLabel } from "src/utils/report/dateLabels";
import type { DateSpan } from "./exportRange";

type Translate = (key: string, params?: TranslationParams) => string;

interface BuiltinPreset {
  id: string;
  /** Under `report.` in the locale files. */
  labelKey: string;
  rule: RangeRule;
  visible: boolean;
}

const periods = (unit: RangeUnit, from: number, to: number): RangeRule => ({
  kind: "periods",
  unit,
  from,
  to,
});

const builtin = (
  id: string,
  labelKey: string,
  rule: RangeRule,
  visible = true,
): BuiltinPreset => ({ id, labelKey, rule, visible });

/** In default display order. A built-in's rule lives here, never in settings. */
export const BUILTIN_PRESETS: BuiltinPreset[] = [
  builtin("logged", "presetAllLoggedData", { kind: "logged" }),
  builtin("lastWeek", "presetLastWeek", periods("week", 1, 1)),
  builtin("weekToDate", "presetWeekToDate", periods("week", 0, 0)),
  builtin("lastMonth", "presetLastMonth", periods("month", 1, 1)),
  builtin("monthToDate", "presetMonthToDate", periods("month", 0, 0)),
  builtin("lastQuarter", "presetLastQuarter", periods("quarter", 1, 1), false),
  builtin(
    "quarterToDate",
    "presetQuarterToDate",
    periods("quarter", 0, 0),
    false,
  ),
  builtin("lastYear", "presetLastYear", periods("year", 1, 1), false),
  builtin("yearToDate", "presetYearToDate", periods("year", 0, 0), false),
];

export const RANGE_UNITS: RangeUnit[] = [
  "day",
  "week",
  "month",
  "quarter",
  "year",
];

const BUILTIN_BY_ID = new Map(BUILTIN_PRESETS.map((p) => [p.id, p]));

export const isBuiltinPreset = (preset: RangePresetSetting) =>
  BUILTIN_BY_ID.has(preset.id);

export function defaultPresets(): RangePresetSetting[] {
  return BUILTIN_PRESETS.map(({ id, visible }) => ({ id, visible }));
}

/**
 * The saved list with built-ins reconciled against the code: unknown ones are
 * dropped, new ones appended with their default visibility. A built-in keeps
 * only its saved visibility and name; its rule always comes from the code.
 */
export function mergePresets(
  saved: RangePresetSetting[] | undefined,
): RangePresetSetting[] {
  if (!saved) return defaultPresets();

  const kept = saved.flatMap((preset): RangePresetSetting[] => {
    if (isBuiltinPreset(preset)) {
      const label = preset.label?.trim();
      return [
        { id: preset.id, visible: preset.visible, ...(label && { label }) },
      ];
    }
    return preset.rule?.kind === "periods" ? [{ ...preset }] : [];
  });
  const seen = new Set(kept.map((preset) => preset.id));

  return [
    ...kept,
    ...defaultPresets().filter((preset) => !seen.has(preset.id)),
  ];
}

/** Built-in order, visibility and names restored; custom presets kept after them. */
export function resetPresets(
  presets: RangePresetSetting[],
): RangePresetSetting[] {
  return [
    ...defaultPresets(),
    ...presets.filter((preset) => !isBuiltinPreset(preset)),
  ];
}

export function presetRule(preset: RangePresetSetting): RangeRule | undefined {
  return BUILTIN_BY_ID.get(preset.id)?.rule ?? preset.rule;
}

/**
 * The preset's own name if it has one, else what a blank name falls back to:
 * a built-in's translated name, or a custom preset's rule description.
 */
export function presetLabel(
  preset: RangePresetSetting,
  t: Translate = i18n.t,
): string {
  const rule = presetRule(preset);
  return preset.label?.trim() || (rule ? describeRule(rule, t) : "");
}

/** "Weeks ago" etc.: a label before a number, so no plural agreement is needed. */
const unitsAgo = (unit: RangeUnit, t: Translate = i18n.t) =>
  t(`report.presetsDialog.${unit}sAgo`);

const formatBoundDate = (date: string) => (date ? formatWeekLabel(date) : "…");

/**
 * The label of a custom preset left unnamed: a built-in's name where the rule
 * is one ("Last week", "MTD"), "Since …" for a fixed start, otherwise the
 * rule itself in From → To terms.
 */
export function describeRule(rule: RangeRule, t: Translate = i18n.t): string {
  if (rule.kind === "logged") return t("report.presetAllLoggedData");

  const { unit, from, to } = rule;
  const builtin = BUILTIN_PRESETS.find(
    (preset) =>
      preset.rule.kind === "periods" &&
      preset.rule.unit === unit &&
      preset.rule.from === from &&
      preset.rule.to === to,
  );
  if (builtin) return t(`report.${builtin.labelKey}`);
  if (unit === "day" && from === to && (from === 0 || from === 1)) {
    return from === 1 ? t("report.presetYesterday") : t("report.presetToday");
  }
  if (typeof from === "string" && to === 0) {
    return t("report.presetSince", { date: formatBoundDate(from) });
  }
  if (typeof from === "string" && typeof to === "string") {
    return `${formatBoundDate(from)} – ${formatBoundDate(to)}`;
  }
  return describeRuleLogic(rule, t);
}

/**
 * The rule in the dialog's own From → To terms, shown under every preset so
 * the built-ins double as examples: Last month is "Months ago: 1 → 1".
 */
export function describeRuleLogic(
  rule: RangeRule,
  t: Translate = i18n.t,
): string {
  if (rule.kind === "logged") return t("report.presetsDialog.loggedLogic");

  const { unit, from, to } = rule;
  const label = unitsAgo(unit, t);
  if (typeof from === "number" && typeof to === "number") {
    return t("report.presetsDialog.logic", { unitsAgo: label, from, to });
  }
  const bound = (value: RangeBound) =>
    typeof value === "string"
      ? formatBoundDate(value)
      : t("report.presetsDialog.logicBound", { unitsAgo: label, count: value });
  return `${bound(from)} → ${bound(to)}`;
}

/** The dates a rule covers today, or why it covers none. */
export function describeSpan(
  rule: RangeRule,
  span: DateSpan | null,
  t: Translate = i18n.t,
): string {
  if (span) {
    return `${formatWeekLabel(span.start)} – ${formatWeekLabel(span.end)}`;
  }
  return rule.kind === "logged"
    ? t("report.presetsDialog.noLoggedData")
    : t("report.presetsDialog.invalidRange");
}

export function newCustomPreset(
  rule: RangeRule,
  label: string,
): RangePresetSetting {
  const id = `custom-${Date.now().toString(36)}-${Math.random()
    .toString(36)
    .slice(2, 6)}`;
  return { id, visible: true, label: label.trim() || undefined, rule };
}
