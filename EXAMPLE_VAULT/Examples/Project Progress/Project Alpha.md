# Project Alpha Progress (%)

This example tracks the progress of a project as a percentage (0-100).

## How it works
- It looks for pages in the `"daily notes"` folder.
- It reads the `project_alpha` field (percentage).
- Shows progress intensity.

```dataviewjs
const trackerData = {
    year: 2024,
    entries: [],
    heatmapTitle: "🚀 Project Alpha Progress",
    heatmapSubtitle: "Daily progress percentage",
    intensityScaleStart: 0,
    intensityScaleEnd: 100,
    colorScheme: {
        paletteName: "warm" // Red/Orange/Yellow
    }
}

for(let page of dv.pages('"daily notes"').where(p => p.project_alpha)) {
    trackerData.entries.push({
        date: page.file.name,
        intensity: page.project_alpha
    })
}

renderHeatmapTracker(this.container, trackerData)
```

## Sample Data (Copy to a daily note)
```yaml
project_alpha: 75
```
