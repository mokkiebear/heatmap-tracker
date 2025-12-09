import React from "react";
import { render } from "@testing-library/react";
import { HeatmapWeekNums } from "../HeatmapWeekNums";
import { HeatmapContext } from "src/context/heatmap/heatmap.context";
import { TrackerData, TrackerSettings, Box } from "src/types";

// Mock dependencies
jest.mock("src/utils/date", () => ({
  getISOWeekNumber: jest.fn(() => 1),
}));

const mockSettings: TrackerSettings = {
  separateMonths: true,
  showWeekNums: false,
  language: "en",
  palettes: {},
  viewTabsVisibility: {},
  weekStartDay: 1,
  weekDisplayMode: "even",
};

const mockTrackerData: TrackerData = {
  year: 2024,
  entries: [],
  separateMonths: true,
  intensityConfig: {} as any,
  colorScheme: {} as any,
  insights: [],
  ui: {
      showWeekNums: undefined
  },
  showCurrentDayBorder: false,
  defaultEntryIntensity: 0
};

const mockBoxes: Box[] = [
    { date: "2024-01-01" }, // Week 1
    { date: "2024-01-02" }, 
    { date: "2024-01-03" }, 
    { date: "2024-01-04" }, 
    { date: "2024-01-05" }, 
    { date: "2024-01-06" }, 
    { date: "2024-01-07" },
    // Spacer column (7 items)
    { isSpaceBetweenBox: true }, { isSpaceBetweenBox: true }, { isSpaceBetweenBox: true }, { isSpaceBetweenBox: true }, { isSpaceBetweenBox: true }, { isSpaceBetweenBox: true }, { isSpaceBetweenBox: true },
]; 

function renderComponent(settingsOverrides = {}, trackerDataOverrides = {}) {
  return render(
    <HeatmapContext.Provider
      value={{
        settings: { ...mockSettings, ...settingsOverrides },
        trackerData: { ...mockTrackerData, ...trackerDataOverrides },
        boxes: mockBoxes,
        currentYear: 2024,
      } as any}
    >
      <HeatmapWeekNums />
    </HeatmapContext.Provider>
  );
}

describe("HeatmapWeekNums", () => {
    it("should render nothing when showWeekNums is false (default)", () => {
        const { container } = renderComponent({ showWeekNums: false });
        expect(container.firstChild).toBeNull();
    });

    it("should render week numbers when settings.showWeekNums is true", () => {
        const { container } = renderComponent({ showWeekNums: true });
        // Assuming implementation renders divs with class heatmap-tracker-week-nums
        expect(container.querySelector(".heatmap-tracker-week-nums")).toBeTruthy();
    });

    it("should render week numbers when trackerData.ui.showWeekNums is true, overriding settings", () => {
        const { container } = renderComponent(
            { showWeekNums: false }, 
            { ui: { showWeekNums: true } }
        );
        expect(container.querySelector(".heatmap-tracker-week-nums")).toBeTruthy();
    });

    it("should hide week numbers when trackerData.ui.showWeekNums is false, overriding settings", () => {
        const { container } = renderComponent(
            { showWeekNums: true }, 
            { ui: { showWeekNums: false } }
        );
        expect(container.firstChild).toBeNull();
    });
});
