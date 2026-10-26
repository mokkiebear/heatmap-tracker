import { App, TFile } from "obsidian";
import { readNoteBody, readNoteBodies } from "../noteBody";

jest.mock("obsidian", () => ({
  App: jest.fn(),
  TFile: jest.fn(),
}));

/** An app whose vault holds `raw` at every path but "missing.md". */
function makeApp(raw: string, frontmatterEnd?: number) {
  const vault = {
    getAbstractFileByPath: jest.fn((path: string) =>
      path === "missing.md" ? null : new TFile(),
    ),
    cachedRead: jest.fn().mockResolvedValue(raw),
  };
  const metadataCache = {
    getFileCache: jest
      .fn()
      .mockReturnValue(
        frontmatterEnd === undefined
          ? null
          : { frontmatterPosition: { end: { offset: frontmatterEnd } } },
      ),
  };
  return { app: { vault, metadataCache } as unknown as App, vault };
}

describe("readNoteBody", () => {
  it("returns undefined when the path does not resolve to a TFile", async () => {
    const { app, vault } = makeApp("");

    expect(await readNoteBody(app, "missing.md")).toBeUndefined();
    expect(vault.cachedRead).not.toHaveBeenCalled();
  });

  const frontmatter = "---\ndate: 2026-07-15\nwork_hours: 8\n---\n";

  it.each([
    [
      "at metadataCache's frontmatterPosition",
      `${frontmatter}- meeting\n- did stuff`,
      frontmatter.length,
      "- meeting\n- did stuff",
    ],
    [
      "by pattern when metadataCache has no position",
      "---\ndate: 2026-07-15\n---\n- bullet one",
      undefined,
      "- bullet one",
    ],
    [
      "not at all when there is none, only trimming",
      "  - just a bullet, no frontmatter  ",
      undefined,
      "- just a bullet, no frontmatter",
    ],
  ])("strips frontmatter %s", async (_, raw, frontmatterEnd, body) => {
    expect(await readNoteBody(makeApp(raw, frontmatterEnd).app, "a.md")).toBe(
      body,
    );
  });
});

describe("readNoteBodies", () => {
  it("dedupes paths and only includes resolved bodies", async () => {
    const { app, vault } = makeApp("---\ndate: 2026-07-15\n---\nbody text");

    const bodies = await readNoteBodies(app, ["a.md", "a.md", "missing.md"]);

    expect(vault.getAbstractFileByPath).toHaveBeenCalledTimes(2);
    expect(bodies).toEqual({ "a.md": "body text" });
  });
});
