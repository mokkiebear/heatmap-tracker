```dataviewjs
const trackerData = {
    entries: [], // the array that the values get assigned to
    colorScheme: { paletteName: "longerDefault" },
    heatmapTitle: "Habit Tracker",
    heatmapSubtitle: "Tracking my days of completed Habits",
    intensityScaleStart: 0,
    intensityScaleEnd: 1,
    separateMonths: true
}

/* The following is just javascript logic to that turns the completed and uncompleted tasks into a number to assign a colour */

function countHabits(markdown) { 
    // Split the markdown into lines for processing
    const lines = markdown.split('\n');

    // Variables to track the habit section and counts
    let inHabitSection = false;
    let checkedCount = 0;
    let uncheckedCount = 0;

    // Loop through the lines
    for (const line of lines) {
        // Check for the start of the "## Habit" section
        if (line.trim() === '## Habit') {
            inHabitSection = true;
            continue;
        }

        // Exit the habit section if another "##" heading is encountered
        if (inHabitSection && line.startsWith('## ')) {
            break;
        }

        // Count checkboxes only within the "## Habit" section
        if (inHabitSection) {
            if (line.includes('- [x]')) {
                checkedCount++;
            } else if (line.includes('- [ ]')) {
                uncheckedCount++;
            }
        }
    }

    // Return the counts
    return 0 + checkedCount/(checkedCount+uncheckedCount);
}

/* this is a loop that finds all the files with the YYYY/MM/DD format in the 0. PeriodicNotes folder and executes the previous logic to assign the tasks as a number and puts them in teh array */

for (let page of dv.pages('"Examples/Task Tracking Example from Reddit/notes"')
 .where(p => /^\d{4}-\d{2}-\d{2}$/.test(p.file.name))) { 
const markdown = await dv.io.load(page.file.path); 
trackerData.entries.push({ 
date: page.file.name, 
filePath: page.file.path, 
intensity: countHabits(markdown) }); 
} 

/* this just executes the heatmap plugin to render the image */

trackerData.basePath = 'Examples/Task Tracking Example from Reddit/notes';

renderHeatmapTracker(this.container, trackerData);
```

https://www.reddit.com/r/ObsidianMD/comments/1hrmeil/i_need_help_in_creating_a_dataview_based_habit/
