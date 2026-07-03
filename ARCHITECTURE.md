# Architecture

One page on how data flows through the plugin, for contributors who know *what*
a file does but not *why* it's there. For end-user parameter docs, see the
[README](./README.md#tracker-settings-documentation).

## Two kinds of "settings" — don't conflate them

- **`TrackerData`** (`src/schemas/trackerData.schema.ts` → `src/types.ts`) — the
  data for *one heatmap*. Comes from a `heatmap-tracker` codeblock, a
  `dataviewjs` script, or the "Insert Heatmap Tracker" modal. Not persisted by
  the plugin — it lives in the user's note.
- **`TrackerSettings`** (`src/types.ts`, populated in `src/settings.ts`) — the
  plugin-wide defaults (palettes, week start day, language, etc.), edited in
  Obsidian's settings tab and persisted via `plugin.saveData()`/`loadData()`
  (see `src/main.tsx`).

A given heatmap render always has both: `TrackerData` for that heatmap,
`TrackerSettings` for plugin-wide defaults it falls back to.

## Entry points

Three ways a heatmap gets rendered, all converging on `renderApp`
(`src/render.tsx`):

1. **`heatmap-tracker` codeblock** — `src/main.tsx` registers a markdown
   codeblock processor. It reads `property`/`path` from the codeblock YAML,
   queries Dataview for matching pages, builds `entries` from the results,
   then calls `window.renderHeatmapTracker`.
2. **`dataviewjs` script calling `renderHeatmapTracker(...)`** — same global
   function, called directly by the user's own script with a hand-built
   `trackerData` object. This is the "advanced usage" path in the README.
3. **"Insert Heatmap Tracker" command** — `src/modals/HeatmapModal.ts` builds
   a `trackerData`-shaped object from form input, live-previews it by calling
   `renderApp` directly, then on submit hands the result back to
   `src/main.tsx`'s command callback, which stringifies it into a
   `heatmap-tracker` codeblock and inserts it into the note (which then goes
   through path 1 on next render).

## The data pipeline (`src/render.tsx` → `src/context/heatmap/heatmap.context.tsx`)

```
raw input (unknown shape, may be an old codeblock)
   │
   ▼
mergeTrackerData()          src/utils/core.ts
   - fills in DEFAULT_TRACKER_DATA
   - migrates legacy fields (e.g. pre-2.x intensityScaleStart/
     intensityScaleEnd/defaultEntryIntensity) into intensityConfig
   │
   ▼
validateTrackerData()       src/schemas/validation.ts
   - TrackerDataSchema.safeParse() — the schema is the single source of
     truth for what fields exist; unknown/legacy keys are stripped here
   - on failure: Notice with a message + typo suggestion, not a crash
   │
   ▼
TrackerData (typed)         src/types.ts — z.infer<typeof TrackerDataSchema>
   │
   ▼
<HeatmapProvider>           src/context/heatmap/heatmap.context.tsx
   - resolveDateRange()       src/utils/date.ts  (year vs. startDate/endDate
                               vs. daysToShow vs. monthsToShow — one function,
                               one precedence order, documented there)
   - getColors()               src/utils/colors.ts
   - fillEntriesWithIntensity() src/utils/intensity.ts
   - getBoxes()                 src/utils/core.ts
   - exposes all of the above via useHeatmapContext()
   │
   ▼
<ReactApp>                  src/App.tsx
   - picks a view based on trackerData.layout / current tab
   │
   ▼
src/views/*  +  src/components/*
   - HeatmapTrackerView / MonthlyHeatmapView (the grid)
   - StatisticsView, LegendView, DocumentationView (other tabs)
   - all read exclusively from useHeatmapContext() — no view re-derives
     data the context already computed
```

## Where to make a change

- **Add/rename a `trackerData` parameter:** edit the relevant file in
  `src/schemas/`, then `TrackerData` in `src/types.ts` updates automatically
  (it's inferred, not hand-written). Update `DEFAULT_TRACKER_DATA`
  (`src/constants/defaultTrackerData.ts`) if it needs a default. Document it
  in the README's "Tracker Settings Documentation" section (the source of
  truth for end users) and, optionally, add an example page under
  `EXAMPLE_VAULT/Documentation with Examples/3. trackerData parameters/`.
- **Change how dates/intensities/colors are derived:** that logic lives in
  `src/utils/` (`date.ts`, `intensity.ts`, `colors.ts`, `core.ts`), consumed
  once by `HeatmapProvider`. Don't re-derive it inside a view/component —
  add it to the context instead so every view sees the same values.
- **Add a new view/tab:** add it to `IHeatmapView` in `src/types.ts`, a
  component under `src/views/`, and a case in the `switch` in `src/App.tsx`.
- **Add a plugin-wide setting:** `TrackerSettings` in `src/types.ts`,
  `DEFAULT_SETTINGS` in `src/constants/defaultSettings.ts`, and a control in
  `src/settings.ts` (or `src/settings/palette.settings.ts` for palettes).
- **Add a language:** see `docs/add-new-language.md`.
