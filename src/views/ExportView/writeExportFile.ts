import { App, TFile } from "obsidian";
import { trimSlashes } from "src/utils/path";
import {
  joinPath,
  nextAvailablePath,
  sanitizeFilename,
} from "src/utils/report/exportPath";

async function ensureFolder(app: App, folderPath: string): Promise<void> {
  const trimmed = trimSlashes(folderPath);
  if (!trimmed) return;
  if (app.vault.getAbstractFileByPath(trimmed)) return;
  await app.vault.createFolder(trimmed);
}

/**
 * Creates `<folder>/<title> <start> to <end>.<ext>`, creating the folder and
 * side-stepping an existing file of the same name.
 */
export async function writeExportFile(
  app: App,
  args: {
    folder: string;
    title: string;
    startDate: string;
    endDate: string;
    extension: "md" | "html";
    content: string;
  },
): Promise<TFile> {
  const filename = `${sanitizeFilename(args.title)} ${args.startDate} to ${args.endDate}.${args.extension}`;
  await ensureFolder(app, args.folder);
  const path = nextAvailablePath(joinPath(args.folder, filename), (candidate) =>
    Boolean(app.vault.getAbstractFileByPath(candidate)),
  );
  return app.vault.create(path, args.content);
}
