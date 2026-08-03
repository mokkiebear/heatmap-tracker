import { joinPath, nextAvailablePath, sanitizeFilename } from "../exportPath";

describe("sanitizeFilename", () => {
  it("keeps a plain title untouched", () => {
    expect(sanitizeFilename("Steps Tracker")).toBe("Steps Tracker");
  });

  it("strips the HTML a heatmapTitle may contain", () => {
    expect(sanitizeFilename("<b>👣 Steps Tracker 👣</b>")).toBe(
      "👣 Steps Tracker 👣",
    );
  });

  it("replaces characters that are illegal in a file name", () => {
    expect(sanitizeFilename('a/b\\c:d*e?f"g|h')).toBe("a-b-c-d-e-f-g-h");
  });

  // The HTML strip runs first, so anything that looks like a tag is removed
  // outright rather than surviving as dashes. Only unpaired angle brackets
  // reach the illegal-character replacement.
  it("removes tag-shaped text before replacing illegal characters", () => {
    expect(sanitizeFilename("g<h>i")).toBe("gi");
    expect(sanitizeFilename("2 > 1")).toBe("2 - 1");
  });

  it("falls back when the title is empty or was only markup", () => {
    expect(sanitizeFilename("")).toBe("Work Log Report");
    expect(sanitizeFilename("   ")).toBe("Work Log Report");
    expect(sanitizeFilename("<span></span>")).toBe("Work Log Report");
  });
});

describe("joinPath", () => {
  it("joins a folder and a file name", () => {
    expect(joinPath("Reports", "a.md")).toBe("Reports/a.md");
  });

  it("returns the bare file name when no folder is set", () => {
    expect(joinPath("", "a.md")).toBe("a.md");
  });

  it("tolerates stray leading and trailing slashes", () => {
    expect(joinPath("/Reports/", "a.md")).toBe("Reports/a.md");
    expect(joinPath("///", "a.md")).toBe("a.md");
  });

  it("keeps nested folders intact", () => {
    expect(joinPath("/Exports/2024/", "a.md")).toBe("Exports/2024/a.md");
  });
});

describe("nextAvailablePath", () => {
  const existing = (...paths: string[]) => {
    const set = new Set(paths);
    return (path: string) => set.has(path);
  };

  it("returns the path unchanged when nothing occupies it", () => {
    expect(nextAvailablePath("Reports/a.md", existing())).toBe("Reports/a.md");
  });

  it("suffixes with a counter rather than overwriting", () => {
    expect(nextAvailablePath("Reports/a.md", existing("Reports/a.md"))).toBe(
      "Reports/a (2).md",
    );
  });

  it("keeps counting past consecutive collisions", () => {
    expect(
      nextAvailablePath(
        "Reports/a.md",
        existing("Reports/a.md", "Reports/a (2).md", "Reports/a (3).md"),
      ),
    ).toBe("Reports/a (4).md");
  });

  it("handles a path with no extension", () => {
    expect(nextAvailablePath("Reports/a", existing("Reports/a"))).toBe(
      "Reports/a (2)",
    );
  });

  it("only treats the last dot as the extension", () => {
    expect(
      nextAvailablePath("Reports/a.b.md", existing("Reports/a.b.md")),
    ).toBe("Reports/a.b (2).md");
  });
});
