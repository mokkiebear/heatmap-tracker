import { IHeatmapView, TrackerSettings } from "../../types";

// Obsidian monkeypatches these DOM-helper methods onto HTMLElement.prototype
// at runtime; jsdom doesn't have them, so polyfill the subset HeatmapModal
// uses (mirrors the same pattern in palette.settings.test.ts).
type ElementOptions = {
  cls?: string | string[];
  text?: string;
  attr?: Record<string, string | boolean>;
  value?: string;
};

const applyElementOptions = (element: HTMLElement, options: ElementOptions = {}) => {
  const { cls, text, attr, value } = options;

  if (cls) {
    const classes = Array.isArray(cls) ? cls : cls.split(" ");
    classes.filter(Boolean).forEach((className) => element.classList.add(className));
  }
  if (text !== undefined) {
    element.textContent = text;
  }
  if (attr) {
    for (const [key, rawValue] of Object.entries(attr)) {
      element.setAttribute(key, String(rawValue));
    }
  }
  if (value !== undefined) {
    (element as HTMLInputElement).value = value;
  }
  return element;
};

beforeAll(() => {
  const proto = HTMLElement.prototype as any;

  proto.createDiv = function (options?: ElementOptions) {
    const div = document.createElement("div");
    applyElementOptions(div, options);
    this.appendChild(div);
    return div;
  };
  proto.createSpan = function (options?: ElementOptions) {
    const span = document.createElement("span");
    applyElementOptions(span, options);
    this.appendChild(span);
    return span;
  };
  proto.createEl = function (tag: string, options?: ElementOptions) {
    const element = document.createElement(tag);
    applyElementOptions(element, options);
    this.appendChild(element);
    return element;
  };
  proto.empty = function () {
    this.innerHTML = "";
  };
  proto.addClass = function (cls: string) {
    this.classList.add(cls);
  };
  proto.removeClass = function (cls: string) {
    this.classList.remove(cls);
  };
  proto.toggleClass = function (cls: string, force: boolean) {
    this.classList.toggle(cls, force);
  };
});

const renderAppMock = jest.fn();
jest.mock("../../render", () => ({
  renderApp: (...args: any[]) => renderAppMock(...args),
}));

jest.mock("react-dom/client", () => ({}));
jest.mock("../../App", () => ({ __esModule: true, default: () => null }));

let dataviewPages: Record<string, unknown>[] = [];
function chainablePages(pages: Record<string, unknown>[], source?: string): any {
  return {
    __source: source,
    where(predicate: (p: any) => boolean) {
      return chainablePages(pages.filter(predicate), source);
    },
    [Symbol.iterator]() {
      return pages[Symbol.iterator]();
    },
  };
}
const getAPIMock = jest.fn((_app?: unknown) => ({
  pages: (source?: string) => chainablePages(dataviewPages, source),
}));
jest.mock("obsidian-dataview", () => ({
  getAPI: (...args: any[]) => getAPIMock(...args),
}));

const getAllTagsMock = jest.fn((_cache?: unknown) => [] as string[]);

jest.mock("obsidian", () => {
  class MockTextComponent {
    inputEl: HTMLInputElement = document.createElement("input");
    private handler?: (value: string) => void;

    setPlaceholder(text: string) {
      this.inputEl.placeholder = text;
      return this;
    }
    setValue(value: string) {
      this.inputEl.value = value;
      return this;
    }
    getValue() {
      return this.inputEl.value;
    }
    onChange(handler: (value: string) => void) {
      this.handler = handler;
      return this;
    }
    trigger(value: string) {
      this.inputEl.value = value;
      this.handler?.(value);
    }
  }

  class MockToggleComponent {
    value = false;
    private handler?: (value: boolean) => void;

    setValue(value: boolean) {
      this.value = value;
      return this;
    }
    onChange(handler: (value: boolean) => void) {
      this.handler = handler;
      return this;
    }
    trigger(value: boolean) {
      this.value = value;
      this.handler?.(value);
    }
  }

  class MockDropdownComponent {
    selectEl: HTMLSelectElement = document.createElement("select");
    value = "";
    private handler?: (value: string) => void;

    addOption(value: string, label: string) {
      const opt = document.createElement("option");
      opt.value = value;
      opt.text = label;
      this.selectEl.appendChild(opt);
      return this;
    }
    setValue(value: string) {
      this.value = value;
      return this;
    }
    onChange(handler: (value: string) => void) {
      this.handler = handler;
      return this;
    }
    trigger(value: string) {
      this.value = value;
      this.handler?.(value);
    }
  }

  class MockButtonComponent {
    buttonEl: HTMLButtonElement = document.createElement("button");
    disabled = false;
    private handler?: () => void;

    setButtonText(text: string) {
      this.buttonEl.textContent = text;
      return this;
    }
    setCta() {
      return this;
    }
    setDisabled(disabled: boolean) {
      this.disabled = disabled;
      return this;
    }
    onClick(handler: () => void) {
      this.handler = handler;
      return this;
    }
    trigger() {
      this.handler?.();
    }
  }

  class MockExtraButtonComponent {
    private handler?: () => void;

    setIcon() {
      return this;
    }
    setTooltip() {
      return this;
    }
    onClick(handler: () => void) {
      this.handler = handler;
      return this;
    }
    trigger() {
      this.handler?.();
    }
  }

  class MockSetting {
    static instances: MockSetting[] = [];

    settingEl: HTMLElement;
    controlEl: HTMLElement;
    texts: MockTextComponent[] = [];
    toggles: MockToggleComponent[] = [];
    dropdowns: MockDropdownComponent[] = [];
    buttons: MockButtonComponent[] = [];
    extraButtons: MockExtraButtonComponent[] = [];

    constructor(public containerEl: HTMLElement) {
      this.settingEl = document.createElement("div");
      this.controlEl = document.createElement("div");
      this.settingEl.appendChild(this.controlEl);
      containerEl.appendChild(this.settingEl);
      MockSetting.instances.push(this);
    }

    setName() {
      return this;
    }
    setDesc() {
      return this;
    }
    setClass(cls: string) {
      this.settingEl.className = cls;
      return this;
    }
    setHeading() {
      return this;
    }
    addText(cb: (t: MockTextComponent) => void) {
      const t = new MockTextComponent();
      this.texts.push(t);
      cb(t);
      return this;
    }
    addToggle(cb: (t: MockToggleComponent) => void) {
      const t = new MockToggleComponent();
      this.toggles.push(t);
      cb(t);
      return this;
    }
    addDropdown(cb: (d: MockDropdownComponent) => void) {
      const d = new MockDropdownComponent();
      this.dropdowns.push(d);
      cb(d);
      return this;
    }
    addButton(cb: (b: MockButtonComponent) => void) {
      const b = new MockButtonComponent();
      this.buttons.push(b);
      cb(b);
      return this;
    }
    addExtraButton(cb: (b: MockExtraButtonComponent) => void) {
      const b = new MockExtraButtonComponent();
      this.extraButtons.push(b);
      cb(b);
      return this;
    }
  }

  class MockModal {
    app: unknown;
    contentEl: HTMLElement = document.createElement("div");
    modalEl: HTMLElement = document.createElement("div");
    closeCalled = false;

    constructor(app: unknown) {
      this.app = app;
    }
    setTitle() {
      return this;
    }
    open() {
      (this as any).onOpen?.();
    }
    close() {
      this.closeCalled = true;
      (this as any).onClose?.();
    }
  }

  return {
    App: class {},
    Modal: MockModal,
    Setting: MockSetting,
    DropdownComponent: MockDropdownComponent,
    ButtonComponent: MockButtonComponent,
    setIcon: jest.fn(),
    getAllTags: getAllTagsMock,
  };
});

import { HeatmapModal } from "../HeatmapModal";
// eslint-disable-next-line @typescript-eslint/no-var-requires
const { Setting } = require("obsidian");

describe("HeatmapModal", () => {
  const baseSettings: TrackerSettings = {
    palettes: { default: ["#111", "#222"], danger: ["#f00", "#0f0"] },
    weekStartDay: 1,
    weekDisplayMode: "even",
    separateMonths: true,
    showWeekNums: false,
    language: "en",
    viewTabsVisibility: {
      [IHeatmapView.Documentation]: true,
      [IHeatmapView.HeatmapTracker]: true,
      [IHeatmapView.HeatmapTrackerStatistics]: true,
      [IHeatmapView.Legend]: true,
    },
  };

  let onSubmit: jest.Mock;
  let modal: HeatmapModal;

  beforeEach(() => {
    jest.useFakeTimers();
    jest.clearAllMocks();
    Setting.instances = [];
    dataviewPages = [];
    onSubmit = jest.fn();
    const app = {
      vault: { getMarkdownFiles: () => [] },
      metadataCache: { getFileCache: () => null },
    };
    modal = new HeatmapModal(app as any, baseSettings, onSubmit);
    modal.open();
  });

  afterEach(() => {
    jest.useRealTimers();
  });

  // `Setting.instances` accumulates forever, including rows that were later
  // discarded by a container's `.empty()` rebuild (e.g. switching a filter's
  // operator, or removing a row). `.empty()` (innerHTML reset) detaches those
  // elements from the DOM, so filtering on `parentElement` gives us only the
  // settings that are still actually rendered.
  function liveSettings() {
    return Setting.instances.filter((s: any) => s.settingEl.parentElement !== null);
  }
  function allDropdowns() {
    return liveSettings().flatMap((s: any) => s.dropdowns);
  }
  function allTexts() {
    return liveSettings().flatMap((s: any) => s.texts);
  }
  function allButtons() {
    return liveSettings().flatMap((s: any) => s.buttons);
  }
  function submitButton() {
    // The submit button is the last button rendered (Insert Heatmap).
    const buttons = allButtons();
    return buttons[buttons.length - 1];
  }
  function addPropertyCustomText() {
    // Custom-property text input is the last text field before the "Add" button row.
    return allTexts().find((t: any) => t.inputEl.placeholder === "Or type a custom property name");
  }
  function addCustomPropertyButton() {
    return allButtons().find((b: any) => b.buttonEl.textContent === "Add");
  }
  function addTagCustomText() {
    return allTexts().find(
      (t: any) => t.inputEl.placeholder === "Or type a tag (e.g. journal)",
    );
  }
  function addCustomTagButton() {
    // The tag ChipList's "Add" button is the 2nd one (properties' comes first).
    return allButtons().filter((b: any) => b.buttonEl.textContent === "Add")[1];
  }
  function findRawButtonByText(text: string): HTMLButtonElement | undefined {
    const buttons = Array.from(
      (modal as any).contentEl.querySelectorAll("button"),
    ) as HTMLButtonElement[];
    return buttons.find((b) => b.textContent === text);
  }
  function filterPropertyTexts() {
    return allTexts().filter((t: any) => t.inputEl.placeholder === "Property");
  }
  function filterValueTexts() {
    return allTexts().filter((t: any) => t.inputEl.placeholder === "Value");
  }
  function filterOperatorDropdowns() {
    return allDropdowns().filter((d: any) =>
      Array.from(d.selectEl.options).some((o: any) => o.value === "notEmpty"),
    );
  }
  function filterRemoveButtons() {
    return liveSettings()
      .filter((s: any) => s.texts[0]?.inputEl.placeholder === "Property")
      .flatMap((s: any) => s.extraButtons);
  }

  it("disables Insert until a property is selected", () => {
    expect(submitButton().disabled).toBe(true);
  });

  it("adding a custom property enables Insert and clears the error banner", () => {
    addPropertyCustomText()!.trigger("exercise");
    addCustomPropertyButton()!.trigger();

    expect(submitButton().disabled).toBe(false);
  });

  it("submits a single property as a plain string", () => {
    addPropertyCustomText()!.trigger("exercise");
    addCustomPropertyButton()!.trigger();

    submitButton().trigger();

    expect(onSubmit).toHaveBeenCalledTimes(1);
    const config = onSubmit.mock.calls[0][0];
    expect(config.property).toBe("exercise");
  });

  it("submits multiple properties as an array", () => {
    addPropertyCustomText()!.trigger("exercise");
    addCustomPropertyButton()!.trigger();
    addPropertyCustomText()!.trigger("steps");
    addCustomPropertyButton()!.trigger();

    submitButton().trigger();

    const config = onSubmit.mock.calls[0][0];
    expect(config.property).toEqual(["exercise", "steps"]);
  });

  it("does not submit while validation errors remain (custom date range, no dates)", () => {
    addPropertyCustomText()!.trigger("exercise");
    addCustomPropertyButton()!.trigger();

    // Layout & date range: dateRangeMode dropdown is the 2nd dropdown added
    // (Layout is 1st, date range 2nd) among top-level dropdowns rendered so far.
    const dateRangeDropdown = allDropdowns().find((d: any) =>
      Array.from(d.selectEl.options).some((o: any) => o.value === "custom"),
    );
    dateRangeDropdown.trigger("custom");

    submitButton().trigger();
    expect(onSubmit).not.toHaveBeenCalled();
  });

  it("re-enables submit and includes the range once valid custom dates are entered", () => {
    addPropertyCustomText()!.trigger("exercise");
    addCustomPropertyButton()!.trigger();

    const dateRangeDropdown = allDropdowns().find((d: any) =>
      Array.from(d.selectEl.options).some((o: any) => o.value === "custom"),
    );
    dateRangeDropdown.trigger("custom");

    const dateTexts = allTexts().filter((t: any) => t.inputEl.type === "date");
    dateTexts[0].trigger("2026-01-01");
    dateTexts[1].trigger("2026-01-31");

    expect(submitButton().disabled).toBe(false);

    submitButton().trigger();
    const config = onSubmit.mock.calls[0][0];
    expect(config.startDate).toBe("2026-01-01");
    expect(config.endDate).toBe("2026-01-31");
  });

  it("closes the modal on submit", () => {
    addPropertyCustomText()!.trigger("exercise");
    addCustomPropertyButton()!.trigger();
    submitButton().trigger();

    expect((modal as any).closeCalled).toBe(true);
  });

  it("debounces and (re)renders the preview after a change", () => {
    renderAppMock.mockClear();
    addPropertyCustomText()!.trigger("exercise");
    addCustomPropertyButton()!.trigger();

    jest.advanceTimersByTime(250);

    expect(renderAppMock).toHaveBeenCalled();
    const previewData = renderAppMock.mock.calls[renderAppMock.mock.calls.length - 1][3];
    expect(previewData.heatmapTitle).toBe("Preview title");
  });

  it("queries Dataview for real preview entries once a property is set", () => {
    dataviewPages = [
      { file: { name: "2026-01-01", path: "d/2026-01-01.md" }, exercise: 10 },
    ];

    addPropertyCustomText()!.trigger("exercise");
    addCustomPropertyButton()!.trigger();

    jest.advanceTimersByTime(250);

    const previewData = renderAppMock.mock.calls[renderAppMock.mock.calls.length - 1][3];
    expect(previewData.entries).toEqual([
      { date: "2026-01-01", filePath: "d/2026-01-01.md", intensity: 10, content: undefined },
    ]);
  });

  it("adding a custom tag shows it as a chip and includes it in the submitted config", () => {
    addPropertyCustomText()!.trigger("exercise");
    addCustomPropertyButton()!.trigger();

    addTagCustomText()!.trigger("journal");
    addCustomTagButton()!.trigger();

    submitButton().trigger();
    const config = onSubmit.mock.calls[0][0];
    expect(config.tags).toEqual(["#journal"]);
  });

  it("omits tags from the submitted config when none are added", () => {
    addPropertyCustomText()!.trigger("exercise");
    addCustomPropertyButton()!.trigger();

    submitButton().trigger();
    const config = onSubmit.mock.calls[0][0];
    expect(config.tags).toBeUndefined();
  });

  it("adds a filter condition row and includes it in the submitted config", () => {
    addPropertyCustomText()!.trigger("exercise");
    addCustomPropertyButton()!.trigger();

    findRawButtonByText("Add condition")!.dispatchEvent(new Event("click", { bubbles: true }));

    filterPropertyTexts()[0].trigger("status");
    filterValueTexts()[0].trigger("done");

    submitButton().trigger();
    const config = onSubmit.mock.calls[0][0];
    expect(config.filters).toEqual([
      { property: "status", operator: "equals", value: "done" },
    ]);
  });

  it("hides the value field and omits value once operator is switched to 'notEmpty'", () => {
    addPropertyCustomText()!.trigger("exercise");
    addCustomPropertyButton()!.trigger();

    findRawButtonByText("Add condition")!.dispatchEvent(new Event("click", { bubbles: true }));
    filterPropertyTexts()[0].trigger("status");

    expect(filterValueTexts()).toHaveLength(1);

    filterOperatorDropdowns()[0].trigger("notEmpty");

    expect(filterValueTexts()).toHaveLength(0);

    submitButton().trigger();
    const config = onSubmit.mock.calls[0][0];
    expect(config.filters).toEqual([
      { property: "status", operator: "notEmpty", value: undefined },
    ]);
  });

  it("blocks submit while a filter condition is missing its property", () => {
    addPropertyCustomText()!.trigger("exercise");
    addCustomPropertyButton()!.trigger();

    findRawButtonByText("Add condition")!.dispatchEvent(new Event("click", { bubbles: true }));

    expect(submitButton().disabled).toBe(true);
  });

  it("removes a filter condition row", () => {
    addPropertyCustomText()!.trigger("exercise");
    addCustomPropertyButton()!.trigger();

    findRawButtonByText("Add condition")!.dispatchEvent(new Event("click", { bubbles: true }));
    expect(filterPropertyTexts()).toHaveLength(1);

    filterRemoveButtons()[0].trigger();
    expect(filterPropertyTexts()).toHaveLength(0);
  });
});
