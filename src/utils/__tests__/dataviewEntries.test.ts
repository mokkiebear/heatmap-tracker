import { buildEntriesFromDataview, normalizeTag } from "../dataviewEntries";

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
    buildEntriesFromDataview(dv as any, { path: "daily notes", property: "exercise" });
    expect(dv.pages).toHaveBeenCalledWith('"daily notes"');
  });

  it("builds one entry per matching page with a single property", () => {
    const dv = makeDv([
      makePage("2026-01-01", { exercise: 10 }),
      makePage("2026-01-02", { exercise: undefined }),
    ]);

    const entries = buildEntriesFromDataview(dv as any, { property: "exercise" });

    expect(entries).toEqual([
      { date: "2026-01-01", filePath: "folder/2026-01-01.md", intensity: 10, content: undefined },
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

      expect(entries.map((e) => e.date).sort()).toEqual(["2026-01-01", "2026-01-02"]);
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
