import { PaletteSettings } from "src/settings/palette.settings";
import type { ColorsList } from "src/types";

jest.mock("obsidian", () => ({
  setIcon: jest.fn(),
}));

jest.mock("src/localization/i18n", () => ({
  __esModule: true,
  default: {
    t: jest.fn(
      (key: string, options?: { paletteName?: string }) =>
        options?.paletteName ? `${key}:${options.paletteName}` : key
    ),
  },
}));

const { setIcon } = jest.requireMock("obsidian") as { setIcon: jest.Mock };
const { default: i18nMock } = jest.requireMock("src/localization/i18n") as {
  default: { t: jest.Mock };
};

type ElementOptions = {
  cls?: string | string[];
  text?: string;
  attr?: Record<string, string | boolean>;
  value?: string;
};

const applyElementOptions = (
  element: HTMLElement,
  options: ElementOptions = {}
) => {
  const { cls, text, attr, value } = options;

  if (cls) {
    const classes = Array.isArray(cls) ? cls : cls.split(" ");
    classes.filter(Boolean).forEach((className) => {
      element.classList.add(className);
    });
  }

  if (text !== undefined) {
    element.textContent = text;
  }

  if (attr) {
    for (const [key, rawValue] of Object.entries(attr)) {
      if (key === "style" && typeof rawValue === "string") {
        element.setAttribute("style", rawValue);
        continue;
      }

      if (key in element) {
        try {
          (element as any)[key] = rawValue;
          continue;
        } catch {
          // fall through to setAttribute if direct assignment fails
        }
      }

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

  proto.createEl = function (tag: string, options?: ElementOptions) {
    const element = document.createElement(tag);
    applyElementOptions(element, options);
    this.appendChild(element);
    return element;
  };

  proto.empty = function () {
    this.innerHTML = "";
  };
});

beforeEach(() => {
  jest.clearAllMocks();
  i18nMock.t.mockClear();
  document.body.innerHTML = "";
});

const flushPromises = () =>
  new Promise((resolve) => setTimeout(resolve, 0));

type PalettesConfig = Record<string, ColorsList>;

const defaultPalettes: PalettesConfig = {
  default: ["#111111", "#222222"],
  custom: ["rgb(20, 20, 20)"],
};

const setupPaletteSettings = (palettes: PalettesConfig = defaultPalettes) => {
  const palettesClone = Object.fromEntries(
    Object.entries(palettes).map(([name, colors]) => [name, [...colors]])
  );

  const plugin = {
    settings: {
      palettes: palettesClone,
    },
    saveSettings: jest.fn().mockResolvedValue(undefined),
  };

  const settings = {
    containerEl: document.createElement("div"),
    display: jest.fn(),
  };

  const paletteSettings = new PaletteSettings(
    plugin as any,
    settings as any
  );

  return { paletteSettings, plugin, settings };
};

const renderPaletteSettings = (palettes?: PalettesConfig) => {
  const context = setupPaletteSettings(palettes);

  context.paletteSettings.displayPaletteSettings();

  const container = context.settings.containerEl.querySelector(
    ".heatmap-tracker-settings-palettes__container"
  ) as HTMLElement;

  if (!container) {
    throw new Error("Palette settings container was not rendered");
  }

  return { ...context, container };
};

const getPaletteContainer = (container: HTMLElement, name: string) => {
  const paletteContainers = Array.from(
    container.querySelectorAll(
      ".heatmap-tracker-settings-palettes__palette-container"
    )
  );

  return paletteContainers.find((paletteContainer) =>
    paletteContainer
      .querySelector("h4")
      ?.textContent?.includes(`: ${name}`)
  ) as HTMLElement;
};

describe("PaletteSettings", () => {
  it("should render palettes, help text, and read-only default colors", () => {
    const { container } = renderPaletteSettings();

    const header = container.querySelector("h3");
    expect(header?.textContent).toBe("settings.palettes");

    const helpParagraphs = Array.from(container.querySelectorAll("p")).map(
      (paragraph) => paragraph.textContent
    );
    expect(helpParagraphs).toContain("settings.addPaletteNote");
    expect(helpParagraphs).toContain("settings.colorsUsageNote");

    const defaultPalette = getPaletteContainer(container, "default");
    expect(defaultPalette).toBeTruthy();

    const defaultInputs = defaultPalette.querySelectorAll(
      ".heatmap-tracker-settings-palettes__color-input"
    );
    expect(defaultInputs.length).toBeGreaterThan(0);
    defaultInputs.forEach((input) =>
      expect((input as HTMLInputElement).disabled).toBe(true)
    );
    expect(
      defaultPalette.querySelector(
        ".heatmap-tracker-settings-palettes__save-color"
      )
    ).toBeNull();
    expect(
      defaultPalette.querySelector(
        ".heatmap-tracker-settings-palettes__delete-color"
      )
    ).toBeNull();

    const customPalette = getPaletteContainer(container, "custom");
    expect(
      customPalette.querySelector(
        ".heatmap-tracker-settings-palettes__add-color-container"
      )
    ).not.toBeNull();

    const usedIcons = setIcon.mock.calls.map(([, icon]) => icon);
    expect(usedIcons).toEqual(
      expect.arrayContaining(["trash", "check", "x"])
    );
  });

  it("should delete palettes through the header action", async () => {
    const { container, plugin, settings } = renderPaletteSettings();

    const deleteButton = container.querySelector(
      ".heatmap-tracker-settings-palettes__delete-palette"
    ) as HTMLButtonElement;
    deleteButton.click();

    await flushPromises();

    expect(plugin.settings.palettes.custom).toBeUndefined();
    expect(plugin.saveSettings).toHaveBeenCalledTimes(1);
    expect(settings.display).toHaveBeenCalledTimes(1);
  });

  it("should update and remove individual palette colors", async () => {
    const { container, plugin, settings } = renderPaletteSettings();
    const customPalette = getPaletteContainer(container, "custom");

    const colorInput = customPalette.querySelector(
      ".heatmap-tracker-settings-palettes__color-input"
    ) as HTMLInputElement;
    const saveButton = customPalette.querySelector(
      ".heatmap-tracker-settings-palettes__save-color"
    ) as HTMLButtonElement;
    const colorPreview = customPalette.querySelector(
      ".heatmap-tracker-settings-palettes__color-box"
    ) as HTMLDivElement;

    const newColor = "rgb(1, 2, 3)";
    colorInput.value = newColor;
    colorInput.dispatchEvent(new Event("input", { bubbles: true }));

    expect(colorPreview.style.backgroundColor).toBe(newColor);
    expect(saveButton.disabled).toBe(false);

    saveButton.click();
    await flushPromises();

    expect(plugin.settings.palettes.custom[0]).toBe(newColor);
    expect(plugin.saveSettings).toHaveBeenCalledTimes(1);
    expect(settings.display).toHaveBeenCalledTimes(1);

    const removeButton = customPalette.querySelector(
      ".heatmap-tracker-settings-palettes__delete-color"
    ) as HTMLButtonElement;
    removeButton.click();
    await flushPromises();

    expect(plugin.settings.palettes.custom).toHaveLength(0);
    expect(plugin.saveSettings).toHaveBeenCalledTimes(2);
    expect(settings.display).toHaveBeenCalledTimes(2);
  });

  it("should add new colors via the add-color section", () => {
    const { container, plugin, settings } = renderPaletteSettings();
    const customPalette = getPaletteContainer(container, "custom");

    const addInput = customPalette.querySelector(
      ".heatmap-tracker-settings-palettes__add-color-input"
    ) as HTMLInputElement;
    const preview = customPalette.querySelector(
      ".heatmap-tracker-settings-palettes__add-color-preview"
    ) as HTMLDivElement;
    const addButton = customPalette.querySelector(
      ".heatmap-tracker-settings-palettes__add-color-button"
    ) as HTMLButtonElement;

    const newColor = "rgb(9, 9, 9)";
    addInput.value = newColor;
    addInput.dispatchEvent(new Event("input", { bubbles: true }));
    expect(preview.style.backgroundColor).toBe(newColor);

    addButton.click();

    expect(plugin.settings.palettes.custom).toEqual([
      "rgb(20, 20, 20)",
      newColor,
    ]);
    expect(plugin.saveSettings).toHaveBeenCalledTimes(1);
    expect(settings.display).toHaveBeenCalledTimes(1);
  });

  it("should create new palettes only when a name is provided", async () => {
    const { container, plugin, settings } = renderPaletteSettings();

    const newPaletteInput = container.querySelector(
      ".heatmap-tracker-settings-palettes__new-palette-input"
    ) as HTMLInputElement;

    const createPaletteButton = container.querySelector(
      ".heatmap-tracker-settings-palettes__new-palette-button"
    ) as HTMLButtonElement;

    createPaletteButton.click();
    await flushPromises();

    expect(plugin.saveSettings).not.toHaveBeenCalled();

    newPaletteInput.value = "fresh";
    createPaletteButton.click();
    await flushPromises();

    expect(plugin.settings.palettes.fresh).toEqual([]);
    expect(plugin.saveSettings).toHaveBeenCalledTimes(1);
    expect(settings.display).toHaveBeenCalledTimes(1);
  });
});
