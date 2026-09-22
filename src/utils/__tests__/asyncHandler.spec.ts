import { asyncHandler } from "../asyncHandler";
import { notify } from "../notify";

jest.mock("../notify");

describe("asyncHandler", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    jest.spyOn(console, "error").mockImplementation(() => {});
  });

  it("returns undefined rather than the promise, so callers stay void", () => {
    const handler = asyncHandler(async () => "value");

    expect(handler()).toBeUndefined();
  });

  it("passes its arguments through", async () => {
    const spy = jest.fn().mockResolvedValue(undefined);

    asyncHandler(spy)("a", 1);
    await Promise.resolve();

    expect(spy).toHaveBeenCalledWith("a", 1);
  });

  it("notifies instead of leaving an unhandled rejection", async () => {
    const handler = asyncHandler(() => Promise.reject(new Error("boom")));

    handler();
    // Two ticks: one for the rejection, one for the `catch` callback.
    await Promise.resolve();
    await Promise.resolve();

    expect(notify).toHaveBeenCalledTimes(1);
  });
});
