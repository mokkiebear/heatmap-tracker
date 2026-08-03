import { act, fireEvent, render, screen } from "@testing-library/react";
import { DatePicker } from "../DatePicker";

jest.mock("react-i18next", () => ({
  ...jest.requireActual("react-i18next"),
  useTranslation: jest.fn(() => ({
    t: (key: string) => key,
    i18n: { changeLanguage: jest.fn() },
  })),
}));

jest.mock("src/utils/date", () => ({
  ...jest.requireActual("src/utils/date"),
  getToday: jest.fn(),
}));

const { getToday } = jest.requireMock("src/utils/date") as { getToday: jest.Mock };

function setToday(iso: string) {
  const [year, month, day] = iso.split("-").map(Number);
  getToday.mockReturnValue(new Date(Date.UTC(year, month - 1, day)));
}

beforeEach(() => {
  setToday("2026-07-15");
});

function openPicker(container: HTMLElement) {
  const button = container.querySelector(".date-picker__calendar-btn") as HTMLElement;
  fireEvent.click(button);
}

describe("DatePicker", () => {
  it("shows the formatted value in the trigger when not focused", () => {
    render(<DatePicker value="2026-07-13" onChange={jest.fn()} weekStartDay={1} />);
    const input = screen.getByRole("textbox") as HTMLInputElement;
    expect(input.value).toBe("Jul 13, 2026");
  });

  it("opens the day grid on the value's month when the calendar button is clicked", () => {
    const { container } = render(<DatePicker value="2026-07-13" onChange={jest.fn()} weekStartDay={1} />);
    openPicker(container);

    expect(screen.queryByText("July 2026")).not.toBeNull();
    expect(container.querySelectorAll(".date-picker__day")).toHaveLength(42);
  });

  it("starts the weekday header on Monday when weekStartDay is 1", () => {
    const { container } = render(<DatePicker value="2026-07-13" onChange={jest.fn()} weekStartDay={1} />);
    openPicker(container);

    const labels = Array.from(container.querySelectorAll(".date-picker__weekdays span")).map((el) => el.textContent);
    expect(labels[0]).toBe("M");
  });

  it("starts the weekday header on Sunday when weekStartDay is 0", () => {
    const { container } = render(<DatePicker value="2026-07-13" onChange={jest.fn()} weekStartDay={0} />);
    openPicker(container);

    const labels = Array.from(container.querySelectorAll(".date-picker__weekdays span")).map((el) => el.textContent);
    expect(labels[0]).toBe("S");
  });

  it("reorders the day grid's columns to match weekStartDay, not just the header labels", () => {
    // Jul 1, 2026 is a Wednesday. With Monday-start the leading overflow is
    // Jun 29-30 (2 cells); with Sunday-start it's Jun 28-30 (3 cells) -
    // moving Jul 1 from the 3rd cell to the 4th.
    const monday = render(<DatePicker value="2026-07-13" onChange={jest.fn()} weekStartDay={1} />);
    openPicker(monday.container);
    const mondayDays = monday.container.querySelectorAll(".date-picker__day");
    expect(mondayDays[2].textContent).toBe("1");
    expect(mondayDays[2].classList.contains("is-outside")).toBe(false);

    const sunday = render(<DatePicker value="2026-07-13" onChange={jest.fn()} weekStartDay={0} />);
    openPicker(sunday.container);
    const sundayDays = sunday.container.querySelectorAll(".date-picker__day");
    expect(sundayDays[3].textContent).toBe("1");
    expect(sundayDays[3].classList.contains("is-outside")).toBe(false);
  });

  it("calls onChange and closes the panel when a day is picked", () => {
    const onChange = jest.fn();
    const { container } = render(<DatePicker value="2026-07-13" onChange={onChange} weekStartDay={1} />);
    openPicker(container);

    const day20 = Array.from(container.querySelectorAll(".date-picker__day")).find(
      (el) => el.textContent === "20" && !el.classList.contains("is-outside"),
    ) as HTMLElement;
    fireEvent.click(day20);

    expect(onChange).toHaveBeenCalledWith("2026-07-20");
    expect(container.querySelector(".date-picker__panel")).toBeNull();
  });

  it("steps to the previous/next month via the nav buttons", () => {
    const { container } = render(<DatePicker value="2026-07-13" onChange={jest.fn()} weekStartDay={1} />);
    openPicker(container);

    fireEvent.click(screen.getByLabelText("datePicker.nextMonth"));
    expect(screen.queryByText("August 2026")).not.toBeNull();

    fireEvent.click(screen.getByLabelText("datePicker.previousMonth"));
    fireEvent.click(screen.getByLabelText("datePicker.previousMonth"));
    expect(screen.queryByText("June 2026")).not.toBeNull();
  });

  it("drills up to month view then year view via the header label, and back down on selection", () => {
    const { container } = render(<DatePicker value="2026-07-13" onChange={jest.fn()} weekStartDay={1} />);
    openPicker(container);

    fireEvent.click(screen.getByText("July 2026"));
    expect(container.querySelectorAll(".date-picker__grid--months .date-picker__cell")).toHaveLength(12);

    fireEvent.click(screen.getByText("2026"));
    expect(container.querySelectorAll(".date-picker__grid--years .date-picker__cell")).toHaveLength(12);
    expect(screen.queryByText("2020–2029")).not.toBeNull();

    fireEvent.click(screen.getByText("2030"));
    expect(container.querySelectorAll(".date-picker__grid--months .date-picker__cell")).toHaveLength(12);

    fireEvent.click(screen.getByText("Mar"));
    expect(screen.queryByText("March 2030")).not.toBeNull();
  });

  it("picks the actually-correct date after switching to a distant year and month, not a stale one", () => {
    // Same journey as above, but instead of just checking the header text,
    // verify the day grid genuinely re-renders for 2030-03 and that picking
    // a day fires onChange with a date matching what was actually switched
    // to (guards against a stale year/month sneaking into the day grid).
    const onChange = jest.fn();
    const { container } = render(<DatePicker value="2026-07-13" onChange={onChange} weekStartDay={1} />);
    openPicker(container);

    fireEvent.click(screen.getByText("July 2026"));
    fireEvent.click(screen.getByText("2026"));
    fireEvent.click(screen.getByText("2030"));
    fireEvent.click(screen.getByText("Mar"));

    const day15 = Array.from(container.querySelectorAll(".date-picker__day")).find(
      (el) => el.textContent === "15" && !el.classList.contains("is-outside"),
    ) as HTMLElement;
    fireEvent.click(day15);

    expect(onChange).toHaveBeenCalledWith("2030-03-15");
  });

  it("still switches month/year when the input blurs first (real browsers fire blur before click)", () => {
    // Opening via focusing the input, then clicking a grid cell, blurs the
    // input BEFORE the cell's click event fires (standard browser event
    // order) - reproduces that exact sequence instead of only ever using
    // fireEvent.click, which never fires the preceding blur at all.
    const onChange = jest.fn();
    const { container } = render(<DatePicker value="2026-07-13" onChange={onChange} weekStartDay={1} />);
    const input = screen.getByRole("textbox");
    fireEvent.focus(input);

    const monthLabel = screen.getByText("July 2026");
    fireEvent.blur(input, { relatedTarget: monthLabel });
    fireEvent.click(monthLabel);

    expect(container.querySelectorAll(".date-picker__grid--months .date-picker__cell")).toHaveLength(12);

    const marchCell = screen.getByText("Mar");
    fireEvent.blur(input, { relatedTarget: marchCell });
    fireEvent.click(marchCell);

    expect(screen.queryByText("March 2026")).not.toBeNull();
    expect(onChange).not.toHaveBeenCalled();
  });

  it("does not reset the navigated-to month/year if the input is redundantly refocused while already open", () => {
    const onChange = jest.fn();
    render(<DatePicker value="2026-07-13" onChange={onChange} weekStartDay={1} />);
    const input = screen.getByRole("textbox");
    fireEvent.focus(input);

    fireEvent.click(screen.getByLabelText("datePicker.nextMonth"));
    expect(screen.queryByText("August 2026")).not.toBeNull();

    // Simulate the input somehow regaining focus while already navigated away.
    fireEvent.focus(input);

    expect(screen.queryByText("August 2026")).not.toBeNull();
  });

  it("steps by year at month-level and by decade at year-level", () => {
    const { container } = render(<DatePicker value="2026-07-13" onChange={jest.fn()} weekStartDay={1} />);
    openPicker(container);

    fireEvent.click(screen.getByText("July 2026")); // -> month level, year 2026
    fireEvent.click(screen.getByLabelText("datePicker.nextYear"));
    expect(screen.queryByText("2027")).not.toBeNull();

    fireEvent.click(screen.getByText("2027")); // -> year level, decade around 2027
    expect(screen.queryByText("2020–2029")).not.toBeNull();

    fireEvent.click(screen.getByLabelText("datePicker.nextDecade"));
    expect(screen.queryByText("2030–2039")).not.toBeNull();

    fireEvent.click(screen.getByLabelText("datePicker.previousDecade"));
    fireEvent.click(screen.getByLabelText("datePicker.previousDecade"));
    expect(screen.queryByText("2010–2019")).not.toBeNull();
  });

  it("rolls the year over when stepping past December/January at day-level", () => {
    const { container } = render(<DatePicker value="2026-01-13" onChange={jest.fn()} weekStartDay={1} />);
    openPicker(container);
    expect(screen.queryByText("January 2026")).not.toBeNull();

    fireEvent.click(screen.getByLabelText("datePicker.previousMonth"));
    expect(screen.queryByText("December 2025")).not.toBeNull();

    fireEvent.click(screen.getByLabelText("datePicker.nextMonth"));
    fireEvent.click(screen.getByLabelText("datePicker.nextMonth"));
    expect(screen.queryByText("February 2026")).not.toBeNull();
  });

  it("commits a typed ISO date on blur", () => {
    const onChange = jest.fn();
    render(<DatePicker value="2026-07-13" onChange={onChange} weekStartDay={1} />);
    const input = screen.getByRole("textbox");

    fireEvent.focus(input);
    fireEvent.change(input, { target: { value: "2026-08-05" } });
    fireEvent.blur(input);

    expect(onChange).toHaveBeenCalledWith("2026-08-05");
  });

  it("discards an unparseable typed value instead of calling onChange", () => {
    const onChange = jest.fn();
    render(<DatePicker value="2026-07-13" onChange={onChange} weekStartDay={1} />);
    const input = screen.getByRole("textbox") as HTMLInputElement;

    fireEvent.focus(input);
    fireEvent.change(input, { target: { value: "not a date" } });
    fireEvent.blur(input);

    expect(onChange).not.toHaveBeenCalled();
    expect(input.value).toBe("Jul 13, 2026");
  });

  it("clears the value via the Clear footer action", () => {
    const onChange = jest.fn();
    const { container } = render(<DatePicker value="2026-07-13" onChange={onChange} weekStartDay={1} />);
    openPicker(container);

    fireEvent.click(screen.getByText("datePicker.clear"));
    expect(onChange).toHaveBeenCalledWith("");
  });

  it("jumps to today's date via the Today footer action", () => {
    const onChange = jest.fn();
    const { container } = render(<DatePicker value="2026-07-13" onChange={onChange} weekStartDay={1} />);
    openPicker(container);

    fireEvent.click(screen.getByText("datePicker.today"));
    expect(onChange).toHaveBeenCalledWith("2026-07-15");
  });

  it("closes the panel on outside click without committing anything", () => {
    const onChange = jest.fn();
    const { container } = render(<DatePicker value="2026-07-13" onChange={onChange} weekStartDay={1} />);
    openPicker(container);
    expect(container.querySelector(".date-picker__panel")).not.toBeNull();

    act(() => {
      document.dispatchEvent(new MouseEvent("pointerdown", { bubbles: true }));
    });

    expect(container.querySelector(".date-picker__panel")).toBeNull();
    expect(onChange).not.toHaveBeenCalled();
  });
});
