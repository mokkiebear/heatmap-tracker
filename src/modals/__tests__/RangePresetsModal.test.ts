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

const withCustom = () => [...mergePresets(undefined), custom];

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
  /** The button with this text, or this aria-label, inside `scope`. */
  const button = (name: string, scope: HTMLElement = el) =>
    Array.from(scope.querySelectorAll("button")).find(
      (b) => b.textContent === name || b.getAttribute("aria-label") === name,
    )!;
  const press = (name: string, scope?: HTMLElement) =>
    button(name, scope).click();
  const done = () => {
    press("Done");
    return onSave.mock.calls[0][0] as RangePresetSetting[];
  };
  const input = <T extends HTMLElement = HTMLInputElement>(label: string) =>
    el.querySelector<T>(`[aria-label="${label}"]`)!;
  const select = (label: string, value: string) => {
    input<HTMLSelectElement>(label).value = value;
    input(label).dispatchEvent(new Event("change"));
  };
  const type = (label: string, value: string) => {
    input(label).value = value;
    input(label).dispatchEvent(new Event("input"));
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
    labels,
    row,
    button,
    press,
    done,
    input,
    select,
    type,
    drag,
  };
}

type Opened = ReturnType<typeof open>;

afterEach(() => {
  document.body.innerHTML = "";
});

describe("RangePresetsModal", () => {
  it("lists every preset, hidden ones included, with its rule, what it covers today and its actions", () => {
    const { labels, row } = open(withCustom());

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
      "Semester",
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
    expect(
      row("Semester").querySelector(".heatmap-range-presets-modal__detail")!
        .textContent,
    ).toBe("Sep 1, 2026 → Days ago: 0 · Sep 1, 2026 – Oct 7, 2026");

    // Rename/edit on every preset, delete only on custom ones.
    const action = (label: string, name: string) =>
      row(label).querySelector(`[aria-label="${name}"]`);
    expect(action("presetLastYear", "Rename")).not.toBeNull();
    expect(action("presetLastYear", "Delete")).toBeNull();
    expect(action("Semester", "Edit")).not.toBeNull();
    expect(action("Semester", "Delete")).not.toBeNull();
  });

  it("toggles visibility with the eye button", () => {
    const { row, press, done } = open();

    press("Hidden. Click to show.", row("presetLastQuarter"));

    expect(done().find((p) => p.id === "lastQuarter")?.visible).toBe(true);
  });

  it("reorders by dragging a row's handle onto another row, or past the last one", () => {
    const { el, row, labels, drag } = open();

    drag(row("presetLastWeek"), row("presetAllLoggedData"));
    expect(labels()[0]).toBe("presetLastWeek");

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
    const { el, select, input } = open();

    // The count reads as part of a phrase: "1 weeks ago".
    expect(input("From periods ago").nextElementSibling?.textContent).toBe(
      "weeks ago",
    );

    select("From type", "fixed");
    expect(el.querySelector('[aria-label="From date"]')).not.toBeNull();
    expect(el.querySelector('[aria-label="From periods ago"]')).toBeNull();
    expect(el.querySelector('[aria-label="To periods ago"]')).not.toBeNull();
  });

  it("adds a custom preset from the form, shown by default, with an accent button", () => {
    const { el, select, type, button, press, labels, done } = open();

    select("Unit", "month");
    type("From periods ago", "2");
    type("To periods ago", "0");
    type("Label", "Quarter so far");
    expect(el.textContent).toContain("Aug 1, 2026 – Oct 7, 2026");
    expect(button("Add preset").classList).toContain("mod-cta");
    press("Add preset");

    expect(last(labels())).toBe("Quarter so far");
    expect(last(done())).toMatchObject({
      visible: true,
      label: "Quarter so far",
      rule: { kind: "periods", unit: "month", from: 2, to: 0 },
    });
  });

  it("defaults an unnamed custom preset's label to its rule", () => {
    const { input, type, press, labels } = open();

    type("From periods ago", "1");
    type("To periods ago", "0");
    expect(input("Label").placeholder).toBe("Weeks ago: 1 → 0");
    press("Add preset");

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

    type("From date", "2026-10-08");
    type("To periods ago", "0");
    expect(button("Add preset").disabled).toBe(true);
    expect(el.textContent).toContain("From comes after To.");

    type("From date", "2026-09-01");
    expect(button("Add preset").disabled).toBe(false);

    type("To periods ago", "-1");
    expect(el.textContent).toContain(
      "Periods ago must be a whole number, 0 or more.",
    );
  });

  it("edits a custom preset in place", () => {
    const { row, type, button, press, done } = open([custom]);

    press("Edit", row("Semester"));
    expect(row("Semester").classList).toContain("is-editing");
    type("From date", "2026-08-25");
    expect(button("Save changes").classList).toContain("mod-cta");
    press("Save changes");

    expect(done()).toEqual([
      {
        ...custom,
        rule: { kind: "periods", unit: "day", from: "2026-08-25", to: 0 },
      },
    ]);
  });

  it("renames a built-in without touching its rule", () => {
    const { el, row, input, type, press, labels, done } = open();

    press("Rename", row("presetLastMonth"));
    expect(el.textContent).toContain("Months ago: 1 → 1");
    expect(el.querySelector('[aria-label="Unit"]')).toBeNull();
    expect(input("Label").placeholder).toBe("presetLastMonth");
    type("Label", "Prior month");
    press("Save changes");

    expect(labels()[3]).toBe("Prior month");
    expect(done().find((p) => p.id === "lastMonth")).toEqual({
      id: "lastMonth",
      visible: true,
      label: "Prior month",
    });
  });

  it("restores a built-in's own name when renamed to blank", () => {
    const { row, type, press, labels } = open([
      { id: "lastMonth", visible: true, label: "Prior month" },
    ]);

    press("Rename", row("Prior month"));
    type("Label", "  ");
    press("Save changes");

    expect(labels()).toEqual(["presetLastMonth"]);
  });

  it("deletes a custom preset", () => {
    const { row, press, done } = open(withCustom());

    press("Delete", row("Semester"));

    expect(done().some((p) => p.id === "custom-a")).toBe(false);
  });

  it("resets built-ins, names included, but keeps custom presets", () => {
    const presets = mergePresets(undefined).map((preset) =>
      preset.id === "lastMonth" ? { ...preset, label: "Prior month" } : preset,
    );
    const { row, press, drag, done } = open([...presets, custom]);

    drag(row("presetLastWeek"), row("presetAllLoggedData"));
    press("Reset");

    expect(done()).toEqual(withCustom());
  });

  it("closes a built-in's rename form on Reset, which replaces the built-ins", () => {
    const { el, row, press } = open();

    press("Rename", row("presetLastMonth"));
    press("Reset");

    expect(el.textContent).toContain("New custom preset");
    expect(el.querySelector(".is-editing")).toBeNull();
  });

  it.each<[string, (m: Opened) => void]>([
    [
      "closed without Done",
      (m) => {
        m.press("Hidden. Click to show.", m.row("presetLastQuarter"));
        m.modal.close();
      },
    ],
    ["Done changes nothing", (m) => m.press("Done")],
    [
      "an open custom edit is invalid",
      (m) => {
        m.press("Edit", m.row("Semester"));
        m.type("From date", "2026-10-08");
        m.press("Done");
      },
    ],
    [
      "a new preset was never added",
      (m) => {
        m.type("Label", "Draft");
        m.press("Done");
      },
    ],
  ])("saves nothing when %s", (_, act) => {
    const opened = open(withCustom());

    act(opened);

    expect(opened.onSave).not.toHaveBeenCalled();
  });

  it.each<[string, (m: Opened) => void, Partial<RangePresetSetting>]>([
    [
      "rename",
      (m) => {
        m.press("Rename", m.row("presetLastMonth"));
        m.type("Label", "Prior month");
      },
      { id: "lastMonth", label: "Prior month" },
    ],
    [
      "valid custom edit",
      (m) => {
        m.press("Edit", m.row("Semester"));
        m.type("From date", "2026-08-25");
      },
      {
        id: "custom-a",
        rule: { kind: "periods", unit: "day", from: "2026-08-25", to: 0 },
      },
    ],
  ])("saves once on Done, applying an open %s", (_, act, expected) => {
    const opened = open(withCustom());

    act(opened);
    opened.press("Done");

    expect(opened.onSave).toHaveBeenCalledTimes(1);
    expect(opened.onSave.mock.calls[0][0]).toContainEqual(
      expect.objectContaining(expected),
    );
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
});
