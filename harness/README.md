# Render harness

A plain browser page that mounts the plugin's real render pipeline against fixed
fixtures, with `obsidian` aliased to the test mock.

```bash
npm run harness         # build + watch + serve on http://127.0.0.1:5174/index.html
npm run harness:build   # one-off build into harness/dist/ (gitignored)
npm run harness:shots   # screenshot every fixture into harness/shots/ (gitignored)
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
case visible. Give it a `note` saying what it is meant to prove, and mention the
issue number (`issue #123`) — `src/utils/__tests__/regressionCoverage.spec.ts`
requires every fixed issue in the CHANGELOG to be named by a test or a fixture.

## Screenshots

`npm run harness:shots` boots the server, screenshots every `.harness-fixture`
section into `harness/shots/` and shuts down. CI runs it on every PR and uploads
the PNGs as the `harness-screenshots` artifact, so a rendering change is
reviewable without the reviewer building anything.

Deliberately not a pixel-diff: font rendering differs between a laptop and the
runner, so a byte comparison would go red for reasons unrelated to the change.
The artifact is for eyes.

## Language switcher

The `<select>` in the top bar calls `i18n.changeLanguage`, which re-renders
every mounted fixture in place. Month names, weekday labels and tab titles are
the parts most likely to overflow their box in a language other than English —
`de`/`pt` are long, `zh`/`hi`/`ru` are a different script. Check a rendering
change against at least one of each.

