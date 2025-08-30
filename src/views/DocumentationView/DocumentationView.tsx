function DocumentationView() {
  const codeString = `
  const trackerData = {
    entries: [{
        date: "2021-01-01",
        filePath: page.file.path,
        intensity: 1,
        // customColor: "#ff0000",
    }],
    separateMonths: true,
    heatmapTitle: "This is the title for your heatmap",
    heatmapSubtitle: "This is the subtitle for your heatmap. You can use it as a description.",
    showCurrentDayBorder: true,

    // OPTIONAL: If you want to define your own color scheme
    colorScheme: {
        paletteName: "default", // or customColors
        customColors: ["#c6e48b", "#7bc96f", "#49af5d", "#2e8840", "#196127"]
    },

    // OPTIONAL: If you want to define your own intensity start/end values.
    // Use this if you want to have a custom intensity scale.
    // E.g. if you want to track book reading progress only from 30 minutes to 2 hours.
    defaultEntryIntensity: 4,
    intensityScaleStart: 1,
    intensityScaleEnd: 5
}
  `;

  return (
    <div className="documentation-view__container">
      <p>
        <strong>Actual Heatmap Tracker API</strong>
      </p>
      <div className="breaking-changes-view__maintenance-border">
        <div className="breaking-changes-view__container">
          Since version <code>1.9</code> <code>colors</code> property is
          removed. Please, remove <code>colors</code> and use{" "}
          <code>colorScheme</code> instead (check example below).
        </div>
      </div>

      <pre>
        <code>{codeString}</code>
      </pre>

      <p>Color Scheme</p>
      <p>You have 2 (to be honest 3) options how you can define colors</p>
      <p>1. Palette name</p>
      <p>
        In the Heatmap Tracker plugin settings you can create your own palette
        and use the name of this palette for you heatmap.
      </p>
      <pre>
        <code>{`
        {
          colorScheme: {
            paletteName: "the_name_of_your_palette", // "default" is used by default
          }
        }
        `}</code>
      </pre>
      <p>2. Custom colors</p>
      <p>
        You can define your own colors for the heatmap. Just provide an array of
        colors. In case you're lazy to create a palette.
      </p>
      <pre>
        <code>{`
        {
          colorScheme: {
            customColors: ["#c6e48b", "#7bc96f", "#49af5d", "#2e8840", "#196127"]
          }
        }
        `}</code>
      </pre>
      <p>3. customColor for entry</p>
      <p>
        You can define custom color for each entry. Just provide a color in the
        entry object. It can be useful if you want to take color from page
        itself or other cases.
      </p>
      <pre>
        <code>{`
        {
          entries: [{
            date: "2021-01-01",
            intensity: 1,
            customColor: "#ff0000",
          }]
        }
        `}</code>
      </pre>
    </div>
  );
}

export default DocumentationView;
