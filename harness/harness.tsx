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

import { fixtures, harnessSettings } from "./fixtures";

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

const themeButton = document.getElementById("toggle-theme");
themeButton?.addEventListener("click", () => {
  document.body.classList.toggle("theme-dark");
  document.body.classList.toggle("theme-light");
});
