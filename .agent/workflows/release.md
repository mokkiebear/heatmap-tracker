---
description: How to release a new version of the Heatmap Tracker plugin
---

Full detail and the rationale for each gate: [RELEASING.md](../../RELEASING.md).

1. Verify the tree. All three must pass before a tag exists.
```bash
npm run verify && npm run verify:tz && npm run build
```

2. Make sure `CHANGELOG.md` has a non-empty `## [Unreleased]` section for this
   release. The release script refuses to run without one.

3. Run the automated release script. It commits, tags and pushes — the tag
   publishes a public GitHub release immediately, so confirm the version first.
```bash
./update-version.sh <version>
```

4. Verify that the tag was created and pushed to the repository.
```bash
git describe --tags --abbrev=0
```
