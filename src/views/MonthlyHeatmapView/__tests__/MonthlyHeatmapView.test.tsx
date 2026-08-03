import { render } from "@testing-library/react";
import MonthlyHeatmapView from "../MonthlyHeatmapView";
import { HeatmapContext } from "src/context/heatmap/heatmap.context";
import { AppContext } from "src/context/app/app.context";
import { Entry } from "src/types";
import { getToday } from "src/utils/date";

jest.mock("react-i18next", () => ({
  ...jest.requireActual("react-i18next"),
  useTranslation: jest.fn(() => ({
    t: (key: string) => key,
  })),
}));

jest.mock("src/utils/date", () => ({
  ...jest.requireActual("src/utils/date"),
  getToday: jest.fn(),
}));

const colorsList = ["#aaa", "#bbb", "#ccc"];

function renderView({
  currentYear = 2024,
  dateRange = null,
  entriesWithIntensityByDate = {},
  showCurrentDayBorder = false,
}: {
  currentYear?: number;
  dateRange?: { start: Date; end: Date } | null;
  entriesWithIntensityByDate?: Record<string, Entry>;
  showCurrentDayBorder?: boolean;
} = {}) {
  return render(
    <AppContext.Provider value={{} as never}>
      <HeatmapContext.Provider
        value={
          {
            currentYear,
            dateRange,
            entriesWithIntensityByDate,
            colorsList,
            trackerData: { showCurrentDayBorder },
          } as never
        }
      >
        <MonthlyHeatmapView />
      </HeatmapContext.Provider>
    </AppContext.Provider>,
  );
}

/** Day cells only — the padding cells past a month's end carry no date. */
function dayBoxes(container: HTMLElement) {
  return Array.from(
    container.querySelectorAll<HTMLElement>(
      ".heatmap-tracker-box[data-htp-date]",
    ),
  );
}

describe("MonthlyHeatmapView", () => {
  beforeEach(() => {
    (getToday as jest.Mock).mockImplementation(() => new Date("2024-05-05"));
  });

  it("renders one row per month of the year with a 31-column grid", () => {
    const { container } = renderView();

    expect(container.querySelectorAll(".monthly-heatmap-label")).toHaveLength(
      // 12 month labels + the empty corner cell above them.
      13,
    );
    expect(
      container.querySelectorAll(".monthly-heatmap-day-header"),
    ).toHaveLength(31);
  });

  it("emits a day cell for every real day and a filler for the rest", () => {
    const { container } = renderView({ currentYear: 2024 });

    // 2024 is a leap year.
    expect(dayBoxes(container)).toHaveLength(366);
    // Each month is padded out to 31 columns: 12 * 31 - 366 fillers.
    expect(container.querySelectorAll(".monthly-heatmap-empty")).toHaveLength(
      12 * 31 - 366,
    );
  });

  it("pads February correctly on a non-leap year", () => {
    const { container } = renderView({ currentYear: 2023 });

    expect(dayBoxes(container)).toHaveLength(365);
    expect(container.querySelectorAll(".monthly-heatmap-empty")).toHaveLength(
      12 * 31 - 365,
    );
    expect(container.querySelector('[data-htp-date="2023-02-29"]')).toBeNull();
  });

  it("colors a day from its intensity and marks days with data", () => {
    const { container } = renderView({
      entriesWithIntensityByDate: {
        "2024-03-10": { date: "2024-03-10", intensity: 2, value: 5 },
      },
    });

    const box = container.querySelector<HTMLElement>(
      '[data-htp-date="2024-03-10"]',
    );
    expect(box?.classList.contains("hasData")).toBe(true);
    // colorsList is indexed by intensity - 1.
    expect(box?.style.backgroundColor).toBe("rgb(187, 187, 187)");

    expect(
      container
        .querySelector('[data-htp-date="2024-03-11"]')
        ?.classList.contains("isEmpty"),
    ).toBe(true);
  });

  it("lets customColor override the intensity color", () => {
    const { container } = renderView({
      entriesWithIntensityByDate: {
        "2024-03-10": {
          date: "2024-03-10",
          intensity: 2,
          customColor: "#FF9F1C",
        },
      },
    });

    expect(
      container.querySelector<HTMLElement>('[data-htp-date="2024-03-10"]')
        ?.style.backgroundColor,
    ).toBe("rgb(255, 159, 28)");
  });

  it("marks today and honours showCurrentDayBorder", () => {
    const { container } = renderView({ showCurrentDayBorder: true });

    const today = container.querySelectorAll(".heatmap-tracker-box.today");
    expect(today).toHaveLength(1);
    expect(today[0].getAttribute("data-htp-date")).toBe("2024-05-05");
    expect(today[0].classList.contains("with-border")).toBe(true);
  });

  it("omits the border on today when showCurrentDayBorder is off", () => {
    const { container } = renderView({ showCurrentDayBorder: false });

    expect(
      container
        .querySelector(".heatmap-tracker-box.today")
        ?.classList.contains("with-border"),
    ).toBe(false);
  });

  it("spans only the months of an explicit dateRange, across a year boundary", () => {
    const { container } = renderView({
      dateRange: {
        start: new Date(Date.UTC(2023, 10, 15)),
        end: new Date(Date.UTC(2024, 1, 3)),
      },
    });

    // Nov + Dec 2023, Jan + Feb 2024 — whole months, not clipped to the range.
    expect(container.querySelectorAll(".monthly-heatmap-label")).toHaveLength(
      4 + 1,
    );
    expect(dayBoxes(container)).toHaveLength(30 + 31 + 31 + 29);
    expect(
      container.querySelector('[data-htp-date="2023-11-01"]'),
    ).not.toBeNull();
    expect(
      container.querySelector('[data-htp-date="2024-02-29"]'),
    ).not.toBeNull();
    expect(container.querySelector('[data-htp-date="2024-03-01"]')).toBeNull();
  });
});
