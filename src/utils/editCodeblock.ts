import {
  App,
  MarkdownPostProcessorContext,
  Notice,
  TFile,
  setIcon,
  stringifyYaml,
} from "obsidian";

import { HeatmapModal } from "src/modals/HeatmapModal";
import { TrackerSettings } from "src/types";
import { asyncHandler } from "src/utils/asyncHandler";

/**
 * Replaces the body of the codeblock this element was rendered from.
 *
 * The section info is read at click time, not at render time: the user may
 * have edited the note above this block since it was rendered, which shifts
 * the line numbers.
 */
async function writeCodeblockBody(
  app: App,
  ctx: MarkdownPostProcessorContext,
  el: HTMLElement,
  body: string,
): Promise<boolean> {
  const section = ctx.getSectionInfo(el);
  const file = app.vault.getAbstractFileByPath(ctx.sourcePath);

  if (!section || !(file instanceof TFile)) return false;

  await app.vault.process(file, (data) => {
    const lines = data.split("\n");
    // lineStart/lineEnd are the fences themselves — keep them, swap what's
    // between so the block's language and any indentation survive.
    lines.splice(
      section.lineStart + 1,
      section.lineEnd - section.lineStart - 1,
      ...body.trimEnd().split("\n"),
    );
    return lines.join("\n");
  });

  return true;
}

/**
 * Adds the hover "edit" affordance to a rendered heatmap, so a block created
 * through the modal can be changed through it too instead of by hand-editing
 * YAML.
 */
export function renderEditButton(
  el: HTMLElement,
  app: App,
  ctx: MarkdownPostProcessorContext,
  settings: TrackerSettings,
  params: Record<string, unknown>,
): void {
  el.addClass("heatmap-tracker-editable");

  const button = el.createEl("button", {
    cls: "heatmap-tracker-edit-button",
    attr: { "aria-label": "Edit heatmap", title: "Edit heatmap" },
  });
  setIcon(button, "pencil");

  button.addEventListener("click", () => {
    new HeatmapModal(
      app,
      settings,
      asyncHandler(async (result: Record<string, unknown>) => {
        const written = await writeCodeblockBody(
          app,
          ctx,
          el,
          stringifyYaml(result),
        );
        if (!written) {
          new Notice(
            "Heatmap Tracker: could not locate this codeblock to update it.",
          );
        }
      }),
      params,
    ).open();
  });
}
