---
name: review-dependabot-pr
description: Review and merge open dependency PRs (dependabot or otherwise). Use when asked to check, triage, or merge PRs whose CI status may be stale, especially batches of dependency bumps.
---

# Reviewing dependency PRs

A dependency PR's green check is a claim about the commit it ran on, not about
`main` as it is now. Re-verify locally before merging anything.

## Triage the batch

```bash
gh pr list --state open --limit 20 \
  --json number,title,author,isDraft,mergeable,additions,deletions \
  -q '.[] | "\(.number)\t\(.author.login)\tmergeable=\(.mergeable)\t\(.title)"'
gh pr checks <n>
```

Three states worth separating:

- **Green** — still re-verify locally; the run may predate your latest commits.
- **Red** — read the actual failure before dismissing it. A dependency PR can
  fail for a reason that has nothing to do with its own change.
- **`mergeable=UNKNOWN`** — GitHub hasn't computed the merge yet; a local merge
  answers it immediately.

Read the real error, not the log tail — `--log-failed` output ends with git
cleanup noise that hides the cause:

```bash
gh run view <run-id> --log-failed 2>&1 | grep -iE "npm error|error TS|✖" | head -20
```

## Verify locally in a throwaway worktree

Never test PRs in the working tree — `npm ci` will replace `node_modules` and a
half-merged state is easy to commit by accident.

```bash
git worktree add -q -d "$TMPDIR/ht-pr" main   # -d = detached, main is checked out already
cd "$TMPDIR/ht-pr"
git fetch -q origin pull/<n>/head:pr<n>
git merge --no-edit pr<n>
npm ci && npm run verify && npm run verify:tz && npm run build
```

Stack the PRs you intend to merge onto one worktree in sequence. A conflict or
failure at that point tells you where to stop: merge the clean prefix, leave the
rest.

```bash
git merge --abort; git reset --hard <last-good-sha>   # back out, continue with the next
```

Clean up when done, or the worktree lingers in `git worktree list`:

```bash
cd <repo> && git worktree remove --force "$TMPDIR/ht-pr"
git branch -D pr<n> ...
```

## Known failure modes in this repo

- **`npm error git dep preparation failed`** on `@codemirror/language` — caused
  by `"obsidian": "latest"` in `package.json`, which npm resolves as a git
  dependency and cannot build in CI. The fix rides along in the dependabot
  group PR that changes `"latest"` to `"*"`. Merge that one first and the
  unrelated-looking failures on other PRs disappear. Don't debug them
  individually.
- **`ERESOLVE` peer conflict** — a real incompatibility, e.g. a TypeScript major
  bump that `@typescript-eslint` doesn't yet support. Leave the PR open with a
  comment; it resolves itself when the peer catches up.
- **Conflicting lockfiles** — two dependabot PRs both rewriting
  `package-lock.json` will conflict with each other even though each is fine
  alone. Merge one, let dependabot rebase the rest.

## Merge and confirm

```bash
gh pr merge <n> --squash --delete-branch
```

`gh pr merge` prints nothing on success, so confirm rather than assume:

```bash
gh pr view <n> --json state,mergedAt -q '.'
gh run list --branch main --workflow=ci.yml --limit 1 \
  --json status,conclusion,headSha -q '.[]|"\(.status)/\(.conclusion) \(.headSha[0:7])"'
```

Back-to-back merges cancel each other's CI runs — the intermediate ones show
`cancelled`, which is expected. Only the run on the final SHA matters, and it
must be `completed/success` before you call the batch done.

## Don't

- Merge on a green check alone when `main` has moved since that run.
- Merge a PR you couldn't build locally, dependency-only or not.
- Batch-merge lockfile PRs without checking they don't conflict with each other.
