import { App, TFile, getAllTags } from "obsidian";

import { Entry } from "../types";
import {
  EntriesQuery,
  hasAnyTag,
  isUnderPath,
  matchesFilters,
  normalizeDailyNoteFileName,
  resolveProperties,
} from "./entriesQuery";
import { parseIntensity } from "./intensity";

export interface VaultPage {
  file: TFile;
  frontmatter: Record<string, unknown>;
}

/**
 * Builds entries from Obsidian's own metadata cache, with no third-party
 * plugin involved.
 *
 * Dataview remains the better reader when it is installed — it also indexes
 * inline fields (`steps:: 8420`), which the metadata cache does not see. This
 * exists so that a vault without Dataview still gets a working heatmap from
 * frontmatter instead of nothing at all, which is what every new user hit
 * before they had installed a second plugin.
 */
export function buildEntriesFromVault(
  app: App,
  params: EntriesQuery,
  createContent?: (page: VaultPage) => string | HTMLElement,
): Entry[] {
  const properties = resolveProperties(params.property);

  if (!properties) {
    return [];
  }

  const tags = (params.tags ?? []).filter(Boolean);
  const filters = params.filters ?? [];
  const entries: Entry[] = [];

  for (const file of app.vault.getMarkdownFiles()) {
    if (!isUnderPath(file.path, params.path)) {
      continue;
    }

    const cache = app.metadataCache.getFileCache(file);
    const frontmatter = (cache?.frontmatter ?? {}) as Record<string, unknown>;

    if (!properties.some((property) => frontmatter[property] !== undefined)) {
      continue;
    }

    // `getAllTags` covers both frontmatter `tags:` and inline `#tags`, which is
    // what Dataview's `file.tags` reports too.
    if (!hasAnyTag(cache ? (getAllTags(cache) ?? []) : [], tags)) {
      continue;
    }

    if (!matchesFilters(frontmatter, filters)) {
      continue;
    }

    const intensity = properties.reduce(
      (sum, property) => sum + parseIntensity(frontmatter[property]),
      0,
    );

    entries.push({
      date: normalizeDailyNoteFileName(file.basename),
      filePath: file.path,
      intensity,
      content: createContent?.({ file, frontmatter }),
    });
  }

  return entries;
}
