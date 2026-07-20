import { App, TFile } from "obsidian";

const FRONTMATTER_FALLBACK_RE = /^---\r?\n[\s\S]*?\r?\n---\r?\n/;

/**
 * Reads a note's body (frontmatter stripped, bullets kept verbatim) from its
 * vault-relative path. Returns undefined if the path doesn't resolve to a file.
 */
export async function readNoteBody(
  app: App,
  filePath: string,
): Promise<string | undefined> {
  const file = app.vault.getAbstractFileByPath(filePath);
  if (!(file instanceof TFile)) {
    return undefined;
  }

  const raw = await app.vault.cachedRead(file);
  const frontmatterEnd = app.metadataCache.getFileCache(file)?.frontmatterPosition?.end.offset;

  const body =
    frontmatterEnd !== undefined
      ? raw.slice(frontmatterEnd)
      : raw.replace(FRONTMATTER_FALLBACK_RE, "");

  return body.trim();
}

/** Batch-reads note bodies for a set of vault-relative file paths, keyed by path. */
export async function readNoteBodies(
  app: App,
  filePaths: string[],
): Promise<Record<string, string>> {
  const uniquePaths = Array.from(new Set(filePaths));

  const results = await Promise.all(
    uniquePaths.map(async (path) => [path, await readNoteBody(app, path)] as const),
  );

  const bodiesByPath: Record<string, string> = {};
  for (const [path, body] of results) {
    if (body !== undefined) {
      bodiesByPath[path] = body;
    }
  }
  return bodiesByPath;
}
