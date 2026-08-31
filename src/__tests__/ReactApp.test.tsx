import { HeatmapProvider } from "../context/heatmap/heatmap.context";
import ReactApp from "../App";
import { act, fireEvent, render } from "@testing-library/react";
import { settingsMock } from "../__mocks__/settings.mock";
import { mergeTrackerData } from "src/utils/core";
import { trackerDataMock } from "src/__mocks__/trackerData.mock";
import { getToday } from "src/utils/date";
import { AppContext } from "src/context/app/app.context";
import { DEFAULT_TRACKER_DATA } from "src/constants/defaultTrackerData";
import { TrackerData, TrackerSettings } from "src/types";

jest.mock("react-i18next", () => ({
  ...jest.requireActual("react-i18next"),
  useTranslation: jest.fn(() => ({
    t: (key: string) => key,
    i18n: {
      changeLanguage: jest.fn().mockResolvedValue(undefined),
    },
  })),
}));

jest.mock("src/utils/date", () => ({
  ...jest.requireActual("src/utils/date"),
  getToday: jest.fn(),
}));

const docsInspiredTrackerData: Partial<TrackerData> = {
  year: 2024,
  basePath: "daily notes",
  heatmapTitle: "<b>👣 Steps Tracker 👣</b>",
  heatmapSubtitle: "<i>Daily target: 8k steps</i>",
  showCurrentDayBorder: true,
  separateMonths: true,
  colorScheme: {
    customColors: ["#F0FDF4", "#DCFCE7", "#BBF7D0", "#86EFAC", "#4ADE80"],
  },
  intensityConfig: {
    ...DEFAULT_TRACKER_DATA.intensityConfig,
    defaultIntensity: 2,
    scaleStart: 500,
    scaleEnd: 10000,
    showOutOfRange: false,
  },
  entries: [
    {
      date: "2024-01-01",
      filePath: "daily notes/2024-01-01.md",
      intensity: 3200,
      content: "First walk of the year",
    },
    {
      date: "2024-01-02",
      filePath: "daily notes/2024-01-02.md",
      intensity: 8600,
      customColor: "#FF9F1C",
      customHref:
        "obsidian://open?vault=Example&file=daily%20notes%2F2024-01-02",
      content: "<b>Intervals</b>",
    },
    {
      date: "2024-02-14",
      filePath: "daily notes/2024-02-14.md",
      intensity: 1500,
      content: "Slow recovery day",
    },
    {
      date: "2024-03-03",
      filePath: "daily notes/2024-03-03.md",
      intensity: 9700,
      value: 9700,
      customHref: "https://example.com/race-report",
      content: "Race day personal best",
    },
  ],
  insights: [
    {
      name: "🏆 Total Steps This Year",
      calculate: ({ yearEntries }) =>
        yearEntries
          .reduce((sum, entry) => sum + (entry.value ?? 0), 0)
          .toString(),
    },
    {
      name: "🔥 Active Days",
      calculate: ({ yearEntries }) => `${yearEntries.length} days`,
    },
  ],
};

const extendedPaletteTrackerData: Partial<TrackerData> = {
  year: 2023,
  heatmapTitle: "👣 Steps Tracker 👣 (11 intensities instead of 5)",
  colorScheme: {
    customColors: [
      "#f7fcf5",
      "#e5f5e0",
      "#c7e9c0",
      "#a1d99b",
      "#74c476",
      "#41ab5d",
      "#238b45",
      "#006d2c",
      "#00441b",
      "#002d13",
    ],
  },
  intensityConfig: {
    ...DEFAULT_TRACKER_DATA.intensityConfig,
    defaultIntensity: 6,
    scaleStart: 1000,
    scaleEnd: 11000,
    showOutOfRange: true,
  },
  entries: Array.from({ length: 10 }).map((_, index) => ({
    date: `2023-${String(index + 1).padStart(2, "0")}-${String(
      (index % 3) + 1,
    ).padStart(2, "0")}`,
    intensity: (index + 1) * 1000,
    content: `Block ${(index + 1) * 1000} steps`,
  })),
};

const legacyColorsTrackerData = {
  year: 2024,
  entries: [
    {
      date: "2024-01-05",
      intensity: 4,
      content: "Legacy color entry",
    },
  ],
  colors: ["#c6e48b", "#7bc96f", "#49af5d"],
} as Partial<TrackerData>;

async function waitForComponentToRender() {
  await act(async () => {
    await new Promise((resolve) => setTimeout(resolve, 0));
  });
}

async function renderReactAppWithOverrides(
  trackerOverrides: Partial<TrackerData> = {},
  settingsOverrides: Partial<TrackerSettings> = {},
) {
  const trackerData = mergeTrackerData(
    DEFAULT_TRACKER_DATA,
    trackerOverrides as TrackerData,
  );

  const settings: TrackerSettings = {
    ...settingsMock,
    ...settingsOverrides,
  };

  const renderResult = render(
    <AppContext.Provider value={{} as any}>
      <HeatmapProvider trackerData={trackerData} settings={settings}>
        <ReactApp />
      </HeatmapProvider>
    </AppContext.Provider>,
  );

  await waitForComponentToRender();

  return renderResult;
}

/** Only the real day cells — spacers and the pre-January padding carry no date. */
function dayBoxes(container: HTMLElement) {
  return Array.from(
    container.querySelectorAll<HTMLElement>(
      ".heatmap-tracker-box[data-htp-date]",
    ),
  );
}

function filledBoxes(container: HTMLElement) {
  return dayBoxes(container).filter((box) => box.classList.contains("hasData"));
}

function backgroundColorsOf(boxes: HTMLElement[]) {
  return new Set(boxes.map((box) => box.style.backgroundColor));
}

describe("ReactApp component", () => {
  beforeEach(() => {
    // This is today date for tests: 2024-05-05
    (getToday as jest.Mock).mockImplementation(() => new Date("2024-05-05"));
  });

  it("renders one box per day of the tracked year and colors only the days with entries", async () => {
    const { container, getByText } = await renderReactAppWithOverrides(
      trackerDataMock as TrackerData,
    );

    // 2024 is a leap year.
    expect(dayBoxes(container)).toHaveLength(366);
    expect(getByText("2024")).toBeTruthy();

    // trackerDataMock has 20 entries in April 2024 and 20 in May 2024.
    expect(filledBoxes(container)).toHaveLength(40);
    expect(
      dayBoxes(container).filter((box) => box.classList.contains("isEmpty")),
    ).toHaveLength(366 - 40);

    // Today gets its own marker.
    expect(
      container.querySelectorAll(".heatmap-tracker-box.today"),
    ).toHaveLength(1);
    expect(
      container
        .querySelector<HTMLElement>(".heatmap-tracker-box.today")
        ?.getAttribute("data-htp-date"),
    ).toBe("2024-05-05");
  });

  it("switches the whole grid when a different year is tracked", async () => {
    const { container, getByText } = await renderReactAppWithOverrides({
      ...(trackerDataMock as TrackerData),
      year: 2022,
    } as TrackerData);

    // 2022 is not a leap year.
    expect(dayBoxes(container)).toHaveLength(365);
    expect(getByText("2022")).toBeTruthy();

    // Same entry count as 2024, but sourced from the 2022 dates in the mock.
    expect(filledBoxes(container)).toHaveLength(40);
    expect(
      dayBoxes(container).every((box) =>
        box.getAttribute("data-htp-date")?.startsWith("2022-"),
      ),
    ).toBe(true);

    // 2024-05-05 is not in view, so nothing is marked as today.
    expect(
      container.querySelectorAll(".heatmap-tracker-box.today"),
    ).toHaveLength(0);
  });

  it("falls back to the settings palette when the tracker defines no colorScheme", async () => {
    const { container } = await renderReactAppWithOverrides({
      ...(trackerDataMock as TrackerData),
      colorScheme: undefined,
    } as unknown as TrackerData);

    const used = backgroundColorsOf(filledBoxes(container));
    expect(used.size).toBeGreaterThan(0);

    // Every color comes from settingsMock.palettes.default (5 colors)...
    const paletteColors = new Set([
      "rgb(198, 228, 139)", // #c6e48b
      "rgb(123, 201, 111)", // #7bc96f
      "rgb(73, 175, 93)", // #49af5d
      "rgb(46, 136, 64)", // #2e8840
      "rgb(25, 97, 39)", // #196127
    ]);
    used.forEach((color) => expect(paletteColors.has(color)).toBe(true));

    // ...and none from the 11-color custom scheme the mock would otherwise use.
    expect(used.has("rgb(246, 250, 199)")).toBe(false);
  });

  it("renders title, subtitle, per-entry colors and links", async () => {
    const { container } = await renderReactAppWithOverrides(
      docsInspiredTrackerData,
    );

    expect(
      container.querySelector(".heatmap-tracker-header__title")?.innerHTML,
    ).toBe("<b>👣 Steps Tracker 👣</b>");
    expect(
      container.querySelector(".heatmap-tracker-header__subtitle")?.innerHTML,
    ).toBe("<i>Daily target: 8k steps</i>");

    expect(filledBoxes(container)).toHaveLength(4);

    // `customColor` overrides the intensity-derived color.
    const customColored = container.querySelector<HTMLElement>(
      '[data-htp-date="2024-01-02"]',
    );
    expect(customColored?.style.backgroundColor).toBe("rgb(255, 159, 28)");

    // `customHref` wins over `filePath`.
    expect(customColored?.querySelector("a")?.getAttribute("data-href")).toBe(
      "obsidian://open?vault=Example&file=daily%20notes%2F2024-01-02",
    );

    // Plain entries link to their note.
    expect(
      container
        .querySelector('[data-htp-date="2024-01-01"] a')
        ?.getAttribute("data-href"),
    ).toBe("daily notes/2024-01-01.md");

    // `separateMonths` inserts spacer columns, which are not day cells.
    expect(
      container.querySelectorAll(".heatmap-tracker-box.space-between-box")
        .length,
    ).toBeGreaterThan(0);
  });

  it("renders user insights in the statistics view", async () => {
    const renderResult = await renderReactAppWithOverrides(
      docsInspiredTrackerData,
    );

    fireEvent.click(
      renderResult.getByLabelText("view.heatmap-tracker-statistics"),
    );

    await waitForComponentToRender();

    // The label span holds "<name>: ", so match on the name alone.
    expect(renderResult.getByText(/🏆 Total Steps This Year/)).toBeTruthy();
    expect(renderResult.getByText(/🔥 Active Days/)).toBeTruthy();

    // `value` is filled in from each entry's intensity by the pipeline, so the
    // insight sums all four entries: 3200 + 8600 + 1500 + 9700.
    expect(renderResult.getByText("23000")).toBeTruthy();
    expect(renderResult.getByText("4 days")).toBeTruthy();
  });

  it("renders one legend row per color of an extended palette", async () => {
    const renderResult = await renderReactAppWithOverrides(
      extendedPaletteTrackerData,
    );

    fireEvent.click(renderResult.getByLabelText("view.legend"));

    await waitForComponentToRender();

    const swatches = renderResult.container.querySelectorAll(
      ".legend-view__color-cell",
    );
    expect(swatches).toHaveLength(
      extendedPaletteTrackerData.colorScheme!.customColors!.length,
    );
  });

  it("shows the documentation warning when the legacy colors prop is provided", async () => {
    const { container, getByText } = await renderReactAppWithOverrides(
      legacyColorsTrackerData as TrackerData,
    );

    expect(
      container.querySelector(".heatmap-tracker-footer__important"),
    ).toBeTruthy();
    expect(getByText("Actions Required:")).toBeTruthy();
  });
});
