import { App } from "obsidian";
import React from "react";
import { Root } from "react-dom/client";
import { Entry, TrackerSettings } from "src/types";
import { getDataviewApi } from "src/utils/dataviewApi";
import { buildEntriesFromDataview } from "src/utils/dataviewEntries";
import { renderApp } from "src/render";
import ReactApp from "src/App";
import {
  HeatmapModalFormState,
  buildFilters,
  buildPreviewTrackerData,
  buildTags,
} from "../heatmapModal.utils";

const PREVIEW_DEBOUNCE_MS = 200;

/**
 * The modal's right-hand column: validation errors, a "N matching notes"
 * line, and a debounced live render of the heatmap the form describes.
 * Owns its own React root, so the modal only has to call `dispose()`.
 */
export class HeatmapPreviewPanel {
  private errorsEl: HTMLElement;
  private matchesEl: HTMLElement;
  private previewContainer: HTMLDivElement;
  private previewRoot: Root | null = null;
  private timer: number | null = null;

  constructor(
    private app: App,
    private settings: TrackerSettings,
    containerEl: HTMLElement,
  ) {
    this.errorsEl = containerEl.createDiv({
      cls: "heatmap-create-modal__errors",
    });
    containerEl.createEl("h3", {
      text: "Preview",
      cls: "heatmap-create-modal__section-heading",
    });
    this.matchesEl = containerEl.createDiv({
      cls: "heatmap-create-modal__matches",
    });
    this.previewContainer = containerEl.createDiv({
      cls: "heatmap-modal-preview",
    });
  }

  showErrors(errors: string[]) {
    this.errorsEl.empty();
    if (errors.length === 0) return;
    const list = this.errorsEl.createEl("ul");
    errors.forEach((error) => list.createEl("li", { text: error }));
  }

  /** Re-renders the preview a short while after the last form change. */
  schedule(state: HeatmapModalFormState) {
    if (this.timer !== null) window.clearTimeout(this.timer);
    this.timer = window.setTimeout(() => {
      this.timer = null;
      this.update(state);
    }, PREVIEW_DEBOUNCE_MS);
  }

  dispose() {
    if (this.timer !== null) {
      window.clearTimeout(this.timer);
      this.timer = null;
    }
    this.previewRoot?.unmount();
    this.previewRoot = null;
  }

  private update(state: HeatmapModalFormState) {
    this.previewRoot?.unmount();
    this.previewContainer.empty();

    const entries = this.getPreviewEntries(state);
    this.renderMatchesSummary(state, entries.length);

    const container = this.previewContainer.createDiv({
      cls: "heatmap-tracker-container",
    });

    renderApp(
      container,
      this.app,
      this.settings,
      buildPreviewTrackerData(state, entries),
      React.createElement(ReactApp),
      (root) => {
        this.previewRoot = root;
      },
    );
  }

  private getPreviewEntries(state: HeatmapModalFormState): Entry[] {
    const properties = state.properties.filter(Boolean);
    if (properties.length === 0) return [];

    const dv = getDataviewApi(this.app);
    if (!dv) return [];

    try {
      return buildEntriesFromDataview(dv, {
        path: state.path,
        property: properties.length === 1 ? properties[0] : properties,
        tags: buildTags(state),
        filters: buildFilters(state),
      });
    } catch (e) {
      console.warn("Heatmap Tracker: failed to build preview entries", e);
      return [];
    }
  }

  /**
   * The one number that tells the user whether their property/path/tags
   * actually select anything — without it an empty preview is
   * indistinguishable from a misspelled property name.
   */
  private renderMatchesSummary(state: HeatmapModalFormState, count: number) {
    this.matchesEl.empty();

    if (state.properties.filter(Boolean).length === 0) {
      this.matchesEl.toggleClass("is-empty", false);
      return;
    }

    const noDataview = !getDataviewApi(this.app);
    this.matchesEl.toggleClass("is-empty", count === 0 || noDataview);
    this.matchesEl.textContent = noDataview
      ? "Dataview is not available, so no notes can be matched."
      : count === 0
        ? "No matching notes found — check the property name and folder path."
        : `${count} matching ${count === 1 ? "note" : "notes"} found.`;
  }
}
