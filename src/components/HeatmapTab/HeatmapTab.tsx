import { useHeatmapContext } from "src/context/heatmap/heatmap.context";
import { View } from "src/types";
import { HeatmapIcon } from "../icons/HeatmapIcon";
import { StatisticsIcon } from "../icons/StatisticsIcon";
import { MenuIcon } from "../icons/MenuIcon";
import { DocumentationIcon } from "../icons/DocumentationIcon";
import { ReactNode, memo } from "react";
import { HandCoinsIcon } from "../icons/HandCoinsIcon";

const IconForView: Record<View, ReactNode> = {
  [View.HeatmapTracker]: <HeatmapIcon />,
  [View.HeatmapTrackerStatistics]: <StatisticsIcon />,
  [View.HeatmapMenu]: <MenuIcon />,
  [View.Documentation]: <DocumentationIcon />,
  [View.Donation]: <HandCoinsIcon />
};

function HeatmapTab({
  view,
  label,
  disabled,
}: {
  view: View;
  label: string;
  disabled?: boolean;
}) {
  const { view: selectedView, setView } = useHeatmapContext();

  const isSelected = view === selectedView;

  function handleClick() {
    setView(view);
  }

  return (
    <button
      aria-label={label}
      className={`heatmap-tracker-tab clickable-icon ${
        isSelected ? "is-active" : ""
      }`}
      disabled={disabled}
      onClick={handleClick}
    >
      {IconForView[view]}
    </button>
  );
}

export default memo(HeatmapTab);