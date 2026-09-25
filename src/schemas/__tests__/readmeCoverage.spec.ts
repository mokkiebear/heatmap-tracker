/**
 * README coverage for `trackerData` parameters.
 *
 * The README's configuration reference is the source of truth for users: a
 * parameter that exists in the schema but not there is undiscoverable, which is
 * the step most easily forgotten when adding one (see the
 * `add-tracker-parameter` skill). The schema is the only list that cannot go
 * stale, so it drives the check.
 */
import { readFileSync } from "fs";
import { join } from "path";

import { TrackerDataSchema } from "src/schemas/trackerData.schema";

const readme = readFileSync(join(__dirname, "../../../README.md"), "utf8");

/**
 * Parameters documented somewhere other than under their own `### heading`.
 * The four date-range parameters share one section by design — they are
 * mutually exclusive and only make sense explained together.
 */
const DOCUMENTED_ELSEWHERE = new Set([
  "monthsToShow",
  "daysToShow",
  "startDate",
  "endDate",
  // Query filters: documented under "Narrowing down which notes count", since
  // they belong to the codeblock's query rather than the heatmap's appearance.
  "tags",
  "filters",
]);

describe("README documents every trackerData parameter", () => {
  const names = Object.keys(TrackerDataSchema.shape);

  it("reads a non-trivial parameter list from the schema", () => {
    expect(names.length).toBeGreaterThan(10);
  });

  it.each(names)("mentions `%s`", (name) => {
    expect(readme).toContain(`\`${name}\``);
  });

  it.each(names.filter((name) => !DOCUMENTED_ELSEWHERE.has(name)))(
    "gives `%s` its own section",
    (name) => {
      // The "At a glance" table links to these anchors, so a missing heading
      // is also a dead link.
      expect(readme).toMatch(new RegExp(`^### \`${name}\``, "m"));
    },
  );

  it.each(names.filter((name) => !DOCUMENTED_ELSEWHERE.has(name)))(
    "lists `%s` in the At a glance table",
    (name) => {
      expect(readme).toMatch(
        new RegExp(`\\|\\s*\\[\`${name}\`\\]\\(#${name.toLowerCase()}\\)`),
      );
    },
  );
});
