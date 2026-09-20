import { fireEvent, screen } from "@testing-library/react";
import CalendarHeatmapView from "../CalendarHeatmapView";
import ReactApp from "src/App";
import { renderWithHeatmap, TrackerDataOverrides } from "src/test-utils";
import { getToday } from "src/utils/date";

jest.mock("src/utils/date", () => ({
  ...jest.requireActual("src/utils/date"),
  getToday: jest.fn(),
}));

function renderCalendar(
  trackerData: TrackerDataOverrides,
  weekStartDay = 1,
  ui = <CalendarHeatmapView />,
) {
  return renderWithHeatmap(ui, {
    trackerData,
    settings: { weekStartDay },
  });
}

/** Day cells only — leading blanks carry no date. */
function dayBoxes(container: HTMLElement) {
  return Array.from(
    container.querySelectorAll<HTMLElement>(
      ".heatmap-tracker-box[data-htp-date]",
    ),
  );
}

describe("CalendarHeatmapView", () => {
  beforeEach(() => {
    // A Wednesday, so the leading-blank count is non-zero either way.
    (getToday as jest.Mock).mockImplementation(
      () => new Date(Date.UTC(2024, 4, 15)),
    );
  });

  it("draws the current month with one box per day and leading blanks", () => {
    const { container } = renderCalendar({ layout: "month" });

    expect(
      container.querySelectorAll(".calendar-heatmap-day-header"),
    ).toHaveLength(7);
    // May 2024: 31 days, starting on a Wednesday — 2 blanks with weekStartDay 1.
    expect(dayBoxes(container)).toHaveLength(31);
    expect(container.querySelectorAll(".space-between-box")).toHaveLength(2);
    expect(
      container.querySelector('[data-htp-date="2024-05-01"]'),
    ).not.toBeNull();
    expect(container.querySelector('[data-htp-date="2024-06-01"]')).toBeNull();
  });

  it("draws the current week as exactly seven days from weekStartDay", () => {
    const { container } = renderCalendar({ layout: "week" });

    const days = dayBoxes(container);
    expect(days).toHaveLength(7);
    expect(container.querySelectorAll(".space-between-box")).toHaveLength(0);
    // Monday-start week containing Wed 2024-05-15.
    expect(days[0].getAttribute("data-htp-date")).toBe("2024-05-13");
    expect(days[6].getAttribute("data-htp-date")).toBe("2024-05-19");
  });

  it("shifts the week start with the weekStartDay setting", () => {
    const { container } = renderCalendar({ layout: "week" }, 0);

    expect(dayBoxes(container)[0].getAttribute("data-htp-date")).toBe(
      "2024-05-12",
    );
  });

  it("colors a day from its entry and marks today", () => {
    const { container } = renderCalendar({
      layout: "month",
      entries: [{ date: "2024-05-15", intensity: 3, customColor: "#FF9F1C" }],
      showCurrentDayBorder: true,
    });

    const box = container.querySelector<HTMLElement>(
      '[data-htp-date="2024-05-15"]',
    );
    expect(box?.classList.contains("hasData")).toBe(true);
    expect(box?.classList.contains("today")).toBe(true);
    expect(box?.classList.contains("with-border")).toBe(true);
    expect(box?.style.backgroundColor).toBe("rgb(255, 159, 28)");
  });

  it("pins to an explicit date range instead of the current period", () => {
    const { container } = renderCalendar({
      layout: "month",
      startDate: "2024-02-05",
      endDate: "2024-02-20",
    });

    const days = dayBoxes(container);
    expect(days).toHaveLength(16);
    expect(days[0].getAttribute("data-htp-date")).toBe("2024-02-05");
    expect(days[15].getAttribute("data-htp-date")).toBe("2024-02-20");
  });

  it("pages through months with the header arrows", () => {
    const { container } = renderCalendar({ layout: "month" }, 1, <ReactApp />);

    expect(screen.getByText("May 2024")).toBeTruthy();

    fireEvent.click(screen.getByLabelText("Previous month"));
    expect(screen.getByText("Apr 2024")).toBeTruthy();

    fireEvent.click(screen.getByLabelText("Previous month"));
    expect(screen.getByText("Mar 2024")).toBeTruthy();
    expect(
      container.querySelector('[data-htp-date="2024-03-31"]'),
    ).not.toBeNull();

    fireEvent.click(screen.getByLabelText("Next month"));
    fireEvent.click(screen.getByLabelText("Next month"));
    expect(screen.getByText("May 2024")).toBeTruthy();
  });

  it("pages through weeks with the header arrows", () => {
    renderCalendar({ layout: "week" }, 1, <ReactApp />);

    fireEvent.click(screen.getByLabelText("Previous week"));
    expect(screen.getByText("May 6 – May 12")).toBeTruthy();
  });

  it("hides the period navigation when the range is explicit", () => {
    renderCalendar(
      { layout: "month", startDate: "2024-02-05", endDate: "2024-02-20" },
      1,
      <ReactApp />,
    );

    expect(screen.queryByLabelText("Previous month")).toBeNull();
    expect(screen.queryByLabelText("Previous Year")).toBeNull();
  });
});
