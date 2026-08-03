import i18n from "i18next";
import { initReactI18next } from "react-i18next";
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

// don't want to use this?
// have a look at the Quick start guide
// for passing in lng and translations on init

i18n
  // pass the i18n instance to react-i18next.
  .use(initReactI18next)
  // init i18next
  // for all options read: https://www.i18next.com/overview/configuration-options
  .init({
    fallbackLng: "en",
    debug: false,

    interpolation: {
      escapeValue: false, // not needed for react as it escapes by default
    },
    supportedLngs: Object.keys(languages),
    resources: {
      en: {
        translation: en,
      },
      ru: {
        translation: ru,
      },
      de: {
        translation: de,
      },
      es: {
        translation: es,
      },
      fr: {
        translation: fr,
      },
      pt: {
        translation: pt,
      },
      pl: {
        translation: pl,
      },
      hi: {
        translation: hi,
      },
      zh: {
        translation: zh,
      },
    },
  });

export default i18n;
