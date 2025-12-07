# Daily Mood Tracker (1-5 Scale)

This example tracks your daily mood on a scale of 1 to 5.

## How it works
- It looks for pages in the `"daily notes"` folder.
- It reads the `mood` field (number 1-5).
- Colors range from low intensity (bad mood) to high intensity (good mood).

```dataviewjs
const trackerData = {
    year: 2024,
    entries: [],
    heatmapTitle: "😊 Daily Mood",
    heatmapSubtitle: "1: 😢, 2: 😕, 3: 😐, 4: 🙂, 5: 🤩",
    intensityScaleStart: 1,
    intensityScaleEnd: 5,
    colorScheme: {
        paletteName: "winter" // Blue/Purple scale
    }
}

for(let page of dv.pages('"daily notes"').where(p => p.mood)) {
    trackerData.entries.push({
        date: page.file.name,
        intensity: page.mood
    })
}

renderHeatmapTracker(this.container, trackerData)
```

## Sample Data (Copy to a daily note)
```yaml
mood: 4
```
