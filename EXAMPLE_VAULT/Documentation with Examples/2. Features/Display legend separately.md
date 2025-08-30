To display legend separately all you need to do is to call `renderHeatmapTrackerLegend(this.container, trackerData)`.

Check example below:

```dataviewjs

var trackerData = {
    year: 2024, // optional, remove this line to autoswitch year
    entries: [],
    heatmapTitle: "👣 Steps Tracker 👣"
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

dv.span('Steps tracker legend:')

renderHeatmapTrackerLegend(this.container, trackerData)
```
