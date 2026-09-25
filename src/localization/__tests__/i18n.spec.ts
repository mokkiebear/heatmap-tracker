import i18n from "src/localization/i18n";
import de from "src/localization/locales/de.json";

describe("i18n", () => {
  afterEach(async () => {
    await i18n.changeLanguage("en");
  });

  it("resolves a dotted key from the active language", async () => {
    await i18n.changeLanguage("ru");

    expect(i18n.language).toBe("ru");
    expect(i18n.t("monthsShort.January")).not.toBe("monthsShort.January");
    expect(i18n.t("monthsShort.January")).not.toBe(
      // Russian must differ from English, otherwise the lookup silently fell
      // through to the fallback and this test would prove nothing.
      "Jan",
    );
  });

  it("interpolates {{named}} placeholders", () => {
    expect(i18n.t("box.value", { value: 42 })).toContain("42");
  });

  it("leaves a placeholder untouched when no value is supplied", () => {
    expect(i18n.t("box.value")).toContain("{{value}}");
  });

  it("falls back to English for a key missing in the active language", async () => {
    // Every locale is complete now (localeCompleteness.spec.ts enforces it), so
    // the gap has to be made: de.json is the same object i18n holds in
    // `resources`, so deleting a leaf here removes it from the active language.
    const english = i18n.t("report.defaultTitle");
    const report = (de as unknown as Record<string, Record<string, string>>)
      .report;
    const german = report.defaultTitle;
    delete report.defaultTitle;

    try {
      await i18n.changeLanguage("de");
      expect(i18n.t("report.defaultTitle")).toBe(english);
    } finally {
      report.defaultTitle = german;
    }
  });

  it("resolves a flat top-level key that contains dots", () => {
    // The locale files mix shapes: `support.*` are flat keys with dots in the
    // name, not a nested `support` object. Walking the dots finds nothing and
    // the settings tab renders the raw key.
    expect(i18n.t("support.header")).not.toBe("support.header");
    expect(i18n.t("support.cta")).not.toBe("support.cta");
  });

  it("falls back to English for a flat dotted key too", async () => {
    const english = i18n.t("support.text1");
    await i18n.changeLanguage("de");

    expect(i18n.t("support.text1")).not.toBe("support.text1");
    // de.json has its own translation, so it must differ from the English one.
    expect(i18n.t("support.text1")).not.toBe(english);
  });

  it("returns the key itself when nothing matches", () => {
    expect(i18n.t("definitely.not.a.real.key")).toBe(
      "definitely.not.a.real.key",
    );
  });

  it("returns the key when it resolves to a subtree rather than a string", () => {
    expect(i18n.t("monthsShort")).toBe("monthsShort");
  });

  it("ignores an unsupported language instead of blanking the UI", async () => {
    await i18n.changeLanguage("kl");

    expect(i18n.language).toBe("en");
  });

  it("notifies subscribers on change and stops after unsubscribe", async () => {
    const listener = jest.fn();
    const unsubscribe = i18n.onLanguageChanged(listener);

    await i18n.changeLanguage("fr");
    expect(listener).toHaveBeenCalledWith("fr");

    // Re-selecting the current language is a no-op: no redundant re-render.
    await i18n.changeLanguage("fr");
    expect(listener).toHaveBeenCalledTimes(1);

    unsubscribe();
    await i18n.changeLanguage("es");
    expect(listener).toHaveBeenCalledTimes(1);
  });
});
