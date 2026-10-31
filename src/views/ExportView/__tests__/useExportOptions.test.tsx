import { act, renderHook } from "@testing-library/react";
import { makeSettings, makeTrackerData } from "src/test-utils";
import { useExportOptions } from "../useExportOptions";

function setup() {
  const updateSettings = jest.fn();
  const hook = renderHook(() =>
    useExportOptions({
      settings: makeSettings(),
      trackerData: makeTrackerData(),
      currentYear: 2026,
      dateRange: null,
      entriesByDate: {},
      updateSettings,
    }),
  );
  return { ...hook, updateSettings };
}

beforeEach(() => jest.useFakeTimers());
afterEach(() => jest.useRealTimers());

describe("useExportOptions saving", () => {
  it("doesn't save the initial options", () => {
    const { updateSettings } = setup();

    jest.runAllTimers();

    expect(updateSettings).not.toHaveBeenCalled();
  });

  it("saves an edit once, after the debounce", () => {
    const { result, updateSettings } = setup();

    act(() => result.current.setOption("valueLabel", "h"));
    act(() => result.current.setOption("valueLabel", "hours"));
    expect(updateSettings).not.toHaveBeenCalled();
    act(() => jest.runAllTimers());

    expect(updateSettings).toHaveBeenCalledTimes(1);
    expect(updateSettings.mock.calls[0][0].exportDefaults.valueLabel).toBe(
      "hours",
    );
  });

  it("saves a pending edit when the tab closes mid-debounce", () => {
    const { result, unmount, updateSettings } = setup();

    act(() => result.current.setOption("valueLabel", "hours"));
    unmount();

    expect(updateSettings).toHaveBeenCalledTimes(1);
    expect(updateSettings.mock.calls[0][0].exportDefaults.valueLabel).toBe(
      "hours",
    );
  });

  it("doesn't save twice when the debounce already ran", () => {
    const { result, unmount, updateSettings } = setup();

    act(() => result.current.setOption("valueLabel", "hours"));
    act(() => jest.runAllTimers());
    unmount();

    expect(updateSettings).toHaveBeenCalledTimes(1);
  });
});
