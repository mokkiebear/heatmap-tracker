---
name: add-language
description: Add a new UI translation to the plugin, or update an existing locale under src/localization/locales/. Use when the request mentions a language, translation, i18n, or a locale code.
---

# Adding a language

1. **Locale file.** Copy `src/localization/locales/en.json` to
   `src/localization/locales/{code}.json` (`fr`, `es`, `pl`, ...) and translate
   the values. Keep every key: a missing key falls back to English silently,
   which reads as a half-translated UI.
2. **Register it.** In `src/localization/i18n.ts`, import the file and add it to
   the `resources` object.
3. **List it.** Add the entry to `src/localization/languages.json` — the settings
   dropdown and the supported-language check in `i18n.ts` both read from it.
4. **README.** Update the language list in [README.md](../../../README.md).
5. **Changelog.** Bullet under `## [Unreleased]` in CHANGELOG.md.

## Check the keys match

```bash
node -e "const a=require('./src/localization/locales/en.json'),b=require('./src/localization/locales/{code}.json');const ka=Object.keys(a),kb=Object.keys(b);console.log('missing:',ka.filter(k=>!kb.includes(k)));console.log('extra:',kb.filter(k=>!ka.includes(k)))"
```

Both lists must be empty.

## What the translation layer supports

`src/localization/i18n.ts` is an in-repo ~1 KB replacement for i18next, not
i18next itself. It handles dot-path keys, `{{name}}` interpolation, and an
English fallback — and nothing else. **Plurals (`key_one` / `key_other`), key
nesting (`$t(...)`), contexts and namespaces are not implemented**: a locale
using them renders the raw template. Phrase the translation to avoid them, or
bring i18next back rather than growing that file.

## Look at it

```bash
npm run harness
```

Set `language` in `harnessSettings` (`harness/fixtures.ts`) to the new code and
check that nothing overflows its container — translated strings are routinely
longer than the English ones, and the header and footer are tight.

## Finish

```bash
npm run verify
```
