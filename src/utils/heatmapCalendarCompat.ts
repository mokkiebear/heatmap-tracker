import { App } from "obsidian";
import { Entry, Palettes, TrackerData } from "src/types";

/**
 * Compatibility layer for Richardsl/heatmap-calendar-obsidian, which is no
 * longer maintained. Its users have `renderHeatmapCalendar(...)` calls spread
 * across their dataviewjs blocks; rewriting every note is not something we can
 * do for them, so we accept its `calendarData` shape instead and render it
 * through our own pipeline. Installing this plugin *is* the migration.
 */
export interface CalendarData {
  year?: number;
  /** Either a map of named ramps, or the name of a ramp from its settings. */
  colors?: Record<string, string[]> | string;
  entries?: LegacyEntry[];
  showCurrentDayBorder?: boolean;
  defaultEntryIntensity?: number;
  intensityScaleStart?: number;
  intensityScaleEnd?: number;
}

interface LegacyEntry {
  date: string;
  intensity?: number;
  /** Name of a ramp in `colors`. Not representable here — see below. */
  color?: string;
  content?: string | HTMLElement;
}

/** The legacy intensity fields `mergeTrackerData()` already folds forward. */
type LegacyTrackerData = Partial<TrackerData> &
  Pick<
    CalendarData,
    "defaultEntryIntensity" | "intensityScaleStart" | "intensityScaleEnd"
  >;

/**
 * Maps `calendarData` onto `trackerData`.
 *
 * Per-entry `color` is dropped: it names a whole ramp, and which shade of it a
 * day gets is only known after our intensity mapping runs, so it cannot be
 * turned into an entry's `customColor` here. Those days fall back to the main
 * palette.
 */
export function calendarDataToTrackerData(
  calendarData: CalendarData,
): LegacyTrackerData {
  const {
    colors,
    entries = [],
    ...rest
  } = calendarData ?? ({} as CalendarData);

  const colorScheme =
    typeof colors === "string"
      ? { paletteName: colors }
      : colors && Object.keys(colors).length
        ? { customColors: colors[Object.keys(colors)[0]] }
        : undefined;

  return {
    ...rest,
    ...(colorScheme ? { colorScheme } : {}),
    entries: entries.map(({ date, intensity, content }): Entry => ({
      date,
      ...(intensity !== undefined ? { intensity } : {}),
      ...(content ? { content } : {}),
    })),
  };
}

/**
 * The old plugin kept its named palettes in its own settings, which is what a
 * `colors: "blue"` string refers to. Read them so that reference still
 * resolves. In-memory only — we don't write another plugin's data into ours.
 */
export async function readLegacyPalettes(app: App): Promise<Palettes> {
  try {
    const raw = await app.vault.adapter.read(
      `${app.vault.configDir}/plugins/heatmap-calendar/data.json`,
    );
    const colors = JSON.parse(raw)?.colors;
    return colors && typeof colors === "object" ? colors : {};
  } catch {
    // Not installed, never configured, or unreadable — nothing to migrate.
    return {};
  }
}
