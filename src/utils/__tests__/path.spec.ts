import { stripTags, trimSlashes } from "src/utils/path";

describe("trimSlashes", () => {
  it("leaves a clean path alone", () => {
    expect(trimSlashes("Reports/2024")).toBe("Reports/2024");
  });

  it("strips leading and trailing slashes but keeps inner ones", () => {
    expect(trimSlashes("/Reports/2024/")).toBe("Reports/2024");
    expect(trimSlashes("///a//b///")).toBe("a//b");
  });

  it("collapses an all-slash path to empty", () => {
    expect(trimSlashes("/")).toBe("");
    expect(trimSlashes("////")).toBe("");
    expect(trimSlashes("")).toBe("");
  });

  it("stays linear on a pathological run of slashes", () => {
    // The regex it replaced (/^\/+|\/+$/) is polynomial here: 100k slashes took
    // seconds. Anything near instant proves the linear scan.
    const start = Date.now();
    expect(trimSlashes("/".repeat(200_000))).toBe("");
    expect(Date.now() - start).toBeLessThan(1_000);
  });
});

describe("stripTags", () => {
  it("removes simple markup", () => {
    expect(stripTags("<b>Steps</b>")).toBe("Steps");
  });

  it("keeps a lone '>' — it is an ordinary character in a title", () => {
    expect(stripTags("2 > 1")).toBe("2 > 1");
  });

  it("drops everything after an unclosed '<'", () => {
    expect(stripTags("Steps <b")).toBe("Steps ");
  });

  it("cannot be tricked into reassembling a tag", () => {
    // `.replace(/<[^>]*>/g, "")` applied once turns this into "<script>";
    // counting depth removes the whole nested construct instead.
    expect(stripTags("<scr<b>ipt>alert(1)")).toBe("alert(1)");
    expect(stripTags("<<>>")).toBe("");
  });

  it("stays linear on a pathological run of '<'", () => {
    // The regex it replaced took over 4s on 100k '<'.
    const start = Date.now();
    expect(stripTags("<".repeat(200_000))).toBe("");
    expect(Date.now() - start).toBeLessThan(1_000);
  });
});
