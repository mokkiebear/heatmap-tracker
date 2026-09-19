import { getDailyNoteSettings } from "obsidian-daily-notes-interface";
import { moment as obsidianMoment } from "obsidian";
// Type-only: erased at build time, so the `moment` package stays out of the
// bundle. Obsidian's own `moment` export is typed as `typeof Moment` off an
// `import * as Moment` (obsidian.d.ts), which has no call signature — hence
// borrowing the callable type from the package itself. Mirrors heatmapBox.ts.
import type Moment from "moment";

import { FilterCondition } from "../types";

const moment = obsidianMoment as unknown as typeof Moment;

/**
 * What a heatmap asks the vault for. Shared by both readers — Dataview's
 * (`dataviewEntries.ts`) and Obsidian's own metadata cache
 * (`vaultEntries.ts`) — so the two cannot drift apart on what "matching" means.
 */
export interface EntriesQuery {
  /** Folder to search in. Falsy/undefined means the whole vault. */
  path?: string;
  /** Frontmatter key(s) to track. Multiple keys have their intensities summed. */
  property: string | string[];
  /** Only include pages with at least one of these tags (e.g. "#journal" or "journal"). */
  tags?: string[];
  /** Additional frontmatter conditions a page must satisfy (all must match). */
  filters?: FilterCondition[];
}

/** The tracked keys as a list, or `null` when the query names none. */
export function resolveProperties(
  property: string | string[],
): string[] | null {
  const properties = Array.isArray(property) ? property : [property];

  if (properties.length === 0 || properties.every((p) => !p)) {
    return null;
  }

  return properties;
}

/**
 * A note's filename is NOT necessarily `YYYY-MM-DD`. Daily notes can be named
 * in whatever format the user configured in Obsidian's Daily Notes/Periodic
 * Notes settings (e.g. `DD-MM-YYYY`), but everywhere else in this plugin (grid
 * generation, streaks, year filtering, ...) assumes entry dates are ISO
 * `YYYY-MM-DD`. Previously the raw filename was used as-is, so anything other
 * than an ISO-formatted daily note silently matched nothing and every box
 * showed "no data".
 *
 * This reads the vault's actual configured Daily Notes format and uses it to
 * convert the filename to canonical `YYYY-MM-DD`. If the filename doesn't
 * strictly match that format (e.g. it's not a daily note, or the Daily Notes
 * plugin isn't configured), the original string is returned unchanged so
 * already-ISO names keep working exactly as before.
 */
export function normalizeDailyNoteFileName(fileName: string): string {
  try {
    const format = getDailyNoteSettings()?.format || "YYYY-MM-DD";

    const parsed = moment(fileName, format, true);
    if (parsed.isValid()) {
      return parsed.format("YYYY-MM-DD");
    }

    // A daily-note format may describe a folder tree as well as a filename
    // (`YYYY/MM/YYYY-MM-DD` is a common Periodic Notes setup). The name we get
    // here is only the last segment, so the full format can never match it —
    // retry against the filename part of the format alone.
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

/** Obsidian tags are always `#`-prefixed; be lenient about user input that omits it. */
export function normalizeTag(tag: string): string {
  const trimmed = tag.trim();
  return trimmed.startsWith("#") ? trimmed : `#${trimmed}`;
}

export function hasAnyTag(pageTags: string[], wanted: string[]): boolean {
  if (wanted.length === 0) return true;

  return wanted.some((tag) => pageTags.includes(normalizeTag(tag)));
}

export function matchesFilter(
  value: unknown,
  filter: FilterCondition,
): boolean {
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

export function matchesFilters(
  values: Record<string, unknown>,
  filters: FilterCondition[],
): boolean {
  return filters.every((filter) =>
    matchesFilter(values[filter.property], filter),
  );
}

/**
 * Whether a file lives under `path`. An empty path means the whole vault.
 * Matches Dataview's `"folder"` source: the folder and everything below it.
 */
export function isUnderPath(filePath: string, path?: string): boolean {
  if (!path) return true;

  const folder = path.replace(/^\/+|\/+$/g, "");
  if (!folder) return true;

  return filePath.startsWith(`${folder}/`);
}
