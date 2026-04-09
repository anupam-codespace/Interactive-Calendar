"use client";

import { useEffect, useMemo, useState } from "react";
import styles from "./wall-calendar.module.css";

/* ─── Types ─────────────────────────────────────────── */
type SavedRangeNotes = Record<string, string>;
type CalendarDay = { date: Date; inCurrentMonth: boolean };

/* ─── Constants ─────────────────────────────────────── */
const WEEK_DAYS = ["MON", "TUE", "WED", "THU", "FRI", "SAT", "SUN"];

const ALL_IMAGES = [
  "AI%20ROBOT%20UNIVERSE.jpeg",
  "WELCOME%20TO%20FEBRUARY.jpeg",
  "Modern%203D%20Surrealism%20You%20Can%20Feel.jpeg",
  "Padel-Graphic%20Design%20Trends%20Help%20you%20Create%20Projects%20In%202025.jpeg",
  "Restful.jpeg",
  "Sleek%20%26%20Contemporary%20Layout%20Ideas%20for%20Modern%20Designs.jpeg",
  "by%20theSQUID%20%F0%9F%8D%9F.jpeg",
  "Pin%20on%20jetpacksandrollerskates.jpeg",
  "Mario%20Vaz%20-%20Art%20Direction%20%26%20Design.jpeg",
  "Mario%20Vaz%20-%20Art%20Direction%20%26%20Design%20(1).jpeg",
  "Mario%20Vaz%20-%20Art%20Direction%20%26%20Design%20(2).jpeg",
  "Deep%20Patel%20-%20Brand%20Designer%20in%20Ahmedabad%2C%20India.jpeg",
  "Instagram.jpeg",
  "Instagram%20(1).jpeg",
  "Instagram%20(2).jpeg",
  "By%20Vincent%20Chee%20_%20Award-winning%20Brand%20Strategist%20helping%20purpose-driven%20SMEs%20craft%20authentic%20identities%20_%20Based%20in%20Singapore.jpeg",
  "By%20Vincent%20Chee%20_%20Award-winning%20Brand%20Strategist%20helping%20purpose-driven%20SMEs%20craft%20authentic%20identities%20_%20Based%20in%20Singapore%20(1).jpeg",
  "_%20copy.jpeg",
  "_.jpeg",
  "_%20(1).jpeg",
  "_%20(2).jpeg",
  "_%20(3).jpeg",
  "_%20(4).jpeg",
  "_%20(5).jpeg",
  "_%20(6).jpeg",
  "_%20(7).jpeg",
  "_%20(8).jpeg",
  "_%20(9).jpeg",
  "Super%20Mario%20Profile%20Picture%20!.jpeg",
  "Tuscon%20Doe.jpeg",
  "M%C3%A1rio.jpeg",
  "Indieground's%20Weekly%20Inspiration%20Dose%20%23108.jpeg",
  "%23ayubpainthouse%20%23brolacpaints%20%23painting.jpeg",
  "download%20(1).jpeg",
];

/** Deterministically maps each (year, month) to a unique image. */
function getMonthImage(year: number, month: number): string {
  const raw = (year - 2024) * 12 + month;
  const idx = ((raw % ALL_IMAGES.length) + ALL_IMAGES.length) % ALL_IMAGES.length;
  return `/images/${ALL_IMAGES[idx]}`;
}

/**
 * Per-month theme colors — rich, saturated palettes for the dark UI.
 * Each color is used as --theme-color, driving accents, glows, and tints.
 */
const MONTH_THEMES: Record<number, string> = {
  0:  "#6c8fff", // Jan  – sapphire blue
  1:  "#a78bfa", // Feb  – soft violet
  2:  "#34d399", // Mar  – emerald
  3:  "#fbbf24", // Apr  – golden amber
  4:  "#10b981", // May  – teal green
  5:  "#f97316", // Jun  – vivid orange
  6:  "#f43f5e", // Jul  – rose red
  7:  "#d97706", // Aug  – warm amber
  8:  "#818cf8", // Sep  – indigo
  9:  "#fb7185", // Oct  – soft coral
  10: "#facc15", // Nov  – yellow gold
  11: "#22d3ee", // Dec  – cyan
};

/* ─── Date helpers ───────────────────────────────────── */
function startOfDay(date: Date): Date {
  const d = new Date(date);
  d.setHours(0, 0, 0, 0);
  return d;
}
function startOfMonth(date: Date): Date {
  return new Date(date.getFullYear(), date.getMonth(), 1);
}
function endOfMonth(date: Date): Date {
  return new Date(date.getFullYear(), date.getMonth() + 1, 0);
}
function addDays(date: Date, n: number): Date {
  const d = new Date(date);
  d.setDate(d.getDate() + n);
  return d;
}
function sameDay(a: Date | null, b: Date | null): boolean {
  if (!a || !b) return false;
  return startOfDay(a).getTime() === startOfDay(b).getTime();
}
function formatKey(date: Date): string {
  return startOfDay(date).toISOString().slice(0, 10);
}
function formatRangeKey(start: Date, end: Date): string {
  const [from, to] =
    start.getTime() <= end.getTime() ? [start, end] : [end, start];
  return `${formatKey(from)}__${formatKey(to)}`;
}
function formatMonthKey(date: Date): string {
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}`;
}

function buildCalendarDays(month: Date): CalendarDay[] {
  const first = startOfMonth(month);
  const last  = endOfMonth(month);
  // Monday-based grid
  const leadingDays = (first.getDay() + 6) % 7;
  const days: CalendarDay[] = [];
  for (let i = leadingDays; i > 0; i--)
    days.push({ date: addDays(first, -i), inCurrentMonth: false });
  for (let d = 0; d < last.getDate(); d++)
    days.push({ date: addDays(first, d), inCurrentMonth: true });
  const trailing = (7 - (days.length % 7)) % 7;
  for (let i = 1; i <= trailing; i++)
    days.push({ date: addDays(last, i), inCurrentMonth: false });
  return days;
}

/* ─── localStorage helpers ───────────────────────────── */
function getStoredMonthNote(key: string): string {
  if (typeof window === "undefined") return "";
  return window.localStorage.getItem(`calendar-month:${key}`) ?? "";
}
function getStoredRangeNotes(): SavedRangeNotes {
  if (typeof window === "undefined") return {};
  try {
    const raw = window.localStorage.getItem("calendar-all-ranges");
    return raw ? (JSON.parse(raw) as SavedRangeNotes) : {};
  } catch {
    return {};
  }
}

/* ─── Main Component ─────────────────────────────────── */
export function WallCalendar() {
  const today        = useMemo(() => startOfDay(new Date()), []);
  const initialMonth = useMemo(() => startOfMonth(today), [today]);

  const [currentMonth, setCurrentMonth] = useState(initialMonth);
  const [rangeStart,   setRangeStart]   = useState<Date | null>(null);
  const [rangeEnd,     setRangeEnd]     = useState<Date | null>(null);
  const [hoverDate,    setHoverDate]    = useState<Date | null>(null);
  const [monthlyNote,  setMonthlyNote]  = useState("");
  const [rangeNotes,   setRangeNotes]   = useState<SavedRangeNotes>({});
  const [mounted,      setMounted]      = useState(false);

  /* ── Load from localStorage on first mount ── */
  useEffect(() => {
    setMonthlyNote(getStoredMonthNote(formatMonthKey(initialMonth)));
    setRangeNotes(getStoredRangeNotes());
    setMounted(true);
  }, [initialMonth]);

  /* ── Derived values ── */
  const days       = useMemo(() => buildCalendarDays(currentMonth), [currentMonth]);
  const monthLabel = useMemo(
    () => new Intl.DateTimeFormat("en-US", { month: "long" }).format(currentMonth),
    [currentMonth]
  );
  const monthKey   = useMemo(() => formatMonthKey(currentMonth), [currentMonth]);
  const themeColor = MONTH_THEMES[currentMonth.getMonth()] || "#7c6aff";
  const imageSrc   = getMonthImage(currentMonth.getFullYear(), currentMonth.getMonth());

  const activeRangeKey: string | null =
    rangeStart && rangeEnd ? formatRangeKey(rangeStart, rangeEnd) : null;

  const activeRangeNote = activeRangeKey ? (rangeNotes[activeRangeKey] ?? "") : "";

  /* Hover preview: show projected range end while user is picking */
  const previewEnd = !rangeEnd ? hoverDate : null;

  /* ── Persist monthly note ── */
  useEffect(() => {
    if (mounted) {
      window.localStorage.setItem(`calendar-month:${monthKey}`, monthlyNote);
    }
  }, [monthKey, monthlyNote, mounted]);

  /* ── Persist all range notes ── */
  useEffect(() => {
    if (mounted) {
      window.localStorage.setItem(
        "calendar-all-ranges",
        JSON.stringify(rangeNotes)
      );
    }
  }, [rangeNotes, mounted]);

  /**
   * shiftMonth: React 18 auto-batches all setX() calls inside an event
   * handler, so currentMonth and monthlyNote update in the SAME render.
   */
  function shiftMonth(amount: number) {
    const next        = new Date(currentMonth.getFullYear(), currentMonth.getMonth() + amount, 1);
    const nextMonthKey = formatMonthKey(next);
    setCurrentMonth(next);
    setMonthlyNote(getStoredMonthNote(nextMonthKey));
    setRangeStart(null);
    setRangeEnd(null);
    setHoverDate(null);
  }

  function selectDay(date: Date) {
    const target = startOfDay(date);
    if (!rangeStart || rangeEnd) {
      setRangeStart(target);
      setRangeEnd(null);
      return;
    }
    if (target.getTime() < rangeStart.getTime()) {
      setRangeEnd(rangeStart);
      setRangeStart(target);
    } else {
      setRangeEnd(target);
    }
  }

  function updateRangeNote(value: string) {
    if (!activeRangeKey) return;
    setRangeNotes((curr) => ({ ...curr, [activeRangeKey]: value }));
  }

  const rangeLabel = useMemo(() => {
    if (!rangeStart) return null;
    const fmt = (d: Date) =>
      d.toLocaleDateString("en-US", { month: "short", day: "numeric" });
    if (!rangeEnd) return `${fmt(rangeStart)} — pick end date`;
    const [a, b] =
      rangeStart.getTime() <= rangeEnd.getTime()
        ? [rangeStart, rangeEnd]
        : [rangeEnd, rangeStart];
    return sameDay(a, b) ? fmt(a) : `${fmt(a)} – ${fmt(b)}`;
  }, [rangeStart, rangeEnd]);

  /* ─── Render ──────────────────────────────────────── */
  return (
    <main className={styles.shell}>
      <div
        className={styles.calendarPaper}
        style={{ "--theme-color": themeColor } as React.CSSProperties}
      >
        {/* ── Binding spirals ── */}
        <div className={styles.bindingBar}>
          {Array.from({ length: 22 }).map((_, i) => (
            <div
              key={i}
              className={styles.spiral}
              style={{ "--i": i } as React.CSSProperties}
            />
          ))}
        </div>

        {/* ── Main body ── */}
        <div className={styles.mainBody}>

          {/* ══ LEFT: Hero image panel ══ */}
          <div className={styles.heroPanel}>
            {/*
              key={monthKey} → forces React to unmount/remount this <img>
              every time the month changes, triggering the CSS @keyframes
              imageFadeIn animation automatically on each navigation.
            */}
            <img
              key={monthKey}
              className={styles.mediaItem}
              src={imageSrc}
              alt={`${monthLabel} ${currentMonth.getFullYear()} — monthly visual`}
            />
            <div className={styles.heroOverlay} />
            <div className={styles.themeOverlay}>
              <div className={styles.headerContent}>
                <span className={styles.yearText}>
                  {currentMonth.getFullYear()}
                </span>
                <span className={styles.monthLabel}>{monthLabel}</span>
              </div>
            </div>
          </div>

          {/* ══ RIGHT: Calendar + notes panel ══ */}
          <div className={styles.rightPanel}>

            {/* ── Calendar area ── */}
            <div className={styles.calendarArea}>

              {/* Nav controls */}
              <div className={styles.controlsRow}>
                <button
                  className={styles.navBtn}
                  onClick={() => shiftMonth(-1)}
                  aria-label="Previous month"
                >
                  ← Prev
                </button>
                <span className={styles.navMonthName}>
                  {monthLabel} {currentMonth.getFullYear()}
                </span>
                <button
                  className={styles.navBtn}
                  onClick={() => shiftMonth(1)}
                  aria-label="Next month"
                >
                  Next →
                </button>
                {(rangeStart || rangeEnd) && (
                  <button
                    className={styles.clearBtn}
                    onClick={() => {
                      setRangeStart(null);
                      setRangeEnd(null);
                      setHoverDate(null);
                    }}
                    aria-label="Clear date selection"
                  >
                    ✕ Clear
                  </button>
                )}
              </div>

              {/* Week day headers */}
              <div className={styles.weekRow}>
                {WEEK_DAYS.map((d, i) => (
                  <span
                    key={d}
                    className={`${styles.weekDay} ${i >= 5 ? styles.weekendText : ""}`}
                  >
                    {d}
                  </span>
                ))}
              </div>

              {/*
                Date grid — key={monthKey} triggers CSS fade animation
                on every month navigation.
              */}
              <div key={monthKey} className={styles.grid}>
                {days.map(({ date, inCurrentMonth }) => {
                  const isStart = sameDay(date, rangeStart);
                  const isEnd   = sameDay(date, rangeEnd);

                  const isSingle = isStart && !rangeEnd;

                  const effectiveEnd = rangeEnd ?? previewEnd;
                  const inRange =
                    rangeStart &&
                    effectiveEnd &&
                    !sameDay(rangeStart, effectiveEnd) &&
                    startOfDay(date).getTime() >
                      Math.min(rangeStart.getTime(), effectiveEnd.getTime()) &&
                    startOfDay(date).getTime() <
                      Math.max(rangeStart.getTime(), effectiveEnd.getTime());

                  const isToday    = sameDay(date, today);
                  const isWeekend  = date.getDay() === 0 || date.getDay() === 6;
                  const isSelected = (isStart || isEnd) && !!rangeEnd;

                  const classes = [
                    styles.day,
                    !inCurrentMonth                           ? styles.dayMuted   : "",
                    isWeekend && !isSelected && !isSingle     ? styles.dayWeekend : "",
                    isSingle                                  ? styles.daySingle  : "",
                    isStart && !!rangeEnd                     ? styles.dayStart   : "",
                    isEnd   && !!rangeEnd                     ? styles.dayEnd     : "",
                    inRange                                   ? styles.dayInRange : "",
                    isToday && !isSelected && !isSingle       ? styles.dayToday   : "",
                  ].filter(Boolean).join(" ");

                  return (
                    <button
                      key={formatKey(date)}
                      className={classes}
                      onClick={() => selectDay(date)}
                      onMouseEnter={() => {
                        if (rangeStart && !rangeEnd) setHoverDate(date);
                      }}
                      onMouseLeave={() => setHoverDate(null)}
                      aria-label={date.toDateString()}
                      aria-pressed={isSelected || isSingle}
                    >
                      {date.getDate()}
                    </button>
                  );
                })}
              </div>

            </div>

            {/* ── Notes area ── */}
            <div className={styles.notesArea}>

              {/* Monthly GOALS */}
              <div className={styles.monthlyNotesCol}>
                <p className={styles.sectionLabel}>
                  ✦ Goals
                  <span className={styles.monthPill}>{monthLabel}</span>
                </p>
                <textarea
                  className={styles.notesInput}
                  value={monthlyNote}
                  onChange={(e) => setMonthlyNote(e.target.value)}
                  placeholder={`Your goals for ${monthLabel}…`}
                  aria-label={`Monthly goals for ${monthLabel}`}
                />
              </div>

              {/* Range PLAN */}
              <div className={styles.rangeNotesCol}>
                {/* State A: range complete → show PLAN textarea */}
                {activeRangeKey ? (
                  <>
                    <p className={styles.sectionLabel}>
                      ◈ Plan
                      {rangeLabel && (
                        <span className={styles.rangeLabelPill}>{rangeLabel}</span>
                      )}
                    </p>
                    <textarea
                      className={styles.rangeNoteInput}
                      value={activeRangeNote}
                      onChange={(e) => updateRangeNote(e.target.value)}
                      placeholder="Describe your plan or event for this range…"
                      aria-label="Plan notes for selected date range"
                    />
                  </>
                ) : rangeStart && !rangeEnd ? (
                  /* State B: only start picked → guide user */
                  <div className={styles.rangeNotesHint}>
                    <span className={styles.hintIcon}>→</span>
                    Click a second date to complete your range
                  </div>
                ) : (
                  /* State C: nothing selected */
                  <div className={styles.rangeNotesEmpty}>
                    <span className={styles.emptyIcon}>◇</span>
                    Select a date range to add a plan
                  </div>
                )}
              </div>

            </div>
          </div>

        </div>
      </div>

      {/* ── Author credit — outside the calendar, bottom-center ── */}
      <div className={styles.authorCredit}>
        Made by{" "}
        <span
          className={styles.authorHandle}
          style={{ color: themeColor }}
        >
          @anupamsaha
        </span>
      </div>
    </main>
  );
}
