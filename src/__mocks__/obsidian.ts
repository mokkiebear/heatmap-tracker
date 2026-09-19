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
  // Mock implementation of Setting class
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
  constructor(app: App) {
    // Mock implementation of Modal constructor
  }

  open() {
    // Mock implementation of open method
  }

  close() {
    // Mock implementation of close method
  }
}

// Real Obsidian swaps the element's contents for an SVG icon. Recording the
// name is enough for assertions and lets the render harness show which icon was
// requested.
export function setIcon(element: HTMLElement, iconId: string): void {
  element.setAttribute("data-icon", iconId);
}

interface CachedMetadataLike {
  tags?: { tag: string }[];
  frontmatter?: { tags?: string | string[]; tag?: string | string[] };
}

/**
 * Mirrors Obsidian's `getAllTags`: inline `#tags` plus frontmatter `tags:`,
 * every one of them `#`-prefixed, or null when there is no cache.
 */
export function getAllTags(cache: CachedMetadataLike | null): string[] | null {
  if (!cache) {
    return null;
  }

  const tags = (cache.tags ?? []).map((entry) => entry.tag);
  const fromFrontmatter = [
    cache.frontmatter?.tags,
    cache.frontmatter?.tag,
  ].flatMap((value) => {
    if (Array.isArray(value)) return value;
    if (typeof value === "string") return value.split(/[\s,]+/);
    return [];
  });

  return [...tags, ...fromFrontmatter]
    .filter(Boolean)
    .map((tag) => (String(tag).startsWith("#") ? String(tag) : `#${tag}`));
}

export function normalizePath(input: string): string {
  return input.replace(/\\/g, "/").replace(/\/+/g, "/").replace(/\/$/, "");
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
