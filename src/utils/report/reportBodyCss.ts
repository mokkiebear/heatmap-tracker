/**
 * Styles for note bodies rendered by Obsidian's Markdown renderer. The renderer
 * emits Obsidian's class names (`.callout`, `.token`, ...) and
 * relies on the app's stylesheet to draw them, which a standalone report
 * doesn't have — so the subset a note body can produce is restated here, on
 * the report's own light/dark variables.
 */
export const REPORT_BODY_CSS = `
  :root {
    --wlr-code-bg: #f6f8fa; --wlr-border: #d0d7de; --wlr-muted: #6b7280;
    --wlr-callout-note: 8, 109, 221; --wlr-callout-tip: 0, 191, 188;
    --wlr-callout-success: 8, 185, 78;
    --wlr-callout-warning: 236, 117, 0; --wlr-callout-danger: 233, 49, 71;
    --wlr-callout-quote: 158, 158, 158;
    --wlr-tok-comment: #6a737d; --wlr-tok-keyword: #cf222e; --wlr-tok-string: #0a3069;
    --wlr-tok-number: #0550ae; --wlr-tok-function: #8250df; --wlr-tok-punct: #57606a;
  }
  @media (prefers-color-scheme: dark) {
    :root {
      --wlr-code-bg: #161b22; --wlr-border: #30363d; --wlr-muted: #8b949e;
      --wlr-tok-comment: #8b949e; --wlr-tok-keyword: #ff7b72; --wlr-tok-string: #a5d6ff;
      --wlr-tok-number: #79c0ff; --wlr-tok-function: #d2a8ff; --wlr-tok-punct: #8b949e;
    }
  }
  .wlr-body > :first-child { margin-top: 0.25rem; }
  .wlr-body > :last-child { margin-bottom: 0.25rem; }
  .wlr-body img { max-width: 100%; }
  .wlr-body ol { margin: 0.25rem 0; padding-left: 1.5rem; }
  .wlr-body ul ul, .wlr-body ol ol, .wlr-body ul ol, .wlr-body ol ul { margin: 0; }
  .wlr-body blockquote { margin: 0.5rem 0; padding: 0 0 0 0.9rem; border-left: 3px solid var(--wlr-border); color: var(--wlr-muted); }
  .wlr-body hr { border: 0; border-top: 1px solid var(--wlr-border); margin: 0.75rem 0; }
  .wlr-body table { border-collapse: collapse; margin: 0.5rem 0; }
  .wlr-body th, .wlr-body td { border: 1px solid var(--wlr-border); padding: 0.25rem 0.6rem; }
  .wlr-body mark { background: rgba(255, 208, 0, 0.4); color: inherit; }
  .wlr-body .internal-link, .wlr-body .tag { color: #0969da; }
  .wlr-body .task-list-item { list-style: none; margin-left: -1.25rem; }
  .wlr-body .task-list-item-checkbox { margin-right: 0.4rem; }
  .wlr-body code { font-family: ui-monospace, SFMono-Regular, Menlo, Consolas, monospace; font-size: 0.85em; background: var(--wlr-code-bg); padding: 0.1em 0.35em; border-radius: 4px; }
  .wlr-body pre { margin: 0.5rem 0; padding: 0.6rem 0.8rem; background: var(--wlr-code-bg); border: 1px solid var(--wlr-border); border-radius: 6px; overflow-x: auto; }
  .wlr-body pre code { background: none; padding: 0; font-size: 0.85em; }
  .wlr-body .token.comment, .wlr-body .token.prolog, .wlr-body .token.doctype { color: var(--wlr-tok-comment); }
  .wlr-body .token.keyword, .wlr-body .token.operator, .wlr-body .token.boolean, .wlr-body .token.important { color: var(--wlr-tok-keyword); }
  .wlr-body .token.string, .wlr-body .token.char, .wlr-body .token.attr-value, .wlr-body .token.regex { color: var(--wlr-tok-string); }
  .wlr-body .token.number, .wlr-body .token.constant, .wlr-body .token.property, .wlr-body .token.tag, .wlr-body .token.symbol { color: var(--wlr-tok-number); }
  .wlr-body .token.function, .wlr-body .token.class-name, .wlr-body .token.builtin { color: var(--wlr-tok-function); }
  .wlr-body .token.punctuation { color: var(--wlr-tok-punct); }
  .wlr-body .callout { --wlr-c: var(--wlr-callout-note); margin: 0.6rem 0; padding: 0.6rem 0.9rem; border-radius: 6px; border-left: 3px solid rgb(var(--wlr-c)); background: rgba(var(--wlr-c), 0.1); }
  .wlr-body .callout[data-callout="tip"], .wlr-body .callout[data-callout="hint"], .wlr-body .callout[data-callout="important"] { --wlr-c: var(--wlr-callout-tip); }
  .wlr-body .callout[data-callout="success"], .wlr-body .callout[data-callout="check"], .wlr-body .callout[data-callout="done"] { --wlr-c: var(--wlr-callout-success); }
  .wlr-body .callout[data-callout="question"], .wlr-body .callout[data-callout="help"], .wlr-body .callout[data-callout="faq"], .wlr-body .callout[data-callout="warning"], .wlr-body .callout[data-callout="caution"], .wlr-body .callout[data-callout="attention"] { --wlr-c: var(--wlr-callout-warning); }
  .wlr-body .callout[data-callout="danger"], .wlr-body .callout[data-callout="error"], .wlr-body .callout[data-callout="failure"], .wlr-body .callout[data-callout="fail"], .wlr-body .callout[data-callout="missing"], .wlr-body .callout[data-callout="bug"] { --wlr-c: var(--wlr-callout-danger); }
  .wlr-body .callout[data-callout="quote"], .wlr-body .callout[data-callout="cite"], .wlr-body .callout[data-callout="example"], .wlr-body .callout[data-callout="abstract"], .wlr-body .callout[data-callout="summary"], .wlr-body .callout[data-callout="tldr"] { --wlr-c: var(--wlr-callout-quote); }
  .wlr-body .callout-title { display: flex; align-items: center; gap: 0.4rem; font-weight: 600; color: rgb(var(--wlr-c)); }
  .wlr-body .callout-icon { display: inline-flex; width: 1.1em; height: 1.1em; }
  .wlr-body .callout-icon svg { width: 100%; height: 100%; }
  .wlr-body .callout-content > :first-child { margin-top: 0.4rem; }
  .wlr-body .callout-content > :last-child { margin-bottom: 0; }
  .wlr-body .markdown-embed { margin: 0.5rem 0; padding: 0 0 0 0.9rem; border-left: 3px solid var(--wlr-border); }
  .wlr-body .markdown-embed-title { display: none; }
`;
