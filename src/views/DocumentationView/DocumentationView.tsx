import { useTranslation } from "src/localization/useTranslation";
import { TrackerDataSchema } from "src/schemas/trackerData.schema";

const README_URL =
  "https://github.com/mokkiebear/heatmap-tracker#-configuration-reference";
const EXAMPLE_VAULT_URL =
  "https://github.com/mokkiebear/heatmap-tracker/tree/main/EXAMPLE_VAULT";
const WEBSITE_URL = "https://mokkiebear.github.io/heatmap-tracker/";

/**
 * A one-line summary per `trackerData` parameter. Long-form docs (types,
 * defaults, examples) live in the README — this tab exists to tell you what a
 * parameter is called and whether it exists, not to restate the reference.
 *
 * Keys are checked against `TrackerDataSchema` by the view's test, so adding a
 * parameter to the schema without describing it here fails the suite instead of
 * silently shipping a gap: the previous hand-written version drifted to
 * documenting 8 of 19 parameters.
 */
const PARAMETER_SUMMARY_KEYS: Record<
  keyof typeof TrackerDataSchema.shape,
  string
> = {
  year: "docs.params.year",
  colorScheme: "docs.params.colorScheme",
  entries: "docs.params.entries",
  showCurrentDayBorder: "docs.params.showCurrentDayBorder",
  basePath: "docs.params.basePath",
  intensityConfig: "docs.params.intensityConfig",
  separateMonths: "docs.params.separateMonths",
  heatmapTitle: "docs.params.heatmapTitle",
  heatmapSubtitle: "docs.params.heatmapSubtitle",
  insights: "docs.params.insights",
  disableFileCreation: "docs.params.disableFileCreation",
  ui: "docs.params.ui",
  layout: "docs.params.layout",
  startDate: "docs.params.startDate",
  endDate: "docs.params.endDate",
  daysToShow: "docs.params.daysToShow",
  monthsToShow: "docs.params.monthsToShow",
  tags: "docs.params.tags",
  filters: "docs.params.filters",
};

/** Ordered by how likely you are to reach for it, not alphabetically. */
const PARAMETER_ORDER: (keyof typeof TrackerDataSchema.shape)[] = [
  "entries",
  "year",
  "heatmapTitle",
  "heatmapSubtitle",
  "colorScheme",
  "intensityConfig",
  "layout",
  "separateMonths",
  "showCurrentDayBorder",
  "monthsToShow",
  "daysToShow",
  "startDate",
  "endDate",
  "basePath",
  "disableFileCreation",
  "insights",
  "tags",
  "filters",
  "ui",
];

const EXAMPLE = ["```heatmaptracker", "property: steps", "```"].join("\n");

function DocumentationView() {
  const { t } = useTranslation();

  return (
    <div className="documentation-view__container">
      <p className="documentation-view__intro">{t("docs.intro")}</p>

      <h3 className="documentation-view__heading">{t("docs.quickStart")}</h3>
      <pre className="documentation-view__example">
        <code>{EXAMPLE}</code>
      </pre>
      <p className="documentation-view__note">{t("docs.quickStartNote")}</p>

      <h3 className="documentation-view__heading">{t("docs.parameters")}</h3>
      <dl className="documentation-view__params">
        {PARAMETER_ORDER.map((name) => (
          <div key={name} className="documentation-view__param">
            <dt>
              <code>{name}</code>
            </dt>
            <dd>{t(PARAMETER_SUMMARY_KEYS[name])}</dd>
          </div>
        ))}
      </dl>

      <h3 className="documentation-view__heading">{t("docs.moreTitle")}</h3>
      <ul className="documentation-view__links">
        <li>
          <a href={README_URL}>{t("docs.linkReference")}</a>
        </li>
        <li>
          <a href={EXAMPLE_VAULT_URL}>{t("docs.linkExamples")}</a>
        </li>
        <li>
          <a href={WEBSITE_URL}>{t("docs.linkWebsite")}</a>
        </li>
      </ul>
    </div>
  );
}

export default DocumentationView;
