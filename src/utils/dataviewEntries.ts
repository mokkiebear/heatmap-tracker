import { DataviewApi, Literal } from "obsidian-dataview";
import { getDailyNoteSettings } from "obsidian-daily-notes-interface";
import { moment as obsidianMoment } from "obsidian";
// Type-only: erased at build time, so the `moment` package stays out of the
// bundle. Obsidian's own `moment` export is typed as `typeof Moment` off an
// `import * as Moment` (obsidian.d.ts), which has no call signature — hence
// borrowing the callable type from the package itself. Mirrors heatmapBox.ts.
import type Moment from "moment";
import { Entry, FilterCondition } from "../types";
import { parseIntensity } from "./intensity";

const moment = obsidianMoment as unknown as typeof Moment;

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

/**
 * Dataview's `page.file.name` is just the note's filename with the
 * extension stripped — it is NOT necessarily `YYYY-MM-DD`. Daily notes can
 * be named in whatever format the user configured in Obsidian's Daily
 * Notes/Periodic Notes settings (e.g. `DD-MM-YYYY`), but everywhere else in
 * this plugin (grid generation, streaks, year filtering, ...) assumes
 * entry dates are ISO `YYYY-MM-DD`. Previously the raw filename was used
 * as-is, so anything other than an ISO-formatted daily note silently
 * matched nothing and every box showed "no data".
 *
 * This reads the vault's actual configured Daily Notes format and uses it
 * to convert the filename to canonical `YYYY-MM-DD`. If the filename
 * doesn't strictly match that format (e.g. it's not a daily note, or the
 * Daily Notes plugin isn't configured), the original string is returned
 * unchanged so already-ISO names keep working exactly as before.
 */
export function normalizeDailyNoteFileName(fileName: string): string {
  try {
    const format = getDailyNoteSettings()?.format || "YYYY-MM-DD";

    const parsed = moment(fileName, format, true);
    if (parsed.isValid()) {
      return parsed.format("YYYY-MM-DD");
    }

    // A daily-note format may describe a folder tree as well as a filename
    // (`YYYY/MM/YYYY-MM-DD` is a common Periodic Notes setup). Dataview's
    // `file.name` is only the last segment, so the full format can never match
    // it — retry against the filename part of the format alone.
    if (format.includes("/")) {
      const fileNameFormat = format.slice(format.lastIndexOf("/") + 1);

      // Only worth trying when the filename segment identifies a whole date on
      // its own. For a format like `YYYY/MM/DD` the segment is just `DD`, which
      // moment would happily parse into the *current* year and month — a
      // confidently wrong date is worse than leaving the name alone.
      const isSelfContained =
        /[Yy]/.test(fileNameFormat) &&
        /M/.test(fileNameFormat) &&
        /D/.test(fileNameFormat);

      if (isSelfContained) {
        const parsedSegment = moment(fileName, fileNameFormat, true);

        if (parsedSegment.isValid()) {
          return parsedSegment.format("YYYY-MM-DD");
        }
      }
    }

    return fileName;
  } catch {
    // Daily Notes/Periodic Notes plugin unavailable or not configured, or
    // `moment` itself unavailable in this environment — never let date
    // normalization take down entry building; just use the raw filename,
    // same as pre-fix behavior.
    return fileName;
  }
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
  return filters.every((filter) =>
    matchesFilter(page[filter.property], filter),
  );
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
      date: normalizeDailyNoteFileName(page.file.name),
      filePath: page.file.path,
      intensity,
      content: createContent?.(page),
    });
  }

  return entries;
}
