import { ReactNode } from "react";
import { Box } from "src/types";

interface HeatmapBoxProps {
  box: Box;
  onClick?: (box: Box) => void;
}

export function HeatmapBox({ box, onClick }: HeatmapBoxProps) {
  const boxClassNames = [
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

  const content =
    box.content instanceof HTMLElement ? (
      <span dangerouslySetInnerHTML={{ __html: box.content.outerHTML }} />
    ) : (
      (box.content as ReactNode)
    );

  return (
    <div
      data-htp-date={box.date}
      style={{ backgroundColor: box.backgroundColor }}
      className={`${boxClassNames.filter(Boolean).join(" ")}`}
      aria-label={box.date}
      onClick={onClick ? () => onClick(box) : undefined}
    >
      <span className="heatmap-tracker-content">{content}</span>
    </div>
  );
}
