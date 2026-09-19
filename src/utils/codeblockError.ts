import { setIcon } from "obsidian";

import i18n from "src/localization/i18n";

/**
 * Why a `heatmap-tracker` codeblock produced nothing.
 *
 * Every one of these used to end in `console.warn`, so the note showed an empty
 * space and the reader had no way to tell a broken codeblock from a vault with
 * no data yet. Obsidian users do not open the developer console.
 */
export type CodeblockIssue =
  | { kind: "dataview-missing" }
  | { kind: "missing-property" }
  | { kind: "invalid-yaml"; detail?: string }
  | { kind: "unexpected"; detail?: string };

interface IssueCopy {
  title: string;
  body: string;
  /** Shown in a code block under the message. Never translated. */
  snippet?: string;
  /** Raw error text, shown verbatim so it can be searched or reported. */
  detail?: string;
  action?: { label: string; href: string };
}

const EXAMPLE_CODEBLOCK = "```heatmap-tracker\nproperty: steps\n```";

export function describeCodeblockIssue(issue: CodeblockIssue): IssueCopy {
  switch (issue.kind) {
    case "dataview-missing":
      return {
        title: i18n.t("errors.dataviewMissing.title"),
        body: i18n.t("errors.dataviewMissing.body"),
        action: {
          label: i18n.t("errors.dataviewMissing.action"),
          // Opens the plugin's page inside Obsidian — no browser round trip.
          href: "obsidian://show-plugin?id=dataview",
        },
      };
    case "missing-property":
      return {
        title: i18n.t("errors.missingProperty.title"),
        body: i18n.t("errors.missingProperty.body"),
        snippet: EXAMPLE_CODEBLOCK,
      };
    case "invalid-yaml":
      return {
        title: i18n.t("errors.invalidYaml.title"),
        body: i18n.t("errors.invalidYaml.body"),
        snippet: EXAMPLE_CODEBLOCK,
        detail: issue.detail,
      };
    case "unexpected":
      return {
        title: i18n.t("errors.unexpected.title"),
        body: i18n.t("errors.unexpected.body"),
        detail: issue.detail,
      };
  }
}

/**
 * Plain DOM rather than Obsidian's `createDiv`/`createEl` helpers: this module
 * also runs under jest and in the render harness, neither of which patches
 * HTMLElement with Obsidian's extensions.
 */
function append<K extends keyof HTMLElementTagNameMap>(
  parent: HTMLElement,
  tag: K,
  options: { cls?: string; text?: string; href?: string } = {},
): HTMLElementTagNameMap[K] {
  const element = document.createElement(tag);

  if (options.cls) element.className = options.cls;
  if (options.text) element.textContent = options.text;
  if (options.href && element instanceof HTMLAnchorElement) {
    element.href = options.href;
  }

  parent.appendChild(element);
  return element;
}

function createCard(
  el: HTMLElement,
  variant: "error" | "hint",
  icon: string,
): HTMLElement {
  const card = append(el, "div", {
    cls: `heatmap-tracker-message heatmap-tracker-message--${variant}`,
  });
  card.setAttribute("role", variant === "error" ? "alert" : "status");

  setIcon(append(card, "div", { cls: "heatmap-tracker-message__icon" }), icon);

  return append(card, "div", { cls: "heatmap-tracker-message__body" });
}

/** Renders the failure into the note, in place of the heatmap. */
export function renderCodeblockIssue(
  el: HTMLElement,
  issue: CodeblockIssue,
): void {
  const copy = describeCodeblockIssue(issue);
  const body = createCard(el, "error", "alert-triangle");

  append(body, "div", {
    cls: "heatmap-tracker-message__title",
    text: copy.title,
  });
  append(body, "p", { cls: "heatmap-tracker-message__text", text: copy.body });

  if (copy.snippet) {
    append(body, "pre", {
      cls: "heatmap-tracker-message__snippet",
      text: copy.snippet,
    });
  }

  if (copy.detail) {
    append(body, "pre", {
      cls: "heatmap-tracker-message__detail",
      text: copy.detail,
    });
  }

  if (copy.action) {
    append(body, "a", {
      cls: "heatmap-tracker-message__action",
      text: copy.action.label,
      href: copy.action.href,
    });
  }
}

/**
 * Rendered *under* a heatmap that came back empty. An empty grid is a legitimate
 * state — a vault that hasn't been filled in yet — so this explains rather than
 * replaces it.
 */
export function renderNoMatchesHint(
  el: HTMLElement,
  { property, path }: { property: string; path?: string },
): void {
  const body = createCard(el, "hint", "info");

  append(body, "div", {
    cls: "heatmap-tracker-message__title",
    text: i18n.t("errors.noMatches.title"),
  });
  append(body, "p", {
    cls: "heatmap-tracker-message__text",
    text: path
      ? i18n.t("errors.noMatches.body", { property, path })
      : i18n.t("errors.noMatches.bodyNoPath", { property }),
  });
}
