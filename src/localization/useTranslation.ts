import { useEffect, useMemo, useState } from "react";
import i18n, { TranslationParams } from "./i18n";

export interface UseTranslationResult {
  t: (key: string, params?: TranslationParams) => string;
  i18n: typeof i18n;
}

/**
 * Drop-in replacement for `react-i18next`'s hook, limited to the surface the
 * plugin uses: `t` and the `i18n` instance. Components re-render on language
 * change because the subscription updates local state.
 */
export function useTranslation(): UseTranslationResult {
  const [language, setLanguage] = useState(i18n.language);

  useEffect(() => {
    // Read once on mount too: the language may have changed between render
    // and effect (main.tsx switches it during `onload`).
    setLanguage(i18n.language);
    return i18n.onLanguageChanged(setLanguage);
  }, []);

  // `t` must get a NEW identity per language, exactly as react-i18next's did:
  // views list it in `useMemo`/`useCallback` dependency arrays to recompute
  // translated labels, and a permanently stable function would freeze those
  // labels in whatever language was active on first render.
  const t = useMemo(
    () => (key: string, params?: TranslationParams) => i18n.t(key, params),
    [language],
  );

  return { t, i18n };
}
