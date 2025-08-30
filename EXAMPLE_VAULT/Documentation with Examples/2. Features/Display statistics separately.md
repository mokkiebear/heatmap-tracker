To display statistics separately all you need to do is to call `renderHeatmapTrackerStatistics(this.container, trackerData)`.

Check example below:

```dataviewjs

var trackerData = {
    year: 2024, // optional, remove this line to autoswitch year
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

dv.span('Steps tracker statistics:')

renderHeatmapTrackerStatistics(this.container, trackerData)
```
