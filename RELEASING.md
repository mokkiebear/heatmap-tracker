# Releasing Heatmap Tracker

This document describes how new versions of the plugin are published.

## During development: keep the changelog up to date

Every pull request that changes user-facing behavior (features, fixes, breaking
changes) should add a bullet point under the `## [Unreleased]` section at the
top of [CHANGELOG.md](CHANGELOG.md), following [Keep a Changelog](https://keepachangelog.com/)
categories (`Added`, `Changed`, `Fixed`, `Removed`, ...). For example:

```markdown
## [Unreleased]
### Fixed
- Entries with weekday-suffixed filenames (e.g. `YYYY-MM-DD-dddd`) not showing in heatmap.
```

If `## [Unreleased]` doesn't exist yet, add it above the most recent version
heading. This keeps the changelog accurate without anyone having to
reconstruct it from git history at release time — and the release process
below depends on it.

## Cutting a release

Once `main` has everything you want to ship:

1. Make sure you're on an up-to-date `main` and the `[Unreleased]` section in
   `CHANGELOG.md` has the entries for this release.
2. Run:
   ```bash
   ./update-version.sh <version>
   ```
   where `<version>` is the new semver version (e.g. `2.3.0`).

That's it — everything else is automatic. The script:

1. Renames the `## [Unreleased]` changelog heading to `## [<version>] - <date>`
   and re-inserts an empty `## [Unreleased]` above it for future PRs. Fails
   loudly if there's no `[Unreleased]` section or it's empty, so a release
   can't ship without notes.
2. Bumps `package.json`, `manifest.json`, and `versions.json` to `<version>`.
3. Commits the changes (`chore(release): v<version>`).
4. Creates and pushes the git tag `<version>`, and pushes the commit.

Pushing the tag triggers [`.github/workflows/release.yml`](.github/workflows/release.yml),
which:

1. Builds the plugin.
2. Extracts the `<version>` section from `CHANGELOG.md` and uses it as the
   GitHub release notes.
3. Publishes a GitHub release for the tag (not a draft) with `main.js`,
   `manifest.json`, and `styles.css` attached, ready for the Obsidian
   community plugin index to pick up.

No manual step in the GitHub UI is needed — once `update-version.sh` finishes
pushing, the release appears on the
[Releases page](https://github.com/mokkiebear/heatmap-tracker/releases)
within a couple of minutes. Check the [Actions tab](https://github.com/mokkiebear/heatmap-tracker/actions)
if it doesn't show up or the workflow fails (most likely cause: no matching
`CHANGELOG.md` section for the tag).
