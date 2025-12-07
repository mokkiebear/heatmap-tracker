import { ReactNode, useMemo } from "react";
import { Box } from "src/types";

import { useHeatmapContext } from "src/context/heatmap/heatmap.context";
import { useAppContext } from "src/context/app/app.context";
import { handleBoxClick } from "src/utils/heatmapBox";

interface HeatmapBoxProps {
  box: Box;
}

export function HeatmapBox({ box }: HeatmapBoxProps) {
  const { trackerData } = useHeatmapContext();
  const app = useAppContext();

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

  // Prepare Obsidian internal-link or custom href; prefer customHref, then filePath, then date
  const linkTarget = useMemo(() => {
    if (box.customHref) {
      return box.customHref;
    }

    if (box.filePath) {
      return box.filePath;
    }

    return undefined;
  }, [box.customHref, box.filePath]);

  const content =
    box.content instanceof HTMLElement ? (
      <span dangerouslySetInnerHTML={{ __html: box.content.outerHTML }} />
    ) : (
      (box.content as ReactNode)
    );

  const isExternal =
    typeof linkTarget === "string" && /^https?:\/\//i.test(linkTarget);

  const linkAttrs = linkTarget
    ? { "data-href": linkTarget, href: linkTarget }
    : {};

  function onBoxClick() {
    if (linkTarget) {
      return;
    }

    handleBoxClick(box, app, trackerData);
  }

  return (
    <div
      data-htp-date={box.date}
      style={{ backgroundColor: box.backgroundColor }}
      className={`${boxClassNames.filter(Boolean).join(" ")}`}
      aria-label={box.date}
      onClick={onBoxClick}
    >
      <a
        className={`heatmap-tracker-content${
          linkTarget && !isExternal ? " internal-link" : ""
        }`}
        {...linkAttrs}
      >
        {content}
      </a>
    </div>
  );
}
