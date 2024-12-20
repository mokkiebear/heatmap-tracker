# Changelog

All notable changes to this project are documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/), and this project adheres to [Semantic Versioning](https://semver.org/).

---

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