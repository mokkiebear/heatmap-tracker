---
name: release
description: Cut and publish a new version of the plugin (version bump, changelog, tag, GitHub release). Use only when the user explicitly asks to release, publish, ship a version, or cut a tag.
---

# Releasing

`./update-version.sh <version>` commits, tags and **pushes**. It is not
reversible from here: the tag triggers
[.github/workflows/release.yml](../../../.github/workflows/release.yml), which
publishes a public GitHub release immediately (not a draft).

So: never run it on your own initiative, and confirm the exact version number
with the user before running it. Full detail lives in
[RELEASING.md](../../../RELEASING.md).

## Before

1. On an up-to-date `main`, working tree clean.
2. ```bash
   npm run verify && npm run verify:tz && npm run build
   ```
   All green. A failed build after the tag is pushed means a broken release.
3. `CHANGELOG.md` has a non-empty `## [Unreleased]` section covering everything
   in this release, in [Keep a Changelog](https://keepachangelog.com/)
   categories. The script fails loudly if it is missing or empty — that gate is
   deliberate, do not work around it.
4. Agree the version with the user. Semver against the current
   `package.json` version: breaking codeblock behaviour → major, new parameter
   or view → minor, fix only → patch.

## Run

```bash
./update-version.sh <version>
```

It renames `[Unreleased]` to `[<version>] - <date>`, re-inserts an empty
`[Unreleased]`, bumps `package.json` / `manifest.json` / `versions.json`,
commits `chore(release): v<version>`, then tags and pushes.

## After

```bash
git describe --tags --abbrev=0     # the new tag
gh run list --workflow=release.yml --limit 1
```

The release appears on the Releases page within a couple of minutes. If it does
not, the usual cause is a `CHANGELOG.md` section that does not match the tag.

Never bump versions by hand and never `git push --force` a release tag —
people's plugin managers have already seen it.
