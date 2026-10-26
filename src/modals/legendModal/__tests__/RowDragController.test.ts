import { reorder } from "../RowDragController";

describe("reorder", () => {
  const [a, b, c, d] = ["a", "b", "c", "d"].map((id) => ({ id }));
  const items = [a, b, c, d];

  it.each([
    ["one item to just before the target", [d], [b], [a, d, b, c]],
    ["a block, keeping its own order", [b, d], [a], [b, d, a, c]],
    ["to the end for an empty target", [a], [], [b, c, d, a]],
    [
      "to the end for a target not in the list",
      [a],
      [{ id: "x" }],
      [b, c, d, a],
    ],
  ])("moves %s", (_, dragged, target, expected) => {
    expect(reorder(items, dragged, target)).toEqual(expected);
  });

  it.each([
    ["onto itself", [b], [b]],
    ["onto a target overlapping the block", [a, b], [b, c]],
  ])("changes nothing when dropped %s", (_, dragged, target) => {
    expect(reorder(items, dragged, target)).toBe(items);
  });
});
