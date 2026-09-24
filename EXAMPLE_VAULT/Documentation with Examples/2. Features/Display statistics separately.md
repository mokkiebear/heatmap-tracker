Since `1.19.2` use `ui` and `defaultView` to display statistics separately. Example:
```dataviewjs

var trackerData = {
    year: 2025, // optional, remove this line to autoswitch year
    entries: [],
    heatmapTitle: "👣 Steps Tracker 👣"
}

 
for(let page of dv.pages('"daily notes"').where(p=>p.steps)){

    trackerData.entries.push({
        date: page.file.name,
        filePath: page.file.path,
        intensity: page.steps
    })  
}

trackerData.basePath = 'daily notes';

renderHeatmapTracker(this.container, trackerData)
```

```dataviewjs

var trackerData = {
    year: 2025, // optional, remove this line to autoswitch year
    entries: [],
    heatmapTitle: "👣 Steps Tracker 👣",
    ui: {
        defaultView: 'heatmap-tracker-statistics',
        hideTabs: true,
        hideSubtitle: true
    }
}

 
for(let page of dv.pages('"daily notes"').where(p=>p.steps)){

    trackerData.entries.push({
        date: page.file.name,
        filePath: page.file.path,
        intensity: page.steps
    })  
}

trackerData.basePath = 'daily notes';

renderHeatmapTracker(this.container, trackerData)
```