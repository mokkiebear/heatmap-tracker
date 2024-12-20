import { ReactNode } from "react";
import { Box } from "src/types";

interface HeatmapBoxProps {
  box: Box;
}

export function HeatmapBox({ box }: HeatmapBoxProps) {
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
      data-date={box.date}
      style={{ backgroundColor: box.backgroundColor }}
      className={`${boxClassNames.filter(Boolean).join(" ")}`}
      // On Desktop it will show the date on hover.
      aria-label={box.date}
    >
      <span className="heatmap-tracker-content">{content}</span>
    </div>
  );
}
