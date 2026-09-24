import HeatmapTrackerView from "src/views/HeatmapTrackerView/HeatmapTrackerView";
import { renderWithHeatmap } from "src/test-utils";
import { formatDateToISO8601, getToday } from "src/utils/date";

function renderedDates(container: HTMLElement): string[] {
  return Array.from(container.querySelectorAll("[data-htp-date]"))
    .map((el) => el.getAttribute("data-htp-date"))
    .filter((date): date is string => Boolean(date));
}

function monthLabels(container: HTMLElement): string[] {
  return Array.from(container.querySelectorAll(".heatmap-tracker-months div"))
    .map((el) => el.textContent ?? "")
    .filter(Boolean);
}

describe("HeatmapTrackerView date ranges (#118)", () => {
  it("draws only the configured range, not the whole calendar year", () => {
    const { container } = renderWithHeatmap(<HeatmapTrackerView />, {
      trackerData: {
        layout: "default",
        startDate: "2025-11-20",
        endDate: "2026-02-05",
      },
    });

    const dates = renderedDates(container);

    expect(dates[0]).toBe("2025-11-20");
    expect(dates[dates.length - 1]).toBe("2026-02-05");
    expect(dates).toHaveLength(78);
  });

  it("ends a daysToShow range on today and spans exactly that many days", () => {
    const { container } = renderWithHeatmap(<HeatmapTrackerView />, {
      trackerData: { layout: "default", daysToShow: 30 },
    });

    const dates = renderedDates(container);

    expect(dates).toHaveLength(30);
    expect(dates[dates.length - 1]).toBe(formatDateToISO8601(getToday()));
  });

  it("labels the months the range actually covers, in order", () => {
    const { container } = renderWithHeatmap(<HeatmapTrackerView />, {
      trackerData: {
        layout: "default",
        startDate: "2025-11-20",
        endDate: "2026-02-05",
      },
    });

    expect(monthLabels(container)).toEqual(["Nov", "Dec", "Jan", "Feb"]);
  });

  it("drops a leading month stub whose label would collide with the next", () => {
    // A 365-day range starts mid-month, leaving a few days of that month in
    // the first column or two — not enough room for a label before the next
    // month's. This is #118's follow-up: "Sep" and "Oct" drew on top of
    // each other in the upper-left corner.
    const { container } = renderWithHeatmap(<HeatmapTrackerView />, {
      trackerData: {
        layout: "default",
        startDate: "2025-09-29",
        endDate: "2026-09-24",
      },
    });

    const labels = monthLabels(container);

    expect(labels[0]).toBe("Oct");
    // Every surviving label still has room: a full month spans 4+ columns.
    expect(labels).toEqual([
      "Oct",
      "Nov",
      "Dec",
      "Jan",
      "Feb",
      "Mar",
      "Apr",
      "May",
      "Jun",
      "Jul",
      "Aug",
      "Sep",
    ]);
  });

  it("still labels January through December for a full year", () => {
    const { container } = renderWithHeatmap(<HeatmapTrackerView />, {
      trackerData: { layout: "default", year: 2024 },
    });

    const dates = renderedDates(container);

    expect(dates[0]).toBe("2024-01-01");
    expect(dates[dates.length - 1]).toBe("2024-12-31");
    expect(monthLabels(container)).toEqual([
      "Jan",
      "Feb",
      "Mar",
      "Apr",
      "May",
      "Jun",
      "Jul",
      "Aug",
      "Sep",
      "Oct",
      "Nov",
      "Dec",
    ]);
  });

  it("colors a range crossing a year boundary from the whole range", () => {
    // Day-of-year keys would put 2025-11-20 and 2026-11-20 in the same bucket;
    // ISO-date keys keep them apart. Both years' entries must be visible.
    const { container } = renderWithHeatmap(<HeatmapTrackerView />, {
      trackerData: {
        layout: "default",
        year: 2026,
        startDate: "2025-12-30",
        endDate: "2026-01-02",
        entries: [
          { date: "2025-12-31", intensity: 5 },
          { date: "2026-01-01", intensity: 5 },
        ],
      },
    });

    const withData = Array.from(
      container.querySelectorAll(".heatmap-tracker-box.hasData"),
    ).map((el) => el.getAttribute("data-htp-date"));

    expect(withData).toEqual(["2025-12-31", "2026-01-01"]);
  });
});
