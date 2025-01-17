import { useTranslation } from "react-i18next";

export function HeatmapMonthsList() {
  const { t } = useTranslation();
  return (
    <div className="months">
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
