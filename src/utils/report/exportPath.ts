/**
 * Path/filename helpers for writing an export into the vault. Kept next to the
 * rest of the report logic (and out of `ExportView`) so they can be tested
 * without rendering the 600-line export screen.
 */

/** Characters Obsidian/most filesystems reject in a file name. */
const ILLEGAL_FILENAME_CHARS = /[\\/:*?"<>|]/g;

const FALLBACK_REPORT_NAME = "Work Log Report";

/**
 * Turns a heatmap title (which may contain user HTML, e.g. `<b>Steps</b>`) into
 * something safe to use as a file name. Falls back to a fixed name when the
 * title is empty or consisted only of markup.
 */
export function sanitizeFilename(name: string): string {
  const stripped = name
    .replace(/<[^>]*>/g, "")
    .replace(ILLEGAL_FILENAME_CHARS, "-")
    .trim();
  return stripped || FALLBACK_REPORT_NAME;
}

/** Joins an export folder and a file name, tolerating stray leading/trailing slashes. */
export function joinPath(folder: string, filename: string): string {
  const trimmed = folder.replace(/^\/+|\/+$/g, "");
  return trimmed ? `${trimmed}/${filename}` : filename;
}

/**
 * Given `Report.md`, returns `Report.md` if it is free, otherwise
 * `Report (2).md`, `Report (3).md`, ... — so exporting twice never silently
 * overwrites the previous report.
 *
 * `exists` is injected rather than taking the Obsidian `App` so this stays a
 * pure function of its inputs.
 */
export function nextAvailablePath(
  basePath: string,
  exists: (path: string) => boolean,
): string {
  const dotIndex = basePath.lastIndexOf(".");
  const stem = dotIndex === -1 ? basePath : basePath.slice(0, dotIndex);
  const ext = dotIndex === -1 ? "" : basePath.slice(dotIndex);

  let candidate = basePath;
  let counter = 2;
  while (exists(candidate)) {
    candidate = `${stem} (${counter})${ext}`;
    counter += 1;
  }
  return candidate;
}
