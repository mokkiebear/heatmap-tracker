# Heatmap Tracker plugin for Obsidian

<img alt="Heatmap Tracker Plugin" src="https://github.com/user-attachments/assets/f40766da-4e5e-4ee6-829a-4648d35892f7" />


<a href="https://www.buymeacoffee.com/mrubanau" target="_blank"><img src="https://cdn.buymeacoffee.com/buttons/v2/default-yellow.png" alt="Buy Me A Coffee" style="height: 42px !important;width: 150px !important;" ></a>

[![ko-fi](https://ko-fi.com/img/githubbutton_sm.svg)](https://ko-fi.com/X8X11E578R)

The **Heatmap Tracker plugin for Obsidian** is a powerful and customizable tool designed to help you **track, visualize, and analyze data** over a calendar year. Perfect for habit tracking, project management, personal development, or any kind of data visualization, this plugin enables you to create beautiful, interactive heatmaps directly within Obsidian. Whether you’re **monitoring progress, visualizing trends, or staying on top of daily goals**, the Heatmap Tracker enhances your productivity and organization. Discover its intuitive features, flexible customization options, and seamless integration with Obsidian in the detailed guide below.

> **Tip:** Check [Example Vault](https://github.com/mokkiebear/heatmap-tracker/tree/main/EXAMPLE_VAULT). There're lots of good examples (and I update it often).

## Prerequisites

This plugin requires the [Obsidian Dataview](https://blacksmithgu.github.io/obsidian-dataview/) plugin to be installed and enabled to automatically fetch data from your notes.

## Getting Started

1.  **Install Dataview**: Ensure the Dataview plugin is active in your Obsidian vault.
2.  **Add Data to Daily Notes**: Add a frontmatter property to your daily notes (e.g., `YYYY-MM-DD.md`) that you want to track.
    *   **Numeric**: `photo-taking: 10`
    *   **Boolean**: `photo-taking: true` (counts as 1)
3.  **Insert Heatmap**: Use the command `Insert Heatmap Tracker` to generate a heatmap through the interactive modal.

## Basic Usage

This plugin comes with frontmatter tracking out of the box. You can use the `heatmap-tracker` codeblock with the following parameters:

````
```heatmap-tracker
property: <frontmatter_property_key>
```
````

This will look for `frontmatter_property_key` in your daily notes and activate a spot on the heatmap wherever that property is set.

You can also use an array of property names as such:

````
```heatmap-tracker
property: [<frontmatter_property_key_1>, <frontmatter_property_key_2>, ...]
```
````

This will aggregate the values of all specified properties on the heatmap.

You can narrow down which notes are included with `path`, `tags`, and `filters` — all optional, and all can be combined:

````
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

- `path`: folder to search in. Leave unset to search the whole vault.
- `tags`: only include notes with at least one of these tags (the leading `#` is optional).
- `filters`: additional frontmatter conditions a note must satisfy — **all** conditions must match. Each entry has:
  - `property`: the frontmatter key to check.
  - `operator`: `equals`, `contains`, or `notEmpty`.
  - `value`: compared against `property`'s value (ignored, and not required, for `notEmpty`).

## Basic Usage 2.0
You can add a heatmap tracker using command: `Insert Heatmap Tracker`. This is the easiest way to get started.

<img alt="Modal to insert Heatmap Tracker to the note" src="https://github.com/user-attachments/assets/c41b5f2f-56d3-4cd3-9566-37e0390896af" />


## Advanced Usage

If you want something more involved, you may use a `dataviewjs` codeblock as such (update `trackerData` with your own dataset to visualize custom data points):

````javascript
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
for(let page of dv.pages(`"${PATH_TO_YOUR_FOLDER}"`).where((p) => p[PARAMETER_NAME])){
    trackerData.entries.push({
        date: page.file.name,
        // Use absolute file path so clicks open the exact note (for cases when you have multiple notes with the same name)
        filePath: page.file.path,
        intensity: page[PARAMETER_NAME],
    });
}

// Optional: set base path so new files are created here if missing
trackerData.basePath = PATH_TO_YOUR_FOLDER;

renderHeatmapTracker(this.container, trackerData);
````

Notes
- If you provide `filePath` for each entry (`page.file.path`), clicking a heatmap box opens that exact file. If the file is missing, the plugin offers to create it at the same path.
- If `filePath` is not set on a box but `trackerData.basePath` is provided, the plugin proposes creating/opening `trackerData.basePath/YYYY-MM-DD.md`.
- If neither is available, it falls back to the Daily Notes settings (folder/format) via the Daily Notes API.

## Tracker Settings Documentation

This section is the authoritative reference for every `trackerData` parameter. [EXAMPLE_VAULT](https://github.com/mokkiebear/heatmap-tracker/tree/main/EXAMPLE_VAULT/Documentation%20with%20Examples/3.%20trackerData%20parameters) has copy-pasteable `dataviewjs` examples for each one — each parameter below links to its example.

### `year`
- **Type:** `number`
- **Default:** Current year (`new Date().getFullYear()`)
- **Description:** Specifies the year for which the heatmap should display data by default.
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
```
{
  "paletteName": "default",
  "customColors": []
}
```
- **Description:** Defines the color scale used for representing different intensity levels in the heatmap. Each color corresponds to a specific range of data intensity. Use `paletteName` to reference a palette from plugin settings, or `customColors` to provide your own array of colors inline.
- **Example:** [colorScheme](https://github.com/mokkiebear/heatmap-tracker/blob/main/EXAMPLE_VAULT/Documentation%20with%20Examples/3.%20trackerData%20parameters/10.%20colorScheme.md)

---

### `customColor`
- **Type:** `string`
- **Default:** `undefined`
- **Description:** Entry property (set on an item inside `entries`, not on `trackerData` itself). Sets the color for that specific entry, overriding `colorScheme`.

---

### `entries`
- **Type:** `array`
- **Default:**
```
[
  { "date": "1900-01-01", "customColor": "#7bc96f", "intensity": 5, "content": "" }
]
```
- **Description:** A list of data entries for the heatmap. Each entry includes:
  - `date`: The date of the entry (ISO string format).
  - `intensity`: The data intensity for that date.
  - `content`: Optional tooltip or note associated with the date.
  - `customColor`: Overrides the color for that entry.
  - `filePath`: Absolute path to the file to open when clicked.
  - `customHref`: Custom URL to open when clicked (takes precedence over `filePath`).
- **Example:** [entries](https://github.com/mokkiebear/heatmap-tracker/blob/main/EXAMPLE_VAULT/Documentation%20with%20Examples/3.%20trackerData%20parameters/11.%20entries.md)

---

### `showCurrentDayBorder`
- **Type:** `boolean`
- **Default:** `true`
- **Description:** Indicates whether the current day should be highlighted with a border on the heatmap.
- **Example:** [showCurrentDayBorder](https://github.com/mokkiebear/heatmap-tracker/blob/main/EXAMPLE_VAULT/Documentation%20with%20Examples/3.%20trackerData%20parameters/5.%20showCurrentDayBorder.md)

---

### `intensityConfig`
- **Type:** `object`
- **Default:**
```
{
  "scaleStart": undefined,
  "scaleEnd": undefined,
  "defaultIntensity": 4,
  "showOutOfRange": true,
  "excludeFalsy": undefined
}
```
- **Description:** Configures the intensity scale used to map entry values to colors.
  - `scaleStart` / `scaleEnd`: The minimum/maximum values of the intensity scale. Useful for a custom range, e.g. tracking reading time only between 30 minutes and 2 hours.
  - `defaultIntensity`: Intensity assigned to entries that don't specify one.
  - `showOutOfRange`: Whether entries outside `scaleStart`/`scaleEnd` are still shown (clamped) or hidden.
  - `excludeFalsy`: When `true`, entries with falsy intensity (`0`, `undefined`, `null`, `false`) are excluded from the heatmap and don't break streaks.
- **Example:** [intensityConfig](https://github.com/mokkiebear/heatmap-tracker/blob/main/EXAMPLE_VAULT/Documentation%20with%20Examples/3.%20trackerData%20parameters/9.%20intensityConfig.md)

> **Migrating from `defaultEntryIntensity`/`intensityScaleStart`/`intensityScaleEnd`:** these top-level parameters are removed as of the API described here. Old codeblocks using them keep working (they're folded into `intensityConfig` automatically), but new heatmaps should use `intensityConfig` directly.

---

### `basePath`
- **Type:** `string`
- **Default:** `undefined`
- **Description:** Base folder used to collect entries. If set, the plugin will propose creating new files in this folder when clicking on empty heatmap boxes.
- **Example:** [basePath](https://github.com/mokkiebear/heatmap-tracker/blob/main/EXAMPLE_VAULT/Documentation%20with%20Examples/3.%20trackerData%20parameters/8.%20basePath.md)

---

### `separateMonths`
- **Type:** `boolean`
- **Default:** `true`
- **Description:** Determines whether months should be visually separated within the heatmap layout.
- **Example:** [separateMonths](https://github.com/mokkiebear/heatmap-tracker/blob/main/EXAMPLE_VAULT/Documentation%20with%20Examples/3.%20trackerData%20parameters/4.%20separateMonths.md)

---

### `disableFileCreation`
- **Type:** `boolean`
- **Default:** `false`
- **Description:** When `true`, clicking an empty heatmap box will not offer to create a new file.
- **Example:** [disableFileCreation](https://github.com/mokkiebear/heatmap-tracker/blob/main/EXAMPLE_VAULT/Documentation%20with%20Examples/3.%20trackerData%20parameters/7.%20disableFileCreation.md)

---

### `insights`
- **Type:** `array`
- **Default:** `[]`
- **Description:** Powerful property for calculating and displaying your own insights in `Statistics`.
- **Example:** [insights](https://github.com/mokkiebear/heatmap-tracker/blob/main/EXAMPLE_VAULT/Documentation%20with%20Examples/3.%20trackerData%20parameters/6.%20insights.md)

---

### `layout`
- **Type:** `"default" | "monthly"`
- **Default:** `"default"`
- **Description:** Controls the heatmap grid arrangement. `"default"` renders the traditional GitHub-style week-column grid. `"monthly"` renders one row per month with days 1–31 as columns, providing a compact calendar-style view.
- **Example:** [layout](https://github.com/mokkiebear/heatmap-tracker/blob/main/EXAMPLE_VAULT/Documentation%20with%20Examples/3.%20trackerData%20parameters/12.%20layout.md)

---

### Date range: `monthsToShow`, `daysToShow`, `startDate`/`endDate`

These four parameters all narrow which dates the heatmap displays instead of the full `year`. Only one wins when several are set — they're resolved in this order (highest priority first):

1. **`monthsToShow`** (`number`, default `undefined`) — current month plus the N previous months. `monthsToShow: 3` displays 4 rows (current month + 3 prior). Best used with `layout: "monthly"`.
2. **`daysToShow`** (`number`, default `undefined`) — the last N days ending today.
3. **`startDate`** + **`endDate`** (`string`, format `YYYY-MM-DD`, default `undefined`) — an explicit range. Both must be set, and `startDate` must not be after `endDate`.

If none of these are set, the heatmap falls back to showing the full `year`. This precedence is implemented once, in [`resolveDateRange`](https://github.com/mokkiebear/heatmap-tracker/blob/main/src/utils/date.ts) — that function's doc comment is the source of truth if this section and the code ever disagree.

- **Example:** [Date Range Parameters](https://github.com/mokkiebear/heatmap-tracker/blob/main/EXAMPLE_VAULT/Documentation%20with%20Examples/3.%20trackerData%20parameters/13.%20dateRange.md)

## Exporting a Report

Every heatmap has an **Export** tab alongside Heatmap Tracker / Statistics / Legend / Documentation. It turns your tracked data and daily notes into a single shareable report — a status update, a work log for a manager, an end-of-year summary — sitting between a bare calendar (too little context) and a folder of raw notes (too much noise).

- **Note content, aggregated**: below the calendar and legend, the report walks every week and day in range and pulls in that day's own note content (frontmatter stripped, bullet points kept as written; a day with no note just shows `-`), grouped under "Week of ..." and per-day headings. The reader gets everything that actually happened, day by day, in one document instead of clicking through each note individually.
- **Layout**: "Weeks as columns" or "Weeks as rows", rendered pixel-for-pixel like the heatmap itself — including exact day-level month-splitting (with a year label whenever the range crosses a year boundary) and, when a date range is too wide/tall for one grid, automatic wrapping into multiple bands, evenly split rather than front-loading one band and leaving a small leftover.
- **Date range**: pick start/end dates directly, or jump to a range with a preset — Logged (the full span of your tracked data), Last year, Year to date, Last month, or Month to date.
- **Display options**: which day the week starts on, whether to show each week's start date, split the grid by month, show month labels, and hide weekends.
- **Legend editor**: colors are pre-populated from what's actually used in your data, so you just fill in what each one means. Reorder entries by drag-and-drop, and toggle per-category whether it's counted in the summary line.
- **Summary line**: a compact, customizable breakdown like `Workday: 22 · Leave: 1 · Rest day but worked: 1` with a total (e.g. `Total hours: 169`) — or hide the breakdown, the total, or all values entirely.
- **Output**: save as a Markdown note or a self-contained HTML file, to whichever folder in your vault you choose.

All of these preferences persist across sessions, so you only need to set them up once.

<img src="https://raw.githubusercontent.com/mokkiebear/heatmap-tracker/refs/heads/main/public/two-mac-mockup.png" />

To be used with [Obsidian Dataview](https://blacksmithgu.github.io/obsidian-dataview/), but could be used standalone or with other plugins as well (if you know some javascript).


## 📦 Plugin Features

<details>
    <summary>1. <b>Easy switch between years.</b> Render a dynamic heatmap for the selected year, displaying data intensity for each day.</summary>
    <p>Easily switch between years using left and right navigation arrows, allowing you to explore data across multiple years effortlessly.</p>
</details>
   
<details>
    <summary>2. <b>Customizable Colors and Intensity.</b> Define your own color schemes and intensity ranges to match your data's theme.</summary>
    <p>You have lots of options for defining colors:</p>
    <ol>
        <li>Create your own palette in plugin settings (or use default one)</li>
        <li>Use `customColors` to set your set of colors for specific plugin</li>
        <li>Use `customColor` for specific entry</li>
    </ol>
     <img width="552" alt="Снимок экрана 2025-02-08 в 11 11 34" src="https://github.com/user-attachments/assets/48df34d5-66f3-478b-bc87-83b0b061aeec" />
</details>

<details>
    <summary>3. <b>User-Defined Insights.</b> This feature allows you to analyze data in ways that matter most to you.</summary>
    <p>Customize insights such as:</p>
    <ul>
        <li>The most productive day</li>
        <li>The longest streak without breaks</li>
        <li>The most active month</li>
        <li>Your average daily intensity</li>
    </ul>
    <p>Check this file for more information <a href="https://github.com/mokkiebear/heatmap-tracker/blob/main/EXAMPLE_VAULT/Documentation%20with%20Examples/3.%20trackerData%20parameters/6.%20insights.md">Insights</a></p>
</details>

<details>
    <summary>4. <b>Monthly Separation Option.</b> Choose whether to separate months visually within the heatmap for better clarity and structure.</summary>
    <p></p>
</details>

<details>
    <summary>5. <b>Localization.</b> Plugin supports 9 languages: English, German, Russian, Chinese, Hindi, Spanish, French, Portuguese, and Polish.</summary>
    <p>See <a href="https://github.com/mokkiebear/heatmap-tracker/tree/main/src/localization/locales">src/localization/locales</a> for the current list, and <a href="./docs/add-new-language.md">docs/add-new-language.md</a> if you'd like to contribute a translation.</p>
</details>

<details>
    <summary>6. <b>Statistics View.</b> View your progress with an integrated statistics panel.</summary>
    <p></p>
</details>

<details>
    <summary>7. <b>Display Week Numbers.</b> View week numbers alongside the heatmap for better time tracking.</summary>
    <p></p>
</details>


<details>
    <summary>8. <b>Insert Heatmap Tracker.</b> Easily add a heatmap tracker to your notes using a simple command.</summary>
    <p></p>
</details>

<details>
    <summary>9. <b>Customizable Font.</b> Use your favorite font with this plugin.</summary>
    <p>Additionally, you can use <code>HTML</code> to further customize the plugin's appearance.</p>
    <img width="400" alt="Font Customization" src="https://github.com/user-attachments/assets/09f79cbe-45e8-477e-8111-631f34b98cdb" />
</details>

<details>
    <summary>10. <b>Monthly Layout.</b> Display your heatmap as a compact calendar with one row per month.</summary>
    <p>Set <code>layout: "monthly"</code> to switch from the default GitHub-style grid to a calendar-style view with days 1–31 as columns. Combine with <code>monthsToShow</code> to display only recent months.</p>
</details>

<details>
    <summary>11. <b>Export a Report.</b> Turn your tracked data and daily notes into a single shareable Markdown or HTML report.</summary>
    <p>The <b>Export</b> tab renders a grid that matches your heatmap exactly (columns or rows, with automatic day-level month-splitting and band-wrapping for long ranges), then aggregates each day's own note content underneath it, grouped by week — plus a customizable legend, summary line, and date-range presets. See <a href="#exporting-a-report">Exporting a Report</a> above for details.</p>
</details>

<img src="https://raw.githubusercontent.com/mokkiebear/heatmap-tracker/refs/heads/main/public/mac-mockup-dark.png" />

<img src="https://raw.githubusercontent.com/mokkiebear/heatmap-tracker/refs/heads/main/public/tracker-overview.png">

## Roadmap

📍 Check out the [Roadmap](./ROADMAP.md) to see what's planned for the future!

## Development (Windows/Mac):

📐 New to the codebase? [ARCHITECTURE.md](./ARCHITECTURE.md) maps how data flows from a codeblock/dataviewjs script through to the rendered heatmap.

 ```npm run dev``` - will start an automatic TS to JS transpiler and automatically copy the generated JS/CSS/manifest files to the example vault when modified (Remember to run ```npm install``` first).

 After the files have been transpiled, the **hot-reload plugin** (https://github.com/pjeby/hot-reload) then reloads Obsidian automatically.
 Hot-reload is installed in the example vault by default. its used to avoid restarting obsidian after every change to code.  
 *(remember to add an empty *.hotreload* file to "EXAMPLE_VAULT/.obsidian/plugins/heatmap-tracker/" if not already present, as this tells hot-reload to watch for changes)*


```npm run build``` generates the files ready for distribution.

&nbsp;

Tip: ```ctrl-shift-i``` opens the devtools inside Obsidian.


---

## Inspired by:
https://github.com/Richardsl/heatmap-calendar-obsidian
