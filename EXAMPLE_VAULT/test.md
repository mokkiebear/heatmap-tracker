
```dataviewjs

const trackerData = {
    heatmapTitle: "Test",
    intensityScaleStart: 0,
    intensityScaleEnd: 10,
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

renderHeatmapTracker(this.container, trackerData)

```

```dataviewjs
async function convertToISO(dateString) {
    const meses = {
        "Janeiro": "01", "Fevereiro": "02", "Março": "03", "Abril": "04", "Maio": "05", "Junho": "06",
        "Julho": "07", "Agosto": "08", "Setembro": "09", "Outubro": "10", "Novembro": "11", "Dezembro": "12"
    };

    const regex = /^[^\d]+, (\d{1,2}) de (\w+) de (\d{4})$/;
    const match = dateString.match(regex);

    if (!match) {
        throw new Error(`Formato de Data Inválido: ${dateString}`);
    }

    const [, day, monthName, year] = match;
    const monthFormatted = meses[monthName];

    if (!monthFormatted) {
        throw new Error("Mês inválido");
    }

    return `${year}-${monthFormatted}-${day.padStart(2, '0')}`;
}

const trackerData = {
    entries: [],
    separateMonths: true,
    heatmapTitle: "Estudos Diários",
    heatmapSubtitle: "Heatmap dos meus Estudos de Japonês",
};

const PATH_TO_YOUR_FOLDER = "estudos";

for (let page of dv.pages(`"${PATH_TO_YOUR_FOLDER}"`)) {
    if (!page.file) continue;

    const fileContent = await dv.io.load(page.file.path);

    if (!fileContent) continue;

    const wordCount = fileContent.split(/\s+/).length;
    const charCount = fileContent.length;

    const intensity = wordCount + charCount / 100;

    const content = await dv.span(`[](${page.file.name})`);
    trackerData.entries.push({
        date: await convertToISO(page.file.name),
        intensity: intensity,
        content
    });
}

const container = this.container; 
Object.assign(container.style, {
	backgroundColor: "#121212", 
	color: "white", 
	fontWeight: "bold", 
	borderRadius: "10px"
});

renderHeatmapTracker(container, trackerData);
```