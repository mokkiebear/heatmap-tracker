/**
 * Standalone render harness.
 *
 * Obsidian does not run headless, so a change to the heatmap's rendering
 * normally cannot be seen without a human opening the app. This mounts the real
 * render pipeline (mergeTrackerData -> validateTrackerData -> HeatmapProvider ->
 * ReactApp) in a plain browser page against fixed fixtures, with `obsidian`
 * aliased to the test mock. What you see here is what the plugin draws.
 *
 * It is a development tool: it is not bundled into the plugin and nothing in
 * src/ imports it.
 */
import { App } from "obsidian";

import ReactApp from "../src/App";
import { renderApp } from "../src/render";
import i18n from "../src/localization/i18n";
import languages from "../src/localization/languages.json";

import {
  renderCodeblockIssue,
  renderNoMatchesHint,
} from "../src/utils/codeblockError";

import { fixtures, harnessSettings } from "./fixtures";
import { HeatmapModal } from "../src/modals/HeatmapModal";

const app = new App();
const root = document.getElementById("fixtures");

if (!root) {
  throw new Error("Harness: #fixtures container missing from index.html");
}

/** A titled section with an empty mount point, appended to the page. */
function addSection(
  title: string,
  note: string,
  id?: string,
  maxWidth?: number,
): HTMLDivElement {
  const section = document.createElement("section");
  section.className = "harness-fixture";
  if (id) section.id = `fixture-${id}`;

  const heading = document.createElement("h2");
  heading.textContent = title;

  const noteEl = document.createElement("p");
  noteEl.className = "harness-note";
  noteEl.textContent = note;

  const mount = document.createElement("div");
  mount.className = "harness-mount";
  // Narrow-pane fixtures: the grid has to see a small container, not a small
  // window, since that is what a sidebar or split view actually gives it.
  if (maxWidth) mount.style.maxWidth = `${maxWidth}px`;

  section.append(heading, noteEl, mount);
  root!.append(section);

  return mount;
}

for (const fixture of fixtures) {
  renderApp(
    addSection(
      fixture.title,
      fixture.note,
      fixture.id,
      fixture.maxWidth,
    ) as HTMLDivElement,
    app,
    { ...harnessSettings, ...fixture.settings },
    fixture.trackerData,
    <ReactApp />,
  );
}

/**
 * The message cards a codeblock shows instead of a heatmap. They are plain DOM
 * rendered by the codeblock processor, not part of the React tree, so they are
 * mounted here directly.
 */
const messages: {
  id: string;
  title: string;
  note: string;
  render: (el: HTMLElement) => void;
}[] = [
  {
    id: "dataview-missing",
    title: "Dataview missing",
    note: "What a brand-new user sees if they skipped the Dataview install.",
    render: (el) => renderCodeblockIssue(el, { kind: "dataview-missing" }),
  },
  {
    id: "missing-property",
    title: "No property set",
    note: "An empty `heatmap-tracker` codeblock.",
    render: (el) => renderCodeblockIssue(el, { kind: "missing-property" }),
  },
  {
    id: "invalid-yaml",
    title: "Invalid YAML",
    note: "Bad indentation in the codeblock.",
    render: (el) =>
      renderCodeblockIssue(el, {
        kind: "invalid-yaml",
        detail: "bad indentation of a mapping entry at line 2, column 3",
      }),
  },
  {
    id: "unexpected-failure",
    title: "Unexpected failure",
    note: "Anything thrown while reading the vault.",
    render: (el) =>
      renderCodeblockIssue(el, {
        kind: "unexpected",
        detail: "dv.pages is not a function",
      }),
  },
  {
    id: "no-matches-hint",
    title: "Empty result hint",
    note: "Shown under a heatmap whose query matched nothing.",
    render: (el) =>
      renderNoMatchesHint(el, { property: "steps", path: "daily notes" }),
  },
];

for (const message of messages) {
  message.render(addSection(message.title, message.note, message.id));
}

const themeButton = document.getElementById("toggle-theme");
themeButton?.addEventListener("click", () => {
  document.body.classList.toggle("theme-dark");
  document.body.classList.toggle("theme-light");
});

/**
 * The create/edit modal. It builds plain DOM through Obsidian's `Setting` API
 * (mocked here), so it renders in the harness the same way the heatmap does —
 * which is the only way to see its layout without opening Obsidian.
 */
const modalButton = document.getElementById("open-modal");
modalButton?.addEventListener("click", () => {
  new HeatmapModal(
    {
      vault: { getMarkdownFiles: () => [] },
      metadataCache: { getFileCache: () => null },
    } as never as App,
    harnessSettings,
    (result: Record<string, unknown>) =>
      console.log("Submitted config:", result),
  ).open();
});

/**
 * Language switcher. `i18n.changeLanguage` notifies `useTranslation`, so every
 * mounted fixture re-renders in place — which is the only way to see whether a
 * translated month name, weekday label or tab title still fits its box. Long
 * languages (de, pt) and non-Latin scripts (zh, hi, ru) overflow differently.
 */
const languageSelect = document.getElementById("language");

if (languageSelect instanceof HTMLSelectElement) {
  for (const [code, name] of Object.entries(languages)) {
    languageSelect.append(new Option(`${name} (${code})`, code));
  }

  languageSelect.value = harnessSettings.language;
  languageSelect.addEventListener("change", () => {
    i18n.changeLanguage(languageSelect.value).catch(console.error);
  });
}
