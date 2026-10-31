import { extractMath, mathToken } from "../extractMath";

describe("extractMath", () => {
  it("swaps inline math for tokens", () => {
    const { markdown, math } = extractMath(
      "- Yuki: second-order on $c_1$ & first-order on $c_2+c_3$",
    );

    expect(markdown).toBe(
      `- Yuki: second-order on ${mathToken(0)} & first-order on ${mathToken(1)}`,
    );
    expect(math).toEqual([
      { tex: "c_1", display: false },
      { tex: "c_2+c_3", display: false },
    ]);
  });

  it("swaps display math, including across lines", () => {
    const { markdown, math } = extractMath(
      "before\n$$\n\\frac{a}{b}\n$$\nafter",
    );

    expect(markdown).toBe(`before\n${mathToken(0)}\nafter`);
    expect(math).toEqual([{ tex: "\\frac{a}{b}", display: true }]);
  });

  it("leaves code spans and fenced code alone", () => {
    const source = "`$x$` and\n```\n$y$\n```\nthen $z$";
    const { markdown, math } = extractMath(source);

    expect(markdown).toBe(
      `\`$x$\` and\n\`\`\`\n$y$\n\`\`\`\nthen ${mathToken(0)}`,
    );
    expect(math).toEqual([{ tex: "z", display: false }]);
  });

  it("treats escaped and space-padded dollars as text", () => {
    const source = "costs \\$5 and $ 6 $ or $7 ";

    expect(extractMath(source)).toEqual({ markdown: source, math: [] });
  });

  it("doesn't let inline math cross a blank line", () => {
    const source = "a $b\n\nc$ d";

    expect(extractMath(source)).toEqual({ markdown: source, math: [] });
  });
});
