import { ReactNode, useMemo } from "react";
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

  function handleBoxClick() {
    if (linkTarget) {
      return;
    }

    onClick && onClick(box);
  }

  return (
    <div
      data-htp-date={box.date}
      style={{ backgroundColor: box.backgroundColor }}
      className={`${boxClassNames.filter(Boolean).join(" ")}`}
      aria-label={box.date}
      onClick={handleBoxClick}
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
