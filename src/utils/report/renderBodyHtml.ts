import { App, Component, MarkdownRenderer } from "obsidian";
import katex from "katex";
import {
  MATH_TOKEN_RE,
  MathSegment,
  extractMath,
} from "src/utils/report/extractMath";
import {
  LatexMacros,
  readPreambleMacros,
} from "src/utils/report/latexPreamble";

/** Longest we wait for async embeds (`![[note]]`, images) to finish loading. */
const EMBED_SETTLE_TIMEOUT_MS = 1000;
const EMBED_POLL_MS = 50;

/** Rendered HTML by note path, with the body it was rendered from. */
export type RenderedBodyCache = Map<string, { body: string; html: string }>;

/**
 * Turns Obsidian's live reading-view DOM into markup that is safe to embed in
 * a standalone document: no controls, no navigation that can only work inside
 * the app.
 */
export function cleanRenderedDom(root: HTMLElement): void {
  root
    .querySelectorAll(
      ".copy-code-button, .edit-block-button, .collapse-indicator, .heading-collapse-indicator, .list-collapse-indicator",
    )
    .forEach((el) => el.remove());

  // A saved report is opened straight in a browser, outside the preview's
  // sandboxed iframe, so anything executable a note could carry goes here.
  root
    .querySelectorAll("script, iframe, object, embed")
    .forEach((el) => el.remove());
  root.querySelectorAll("*").forEach((el) => {
    el.getAttributeNames()
      .filter((name) => name.toLowerCase().startsWith("on"))
      .forEach((name) => el.removeAttribute(name));
  });

  // `[[wikilinks]]` and `#tags` resolve through the app, so outside it they
  // are dead links. Keep the text and the class (for styling), drop the href.
  root.querySelectorAll("a.internal-link, a.tag").forEach((a) => {
    const span = createSpan();
    span.className = a.className;
    span.append(...Array.from(a.childNodes));
    a.replaceWith(span);
  });

  root.querySelectorAll("[contenteditable]").forEach((el) => {
    el.removeAttribute("contenteditable");
  });
}

/** Replaces each math token left by `extractMath` with KaTeX's rendering of it. */
export function insertMath(
  root: HTMLElement,
  math: MathSegment[],
  macros: LatexMacros,
): void {
  const walker = document.createTreeWalker(root, NodeFilter.SHOW_TEXT);
  const textNodes: Text[] = [];
  while (walker.nextNode()) textNodes.push(walker.currentNode as Text);

  for (const node of textNodes) {
    const text = node.data;
    if (!text.includes("HTPMATH")) continue;

    const fragment = createFragment();
    let last = 0;
    for (const match of text.matchAll(MATH_TOKEN_RE)) {
      const segment = math[Number(match[1])];
      if (!segment) continue;
      fragment.append(text.slice(last, match.index));
      // KaTeX builds the nodes into `host`; they move into place without it.
      const host = createSpan();
      katex.render(segment.tex, host, {
        displayMode: segment.display,
        output: "html",
        throwOnError: false,
        macros: { ...macros },
      });
      fragment.append(...Array.from(host.childNodes));
      last = match.index + match[0].length;
    }
    fragment.append(text.slice(last));
    node.replaceWith(fragment);
  }
}

/** Resolves once nothing under `root` is still loading, or after the timeout. */
async function settle(root: HTMLElement): Promise<void> {
  for (
    let waited = 0;
    waited < EMBED_SETTLE_TIMEOUT_MS && root.querySelector(".is-loading");
    waited += EMBED_POLL_MS
  ) {
    await new Promise((resolve) => window.setTimeout(resolve, EMBED_POLL_MS));
  }
}

/**
 * Renders one note body with Obsidian's own Markdown renderer, so code,
 * callouts, tables, task lists and embeds come out as in reading view. Math is
 * rendered with KaTeX instead: Obsidian's MathJax output depends on styles and
 * fonts that only exist inside the app.
 */
export async function renderBodyToHtml(
  app: App,
  body: string,
  sourcePath: string,
  macros: LatexMacros = {},
): Promise<string> {
  // Some post-processors only run on connected elements, so render into a
  // hidden node in the document rather than a detached one.
  const host = document.body.createDiv({ cls: "markdown-rendered" });
  host.setCssStyles({
    position: "fixed",
    left: "-99999px",
    top: "0",
    width: "720px",
    visibility: "hidden",
  });

  const component = new Component();
  component.load();

  try {
    const { markdown, math } = extractMath(body);
    await MarkdownRenderer.render(app, markdown, host, sourcePath, component);
    await settle(host);
    cleanRenderedDom(host);
    insertMath(host, math, macros);
    return host.innerHTML;
  } finally {
    component.unload();
    host.remove();
  }
}

/**
 * Renders note bodies keyed by vault path. A note that fails to render is left
 * out, so the report falls back to its plain-text body for that day instead of
 * losing the whole export. `cache` skips notes whose body hasn't changed.
 */
export async function renderBodiesToHtml(
  app: App,
  bodiesByPath: Record<string, string>,
  options: { cache?: RenderedBodyCache; isCancelled?: () => boolean } = {},
): Promise<Record<string, string>> {
  const { cache, isCancelled } = options;
  const htmlByPath: Record<string, string> = {};

  const macros = await readPreambleMacros(app);

  for (const [path, body] of Object.entries(bodiesByPath)) {
    if (isCancelled?.()) break;

    const cached = cache?.get(path);
    if (cached && cached.body === body) {
      htmlByPath[path] = cached.html;
      continue;
    }

    try {
      const html = await renderBodyToHtml(app, body, path, macros);
      htmlByPath[path] = html;
      cache?.set(path, { body, html });
    } catch (error) {
      console.warn(
        `Heatmap Tracker: could not render "${path}" for the report.`,
        error,
      );
    }
  }

  return htmlByPath;
}
