/**
 * Every bug fix leaves a regression marker.
 *
 * The rule already exists in prose (harness/README.md: "add a fixture when you
 * fix a rendering bug") and is followed by whoever remembers it. This makes it
 * mechanical: an issue listed under `### Fixed` in the CHANGELOG must be named
 * by a test or a harness fixture, so the case it broke on stays observable.
 *
 * A marker is just the issue number written as `#123`, `issue #123` or an
 * `issues/123` link, in a test file or in `harness/fixtures.ts`. Where to put
 * it: a unit test if the bug was in derivation, a fixture if it was visual.
 */
import { readFileSync, readdirSync } from "fs";
import { join } from "path";

const REPO_ROOT = join(__dirname, "../../..");

/**
 * Fixes released before this check existed. They are real bugs with no
 * regression marker; the list only shrinks. Do not add to it — a new fix
 * without a marker is the thing this test is for.
 */
const UNMARKED_LEGACY_FIXES = new Set([
  "7",
  "25",
  "35",
  "38",
  "41",
  // The schema was loosened from strict; the reason lives as a TODO in
  // trackerData.schema.ts, which this scan does not read (source, not a test).
  "64",
  "80",
  "83",
]);

/** Issue numbers linked from a `### Fixed` block in the CHANGELOG. */
function fixedIssues(): string[] {
  const found = new Set<string>();
  let section = "";

  for (const line of readFileSync(
    join(REPO_ROOT, "CHANGELOG.md"),
    "utf8",
  ).split("\n")) {
    // A version heading resets the section, so a stray link under `### Added`
    // of the next release is not attributed to the previous `### Fixed`.
    if (line.startsWith("## ")) {
      section = "";
    } else if (line.startsWith("### ")) {
      section = line.trim();
    } else if (section === "### Fixed") {
      for (const match of line.matchAll(/issues\/(\d+)/g)) {
        found.add(match[1]);
      }
    }
  }

  return [...found];
}

function sourceFiles(dir: string): string[] {
  const result: string[] = [];

  for (const entry of readdirSync(dir, { withFileTypes: true })) {
    const full = join(dir, entry.name);

    if (entry.isDirectory()) {
      if (entry.name !== "node_modules" && !entry.name.startsWith(".")) {
        result.push(...sourceFiles(full));
      }
    } else if (/\.tsx?$/.test(entry.name)) {
      result.push(full);
    }
  }

  return result;
}

/**
 * Every issue number referenced by a test or a harness fixture.
 *
 * Only the deliberate spellings count — `issues/123` (a link), `issue #123`
 * and a bare `(#123)`. A loose `#\d+` also matches hex colors, of which the
 * fixtures are full: `#239a3b` would have registered as covering issue 239.
 */
function markedIssues(): Set<string> {
  const marked = new Set<string>();
  const files = [
    ...sourceFiles(join(REPO_ROOT, "src")).filter((file) =>
      file.includes("__tests__"),
    ),
    join(REPO_ROOT, "harness/fixtures.ts"),
  ];

  for (const file of files) {
    const source = readFileSync(file, "utf8");
    for (const match of source.matchAll(
      /issues\/(\d+)|issue #(\d+)|\(#(\d+)\)/g,
    )) {
      marked.add(match[1] ?? match[2] ?? match[3]);
    }
  }

  return marked;
}

describe("fixed issues leave a regression marker", () => {
  const issues = fixedIssues();

  it("parses the CHANGELOG's Fixed sections at all", () => {
    expect(issues.length).toBeGreaterThan(5);
  });

  it.each(issues.filter((issue) => !UNMARKED_LEGACY_FIXES.has(issue)))(
    "issue #%s is named by a test or a fixture",
    (issue) => {
      expect([...markedIssues()]).toContain(issue);
    },
  );

  it("does not carry a legacy exemption for an issue that is now covered", () => {
    // Keeps the allowlist honest: once a marker is added, the exemption goes.
    const marked = markedIssues();
    expect([...UNMARKED_LEGACY_FIXES].filter((i) => marked.has(i))).toEqual([]);
  });
});
