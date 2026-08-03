import { KeyboardEvent, ReactNode, useMemo } from "react";
import { useTranslation } from "react-i18next";
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
  const { t } = useTranslation();

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

  // Padding boxes before January and the spacers between months carry no date,
  // so `handleBoxClick` bails out on them. Keep them out of the tab order and
  // out of the accessibility tree instead of exposing 20+ dead buttons.
  const isInteractive = Boolean(box.date);

  // Screen readers get the date plus the tracked value, not just the date.
  const label = useMemo(() => {
    if (!box.date) {
      return undefined;
    }

    return box.value !== undefined
      ? `${box.date}, ${t("box.value", { value: box.value })}`
      : `${box.date}, ${t("box.noData")}`;
  }, [box.date, box.value, t]);

  function onBoxClick() {
    if (linkTarget) {
      return;
    }

    handleBoxClick(box, app, trackerData);
  }

  function onBoxKeyDown(event: KeyboardEvent<HTMLDivElement>) {
    if (event.key !== "Enter" && event.key !== " ") {
      return;
    }

    // Space scrolls the note otherwise.
    event.preventDefault();
    onBoxClick();
  }

  // When the box links somewhere, the anchor is the real control: giving the
  // wrapper `role="button"` too would nest interactive elements and make screen
  // readers announce the same day twice.
  const wrapperInteractionProps =
    isInteractive && !linkTarget
      ? {
          role: "button",
          tabIndex: 0,
          "aria-label": label,
          onClick: onBoxClick,
          onKeyDown: onBoxKeyDown,
        }
      : { "aria-hidden": !isInteractive || undefined };

  return (
    <div
      data-htp-date={box.date}
      style={{ backgroundColor: box.backgroundColor }}
      className={`${boxClassNames.filter(Boolean).join(" ")}`}
      {...wrapperInteractionProps}
    >
      <a
        className={`heatmap-tracker-content${
          linkTarget && !isExternal ? " internal-link" : ""
        }`}
        aria-label={linkTarget ? label : undefined}
        {...linkAttrs}
      >
        {content}
      </a>
    </div>
  );
}
