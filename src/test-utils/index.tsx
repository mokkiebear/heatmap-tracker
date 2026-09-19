/**
 * Shared test builders.
 *
 * Tests used to hand-assemble `TrackerData`/`TrackerSettings` objects, which
 * either meant repeating every required field or casting (`as never`) and
 * losing the type check that would have caught a renamed field. These build
 * valid objects from the real defaults and let a test state only what it is
 * actually about.
 *
 * Not shipped: nothing under `src/` outside tests imports this, and it is
 * excluded from coverage.
 */
import { ReactElement, ReactNode } from "react";
import { render, RenderOptions } from "@testing-library/react";
import { App } from "obsidian";

import { DEFAULT_SETTINGS } from "src/constants/defaultSettings";
import { DEFAULT_TRACKER_DATA } from "src/constants/defaultTrackerData";
import { AppContext } from "src/context/app/app.context";
import { HeatmapProvider } from "src/context/heatmap/heatmap.context";
import { Entry, TrackerData, TrackerSettings } from "src/types";

/**
 * `Partial<TrackerData>` is not enough: the grouped fields are objects, so a
 * plain Partial would force a test to restate every sibling key just to change
 * one of them.
 */
export type TrackerDataOverrides = Omit<
  Partial<TrackerData>,
  "intensityConfig" | "colorScheme" | "ui"
> & {
  intensityConfig?: Partial<TrackerData["intensityConfig"]>;
  colorScheme?: Partial<TrackerData["colorScheme"]>;
  ui?: Partial<NonNullable<TrackerData["ui"]>>;
};

export function makeTrackerData(
  overrides: TrackerDataOverrides = {},
): TrackerData {
  return {
    ...DEFAULT_TRACKER_DATA,
    ...overrides,
    intensityConfig: {
      ...DEFAULT_TRACKER_DATA.intensityConfig,
      ...overrides.intensityConfig,
    },
    colorScheme: {
      ...DEFAULT_TRACKER_DATA.colorScheme,
      ...overrides.colorScheme,
    },
    ui: { ...DEFAULT_TRACKER_DATA.ui, ...overrides.ui },
  };
}

export function makeSettings(
  overrides: Partial<TrackerSettings> = {},
): TrackerSettings {
  return { ...DEFAULT_SETTINGS, ...overrides };
}

/**
 * Entries for consecutive days starting at `startDate`, with a fixed intensity.
 * Explicit start date on purpose — a test that depends on "today" fails on some
 * days of the year and in some timezones.
 */
export function makeEntries(
  startDate: string,
  count: number,
  intensity = 1,
): Entry[] {
  const entries: Entry[] = [];
  const cursor = new Date(`${startDate}T00:00:00Z`);

  for (let index = 0; index < count; index++) {
    entries.push({ date: cursor.toISOString().slice(0, 10), intensity });
    cursor.setUTCDate(cursor.getUTCDate() + 1);
  }

  return entries;
}

interface RenderWithHeatmapOptions extends Omit<RenderOptions, "wrapper"> {
  trackerData?: TrackerDataOverrides;
  settings?: Partial<TrackerSettings>;
  onSettingsChange?: (settings: TrackerSettings) => void;
}

/**
 * Renders `ui` inside the same provider stack `renderApp` builds, so a view
 * test sees the values it would see in the plugin.
 */
export function renderWithHeatmap(
  ui: ReactElement,
  {
    trackerData = {},
    settings = {},
    onSettingsChange,
    ...renderOptions
  }: RenderWithHeatmapOptions = {},
) {
  const app = new App();

  function Wrapper({ children }: { children: ReactNode }) {
    return (
      <AppContext.Provider value={app}>
        <HeatmapProvider
          trackerData={makeTrackerData(trackerData)}
          settings={makeSettings(settings)}
          onSettingsChange={onSettingsChange}
        >
          {children}
        </HeatmapProvider>
      </AppContext.Provider>
    );
  }

  return render(ui, { wrapper: Wrapper, ...renderOptions });
}
