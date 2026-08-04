/**
 * Funding links and the rules for when the supporter card is allowed to appear.
 *
 * The card is deliberately hard to trigger: it only shows once a user has a
 * genuine tracking streak behind them, and dismissing it is permanent. Asking
 * at a moment of demonstrated value converts far better than a persistent
 * banner, and it avoids the nagging that Obsidian users rightly dislike.
 */

export const FUNDING_LINKS = {
  buyMeACoffee: "https://www.buymeacoffee.com/mrubanau",
  koFi: "https://ko-fi.com/mrubanau",
} as const;

/**
 * Minimum longest-streak (in days) before the supporter card is shown.
 * Someone who has kept a habit for a month has gotten real value out of the
 * plugin; someone who installed it yesterday has not.
 */
export const SUPPORTER_CARD_MIN_STREAK = 14;
