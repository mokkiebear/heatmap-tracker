import { useState } from "react";
import { useTranslation } from "react-i18next";
import { useHeatmapContext } from "src/context/heatmap/heatmap.context";
import {
  FUNDING_LINKS,
  SUPPORTER_CARD_MIN_STREAK,
} from "src/constants/funding";

interface SupporterCardProps {
  /** Longest streak in the current dataset, used to gate the card. */
  longestStreak: number;
}

/**
 * A one-time, dismissible support request shown at the bottom of the
 * Statistics view.
 *
 * It appears only after the user has a streak worth being proud of, and
 * dismissing it writes to plugin settings so it never returns.
 */
function SupporterCard({ longestStreak }: SupporterCardProps) {
  const { t } = useTranslation();
  const { settings, updateSettings } = useHeatmapContext();

  // Mirrors the persisted flag so the card disappears immediately on dismiss,
  // without waiting for a settings round-trip.
  const [isDismissed, setIsDismissed] = useState(
    Boolean(settings.supporterCardDismissed),
  );

  if (isDismissed || longestStreak < SUPPORTER_CARD_MIN_STREAK) {
    return null;
  }

  function dismiss() {
    setIsDismissed(true);
    updateSettings({ supporterCardDismissed: true });
  }

  return (
    <div className="heatmap-supporter">
      <div className="heatmap-supporter__title">{t("supporter.title")}</div>
      <p className="heatmap-supporter__body">{t("supporter.body")}</p>

      <div className="heatmap-supporter__actions">
        <a
          className="heatmap-supporter__link"
          href={FUNDING_LINKS.buyMeACoffee}
          target="_blank"
          rel="noopener noreferrer"
        >
          {t("supporter.buyMeACoffee")}
        </a>
        <a
          className="heatmap-supporter__link"
          href={FUNDING_LINKS.koFi}
          target="_blank"
          rel="noopener noreferrer"
        >
          {t("supporter.koFi")}
        </a>
        <button
          type="button"
          className="heatmap-supporter__dismiss"
          onClick={dismiss}
          aria-label={t("supporter.dismissAria")}
        >
          {t("supporter.dismiss")}
        </button>
      </div>
    </div>
  );
}

export default SupporterCard;
