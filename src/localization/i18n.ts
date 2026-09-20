import en from "./locales/en.json";
import ru from "./locales/ru.json";
import de from "./locales/de.json";
import es from "./locales/es.json";
import fr from "./locales/fr.json";
import hi from "./locales/hi.json";
import zh from "./locales/zh.json";
import pt from "./locales/pt.json";
import pl from "./locales/pl.json";

import languages from "./languages.json";

/**
 * A ~1 KB stand-in for `i18next` + `react-i18next`, which together weighed
 * ~48 KB minified — 16% of the plugin bundle — to provide four things we
 * actually use: dot-path lookup, `{{name}}` interpolation, an English
 * fallback, and re-rendering views when the language changes.
 *
 * Deliberately NOT supported, because nothing in `src` uses them: plurals
 * (`key_one` / `key_other`), key nesting (`$t(other.key)`), contexts,
 * namespaces, HTML escaping (`escapeValue` was already `false`), backends and
 * language detectors. Needing any of those means bringing `i18next` back
 * rather than growing this file into a second implementation of it.
 */

export type TranslationParams = Record<string, string | number>;

type TranslationTree = { [key: string]: string | TranslationTree };

const FALLBACK_LANGUAGE = "en";

const resources: Record<string, TranslationTree> = {
  en,
  ru,
  de,
  es,
  fr,
  pt,
  pl,
  hi,
  zh,
};

const supportedLanguages = Object.keys(languages);

/**
 * Resolve a dotted key against one language's tree. Returns `undefined` for a
 * missing key *and* for a key that lands on a subtree, so the caller can fall
 * back instead of rendering "[object Object]".
 *
 * A literal key wins over the nested walk: the locale files mix both shapes —
 * `support.header` is a flat top-level key with a dot in its name, while
 * `monthsShort.January` is nested. i18next accepted both (`ignoreJSONStructure`)
 * and the settings tab's support section relies on it, so we do too.
 */
function lookup(tree: TranslationTree, key: string): string | undefined {
  const literal = tree[key];
  if (typeof literal === "string") {
    return literal;
  }

  let node: string | TranslationTree | undefined = tree;

  for (const segment of key.split(".")) {
    if (typeof node !== "object" || node === null) {
      return undefined;
    }
    node = node[segment];
  }

  return typeof node === "string" ? node : undefined;
}

function interpolate(template: string, params?: TranslationParams): string {
  if (!params) {
    return template;
  }

  return template.replace(/\{\{(\w+)\}\}/g, (match, name: string) =>
    name in params ? String(params[name]) : match,
  );
}

type LanguageListener = (language: string) => void;

class I18n {
  /** Not readonly to callers by accident: mutate only via `changeLanguage`. */
  language = FALLBACK_LANGUAGE;

  private readonly listeners = new Set<LanguageListener>();

  t = (key: string, params?: TranslationParams): string => {
    const template =
      lookup(resources[this.language] ?? {}, key) ??
      lookup(resources[FALLBACK_LANGUAGE], key);

    // i18next's behaviour for an unknown key: render the key itself, so a
    // missing translation is visible but never blanks out the UI.
    return template === undefined ? key : interpolate(template, params);
  };

  /**
   * Async to match the call sites, which `await` it or attach `.catch()`.
   * An unsupported code is ignored rather than thrown, so a settings file
   * carrying a language we later dropped keeps rendering in English.
   */
  changeLanguage = async (language: string): Promise<void> => {
    const next = supportedLanguages.includes(language)
      ? language
      : FALLBACK_LANGUAGE;

    if (next === this.language) {
      return;
    }

    this.language = next;
    for (const listener of [...this.listeners]) {
      listener(next);
    }
  };

  onLanguageChanged = (listener: LanguageListener): (() => void) => {
    this.listeners.add(listener);
    return () => this.listeners.delete(listener);
  };
}

const i18n = new I18n();

export default i18n;
