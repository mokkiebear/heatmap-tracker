# Exercise Tracker (Boolean)

This example tracks whether you exercised or not. It uses a simple boolean check.

## How it works
- It looks for pages in the `"daily notes"` folder.
- It checks if the `exercise` field is present and true.
- Green means you exercised!

```dataviewjs
const trackerData = {
    year: 2024,
    entries: [],
    heatmapTitle: "🏋️ Exercise Tracker",
    heatmapSubtitle: "Did I exercise today?",
    colorScheme: {
        paletteName: "default" // Green by default
    }
}

for(let page of dv.pages('"daily notes"').where(p => p.exercise)) {
    trackerData.entries.push({
        date: page.file.name,
        intensity: 1 // 1 for true/done
    })
}

renderHeatmapTracker(this.container, trackerData)
```

## Sample Data (Copy to a daily note)
```yaml
exercise: true
```
