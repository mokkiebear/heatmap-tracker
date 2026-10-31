import { App } from "obsidian";
import { parsePreamble, readPreambleMacros } from "../latexPreamble";

describe("parsePreamble", () => {
  it("reads \\newcommand in both name forms, with and without arguments", () => {
    expect(
      parsePreamble(
        "\\newcommand{\\R}{\\mathbb{R}}\n\\newcommand\\norm[1]{\\lVert #1 \\rVert}",
      ),
    ).toEqual({ "\\R": "\\mathbb{R}", "\\norm": "\\lVert #1 \\rVert" });
  });

  it("turns \\DeclareMathOperator into \\operatorname, keeping the star", () => {
    expect(
      parsePreamble(
        "\\DeclareMathOperator*{\\argmax}{arg\\,max}\n\\DeclareMathOperator{\\tr}{tr}",
      ),
    ).toEqual({
      "\\argmax": "\\operatorname*{arg\\,max}",
      "\\tr": "\\operatorname{tr}",
    });
  });

  it("skips comments and everything that isn't a definition", () => {
    expect(
      parsePreamble(
        "\\usepackage{amsmath}\n% \\newcommand{\\X}{no}\n\\newcommand{\\Y}{50\\%} % yes",
      ),
    ).toEqual({ "\\Y": "50\\%" });
  });
});

describe("readPreambleMacros", () => {
  const appWith = (files: Record<string, string>) =>
    Object.assign(new App(), {
      vault: {
        configDir: ".obsidian",
        adapter: {
          exists: async (p: string) => p in files,
          read: async (p: string) => files[p],
        },
      },
    }) as unknown as App;

  it("reads the vault's .obsidian/preamble.sty", async () => {
    const app = appWith({
      ".obsidian/preamble.sty": "\\newcommand{\\R}{\\mathbb{R}}",
    });

    expect(await readPreambleMacros(app)).toEqual({ "\\R": "\\mathbb{R}" });
  });

  it("returns no macros without a preamble, or when the vault can't be read", async () => {
    expect(await readPreambleMacros(appWith({}))).toEqual({});
    expect(await readPreambleMacros(new App())).toEqual({});
  });
});
