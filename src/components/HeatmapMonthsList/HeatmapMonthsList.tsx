import { useTranslation } from "src/localization/useTranslation";

export function HeatmapMonthsList() {
  const { t } = useTranslation();
  return (
    <div className="heatmap-tracker-months">
      {[
        t("monthsShort.January"),
        t("monthsShort.February"),
        t("monthsShort.March"),
        t("monthsShort.April"),
        t("monthsShort.May"),
        t("monthsShort.June"),
        t("monthsShort.July"),
        t("monthsShort.August"),
        t("monthsShort.September"),
        t("monthsShort.October"),
        t("monthsShort.November"),
        t("monthsShort.December"),
      ].map((month) => (
        <div key={month}>{month}</div>
      ))}
    </div>
  );
}
