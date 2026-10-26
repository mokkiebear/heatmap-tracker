import { fireEvent, render, screen } from "@testing-library/react";
import ExportOptionsForm, { PresetButton } from "../ExportOptionsForm";
import { ExportOptions } from "../useExportOptions";
import { defaultPresets } from "../rangePresets";

const options: ExportOptions = {
  orientation: "columns",
  weekStartDay: 1,
  startDate: "2026-01-01",
  endDate: "2026-12-31",
  showWeekStartDate: false,
  splitByMonth: true,
  showMonthLabels: true,
  skipWeekends: false,
  hideSummary: false,
  hideTotalValue: false,
  hideAllValues: false,
  valueLabel: "",
  legend: [],
  legendMode: "separate",
  gradientLabel: "",
  exportFolder: "",
  rangePresets: defaultPresets(),
};

function renderForm(presets: PresetButton[]) {
  const setOption = jest.fn();
  const onConfigurePresets = jest.fn();
  render(
    <ExportOptionsForm
      options={options}
      setOption={setOption}
      presets={presets}
      onConfigurePresets={onConfigurePresets}
      onEditLegend={() => {}}
    />,
  );
  return { setOption, onConfigurePresets };
}

describe("ExportOptionsForm presets", () => {
  it("renders the given preset buttons and applies a preset's range", () => {
    const { setOption } = renderForm([
      {
        id: "lastWeek",
        label: "Last week",
        span: () => ({ start: "2026-09-28", end: "2026-10-04" }),
      },
    ]);

    fireEvent.click(screen.getByText("Last week"));

    expect(setOption).toHaveBeenCalledWith("startDate", "2026-09-28");
    expect(setOption).toHaveBeenCalledWith("endDate", "2026-10-04");
  });

  it("opens the preset configuration from the gear button", () => {
    const { onConfigurePresets } = renderForm([]);

    fireEvent.click(screen.getByLabelText("Configure range presets"));

    expect(onConfigurePresets).toHaveBeenCalled();
  });
});
