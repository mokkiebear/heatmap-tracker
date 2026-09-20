import { act, render, screen } from "@testing-library/react";
import React from "react";
import i18n from "src/localization/i18n";
import { useTranslation } from "src/localization/useTranslation";

function Probe() {
  const { t } = useTranslation();
  return <span data-testid="label">{t("monthsShort.January")}</span>;
}

describe("useTranslation", () => {
  afterEach(async () => {
    await act(async () => {
      await i18n.changeLanguage("en");
    });
  });

  it("re-renders the component when the language changes", async () => {
    render(<Probe />);
    const english = screen.getByTestId("label").textContent;

    await act(async () => {
      await i18n.changeLanguage("ru");
    });

    expect(screen.getByTestId("label").textContent).not.toBe(english);
  });

  it("hands out a new `t` identity per language", async () => {
    // Views list `t` in useMemo dependency arrays to recompute translated
    // labels (MonthlyHeatmapView does). A permanently stable `t` freezes those
    // labels in the language active at first render.
    const identities: Array<(key: string) => string> = [];

    function Collector() {
      const { t } = useTranslation();
      identities.push(t);
      return null;
    }

    render(<Collector />);
    const first = identities[identities.length - 1];

    await act(async () => {
      await i18n.changeLanguage("ru");
    });

    expect(identities[identities.length - 1]).not.toBe(first);
  });

  it("stops updating after unmount", async () => {
    const { unmount } = render(<Probe />);
    unmount();

    // A listener leaked past unmount would set state on an unmounted tree and
    // fail the test through React's warning-as-error setup.
    await act(async () => {
      await i18n.changeLanguage("ru");
    });

    expect(i18n.language).toBe("ru");
  });
});
