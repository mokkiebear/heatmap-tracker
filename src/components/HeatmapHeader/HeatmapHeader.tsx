import { useTranslation } from "src/localization/useTranslation";
import { useHeatmapContext } from "src/context/heatmap/heatmap.context";
import { HeatmapTabs } from "../HeatmapTabs/HeatmapTabs";
import { ChevronLeftIcon } from "../icons/ChevronLeftIcon";
import { ChevronRightIcon } from "../icons/ChevronRightIcon";

const MONTH_KEYS = [
  "January",
  "February",
  "March",
  "April",
  "May",
  "June",
  "July",
  "August",
  "September",
  "October",
  "November",
  "December",
];

export function HeatmapHeader() {
  const { t } = useTranslation();
  const {
    currentYear,
    setCurrentYear,
    trackerData,
    dateRange,
    calendarPeriod,
    canShiftPeriod,
    shiftPeriod,
  } = useHeatmapContext();

  function monthShort(date: Date) {
    return t(`monthsShort.${MONTH_KEYS[date.getUTCMonth()]}`);
  }

  /** "Mar 2024" for a month, "Mar 3 – Mar 9" for a week. */
  function periodLabel(): string {
    if (!dateRange) return "";

    const { start, end } = dateRange;
    return calendarPeriod === "week"
      ? `${monthShort(start)} ${start.getUTCDate()} – ${monthShort(end)} ${end.getUTCDate()}`
      : `${monthShort(start)} ${start.getUTCFullYear()}`;
  }

  const showsPeriodNav = canShiftPeriod && !trackerData?.ui?.hideYear;
  const showsYearNav =
    !trackerData?.ui?.hideYear && !dateRange && !calendarPeriod;

  return (
    <div className="heatmap-tracker-header">
      <div className="heatmap-tracker-header__main-row">
        <div className="heatmap-tracker-header__navigation">
          {showsYearNav ? (
            <>
              <button
                className="heatmap-tracker-arrow left clickable-icon"
                aria-label={t("header.previousYear")}
                onClick={() => setCurrentYear((prev) => prev - 1)}
              >
                <ChevronLeftIcon />
              </button>
              <div className="heatmap-tracker-year-display">{currentYear}</div>
              <button
                className="heatmap-tracker-arrow right clickable-icon"
                aria-label={t("header.nextYear")}
                onClick={() => setCurrentYear((prev) => prev + 1)}
              >
                <ChevronRightIcon />
              </button>
            </>
          ) : null}
          {showsPeriodNav ? (
            <>
              <button
                className="heatmap-tracker-arrow left clickable-icon"
                aria-label={t(`header.previous.${calendarPeriod}`)}
                onClick={() => shiftPeriod(-1)}
              >
                <ChevronLeftIcon />
              </button>
              <div className="heatmap-tracker-year-display">
                {periodLabel()}
              </div>
              <button
                className="heatmap-tracker-arrow right clickable-icon"
                aria-label={t(`header.next.${calendarPeriod}`)}
                onClick={() => shiftPeriod(1)}
              >
                <ChevronRightIcon />
              </button>
            </>
          ) : null}
        </div>

        {trackerData?.ui?.hideTitle ? null : (
          <div
            className="heatmap-tracker-header__title"
            dangerouslySetInnerHTML={{
              __html: trackerData?.heatmapTitle ?? "",
            }}
          />
        )}
        {trackerData?.ui?.hideTabs ? null : <HeatmapTabs />}
      </div>
      {trackerData?.ui?.hideSubtitle ? null : trackerData?.heatmapSubtitle ? (
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
