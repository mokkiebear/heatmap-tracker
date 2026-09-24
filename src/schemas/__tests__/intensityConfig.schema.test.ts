import { makeTrackerData } from "src/test-utils";
import { validateTrackerData } from "src/schemas/validation";

describe("intensityConfig.aggregation validation (#117)", () => {
  it("accepts both values and an omitted key", () => {
    for (const aggregation of ["sum", "average", undefined] as const) {
      const data = makeTrackerData({ intensityConfig: { aggregation } });
      expect(validateTrackerData(data).intensityConfig.aggregation).toBe(
        aggregation,
      );
    }
  });

  it("reports an unsupported value instead of crashing", () => {
    const data = makeTrackerData({
      // A user typo in a codeblock: must produce a readable Notice, not a throw
      // from somewhere deep in the render.
      intensityConfig: { aggregation: "mean" as never },
    });

    expect(() => validateTrackerData(data)).toThrow(
      /intensityConfig\.aggregation/,
    );
  });
});
