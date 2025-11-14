import { Notice } from "obsidian";
import { notify } from "../notify";

jest.mock("obsidian", () => ({
  Notice: jest.fn(),
}));

const getMockedNotice = () => Notice as jest.MockedClass<typeof Notice>;

describe("notify", () => {
  beforeEach(() => {
    getMockedNotice().mockClear();
  });

  it("should create a Notice with the provided message and duration", () => {
    const mockedNotice = {} as unknown as Notice;
    getMockedNotice().mockReturnValue(mockedNotice);

    const message = "Custom message";
    const duration = 5000;
    const result = notify(message, duration);

    expect(getMockedNotice()).toHaveBeenCalledWith(message, duration);
    expect(result).toBe(mockedNotice);
  });

  it("should fall back to the default duration when not provided", () => {
    const mockedNotice = {} as unknown as Notice;
    getMockedNotice().mockReturnValue(mockedNotice);

    const message = "Default duration message";
    notify(message);

    expect(getMockedNotice()).toHaveBeenCalledWith(message, 3000);
  });
});
