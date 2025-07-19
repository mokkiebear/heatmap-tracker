import React, { useRef } from "react";
import { createPortal } from "react-dom";

interface TooltipProps {
  visible: boolean;
  content: React.ReactNode;
  anchorEl: HTMLElement | null;
}

export const Tooltip: React.FC<TooltipProps> = ({
  visible,
  content,
  anchorEl,
}) => {
  const tooltipRef = useRef<HTMLDivElement>(null);

  if (!visible || !anchorEl) return null;

  // Calculate anchor position
  const anchorRect = anchorEl.getBoundingClientRect();

  return (<div
      ref={tooltipRef}
      className="heatmap-tooltip"
      style={{
        position: "absolute",
        top: 8,
        left: 0,
        transform: "translateX(-50%)",
        padding: "6px 10px",
        fontSize: "var(--font-ui-smaller)",
        backgroundColor: "var(--background-secondary-alt)",
        border: "1px solid var(--background-modifier-border-hover)",
        color: "var(--text-normal)",
        borderRadius: "4px",
        whiteSpace: "nowrap",
        zIndex: 9999,
        pointerEvents: "none", // prevents accidental hover behavior
      }}
    >
      {content}
    </div>);
};