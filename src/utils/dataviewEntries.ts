import { DataviewApi, Literal } from "obsidian-dataview";

import { Entry } from "../types";
import {
  EntriesQuery,
  hasAnyTag,
  matchesFilters,
  normalizeDailyNoteFileName,
  resolveProperties,
} from "./entriesQuery";
import { parseIntensity } from "./intensity";

// Re-exported for the modules (and tests) that imported them from here before
// the two readers started sharing them.
export {
  normalizeDailyNoteFileName,
  normalizeTag,
  matchesFilter,
} from "./entriesQuery";

/** @deprecated Use `EntriesQuery` — the two readers share one query shape. */
export type DataviewEntriesParams = EntriesQuery;

/**
 * Queries Dataview for every page under `path` that has at least one of the
 * tracked `property` keys set (plus, optionally, a matching tag and/or extra
 * frontmatter conditions), and turns each match into a heatmap `Entry`.
 *
 * Used when the user has the Dataview plugin installed. It sees more than
 * Obsidian's own metadata cache does — most importantly inline fields
 * (`steps:: 8420`) — so it is preferred when available; `vaultEntries.ts` is
 * the no-dependency fallback.
 */
export function buildEntriesFromDataview(
  dv: DataviewApi,
  params: EntriesQuery,
  createContent?: (page: Record<string, Literal>) => string | HTMLElement,
): Entry[] {
  const properties = resolveProperties(params.property);

  if (!properties) {
    return [];
  }

  const tags = (params.tags ?? []).filter(Boolean);
  const filters = params.filters ?? [];

  // An empty/undefined path means "search the whole vault" — passing no
  // source to `dv.pages()` does that. Passing the literal string
  // `"undefined"` (via an unguarded template literal) would instead search
  // for a folder named "undefined".
  const pages = dv
    .pages(params.path ? `"${params.path}"` : undefined)
    .where((p: Record<string, Literal>) =>
      properties.some((property) => p[property] !== undefined),
    )
    .where((p: Record<string, Literal>) =>
      hasAnyTag(Array.from(p.file?.tags ?? []), tags),
    )
    .where((p: Record<string, Literal>) => matchesFilters(p, filters));

  const entries: Entry[] = [];

  for (const page of pages) {
    const intensity = properties.reduce(
      (sum: number, property: string) => sum + parseIntensity(page[property]),
      0,
    );

    entries.push({
      date: normalizeDailyNoteFileName(page.file.name),
      filePath: page.file.path,
      intensity,
      content: createContent?.(page),
    });
  }

  return entries;
}
