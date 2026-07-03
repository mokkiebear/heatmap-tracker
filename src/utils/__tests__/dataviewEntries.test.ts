import { buildEntriesFromDataview } from "../dataviewEntries";

function makePage(name: string, frontmatter: Record<string, unknown>) {
  return {
    file: { name, path: `folder/${name}.md` },
    ...frontmatter,
  };
}

function makeDv(pages: Record<string, unknown>[]) {
  const wherePages = { ...pages } as any;
  return {
    pages: jest.fn((source?: string) => ({
      __source: source,
      where(predicate: (p: any) => boolean) {
        return pages.filter(predicate);
      },
    })),
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
});
