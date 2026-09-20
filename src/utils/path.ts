/**
 * Path string helpers shared by the export screen, the report writer and the
 * box click handler.
 *
 * These deliberately avoid regular expressions. Both `/^\/+|\/+$/` and
 * `/<[^>]*>/` are quadratic on adversarial input (a title or folder made of
 * thousands of `/` or `<`), and a heatmap's `basePath` and title come from the
 * user's note, so the input is not under our control. CodeQL flags them as
 * polynomial ReDoS; a linear scan is both faster and simpler to reason about.
 */

/** Strips leading and trailing `/` from a folder path. `"///"` becomes `""`. */
export function trimSlashes(value: string): string {
  let start = 0;
  let end = value.length;

  while (start < end && value[start] === "/") {
    start += 1;
  }
  while (end > start && value[end - 1] === "/") {
    end -= 1;
  }

  return value.slice(start, end);
}

/**
 * Removes `<...>` markup in a single linear pass.
 *
 * Nesting is tracked with a depth counter rather than matched pairwise, so
 * `<scr<b>ipt>` cannot reassemble into `<script>` the way a repeated
 * `.replace(/<[^>]*>/g, "")` allows. A `>` with nothing open is kept — it is an
 * ordinary character in a title like `2 > 1`, and the caller replaces it later
 * as an illegal filename character. An unclosed `<` swallows the rest of the
 * string, which is the safe direction for a value about to become a filename.
 */
export function stripTags(value: string): string {
  let result = "";
  let depth = 0;

  for (const char of value) {
    if (char === "<") {
      depth += 1;
    } else if (char === ">") {
      if (depth > 0) {
        depth -= 1;
      } else {
        result += char;
      }
    } else if (depth === 0) {
      result += char;
    }
  }

  return result;
}
