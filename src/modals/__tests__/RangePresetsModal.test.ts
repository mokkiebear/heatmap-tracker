import { App } from "obsidian";
import i18n from "src/localization/i18n";
import { RangePresetSetting } from "src/types";
import { parseUTCDate } from "src/utils/date";
import { resolveRangeRule } from "src/views/ExportView/exportRange";
import { mergePresets, presetLabel } from "src/views/ExportView/rangePresets";
import { RangePresetsModal } from "../RangePresetsModal";

const last = <T>(list: T[]) => list[list.length - 1];

const custom: RangePresetSetting = {
  id: "custom-a",
  visible: true,
  label: "Semester",
  rule: { kind: "periods", unit: "day", from: "2026-09-01", to: 0 },
};

function open(presets = mergePresets(undefined)) {
  const onSave = jest.fn();
  const modal = new RangePresetsModal(
    new App(),
    presets,
    (rule) =>
      resolveRangeRule(rule, {
        today: parseUTCDate("2026-10-07"),
        weekStartDay: 1,
        entriesByDate: {},
      }),
    // Built-in names show as their bare key, so rows are easy to find;
    // everything else (rule notation, dates) is the real English text.
    (preset) =>
      presetLabel(preset, (key, params) =>
        /^report\.preset(?!sDialog)/.test(key)
          ? key.replace("report.", "")
          : i18n.t(key, params),
      ),
    onSave,
  );
  modal.open();
  const el = modal.contentEl;

  const rows = () =>
    Array.from(
      el.querySelectorAll<HTMLElement>(".heatmap-range-presets-modal__row"),
    );
  const labels = () =>
    rows().map(
      (row) =>
        row.querySelector(".heatmap-range-presets-modal__label")!.textContent,
    );
  const row = (label: string) =>
    rows().find((r) => r.textContent!.includes(label))!;
  const button = (text: string) =>
    Array.from(el.querySelectorAll("button")).find(
      (b) => b.textContent === text,
    )!;
  const done = () => {
    button("Done").click();
    return onSave.mock.calls[0][0] as RangePresetSetting[];
  };
  const select = (ariaLabel: string, value: string) => {
    const input = el.querySelector<HTMLSelectElement>(
      `select[aria-label="${ariaLabel}"]`,
    )!;
    input.value = value;
    input.dispatchEvent(new Event("change"));
  };
  const type = (selector: string, value: string) => {
    const input = el.querySelector<HTMLInputElement>(selector)!;
    input.value = value;
    input.dispatchEvent(new Event("input"));
  };
  const drag = (from: HTMLElement, to: HTMLElement) => {
    from
      .querySelector(".heatmap-range-presets-modal__handle")!
      .dispatchEvent(new Event("mousedown"));
    from.dispatchEvent(new Event("dragstart"));
    to.dispatchEvent(new Event("drop"));
  };

  return {
    modal,
    el,
    onSave,
    rows,
    labels,
    row,
    button,
    done,
    select,
    type,
    drag,
  };
}

afterEach(() => {
  document.body.innerHTML = "";
});

describe("RangePresetsModal", () => {
  it("lists every preset, hidden ones included, with its rule and what it covers today", () => {
    const { labels, row } = open();

    expect(labels()).toEqual([
      "presetAllLoggedData",
      "presetLastWeek",
      "presetWeekToDate",
      "presetLastMonth",
      "presetMonthToDate",
      "presetLastQuarter",
      "presetQuarterToDate",
      "presetLastYear",
      "presetYearToDate",
    ]);
    expect(row("presetLastQuarter").classList).toContain("is-hidden");
    expect(row("presetWeekToDate").classList).not.toContain("is-hidden");
    expect(row("presetLastWeek").textContent).toContain(
      "Weeks ago: 1 → 1 · Sep 28, 2026 – Oct 4, 2026",
    );
    expect(row("presetWeekToDate").textContent).toContain(
      "Weeks ago: 0 → 0 · Oct 5, 2026 – Oct 7, 2026",
    );
    expect(row("presetLastQuarter").textContent).toContain(
      "Quarters ago: 1 → 1 · Jul 1, 2026 – Sep 30, 2026",
    );
    expect(row("presetAllLoggedData").textContent).toContain(
      "First → last logged day · No logged data",
    );
  });

  it("shows a custom preset's rule the same way, fixed dates included", () => {
    const { row } = open([custom]);

    expect(
      row("Semester").querySelector(".heatmap-range-presets-modal__detail")!
        .textContent,
    ).toBe("Sep 1, 2026 → Days ago: 0 · Sep 1, 2026 – Oct 7, 2026");
  });

  it("offers rename/edit on every preset, and delete only on custom ones", () => {
    const { row } = open([...mergePresets(undefined), custom]);

    expect(
      row("presetLastYear").querySelector('[aria-label="Rename"]'),
    ).not.toBeNull();
    expect(
      row("presetLastYear").querySelector('[aria-label="Delete"]'),
    ).toBeNull();
    expect(row("Semester").querySelector('[aria-label="Edit"]')).not.toBeNull();
    expect(
      row("Semester").querySelector('[aria-label="Delete"]'),
    ).not.toBeNull();
  });

  it("explains the From → To counts with examples under the form", () => {
    const { el } = open();
    const hint = el.querySelector(".heatmap-range-presets-modal__hint")!;

    expect(hint.textContent).toBe(
      "0 means the current period, through today; 1 means the previous complete period." +
        "Examples: Last week (Weeks ago: 1 → 1), Last 7 days (Days ago: 6 → 0).",
    );
    expect(hint.querySelector("br")).not.toBeNull();
  });

  it("toggles visibility with the eye button", () => {
    const { row, done } = open();

    row("presetLastQuarter")
      .querySelector<HTMLButtonElement>(
        '[aria-label="Hidden. Click to show."]',
      )!
      .click();

    expect(done().find((p) => p.id === "lastQuarter")?.visible).toBe(true);
  });

  it("reorders by dragging a row's handle onto another row", () => {
    const { row, labels, drag } = open();

    drag(row("presetLastWeek"), row("presetAllLoggedData"));

    expect(labels()[0]).toBe("presetLastWeek");
  });

  it("moves a row to the end when dropped after the last row", () => {
    const { el, row, labels, drag } = open();

    drag(
      row("presetAllLoggedData"),
      el.querySelector<HTMLElement>(".heatmap-range-presets-modal__drop-end")!,
    );

    expect(last(labels())).toBe("presetAllLoggedData");
  });

  it("doesn't start a drag from anywhere but the handle", () => {
    const { row, labels } = open();
    const before = labels();

    row("presetLastWeek").dispatchEvent(new Event("dragstart"));
    row("presetAllLoggedData").dispatchEvent(new Event("drop"));

    expect(labels()).toEqual(before);
  });

  it("builds a rule from a unit and two ends, each relative or a fixed date", () => {
    const { el, select } = open();
    const options = (ariaLabel: string) =>
      Array.from(
        el.querySelectorAll(`select[aria-label="${ariaLabel}"] option`),
      ).map((o) => o.textContent);

    expect(options("Unit")).toEqual([
      "Day",
      "Week",
      "Month",
      "Quarter",
      "Year",
    ]);
    expect(options("From type")).toEqual(["Relative", "Fixed date"]);
    expect(el.textContent).toContain("Weeks ago");

    select("From type", "fixed");
    expect(el.querySelector('input[aria-label="From date"]')).not.toBeNull();
    expect(el.querySelector('input[aria-label="From periods ago"]')).toBeNull();
    expect(
      el.querySelector('input[aria-label="To periods ago"]'),
    ).not.toBeNull();
  });

  it("adds a custom preset from the form, shown by default, with an accent button", () => {
    const { el, select, type, button, labels, done } = open();

    select("Unit", "month");
    type('input[aria-label="From periods ago"]', "2");
    type('input[aria-label="To periods ago"]', "0");
    type('input[aria-label="Label"]', "Quarter so far");
    expect(el.textContent).toContain("Aug 1, 2026 – Oct 7, 2026");
    expect(button("Add preset").classList).toContain("mod-cta");
    button("Add preset").click();

    expect(last(labels())).toBe("Quarter so far");
    expect(last(done())).toMatchObject({
      visible: true,
      label: "Quarter so far",
      rule: { kind: "periods", unit: "month", from: 2, to: 0 },
    });
  });

  it("defaults an unnamed custom preset's label to its rule", () => {
    const { el, type, button, labels } = open();

    type('input[aria-label="From periods ago"]', "1");
    type('input[aria-label="To periods ago"]', "0");
    expect(
      el.querySelector<HTMLInputElement>('input[aria-label="Label"]')!
        .placeholder,
    ).toBe("Weeks ago: 1 → 0");
    button("Add preset").click();

    expect(last(labels())).toBe("Weeks ago: 1 → 0");
  });

  it("won't add a preset until its range is valid, and says why", () => {
    const { el, select, type, button } = open();

    select("From type", "fixed");
    expect(button("Add preset").disabled).toBe(true);
    expect(el.textContent).toContain("Pick a date.");
    expect(
      el.querySelector(".heatmap-range-presets-modal__preview")!.classList,
    ).toContain("is-invalid");

    type('input[aria-label="From date"]', "2026-10-08");
    type('input[aria-label="To periods ago"]', "0");
    expect(button("Add preset").disabled).toBe(true);
    expect(el.textContent).toContain("From comes after To.");

    type('input[aria-label="From date"]', "2026-09-01");
    expect(button("Add preset").disabled).toBe(false);

    type('input[aria-label="To periods ago"]', "-1");
    expect(el.textContent).toContain(
      "Periods ago must be a whole number, 0 or more.",
    );
  });

  it("edits a custom preset in place", () => {
    const { row, type, button, done } = open([custom]);

    row("Semester")
      .querySelector<HTMLButtonElement>('[aria-label="Edit"]')!
      .click();
    expect(row("Semester").classList).toContain("is-editing");
    type('input[aria-label="From date"]', "2026-08-25");
    expect(button("Save changes").classList).toContain("mod-cta");
    button("Save changes").click();

    const saved = done().find((p) => p.id === "custom-a");
    expect(saved?.rule).toEqual({
      kind: "periods",
      unit: "day",
      from: "2026-08-25",
      to: 0,
    });
    expect(saved?.label).toBe("Semester");
  });

  it("renames a built-in without touching its rule", () => {
    const { el, row, type, button, labels, done } = open();

    row("presetLastMonth")
      .querySelector<HTMLButtonElement>('[aria-label="Rename"]')!
      .click();
    expect(el.textContent).toContain("Months ago: 1 → 1");
    expect(el.querySelector('select[aria-label="Unit"]')).toBeNull();
    expect(
      el.querySelector<HTMLInputElement>('input[aria-label="Label"]')!
        .placeholder,
    ).toBe("presetLastMonth");
    type('input[aria-label="Label"]', "Prior month");
    button("Save changes").click();

    expect(labels()[3]).toBe("Prior month");
    expect(done().find((p) => p.id === "lastMonth")).toEqual({
      id: "lastMonth",
      visible: true,
      label: "Prior month",
    });
  });

  it("restores a built-in's own name when renamed to blank", () => {
    const { row, type, button, labels } = open([
      { id: "lastMonth", visible: true, label: "Prior month" },
    ]);

    row("Prior month")
      .querySelector<HTMLButtonElement>('[aria-label="Rename"]')!
      .click();
    type('input[aria-label="Label"]', "  ");
    button("Save changes").click();

    expect(labels()).toEqual(["presetLastMonth"]);
  });

  it("deletes a custom preset", () => {
    const { row, done } = open([...mergePresets(undefined), custom]);

    row("Semester")
      .querySelector<HTMLButtonElement>('[aria-label="Delete"]')!
      .click();

    expect(done().some((p) => p.id === "custom-a")).toBe(false);
  });

  it("resets built-ins, names included, but keeps custom presets", () => {
    const presets = mergePresets(undefined).map((preset) =>
      preset.id === "lastMonth" ? { ...preset, label: "Prior month" } : preset,
    );
    const { row, button, drag, done } = open([...presets, custom]);

    drag(row("presetLastWeek"), row("presetAllLoggedData"));
    button("Reset").click();

    expect(done()).toEqual([...mergePresets(undefined), custom]);
  });

  it("saves nothing when closed without Done", () => {
    const { modal, row, onSave } = open();

    row("presetLastQuarter")
      .querySelector<HTMLButtonElement>(
        '[aria-label="Hidden. Click to show."]',
      )!
      .click();
    modal.close();

    expect(onSave).not.toHaveBeenCalled();
  });

  it("saves once on Done, and writes nothing when nothing changed", () => {
    const changed = open();
    changed.drag(
      changed.row("presetLastWeek"),
      changed.row("presetAllLoggedData"),
    );
    changed.button("Done").click();
    expect(changed.onSave).toHaveBeenCalledTimes(1);

    const untouched = open();
    untouched.button("Done").click();
    expect(untouched.onSave).not.toHaveBeenCalled();
  });

  it("applies an open rename on Done, without Save changes first", () => {
    const { row, type, done } = open();

    row("presetLastMonth")
      .querySelector<HTMLButtonElement>('[aria-label="Rename"]')!
      .click();
    type('input[aria-label="Label"]', "Prior month");

    expect(done().find((p) => p.id === "lastMonth")?.label).toBe("Prior month");
  });

  it("applies an open custom edit on Done, but only if it is valid", () => {
    const valid = open([custom]);
    valid
      .row("Semester")
      .querySelector<HTMLButtonElement>('[aria-label="Edit"]')!
      .click();
    valid.type('input[aria-label="From date"]', "2026-08-25");
    expect(valid.done()[0].rule).toEqual({
      kind: "periods",
      unit: "day",
      from: "2026-08-25",
      to: 0,
    });

    const invalid = open([custom]);
    invalid
      .row("Semester")
      .querySelector<HTMLButtonElement>('[aria-label="Edit"]')!
      .click();
    invalid.type('input[aria-label="From date"]', "2026-10-08");
    invalid.button("Done").click();
    expect(invalid.onSave).not.toHaveBeenCalled();
  });

  it("doesn't add an unsubmitted new preset on Done", () => {
    const { type, button, onSave } = open();

    type('input[aria-label="Label"]', "Draft");
    button("Done").click();

    expect(onSave).not.toHaveBeenCalled();
  });

  it("keeps Reset and Done outside the scrolling body", () => {
    const { el } = open();
    const body = el.querySelector(".heatmap-range-presets-modal__body")!;
    const footer = el.querySelector(".heatmap-range-presets-modal__footer")!;

    expect(
      body.querySelector(".heatmap-range-presets-modal__list"),
    ).not.toBeNull();
    expect(
      body.querySelector(".heatmap-range-presets-modal__form"),
    ).not.toBeNull();
    expect(body.contains(footer)).toBe(false);
    expect(
      Array.from(footer.querySelectorAll("button")).map((b) => b.textContent),
    ).toEqual(["Reset", "Done"]);
    expect(footer.querySelector("button")!.classList).toContain("mod-warning");
  });

  it("closes a built-in's rename form on Reset, which replaces the built-ins", () => {
    const { el, row, button } = open();

    row("presetLastMonth")
      .querySelector<HTMLButtonElement>('[aria-label="Rename"]')!
      .click();
    button("Reset").click();

    expect(el.textContent).toContain("New custom preset");
    expect(el.querySelector(".is-editing")).toBeNull();
  });
});
