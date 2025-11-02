
```heatmap-tracker
{
    heatmapTitle: "Test123",
    evaluateIntensity: (e) => {
    console.log('###', e)
        if (e.intensity >= 8) {
            return 1;
        }
        
        return 2;
    },
    separateMonths: true,
    entries: [
        {
      "date": "2025-04-04T00:00:00+01:00",
      "intensity": '0'
    },
    {
      "date": "2025-04-15",
      "intensity": '5'
    },
    {
      "date": "2025-04-16",
      "intensity": 8
    },
    {
      "date": "2025-04-17",
      "intensity": 10
    },
    ]
}
```

```heatmap-tracker-yaml
heatmapTitle: Some Title
property: [steps]
```

```heatmap-tracker
{
    "heatmapTitle": "Some Title JS",
    "property": ["steps"],
    "basePath": "daily notes"
}
```


```heatmap-tracker
{
  "heatmapTitle": "New Steps Tracker",
  "property": "steps"
}
```



