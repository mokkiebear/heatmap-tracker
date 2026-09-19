---
name: add-tracker-parameter
description: Add, rename or remove a `trackerData` parameter (a field users set in a heatmap-tracker codeblock or a dataviewjs call). Use whenever a change touches src/schemas/, DEFAULT_TRACKER_DATA, or introduces a new user-facing heatmap option.
---

# Adding a trackerData parameter

`TrackerData` is **inferred** from Zod (`z.infer<typeof TrackerDataSchema>`).
Never hand-edit the type in `src/types.ts` — edit the schema and the type
follows. A parameter that only exists in the type is invisible to validation.

## Steps

1. **Schema.** Add the field to `src/schemas/trackerData.schema.ts`, or to the
   sub-schema it belongs to (`ui.schema.ts`, `intensityConfig.schema.ts`,
   `entry.schema.ts`, `colorScheme.schema.ts`, `filterCondition.schema.ts`,
   `insight.schema.ts`). Mark it `.optional()` unless every existing codeblock
   in the wild already has it — required fields break existing notes.
   Document it with a `/** ... */` comment; that comment is the closest thing
   to an in-code spec for the parameter.
2. **Default.** Add it to `DEFAULT_TRACKER_DATA`
   (`src/constants/defaultTrackerData.ts`) if it needs a value when absent.
   `mergeTrackerData` (`src/utils/core.ts`) fills from here.
3. **Migration, if renaming.** Old codeblocks keep the old key. Map it in
   `mergeTrackerData` the way the pre-2.x `intensityScaleStart` /
   `intensityScaleEnd` / `defaultEntryIntensity` fields are mapped into
   `intensityConfig`. Do not silently drop a key users have in their notes.
4. **Consume it in the context, not in a view.** Derive whatever it implies in
   `HeatmapProvider` (`src/context/heatmap/heatmap.context.tsx`) or the
   `src/utils/` function it belongs to, and expose it via `useHeatmapContext()`.
   Views must not recompute.
5. **Tests.** Unit-test the derivation in `src/utils/__tests__/`. If the field
   changes what is valid, add a case in `src/schemas/__tests__/`. Invalid input
   must produce a readable error, not a crash — `validateTrackerData` throws a
   message that `renderApp` turns into a `Notice`, including a typo suggestion
   for unknown keys.
6. **Docs.** Add it to the "Tracker Settings Documentation" table in
   [README.md](../../../README.md) — that is the source of truth for users.
   Consider an example page under
   `EXAMPLE_VAULT/Documentation with Examples/3. trackerData parameters/`.
7. **Changelog.** Add a bullet under `## [Unreleased]` in CHANGELOG.md.
8. **See it.** If the field changes rendering, add a fixture in
   `harness/fixtures.ts` and look at it: `npm run harness`.

## Finish

```bash
npm run verify
```

Dates involved? Also `npm run verify:tz`.
