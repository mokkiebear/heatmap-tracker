import { fireEvent, render } from "@testing-library/react";
import { HeatmapBox } from "../HeatmapBox";
import { HeatmapContext } from "src/context/heatmap/heatmap.context";
import { AppContext } from "src/context/app/app.context";
import { Box, TrackerData, TrackerSettings } from "src/types";
import { handleBoxClick } from "src/utils/heatmapBox";

jest.mock("src/utils/heatmapBox", () => ({
  handleBoxClick: jest.fn(),
}));

jest.mock("react-i18next", () => ({
  ...jest.requireActual("react-i18next"),
  useTranslation: jest.fn(() => ({
    t: (key: string, options?: Record<string, unknown>) =>
      options?.value !== undefined ? `${key}=${options.value}` : key,
  })),
}));

const mockSettings = {
  language: "en",
} as unknown as TrackerSettings;

const mockTrackerData = {
  year: 2024,
  entries: [],
} as unknown as TrackerData;

function renderBox(box: Box) {
  return render(
    <AppContext.Provider value={{} as any}>
      <HeatmapContext.Provider
        value={
          {
            settings: mockSettings,
            trackerData: mockTrackerData,
            currentYear: 2024,
          } as any
        }
      >
        <HeatmapBox box={box} />
      </HeatmapContext.Provider>
    </AppContext.Provider>,
  );
}

describe("HeatmapBox accessibility", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it("exposes the tracked value in the accessible name", () => {
    const { container } = renderBox({
      date: "2024-01-01",
      hasData: true,
      value: 42,
    });

    expect(
      container
        .querySelector(".heatmap-tracker-box")
        ?.getAttribute("aria-label"),
    ).toBe("2024-01-01, box.value=42");
  });

  it("falls back to a no-data label when the day has no value", () => {
    const { container } = renderBox({ date: "2024-01-01", hasData: false });

    expect(
      container
        .querySelector(".heatmap-tracker-box")
        ?.getAttribute("aria-label"),
    ).toBe("2024-01-01, box.noData");
  });

  it("activates on Enter", () => {
    const { container } = renderBox({ date: "2024-01-01" });
    const element = container.querySelector(".heatmap-tracker-box")!;

    fireEvent.keyDown(element, { key: "Enter" });

    expect(handleBoxClick).toHaveBeenCalledTimes(1);
  });

  it("activates on Space", () => {
    const { container } = renderBox({ date: "2024-01-01" });
    const element = container.querySelector(".heatmap-tracker-box")!;

    fireEvent.keyDown(element, { key: " " });

    expect(handleBoxClick).toHaveBeenCalledTimes(1);
  });

  it("ignores unrelated keys", () => {
    const { container } = renderBox({ date: "2024-01-01" });
    const element = container.querySelector(".heatmap-tracker-box")!;

    fireEvent.keyDown(element, { key: "a" });

    expect(handleBoxClick).not.toHaveBeenCalled();
  });

  it("keeps spacer boxes out of the tab order and the a11y tree", () => {
    const { container } = renderBox({ isSpaceBetweenBox: true });
    const element = container.querySelector(".heatmap-tracker-box")!;

    expect(element.getAttribute("tabindex")).toBeNull();
    expect(element.getAttribute("role")).toBeNull();
    expect(element.getAttribute("aria-hidden")).toBe("true");
  });

  it("delegates interaction to the anchor when the box links somewhere", () => {
    const { container } = renderBox({
      date: "2024-01-01",
      filePath: "daily notes/2024-01-01.md",
      hasData: true,
      value: 7,
    });

    const element = container.querySelector(".heatmap-tracker-box")!;
    const anchor = container.querySelector(".heatmap-tracker-content")!;

    // No nested interactive element: the wrapper stays a plain container.
    expect(element.getAttribute("role")).toBeNull();
    expect(element.getAttribute("tabindex")).toBeNull();
    expect(anchor.getAttribute("aria-label")).toBe("2024-01-01, box.value=7");
    expect(anchor.getAttribute("data-href")).toBe("daily notes/2024-01-01.md");
  });
});
