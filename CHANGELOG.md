# Changelog

All notable changes to this project are documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/), and this project adheres to [Semantic Versioning](https://semver.org/).

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
