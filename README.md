<div align="center">

<picture>
  <source media="(prefers-color-scheme: dark)" srcset="https://raw.githubusercontent.com/mokkiebear/heatmap-tracker/main/public/banner-dark.svg">
  <source media="(prefers-color-scheme: light)" srcset="https://raw.githubusercontent.com/mokkiebear/heatmap-tracker/main/public/banner-light.svg">
  <img alt="Heatmap Tracker — visualize your habits, goals and progress inside Obsidian" src="https://raw.githubusercontent.com/mokkiebear/heatmap-tracker/main/public/banner-light.svg" width="720">
</picture>

<br>

**Turn any dated note into a beautiful, interactive heatmap — habits, workouts, mood, finances, work logs, anything.**

<br>

[![Obsidian downloads](https://img.shields.io/badge/dynamic/json?logo=obsidian&color=%23483699&label=downloads&query=%24%5B%22heatmap-tracker%22%5D.downloads&url=https%3A%2F%2Fraw.githubusercontent.com%2Fobsidianmd%2Fobsidian-releases%2Fmaster%2Fcommunity-plugin-stats.json)](https://obsidian.md/plugins?id=heatmap-tracker)
[![Latest release](https://img.shields.io/github/v/release/mokkiebear/heatmap-tracker?label=release&color=7c3aed)](https://github.com/mokkiebear/heatmap-tracker/releases/latest)
[![CI](https://github.com/mokkiebear/heatmap-tracker/actions/workflows/ci.yml/badge.svg)](https://github.com/mokkiebear/heatmap-tracker/actions/workflows/ci.yml)
[![License](https://img.shields.io/github/license/mokkiebear/heatmap-tracker?color=22c55e)](./LICENSE)
[![Stars](https://img.shields.io/github/stars/mokkiebear/heatmap-tracker?style=flat&color=f59e0b)](https://github.com/mokkiebear/heatmap-tracker/stargazers)
[![Issues](https://img.shields.io/github/issues/mokkiebear/heatmap-tracker?color=0ea5e9)](https://github.com/mokkiebear/heatmap-tracker/issues)
[![PRs welcome](https://img.shields.io/badge/PRs-welcome-16a34a.svg)](./CONTRIBUTING.md)

[**Website**](https://mokkiebear.github.io/heatmap-tracker/) · [**Install**](#-install) · [**Quick start**](#-quick-start) · [**Configuration**](#-configuration-reference) · [**Export**](#-export-a-report) · [**FAQ**](#-faq--troubleshooting) · [**Example vault**](https://github.com/mokkiebear/heatmap-tracker/tree/main/EXAMPLE_VAULT)

</div>

<br>

<img alt="Heatmap Tracker in Obsidian" src="https://raw.githubusercontent.com/mokkiebear/heatmap-tracker/main/public/mac-mockup-dark.png">

---

## What it does

You already write things down in Obsidian. Heatmap Tracker reads those notes and turns them into a year-at-a-glance grid — the kind you know from GitHub's contribution graph, but for **your** data, in **your** vault, with no account and no cloud.

Add `steps: 8420` to a daily note and you get a heatmap. Add `mood: 4` and you get another. Every filled square is clickable and opens the note behind it; every empty square offers to create it.

- **Zero-config for frontmatter.** Run **Insert Heatmap Tracker**, fill in a form with a live preview, done — no YAML, no JavaScript. Every heatmap stays editable from the same form.
- **Fully scriptable when you need it.** A `dataviewjs` escape hatch gives you complete control over the dataset.
- **Everything stays local.** Your notes are the database.

---

## 📋 Table of contents

- [Install](#-install)
- [Quick start](#-quick-start)
- [Use cases](#-use-cases)
- [Codeblock usage](#-codeblock-usage)
- [Advanced usage (`dataviewjs`)](#-advanced-usage-dataviewjs)
- [Migrating from Heatmap Calendar](#-migrating-from-heatmap-calendar)
- [Configuration reference](#-configuration-reference)
- [Export a report](#-export-a-report)
- [Features](#-features)
- [FAQ & troubleshooting](#-faq--troubleshooting)
- [How it compares](#-how-it-compares)
- [Development](#-development)
- [Contributing](#-contributing)
- [Support the project](#-support-the-project)
- [License & credits](#-license--credits)

---

## 📥 Install

### From Obsidian (recommended)

1. Open **Settings → Community plugins** and make sure Restricted mode is **off**.
2. Click **Browse**, search for **“Heatmap Tracker”**.
3. Click **Install**, then **Enable**.

Or open this link from inside Obsidian: [**Install Heatmap Tracker**](https://obsidian.md/plugins?id=heatmap-tracker).

### Install Dataview (required)

Heatmap Tracker uses [**Dataview**](https://blacksmithgu.github.io/obsidian-dataview/) to read data out of your notes. Install and enable it the same way. For the `dataviewjs` examples below, also enable **Dataview → Settings → Enable JavaScript Queries**.

### Manual install

1. Download `main.js`, `styles.css` and `manifest.json` from the [latest release](https://github.com/mokkiebear/heatmap-tracker/releases/latest).
2. Put them in `<your-vault>/.obsidian/plugins/heatmap-tracker/`.
3. Reload Obsidian and enable the plugin in **Community plugins**.

### Beta versions via BRAT

Install [BRAT](https://github.com/TfTHacker/obsidian42-brat), then run **BRAT: Add a beta plugin for testing** and enter `mokkiebear/heatmap-tracker`.

**Requirements:** Obsidian 0.1.0+, desktop and mobile, Dataview plugin.

---

## 🚀 Quick start

**1. Put a value in a daily note.** In `2026-08-04.md`:

```yaml
---
steps: 8420
---
```

Numbers work (`steps: 8420`), and so do booleans — `meditated: true` simply counts as `1`.

**2. Add the heatmap — use the modal.** Run **`Insert Heatmap Tracker`** from the command palette, or click the Heatmap Tracker icon in the left ribbon. This is the **recommended way to use the plugin**: the form has a live preview, tells you how many notes currently match, and writes the codeblock for you. Everything beyond the essentials is tucked into collapsed sections, so you only see what you need.

<img alt="Insert Heatmap Tracker modal" src="https://github.com/user-attachments/assets/c41b5f2f-56d3-4cd3-9566-37e0390896af">

Changed your mind later? Hover any rendered heatmap and click the **pencil** in its corner — the same form reopens with that heatmap's settings and rewrites its codeblock on save. No hand-editing YAML.

If you'd rather write it by hand, the codeblock is plain YAML:

````markdown
```heatmap-tracker
property: steps
```
````

**3. That's it.** Switch years with the arrows, hover a square for details, click one to open the note.

> [!TIP]
> The [**Example Vault**](https://github.com/mokkiebear/heatmap-tracker/tree/main/EXAMPLE_VAULT) is a full working vault you can open in Obsidian — copy-pasteable examples for every parameter, plus ready-made trackers for habits, mood, sleep, water intake and projects. It's updated often.

---

## 💡 Use cases

|  | Track | Frontmatter | Why a heatmap helps |
|---|---|---|---|
| 🏃 | **Fitness** | `exercise: 45` | Spot the weeks you skipped, not just the total |
| 🧘 | **Habits** | `meditated: true` | Streaks become visible — and hard to break |
| 😴 | **Sleep** | `hours-slept: 7.5` | See the slow drift before it becomes a problem |
| 🙂 | **Mood** | `mood: 4` | Correlate bad stretches with what else was happening |
| 💰 | **Finance** | `spent: 120` | A year of spending on one screen |
| 📚 | **Reading** | `pages-read: 30` | Small daily numbers add up visibly |
| 💧 | **Water intake** | `water: 6` | Zero-effort adherence check |
| 💼 | **Work log** | `hours: 8` | Export it as a report for your manager |
| 🤕 | **Symptoms** | `headache: 3` | Bring a real timeline to your doctor |
| ✅ | **Projects** | `tasks-done: 5` | Momentum, not just a burn-down |

Every one of these has a working example in the [Example Vault](https://github.com/mokkiebear/heatmap-tracker/tree/main/EXAMPLE_VAULT/Examples).

---

## 🧩 Codeblock usage

The `heatmap-tracker` codeblock handles frontmatter tracking out of the box. The [**Insert Heatmap Tracker** modal](#-quick-start) writes and edits it for you — the reference below is for anyone who prefers typing YAML, or wants to know what the modal produces.

### Single property

````markdown
```heatmap-tracker
property: exercise
```
````

This looks for `exercise` in your notes and lights up a square wherever it's set.

### Multiple properties

````markdown
```heatmap-tracker
property: [running, cycling, swimming]
```
````

Values from all listed properties are aggregated into one heatmap.

### Narrowing down which notes count

`path`, `tags` and `filters` are all optional and can be combined:

````markdown
```heatmap-tracker
property: exercise
path: "daily notes"
tags: [journal]
filters:
  - property: status
    operator: equals
    value: done
```
````

| Parameter | Description |
|---|---|
| `property` | Frontmatter key (or array of keys) to read. **Required.** |
| `path` | Folder to search in. Unset → falls back to your Daily Notes folder, then the whole vault. |
| `tags` | Only include notes with at least one of these tags (leading `#` optional). |
| `filters` | Extra frontmatter conditions. **All** must match. |

Each `filters` entry takes:

- `property` — the frontmatter key to check.
- `operator` — `equals`, `contains`, or `notEmpty`.
- `value` — compared against the property's value (not needed for `notEmpty`).

---

## ⚙️ Advanced usage (`dataviewjs`)

When you need full control over the dataset — computed values, external sources, custom colors per entry — use a `dataviewjs` codeblock:

````javascript
```dataviewjs
// Update this object
const trackerData = {
    entries: [],
    separateMonths: true,
    heatmapTitle: "This is the title for your heatmap",
    heatmapSubtitle: "This is the subtitle for your heatmap. You can use it as a description.",
}

// Path to the folder with notes
const PATH_TO_YOUR_FOLDER = "daily notes preview/notes";
// Name of the parameter you want to see on this heatmap
const PARAMETER_NAME = 'steps';

// You need dataviewjs plugin to get information from your pages
for (let page of dv.pages(`"${PATH_TO_YOUR_FOLDER}"`).where((p) => p[PARAMETER_NAME])) {
    trackerData.entries.push({
        date: page.file.name,
        // Use absolute file path so clicks open the exact note
        // (matters when several notes share a name)
        filePath: page.file.path,
        intensity: page[PARAMETER_NAME],
    });
}

// Optional: set base path so new files are created here if missing
trackerData.basePath = PATH_TO_YOUR_FOLDER;

renderHeatmapTracker(this.container, trackerData);
```
````

### How clicking a square resolves a file

1. If the entry has `filePath` (`page.file.path`), that exact file opens. Missing? The plugin offers to create it at the same path.
2. Otherwise, if `trackerData.basePath` is set, it proposes creating/opening `basePath/YYYY-MM-DD.md`.
3. Otherwise it falls back to your **Daily Notes** settings (folder + format) via the Daily Notes API.

> [!NOTE]
> `dataviewjs` requires **Dataview → Settings → Enable JavaScript Queries**. The plugin also works standalone with any JavaScript that can build an `entries` array — Dataview is just the most convenient source.

---

## 🔁 Migrating from Heatmap Calendar

Coming from the unmaintained [heatmap-calendar](https://github.com/Richardsl/heatmap-calendar-obsidian) plugin? There is nothing to migrate:

1. Install Heatmap Tracker.
2. Disable Heatmap Calendar.

Your existing `renderHeatmapCalendar(...)` blocks keep working — Heatmap Tracker provides that function too and maps `calendarData` onto its own options. Named palettes from the old plugin's settings are read as well, so `colors: "blue"` still resolves.

Two differences worth knowing:

- Per-entry `color` is ignored. It named a whole color ramp, and which shade a day got was only decided after intensity mapping; those days now use the main palette. Use `customColor: "#ff0000"` for a fixed per-day color.
- `defaultEntryIntensity`, `intensityScaleStart` and `intensityScaleEnd` still work, but the current names are [`intensityConfig.defaultIntensity`, `.scaleStart` and `.scaleEnd`](#intensityconfig).

Rewriting a block as `renderHeatmapTracker(this.container, trackerData)` gets you the rest: statistics, legend, month/week layouts, clickable squares.

---

## 📖 Configuration reference

The authoritative reference for every `trackerData` parameter. Each one links to a copy-pasteable example in the [Example Vault](https://github.com/mokkiebear/heatmap-tracker/tree/main/EXAMPLE_VAULT/Documentation%20with%20Examples/3.%20trackerData%20parameters).

### At a glance

| Parameter | Type | Default |
|---|---|---|
| [`year`](#year) | `number` | current year |
| [`heatmapTitle`](#heatmaptitle) | `string \| number` | `undefined` |
| [`heatmapSubtitle`](#heatmapsubtitle) | `string \| number` | `undefined` |
| [`colorScheme`](#colorscheme) | `object` | `{ paletteName: "default", customColors: [] }` |
| [`entries`](#entries) | `array` | `[]` |
| [`showCurrentDayBorder`](#showcurrentdayborder) | `boolean` | `true` |
| [`intensityConfig`](#intensityconfig) | `object` | see below |
| [`basePath`](#basepath) | `string` | `undefined` |
| [`separateMonths`](#separatemonths) | `boolean` | `true` |
| [`disableFileCreation`](#disablefilecreation) | `boolean` | `false` |
| [`insights`](#insights) | `array` | `[]` |
| [`layout`](#layout) | `"default" \| "monthly" \| "month" \| "week"` | `"default"` |
| [`monthsToShow` / `daysToShow` / `startDate` + `endDate`](#date-range-monthstoshow-daystoshow-startdateenddate) | `number` / `string` | `undefined` |

<br>

### `year`

- **Type:** `number`
- **Default:** Current year (`new Date().getFullYear()`)
- **Description:** The year the heatmap displays by default.
- **Example:** [year](https://github.com/mokkiebear/heatmap-tracker/blob/main/EXAMPLE_VAULT/Documentation%20with%20Examples/3.%20trackerData%20parameters/3.%20year.md)

---

### `heatmapTitle`

- **Type:** `string | number`
- **Default:** `undefined`
- **Description:** Title displayed above the heatmap. Supports HTML for custom styling.
- **Example:** [heatmapTitle](https://github.com/mokkiebear/heatmap-tracker/blob/main/EXAMPLE_VAULT/Documentation%20with%20Examples/3.%20trackerData%20parameters/1.%20heatmapTitle.md)

---

### `heatmapSubtitle`

- **Type:** `string | number`
- **Default:** `undefined`
- **Description:** Subtitle/description displayed under the title. Supports HTML for custom styling.
- **Example:** [heatmapSubtitle](https://github.com/mokkiebear/heatmap-tracker/blob/main/EXAMPLE_VAULT/Documentation%20with%20Examples/3.%20trackerData%20parameters/2.%20heatmapSubtitle%20(Description).md)

---

### `colorScheme`

- **Type:** `object`
- **Default:**

```js
{
  paletteName: "default",
  customColors: []
}
```

- **Description:** The color scale used to represent intensity levels. Each color maps to a range of data intensity. Use `paletteName` to reference a palette defined in plugin settings, or `customColors` to pass your own array of colors inline.
- **Example:** [colorScheme](https://github.com/mokkiebear/heatmap-tracker/blob/main/EXAMPLE_VAULT/Documentation%20with%20Examples/3.%20trackerData%20parameters/10.%20colorScheme.md)

---

### `customColor`

- **Type:** `string`
- **Default:** `undefined`
- **Description:** An **entry** property (set on an item inside `entries`, not on `trackerData` itself). Sets the color for that specific entry, overriding `colorScheme`.

---

### `entries`

- **Type:** `array`
- **Default:**

```js
[
  { date: "1900-01-01", customColor: "#7bc96f", intensity: 5, content: "" }
]
```

- **Description:** The list of data points. Each entry supports:

| Field | Description |
|---|---|
| `date` | Date of the entry (ISO string, `YYYY-MM-DD` — see [Accepted date formats](#accepted-date-formats)) |
| `intensity` | Data intensity for that date |
| `content` | Optional tooltip / note text |
| `customColor` | Overrides the color for this entry |
| `emoji` | A short glyph drawn inside the box, e.g. `"✅"` (max 8 chars) — see [Emoji habit tracking](#emoji-habit-tracking) |
| `filePath` | Absolute path to the file opened on click |
| `customHref` | Custom URL to open on click (takes precedence over `filePath`) |

- **Example:** [entries](https://github.com/mokkiebear/heatmap-tracker/blob/main/EXAMPLE_VAULT/Documentation%20with%20Examples/3.%20trackerData%20parameters/11.%20entries.md)

#### Accepted date formats

`date` is parsed by the plugin itself, so a note renders identically on desktop,
iOS and Android. Accepted:

| Format | Example |
|---|---|
| `YYYY-MM-DD` / `YYYY/M/D` (**recommended**) | `2025-01-31` |
| ISO timestamp — the calendar date wins, any time or offset is ignored | `2025-01-31T23:59:59-05:00` |
| Month-first numeric, year last | `01-31-2025`, `1/31/2025`, `01.31.2025` |
| Day-first numeric, when the first number can't be a month | `31-01-2025` |
| English month names | `Jan 31, 2025`, `31 January 2025` |

Anything else (`March 2025`, `31.01.25`, a raw `Date` object) is rejected and the
entry is dropped. Prefer `YYYY-MM-DD`: `01-02-2025` is read as January 2nd, which
is not what a European reader means by it.

#### Emoji habit tracking

Set `emoji` on an entry to draw a glyph inside that day's box. The box keeps its
palette color, so "which habit" and "how much" are readable at the same time —
useful for yes/no habits where a color gradient says little.

```dataviewjs
const trackerData = {
  entries: [],
  heatmapTitle: "Habits",
  colorScheme: { customColors: ["#c6e48b", "#7bc96f", "#239a3b"] },
};

for (const page of dv.pages('"Daily"').where(p => p.workout || p.reading)) {
  trackerData.entries.push({
    date: page.file.name,
    intensity: 1,
    emoji: page.workout ? "🏃" : "📖",
    filePath: page.file.path,
  });
}

renderHeatmapTracker(this.container, trackerData);
```

Notes:

- **Keep it to one glyph.** The box is 12px by default, so the value is capped
  at 8 characters and validation rejects longer strings rather than drawing
  unreadable pixels. Use `content` for text.
- **`emoji` and `content` are different fields, and complement each other.**
  `emoji` is the marker; `content` is what happened that day. Only `content`
  reaches the exported report and screen readers, so a glyph put in `content`
  becomes a lone "✅" in your report, while an `emoji` leaves the report free
  for the real note text:

  ```js
  { date: "2025-01-01", emoji: "🏃", content: "5km, felt good" }
  // box shows 🏃 · report says "5km, felt good"
  ```

- **Two entries on one day:** only one glyph fits, so the first `emoji` set for
  that day is the one drawn.
- Any text works, not just emoji — `"✓"`, `"x"` and `"1"` are all valid, and
  monochrome glyphs get a subtle outline so they stay legible on dark palette
  colors.
- The glyph is decorative: screen readers announce the date and value from the
  box's own label and skip it.

---

### `showCurrentDayBorder`

- **Type:** `boolean`
- **Default:** `true`
- **Description:** Highlights today's square with a border.
- **Example:** [showCurrentDayBorder](https://github.com/mokkiebear/heatmap-tracker/blob/main/EXAMPLE_VAULT/Documentation%20with%20Examples/3.%20trackerData%20parameters/5.%20showCurrentDayBorder.md)

---

### `intensityConfig`

- **Type:** `object`
- **Default:**

```js
{
  scaleStart: undefined,
  scaleEnd: undefined,
  defaultIntensity: 4,
  showOutOfRange: true,
  excludeFalsy: undefined
}
```

- **Description:** Configures how entry values map to colors.

| Field | Description |
|---|---|
| `scaleStart` / `scaleEnd` | Min/max of the intensity scale. Useful for a custom range — e.g. tracking reading time only between 30 minutes and 2 hours. |
| `defaultIntensity` | Intensity assigned to entries that don't specify one. |
| `showOutOfRange` | Whether entries outside the scale are still shown (clamped) or hidden. |
| `excludeFalsy` | When `true`, entries with falsy intensity (`0`, `undefined`, `null`, `false`) are excluded and don't break streaks. |

- **Example:** [intensityConfig](https://github.com/mokkiebear/heatmap-tracker/blob/main/EXAMPLE_VAULT/Documentation%20with%20Examples/3.%20trackerData%20parameters/9.%20intensityConfig.md)

> [!IMPORTANT]
> **Migrating from `defaultEntryIntensity` / `intensityScaleStart` / `intensityScaleEnd`:** these top-level parameters are removed from the API described here. Old codeblocks keep working (they're folded into `intensityConfig` automatically), but new heatmaps should use `intensityConfig` directly.

---

### `basePath`

- **Type:** `string`
- **Default:** `undefined`
- **Description:** Base folder used to collect entries. When set, the plugin proposes creating new files here when you click an empty square.
- **Example:** [basePath](https://github.com/mokkiebear/heatmap-tracker/blob/main/EXAMPLE_VAULT/Documentation%20with%20Examples/3.%20trackerData%20parameters/8.%20basePath.md)

---

### `separateMonths`

- **Type:** `boolean`
- **Default:** `true`
- **Description:** Whether months are visually separated within the heatmap layout.
- **Example:** [separateMonths](https://github.com/mokkiebear/heatmap-tracker/blob/main/EXAMPLE_VAULT/Documentation%20with%20Examples/3.%20trackerData%20parameters/4.%20separateMonths.md)

---

### `disableFileCreation`

- **Type:** `boolean`
- **Default:** `false`
- **Description:** When `true`, clicking an empty square will not offer to create a new file.
- **Example:** [disableFileCreation](https://github.com/mokkiebear/heatmap-tracker/blob/main/EXAMPLE_VAULT/Documentation%20with%20Examples/3.%20trackerData%20parameters/7.%20disableFileCreation.md)

---

### `insights`

- **Type:** `array`
- **Default:** `[]`
- **Description:** Define your own calculated metrics, displayed in the **Statistics** tab — most productive day, longest streak, total pages read, average sleep, and anything else you can compute.
- **Example:** [insights](https://github.com/mokkiebear/heatmap-tracker/blob/main/EXAMPLE_VAULT/Documentation%20with%20Examples/3.%20trackerData%20parameters/6.%20insights.md) · [8 ready-made insights](https://github.com/mokkiebear/heatmap-tracker/tree/main/EXAMPLE_VAULT/Documentation%20with%20Examples/4.%20Insights)

---

### `layout`

- **Type:** `"default" | "monthly" | "month" | "week"`
- **Default:** `"default"`
- **Description:** Controls the grid arrangement.
  - `"default"` — the traditional GitHub-style week-column grid.
  - `"monthly"` — one row per month with days 1–31 as columns; a compact, calendar-style year.
  - `"month"` — a single calendar month: weekdays as columns, weeks as rows. Shows the current month by default; the header arrows page through months.
  - `"week"` — a single calendar week: one row of seven days. Shows the current week by default; the header arrows page through weeks.

  `"month"` and `"week"` respect the `weekStartDay` plugin setting. Setting a date range (`startDate`/`endDate`, `daysToShow`, `monthsToShow`) pins them to that range and hides the arrows.
- **Example:** [layout](https://github.com/mokkiebear/heatmap-tracker/blob/main/EXAMPLE_VAULT/Documentation%20with%20Examples/3.%20trackerData%20parameters/12.%20layout.md)

---

### Date range: `monthsToShow`, `daysToShow`, `startDate`/`endDate`

These four parameters narrow which dates are displayed instead of the full `year`. Only one wins when several are set — they resolve in this order (highest priority first):

1. **`monthsToShow`** (`number`, default `undefined`) — current month plus the N previous months. `monthsToShow: 3` displays 4 rows (current month + 3 prior). Best paired with `layout: "monthly"`.
2. **`daysToShow`** (`number`, default `undefined`) — the last N days ending today.
3. **`startDate`** + **`endDate`** (`string`, `YYYY-MM-DD`, default `undefined`) — an explicit range. Both must be set, and `startDate` must not be after `endDate`.

If none are set, the heatmap shows the full `year`.

This precedence is implemented once, in [`resolveDateRange`](https://github.com/mokkiebear/heatmap-tracker/blob/main/src/utils/date.ts) — that function's doc comment is the source of truth if this section and the code ever disagree.

- **Example:** [Date range parameters](https://github.com/mokkiebear/heatmap-tracker/blob/main/EXAMPLE_VAULT/Documentation%20with%20Examples/3.%20trackerData%20parameters/13.%20dateRange.md)

---

## 📤 Export a report

Every heatmap has an **Export** tab alongside Heatmap Tracker / Statistics / Legend / Documentation. It turns your tracked data and daily notes into a single shareable report — a status update, a work log for a manager, an end-of-year summary — sitting between a bare calendar (too little context) and a folder of raw notes (too much noise).

<img alt="Exported heatmap report" src="https://raw.githubusercontent.com/mokkiebear/heatmap-tracker/main/public/two-mac-mockup.png">

**Note content, aggregated.** Below the calendar and legend, the report walks every week and day in range and pulls in that day's own note content — frontmatter stripped, bullet points kept as written, a day with no note showing `-` — grouped under "Week of …" and per-day headings. The reader gets everything that actually happened, day by day, in one document instead of clicking through each note.

**Layout.** "Weeks as columns" or "Weeks as rows", rendered pixel-for-pixel like the heatmap itself — including exact day-level month splitting (with a year label whenever the range crosses a year boundary) and, when a range is too wide or tall for one grid, automatic wrapping into multiple bands, evenly split rather than front-loading one band and leaving a small leftover.

**Date range.** Pick start/end dates directly, or jump to a range with a preset: Logged (the full span of your tracked data), Last year, Year to date, Last month, or Month to date.

**Display options.** Which day the week starts on, whether to show each week's start date, splitting the grid by month, month labels, and hiding weekends.

**Legend editor.** Colors are pre-populated from what's actually used in your data, so you only fill in what each one means. Reorder entries by drag-and-drop and toggle each category's visibility — shown everywhere, summary-only, or hidden entirely. Optionally combine the intensity colors into a single gradient swatch with one shared label and count, instead of a row per color.

**Summary line.** A compact, customizable breakdown like `Workday: 22 · Leave: 1 · Rest day but worked: 1` with a total (e.g. `Total hours: 169`) — or hide the breakdown, the total, or all values entirely.

**Output.** Save as a Markdown note or a self-contained HTML file, to whichever folder in your vault you choose.

All of these preferences persist across sessions, so you only set them up once.

---

## 📦 Features

<details>
<summary><b>Create and edit without writing YAML</b> — the recommended way to use the plugin</summary>
<br>
<b>Insert Heatmap Tracker</b> (command palette or ribbon icon) opens a form with a live preview of the actual heatmap and a count of how many notes currently match your property, folder and tags — so a misspelled property name is obvious immediately rather than looking like an empty year.

Only the essentials are shown up front (properties to track, folder, title); filtering, layout, appearance, intensity and visibility live in collapsed sections.

Every rendered heatmap has a pencil button in its corner: it reopens the same form pre-filled from that codeblock and rewrites it on save.
</details>

<details>
<summary><b>Easy switching between years</b> — render a dynamic heatmap for any year</summary>
<br>
Left and right navigation arrows let you move across years effortlessly, so multi-year data is always one click away.
</details>

<details>
<summary><b>Customizable colors and intensity</b> — match the heatmap to your data's meaning</summary>
<br>
Three levels of control, from broad to specific:

1. Create your own palette in plugin settings (or use the default).
2. Use `customColors` in `colorScheme` to set colors for one specific heatmap.
3. Use `customColor` on an individual entry.

<img width="552" alt="Color palette settings" src="https://github.com/user-attachments/assets/48df34d5-66f3-478b-bc87-83b0b061aeec">
</details>

<details>
<summary><b>User-defined insights</b> — analyze data in the ways that matter to you</summary>
<br>
Define metrics like:

- The most productive day
- The longest streak without breaks
- The most active month
- Your average daily intensity

See [insights documentation](https://github.com/mokkiebear/heatmap-tracker/blob/main/EXAMPLE_VAULT/Documentation%20with%20Examples/3.%20trackerData%20parameters/6.%20insights.md) and [8 worked examples](https://github.com/mokkiebear/heatmap-tracker/tree/main/EXAMPLE_VAULT/Documentation%20with%20Examples/4.%20Insights).
</details>

<details>
<summary><b>Monthly separation</b> — visually separate months for better clarity</summary>
<br>
Toggle <code>separateMonths</code> to add padding between months so month boundaries are unmistakable.
</details>

<details>
<summary><b>Monthly layout</b> — a compact calendar with one row per month</summary>
<br>
Set <code>layout: "monthly"</code> to switch from the GitHub-style grid to a calendar-style view with days 1–31 as columns. Combine with <code>monthsToShow</code> to display only recent months.
</details>

<details>
<summary><b>Single month or week</b> — a wall-calendar view of the current period</summary>
<br>
Set <code>layout: "month"</code> for one calendar month (weekdays as columns, weeks as rows) or <code>layout: "week"</code> for a single row of seven days. Both start on the current period and the header arrows page through it.
</details>

<details>
<summary><b>Statistics view</b> — track progress with an integrated statistics panel</summary>
<br>
Totals, streaks and your own custom insights, in a dedicated tab next to the heatmap.
</details>

<details>
<summary><b>Export a report</b> — turn tracked data and notes into shareable Markdown or HTML</summary>
<br>
The <b>Export</b> tab renders a grid matching your heatmap exactly, then aggregates each day's note content underneath it, grouped by week — plus a customizable legend, summary line, and date-range presets. See <a href="#-export-a-report">Export a report</a>.
</details>

<details>
<summary><b>Localization</b> — available in 9 languages</summary>
<br>
English, German, Russian, Chinese, Hindi, Spanish, French, Portuguese and Polish. See <a href="https://github.com/mokkiebear/heatmap-tracker/tree/main/src/localization/locales">src/localization/locales</a> for the current list, and <a href="./docs/add-new-language.md">docs/add-new-language.md</a> if you'd like to contribute a translation.
</details>

<details>
<summary><b>Week numbers</b> — display week numbers alongside the heatmap</summary>
<br>
Show all weeks, only even, only odd, or none — configurable in plugin settings.
</details>

<details>
<summary><b>Insert Heatmap Tracker command</b> — add a tracker without writing YAML</summary>
<br>
An interactive modal builds the codeblock for you and inserts it at the cursor.
</details>

<details>
<summary><b>Customizable font</b> — use your favorite typeface</summary>
<br>
Set the font in plugin settings, and use <code>HTML</code> in titles and subtitles for further styling.

<img width="400" alt="Font customization" src="https://github.com/user-attachments/assets/09f79cbe-45e8-477e-8111-631f34b98cdb">
</details>

<img alt="Heatmap Tracker overview" src="https://raw.githubusercontent.com/mokkiebear/heatmap-tracker/main/public/tracker-overview.png">

---

## ❓ FAQ & troubleshooting

<details>
<summary><b>My heatmap is empty / nothing renders</b></summary>
<br>

Work through these in order:

1. **Is Dataview installed and enabled?** Heatmap Tracker reads your notes through Dataview. Without it, there's no data to draw.
2. **Does the property actually exist in your notes?** Property names are case-sensitive. `photo-taking` and `Photo-Taking` are different keys.
3. **Are your notes in the searched folder?** Without `path`, the plugin falls back to your Daily Notes folder. If your notes live elsewhere, set `path` explicitly.
4. **Is the year right?** The heatmap defaults to the current year. If your data is from last year, use the arrows or set `year`.
5. **Check the console.** `Ctrl+Shift+I` (Windows/Linux) or `Cmd+Option+I` (Mac) opens devtools — a missing `property` parameter logs a warning there.
</details>

<details>
<summary><b>My <code>dataviewjs</code> block does nothing</b></summary>
<br>

JavaScript queries are off by default. Enable **Dataview → Settings → Enable JavaScript Queries**, then reload the note.
</details>

<details>
<summary><b>Dates are off by one day</b></summary>
<br>

This is almost always a timezone issue with how dates are parsed. Use plain `YYYY-MM-DD` strings for `date` rather than JavaScript `Date` objects or full ISO timestamps with a time component. If you're pulling from `page.file.name` on daily notes named `YYYY-MM-DD.md`, you're already doing the right thing.
</details>

<details>
<summary><b>The heatmap looks different on my phone than on my desktop</b></summary>
<br>

The plugin renders from the same data on every platform, so a difference almost always means some entries are being dropped on one of them — check the `date` format against [Accepted date formats](#accepted-date-formats), and switch to `YYYY-MM-DD` if you're using anything else.

Historically this was the cause of [#29](https://github.com/mokkiebear/heatmap-tracker/issues/29): dates were handed to the JavaScript engine's own parser, which accepts different formats on desktop (Electron/V8) and on iOS (WebKit/JavaScriptCore), so `01-31-2025` worked on a Mac and silently produced an empty heatmap on an iPhone. Dates are now parsed by the plugin itself and behave the same everywhere.

Still different after fixing the format? Please [open an issue](https://github.com/mokkiebear/heatmap-tracker/issues) with your codeblock and the Obsidian version on both devices.
</details>

<details>
<summary><b>Clicking a square opens the wrong note</b></summary>
<br>

If several notes share a filename, pass an absolute path so there's no ambiguity:

```js
filePath: page.file.path   // not page.file.name
```
</details>

<details>
<summary><b>Clicking an empty square asks to create a file, and I don't want that</b></summary>
<br>

Set <code>disableFileCreation: true</code> on your <code>trackerData</code>.
</details>

<details>
<summary><b>Boolean properties — how are they counted?</b></summary>
<br>

`true` counts as `1`, so `meditated: true` gives you a filled square. `false` counts as `0`; combine with <code>intensityConfig.excludeFalsy: true</code> if you want those days treated as untracked rather than as zero.
</details>

<details>
<summary><b>Can I show several properties in one heatmap?</b></summary>
<br>

Yes — pass an array: <code>property: [running, cycling, swimming]</code>. Values are aggregated.
</details>

<details>
<summary><b>All my squares are the same color</b></summary>
<br>

Your values probably fall into a single bucket of the intensity scale. Set <code>intensityConfig.scaleStart</code> and <code>scaleEnd</code> to bracket the range you actually care about — e.g. `scaleStart: 30, scaleEnd: 120` for reading minutes.
</details>

<details>
<summary><b>Does this work on mobile?</b></summary>
<br>

Yes. The plugin is not desktop-only and works on Obsidian mobile.
</details>

<details>
<summary><b>Does my data leave my vault?</b></summary>
<br>

No. Everything is computed locally from your notes. There's no account, no sync, no telemetry.
</details>

<details>
<summary><b>Can I use it without Dataview?</b></summary>
<br>

The `heatmap-tracker` codeblock needs Dataview. But `renderHeatmapTracker(container, trackerData)` accepts any `entries` array, so any JavaScript that can build that array works — Dataview is simply the most convenient source.
</details>

Still stuck? [Open an issue](https://github.com/mokkiebear/heatmap-tracker/issues/new/choose) — include your codeblock, a sample note's frontmatter, and your Obsidian and plugin versions.

---

## 🔍 How it compares

Heatmap Tracker began as a rewrite of the excellent [heatmap-calendar-obsidian](https://github.com/Richardsl/heatmap-calendar-obsidian) by Richardsl, and grew from there.

| | Heatmap Tracker | heatmap-calendar-obsidian |
|---|---|---|
| Codeblock without JavaScript | ✅ `heatmap-tracker` block | ❌ `dataviewjs` required |
| Interactive insert command | ✅ Modal builder | ❌ |
| Statistics & custom insights | ✅ | ❌ |
| Monthly (calendar) layout | ✅ | ❌ |
| Single month / week view | ✅ | ❌ |
| Flexible date ranges | ✅ Days, months, explicit range | ❌ Full year |
| Export to Markdown / HTML | ✅ | ❌ |
| Localization | ✅ 9 languages | ❌ |
| Click to open **and create** notes | ✅ | Partial |
| Actively maintained | ✅ | Limited |

If all you need is a one-year contribution grid from a `dataviewjs` script, the original is lighter. If you want tracking, statistics, reports and a no-code path, this is the one.

---

## 🗺️ What's planned

Have an idea? [Open an issue](https://github.com/mokkiebear/heatmap-tracker/issues/new/choose) — feature requests genuinely shape this project.

---

## 🛠️ Development

New to the codebase? [**ARCHITECTURE.md**](./ARCHITECTURE.md) maps how data flows from a codeblock or `dataviewjs` script through to the rendered heatmap.

```bash
git clone https://github.com/mokkiebear/heatmap-tracker.git
cd heatmap-tracker
npm install
npm run dev
```

`npm run dev` starts the TS→JS transpiler and copies the generated JS/CSS/manifest into the example vault whenever they change. The [hot-reload plugin](https://github.com/pjeby/hot-reload) — already installed in `EXAMPLE_VAULT` — then reloads Obsidian automatically, so you don't restart after every change.

> If hot-reload isn't picking up changes, add an empty `.hotreload` file to `EXAMPLE_VAULT/.obsidian/plugins/heatmap-tracker/`.

### Useful scripts

| Command | What it does |
|---|---|
| `npm run dev` | Watch mode + copy into the example vault |
| `npm run build` | Production build, ready for distribution |
| `npm test` | Run the Jest test suite |
| `npm run test:coverage` | Tests with a coverage report |
| `npm run test:utc` / `test:usa` | Run tests under specific timezones |
| `npm run lint` / `lint:fix` | ESLint |
| `npm run type-check` | TypeScript, no emit |
| `npm run format` / `format:check` | Prettier |

**Stack:** TypeScript · Preact · esbuild · Jest · Zod

**Tip:** `Ctrl+Shift+I` opens devtools inside Obsidian.

Further reading: [style guide](./docs/style-guide.md) · [adding a language](./docs/add-new-language.md) · [releasing](./RELEASING.md)

---

## 🤝 Contributing

Contributions are welcome and appreciated — code, docs, translations, bug reports, or just telling me how you use it.

- 🐛 [Report a bug](https://github.com/mokkiebear/heatmap-tracker/issues/new/choose)
- 💡 [Request a feature](https://github.com/mokkiebear/heatmap-tracker/issues/new/choose)
- 🌍 [Add a translation](./docs/add-new-language.md) — a single JSON file
- 📖 Improve the docs or the [Example Vault](https://github.com/mokkiebear/heatmap-tracker/tree/main/EXAMPLE_VAULT)
- 🔧 [Open a pull request](https://github.com/mokkiebear/heatmap-tracker/pulls)

Read [**CONTRIBUTING.md**](./CONTRIBUTING.md) before you start, and note that this project ships a [Code of Conduct](./CODE_OF_CONDUCT.md). Security issues go through [SECURITY.md](./SECURITY.md).

---

## ❤️ Support the project

Heatmap Tracker is free and open source, built and maintained in my own time. If it's useful to you, the cheapest way to help is a ⭐ on the repo — it's how other people find the plugin.

<a href="https://www.buymeacoffee.com/mrubanau" target="_blank"><img src="https://cdn.buymeacoffee.com/buttons/v2/default-yellow.png" alt="Buy Me A Coffee" height="42"></a>
&nbsp;
<a href="https://ko-fi.com/mrubanau" target="_blank"><img src="https://ko-fi.com/img/githubbutton_sm.svg" alt="Support me on Ko-fi" height="42"></a>

---

## 📄 License & credits

Licensed under the [Apache License 2.0](./LICENSE).

Built by [**Maksim Rubanau**](https://github.com/mokkiebear) and [contributors](https://github.com/mokkiebear/heatmap-tracker/graphs/contributors).

Inspired by [heatmap-calendar-obsidian](https://github.com/Richardsl/heatmap-calendar-obsidian) by Richardsl. Powered by [Obsidian Dataview](https://blacksmithgu.github.io/obsidian-dataview/).

<div align="center">
<br>

**[⬆ Back to top](#-table-of-contents)**

<sub>If Heatmap Tracker helps you keep a streak alive, consider starring the repo.</sub>

</div>
