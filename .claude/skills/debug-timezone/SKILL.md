---
name: debug-timezone
description: Investigate or fix a date-related bug in the heatmap — wrong day highlighted, entry on the wrong box, off-by-one at month or year boundaries, a date range that starts or ends a day early. Use whenever a change touches src/utils/date.ts, intensity.ts, heatmapBox.ts, dataviewEntries.ts, or any Date/moment arithmetic.
---

# Debugging a date bug

Dates are the plugin's most frequent source of regressions. Several past bugs
only reproduced outside UTC, which is why CI runs the whole suite under three
timezones.

## Reproduce under the right zone first

```bash
npm test                      # your local zone
npm run test:utc              # TZ=utc
npm run test:usa              # TZ=America/New_York (negative offset — where
                              # "yesterday" bugs show up)
```

A bug that passes locally and fails under one of these is a timezone bug, not a
logic bug. Reproduce it in a test before changing anything.

## Where the logic lives

| Concern | File |
|---|---|
| Which dates are displayed (year vs startDate/endDate vs daysToShow vs monthsToShow, in that precedence) | `src/utils/date.ts` — `resolveDateRange()` |
| Entry date → grid box | `src/utils/heatmapBox.ts` |
| Dataview page → entry date | `src/utils/dataviewEntries.ts` |
| Intensity per day | `src/utils/intensity.ts` |

`heatmapBox.ts` and `dataviewEntries.ts` use the `moment` instance re-exported
from `obsidian` — not a second copy — so local-vs-UTC handling stays consistent
with the host app.

## Rules that keep this from regressing

- A test that involves a specific day must pin the date explicitly. No
  `new Date()` without an argument, no `Date.now()`.
- Parsing `YYYY-MM-DD` with `new Date(string)` treats it as UTC midnight, which
  is the previous day in negative-offset zones. That single line is the origin
  of most of these bugs.
- Add the failing case to `src/utils/__tests__/` — `repro.spec.ts` exists for
  exactly this kind of regression.

## Finish

```bash
npm run verify && npm run verify:tz
```

Both must be green; `verify` alone does not prove a date fix.
