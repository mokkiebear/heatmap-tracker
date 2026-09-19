import { App, TFile } from "obsidian";

import { buildEntriesFromDataview } from "../dataviewEntries";
import { buildEntriesFromVault } from "../vaultEntries";

// Auto-mocked, same as dataviewEntries.test.ts: `getDailyNoteSettings` returns
// undefined, so filenames are read with the default YYYY-MM-DD format.
jest.mock("obsidian-daily-notes-interface");

interface Note {
  path: string;
  frontmatter?: Record<string, unknown>;
  /** Inline `#tags`, as Obsidian's cache reports them. */
  tags?: string[];
}

function makeApp(notes: Note[]): App {
  const files = notes.map(
    (note) =>
      ({
        path: note.path,
        basename: note.path.split("/").pop()?.replace(/\.md$/, "") ?? "",
      }) as TFile,
  );

  const caches = new Map(
    notes.map((note) => [
      note.path,
      {
        frontmatter: note.frontmatter,
        tags: (note.tags ?? []).map((tag) => ({ tag })),
      },
    ]),
  );

  return {
    vault: { getMarkdownFiles: () => files },
    metadataCache: { getFileCache: (file: TFile) => caches.get(file.path) },
  } as unknown as App;
}

/** The same notes as Dataview would report them, for the parity test. */
function makeDv(notes: Note[]) {
  const pages = notes.map((note) => ({
    ...note.frontmatter,
    file: {
      name: note.path.split("/").pop()?.replace(/\.md$/, "") ?? "",
      path: note.path,
      tags: [
        ...(note.tags ?? []),
        ...(Array.isArray(note.frontmatter?.tags)
          ? (note.frontmatter?.tags as string[]).map((tag) =>
              tag.startsWith("#") ? tag : `#${tag}`,
            )
          : []),
      ],
    },
  }));

  const chainable = (items: Record<string, unknown>[]): any => ({
    where: (predicate: (p: any) => boolean) =>
      chainable(items.filter(predicate)),
    [Symbol.iterator]: () => items[Symbol.iterator](),
  });

  return {
    pages: (source?: string) =>
      chainable(
        source
          ? pages.filter((page) =>
              String(page.file.path).startsWith(`${source.replace(/"/g, "")}/`),
            )
          : pages,
      ),
  } as never;
}

const NOTES: Note[] = [
  { path: "daily/2026-01-01.md", frontmatter: { steps: 1000 }, tags: ["#gym"] },
  { path: "daily/2026-01-02.md", frontmatter: { steps: 2000, mood: 3 } },
  { path: "daily/2026-01-03.md", frontmatter: { mood: 5 } },
  { path: "daily/nested/2026-01-04.md", frontmatter: { steps: 4000 } },
  { path: "archive/2026-01-05.md", frontmatter: { steps: 5000 } },
  { path: "notes/about.md", frontmatter: { title: "About" } },
  { path: "notes/no-frontmatter.md" },
];

describe("buildEntriesFromVault", () => {
  it("keeps only notes that have the tracked property", () => {
    const entries = buildEntriesFromVault(makeApp(NOTES), {
      property: "steps",
    });

    expect(entries.map((entry) => entry.date)).toEqual([
      "2026-01-01",
      "2026-01-02",
      "2026-01-04",
      "2026-01-05",
    ]);
    expect(entries[0].intensity).toBe(1000);
    expect(entries[0].filePath).toBe("daily/2026-01-01.md");
  });

  it("limits the search to a folder, including its subfolders", () => {
    const entries = buildEntriesFromVault(makeApp(NOTES), {
      property: "steps",
      path: "daily",
    });

    expect(entries.map((entry) => entry.filePath)).toEqual([
      "daily/2026-01-01.md",
      "daily/2026-01-02.md",
      "daily/nested/2026-01-04.md",
    ]);
  });

  it("sums several tracked properties", () => {
    const entries = buildEntriesFromVault(makeApp(NOTES), {
      property: ["steps", "mood"],
      path: "daily",
    });

    expect(entries.map((entry) => [entry.date, entry.intensity])).toEqual([
      ["2026-01-01", 1000],
      ["2026-01-02", 2003],
      ["2026-01-03", 5],
      ["2026-01-04", 4000],
    ]);
  });

  it("filters by tag, whether written inline or in frontmatter", () => {
    const notes: Note[] = [
      { path: "a/2026-01-01.md", frontmatter: { steps: 1 }, tags: ["#gym"] },
      { path: "a/2026-01-02.md", frontmatter: { steps: 2, tags: ["gym"] } },
      { path: "a/2026-01-03.md", frontmatter: { steps: 3 } },
    ];

    const entries = buildEntriesFromVault(makeApp(notes), {
      property: "steps",
      // Written without the leading '#', as a user would.
      tags: ["gym"],
    });

    expect(entries.map((entry) => entry.date)).toEqual([
      "2026-01-01",
      "2026-01-02",
    ]);
  });

  it("applies frontmatter filter conditions", () => {
    const notes: Note[] = [
      { path: "a/2026-01-01.md", frontmatter: { steps: 1, type: "run" } },
      { path: "a/2026-01-02.md", frontmatter: { steps: 2, type: "walk" } },
      { path: "a/2026-01-03.md", frontmatter: { steps: 3 } },
    ];

    expect(
      buildEntriesFromVault(makeApp(notes), {
        property: "steps",
        filters: [{ property: "type", operator: "equals", value: "run" }],
      }).map((entry) => entry.date),
    ).toEqual(["2026-01-01"]);

    expect(
      buildEntriesFromVault(makeApp(notes), {
        property: "steps",
        filters: [{ property: "type", operator: "notEmpty" }],
      }).map((entry) => entry.date),
    ).toEqual(["2026-01-01", "2026-01-02"]);
  });

  it("returns nothing when no property is named", () => {
    expect(
      buildEntriesFromVault(makeApp(NOTES), { property: "" }),
    ).toHaveLength(0);
    expect(
      buildEntriesFromVault(makeApp(NOTES), { property: [] }),
    ).toHaveLength(0);
  });

  it("passes the file and its frontmatter to the content callback", () => {
    const entries = buildEntriesFromVault(
      makeApp(NOTES),
      { property: "steps", path: "daily" },
      (page) => `${page.file.basename}:${page.frontmatter.steps}`,
    );

    expect(entries[0].content).toBe("2026-01-01:1000");
  });
});

describe("the two readers agree", () => {
  // The Dataview and metadata-cache paths are separate implementations of the
  // same query, and a user switching plugins on or off must not see their
  // heatmap change.
  const cases = [
    { property: "steps" },
    { property: "steps", path: "daily" },
    { property: ["steps", "mood"], path: "daily" },
    { property: "steps", tags: ["gym"] },
    {
      property: "steps",
      filters: [{ property: "steps", operator: "notEmpty" as const }],
    },
  ];

  it.each(cases)("matches for %o", (query) => {
    const fromVault = buildEntriesFromVault(makeApp(NOTES), query);
    const fromDataview = buildEntriesFromDataview(makeDv(NOTES), query);

    expect(
      fromVault.map(({ date, intensity, filePath }) => ({
        date,
        intensity,
        filePath,
      })),
    ).toEqual(
      fromDataview.map(({ date, intensity, filePath }) => ({
        date,
        intensity,
        filePath,
      })),
    );
  });
});
