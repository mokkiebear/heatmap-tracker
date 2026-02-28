import { useHeatmapContext } from "src/context/heatmap/heatmap.context";
import { getIntensitiesInfo, getEntriesIntensities } from "src/utils/intensity";

function LegendView() {
  const { colorsList, intensityConfig, allFilteredEntries } = useHeatmapContext();

  const intensities = getEntriesIntensities(allFilteredEntries);

  const intensitiesInfo = getIntensitiesInfo(
    intensities,
    intensityConfig,
    colorsList ?? []
  );

  return (
    <div className="legend-view">
      <table>
        <thead>
          <tr>
            <th>Intensity</th>
            <th>Range</th>
            <th>Color</th>
          </tr>
        </thead>
        <tbody>
          {intensitiesInfo.map((intensityInfo, index) => (
            <tr key={index}>
              <td>{intensityInfo.intensity}</td>
              <td>
                {intensityInfo.min.toFixed(2)} - {intensityInfo.max.toFixed(2)}
              </td>
              <td className="legend-view__color-cell">
                <div
                  style={{
                    backgroundColor: colorsList[index],
                    width: '12px',
                    height: '12px'
                  }}
                  className="heatmap-tracker-box"
                ></div>
                <span style={{ marginLeft: "12px" }}>{colorsList[index]}</span>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

export default LegendView;
