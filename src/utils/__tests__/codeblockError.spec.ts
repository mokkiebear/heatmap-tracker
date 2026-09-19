import {
  describeCodeblockIssue,
  renderCodeblockIssue,
  renderNoMatchesHint,
} from "src/utils/codeblockError";

function container() {
  return document.createElement("div");
}

function text(el: HTMLElement, selector: string) {
  return el.querySelector(selector)?.textContent ?? "";
}

describe("codeblock messages", () => {
  it("gives every failure a title and an explanation", () => {
    const kinds = [
      { kind: "missing-property" },
      { kind: "invalid-yaml" },
      { kind: "unexpected" },
    ] as const;

    for (const issue of kinds) {
      const copy = describeCodeblockIssue(issue);

      expect(copy.title).toBeTruthy();
      expect(copy.body).toBeTruthy();
      // A missing translation makes i18next echo the key back.
      expect(copy.title).not.toContain("errors.");
      expect(copy.body).not.toContain("errors.");
    }
  });

  it("marks failures as alerts", () => {
    const el = container();

    renderCodeblockIssue(el, { kind: "missing-property" });

    expect(el.querySelector(".heatmap-tracker-message")).toHaveProperty(
      "role",
      "alert",
    );
  });

  it("shows a working codeblock when property is missing", () => {
    const el = container();

    renderCodeblockIssue(el, { kind: "missing-property" });

    expect(text(el, ".heatmap-tracker-message__snippet")).toContain(
      "property: steps",
    );
  });

  it("repeats the raw error so it can be reported", () => {
    const el = container();

    renderCodeblockIssue(el, {
      kind: "unexpected",
      detail: "dv.pages is not a function",
    });

    expect(text(el, ".heatmap-tracker-message__detail")).toBe(
      "dv.pages is not a function",
    );
  });

  it("omits the detail block when there is no detail", () => {
    const el = container();

    renderCodeblockIssue(el, { kind: "invalid-yaml" });

    expect(el.querySelector(".heatmap-tracker-message__detail")).toBeNull();
  });

  it("names the property and path in the empty-result hint", () => {
    const el = container();

    renderNoMatchesHint(el, { property: "steps", path: "daily notes" });

    const body = text(el, ".heatmap-tracker-message__text");
    expect(body).toContain("steps");
    expect(body).toContain("daily notes");
    expect(el.querySelector(".heatmap-tracker-message")).toHaveProperty(
      "role",
      "status",
    );
  });

  it("mentions inline fields only when Dataview is absent", () => {
    const withDataview = container();
    const withoutDataview = container();

    renderNoMatchesHint(withDataview, { property: "steps" });
    renderNoMatchesHint(withoutDataview, {
      property: "steps",
      dataviewAvailable: false,
    });

    expect(
      withDataview.querySelector("a.heatmap-tracker-message__action"),
    ).toBeNull();
    expect(
      withoutDataview
        .querySelector("a.heatmap-tracker-message__action")
        ?.getAttribute("href"),
    ).toBe("obsidian://show-plugin?id=dataview");
    expect(withoutDataview.textContent).toContain("steps:: 8420");
  });

  it("drops the path from the hint when the codeblock had none", () => {
    const el = container();

    renderNoMatchesHint(el, { property: "steps" });

    const body = text(el, ".heatmap-tracker-message__text");
    expect(body).toContain("steps");
    expect(body).not.toContain("undefined");
  });
});
