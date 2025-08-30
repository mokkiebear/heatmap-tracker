import { HeatmapProvider } from "../context/heatmap/heatmap.context";
import ReactApp from "../App";
import { act, render } from "@testing-library/react";
import { settingsMock } from "../__mocks__/settings.mock";
import { mergeTrackerData } from "src/utils/core";
import { AppContext, DEFAULT_TRACKER_DATA } from "../main";
import { trackerDataMock } from "src/__mocks__/trackerData.mock";
import { getToday } from "src/utils/date";

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

describe("ReactApp component", () => {
  beforeEach(() => {
    // This is today date for tests: 2024-05-05
    (getToday as jest.Mock).mockImplementation(() => new Date("2024-05-05"));
  });

  it("renders correctly and matches snapshot", async () => {
    const { asFragment } = await render(
      <AppContext.Provider value={{} as any}>
        <HeatmapProvider
          trackerData={mergeTrackerData(
            DEFAULT_TRACKER_DATA,
            trackerDataMock as any
          )}
          settings={settingsMock}
        >
          <ReactApp />
        </HeatmapProvider>
      </AppContext.Provider>
    );

    // Wait for all promises inside Suspense to resolve
    await act(async () => {
      // Simulate any asynchronous behavior like data fetching
      await new Promise((resolve) => setTimeout(resolve, 0));
    });

    expect(asFragment()).toMatchSnapshot();
  });

  it("renders correctly and matches snapshot for year 2022", async () => {
    const trackerData = {
      ...trackerDataMock,
      year: 2022,
    };

    const { asFragment } = await render(
      <AppContext.Provider value={{} as any}>
        <HeatmapProvider
          trackerData={mergeTrackerData(
            DEFAULT_TRACKER_DATA,
            trackerData as any
          )}
          settings={settingsMock}
        >
          <ReactApp />
        </HeatmapProvider>
      </AppContext.Provider>
    );

    // Wait for all promises inside Suspense to resolve
    await act(async () => {
      // Simulate any asynchronous behavior like data fetching
      await new Promise((resolve) => setTimeout(resolve, 0));
    });

    expect(asFragment()).toMatchSnapshot();
  });

  it("should use paletteName instead of customColors", async () => {
    const trackerData = {
      ...trackerDataMock,
      colorScheme: undefined,
    };

    const { asFragment } = await render(
      <AppContext.Provider value={{} as any}>
        <HeatmapProvider
          trackerData={mergeTrackerData(
            DEFAULT_TRACKER_DATA,
            trackerData as any
          )}
          settings={settingsMock}
        >
          <ReactApp />
        </HeatmapProvider>
      </AppContext.Provider>
    );

    // Wait for all promises inside Suspense to resolve
    await act(async () => {
      // Simulate any asynchronous behavior like data fetching
      await new Promise((resolve) => setTimeout(resolve, 0));
    });

    expect(asFragment()).toMatchSnapshot();
  });
});
