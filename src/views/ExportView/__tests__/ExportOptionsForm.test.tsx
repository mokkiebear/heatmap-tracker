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
  it("applies a preset's range, skips one with none, and opens the configuration", () => {
    const { setOption, onConfigurePresets } = renderForm([
      {
        id: "lastWeek",
        label: "Last week",
        span: () => ({ start: "2026-09-28", end: "2026-10-04" }),
      },
      { id: "logged", label: "Logged", span: () => null },
    ]);

    fireEvent.click(screen.getByText("Logged"));
    expect(setOption).not.toHaveBeenCalled();

    fireEvent.click(screen.getByText("Last week"));
    expect(setOption).toHaveBeenCalledWith("startDate", "2026-09-28");
    expect(setOption).toHaveBeenCalledWith("endDate", "2026-10-04");

    fireEvent.click(screen.getByLabelText("Configure range presets"));
    expect(onConfigurePresets).toHaveBeenCalled();
  });
});
