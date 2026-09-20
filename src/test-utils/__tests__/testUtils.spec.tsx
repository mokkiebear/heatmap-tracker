import { validateTrackerData } from "src/schemas/validation";
import {
  makeEntries,
  makeSettings,
  makeTrackerData,
  renderWithHeatmap,
} from "src/test-utils";
import { useHeatmapContext } from "src/context/heatmap/heatmap.context";

jest.mock("src/localization/useTranslation", () => ({
  ...jest.requireActual("src/localization/useTranslation"),
  useTranslation: jest.fn(() => ({
    t: (key: string) => key,
    i18n: { changeLanguage: jest.fn().mockResolvedValue(undefined) },
  })),
}));

describe("test builders", () => {
  it("produces trackerData the real schema accepts", () => {
    expect(() => validateTrackerData(makeTrackerData())).not.toThrow();
    expect(() =>
      validateTrackerData(
        makeTrackerData({ year: 2024, entries: makeEntries("2024-01-01", 3) }),
      ),
    ).not.toThrow();
  });

  it("merges nested overrides instead of replacing the whole group", () => {
    const trackerData = makeTrackerData({
      intensityConfig: { defaultIntensity: 9 },
    });

    expect(trackerData.intensityConfig.defaultIntensity).toBe(9);
    // showOutOfRange comes from the defaults and must survive the override.
    expect(trackerData.intensityConfig.showOutOfRange).toBe(true);
  });

  it("builds consecutive dates without depending on today", () => {
    expect(makeEntries("2024-02-28", 3).map((entry) => entry.date)).toEqual([
      "2024-02-28",
      "2024-02-29",
      "2024-03-01",
    ]);
  });

  it("renders into a provider stack that exposes the given values", () => {
    function Probe() {
      const { trackerData, settings } = useHeatmapContext();
      return (
        <div
          data-testid="probe"
          data-year={trackerData.year}
          data-language={settings.language}
        />
      );
    }

    const { getByTestId } = renderWithHeatmap(<Probe />, {
      trackerData: { year: 2021 },
      settings: makeSettings({ language: "pl" }),
    });

    expect(getByTestId("probe").dataset.year).toBe("2021");
    expect(getByTestId("probe").dataset.language).toBe("pl");
  });
});
