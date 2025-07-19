import { ReactNode, useRef } from "react";
import { Box } from "src/types";
import { Tooltip } from "../common/Tooltip/Tooltip";
import { useHeatmapContext } from "src/context/heatmap/heatmap.context";

interface HeatmapBoxProps {
  box: Box;
}

function getHeatmapBoxClassNames(box: Box): (string | undefined)[] {
  return [
    "heatmap-tracker-box",
    box.name,
    box.isToday ? "today" : "",
    box.showBorder ? "with-border" : "",
    box.hasData
      ? "hasData"
      : box.isSpaceBetweenBox
      ? "space-between-box"
      : "isEmpty",
  ];
}

export function HeatmapBox({ box }: HeatmapBoxProps) {
  const boxRef = useRef<HTMLDivElement>(null);
  const { setSelectedBox } = useHeatmapContext();

  const boxClassNames = getHeatmapBoxClassNames(box);

  const content =
    box.content instanceof HTMLElement ? (
      <span dangerouslySetInnerHTML={{ __html: box.content.outerHTML }} />
    ) : (
      (box.content as ReactNode)
    );

  return (
    <div
      ref={boxRef}
      data-htp-date={box.date}
      style={{ backgroundColor: box.backgroundColor }}
      className={`${boxClassNames.filter(Boolean).join(" ")}`}
      onClick={() => setSelectedBox(box)}
    >
      <span className="heatmap-tracker-content">{content}</span>
    </div>
  );
}
