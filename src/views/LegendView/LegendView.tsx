import { useHeatmapContext } from "src/context/heatmap/heatmap.context";
import { getIntensitiesInfo, getEntriesIntensities } from "src/utils/core";

function LegendView() {
  const { trackerData, colorsList, intensityConfig } = useHeatmapContext();

  const intensities = getEntriesIntensities(trackerData.entries);

  console.log("###", intensities, trackerData);

  const l = getIntensitiesInfo(intensities, intensityConfig, colorsList);

  return (
    <div className="legend-view__container">
      {l.map((v, index) => (
        <div key={index} style={{ display: "flex", alignItems: "center" }}>
          <div className="heatmap-tracker-box" style={{ backgroundColor: colorsList[index], marginRight: '12px' }}></div>
          Intensity: {v.intensity}; Range: {v.min.toFixed(2)} - {v.max.toFixed(2)}
          <br />
        </div>
      ))}
    </div>
  );
}

export default LegendView;
