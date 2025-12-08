
Since `1.19.1` use `ui` and `defaultView` to display legend separately. Example:

```dataviewjs

var trackerData = {
    year: 2024, // optional, remove this line to autoswitch year
    entries: [],
    heatmapTitle: "👣 Steps Tracker 👣",
}

const PATH_TO_FOLDER = "daily notes";
 
for(let page of dv.pages(`"${PATH_TO_FOLDER}"`).where(p=>p.steps)){
    trackerData.entries.push({
        date: page.file.name,
        filePath: page.file.path,
        intensity: page.steps
    })  
}

trackerData.basePath = PATH_TO_FOLDER;

renderHeatmapTracker(this.container, trackerData);
renderHeatmapTrackerLegend(this.container, trackerData);
```

```dataviewjs

var trackerData = {
    year: 2024, // optional, remove this line to autoswitch year
    entries: [],
    heatmapTitle: "👣 Steps Tracker 👣",
    ui: {
        defaultView: 'legend',
        hideTabs: true,
        hideSubtitle: true
    }
}

const PATH_TO_FOLDER = "daily notes";
 
for(let page of dv.pages(`"${PATH_TO_FOLDER}"`).where(p=>p.steps)){
    trackerData.entries.push({
        date: page.file.name,
        filePath: page.file.path,
        intensity: page.steps
    })  
}

trackerData.basePath = PATH_TO_FOLDER;

renderHeatmapTracker(this.container, trackerData)
```