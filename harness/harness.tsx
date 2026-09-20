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
import "../src/localization/i18n";

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

for (const fixture of fixtures) {
  const section = document.createElement("section");
  section.className = "harness-fixture";
  section.id = `fixture-${fixture.id}`;

  const heading = document.createElement("h2");
  heading.textContent = fixture.title;

  const note = document.createElement("p");
  note.className = "harness-note";
  note.textContent = fixture.note;

  const mount = document.createElement("div");
  mount.className = "harness-mount";

  section.append(heading, note, mount);
  root.append(section);

  renderApp(
    mount as HTMLDivElement,
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
  title: string;
  note: string;
  render: (el: HTMLElement) => void;
}[] = [
  {
    title: "Dataview missing",
    note: "What a brand-new user sees if they skipped the Dataview install.",
    render: (el) => renderCodeblockIssue(el, { kind: "dataview-missing" }),
  },
  {
    title: "No property set",
    note: "An empty `heatmap-tracker` codeblock.",
    render: (el) => renderCodeblockIssue(el, { kind: "missing-property" }),
  },
  {
    title: "Invalid YAML",
    note: "Bad indentation in the codeblock.",
    render: (el) =>
      renderCodeblockIssue(el, {
        kind: "invalid-yaml",
        detail: "bad indentation of a mapping entry at line 2, column 3",
      }),
  },
  {
    title: "Unexpected failure",
    note: "Anything thrown while reading the vault.",
    render: (el) =>
      renderCodeblockIssue(el, {
        kind: "unexpected",
        detail: "dv.pages is not a function",
      }),
  },
  {
    title: "Empty result hint",
    note: "Shown under a heatmap whose query matched nothing.",
    render: (el) =>
      renderNoMatchesHint(el, { property: "steps", path: "daily notes" }),
  },
];

for (const message of messages) {
  const section = document.createElement("section");
  section.className = "harness-fixture";

  const heading = document.createElement("h2");
  heading.textContent = message.title;

  const note = document.createElement("p");
  note.className = "harness-note";
  note.textContent = message.note;

  const mount = document.createElement("div");
  mount.className = "harness-mount";
  message.render(mount);

  section.append(heading, note, mount);
  root.append(section);
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
