# Releasing a New Version

Follow these steps to release a new version of the Heatmap Tracker plugin.

## 1. Update the Changelog
Open `CHANGELOG.md` and add a new entry for the version you are about to release. 
Follow the [Keep a Changelog](https://keepachangelog.com/) format.
Include:
- Version number and date.
- Categorized changes (Added, Fixed, Changed, Removed).
- Links to relevant GitHub issues.

## 2. Run the Release Script
The project includes a helper script `update-version.sh` that automates the version bump, manifest updates, tagging, and pushing.

Run the script from the root directory:
```bash
./update-version.sh <version>
```
Example:
```bash
./update-version.sh 2.1.2
```

### What the script does:
1. **Commits all pending changes**: Ensures the workspace is clean.
2. **Updates `package.json`**: Uses `npm version` to bump the version without creating a tag yet.
3. **Updates Obsidian manifests**: Runs `node version-bump.mjs` which syncs the version to `manifest.json` and `versions.json`.
4. **Commits version updates**: Commits the modified manifests and `package.json`.
5. **Creates a Git Tag**: Tags the commit with the version number.
6. **Pushes to GitHub**: Pushes the branch and the new tag.

## 3. GitHub Action Release (Optional)
Once the tag is pushed, the GitHub Actions (if configured) will typically pick up the tag and create a draft release or a full release on GitHub. 
Check the [GitHub Actions](https://github.com/mokkiebear/heatmap-tracker/actions) tab to monitor the progress.

---
> [!IMPORTANT]
> Always ensure that `npm run test` passes before starting the release process.
