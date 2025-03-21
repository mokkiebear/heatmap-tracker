import { useTranslation } from "react-i18next";
import { useHeatmapContext } from "src/context/heatmap/heatmap.context";
import { HeatmapTabs } from "../HeatmapTabs/HeatmapTabs";

interface HeatmapHeaderProps {
  hideTabs?: boolean;
  hideSubtitle?: boolean;
}

export function HeatmapHeader({
  hideTabs = false,
  hideSubtitle = false,
}: HeatmapHeaderProps) {
  const { t } = useTranslation();
  const { currentYear, setCurrentYear, trackerData } = useHeatmapContext();

  function onArrowBackClick() {
    setCurrentYear(currentYear - 1);
  }

  function onArrowForwardClick() {
    setCurrentYear(currentYear + 1);
  }

  return (
    <div className="heatmap-tracker-header">
      <div className="heatmap-tracker-header__main-row">
        <div className="heatmap-tracker-header__navigation">
          <button
            className="heatmap-tracker-arrow left clickable-icon"
            aria-label={t("header.previousYear")}
            onClick={onArrowBackClick}
          >
            ◀
          </button>
          <div className="heatmap-tracker-year-display">{currentYear}</div>
          <button
            className="heatmap-tracker-arrow right clickable-icon"
            aria-label={t("header.nextYear")}
            onClick={onArrowForwardClick}
          >
            ▶
          </button>
        </div>
        <div
          className="heatmap-tracker-header__title"
          dangerouslySetInnerHTML={{ __html: trackerData?.heatmapTitle ?? "" }}
        />
        {hideTabs ? null : <HeatmapTabs />}
      </div>
      {hideSubtitle ? null : trackerData?.heatmapSubtitle ? (
        <div className="heatmap-tracker-header__sub-row">
          <div
            className="heatmap-tracker-header__subtitle"
            dangerouslySetInnerHTML={{
              __html: trackerData?.heatmapSubtitle ?? "",
            }}
          />
        </div>
      ) : null}
    </div>
  );
}
