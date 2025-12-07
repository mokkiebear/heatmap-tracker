import { Box, TrackerData } from "src/types";
import {
  getDailyNote,
  createDailyNote,
  getAllDailyNotes,
  getDailyNoteSettings,
} from "obsidian-daily-notes-interface";
import moment from "moment";
import { App, TFile } from "obsidian";
import { notify } from "src/utils/notify";

/**
 * Opens a file in a new leaf.
 */
async function openFileInLeaf(app: App, file: TFile): Promise<void> {
  const leaf = app.workspace.getLeaf(true);
  await leaf.openFile(file);
}

/**
 * Creates a new file at the specified path and opens it.
 *
 * @param app - The Obsidian App instance.
 * @param fileName - The name of the file to be displayed in the confirmation dialog.
 * @param path - The full path where the file should be created.
 * @returns Promise<boolean> - True if the file was created and opened, false otherwise.
 */
export async function createNewFile(
  app: App,
  fileName: string,
  path: string
): Promise<boolean> {
  const shouldCreate = window.confirm(
    `Do you want to create a new file '${fileName}' at '${path}'?`
  );

  if (shouldCreate) {
    const createdFile = await app.vault.create(path, "");

    if (createdFile) {
      await openFileInLeaf(app, createdFile);
    }

    return true;
  }

  return false;
}

/**
 * Helper to check if a file exists and open it, or create it if allowed.
 */
async function handleFileOpen(
  app: App,
  filePath: string,
  date: moment.Moment,
  trackerData: TrackerData
): Promise<boolean> {
  const abstract = app.vault.getAbstractFileByPath(filePath);

  if (abstract && abstract instanceof TFile) {
    await openFileInLeaf(app, abstract);
    return true;
  }

  if (trackerData?.disableFileCreation) {
    return true; // Handled by doing nothing
  }

  return await createNewFile(app, date.format("YYYY-MM-DD"), filePath);
}

/**
 * Tries to open a file defined by an explicit `filePath` in the box data.
 *
 * @param app - The Obsidian App instance.
 * @param box - The box data containing the file path.
 * @param trackerData - The tracker settings.
 * @returns Promise<boolean> - True if handled (opened or created), false if not applicable.
 */
async function tryOpenExplicitFile(
  app: App,
  box: Box,
  trackerData: TrackerData
): Promise<boolean> {
  if (!box?.filePath) {
    return false;
  }
  await handleFileOpen(app, box.filePath, moment(box.date), trackerData);
  return true;
}

/**
 * Tries to open a file based on the `basePath` setting in tracker data.
 *
 * @param app - The Obsidian App instance.
 * @param date - The date associated with the box.
 * @param trackerData - The tracker settings.
 * @returns Promise<boolean> - True if handled (opened or created), false if not applicable.
 */
async function tryOpenBasePathFile(
  app: App,
  date: moment.Moment,
  trackerData: TrackerData
): Promise<boolean> {
  if (!trackerData?.basePath) {
    return false;
  }

  const normalizedBase = trackerData.basePath.replace(/^\/+|\/+$/g, "");
  const expectedPath = `${
    normalizedBase ? normalizedBase + "/" : ""
  }${date.format("YYYY-MM-DD")}.md`;

  await handleFileOpen(app, expectedPath, date, trackerData);
  return true;
}

/**
 * Tries to open or create a Daily Note for the given date.
 *
 * @param app - The Obsidian App instance.
 * @param date - The date associated with the box.
 * @param trackerData - The tracker settings.
 * @returns Promise<boolean> - True if handled (opened or created), false if failed or not applicable.
 */
async function tryOpenDailyNote(
  app: App,
  date: moment.Moment,
  trackerData: TrackerData
): Promise<boolean> {
  try {
    const allDailyNotes = getAllDailyNotes();
    const existing = getDailyNote(date, allDailyNotes);

    if (existing) {
      await openFileInLeaf(app, existing);
      return true;
    }

    const dnSettings = getDailyNoteSettings();
    const format = dnSettings?.format || "YYYY-MM-DD";
    const folder = (dnSettings?.folder || "").replace(/^\/+|\/+$/g, "");
    const filename = `${date.format(format)}.md`;
    const expectedPath = `${folder ? folder + "/" : ""}${filename}`;

    if (trackerData?.disableFileCreation) {
      return true; // Handled by doing nothing
    }

    const shouldCreate = window.confirm(
      `No page found for ${date.format(format)}.\nCreate at: ${expectedPath}?`
    );

    if (!shouldCreate) {
      return true; // User cancelled, but we handled the attempt
    }

    const created = await createDailyNote(date);
    if (created) {
      // @ts-ignore Obsidian API at runtime supports openFile(TFile)
      await openFileInLeaf(app, created);
    }

    return true;
  } catch (err) {
    console.log(err);
    return false; // Fallback if daily notes API fails
  }
}

/**
 * Fallback mechanism to find a file by name in the entire vault or suggest creation.
 *
 * @param app - The Obsidian App instance.
 * @param date - The date associated with the box.
 * @param trackerData - The tracker settings.
 * @returns Promise<void>
 */
async function tryOpenFallbackFile(
  app: App,
  date: moment.Moment,
  trackerData: TrackerData
): Promise<void> {
  const fileName = `${date.format("YYYY-MM-DD")}.md`;
  const file = app.vault.getFiles().find((f) => f.name === fileName);

  if (file) {
    await openFileInLeaf(app, file);
    return;
  }

  if (trackerData?.disableFileCreation) {
    return;
  }

  await createNewFile(app, fileName, fileName);
  notify(
    `* Heatmap Tracker *\nWe tried to create/open a Daily Note, but something went wrong.\nTry to use:\n- 'filePath' for entry (page.file.path)\n- 'basePath' for trackerData object\n- 'customHref' to set a custom link\n- use 'daily notes' Obsidian's plugin`,
    5000
  );
}

/**
 * Handles the click event on a heatmap box.
 * Tries to open a corresponding file using a sequence of strategies:
 * 1. Explicit file path in the box data.
 * 2. Base path defined in tracker settings.
 * 3. Daily Notes plugin API.
 * 4. Fallback file search/creation.
 *
 * @param box - The box data.
 * @param app - The Obsidian App instance.
 * @param trackerData - The tracker settings.
 */
export async function handleBoxClick(
  box: Box,
  app: App,
  trackerData: TrackerData
) {
  if (!box?.date) {
    return;
  }

  const date = moment(box.date);

  // 1) If box has an explicit filePath, try to open that exact file
  if (await tryOpenExplicitFile(app, box, trackerData)) {
    return;
  }

  // 2) If trackerData has a basePath, suggest creating there using the date-based filename
  if (await tryOpenBasePathFile(app, date, trackerData)) {
    return;
  }

  // 3) Fallback to Daily Notes API (uses its folder/format)
  if (await tryOpenDailyNote(app, date, trackerData)) {
    return;
  }

  // 4) Final fallback
  await tryOpenFallbackFile(app, date, trackerData);
}
