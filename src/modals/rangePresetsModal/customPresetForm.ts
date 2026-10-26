import {
  RangeBound,
  RangePresetSetting,
  RangeRule,
  RangeUnit,
} from "src/types";
import i18n from "src/localization/i18n";
import { DateSpan, isPeriodsAgo } from "src/views/ExportView/exportRange";
import {
  UNITS_AGO,
  describeRule,
  describeRuleLogic,
  describeSpan,
} from "src/views/ExportView/rangePresets";

const t = i18n.t;

const UNIT_NAMES: Record<RangeUnit, () => string> = {
  day: () => t("report.presetsDialog.day"),
  week: () => t("report.presetsDialog.week"),
  month: () => t("report.presetsDialog.month"),
  quarter: () => t("report.presetsDialog.quarter"),
  year: () => t("report.presetsDialog.year"),
};

type BoundMode = "relative" | "fixed";

const MODE_NAMES: Record<BoundMode, () => string> = {
  relative: () => t("report.presetsDialog.relative"),
  fixed: () => t("report.presetsDialog.fixedDate"),
};

const BOUND_TEXT = {
  from: {
    name: () => t("report.presetsDialog.from"),
    type: () => t("report.presetsDialog.fromType"),
    date: () => t("report.presetsDialog.fromDate"),
    count: () => t("report.presetsDialog.fromCount"),
  },
  to: {
    name: () => t("report.presetsDialog.to"),
    type: () => t("report.presetsDialog.toType"),
    date: () => t("report.presetsDialog.toDate"),
    count: () => t("report.presetsDialog.toCount"),
  },
};

interface BoundState {
  mode: BoundMode;
  /** Both kept while switching modes, so switching back restores the value. */
  periodsAgo: number;
  date: string;
}

interface FormState {
  unit: RangeUnit;
  from: BoundState;
  to: BoundState;
  label: string;
}

function boundState(bound: RangeBound): BoundState {
  return typeof bound === "string"
    ? { mode: "fixed", periodsAgo: 1, date: bound }
    : { mode: "relative", periodsAgo: bound, date: "" };
}

function initialState(preset: RangePresetSetting | undefined): FormState {
  const rule = preset?.rule;
  if (rule?.kind === "periods") {
    return {
      unit: rule.unit,
      from: boundState(rule.from),
      to: boundState(rule.to),
      label: preset?.label ?? "",
    };
  }
  // A new preset starts out as last week, a valid range to adjust from.
  return {
    unit: "week",
    from: boundState(1),
    to: boundState(1),
    label: "",
  };
}

const toBound = (bound: BoundState): RangeBound =>
  bound.mode === "fixed" ? bound.date : bound.periodsAgo;

export function stateToRule(state: FormState): RangeRule {
  return {
    kind: "periods",
    unit: state.unit,
    from: toBound(state.from),
    to: toBound(state.to),
  };
}

const EXAMPLE_LAST_WEEK: RangeRule = {
  kind: "periods",
  unit: "week",
  from: 1,
  to: 1,
};
const EXAMPLE_LAST_SEVEN_DAYS: RangeRule = {
  kind: "periods",
  unit: "day",
  from: 6,
  to: 0,
};

/** Why a rule doesn't resolve, in the form's own terms. */
function invalidReason(state: FormState): string {
  const bounds = [state.from, state.to];
  if (bounds.some((b) => b.mode === "fixed" && !b.date)) {
    return t("report.presetsDialog.pickDate");
  }
  if (
    bounds.some((b) => b.mode === "relative" && !isPeriodsAgo(b.periodsAgo))
  ) {
    return t("report.presetsDialog.badCount");
  }
  return t("report.presetsDialog.fromAfterTo");
}

/** A labeled row of the form's two-column grid; returns the control cell. */
function field(grid: HTMLElement, label: string): HTMLElement {
  grid.createDiv({
    cls: "heatmap-range-presets-modal__field-label",
    text: label,
  });
  return grid.createDiv({ cls: "heatmap-range-presets-modal__field" });
}

/** Right-aligned: Cancel (when editing) before the primary action. */
function submitButtons(
  container: HTMLElement,
  text: string,
  onSubmit: () => void,
  onCancel?: () => void,
): HTMLButtonElement {
  const buttons = container.createDiv({
    cls: "heatmap-range-presets-modal__form-buttons",
  });
  if (onCancel) {
    buttons
      .createEl("button", { text: t("report.actions.cancel") })
      .addEventListener("click", onCancel);
  }
  const submit = buttons.createEl("button", { cls: "mod-cta", text });
  submit.addEventListener("click", onSubmit);
  return submit;
}

/**
 * The add/edit form under the preset list: a unit, and a From and To end that
 * are each a number of periods ago or a fixed date. Typing only refreshes the
 * preview and placeholder; switching a unit or an end's type redraws.
 *
 * Returns a flush for Done clicked mid-edit: it applies a valid edit of an
 * existing preset, but never adds a new one — the add form always holds a
 * draft, so an unclicked one can't be told from an untouched one.
 */
export function renderCustomPresetForm(
  container: HTMLElement,
  options: {
    /** Set when editing an existing custom preset. */
    editing?: RangePresetSetting;
    resolve: (rule: RangeRule) => DateSpan | null;
    onSubmit: (rule: RangeRule, label: string) => void;
    onCancel: () => void;
  },
): () => void {
  const state = initialState(options.editing);

  const draw = () => {
    container.empty();

    container.createDiv({
      cls: "heatmap-range-presets-modal__form-heading",
      text: options.editing
        ? t("report.presetsDialog.editPreset")
        : t("report.presetsDialog.newPreset"),
    });

    const grid = container.createDiv({
      cls: "heatmap-range-presets-modal__form-grid",
    });

    const unitLabel = t("report.presetsDialog.unit");
    const unitSelect = field(grid, unitLabel).createEl("select", {
      cls: "dropdown",
      attr: { "aria-label": unitLabel },
    });
    Object.entries(UNIT_NAMES).forEach(([value, name]) =>
      unitSelect.createEl("option", { value, text: name() }),
    );
    unitSelect.value = state.unit;
    unitSelect.addEventListener("change", () => {
      state.unit = unitSelect.value as RangeUnit;
      draw();
    });

    const drawBound = (end: "from" | "to", bound: BoundState) => {
      const text = BOUND_TEXT[end];
      const cell = field(grid, text.name());
      cell.addClass("heatmap-range-presets-modal__bound");

      const modeSelect = cell.createEl("select", {
        cls: "dropdown",
        attr: { "aria-label": text.type() },
      });
      Object.entries(MODE_NAMES).forEach(([value, name]) =>
        modeSelect.createEl("option", { value, text: name() }),
      );
      modeSelect.value = bound.mode;
      modeSelect.addEventListener("change", () => {
        bound.mode = modeSelect.value as BoundMode;
        draw();
      });

      if (bound.mode === "fixed") {
        const dateInput = cell.createEl("input", {
          attr: { type: "date", "aria-label": text.date() },
          value: bound.date,
        });
        dateInput.addEventListener("input", () => {
          bound.date = dateInput.value;
          refresh();
        });
        return;
      }

      // "Weeks ago" reads as a label before the count, which needs no
      // plural agreement ("1 weeks ago") in any language.
      cell.createSpan({
        cls: "heatmap-range-presets-modal__units-ago",
        text: UNITS_AGO[state.unit](t),
      });
      const countInput = cell.createEl("input", {
        cls: "heatmap-range-presets-modal__count",
        attr: {
          type: "number",
          min: "0",
          step: "1",
          "aria-label": text.count(),
        },
        value: String(bound.periodsAgo),
      });
      countInput.addEventListener("input", () => {
        bound.periodsAgo = Number(countInput.value);
        refresh();
      });
    };
    drawBound("from", state.from);
    drawBound("to", state.to);

    const preview = field(grid, t("report.presetsDialog.dateRange"));
    preview.addClass("heatmap-range-presets-modal__preview");

    const labelText = t("report.presetsDialog.label");
    const labelInput = field(grid, labelText).createEl("input", {
      cls: "heatmap-range-presets-modal__label-input",
      attr: { type: "text", "aria-label": labelText },
      value: state.label,
    });
    labelInput.addEventListener("input", () => {
      state.label = labelInput.value;
    });

    container.createDiv({ cls: "heatmap-range-presets-modal__hint" }).append(
      t("report.presetsDialog.hintMeaning"),
      createEl("br"),
      t("report.presetsDialog.hintExamples", {
        lastWeek: describeRuleLogic(EXAMPLE_LAST_WEEK),
        lastSevenDays: describeRuleLogic(EXAMPLE_LAST_SEVEN_DAYS),
      }),
    );

    const submit = submitButtons(
      container,
      options.editing
        ? t("report.actions.saveChanges")
        : t("report.actions.addPreset"),
      () => options.onSubmit(stateToRule(state), state.label),
      options.editing ? options.onCancel : undefined,
    );

    function refresh() {
      const rule = stateToRule(state);
      const span = options.resolve(rule);
      // An invalid rule has nothing sensible to suggest ("Weeks ago: -1 → 1").
      labelInput.placeholder = span ? describeRule(rule) : "";
      preview.setText(
        span
          ? describeSpan(rule, span)
          : t("report.presetsDialog.invalidBecause", {
              reason: invalidReason(state),
            }),
      );
      preview.toggleClass("is-invalid", !span);
      submit.disabled = !span;
    }

    refresh();
  };

  draw();

  return () => {
    const rule = stateToRule(state);
    if (options.editing && options.resolve(rule)) {
      options.onSubmit(rule, state.label);
    }
  };
}

/**
 * The form for a built-in preset: its rule is fixed, so only its name can
 * change. A blank name restores the built-in's translated one. Returns a
 * flush that applies the typed name, for Done clicked mid-rename.
 */
export function renderRenameBuiltinForm(
  container: HTMLElement,
  options: {
    preset: RangePresetSetting;
    rule: RangeRule;
    defaultLabel: string;
    resolve: (rule: RangeRule) => DateSpan | null;
    onSubmit: (label: string) => void;
    onCancel: () => void;
  },
): () => void {
  let label = options.preset.label ?? "";
  container.empty();

  container.createDiv({
    cls: "heatmap-range-presets-modal__form-heading",
    text: t("report.presetsDialog.renamePreset", {
      name: options.defaultLabel,
    }),
  });

  const grid = container.createDiv({
    cls: "heatmap-range-presets-modal__form-grid",
  });
  const ruleCell = field(grid, t("report.presetsDialog.range"));
  ruleCell.addClass("heatmap-range-presets-modal__rule");
  ruleCell.setText(describeRuleLogic(options.rule));

  const preview = field(grid, t("report.presetsDialog.dateRange"));
  preview.addClass("heatmap-range-presets-modal__preview");
  preview.setText(describeSpan(options.rule, options.resolve(options.rule)));

  const labelText = t("report.presetsDialog.label");
  const labelInput = field(grid, labelText).createEl("input", {
    cls: "heatmap-range-presets-modal__label-input",
    attr: {
      type: "text",
      "aria-label": labelText,
      placeholder: options.defaultLabel,
    },
    value: label,
  });
  labelInput.addEventListener("input", () => {
    label = labelInput.value;
  });

  submitButtons(
    container,
    t("report.actions.saveChanges"),
    () => options.onSubmit(label),
    options.onCancel,
  );

  return () => options.onSubmit(label);
}
