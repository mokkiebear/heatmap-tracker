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

/** In default display order. A built-in's rule lives here, never in settings. */
export const BUILTIN_PRESETS: BuiltinPreset[] = [
  {
    id: "logged",
    labelKey: "presetAllLoggedData",
    rule: { kind: "logged" },
    visible: true,
  },
  {
    id: "lastWeek",
    labelKey: "presetLastWeek",
    rule: periods("week", 1, 1),
    visible: true,
  },
  {
    id: "weekToDate",
    labelKey: "presetWeekToDate",
    rule: periods("week", 0, 0),
    visible: true,
  },
  {
    id: "lastMonth",
    labelKey: "presetLastMonth",
    rule: periods("month", 1, 1),
    visible: true,
  },
  {
    id: "monthToDate",
    labelKey: "presetMonthToDate",
    rule: periods("month", 0, 0),
    visible: true,
  },
  {
    id: "lastQuarter",
    labelKey: "presetLastQuarter",
    rule: periods("quarter", 1, 1),
    visible: false,
  },
  {
    id: "quarterToDate",
    labelKey: "presetQuarterToDate",
    rule: periods("quarter", 0, 0),
    visible: false,
  },
  {
    id: "lastYear",
    labelKey: "presetLastYear",
    rule: periods("year", 1, 1),
    visible: false,
  },
  {
    id: "yearToDate",
    labelKey: "presetYearToDate",
    rule: periods("year", 0, 0),
    visible: false,
  },
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

/** The preset's own name if it has one, else what a blank name falls back to. */
export function presetLabel(
  preset: RangePresetSetting,
  t: Translate = i18n.t,
): string {
  return preset.label?.trim() || defaultPresetLabel(preset, t);
}

/** A built-in's translated name, or a custom preset's rule description. */
export function defaultPresetLabel(
  preset: RangePresetSetting,
  t: Translate = i18n.t,
): string {
  const builtin = BUILTIN_BY_ID.get(preset.id);
  if (builtin) return t(`report.${builtin.labelKey}`);
  return preset.rule ? describeRule(preset.rule, t) : "";
}

// One function per unit rather than a built key, so the key-coverage test
// sees every key. "Months ago" is phrased as a label before a number, which
// needs no plural agreement in any language.
export const UNITS_AGO: Record<RangeUnit, (t: Translate) => string> = {
  day: (t) => t("report.presetsDialog.daysAgo"),
  week: (t) => t("report.presetsDialog.weeksAgo"),
  month: (t) => t("report.presetsDialog.monthsAgo"),
  quarter: (t) => t("report.presetsDialog.quartersAgo"),
  year: (t) => t("report.presetsDialog.yearsAgo"),
};

const LAST_PERIOD: Record<RangeUnit, (t: Translate) => string> = {
  day: (t) => t("report.presetYesterday"),
  week: (t) => t("report.presetLastWeek"),
  month: (t) => t("report.presetLastMonth"),
  quarter: (t) => t("report.presetLastQuarter"),
  year: (t) => t("report.presetLastYear"),
};

const CURRENT_PERIOD: Record<RangeUnit, (t: Translate) => string> = {
  day: (t) => t("report.presetToday"),
  week: (t) => t("report.presetWeekToDate"),
  month: (t) => t("report.presetMonthToDate"),
  quarter: (t) => t("report.presetQuarterToDate"),
  year: (t) => t("report.presetYearToDate"),
};

const formatBoundDate = (date: string) => (date ? formatWeekLabel(date) : "…");

/**
 * The label of a custom preset left unnamed: a built-in's name where the rule
 * is one ("Last week", "MTD"), "Since …" for a fixed start, otherwise the
 * rule itself in From → To terms.
 */
export function describeRule(rule: RangeRule, t: Translate = i18n.t): string {
  if (rule.kind === "logged") return t("report.presetAllLoggedData");

  const { unit, from, to } = rule;
  if (from === 1 && to === 1) return LAST_PERIOD[unit](t);
  if (from === 0 && to === 0) return CURRENT_PERIOD[unit](t);
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
  const unitsAgo = UNITS_AGO[unit](t);
  if (typeof from === "number" && typeof to === "number") {
    return t("report.presetsDialog.logic", { unitsAgo, from, to });
  }
  const bound = (value: RangeBound) =>
    typeof value === "string"
      ? formatBoundDate(value)
      : t("report.presetsDialog.logicBound", { unitsAgo, count: value });
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

/** Moves `draggedId` to sit immediately before `targetId`, or last for `null`. */
export function reorderPresets(
  presets: RangePresetSetting[],
  draggedId: string,
  targetId: string | null,
): RangePresetSetting[] {
  const dragged = presets.find((preset) => preset.id === draggedId);
  if (!dragged || draggedId === targetId) return presets;

  const rest = presets.filter((preset) => preset.id !== draggedId);
  const insertIndex =
    targetId === null
      ? rest.length
      : rest.findIndex((preset) => preset.id === targetId);
  if (insertIndex === -1) return presets;

  return [...rest.slice(0, insertIndex), dragged, ...rest.slice(insertIndex)];
}
