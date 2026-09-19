#!/usr/bin/env bash
# PostToolUse hook: format + autofix the file an agent just edited.
#
# Without this, a stray space fails CI's `format:check` after the change has
# already been pushed — a full round trip for something prettier fixes locally
# in under a second. Scoped to src/ so vendored/EXAMPLE_VAULT files are left
# alone. Always exits 0: a formatting hook must never block an edit.
set -uo pipefail

repo_root="$(cd "$(dirname "${BASH_SOURCE[0]}")/../.." && pwd)"

file="$(node -e '
let d = "";
process.stdin.on("data", (c) => (d += c)).on("end", () => {
  try {
    const j = JSON.parse(d);
    process.stdout.write((j.tool_input && j.tool_input.file_path) || "");
  } catch {}
});')"

[ -n "$file" ] && [ -f "$file" ] || exit 0

case "$file" in
  "$repo_root"/src/*) ;;
  *) exit 0 ;;
esac

case "$file" in
  *.ts|*.tsx|*.scss|*.json)
    npx --no-install prettier --write "$file" >/dev/null 2>&1
    ;;
  *) exit 0 ;;
esac

case "$file" in
  *.ts|*.tsx)
    npx --no-install eslint --fix "$file" >/dev/null 2>&1
    ;;
esac

exit 0
