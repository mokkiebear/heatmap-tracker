import { App, getAllTags } from "obsidian";
import { getDataviewApi } from "src/utils/dataviewApi";

/** Every frontmatter key used by notes under `path` (whole vault when blank). */
export function getVaultProperties(app: App, path: string): string[] {
  const dv = getDataviewApi(app);
  if (!dv) return [];

  const props = new Set<string>();
  for (const page of dv.pages(path ? `"${path}"` : undefined)) {
    if (!page.file?.frontmatter) continue;
    for (const key of Object.keys(page.file.frontmatter)) {
      props.add(key);
    }
  }
  return [...props].sort();
}

/** Every tag used anywhere in the vault. */
export function getVaultTags(app: App): string[] {
  const tags = new Set<string>();
  for (const file of app.vault.getMarkdownFiles()) {
    const cache = app.metadataCache.getFileCache(file);
    if (!cache) continue;
    for (const tag of getAllTags(cache) ?? []) {
      tags.add(tag);
    }
  }
  return [...tags].sort();
}
