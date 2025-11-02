
```dataviewjs

const trackerData = {
    year: 2024, // optional, remove this line to autoswitch year
    entries: [],
    colorScheme: {
        customColors: [
            "rgb(255, 0, 0)",
            "rgb(255, 162, 127)",
            "rgb(255, 232, 197)",
            "rgb(151, 190, 90)",
            ]
    },
    heatmapTitle: "<b>🌅 Wake-Up Wellness Heatmap 🌅</b>",
    heatmapSubtitle: "Track wake-up times against your target. Green means early, red means late. 🌄✨",
    intensityScaleStart: 0,
    intensityScaleEnd: 1
}

/**
 * Calculate the intensity of wake-up time based on the target time.
 * Intensity is 1 (best) when wake time is before or equal to the target time,
 * and decreases linearly as wake time gets later.
 *
 * @param {string} wakeTimeISO - Wake-up time in ISO format (e.g., "2024-11-18T08:30:00.000+01:00").
 * @param {string} targetTime - Target wake-up time (HH:MM format, default from constant).
 * @returns {number} Intensity value between 0 (worst) and 1 (best).
 */
function calculateIntensity(wakeTimeISO) {
    // Constants for configuration
  const MAX_DIFF = 120; // Maximum time difference (in minutes) after which intensity is 0
  const TARGET_TIME = "06:00"; // Target wake-up time (HH:MM format)

  // Parse the wake-up time from ISO string to a Date object
  const wakeDate = new Date(wakeTimeISO);

  // Parse target time into hours and minutes
  const [targetHour, targetMinute] = TARGET_TIME.split(":").map(Number);

  // Convert target time to minutes since midnight
  const targetMinutes = targetHour * 60 + targetMinute;

  // Get wake-up time in minutes since midnight
  const wakeMinutes = wakeDate.getHours() * 60 + wakeDate.getMinutes();

  // Calculate the time difference (only if wake time is after the target time)
  const diffMinutes = Math.max(0, wakeMinutes - targetMinutes);

  // Normalize the intensity value: 1 (best) -> 0 (worst)
  return Math.max(0, 1 - diffMinutes / MAX_DIFF);
}

 
for(let page of dv.pages('"daily notes"').where(p=>p.woke)){
    trackerData.entries.push({
        date: page.file.name,
        filePath: page.file.path,
        intensity: calculateIntensity(page.woke),
    })  
}

trackerData.basePath = 'daily notes';

renderHeatmapTracker(this.container, trackerData)

```

```heatmap-tracker
{
    "year": 2024,
    "entries": [],
    "property": "woke",
    "basePath": "daily notes",
    "colorScheme": {
        "customColors": [
            "rgb(255, 0, 0)",
            "rgb(255, 162, 127)",
            "rgb(255, 232, 197)",
            "rgb(151, 190, 90)"
        ]
    },
    "heatmapTitle": "<b>🌅 Wake-Up Wellness Heatmap 🌅</b>",
    "heatmapSubtitle": "Track wake-up times against your target. Green means early, red means late. 🌄✨",
    "intensityScaleStart": 0,
    "intensityScaleEnd": 1,
    "evaluateIntensity": function calculateIntensity(e) {
      const MAX_DIFF = 120;
      const TARGET_TIME = "06:00";
    
      const wakeDate = new Date(e.intensity);
      const [targetHour, targetMinute] = TARGET_TIME.split(":").map(Number);
      const targetMinutes = targetHour * 60 + targetMinute;
      const wakeMinutes = wakeDate.getHours() * 60 + wakeDate.getMinutes();
      const diffMinutes = Math.max(0, wakeMinutes - targetMinutes);
    
      return Math.max(0, 1 - diffMinutes / MAX_DIFF);
    }
}
```

```heatmap-tracker
{
    "year": 2024,
    "entries": [],
    "property": "woke",
    "basePath": "daily notes",
    "colorScheme": {
        "customColors": [
            "rgb(255, 0, 0)",
            "rgb(255, 162, 127)",
            "rgb(255, 232, 197)",
            "rgb(151, 190, 90)"
        ]
    },
    "heatmapTitle": "<b>🌅 Wake-Up Wellness Heatmap 🌅</b>",
    "heatmapSubtitle": "Track wake-up times against your target. Green means early, red means late. 🌄✨",
    "intensityRanges": [
        {
            color: ({value}) => 
        }
    ]
}
```