#!/bin/bash

# Exit on errors
set -e

# Check if version parameter is provided
if [ -z "$1" ]; then
  echo "Usage: $0 <version>"
  exit 1
fi

VERSION=$1

# Step 1: Move CHANGELOG.md [Unreleased] entries under the new version heading
echo "1. Updating CHANGELOG.md: [Unreleased] -> [$VERSION]..."
if ! grep -q "^## \[Unreleased\]" CHANGELOG.md; then
  echo "Error: CHANGELOG.md has no [Unreleased] section. Add release notes before releasing." >&2
  exit 1
fi

UNRELEASED_BODY=$(awk '/^## \[Unreleased\]/{flag=1;next}/^## \[/{flag=0}flag' CHANGELOG.md)
if [ -z "$(echo "$UNRELEASED_BODY" | tr -d '[:space:]')" ]; then
  echo "Error: [Unreleased] section in CHANGELOG.md is empty. Add entries before releasing." >&2
  exit 1
fi

RELEASE_DATE=$(date +%Y-%m-%d)
awk -v ver="$VERSION" -v date="$RELEASE_DATE" '
  /^## \[Unreleased\]/ && !done {
    print "## [Unreleased]"
    print ""
    print "## [" ver "] - " date
    done=1
    next
  }
  { print }
' CHANGELOG.md > CHANGELOG.md.tmp && mv CHANGELOG.md.tmp CHANGELOG.md

# Step 2: Commit all changes
echo "2. Committing all changes..."
git add -A
git commit -m "chore: commit all changes before version bump" || echo "No changes to commit."

# Step 3: Update version in package.json using npm version
echo "3. Updating package.json to version $VERSION..."
npm version --no-git-tag-version $VERSION

# Step 4: Run npm version script (if applicable)
if npm run | grep -q 'version'; then
  echo "4. Running npm version script..."
  npm run version
else
  echo "No npm version script found, skipping."
fi

# Step 5: Commit updated files
echo "5. Committing updated files..."
git add package.json package-lock.json manifest.json versions.json CHANGELOG.md
git commit -m "chore(release): v$VERSION"

# Step 6: Tag the new version
echo "6. Creating git tag for version $VERSION..."
git tag "$VERSION"

# Step 7: Push changes and tags
echo "7. Pushing changes and tags..."
git push
git push --tags

echo "Version $VERSION updated and pushed successfully!"
echo "GitHub Actions will now build the plugin and publish the GitHub release with notes from CHANGELOG.md."