import { Setting } from "obsidian";
import { ChipList } from "../components/ChipList";
import { getVaultProperties } from "../vaultSuggestions";
import {
  HeatmapFormHost,
  PROPERTY_DATALIST_ID,
  addTextSetting,
} from "./formControls";

/**
 * Everything needed for a working heatmap: which properties to read, where
 * to read them from, and the title. Stays visible; the rest of the form is
 * behind collapsible sections.
 */
export function renderEssentialsSection(
  host: HeatmapFormHost,
  contentEl: HTMLElement,
) {
  new Setting(contentEl)
    .setName("Properties to track")
    .setDesc(
      "Frontmatter key(s) to read from your notes (e.g. 'exercise: 10' or 'reading: true'). Add more than one to sum their values on the same heatmap.",
    );

  const propertyChipList = new ChipList(contentEl, {
    getValues: () => host.state.properties,
    add: (value) => host.state.properties.push(value),
    remove: (value) => {
      host.state.properties = host.state.properties.filter((p) => p !== value);
    },
    getSuggestions: () => getVaultProperties(host.app, host.state.path),
    addPlaceholder: "Or type a custom property name",
    emptyLabel: "No properties selected yet.",
    onChange: () => host.refresh(),
  });

  addTextSetting(
    host,
    contentEl,
    "path",
    "Folder path",
    "Folder to search for notes in (optional). Leave blank to search the whole vault.",
    () => {
      propertyChipList.refreshSuggestions();
      refreshPropertyDatalist();
    },
  );

  addTextSetting(
    host,
    contentEl,
    "heatmapTitle",
    "Title",
    'Displayed above the heatmap. Stored as "heatmapTitle".',
  );

  // The property datalist is shared with the filter rows further down, so it
  // has to exist before any of them render.
  const datalistEl = contentEl.createEl("datalist", {
    attr: { id: PROPERTY_DATALIST_ID },
  });

  function refreshPropertyDatalist() {
    datalistEl.empty();
    getVaultProperties(host.app, host.state.path).forEach((p) => {
      datalistEl.createEl("option", { attr: { value: p } });
    });
  }

  refreshPropertyDatalist();
}
