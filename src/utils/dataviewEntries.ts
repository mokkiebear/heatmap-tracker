import { DataviewApi, Literal } from "obsidian-dataview";
import { Entry } from "../types";
import { parseIntensity } from "./intensity";

export interface DataviewEntriesParams {
  /** Folder to search in. Falsy/undefined means the whole vault. */
  path?: string;
  /** Frontmatter key(s) to track. Multiple keys have their intensities summed. */
  property: string | string[];
}

/**
 * Queries Dataview for every page under `path` that has at least one of the
 * tracked `property` keys set, and turns each match into a heatmap `Entry`.
 *
 * Shared by the `heatmap-tracker` codeblock processor and the create-heatmap
 * modal's live preview so both stay in sync with the same matching/intensity
 * rules.
 */
export function buildEntriesFromDataview(
  dv: DataviewApi,
  params: DataviewEntriesParams,
  createContent?: (page: Record<string, Literal>) => string | HTMLElement,
): Entry[] {
  const properties = Array.isArray(params.property)
    ? params.property
    : [params.property];

  if (properties.length === 0 || properties.every((p) => !p)) {
    return [];
  }

  // An empty/undefined path means "search the whole vault" — passing no
  // source to `dv.pages()` does that. Passing the literal string
  // `"undefined"` (via an unguarded template literal) would instead search
  // for a folder named "undefined".
  const pages = dv
    .pages(params.path ? `"${params.path}"` : undefined)
    .where((p: Record<string, Literal>) =>
      properties.some((property) => p[property] !== undefined),
    );

  const entries: Entry[] = [];

  for (const page of pages) {
    const intensity = properties.reduce(
      (sum: number, property: string) => sum + parseIntensity(page[property]),
      0,
    );

    entries.push({
      date: page.file.name,
      filePath: page.file.path,
      intensity,
      content: createContent?.(page),
    });
  }

  return entries;
}
