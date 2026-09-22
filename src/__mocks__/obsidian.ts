export class App {
  // Mock implementation of App class
}

export class Plugin {
  // Mock implementation of Plugin class
}

export class PluginSettingTab {
  // Mock implementation of PluginSettingTab class
}

export class Setting {
  settingEl: HTMLElement;
  infoEl: HTMLElement;
  nameEl: HTMLElement;
  descEl: HTMLElement;
  controlEl: HTMLElement;

  constructor(containerEl: HTMLElement) {
    this.settingEl = el("div", "setting-item");
    this.infoEl = el("div", "setting-item-info");
    this.nameEl = el("div", "setting-item-name");
    this.descEl = el("div", "setting-item-description");
    this.controlEl = el("div", "setting-item-control");

    this.infoEl.append(this.nameEl, this.descEl);
    this.settingEl.append(this.infoEl, this.controlEl);
    containerEl.appendChild(this.settingEl);
  }

  setName(name: string) {
    this.nameEl.textContent = name;
    return this;
  }
  setDesc(desc: string) {
    this.descEl.textContent = desc;
    return this;
  }
  setClass(cls: string) {
    this.settingEl.classList.add(cls);
    return this;
  }
  setHeading() {
    this.settingEl.classList.add("setting-item-heading");
    return this;
  }
  addText(cb: (c: TextComponent) => void) {
    cb(new TextComponent(this.controlEl));
    return this;
  }
  addToggle(cb: (c: ToggleComponent) => void) {
    cb(new ToggleComponent(this.controlEl));
    return this;
  }
  addDropdown(cb: (c: DropdownComponent) => void) {
    cb(new DropdownComponent(this.controlEl));
    return this;
  }
  addButton(cb: (c: ButtonComponent) => void) {
    cb(new ButtonComponent(this.controlEl));
    return this;
  }
  addExtraButton(cb: (c: ExtraButtonComponent) => void) {
    cb(new ExtraButtonComponent(this.controlEl));
    return this;
  }
}

function el(tag: string, cls: string): HTMLElement {
  const element = document.createElement(tag);
  element.className = cls;
  return element;
}

export class TextComponent {
  inputEl: HTMLInputElement;

  constructor(containerEl?: HTMLElement) {
    this.inputEl = document.createElement("input");
    this.inputEl.type = "text";
    containerEl?.appendChild(this.inputEl);
  }
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
    this.inputEl.addEventListener("input", () => handler(this.inputEl.value));
    return this;
  }
}

export class ToggleComponent {
  toggleEl: HTMLElement;
  private value = false;

  constructor(containerEl?: HTMLElement) {
    this.toggleEl = el("div", "checkbox-container");
    this.toggleEl.addEventListener("click", () => this.setValue(!this.value));
    containerEl?.appendChild(this.toggleEl);
  }
  setValue(value: string | boolean) {
    this.value = Boolean(value);
    this.toggleEl.classList.toggle("is-enabled", this.value);
    this.handler?.(this.value);
    return this;
  }
  getValue() {
    return this.value;
  }
  private handler?: (value: boolean) => void;
  onChange(handler: (value: boolean) => void) {
    this.handler = handler;
    return this;
  }
}

export class DropdownComponent {
  selectEl: HTMLSelectElement;

  constructor(containerEl?: HTMLElement) {
    this.selectEl = document.createElement("select");
    this.selectEl.className = "dropdown";
    containerEl?.appendChild(this.selectEl);
  }
  addOption(value: string, label: string) {
    const option = document.createElement("option");
    option.value = value;
    option.text = label;
    this.selectEl.appendChild(option);
    return this;
  }
  setValue(value: string) {
    this.selectEl.value = value;
    return this;
  }
  getValue() {
    return this.selectEl.value;
  }
  onChange(handler: (value: string) => void) {
    this.selectEl.addEventListener("change", () =>
      handler(this.selectEl.value),
    );
    return this;
  }
}

export class ButtonComponent {
  buttonEl: HTMLButtonElement;

  constructor(containerEl?: HTMLElement) {
    this.buttonEl = document.createElement("button");
    containerEl?.appendChild(this.buttonEl);
  }
  setButtonText(text: string) {
    this.buttonEl.textContent = text;
    return this;
  }
  setCta() {
    this.buttonEl.classList.add("mod-cta");
    return this;
  }
  setDisabled(disabled: boolean) {
    this.buttonEl.disabled = disabled;
    return this;
  }
  onClick(handler: () => void) {
    this.buttonEl.addEventListener("click", handler);
    return this;
  }
}

export class ExtraButtonComponent {
  extraSettingsEl: HTMLElement;

  constructor(containerEl?: HTMLElement) {
    this.extraSettingsEl = el("div", "clickable-icon extra-setting-button");
    containerEl?.appendChild(this.extraSettingsEl);
  }
  setIcon(iconId: string) {
    setIcon(this.extraSettingsEl, iconId);
    return this;
  }
  setTooltip(tooltip: string) {
    this.extraSettingsEl.setAttribute("aria-label", tooltip);
    return this;
  }
  onClick(handler: () => void) {
    this.extraSettingsEl.addEventListener("click", handler);
    return this;
  }
}

export class TFile {
  // Mock implementation of TFile class
}

export class TFolder {
  // Mock implementation of TFolder class
}

export class Vault {
  // Mock implementation of Vault class
}

export class Workspace {
  // Mock implementation of Workspace class
}

export class WorkspaceLeaf {
  // Mock implementation of WorkspaceLeaf class
}

export class MarkdownView {
  // Mock implementation of MarkdownView class
}

export class Notice {
  constructor(message: string, timeout?: number) {
    // Mock implementation of Notice constructor
  }
}

export class Modal {
  app: App;
  containerEl: HTMLElement = document.createElement("div");
  modalEl: HTMLElement = document.createElement("div");
  titleEl: HTMLElement = document.createElement("div");
  contentEl: HTMLElement = document.createElement("div");

  constructor(app: App) {
    this.app = app;
    this.modalEl.className = "modal";
    this.titleEl.className = "modal-title";
    this.contentEl.className = "modal-content";
    this.containerEl.className = "modal-container";
    this.modalEl.append(this.titleEl, this.contentEl);
    this.containerEl.appendChild(this.modalEl);
  }

  setTitle(title: string) {
    this.titleEl.textContent = title;
    return this;
  }

  open() {
    document.body.appendChild(this.containerEl);
    (this as unknown as { onOpen?: () => void }).onOpen?.();
  }

  close() {
    (this as unknown as { onClose?: () => void }).onClose?.();
    this.containerEl.remove();
  }
}

/**
 * Obsidian patches these DOM helpers onto HTMLElement at runtime. The harness
 * runs in a plain browser, which has none of them, so the plugin's own DOM
 * building (modals, message cards) would throw without this.
 *
 * Guarded: jest suites that define their own polyfills, or a real Obsidian
 * host, already provide these and must win.
 */
interface ElementOptions {
  cls?: string | string[];
  text?: string;
  attr?: Record<string, string | number | boolean>;
  value?: string;
  type?: string;
  href?: string;
}

function applyOptions(element: HTMLElement, options: ElementOptions = {}) {
  const { cls, text, attr, value, type, href } = options;

  if (cls) {
    (Array.isArray(cls) ? cls : cls.split(" "))
      .filter(Boolean)
      .forEach((c) => element.classList.add(c));
  }
  if (text !== undefined) element.textContent = text;
  if (attr) {
    for (const [key, raw] of Object.entries(attr)) {
      element.setAttribute(key, String(raw));
    }
  }
  if (value !== undefined) (element as HTMLInputElement).value = value;
  if (type !== undefined) (element as HTMLInputElement).type = type;
  if (href !== undefined) (element as unknown as HTMLAnchorElement).href = href;

  return element;
}

const elementHelpers: Record<string, unknown> = {
  createEl(this: HTMLElement, tag: string, options?: ElementOptions) {
    const child = applyOptions(document.createElement(tag), options);
    this.appendChild(child);
    return child;
  },
  createDiv(this: HTMLElement, options?: ElementOptions) {
    return (this as never as { createEl: CallableFunction }).createEl(
      "div",
      options,
    );
  },
  createSpan(this: HTMLElement, options?: ElementOptions) {
    return (this as never as { createEl: CallableFunction }).createEl(
      "span",
      options,
    );
  },
  empty(this: HTMLElement) {
    this.innerHTML = "";
  },
  addClass(this: HTMLElement, ...cls: string[]) {
    this.classList.add(...cls);
  },
  removeClass(this: HTMLElement, ...cls: string[]) {
    this.classList.remove(...cls);
  },
  toggleClass(this: HTMLElement, cls: string, force: boolean) {
    this.classList.toggle(cls, force);
  },
  setText(this: HTMLElement, text: string) {
    this.textContent = text;
  },
  appendText(this: HTMLElement, text: string) {
    this.appendChild(document.createTextNode(text));
  },
};

if (typeof HTMLElement !== "undefined") {
  for (const [name, fn] of Object.entries(elementHelpers)) {
    if (!(name in HTMLElement.prototype)) {
      (HTMLElement.prototype as unknown as Record<string, unknown>)[name] = fn;
    }
  }
}

/**
 * Real Obsidian swaps the element's contents for a Lucide SVG. The attribute is
 * what assertions read; the inline path is what the harness needs so an icon
 * button isn't an invisible empty box. Only the handful of icons this plugin
 * asks for are drawn — anything else falls back to the attribute alone.
 */
const ICON_PATHS: Record<string, string> = {
  x: "M18 6 6 18M6 6l12 12",
  "chevron-right": "m9 18 6-6-6-6",
  pencil:
    "M21.174 6.812a1 1 0 0 0-3.986-3.987L3.842 16.174a2 2 0 0 0-.5.83l-1.321 4.352a.5.5 0 0 0 .623.622l4.353-1.32a2 2 0 0 0 .83-.497z",
  "alert-triangle":
    "m21.73 18-8-14a2 2 0 0 0-3.48 0l-8 14A2 2 0 0 0 4 21h16a2 2 0 0 0 1.73-3M12 9v4M12 17h.01",
  info: "M12 22a10 10 0 1 0 0-20 10 10 0 0 0 0 20M12 16v-4M12 8h.01",
};

export function setIcon(element: HTMLElement, iconId: string): void {
  element.setAttribute("data-icon", iconId);

  const path = ICON_PATHS[iconId];
  if (!path || typeof document === "undefined") return;

  const NS = "http://www.w3.org/2000/svg";
  const svg = document.createElementNS(NS, "svg");
  svg.setAttribute("class", `svg-icon lucide-${iconId}`);
  svg.setAttribute("viewBox", "0 0 24 24");
  svg.setAttribute("fill", "none");
  svg.setAttribute("stroke", "currentColor");
  svg.setAttribute("stroke-width", "2");
  svg.setAttribute("stroke-linecap", "round");
  svg.setAttribute("stroke-linejoin", "round");

  const pathEl = document.createElementNS(NS, "path");
  pathEl.setAttribute("d", path);
  svg.appendChild(pathEl);

  element.appendChild(svg);
}

export function normalizePath(input: string): string {
  return input.replace(/\\/g, "/").replace(/\/+/g, "/").replace(/\/$/, "");
}

export function getAllTags(): string[] {
  return [];
}

declare global {
  function createDiv(): HTMLDivElement;
}

export function createDiv(): HTMLDivElement {
  return document.createElement("div");
}

(global as any).createDiv = createDiv;
declare global {
  function createSpan(): HTMLSpanElement;
}

export function createSpan(): HTMLSpanElement {
  return document.createElement("span");
}

(global as any).createSpan = createSpan;

// Obsidian re-exports the moment instance it ships with; `src/utils/heatmapBox`
// takes it from here rather than bundling a second copy.
export { default as moment } from "moment";
