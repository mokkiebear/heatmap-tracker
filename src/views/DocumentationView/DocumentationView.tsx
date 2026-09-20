import { useTranslation } from "src/localization/useTranslation";
import { TrackerDataSchema } from "src/schemas/trackerData.schema";

const README_URL =
  "https://github.com/mokkiebear/heatmap-tracker#-configuration-reference";
const EXAMPLE_VAULT_URL =
  "https://github.com/mokkiebear/heatmap-tracker/tree/main/EXAMPLE_VAULT";
const WEBSITE_URL = "https://mokkiebear.github.io/heatmap-tracker/";

/**
 * Ordered by how likely you are to reach for it, not alphabetically. Each name
 * renders `docs.params.<name>` from the locale files.
 */
const PARAMETER_ORDER = [
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
] as const satisfies readonly (keyof typeof TrackerDataSchema.shape)[];

/**
 * Fails to compile if a parameter is added to the schema without being listed
 * above — the previous hand-written view drifted to documenting 8 of 19.
 */
type UndocumentedParameter = Exclude<
  keyof typeof TrackerDataSchema.shape,
  (typeof PARAMETER_ORDER)[number]
>;
const _allParametersDocumented: [UndocumentedParameter] extends [never]
  ? true
  : UndocumentedParameter = true;
void _allParametersDocumented;

const EXAMPLE = ["```heatmaptracker", "property: steps", "```"].join("\n");

function DocumentationView() {
  const { t } = useTranslation();

  return (
    <div className="documentation-view__container">
      <p className="documentation-view__intro">{t("docs.intro")}</p>
      <p className="documentation-view__note">{t("docs.modalTip")}</p>

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
            <dd>{t(`docs.params.${name}`)}</dd>
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
