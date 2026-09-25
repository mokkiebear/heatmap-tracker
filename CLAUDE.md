# CLAUDE.md

Obsidian plugin that renders GitHub-style heatmaps from note data. TypeScript +
React (aliased to Preact at build time), bundled with esbuild.

## Commands

```bash
npm run verify      # type-check + lint + format:check + test — run before every commit
npm run verify:tz   # same suite under TZ=utc and TZ=America/New_York
npm test            # jest only (~8s, 555 tests)
npx jest src/utils/__tests__/date.spec.ts   # single file while iterating
npm run build       # tsc --noEmit + esbuild production bundle into build/
npm run dev         # watch build, copies into EXAMPLE_VAULT for hot-reload
npm run harness     # standalone render harness at http://127.0.0.1:5174/index.html
npm run lint:fix    # eslint --fix
npm run format      # prettier --write
```

`npm run verify` runs the same checks as [ci.yml](.github/workflows/ci.yml) in the
same order. Green locally means green in CI. CI additionally runs `verify:tz` and
`build`.

## Repo map

| Path | What lives there |
|---|---|
| `src/main.tsx` | Obsidian plugin entry: codeblock processor, commands, settings persistence |
| `src/render.tsx` | Merge → validate → mount pipeline; the `window.renderHeatmapTracker` global |
| `src/schemas/` | Zod schemas — **the** source of truth for `TrackerData` fields |
| `src/types.ts` | `TrackerData` (inferred from Zod, do not hand-edit), `TrackerSettings`, view enums |
| `src/context/heatmap/` | `HeatmapProvider` — computes dates, colors, intensities, boxes once |
| `src/utils/` | Pure derivation logic: `date.ts`, `intensity.ts`, `colors.ts`, `core.ts` |
| `src/views/`, `src/components/` | Rendering only; read from `useHeatmapContext()` |
| `src/settings.ts`, `src/settings/` | Plugin-wide settings tab |
| `src/localization/locales/` | i18n resources |
| `EXAMPLE_VAULT/` | Obsidian vault used for manual testing; also holds doc examples |

This repo is indexed by CodeGraph, so `codegraph explore "<symbol or question>"`
answers "where is X / what calls X" in one call, with the blast radius, instead
of a grep-and-read loop. The index (`.codegraph/codegraph.db`) is local and
gitignored; rebuild it with `codegraph init`.

Read [ARCHITECTURE.md](ARCHITECTURE.md) before any structural change — it has the
full data pipeline and a "where to make a change" table.

## Invariants

- **`TrackerData` vs `TrackerSettings` are different things.** `TrackerData` is
  one heatmap's config, lives in the user's note, is never persisted by the
  plugin. `TrackerSettings` is plugin-wide defaults, persisted via `saveData()`.
  Never merge one into the other.
- **Schema first.** To add or rename a `trackerData` parameter, edit
  `src/schemas/`; `TrackerData` in `src/types.ts` is `z.infer<...>` and updates
  itself. Also update `DEFAULT_TRACKER_DATA` in `src/constants/`.
- **Derive once, in the context.** Views must not recompute dates, colors or
  intensities — add it to `HeatmapProvider` so every view sees the same values.
- **Dates are timezone-sensitive.** Several past bugs were TZ-dependent, which is
  why CI runs the suite under three zones. Touching `src/utils/date.ts`,
  `intensity.ts` or anything date-shaped: run `npm run verify:tz`.
- **Validation must not crash.** `validateTrackerData()` reports failures via a
  `Notice` with a typo suggestion. Keep that contract; users have old codeblocks.
- **Backwards compatibility.** Legacy fields are migrated in `mergeTrackerData()`
  (`src/utils/core.ts`). Removing a legacy field breaks existing notes.

## Conventions

- Tests live in `__tests__/` next to the code, named `*.test.ts(x)` or `*.spec.ts(x)`.
  Test files are linted like source — they are not exempt.
- Build test data with the helpers in `src/test-utils/` (`makeTrackerData`,
  `makeSettings`, `makeEntries`, `renderWithHeatmap`) rather than casting an
  incomplete literal with `as never` — the cast hides renamed fields from the
  type checker. Never build a date from "today" in a test; pass the date in.
- `npm run test:coverage` enforces a floor in `jest.config.js`. Raise it when
  coverage rises; do not lower it to make a change pass.
- Prettier owns formatting. Don't hand-format; CI runs `format:check`.
- User-facing change → add a bullet under `## [Unreleased]` in [CHANGELOG.md](CHANGELOG.md).
- New `trackerData` parameter → document it in README's "Tracker Settings
  Documentation" section (source of truth for users).
- Commit messages: present tense, `type(scope): summary` as in recent history.
- Don't commit `build/` or `coverage/` — both gitignored.
- Don't bump the version by hand; releases go through
  [.agent/workflows/release.md](.agent/workflows/release.md).

## Recurring workflows

Multi-file tasks that are easy to half-finish have a skill in `.claude/skills/`:
`add-tracker-parameter`, `add-language`, `debug-timezone`, `review-dependabot-pr`,
`release`. Read the matching one before starting that kind of change.

## Verification

Unit tests cover the derivation layer. For anything that changes what the
heatmap *looks like*, also run the render harness — Obsidian itself does not run
headless, but the harness does:

```bash
npm run harness   # then open/screenshot http://127.0.0.1:5174/index.html
```

It mounts the real pipeline against fixed fixtures ([harness/README.md](harness/README.md)).
Fixed a rendering bug? Add a fixture for it.

Do not claim a visual result you did not observe. If you did not open the
harness and did not write a `@testing-library/react` assertion, say the change
is unverified.

Three checks keep the surrounding docs and fixtures honest; they run as ordinary
jest tests, so `npm run verify` catches them:

| Check | Fails when |
|---|---|
| `src/localization/__tests__/localeCompleteness.spec.ts` | a locale gains a key English lacks, or drifts further behind `en.json` than its declared budget |
| `src/schemas/__tests__/readmeCoverage.spec.ts` | a `trackerData` parameter exists in the schema with no README section or "At a glance" row |
| `src/utils/__tests__/regressionCoverage.spec.ts` | a CHANGELOG `### Fixed` entry links an issue that no test or harness fixture names |

Adding a translation key is expected to fail the first of these for every locale
until each is translated: lower that locale's number in `ALLOWED_MISSING`, never
raise it silently. The third wants the issue number written as `issue #123`,
`(#123)` or an `issues/123` link — in a unit test if the bug was in derivation,
in a fixture if it was visual.

`npm run harness:shots` screenshots every fixture into `harness/shots/`; CI runs
it and uploads the PNGs as the `harness-screenshots` artifact, so a PR that
changes the rendering carries the pictures with it.

