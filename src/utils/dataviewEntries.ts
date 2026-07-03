import { DataviewApi, Literal } from "obsidian-dataview";
import { Entry, FilterCondition } from "../types";
import { parseIntensity } from "./intensity";

export interface DataviewEntriesParams {
  /** Folder to search in. Falsy/undefined means the whole vault. */
  path?: string;
  /** Frontmatter key(s) to track. Multiple keys have their intensities summed. */
  property: string | string[];
  /** Only include pages with at least one of these tags (e.g. "#journal" or "journal"). */
  tags?: string[];
  /** Additional frontmatter conditions a page must satisfy (all must match). */
  filters?: FilterCondition[];
}

/** Obsidian/Dataview tags are always `#`-prefixed; be lenient about user input that omits it. */
export function normalizeTag(tag: string): string {
  const trimmed = tag.trim();
  return trimmed.startsWith("#") ? trimmed : `#${trimmed}`;
}

function pageHasAnyTag(page: Record<string, Literal>, tags: string[]): boolean {
  if (tags.length === 0) return true;

  const pageTags: string[] = Array.from(page.file?.tags ?? []);
  return tags.some((tag) => pageTags.includes(normalizeTag(tag)));
}

function matchesFilter(value: unknown, filter: FilterCondition): boolean {
  switch (filter.operator) {
    case "notEmpty":
      if (Array.isArray(value)) return value.length > 0;
      return value !== undefined && value !== null && value !== "";
    case "equals":
      return String(value ?? "") === (filter.value ?? "");
    case "contains": {
      const needle = (filter.value ?? "").toLowerCase();
      if (Array.isArray(value)) {
        return value.some((v) => String(v).toLowerCase().includes(needle));
      }
      return String(value ?? "")
        .toLowerCase()
        .includes(needle);
    }
    default:
      return true;
  }
}

function pageMatchesFilters(
  page: Record<string, Literal>,
  filters: FilterCondition[],
): boolean {
  return filters.every((filter) => matchesFilter(page[filter.property], filter));
}

/**
 * Queries Dataview for every page under `path` that has at least one of the
 * tracked `property` keys set (plus, optionally, a matching tag and/or extra
 * frontmatter conditions), and turns each match into a heatmap `Entry`.
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
    .where((p: Record<string, Literal>) => pageHasAnyTag(p, tags))
    .where((p: Record<string, Literal>) => pageMatchesFilters(p, filters));

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
