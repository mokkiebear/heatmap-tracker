import { App, TFile } from "obsidian";
import { readNoteBody, readNoteBodies } from "../noteBody";

jest.mock("obsidian", () => ({
  App: jest.fn(),
  TFile: jest.fn(),
}));

describe("readNoteBody", () => {
  let app: App;
  let mockVault: any;
  let mockMetadataCache: any;

  beforeEach(() => {
    mockVault = {
      getAbstractFileByPath: jest.fn(),
      cachedRead: jest.fn(),
    };
    mockMetadataCache = {
      getFileCache: jest.fn(),
    };
    app = { vault: mockVault, metadataCache: mockMetadataCache } as unknown as App;
  });

  it("returns undefined when the path does not resolve to a TFile", async () => {
    mockVault.getAbstractFileByPath.mockReturnValue(null);

    const body = await readNoteBody(app, "missing.md");

    expect(body).toBeUndefined();
    expect(mockVault.cachedRead).not.toHaveBeenCalled();
  });

  it("strips frontmatter using metadataCache's frontmatterPosition when available", async () => {
    const frontmatter = "---\ndate: 2026-07-15\nwork_hours: 8\n---\n";
    const raw = `${frontmatter}- meeting\n- did stuff`;
    const file = new TFile();

    mockVault.getAbstractFileByPath.mockReturnValue(file);
    mockVault.cachedRead.mockResolvedValue(raw);
    mockMetadataCache.getFileCache.mockReturnValue({
      frontmatterPosition: {
        start: { line: 0, col: 0, offset: 0 },
        end: { line: 3, col: 3, offset: frontmatter.length },
      },
    });

    const body = await readNoteBody(app, "2026-07-15.md");

    expect(body).toBe("- meeting\n- did stuff");
  });

  it("falls back to a regex strip when metadataCache has no frontmatterPosition", async () => {
    const file = new TFile();
    mockVault.getAbstractFileByPath.mockReturnValue(file);
    mockVault.cachedRead.mockResolvedValue("---\ndate: 2026-07-15\n---\n- bullet one");
    mockMetadataCache.getFileCache.mockReturnValue(null);

    const body = await readNoteBody(app, "2026-07-15.md");

    expect(body).toBe("- bullet one");
  });

  it("returns the trimmed raw text when there is no frontmatter at all", async () => {
    const file = new TFile();
    mockVault.getAbstractFileByPath.mockReturnValue(file);
    mockVault.cachedRead.mockResolvedValue("  - just a bullet, no frontmatter  ");
    mockMetadataCache.getFileCache.mockReturnValue(null);

    const body = await readNoteBody(app, "no-frontmatter.md");

    expect(body).toBe("- just a bullet, no frontmatter");
  });
});

describe("readNoteBodies", () => {
  it("dedupes paths and only includes resolved bodies", async () => {
    const file = new TFile();
    const mockVault = {
      getAbstractFileByPath: jest.fn((path: string) => (path === "a.md" ? file : null)),
      cachedRead: jest.fn().mockResolvedValue("---\ndate: 2026-07-15\n---\nbody text"),
    };
    const mockMetadataCache = { getFileCache: jest.fn().mockReturnValue(null) };
    const app = { vault: mockVault, metadataCache: mockMetadataCache } as unknown as App;

    const bodies = await readNoteBodies(app, ["a.md", "a.md", "b.md"]);

    expect(mockVault.getAbstractFileByPath).toHaveBeenCalledTimes(2);
    expect(bodies).toEqual({ "a.md": "body text" });
  });
});
