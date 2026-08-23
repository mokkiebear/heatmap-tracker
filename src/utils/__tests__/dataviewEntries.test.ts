import {
  buildEntriesFromDataview,
  normalizeDailyNoteFileName,
  normalizeTag,
} from "../dataviewEntries";
import { getDailyNoteSettings } from "obsidian-daily-notes-interface";

// Auto-mocked: every export becomes a jest.fn(). Individual tests configure
// `getDailyNoteSettings`'s return value where the daily-note format matters;
// everywhere else it returns `undefined`, so the code under test falls back
// to the `YYYY-MM-DD` default (matching pre-fix behavior for ISO filenames).
jest.mock("obsidian-daily-notes-interface");

function makePage(
  name: string,
  frontmatter: Record<string, unknown>,
  tags: string[] = [],
) {
  return {
    file: { name, path: `folder/${name}.md`, tags },
    ...frontmatter,
  };
}

function chainable(pages: Record<string, unknown>[], source?: string): any {
  return {
    __source: source,
    where(predicate: (p: any) => boolean) {
      return chainable(pages.filter(predicate), source);
    },
    [Symbol.iterator]() {
      return pages[Symbol.iterator]();
    },
  };
}

function makeDv(pages: Record<string, unknown>[]) {
  return {
    pages: jest.fn((source?: string) => chainable(pages, source)),
  };
}

describe("normalizeDailyNoteFileName", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it("leaves an already-ISO filename unchanged when no daily note format is configured", () => {
    expect(normalizeDailyNoteFileName("2026-08-10")).toBe("2026-08-10");
  });

  it("handles a daily note format that also describes folders", () => {
    // Periodic Notes setups commonly nest by year/month. Dataview's
    // `file.name` is only the last segment, so the full format never matched
    // and the entry kept its raw filename.
    (getDailyNoteSettings as jest.Mock).mockReturnValue({
      format: "YYYY/MM-MMMM/YYYY-MM-DD",
      folder: "",
      template: "",
    });

    expect(normalizeDailyNoteFileName("2026-08-10")).toBe("2026-08-10");
  });

  it("handles a nested non-ISO daily note format", () => {
    (getDailyNoteSettings as jest.Mock).mockReturnValue({
      format: "YYYY/MM/DD-MM-YYYY",
      folder: "",
      template: "",
    });

    expect(normalizeDailyNoteFileName("10-08-2026")).toBe("2026-08-10");
  });

  it("leaves the name alone when the filename segment is not a whole date", () => {
    // The segment is just `DD`, which moment would parse into the current year
    // and month — a confidently wrong date is worse than no conversion.
    (getDailyNoteSettings as jest.Mock).mockReturnValue({
      format: "YYYY/MM/DD",
      folder: "",
      template: "",
    });

    expect(normalizeDailyNoteFileName("05")).toBe("05");
  });

  it("converts a DD-MM-YYYY daily note filename to ISO using the configured format", () => {
    (getDailyNoteSettings as jest.Mock).mockReturnValue({
      format: "DD-MM-YYYY",
      folder: "",
      template: "",
    });

    expect(normalizeDailyNoteFileName("10-08-2026")).toBe("2026-08-10");
  });

  it("converts a filename in any configured moment format to ISO", () => {
    (getDailyNoteSettings as jest.Mock).mockReturnValue({
      format: "YYYY/MM/DD",
      folder: "",
      template: "",
    });

    expect(normalizeDailyNoteFileName("2026/08/10")).toBe("2026-08-10");
  });

  it("returns the original string unchanged when it doesn't match the configured format", () => {
    (getDailyNoteSettings as jest.Mock).mockReturnValue({
      format: "DD-MM-YYYY",
      folder: "",
      template: "",
    });

    // Not a daily note (e.g. a project note living in a tracked folder) —
    // must not be mangled into a bogus date.
    expect(normalizeDailyNoteFileName("Project Overview")).toBe(
      "Project Overview",
    );
  });

  it("falls back to the ISO default when reading daily note settings throws", () => {
    (getDailyNoteSettings as jest.Mock).mockImplementation(() => {
      throw new Error("Daily Notes plugin not available");
    });

    expect(normalizeDailyNoteFileName("2026-08-10")).toBe("2026-08-10");
  });
});

describe("buildEntriesFromDataview", () => {
  it("returns an empty array when no property is given", () => {
    const dv = makeDv([]);
    expect(buildEntriesFromDataview(dv as any, { property: "" })).toEqual([]);
    expect(buildEntriesFromDataview(dv as any, { property: [] })).toEqual([]);
  });

  it("queries the whole vault (no source) when path is falsy", () => {
    const dv = makeDv([]);
    buildEntriesFromDataview(dv as any, { property: "exercise" });
    expect(dv.pages).toHaveBeenCalledWith(undefined);
  });

  it("scopes the query to the given folder when path is set", () => {
    const dv = makeDv([]);
    buildEntriesFromDataview(dv as any, {
      path: "daily notes",
      property: "exercise",
    });
    expect(dv.pages).toHaveBeenCalledWith('"daily notes"');
  });

  it("normalizes DD-MM-YYYY daily note filenames to ISO so they show up on the heatmap", () => {
    (getDailyNoteSettings as jest.Mock).mockReturnValue({
      format: "DD-MM-YYYY",
      folder: "",
      template: "",
    });

    const dv = makeDv([makePage("10-08-2026", { exercise: 10 })]);

    const entries = buildEntriesFromDataview(dv as any, {
      property: "exercise",
    });

    expect(entries).toEqual([
      {
        date: "2026-08-10",
        filePath: "folder/10-08-2026.md",
        intensity: 10,
        content: undefined,
      },
    ]);
  });

  it("builds one entry per matching page with a single property", () => {
    const dv = makeDv([
      makePage("2026-01-01", { exercise: 10 }),
      makePage("2026-01-02", { exercise: undefined }),
    ]);

    const entries = buildEntriesFromDataview(dv as any, {
      property: "exercise",
    });

    expect(entries).toEqual([
      {
        date: "2026-01-01",
        filePath: "folder/2026-01-01.md",
        intensity: 10,
        content: undefined,
      },
    ]);
  });

  it("matches a page if any of multiple properties is set, and sums their intensities", () => {
    const dv = makeDv([
      makePage("2026-01-01", { exercise: 10, reading: true }),
      makePage("2026-01-02", { reading: true }),
      makePage("2026-01-03", {}),
    ]);

    const entries = buildEntriesFromDataview(dv as any, {
      property: ["exercise", "reading"],
    });

    expect(entries).toHaveLength(2);
    expect(entries[0].intensity).toBe(11); // 10 + parseIntensity(true) = 1
    expect(entries[1].intensity).toBe(1); // only `reading: true`
  });

  it("uses the createContent callback to build entry content", () => {
    const dv = makeDv([makePage("2026-01-01", { exercise: 10 })]);

    const entries = buildEntriesFromDataview(
      dv as any,
      { property: "exercise" },
      (page) => `content-for-${page.file.name}`,
    );

    expect(entries[0].content).toBe("content-for-2026-01-01");
  });

  describe("tags", () => {
    it("normalizes tags without a leading #", () => {
      expect(normalizeTag("journal")).toBe("#journal");
      expect(normalizeTag("#journal")).toBe("#journal");
      expect(normalizeTag("  journal  ")).toBe("#journal");
    });

    it("only includes pages with at least one of the given tags", () => {
      const dv = makeDv([
        makePage("2026-01-01", { exercise: 10 }, ["#journal"]),
        makePage("2026-01-02", { exercise: 5 }, ["#work"]),
        makePage("2026-01-03", { exercise: 3 }, []),
      ]);

      const entries = buildEntriesFromDataview(dv as any, {
        property: "exercise",
        tags: ["journal"],
      });

      expect(entries.map((e) => e.date)).toEqual(["2026-01-01"]);
    });

    it("matches if a page has any of multiple requested tags", () => {
      const dv = makeDv([
        makePage("2026-01-01", { exercise: 10 }, ["#journal"]),
        makePage("2026-01-02", { exercise: 5 }, ["#work"]),
      ]);

      const entries = buildEntriesFromDataview(dv as any, {
        property: "exercise",
        tags: ["journal", "work"],
      });

      expect(entries).toHaveLength(2);
    });
  });

  describe("filters", () => {
    it("requires all filter conditions to match (AND)", () => {
      const dv = makeDv([
        makePage("2026-01-01", { exercise: 10, status: "done" }),
        makePage("2026-01-02", { exercise: 5, status: "pending" }),
      ]);

      const entries = buildEntriesFromDataview(dv as any, {
        property: "exercise",
        filters: [{ property: "status", operator: "equals", value: "done" }],
      });

      expect(entries.map((e) => e.date)).toEqual(["2026-01-01"]);
    });

    it("supports 'contains' on strings and arrays", () => {
      const dv = makeDv([
        makePage("2026-01-01", { exercise: 10, notes: "looks great" }),
        makePage("2026-01-02", { exercise: 5, notes: ["ok", "tired"] }),
        makePage("2026-01-03", { exercise: 3, notes: "skipped" }),
      ]);

      const entries = buildEntriesFromDataview(dv as any, {
        property: "exercise",
        filters: [{ property: "notes", operator: "contains", value: "ok" }],
      });

      expect(entries.map((e) => e.date).sort()).toEqual([
        "2026-01-01",
        "2026-01-02",
      ]);
    });

    it("supports 'notEmpty'", () => {
      const dv = makeDv([
        makePage("2026-01-01", { exercise: 10, notes: "hi" }),
        makePage("2026-01-02", { exercise: 5, notes: "" }),
        makePage("2026-01-03", { exercise: 3 }),
      ]);

      const entries = buildEntriesFromDataview(dv as any, {
        property: "exercise",
        filters: [{ property: "notes", operator: "notEmpty" }],
      });

      expect(entries.map((e) => e.date)).toEqual(["2026-01-01"]);
    });
  });
});
