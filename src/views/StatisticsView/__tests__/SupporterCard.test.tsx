import { fireEvent, render } from "@testing-library/react";
import SupporterCard from "../SupporterCard";
import { HeatmapContext } from "src/context/heatmap/heatmap.context";
import { TrackerSettings } from "src/types";
import { SUPPORTER_CARD_MIN_STREAK } from "src/constants/funding";

jest.mock("react-i18next", () => ({
  ...jest.requireActual("react-i18next"),
  useTranslation: jest.fn(() => ({
    t: (key: string) => key,
  })),
}));

function renderCard({
  longestStreak = SUPPORTER_CARD_MIN_STREAK,
  supporterCardDismissed = false,
  updateSettings = jest.fn(),
}: {
  longestStreak?: number;
  supporterCardDismissed?: boolean;
  updateSettings?: jest.Mock;
} = {}) {
  const settings = { supporterCardDismissed } as TrackerSettings;

  const utils = render(
    <HeatmapContext.Provider value={{ settings, updateSettings } as never}>
      <SupporterCard longestStreak={longestStreak} />
    </HeatmapContext.Provider>,
  );

  return { ...utils, updateSettings };
}

function card(container: HTMLElement) {
  return container.querySelector(".heatmap-supporter");
}

describe("SupporterCard", () => {
  it("stays hidden below the streak threshold", () => {
    const { container } = renderCard({
      longestStreak: SUPPORTER_CARD_MIN_STREAK - 1,
    });

    expect(card(container)).toBeNull();
  });

  it("appears once the streak reaches the threshold", () => {
    const { container } = renderCard({
      longestStreak: SUPPORTER_CARD_MIN_STREAK,
    });

    expect(card(container)).not.toBeNull();
  });

  it("stays hidden when it was dismissed previously", () => {
    const { container } = renderCard({
      longestStreak: SUPPORTER_CARD_MIN_STREAK + 100,
      supporterCardDismissed: true,
    });

    expect(card(container)).toBeNull();
  });

  it("renders both funding links", () => {
    const { container } = renderCard();

    const hrefs = Array.from(
      container.querySelectorAll<HTMLAnchorElement>(".heatmap-supporter__link"),
    ).map((a) => a.href);

    expect(hrefs).toHaveLength(2);
    expect(hrefs.some((h) => h.includes("buymeacoffee.com"))).toBe(true);
    expect(hrefs.some((h) => h.includes("ko-fi.com"))).toBe(true);
  });

  it("hides itself and persists the dismissal when dismissed", () => {
    const updateSettings = jest.fn();
    const { container } = renderCard({ updateSettings });

    const dismissButton = container.querySelector<HTMLButtonElement>(
      ".heatmap-supporter__dismiss",
    );
    expect(dismissButton).not.toBeNull();

    fireEvent.click(dismissButton as HTMLButtonElement);

    expect(updateSettings).toHaveBeenCalledWith({
      supporterCardDismissed: true,
    });
    expect(card(container)).toBeNull();
  });
});
