# Render harness

A plain browser page that mounts the plugin's real render pipeline against fixed
fixtures, with `obsidian` aliased to the test mock.

```bash
npm run harness         # build + watch + serve on http://127.0.0.1:5174/index.html
npm run harness:build   # one-off build into harness/dist/ (gitignored)
```

## Why it exists

Obsidian does not run headless. Before this, the only way to see whether a
rendering change actually looked right was for a human to open Obsidian — so
render changes tended to ship on "should be fine". The harness makes the output
observable: open the page, or drive it with a browser tool and screenshot it.

It renders through `renderApp` (`src/render.tsx`), so it exercises
`mergeTrackerData` → `validateTrackerData` → `HeatmapProvider` → `ReactApp`, the
same path a real codeblock takes.

## What it is not

- Not a substitute for tests. It has no assertions; nothing fails here.
- Not shipped. Nothing under `src/` imports it, and the plugin build
  (`esbuild.config.mjs`) does not see it.
- Not Obsidian. `harness/obsidian-theme.css` approximates Obsidian's CSS
  variables and `src/__mocks__/obsidian.ts` stubs the API. Anything that depends
  on real Obsidian behaviour (Dataview queries, file IO, `Notice`) does nothing
  here.

## Fixtures

`harness/fixtures.ts`. Each is deterministic on purpose — no `Math.random()`, no
`new Date()` — so the same fixture draws the same grid on every run and two
screenshots are comparable.

Add a fixture when you fix a rendering bug: it is the cheapest way to keep the
case visible. Give it a `note` saying what it is meant to prove.
