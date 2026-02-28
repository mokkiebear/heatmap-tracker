---
description: How to release a new version of the Heatmap Tracker plugin
---

1. Ensure all tests pass.
```bash
npm run test
```

2. Update `CHANGELOG.md` with the new version, date, and list of changes.

3. Run the automated release script.
// turbo
```bash
./update-version.sh <version>
```

4. Verify that the tag was created and pushed to the repository.
```bash
git describe --tags --abbrev=0
```
