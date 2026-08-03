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
