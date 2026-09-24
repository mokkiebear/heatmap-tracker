#!/bin/bash
#
# Regenerates EXAMPLE_VAULT/daily notes with two years of sample data: the
# previous full calendar year and the current year up to today.
#
# Run it from the repo root when the vault's data has aged out of the examples
# (they render "today"-relative things like `daysToShow`, so stale notes make
# whole pages look broken):
#
#   ./generate_examples.sh
#
# Deterministic: the same day always gets the same values, so re-running it
# produces no diff unless the date range actually moved.

set -euo pipefail

OUTPUT_DIR="./EXAMPLE_VAULT/daily notes"

if [[ ! -d "./EXAMPLE_VAULT" ]]; then
  echo "error: run this from the repo root (no ./EXAMPLE_VAULT here)" >&2
  exit 1
fi

# GNU date and BSD/macOS date disagree on everything; pick whichever is here.
if date -d "2020-01-01 +1 day" >/dev/null 2>&1; then
  add_day() { date -d "$1 +1 day" +%F; }
else
  add_day() { date -j -v+1d -f %F "$1" +%F; }
fi

TODAY=$(date +%F)
START="$(($(date +%Y) - 1))-01-01"

rm -rf "$OUTPUT_DIR"
mkdir -p "$OUTPUT_DIR"

# Deterministic pseudo-randomness: FNV-1a over the date, so a given day always
# gets the same numbers no matter when the script runs.
hash_of() {
  local text="$1" hash=2166136261 i char
  for ((i = 0; i < ${#text}; i++)); do
    printf -v char '%d' "'${text:i:1}"
    hash=$(((hash ^ char) * 16777619 & 0xFFFFFFFF))
  done
  echo "$hash"
}

pick() { # pick <hash> <salt> <min> <max> -> value in [min, max]
  local h=$(($1 / $2))
  echo $((h % ($4 - $3 + 1) + $3))
}

written=0
skipped=0
DATE="$START"

while [[ "$DATE" < "$TODAY" || "$DATE" == "$TODAY" ]]; do
  H=$(hash_of "$DATE")

  # Roughly one day in six has no note at all — an all-green heatmap doesn't
  # show off much, and the gaps exercise the "missing day" rendering.
  if (($(pick "$H" 7 0 5) == 0)); then
    skipped=$((skipped + 1))
    DATE=$(add_day "$DATE")
    continue
  fi

  STEPS=$(pick "$H" 3 1000 14000)
  EXERCISE=$(pick "$H" 11 0 90)
  LEARNING=$(pick "$H" 23 0 150)
  MOOD=$(pick "$H" 31 1 5)
  WAKE_HOUR=$(pick "$H" 41 5 9)
  WAKE_MINUTE=$(pick "$H" 53 0 59)
  SLEEP_HOUR=$(pick "$H" 61 21 23)
  SLEEP_MINUTE=$(pick "$H" 71 0 59)

  WAKE_TIME=$(printf '%sT%02d:%02d' "$DATE" "$WAKE_HOUR" "$WAKE_MINUTE")
  SLEEP_TIME=$(printf '%sT%02d:%02d' "$DATE" "$SLEEP_HOUR" "$SLEEP_MINUTE")

  {
    echo "---"
    echo "steps: $STEPS"
    echo "exercise: $EXERCISE minutes"
    # A third of the days have no `learning` at all. Days with a partial log
    # are the whole point of `intensityConfig.aggregation: average`, so the
    # vault has to contain some.
    if (($(pick "$H" 89 0 2) != 0)); then
      echo "learning: $LEARNING minutes"
    fi
    echo "mood: $MOOD"
    echo "---"
    echo "## ${DATE}"
    echo "Good morning! Today is a beautiful day."
    echo "I'm going to learn something new today."
    echo ""
    echo "I learned about the history of the Roman Empire."
    echo ""
    echo "What do you think about the Roman Empire?"
    echo ""
    echo "I woke up today at [Woke:: $WAKE_TIME]"
    echo "I went to bed today at [Sleep:: $SLEEP_TIME]"
    echo ""
    echo "#### Task tracking example"
    for TASK_NUM in 1 2 3 4 5; do
      if (($(pick "$H" $((97 + TASK_NUM)) 0 1) == 0)); then
        echo "- [x] Task ${TASK_NUM}"
      else
        echo "- [ ] Task ${TASK_NUM}"
      fi
    done
  } >"${OUTPUT_DIR}/${DATE}.md"

  written=$((written + 1))
  DATE=$(add_day "$DATE")
done

# Fixed notes the docs point at by name. They must keep existing, and they must
# land in the year those examples pin (`year:` in the codeblocks), which is the
# previous full year — the current one is only filled up to today.
FIXTURE_YEAR=$(($(date +%Y) - 1))

# EXAMPLE_VAULT/Github Issues/62 — five intensities in a row, including 0 and
# negatives, to prove 0 gets its own colour rather than being dropped.
day=1
for value in -2 -1 0 1 2; do
  ISSUE_DATE=$(printf '%s-04-%02d' "$FIXTURE_YEAR" "$day")
  FILE="${OUTPUT_DIR}/${ISSUE_DATE}.md"
  if [[ -f "$FILE" ]]; then
    # Splice the property into the note that's already there.
    awk -v v="$value" 'NR==1{print; print "issue_62: " v; next} {print}' \
      "$FILE" >"${FILE}.tmp" && mv "${FILE}.tmp" "$FILE"
  else
    printf -- '---\nissue_62: %s\n---\n\nFixture for issue #62.\n' \
      "$value" >"$FILE"
  fi
  day=$((day + 1))
done

# EXAMPLE_VAULT/Github Issues/67 — a zero that `excludeFalsy` should drop.
printf -- '---\nexercise: "0"\n---\n\nThis file should be excluded when the `excludeFalsy` flag is on.\n' \
  >"${OUTPUT_DIR}/${FIXTURE_YEAR}-04-06.md"

echo "Wrote $written notes ($skipped days intentionally left blank)"
echo "Range: $START .. $TODAY"
echo "Fixtures: issue_62 on ${FIXTURE_YEAR}-04-01..05, excludeFalsy zero on ${FIXTURE_YEAR}-04-06"
