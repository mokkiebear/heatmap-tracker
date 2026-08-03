import { useLayoutEffect, useRef, useState } from "react";
import { useTranslation } from "react-i18next";
import { getShiftedWeekdays } from "src/utils/date";
import { CalendarIcon } from "src/components/icons/CalendarIcon";
import { ChevronLeftIcon } from "src/components/icons/ChevronLeftIcon";
import { ChevronRightIcon } from "src/components/icons/ChevronRightIcon";
import { buildDayGrid, parseISO, parseTypedISO, todayParts, toISO } from "src/components/DatePicker/dateGrid";

const WEEKDAY_LETTERS = ["S", "M", "T", "W", "T", "F", "S"];
const MONTH_SHORT_LABELS = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
// How many years the year-grid pages by per prev/next click — a full page of
// the 12 shown, minus the one-year overlap at each edge (see the year-level
// render below), matching how the day-grid also always advances by exactly
// one full month regardless of how many overflow days it shows.
const YEAR_PAGE_STEP = 10;

const MONTH_FORMATTER = new Intl.DateTimeFormat(undefined, { month: "long", year: "numeric", timeZone: "UTC" });
const TRIGGER_FORMATTER = new Intl.DateTimeFormat(undefined, {
  month: "short",
  day: "numeric",
  year: "numeric",
  timeZone: "UTC",
});

type Level = "day" | "month" | "year";

interface ViewState {
  year: number;
  /** 0-indexed. */
  month: number;
  level: Level;
}

export interface DatePickerProps {
  /** ISO `yyyy-mm-dd`, or `""` for unset. */
  value: string;
  onChange: (value: string) => void;
  /** 0 (Sunday) – 6 (Saturday); the day-grid's leftmost column and week-row layout follow this. */
  weekStartDay: number;
  ariaLabel?: string;
}

function classNames(...parts: Array<string | false | undefined>): string {
  return parts.filter(Boolean).join(" ");
}

function initialView(value: string): ViewState {
  const parsed = parseISO(value) ?? todayParts();
  return { year: parsed.year, month: parsed.month, level: "day" };
}

/**
 * A styled stand-in for `<input type="date">`, matching the plugin's own
 * theme (the native picker can't be restyled at all — not even accent
 * color). Clicking the header label drills up a level: the day view's label
 * opens a 12-month grid for the year, whose own label opens a 12-year grid
 * for jumping across decades — rather than only ever stepping one month at a
 * time. The trigger is a real text input, so a known date (`yyyy-mm-dd`) can
 * be typed directly instead of always navigating the grid to it.
 */
export function DatePicker({ value, onChange, weekStartDay, ariaLabel }: DatePickerProps) {
  const { t } = useTranslation();
  const wrapRef = useRef<HTMLDivElement>(null);
  const panelRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  const [isOpen, setIsOpen] = useState(false);
  const [isFlipped, setIsFlipped] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [editText, setEditText] = useState("");
  const [view, setView] = useState<ViewState>(() => initialView(value));

  const shiftedWeekdayLabels = getShiftedWeekdays(WEEKDAY_LETTERS, weekStartDay);
  const selected = parseISO(value);
  const today = todayParts();

  useLayoutEffect(() => {
    if (!isOpen) return;

    function handlePointerDown(e: PointerEvent) {
      if (wrapRef.current && !wrapRef.current.contains(e.target as Node)) {
        setIsOpen(false);
      }
    }
    document.addEventListener("pointerdown", handlePointerDown);
    return () => document.removeEventListener("pointerdown", handlePointerDown);
  }, [isOpen]);

  useLayoutEffect(() => {
    if (!isOpen || !panelRef.current) return;
    // Right-anchored triggers (e.g. the "to" side of a date range) have less
    // room to their right on narrow viewports — flip the panel to hang off
    // the trigger's right edge instead of its left if it would otherwise
    // spill past the viewport.
    setIsFlipped(false);
    const rect = panelRef.current.getBoundingClientRect();
    if (rect.right > window.innerWidth) {
      setIsFlipped(true);
    }
  }, [isOpen, view.level]);

  function openPanel() {
    // Only (re-)sync the displayed month/year to the committed value when
    // actually opening from closed — if this fires again while already open
    // (e.g. a redundant focus event during in-panel navigation), it must not
    // clobber whatever month/year the user is mid-navigation to.
    if (!isOpen) {
      setView(initialView(value));
    }
    setIsOpen(true);
  }

  function commit(iso: string) {
    onChange(iso);
    setIsOpen(false);
    setIsEditing(false);
  }

  function handleCalendarButtonClick() {
    if (isOpen) setIsOpen(false);
    else openPanel();
  }

  function handleFocus() {
    setEditText(value);
    setIsEditing(true);
    openPanel();
  }

  function commitTypedValue() {
    const trimmed = editText.trim();
    if (trimmed === "") {
      onChange("");
    } else {
      const parsed = parseTypedISO(trimmed);
      if (parsed) onChange(parsed);
      // Unparseable: discard it, the trigger label re-renders from `value`.
    }
    setIsEditing(false);
  }

  function handleInputBlur(e: React.FocusEvent<HTMLInputElement>) {
    // Blur fires before click when focus moves from the input to a nav
    // button/day/month/year cell within this same panel - if that's where
    // focus is headed, this isn't the user leaving the widget, just
    // navigating it. Committing here would call onChange (even with an
    // unchanged value) and force a parent re-render in the middle of that
    // click, which can suppress the click having any visible effect.
    const nextFocused = e.relatedTarget as Node | null;
    if (nextFocused && wrapRef.current?.contains(nextFocused)) return;
    commitTypedValue();
  }

  function handleKeyDown(e: React.KeyboardEvent<HTMLInputElement>) {
    if (e.key === "Escape") {
      setIsEditing(false);
      setIsOpen(false);
      inputRef.current?.blur();
    } else if (e.key === "Enter") {
      e.preventDefault();
      commitTypedValue();
      setIsOpen(false);
      inputRef.current?.blur();
    }
  }

  function step(dir: number) {
    setView((prev) => {
      if (prev.level === "day") {
        let { year, month } = prev;
        month += dir;
        if (month < 0) {
          month = 11;
          year -= 1;
        } else if (month > 11) {
          month = 0;
          year += 1;
        }
        return { ...prev, year, month };
      }
      if (prev.level === "month") {
        return { ...prev, year: prev.year + dir };
      }
      return { ...prev, year: prev.year + dir * YEAR_PAGE_STEP };
    });
  }

  function drillUp() {
    setView((prev) => ({ ...prev, level: prev.level === "month" ? "year" : "month" }));
  }

  const displayValue = isEditing
    ? editText
    : value && selected
      ? TRIGGER_FORMATTER.format(new Date(Date.UTC(selected.year, selected.month, selected.day)))
      : "";

  const navLabels: Record<Level, [string, string]> = {
    day: [t("datePicker.previousMonth"), t("datePicker.nextMonth")],
    month: [t("datePicker.previousYear"), t("datePicker.nextYear")],
    year: [t("datePicker.previousDecade"), t("datePicker.nextDecade")],
  };
  const [prevLabel, nextLabel] = navLabels[view.level];

  const decadeStart = Math.floor(view.year / 10) * 10;

  return (
    <div className={classNames("date-picker", isOpen && "is-open")} ref={wrapRef}>
      <div className="date-picker__trigger">
        <input
          ref={inputRef}
          type="text"
          className="date-picker__input"
          aria-label={ariaLabel}
          autoComplete="off"
          placeholder="yyyy-mm-dd"
          value={displayValue}
          onFocus={handleFocus}
          onBlur={handleInputBlur}
          onChange={(e) => setEditText(e.target.value)}
          onKeyDown={handleKeyDown}
        />
        <button
          type="button"
          className="date-picker__calendar-btn"
          tabIndex={-1}
          aria-haspopup="dialog"
          aria-expanded={isOpen}
          aria-label={ariaLabel ? `${t("datePicker.openCalendar")}: ${ariaLabel}` : t("datePicker.openCalendar")}
          onClick={handleCalendarButtonClick}
        >
          <CalendarIcon />
        </button>
      </div>

      {isOpen && (
        <div className={classNames("date-picker__panel", isFlipped && "is-flipped")} ref={panelRef}>
          <div className="date-picker__header">
            <button type="button" className="date-picker__nav-btn" aria-label={prevLabel} onClick={() => step(-1)}>
              <ChevronLeftIcon />
            </button>
            <button
              type="button"
              className={classNames("date-picker__label-btn", view.level === "year" && "is-static")}
              disabled={view.level === "year"}
              onClick={drillUp}
            >
              {view.level === "day" && MONTH_FORMATTER.format(new Date(Date.UTC(view.year, view.month, 1)))}
              {view.level === "month" && view.year}
              {view.level === "year" && `${decadeStart}–${decadeStart + 9}`}
            </button>
            <button type="button" className="date-picker__nav-btn" aria-label={nextLabel} onClick={() => step(1)}>
              <ChevronRightIcon />
            </button>
          </div>

          {view.level === "day" && (
            <>
              <div className="date-picker__weekdays">
                {shiftedWeekdayLabels.map((label, i) => (
                  <span key={i}>{label}</span>
                ))}
              </div>
              <div className="date-picker__grid date-picker__grid--days">
                {buildDayGrid(view.year, view.month, weekStartDay).map((cell) => (
                  <button
                    key={cell.iso}
                    type="button"
                    className={classNames(
                      "date-picker__day",
                      !cell.inMonth && "is-outside",
                      cell.iso === toISO(today.year, today.month, today.day) && "is-today",
                      cell.iso === value && "is-selected",
                    )}
                    onClick={() => commit(cell.iso)}
                  >
                    {cell.day}
                  </button>
                ))}
              </div>
            </>
          )}

          {view.level === "month" && (
            <div className="date-picker__grid date-picker__grid--months">
              {MONTH_SHORT_LABELS.map((label, m) => (
                <button
                  key={m}
                  type="button"
                  className={classNames(
                    "date-picker__cell",
                    view.year === today.year && m === today.month && "is-current",
                    selected?.year === view.year && selected.month === m && "is-selected",
                  )}
                  onClick={() => setView({ year: view.year, month: m, level: "day" })}
                >
                  {label}
                </button>
              ))}
            </div>
          )}

          {view.level === "year" && (
            <div className="date-picker__grid date-picker__grid--years">
              {Array.from({ length: 12 }, (_, i) => decadeStart - 1 + i).map((y) => (
                <button
                  key={y}
                  type="button"
                  className={classNames(
                    "date-picker__cell",
                    (y < decadeStart || y > decadeStart + 9) && "is-outside",
                    y === today.year && "is-current",
                    selected?.year === y && "is-selected",
                  )}
                  onClick={() => setView({ year: y, month: view.month, level: "month" })}
                >
                  {y}
                </button>
              ))}
            </div>
          )}

          <div className="date-picker__footer">
            <button type="button" className="date-picker__action" onClick={() => commit("")}>
              {t("datePicker.clear")}
            </button>
            <button
              type="button"
              className="date-picker__action"
              onClick={() => commit(toISO(today.year, today.month, today.day))}
            >
              {t("datePicker.today")}
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
