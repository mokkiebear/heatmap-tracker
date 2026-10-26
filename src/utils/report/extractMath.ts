export interface MathSegment {
  tex: string;
  display: boolean;
}

/** Plain alphanumerics, so Markdown rendering passes it through untouched. */
export const mathToken = (index: number) => `HTPMATH${index}X`;
export const MATH_TOKEN_RE = /HTPMATH(\d+)X/g;

/**
 * Swaps every `$…$` and `$$…$$` in a note for a token, outside code spans and
 * fenced code, following Obsidian's rules: inline math can't start or end on
 * a space or cross a blank line, and `\$` is a literal dollar.
 */
export function extractMath(markdown: string): {
  markdown: string;
  math: MathSegment[];
} {
  const math: MathSegment[] = [];
  let out = "";
  let i = 0;

  const push = (tex: string, display: boolean) => {
    out += mathToken(math.length);
    math.push({ tex: tex.trim(), display });
  };

  while (i < markdown.length) {
    const atLineStart = i === 0 || markdown[i - 1] === "\n";
    const fence = atLineStart && /^ {0,3}(`{3,}|~{3,})/.exec(markdown.slice(i));
    if (fence) {
      const marker = fence[1];
      const closeRe = new RegExp(
        `\\n {0,3}${marker[0]}{${marker.length},}[^\\n]*`,
      );
      const close = closeRe.exec(markdown.slice(i + fence[0].length));
      const end = close
        ? i + fence[0].length + close.index + close[0].length
        : markdown.length;
      out += markdown.slice(i, end);
      i = end;
      continue;
    }

    const ch = markdown[i];

    if (ch === "\\") {
      out += markdown.slice(i, i + 2);
      i += 2;
      continue;
    }

    if (ch === "`") {
      const run = /^`+/.exec(markdown.slice(i))![0];
      const close = markdown.indexOf(run, i + run.length);
      const end = close === -1 ? i + run.length : close + run.length;
      out += markdown.slice(i, end);
      i = end;
      continue;
    }

    if (ch === "$" && markdown[i + 1] === "$") {
      const close = findClosing(markdown, "$$", i + 2);
      if (close !== -1) {
        push(markdown.slice(i + 2, close), true);
        i = close + 2;
        continue;
      }
    } else if (ch === "$" && markdown[i + 1] && !/\s/.test(markdown[i + 1])) {
      const close = findClosing(markdown, "$", i + 1);
      const tex = close === -1 ? "" : markdown.slice(i + 1, close);
      if (tex && !/\s$/.test(tex) && !/\n\s*\n/.test(tex)) {
        push(tex, false);
        i = close + 1;
        continue;
      }
    }

    out += ch;
    i += 1;
  }

  return { markdown: out, math };
}

/** Index of the next unescaped `delimiter` from `from`, or -1. */
function findClosing(source: string, delimiter: string, from: number): number {
  for (let i = from; i < source.length; i++) {
    if (source[i] === "\\") {
      i++;
      continue;
    }
    if (source.startsWith(delimiter, i)) return i;
  }
  return -1;
}
