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
      changeLanguage: jest.fn(),
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
    customColors: [
      "#F0FDF4",
      "#DCFCE7",
      "#BBF7D0",
      "#86EFAC",
      "#4ADE80",
    ],
  },
  intensityConfig: {
    ...DEFAULT_TRACKER_DATA.intensityConfig,
    defaultIntensity: 2,
    scaleStart: 500,
    scaleEnd: 10000,
    showOutOfRange: false,
  },
  intensityScaleStart: 500,
  intensityScaleEnd: 10000,
  defaultEntryIntensity: 2,
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
  intensityScaleStart: 1000,
  intensityScaleEnd: 11000,
  defaultEntryIntensity: 6,
  entries: Array.from({ length: 10 }).map((_, index) => ({
    date: `2023-${String(index + 1).padStart(2, "0")}-${String(
      (index % 3) + 1
    ).padStart(2, "0")}`,
    intensity: (index + 1) * 1000,
    content: `Block ${(index + 1) * 1000} steps`,
  })),
};

const legacyColorsTrackerData =
  ({
    year: 2024,
    entries: [
      {
        date: "2024-01-05",
        intensity: 4,
        content: "Legacy color entry",
      },
    ],
    colors: ["#c6e48b", "#7bc96f", "#49af5d"],
  }) as Partial<TrackerData>;

async function waitForComponentToRender() {
  await act(async () => {
    await new Promise((resolve) => setTimeout(resolve, 0));
  });
}

async function renderReactAppWithOverrides(
  trackerOverrides: Partial<TrackerData> = {},
  settingsOverrides: Partial<TrackerSettings> = {}
) {
  const trackerData = mergeTrackerData(
    DEFAULT_TRACKER_DATA,
    trackerOverrides as TrackerData
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
    </AppContext.Provider>
  );

  await waitForComponentToRender();

  return renderResult;
}

describe("ReactApp component", () => {
  beforeEach(() => {
    // This is today date for tests: 2024-05-05
    (getToday as jest.Mock).mockImplementation(() => new Date("2024-05-05"));
  });

  it("renders correctly and matches snapshot", async () => {
    const { asFragment } = await renderReactAppWithOverrides(
      trackerDataMock as TrackerData
    );
    expect(asFragment()).toMatchSnapshot();
  });

  it("renders correctly and matches snapshot for year 2022", async () => {
    const trackerData = {
      ...(trackerDataMock as TrackerData),
      year: 2022,
    };

    const { asFragment } = await renderReactAppWithOverrides(
      trackerData as TrackerData
    );

    expect(asFragment()).toMatchSnapshot();
  });

  it("should use paletteName instead of customColors", async () => {
    const trackerData = {
      ...(trackerDataMock as TrackerData),
      colorScheme: undefined,
    } as unknown as TrackerData;

    const { asFragment } = await renderReactAppWithOverrides(
      trackerData
    );

    expect(asFragment()).toMatchSnapshot();
  });

  it("renders tracker view with custom title, subtitle, and entries", async () => {
    const { asFragment } = await renderReactAppWithOverrides(
      docsInspiredTrackerData
    );

    expect(asFragment()).toMatchSnapshot();
  });

  it("renders statistics view with user insights", async () => {
    const renderResult = await renderReactAppWithOverrides(
      docsInspiredTrackerData
    );

    fireEvent.click(
      renderResult.getByLabelText("view.heatmap-tracker-statistics")
    );

    await waitForComponentToRender();

    expect(renderResult.asFragment()).toMatchSnapshot();
  });

  it("renders legend view for extended palette configurations", async () => {
    const renderResult = await renderReactAppWithOverrides(
      extendedPaletteTrackerData
    );

    fireEvent.click(renderResult.getByLabelText("view.legend"));

    await waitForComponentToRender();

    expect(renderResult.asFragment()).toMatchSnapshot();
  });

  it("shows documentation warning when legacy colors prop is provided", async () => {
    const { asFragment } = await renderReactAppWithOverrides(
      legacyColorsTrackerData as TrackerData
    );

    expect(asFragment()).toMatchSnapshot();
  });
});
