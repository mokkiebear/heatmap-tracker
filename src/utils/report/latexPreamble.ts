import { App } from "obsidian";

export type LatexMacros = Record<string, string>;

/** A comment runs to the end of the line, unless the `%` is escaped. */
function stripComments(source: string): string {
  return source.replace(/(^|[^\\])%.*$/gm, "$1");
}

/** Reads the brace group starting at `open`, returning its body and where it ends. */
function readGroup(
  source: string,
  open: number,
): { body: string; end: number } | null {
  if (source[open] !== "{") return null;
  let depth = 0;
  for (let i = open; i < source.length; i++) {
    if (source[i] === "\\") {
      i++;
      continue;
    }
    if (source[i] === "{") depth++;
    else if (source[i] === "}") {
      depth--;
      if (depth === 0) return { body: source.slice(open + 1, i), end: i + 1 };
    }
  }
  return null;
}

const skipSpace = (source: string, i: number) => {
  while (i < source.length && /\s/.test(source[i])) i++;
  return i;
};

/**
 * Translates a MathJax preamble's `\newcommand`s and `\DeclareMathOperator`s
 * into KaTeX's `macros` map. Anything else in the file is skipped.
 */
export function parsePreamble(source: string): LatexMacros {
  const src = stripComments(source);
  const macros: LatexMacros = {};
  const definitions =
    /\\(newcommand|renewcommand|providecommand|DeclareMathOperator)(\*?)/g;

  let match: RegExpExecArray | null;
  while ((match = definitions.exec(src)) !== null) {
    const [, kind, starred] = match;
    let i = skipSpace(src, match.index + match[0].length);

    // The name comes either wrapped, `{\name}`, or bare, `\name`.
    let name: string | undefined;
    if (src[i] === "{") {
      const group = readGroup(src, i);
      if (!group) continue;
      name = group.body.trim();
      i = group.end;
    } else {
      const bare = /^\\(?:[a-zA-Z@]+|.)/.exec(src.slice(i));
      if (!bare) continue;
      name = bare[0];
      i += bare[0].length;
    }
    if (!name?.startsWith("\\")) continue;

    // `[n]` and `[default]`: KaTeX infers the argument count from `#1`s.
    i = skipSpace(src, i);
    while (src[i] === "[") {
      const close = src.indexOf("]", i);
      if (close === -1) break;
      i = skipSpace(src, close + 1);
    }

    const body = readGroup(src, i);
    if (!body) continue;

    macros[name] =
      kind === "DeclareMathOperator"
        ? `\\operatorname${starred}{${body.body.trim()}}`
        : body.body;
  }

  return macros;
}

/** Macros from the vault's `preamble.sty` (the file Obsidian's MathJax reads), if any. */
export async function readPreambleMacros(app: App): Promise<LatexMacros> {
  try {
    const path = `${app.vault.configDir}/preamble.sty`;
    if (!(await app.vault.adapter.exists(path))) return {};
    return parsePreamble(await app.vault.adapter.read(path));
  } catch {
    return {};
  }
}
