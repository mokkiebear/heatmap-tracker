# Changelog

All notable changes to this project are documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/), and this project adheres to [Semantic Versioning](https://semver.org/).

## [Unreleased]

## [2.6.0] - 2026-07-03
### Added
- HeatmapModal & codeblock: `tags` — only include notes with at least one of the given tags. Exposed in the modal as an add/remove chip list, with suggestions drawn from tags already used in the vault.
- HeatmapModal & codeblock: `filters` — additional frontmatter conditions (`property` + `equals`/`contains`/`notEmpty` + `value`) a note must satisfy, all of which must match. Exposed in the modal as a dynamic list of condition rows with a property autocomplete.

### Changed
- HeatmapModal: extracted the "pick from vault suggestions, or type your own, shown as removable chips" UI (previously duplicated for properties) into a shared internal `ChipList` control, now reused for both properties and tags.

## [2.5.0] - 2026-07-03
### Added
- HeatmapModal: track multiple properties via add/remove chips instead of a single dropdown, matching the existing `property: [a, b]` aggregation behavior.
- HeatmapModal: `layout` (`default`/`monthly`) picker and a date-range picker (full year / last N days / last N months / custom start-end) covering `monthsToShow`, `daysToShow`, `startDate`/`endDate`.
- HeatmapModal: custom colors editor (`colorScheme.customColors`) as an alternative to picking a palette.
- HeatmapModal: full `intensityConfig` controls — `scaleStart`, `scaleEnd`, `defaultIntensity`, `showOutOfRange` (previously only `excludeFalsy` was exposed).
- HeatmapModal: inline validation banner that disables "Insert Heatmap" until required fields (property, date range, custom colors, etc.) are valid.
- HeatmapModal: the preview now queries Dataview using the selected property/path and renders real matching entries instead of an empty grid.

### Changed
- HeatmapModal: widened and reorganized into sections (Basic, Data source, Layout & date range, Appearance, Intensity scale, Behavior, UI settings) with a dedicated preview/submit column that stays visible while scrolling through the other options.
- Extracted the Dataview query + intensity-summing logic shared by the codeblock processor and the modal preview into `src/utils/dataviewEntries.ts`.

### Fixed
- Codeblock processor no longer searches for a literal folder named `"undefined"` when no `path` is set — it now searches the whole vault, as intended.
- `renderApp` now hands its React root back via a callback so callers (the modal preview) can unmount it between re-renders instead of leaking a root on every keystroke.
- HeatmapModal: validation error banner text was unreadable (red text on a red background).
- HeatmapModal: preview/fields columns could collapse to near-zero width on mobile due to a flexbox `align-items` cross-axis bug when the layout switches to a single column.

## [2.4.0] - 2026-07-03
### Removed
- Deprecated `defaultEntryIntensity`, `intensityScaleStart`, and `intensityScaleEnd` `trackerData` parameters. Use `intensityConfig` instead — old codeblocks/dataviewjs scripts using the deprecated fields keep working (they're migrated automatically).

### Changed
- Rewrote the "Insert Heatmap Tracker" modal (`HeatmapModal`) around a single form-state object instead of ~15 separate variables, cutting the file from 543 to 359 lines and removing a lot of duplicated preview-update code.
- README's "Tracker Settings Documentation" is now the single source of truth for `trackerData` parameters (added missing `heatmapTitle`, `heatmapSubtitle`, `disableFileCreation`, and `intensityConfig` sections); EXAMPLE_VAULT's parameter doc pages now link back to it instead of duplicating definitions.
- Documented the date-range precedence (`monthsToShow` > `daysToShow` > `startDate`/`endDate`) in one place, `resolveDateRange` in `src/utils/date.ts`, and added test coverage for it.

### Fixed
- `intensityConfig.scaleStart`/`scaleEnd` set directly by a user could be silently overwritten with `undefined` when the deprecated intensity fields weren't also set.
- Fixed a missing comma in the `intensityConfig` example in EXAMPLE_VAULT that would throw if copy-pasted into a `dataviewjs` block.
- `npm test` could fail non-deterministically due to Jest's haste module map crawling nested git worktrees under `.claude/worktrees/`.

### Added
- `ARCHITECTURE.md`: a one-page map of how data flows from a codeblock/dataviewjs script through validation, context, and views, for new contributors.
- README's language list corrected from "English, German, and Russian" to all 9 currently supported languages.

## [2.3.0] - 2026-07-03
### Fixed
- Entries with weekday-suffixed filenames (e.g. `YYYY-MM-DD-dddd`) not showing in heatmap.

## [2.2.0] - 2026-03-12
### Added
- Monthly layout mode (`layout: "monthly"`) — renders one row per month with days 1–31 as columns.
- Date range parameters: `monthsToShow`, `daysToShow`, `startDate`, `endDate` for partial year views.
- Year navigation is automatically hidden when a date range is active.

## [2.1.7] - 2026-03-10
### Added
- Comprehensive RTL (Right-to-Left) support for improved usability in languages like Hebrew and Arabic.

### Fixed
- Year navigation buttons now maintain intuitive order `[◀] [Year] [▶]` even in RTL mode.
- Corrected alignment and spacing for week day labels and settings using logical CSS properties.

## [2.1.6] - 2026-03-06
### Added
- Implement `ConfirmModal` for user confirmation prompts.

### Changed
- Migrate ESLint configuration to flat config.
- Internal cleanup: remove unused `trackerData` from `LegendView`.

## [2.1.5] - 2026-02-28
### Added
- Prominent `Prerequisites` and `Getting Started` sections to README.
- Better description for the `Property` field in the Heatmap creation modal.

### Fixed
- Fix bug where tracking multiple properties in a single heatmap failed to aggregate their values.
- Improve data parsing to correctly handle boolean values and numeric strings in frontmatter.
- Internal refactor: centralize `parseIntensity` logic and add unit tests.

## [2.1.4] - 2026-02-28
### Fixed
- Internal typing fixes for `HeatmapModal`.

## [2.1.3] - 2026-02-28
### Added
- Add `Exclude zero/falsy values` toggle to the `Create new Heatmap` modal for better discoverability.

### Fixed
- Fix bug where intensity `0` was colored when `scaleStart` was greater than `0`.
- Stability improvements for `HeatmapModal` preview.

## [2.1.2] - 2026-02-28
### Fixed
- Fix bug where `currentStreakStartDate` was incorrectly calculated when gaps (missing daily notes) were present.
- Issue: https://github.com/mokkiebear/heatmap-tracker/issues/80

## [2.1.1] - 2026-02-28
### Fixed
- Fix streak calculation when `excludeFalsy` is enabled.
- Ensure "Total Tracking Days" and Legend reflect the `excludeFalsy` setting.
- Extract streak calculation logic to a testable utility.
- Issue: https://github.com/mokkiebear/heatmap-tracker/issues/80

## [2.1.0] - 2026-01-02
### Added
- Add option to exclude zero/falsy values from heatmap.

## [2.0.1] - 2025-12-26
### Fixed
- Possible fix for these issues:
- - https://github.com/mokkiebear/heatmap-tracker/issues/7
- - https://github.com/mokkiebear/heatmap-tracker/issues/25
- - https://github.com/mokkiebear/heatmap-tracker/issues/35

## [2.0.0] - 2025-12-11
### Added
- Add UI (modal) for generating heatmap tracker 🔥

## [1.20.0] - 2025-12-10
### Added
- Add week numbers under the heatmap.

## [1.19.3] - 2025-12-09
### Fixed
- Fix issue with zero intensity not displaying correct color.

## [1.19.2] - 2025-12-08
### Added
- Add `ui` option with `defaultView` property to display legend or statistics separately.

## [1.19.1] - 2025-12-08
### Fixed
- Schema changed to not strict.
- Issue: https://github.com/mokkiebear/heatmap-tracker/issues/64

## [1.19.0] - 2025-12-07
### Added
- Add zod.
- Add `disableFileCreation` option.
- A lot of tests.
- Updated EXAMPLE_VAULT.

## [1.18.2] - 2025-11-02
### Changed
- Fix zh translations.

## [1.18.1] - 2025-10-12
### Changed
- Translations for support section

---
## [1.18.0] - 2025-08-30
### Added
- Obsidian hover preview on boxes by adding `data-href`/`href` and `internal-link` when applicable.
- `customHref` for boxes (highest priority): supports external URLs and internal linktext.

### Changed
- Click behavior generalized and deterministic:
  - Priority: `customHref` → `filePath` → `basePath` → Daily Notes.
  - Opens exact files via `openFile(TFile)` when `filePath` is provided (no ambiguous "closest" resolution).
  - Confirmation dialogs now display the exact target path for creation.
- Dataview examples updated to include `filePath` and `basePath`; removed redundant link `content` where not needed.

## [1.17.0] - 2025-08-03
- Add codeblock preprocessor for `heatmap-tracker`. This codeblock accepts parameter property and uses it to aggregate data across pages with that property. By default, the pages searched will be in the Daily Notes folder, but this can be overridden with the path parameter. Contributed by [@dsynkd](https://github.com/dsynkd).


## [1.16.0] - 2025-07-30
- Add Polish language. Contributed by [@qoqosz](https://github.com/qoqosz).


## [1.15.7] - 2025-07-28
- Fix de.json. Contributed by [@LucEast](https://github.com/LucEast).

## [1.15.6] - 2025-04-27
- Add new support option: Ko-fi.

## [1.15.5] - 2025-04-27
### Fixed
- Add support section in settings.

## [1.15.4] - 2025-04-27
### Fixed
- Set `separateMonths` to `true` by default.
- Split styles to separate files

## [1.15.3] - 2025-04-26
### Fixed
- Remove `moment` from bundle.
  

## [1.15.2] - 2025-04-26
### Fixed
- Fix week days vertical alignment. Bug was related to horizontal scroll. It's different when you connect mouse. Github issue: [Issue](https://github.com/mokkiebear/heatmap-tracker/issues/38).
- Add `isSameDate`. Now the current date is highlighted only if the date is the same as the current date.
  

## [1.15.1] - 2025-03-30
### Added
- Frozen column with the days of the week.
- Add CSS variables: `--heatmap-box-size` and `--heatmap-box-gap`.
- Heatmap is centered in the container.
  
## [1.15.0] - 2025-02-08
### Added
- Change the view of palettes in the settings.
- Edit palette color in the settings.
  
## [1.14.4] - 2025-02-02
### Added
- Return container ref.
- Change tabs order.
- Update styles.

## [1.14.3] - 2025-01-26
### Fixed
- Fix streak calculation.

## [1.14.2] - 2025-01-26
### Fixed
- Remove `font-family`.
- Add header fro `StatisticsView`. Hide tabs.

## [1.14.1] - 2025-01-26
### Fixed
- `overflow-x: auto;`

## [1.14.0] - 2025-01-25
### Removed
- Hide donation view.

### Added
- Add user insights 🎉
- Add more examples to EXAMPLE_VAULT.


## [1.13.12] - 2025-01-25
### Fixed
- Use UTC consistently.

### Added
- Improved test coverage.


## [1.13.11] - 2025-01-21
### Fixed
- Fix date shift: [Issue](https://github.com/mokkiebear/heatmap-tracker/issues/25).

## [1.13.10] - 2025-01-18
### Removed
- Remove entry color property. customColor is used instead.

## [1.13.9] - 2025-01-17
### Fixed
- Fix intensities function.
- Fix defaultIntensity.
- Update example notes.

## [1.13.8] - 2025-01-17
### Fixed
- Fix heatmap tracker markup.


## [1.13.3] - 2025-01-15
### Fixed
- Flexible box size.

## [1.13.2] - 2025-01-14
### Added
- `html` is allowed for `title` and `subtitle`.

## [1.13.1] - 2025-01-14
### Fixed
- Fix for empty `customColors`.

## [1.13.0] - 2025-01-14
### Added
- Added missing translations.
- Added `weekDisplayMode` setting to display `even/odd/all/none` days.
- Added start/end dates for streaks in statistics view.

## [1.12.7] - 2025-01-14
### Added
- Now you can add Legend for tracker separately. Check [example](https://github.com/mokkiebear/heatmap-tracker/blob/main/EXAMPLE_VAULT/Documentation%20with%20Examples/2.%20Features/How%20to%20display%20legend%20separately%3F.md).

## [1.12.6] - 2025-01-14
### Fixed
- [Randomnerminox](https://github.com/Randomnerminox) spotted the issue related to Calendarium plugin. It ruined Heatmap tracker overview.


## [1.12.5] - 2025-01-14

### Added
- Add Portuguese language. Thanks to [edusanzio](https://github.com/edusanzio) for provided translations.

## [1.12.4] - 2025-01-12

### Fixed
- Fix week days alignment.

## [1.12.3] - 2025-01-11

### Removed
- Remove snowfall.

## [1.12.0] - 2025-01-06

### Added
- Add legend view.
- Add `showOutOfRange` property.
- Add tests for utils.

## Changed
- Update intensity calculation.
- Change font-size of documentation view.

## [1.11.1] - 2025-01-01

### Fixed
- Fix default year (2024 -> 2025).

## [1.11.0] - 2024-12-28

### Added
- Add tabs visibility in settings. In allows users to show/hide specific tabs.

### Changed
- Other small changes. Refactoring.

## [1.10.6] - 2024-12-22

### Fixed
- Fix link.

## [1.10.5] - 2024-12-22

### Added
- Add Donation view.

## [1.10.4] - 2024-12-20

### Added
- Add `preact` to optimize bundle size.

## [1.10.3] - 2024-12-20

### Changed
- Added scss. Optimized styles.


## [1.10.1] - 2024-12-20

### Removed
- Removed `react-window` library to simplify implementation.

### Changed
- Verified plugin's performance remains high after the removal of `react-window`.

## [1.10.0] - 2024-12-19

### Added

- Integrated `react-window` library to enhance heatmap rendering performance.
- Implemented lazy loading for improved efficiency.

### Changed

- Removed hover effect on certain boxes for a cleaner user interface.

## [1.9.6] - 2024-12-17

### Changed

- Updated snowfall color; feature is now disabled by default.

## [1.9.3] - 2024-12-17

### Added

- Introduced CSS snowfall effect for a festive appearance.

## [1.9.2] - 2024-12-17

### Removed

- Removed snowfall effect due to performance issues.

## [1.9.1] - 2024-12-17

### Added

- Added snowfall effect and Santa Claus hat to the heatmap for Christmas celebrations.
- Feature can be disabled in the settings.

## [1.9.0] - 2024-12-13

### Changed

- Updated colors API:
  - Removed `colors`.
  - Added `colorScheme.paletteName` and `colorScheme.customColors`.

## [1.8.0] - 2024-12-13

### Added

- Introduced documentation view.
- Added heatmap footer.
- Included note about breaking changes.

## [1.7.2] - 2024-12-10

### Fixed

- Resolved issue with color removal.

## [1.7.1] - 2024-12-10

### Fixed

- Improved styles for mobile devices.

## [1.7.0] - 2024-12-10

### Added

- Simplified process for adding new palettes:
  - Navigate to settings, add a new palette name, and then add colors to your palette.

## [1.6.0] - 2024-12-09

### Added

- Introduced new color palettes: `Blues`, `Greens`, `Greys`, `Oranges`, `Purples`, `Reds`.

## [1.5.0] - 2024-12-09

### Added

- Implemented `colorScheme` setting to select color palettes.

## [1.4.0] - 2024-12-09

### Added

- Added `separateMonths` setting to visually separate months in the heatmap.

## [1.3.0] - 2024-12-09

### Added

- Introduced `weekStartDay` setting to define the starting day of the week.

## [1.2.0] - 2024-12-09

### Added

- Added `showCurrentDayBorder` setting to highlight the current day.

## [1.1.5] - 2024-11-30

### Changed

- Updated `README.md` with additional information.

## [1.1.4] - 2024-11-30

### Fixed

- Removed minimum width constraint.

## [1.1.3] - 2024-11-30

### Fixed

- Improved styles for mobile devices.

## [1.1.2] - 2024-11-30

### Changed

- Made heatmap tracker scrollable for better display on mobile devices.
- Adjusted box shapes in the heatmap to be more square.
- In separate months mode, non-hoverable empty spaces between months.

## [1.1.1] - 2024-11-30

### Added

- Introduced `heatmapTitle` setting for the heatmap.
- Introduced `heatmapSubtitle` setting for the heatmap.

## [1.1.0] - 2024-11-30

### Added

- Migrated plugin to React for easier maintenance and future feature additions.
- Began translating the plugin; added English, German, and Russian languages (partial translations).

### Fixed

- Addressed issues related to NaN values.

### Removed

- Eliminated manual rendering implementation.

## [1.0.0] - 2024-11-29

### Added

- Initial release of Heatmap Tracker plugin for Obsidian.
- Plugin is now available for use.
