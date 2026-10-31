import { App, MarkdownRenderer } from "obsidian";
import {
  RenderedBodyCache,
  cleanRenderedDom,
  insertMath,
  renderBodiesToHtml,
  renderBodyToHtml,
} from "../renderBodyHtml";

const app = new App();

beforeEach(() => jest.spyOn(MarkdownRenderer, "render"));
afterEach(() => jest.restoreAllMocks());

function dom(html: string): HTMLElement {
  const root = document.createElement("div");
  root.innerHTML = html;
  return root;
}

describe("cleanRenderedDom", () => {
  it("drops the controls Obsidian adds to code blocks and callouts", () => {
    const root = dom(
      '<pre><code>x</code><button class="copy-code-button">Copy</button></pre>' +
        '<div class="callout is-collapsible"><div class="callout-title"><div class="callout-fold collapse-indicator">v</div></div></div>',
    );

    cleanRenderedDom(root);

    expect(root.querySelector(".copy-code-button")).toBeNull();
    expect(root.querySelector(".collapse-indicator")).toBeNull();
    expect(root.querySelector("pre code")?.textContent).toBe("x");
  });

  it("turns in-app links into plain spans, keeping text and class", () => {
    const root = dom(
      '<a class="internal-link" data-href="Note" href="Note">my <b>note</b></a>' +
        '<a class="tag" href="#todo">#todo</a>' +
        '<a class="external-link" href="https://example.com">site</a>',
    );

    cleanRenderedDom(root);

    expect(root.querySelector("a.internal-link, a.tag")).toBeNull();
    const span = root.querySelector("span.internal-link");
    expect(span?.textContent).toBe("my note");
    expect(span?.querySelector("b")).not.toBeNull();
    expect(root.querySelector("span.tag")?.textContent).toBe("#todo");
    expect(root.querySelector("a.external-link")?.getAttribute("href")).toBe(
      "https://example.com",
    );
  });

  it("strips executable markup, since a saved report runs unsandboxed", () => {
    const root = dom(
      "<p>keep</p><script>alert(1)</script>" +
        '<iframe src="x"></iframe><object data="x"></object><embed src="x" />' +
        '<img src="x" onerror="alert(1)" ONLOAD="alert(2)" />',
    );

    cleanRenderedDom(root);

    expect(root.querySelector("script, iframe, object, embed")).toBeNull();
    const img = root.querySelector("img");
    expect(img?.getAttribute("onerror")).toBeNull();
    expect(img?.getAttribute("onload")).toBeNull();
    expect(root.querySelector("p")?.textContent).toBe("keep");
  });
});

describe("insertMath", () => {
  it("replaces each token with KaTeX's HTML, leaving the text around it", () => {
    const root = dom("<ul><li>on HTPMATH0X &amp; on HTPMATH1X</li></ul>");

    insertMath(
      root,
      [
        { tex: "c_1", display: false },
        { tex: "c_2+c_3", display: false },
      ],
      {},
    );

    const li = root.querySelector("li")!;
    expect(li.querySelectorAll(".katex")).toHaveLength(2);
    expect(li.textContent).toContain("on ");
    expect(li.textContent).toContain(" & on ");
    expect(li.textContent).not.toContain("HTPMATH");
  });

  it("renders display math as a block and expands preamble macros", () => {
    const root = dom("<p>HTPMATH0X</p>");

    insertMath(root, [{ tex: "\\R", display: true }], {
      "\\R": "\\mathbb{R}",
    });

    expect(root.querySelector(".katex-display")).not.toBeNull();
    expect(root.querySelector(".mathbb")).not.toBeNull();
  });

  it("shows bad TeX as an error instead of throwing", () => {
    const root = dom("<p>HTPMATH0X</p>");

    expect(() =>
      insertMath(root, [{ tex: "\\frac{", display: false }], {}),
    ).not.toThrow();
    expect(root.querySelector(".katex-error")).not.toBeNull();
  });
});

describe("renderBodyToHtml", () => {
  it("renders with the app's renderer against the note's own path, leaving nothing behind", async () => {
    const html = await renderBodyToHtml(app, "hello", "Daily/2026-07-13.md");

    expect(html).toBe("<p>hello</p>");
    expect(MarkdownRenderer.render).toHaveBeenCalledWith(
      app,
      "hello",
      expect.any(HTMLElement),
      "Daily/2026-07-13.md",
      expect.anything(),
    );
    expect(document.body.querySelector(".markdown-rendered")).toBeNull();
  });

  it("hands Obsidian the note with math swapped out, then renders it with KaTeX", async () => {
    const html = await renderBodyToHtml(app, "on $c_1$", "a.md");

    expect(MarkdownRenderer.render).toHaveBeenCalledWith(
      app,
      "on HTPMATH0X",
      expect.any(HTMLElement),
      "a.md",
      expect.anything(),
    );
    expect(html).toContain('class="katex"');
    expect(html).not.toContain("HTPMATH");
  });
});

describe("renderBodiesToHtml", () => {
  it("keys the rendered HTML by note path", async () => {
    const out = await renderBodiesToHtml(app, { "a.md": "one", "b.md": "two" });

    expect(out).toEqual({ "a.md": "<p>one</p>", "b.md": "<p>two</p>" });
  });

  it("leaves out a note that fails to render so its day can fall back to text", async () => {
    jest.spyOn(console, "warn").mockImplementation(() => {});
    jest
      .spyOn(MarkdownRenderer, "render")
      .mockRejectedValueOnce(new Error("boom"));

    const out = await renderBodiesToHtml(app, { "a.md": "one", "b.md": "two" });

    expect(out).toEqual({ "b.md": "<p>two</p>" });
  });

  it("reuses cached HTML for an unchanged body and re-renders a changed one", async () => {
    const cache: RenderedBodyCache = new Map();

    await renderBodiesToHtml(app, { "a.md": "one" }, { cache });
    await renderBodiesToHtml(app, { "a.md": "one" }, { cache });
    expect(MarkdownRenderer.render).toHaveBeenCalledTimes(1);

    const out = await renderBodiesToHtml(app, { "a.md": "edited" }, { cache });
    expect(MarkdownRenderer.render).toHaveBeenCalledTimes(2);
    expect(out["a.md"]).toBe("<p>edited</p>");
  });

  it("stops rendering once cancelled", async () => {
    const out = await renderBodiesToHtml(
      app,
      { "a.md": "one", "b.md": "two" },
      { isCancelled: () => true },
    );

    expect(out).toEqual({});
    expect(MarkdownRenderer.render).not.toHaveBeenCalled();
  });
});
