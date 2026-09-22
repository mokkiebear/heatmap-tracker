import { Setting } from "obsidian";
import { normalizeTag } from "src/utils/dataviewEntries";
import { ChipList } from "../components/ChipList";
import { getVaultTags } from "../vaultSuggestions";
import { FilterOperator } from "../heatmapModal.utils";
import {
  HeatmapFormHost,
  PROPERTY_DATALIST_ID,
  addListButton,
} from "./formControls";

/** Tag filter plus the "additional conditions" (frontmatter) filter rows. */
export function renderFilteringSection(
  host: HeatmapFormHost,
  contentEl: HTMLElement,
) {
  new Setting(contentEl)
    .setName("Tags")
    .setDesc(
      "Only include notes with at least one of these tags (optional). Leave empty to include notes regardless of tags.",
    );

  new ChipList(contentEl, {
    getValues: () => host.state.tags,
    add: (value) => host.state.tags.push(normalizeTag(value)),
    remove: (value) => {
      host.state.tags = host.state.tags.filter((t) => t !== value);
    },
    getSuggestions: () => getVaultTags(host.app),
    addPlaceholder: "Or type a tag (e.g. journal)",
    emptyLabel: "No tag filter — notes of any tag are included.",
    onChange: () => host.refresh(),
  });

  new Setting(contentEl)
    .setName("Additional conditions")
    .setDesc(
      'Optionally narrow results further by frontmatter value (e.g. only notes where "status" equals "done"). All conditions must match.',
    );

  const filtersEl = contentEl.createDiv({
    cls: "heatmap-create-modal__filters",
  });

  function renderFiltersEditor() {
    filtersEl.empty();

    host.state.filters.forEach((filter, index) => {
      const row = new Setting(filtersEl).setClass(
        "heatmap-create-modal__filter-row",
      );

      row.addText((text) => {
        text.setPlaceholder("Property");
        text.inputEl.setAttribute("list", PROPERTY_DATALIST_ID);
        text.setValue(filter.property);
        text.onChange((value) => {
          host.state.filters[index].property = value;
          host.refresh();
        });
      });

      row.addDropdown((dropdown) => {
        dropdown.addOption("equals", "Equals");
        dropdown.addOption("contains", "Contains");
        dropdown.addOption("notEmpty", "Is not empty");
        dropdown.setValue(filter.operator);
        dropdown.onChange((value) => {
          host.state.filters[index].operator = value as FilterOperator;
          renderFiltersEditor();
          host.refresh();
        });
      });

      if (filter.operator !== "notEmpty") {
        row.addText((text) => {
          text.setPlaceholder("Value");
          text.setValue(filter.value);
          text.onChange((value) => {
            host.state.filters[index].value = value;
            host.refresh();
          });
        });
      }

      row.addExtraButton((btn) => {
        btn
          .setIcon("x")
          .setTooltip("Remove condition")
          .onClick(() => {
            host.state.filters.splice(index, 1);
            renderFiltersEditor();
            host.refresh();
          });
      });
    });

    addListButton(filtersEl, "Add condition", () => {
      host.state.filters.push({ property: "", operator: "equals", value: "" });
      renderFiltersEditor();
      host.refresh();
    });
  }

  renderFiltersEditor();
}
