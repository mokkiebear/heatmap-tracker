# Heatmap Tracker plugin for Obsidian

<img alt="Heatmap Tracker Plugin" src="https://github.com/user-attachments/assets/f40766da-4e5e-4ee6-829a-4648d35892f7" />


<a href="https://www.buymeacoffee.com/mrubanau" target="_blank"><img src="https://cdn.buymeacoffee.com/buttons/v2/default-yellow.png" alt="Buy Me A Coffee" style="height: 42px !important;width: 150px !important;" ></a>

[![ko-fi](https://ko-fi.com/img/githubbutton_sm.svg)](https://ko-fi.com/X8X11E578R)

The **Heatmap Tracker plugin for Obsidian** is a powerful and customizable tool designed to help you **track, visualize, and analyze data** over a calendar year. Perfect for habit tracking, project management, personal development, or any kind of data visualization, this plugin enables you to create beautiful, interactive heatmaps directly within Obsidian. Whether you’re **monitoring progress, visualizing trends, or staying on top of daily goals**, the Heatmap Tracker enhances your productivity and organization. Discover its intuitive features, flexible customization options, and seamless integration with Obsidian in the detailed guide below.

> **Tip:** Check [Example Vault](https://github.com/mokkiebear/heatmap-tracker/tree/main/EXAMPLE_VAULT). There're lots of good examples (and I update it often).

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

## Basic Usage 2.0
You can add a heatmap tracker using command: `Insert Heatmap Tracker`. This is the easiest way to get started.

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
> You can also read about parameters in [EXAMPLE_VAULT](https://github.com/mokkiebear/heatmap-tracker/tree/main/EXAMPLE_VAULT/Documentation%20with%20Examples/3.%20trackerData%20parameters) (there're examples).

### `year`
- **Type:** `number`
- **Default:** Current year (`new Date().getFullYear()`)
- **Description:** Specifies the year for which the heatmap should display data by default.

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
- **Description:** Defines the color scale used for representing different intensity levels in the heatmap. Each color corresponds to a specific range of data intensity.

---

### `customColor`
- **Type:** `string`
- **Default:** `undefined`
- **Description:** Entry property. Sets the color for specific entry. If you want some entry (based on the condition) to have a different color, you can set it here.

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
  - `customColor`: The color for that entry.
  - `intensity`: The data intensity for that date.
  - `content`: Optional tooltip or note associated with the date.

---

### `showCurrentDayBorder`
- **Type:** `boolean`
- **Default:** `true`
- **Description:** Indicates whether the current day should be highlighted with a border on the heatmap.

---

### `defaultEntryIntensity`
- **Type:** `number`
- **Default:** `4`
- **Description:** The default intensity assigned to new data entries if no intensity is explicitly specified.

---

### `intensityScaleStart`
- **Type:** `number`
- **Default:** `1`
- **Description:** The minimum value for the intensity scale. Used to determine the color mapping for the lowest intensity values in the heatmap.

---

### `intensityScaleEnd`
- **Type:** `number`
- **Default:** `5`
- **Description:** The maximum value for the intensity scale. Represents the highest possible intensity that can be mapped to the color scale.

---

### `basePath`
- **Type:** `string`
- **Default:** `undefined`
- **Description:** Base folder used to collect entries. If set, the plugin will propose creating new files in this folder when clicking on empty heatmap boxes.

---

### `separateMonths`
- **Type:** `boolean`
- **Default:** `true`
- **Description:** Determines whether months should be visually separated within the heatmap layout.

---

### `insights`
- **Type:** `array`
- **Default:** `[]`
- **Description:** Powerful property for calculating and displaying your own insights in `Statistics`. Check this [example](https://github.com/mokkiebear/heatmap-tracker/blob/main/EXAMPLE_VAULT/Documentation%20with%20Examples/3.%20trackerData%20parameters/6.%20insights.md).


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
    <summary>5. <b>Localization.</b> Plugin supports multiple languages, including English, German, and Russian.</summary>
    <p></p>
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

<img src="https://raw.githubusercontent.com/mokkiebear/heatmap-tracker/refs/heads/main/public/mac-mockup-dark.png" />

<img src="https://raw.githubusercontent.com/mokkiebear/heatmap-tracker/refs/heads/main/public/tracker-overview.png">

## Roadmap

📍 Check out the [Roadmap](./ROADMAP.md) to see what's planned for the future!

## Development (Windows/Mac):

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
