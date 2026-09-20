import i18n from "src/localization/i18n";

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
    const english = i18n.t("report.defaultTitle");
    await i18n.changeLanguage("de");

    // `report.*` only exists in en.json and ru.json.
    expect(i18n.t("report.defaultTitle")).toBe(english);
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
