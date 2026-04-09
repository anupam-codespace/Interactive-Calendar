import fs from 'fs';

const tsxContent = `"use client";

import { useEffect, useMemo, useState } from "react";
import styles from "./wall-calendar.module.css";

type SavedRangeNotes = Record<string, string>;

type CalendarDay = {
  date: Date;
  inCurrentMonth: boolean;
};

const WEEK_DAYS = ["MON", "TUE", "WED", "THU", "FRI", "SAT", "SUN"];

const MONTH_FILE_MAP: Record<number, string> = {
  0: "01.png", 1: "02.png", 2: "03.png", 3: "04.png", 4: "05.png", 5: "06.png",
  6: "07.png", 7: "08.png", 8: "09.png", 9: "10.png", 10: "11.png", 11: "12.png",
};

const MONTH_THEMES: Record<number, string> = {
  0: "#1E3A8A", // Jan
  1: "#7C3AED", // Feb
  2: "#059669", // Mar
  3: "#D97706", // Apr
  4: "#047857", // May
  5: "#EA580C", // Jun
  6: "#DC2626", // Jul
  7: "#B45309", // Aug
  8: "#4338CA", // Sep
  9: "#be123c", // Oct
  10: "#A16207", // Nov
  11: "#0F766E", // Dec
};

function startOfDay(date: Date) {
  const next = new Date(date);
  next.setHours(0, 0, 0, 0);
  return next;
}

function startOfMonth(date: Date) {
  return new Date(date.getFullYear(), date.getMonth(), 1);
}

function endOfMonth(date: Date) {
  return new Date(date.getFullYear(), date.getMonth() + 1, 0);
}

function addDays(date: Date, amount: number) {
  const next = new Date(date);
  next.setDate(next.getDate() + amount);
  return next;
}

function sameDay(a: Date | null, b: Date | null) {
  if (!a || !b) return false;
  return startOfDay(a).getTime() === startOfDay(b).getTime();
}

function formatKey(date: Date) {
  return startOfDay(date).toISOString().slice(0, 10);
}

function formatRangeKey(start: Date, end: Date) {
  const [from, to] = start.getTime() <= end.getTime() ? [start, end] : [end, start];
  return \`\${formatKey(from)}__\${formatKey(to)}\`;
}

function formatMonthKey(date: Date) {
  return \`\${date.getFullYear()}-\${String(date.getMonth() + 1).padStart(2, "0")}\`;
}

function buildCalendarDays(month: Date): CalendarDay[] {
  const first = startOfMonth(month);
  const last = endOfMonth(month);
  const leadingDays = (first.getDay() + 6) % 7;
  const days: CalendarDay[] = [];
  for (let offset = leadingDays; offset > 0; offset -= 1) {
    days.push({ date: addDays(first, -offset), inCurrentMonth: false });
  }
  for (let day = 0; day < last.getDate(); day += 1) {
    days.push({ date: addDays(first, day), inCurrentMonth: true });
  }
  const trailingDays = (7 - (days.length % 7)) % 7;
  for (let offset = 1; offset <= trailingDays; offset += 1) {
    days.push({ date: addDays(last, offset), inCurrentMonth: false });
  }
  return days;
}

function getStoredMonthNote(monthKey: string) {
  if (typeof window === "undefined") return "";
  return window.localStorage.getItem(\`calendar-month:\${monthKey}\`) ?? "";
}

function getStoredRangeNotes() {
  if (typeof window === "undefined") return {};
  const storedRanges = window.localStorage.getItem(\`calendar-all-ranges\`);
  return storedRanges ? (JSON.parse(storedRanges) as SavedRangeNotes) : {};
}

function MediaItem({ monthIndex, className }: { monthIndex: number; className: string }) {
  const file = MONTH_FILE_MAP[monthIndex];
  const src = \`/images/\${file}\`;
  const isVideo = src.endsWith(".mp4");
  if (isVideo) {
    return (
      <video className={className} autoPlay muted loop playsInline>
        <source src={src} type="video/mp4" />
      </video>
    );
  }
  return <img className={className} src={src} alt="Visual" />;
}

export function WallCalendar() {
  const today = useMemo(() => startOfDay(new Date()), []);
  const initialMonth = startOfMonth(today);
  
  const [currentMonth, setCurrentMonth] = useState(initialMonth);
  const [rangeStart, setRangeStart] = useState<Date | null>(null);
  const [rangeEnd, setRangeEnd] = useState<Date | null>(null);
  const [hoverDate, setHoverDate] = useState<Date | null>(null);
  const [monthlyNote, setMonthlyNote] = useState("");
  const [rangeNotes, setRangeNotes] = useState<SavedRangeNotes>({});
  const [isFlipping, setIsFlipping] = useState(false);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMonthlyNote(getStoredMonthNote(formatMonthKey(initialMonth)));
    setRangeNotes(getStoredRangeNotes());
    setMounted(true);
  }, [initialMonth]);

  const days = useMemo(() => buildCalendarDays(currentMonth), [currentMonth]);
  const monthLabel = useMemo(() => new Intl.DateTimeFormat("en-US", { month: "long" }).format(currentMonth), [currentMonth]);
  const monthKey = useMemo(() => formatMonthKey(currentMonth), [currentMonth]);
  const resolvedRangeEnd = rangeEnd ?? hoverDate;
  const activeRangeKey = rangeStart && rangeEnd ? formatRangeKey(rangeStart, rangeEnd) : null;
  const themeColor = MONTH_THEMES[currentMonth.getMonth()] || "#007bb5";

  useEffect(() => {
    if (mounted) {
      window.localStorage.setItem(\`calendar-month:\${monthKey}\`, monthlyNote);
    }
  }, [monthKey, monthlyNote, mounted]);

  useEffect(() => {
    if (mounted) {
      window.localStorage.setItem(\`calendar-all-ranges\`, JSON.stringify(rangeNotes));
    }
  }, [rangeNotes, mounted]);

  function selectDay(date: Date) {
    const target = startOfDay(date);
    if (!rangeStart || (rangeStart && rangeEnd)) {
      setRangeStart(target);
      setRangeEnd(null);
      return;
    }
    if (target.getTime() < rangeStart.getTime()) {
      setRangeEnd(rangeStart);
      setRangeStart(target);
      return;
    }
    setRangeEnd(target);
  }

  function shiftMonth(amount: number) {
    setIsFlipping(true);
    setTimeout(() => {
      const nextMonth = new Date(currentMonth.getFullYear(), currentMonth.getMonth() + amount, 1);
      const nextMonthKey = formatMonthKey(nextMonth);
      setCurrentMonth(nextMonth);
      setMonthlyNote(getStoredMonthNote(nextMonthKey));
      setRangeStart(null);
      setRangeEnd(null);
    }, 300); // Change month halfway through the flip
  }

  function updateRangeNote(value: string) {
    if (!activeRangeKey) return;
    setRangeNotes((current) => ({ ...current, [activeRangeKey]: value }));
  }

  const activeRangeNote = activeRangeKey ? rangeNotes[activeRangeKey] ?? "" : "";

  // Need an array for spirals
  const spirals = Array.from({ length: 30 });

  return (
    <main className={styles.shell}>
      <div 
        className={\`\${styles.calendarPaper} \${isFlipping ? styles.pageTurn : ""}\`}
        style={{ "--theme-color": themeColor } as React.CSSProperties}
        onAnimationEnd={() => setIsFlipping(false)}
      >
        
        {/* Physical Hanging Elements */}
        <div className={styles.pin}></div>
        <div className={styles.hangingHole}></div>
        <div className={styles.bindingContainer}>
           {spirals.map((_, i) => (
             <div key={i} className={styles.spiral}></div>
           ))}
        </div>

        {/* TOP: Image & Month Banner */}
        <div className={styles.heroSection}>
          <MediaItem monthIndex={currentMonth.getMonth()} className={styles.mediaItem} />
          <div className={styles.themeOverlay}>
            <div className={styles.headerContent}>
              <span className={styles.yearText}>{currentMonth.getFullYear()}</span>
              <span className={styles.monthLabel}>{monthLabel}</span>
            </div>
          </div>
        </div>

        {/* BOTTOM: Notes & Grid */}
        <div className={styles.bottomSection}>
          
          <div className={styles.notesSection}>
            <div className={styles.notesHeader}>Notes</div>
            <textarea
              className={styles.notesInput}
              value={monthlyNote}
              onChange={(e) => setMonthlyNote(e.target.value)}
              placeholder="Jot down notes for this month..."
            />
          </div>

          <div className={styles.gridSection}>
            <div className={styles.controlsSection}>
              <button onClick={() => shiftMonth(-1)}>← Prev</button>
              <button onClick={() => shiftMonth(1)}>Next →</button>
              <button onClick={() => { setRangeStart(null); setRangeEnd(null); }} style={{marginLeft: 'auto'}}>Clear</button>
            </div>

            <div className={styles.weekRow}>
              {WEEK_DAYS.map((day, idx) => (
                <span key={day} className={\`\${styles.weekDay} \${idx >= 5 ? styles.weekendText : ""}\`}>
                  {day}
                </span>
              ))}
            </div>

            <div className={styles.grid}>
              {days.map(({ date, inCurrentMonth }) => {
                const start = sameDay(date, rangeStart);
                const end = sameDay(date, rangeEnd);
                const isSelected = start || end;
                const inRange = rangeStart && resolvedRangeEnd && 
                  startOfDay(date).getTime() > Math.min(rangeStart.getTime(), resolvedRangeEnd.getTime()) &&
                  startOfDay(date).getTime() < Math.max(rangeStart.getTime(), resolvedRangeEnd.getTime());
                const isToday = sameDay(date, today);
                
                // Keep weekends colored slightly differently
                const isWeekend = date.getDay() === 0 || date.getDay() === 6;

                return (
                  <button
                    key={formatKey(date)}
                    className={[
                      styles.day,
                      !inCurrentMonth ? styles.dayMuted : "",
                      isWeekend && !isSelected ? styles.dayWeekend : "",
                      start ? styles.dayStart : "",
                      end ? styles.dayEnd : "",
                      inRange ? styles.dayInRange : "",
                      isToday && !isSelected ? styles.dayToday : "",
                    ].filter(Boolean).join(" ")}
                    onClick={() => selectDay(date)}
                    onMouseEnter={() => setHoverDate(date)}
                    onMouseLeave={() => setHoverDate(null)}
                  >
                    {date.getDate()}
                  </button>
                );
              })}
            </div>

            {activeRangeKey && (
              <div className={styles.rangeNoteContainer}>
                 <div className={styles.notesHeader}>Trip / Event Notes</div>
                 <textarea
                   className={styles.notesInput}
                   style={{minHeight: "80px", backgroundImage: "none", border: "1px solid #ddd", padding: "10px", borderRadius: "8px"}}
                   value={activeRangeNote}
                   onChange={(e) => updateRangeNote(e.target.value)}
                   placeholder="Notes for selected dates..."
                 />
              </div>
            )}
          </div>
        </div>

      </div>
    </main>
  );
}
`;

const cssContent = `
/* BASE SHELL FOR THE WALL */
.shell {
  min-height: 100vh;
  width: 100vw;
  padding: 60px 20px 40px;
  background: #eaeaea; /* Light grey wall */
  display: flex;
  align-items: center;
  justify-content: center;
  font-family: 'Inter', -apple-system, sans-serif;
  overflow-x: hidden;
}

/* THE PHYSICAL CALENDAR PAPER */
.calendarPaper {
  background: #ffffff;
  width: 100%;
  max-width: 900px;
  box-shadow: 0 25px 50px -12px rgba(0, 0, 0, 0.25), 0 0 15px rgba(0,0,0,0.05); /* Strong drop shadow for hanging effect */
  border-radius: 4px; /* Slight rounding for paper */
  position: relative;
  
  /* Prep for 3D flip */
  transform-style: preserve-3d;
  perspective: 1500px;
  transform-origin: top center;
}

/* FLIPPING ANIMATION */
.pageTurn {
  animation: pageFlip 0.6s ease-in-out forwards;
}

@keyframes pageFlip {
  0% { transform: rotateX(0deg); box-shadow: 0 25px 50px -12px rgba(0, 0, 0, 0.25); }
  50% { transform: rotateX(30deg) translateY(-20px); box-shadow: 0 50px 80px -12px rgba(0, 0, 0, 0.3); opacity: 0.8; }
  100% { transform: rotateX(0deg); box-shadow: 0 25px 50px -12px rgba(0, 0, 0, 0.25); }
}

/* HANGING HARDWARE */
.bindingContainer {
  position: absolute;
  top: -12px;
  left: 0;
  width: 100%;
  display: flex;
  justify-content: space-between;
  padding: 0 3%; /* 3% gap on edges */
  z-index: 10;
}

.spiral {
  width: 6px;
  height: 24px;
  background: linear-gradient(90deg, #999, #eee 40%, #fff 60%, #888);
  border-radius: 4px;
  box-shadow: 1px 2px 2px rgba(0,0,0,0.3);
}

.pin {
  position: absolute;
  top: -45px;
  left: 50%;
  transform: translateX(-50%);
  width: 8px;
  height: 20px;
  background: #333;
  border-radius: 4px;
  box-shadow: 2px 4px 5px rgba(0,0,0,0.3);
  z-index: 12;
}

/* Make it look like a string hanging from the pin */
.pin::after {
  content: '';
  position: absolute;
  top: 10px;
  left: 4px;
  width: 150px;
  height: 40px;
  border-top: 2px solid #555;
  border-right: 2px solid #555;
  border-radius: 0 20px 0 0;
  transform: rotate(15deg);
  transform-origin: left top;
  z-index: -1;
}

.pin::before {
  content: '';
  position: absolute;
  top: 10px;
  right: 4px;
  width: 150px;
  height: 40px;
  border-top: 2px solid #555;
  border-left: 2px solid #555;
  border-radius: 20px 0 0 0;
  transform: rotate(-15deg);
  transform-origin: right top;
  z-index: -1;
}


.hangingHole {
  position: absolute;
  top: 8px;
  left: 50%;
  transform: translateX(-50%);
  width: 14px;
  height: 14px;
  background: #eaeaea; /* matches wall */
  border-radius: 50%;
  box-shadow: inset 0 2px 4px rgba(0,0,0,0.3);
  z-index: 11;
}

/* TOP CALENDAR HALF: Hero Image */
.heroSection {
  position: relative;
  height: 420px;
  width: 100%;
  border-radius: 4px 4px 0 0;
  overflow: hidden;
  background: #fff;
}

.mediaItem {
  width: 100%;
  height: 100%;
  object-fit: cover;
  transition: opacity 0.3s;
}

/* The angular blue theme banner matching the reference */
.themeOverlay {
  position: absolute;
  bottom: 0px;
  left: 0;
  width: 100%;
  height: 140px;
  background: var(--theme-color);
  /* Slice from left to right, going up */
  clip-path: polygon(0 60%, 50% 0, 100% 40%, 100% 100%, 0 100%);
  display: flex;
  align-items: flex-end;
  justify-content: flex-end;
  padding: 25px 40px;
}

.headerContent {
  text-align: right;
  color: #fff;
  z-index: 3;
}

.yearText {
  display: block;
  font-size: 1.4rem;
  font-weight: 500;
  letter-spacing: 0.1em;
  opacity: 0.9;
  margin-bottom: -5px;
}

.monthLabel {
  font-size: 3.5rem;
  font-weight: 900;
  text-transform: uppercase;
  letter-spacing: 0.05em;
  line-height: 1;
}

/* BOTTOM SECTION: Split Layout */
.bottomSection {
  display: flex;
  padding: 40px;
  gap: 50px;
}

/* Notes side */
.notesSection {
  flex: 0 0 220px;
  display: flex;
  flex-direction: column;
}

.notesHeader {
  font-size: 0.85rem;
  font-weight: 800;
  color: #333;
  text-transform: uppercase;
  letter-spacing: 0.1em;
  margin-bottom: 15px;
  border-bottom: 2px solid var(--theme-color);
  padding-bottom: 5px;
  display: inline-block;
  align-self: flex-start;
}

.notesInput {
  width: 100%;
  flex: 1;
  border: none;
  background: transparent;
  resize: none;
  font-family: inherit;
  font-size: 0.95rem;
  line-height: 2; /* Important for the lined paper effect */
  outline: none;
  color: #444;
  /* Lined paper effect */
  background-image: repeating-linear-gradient(transparent, transparent 31px, #e0e0e0 31px, #e0e0e0 32px);
  background-attachment: local;
}

/* Calendar Grid Side */
.gridSection {
  flex: 1;
  display: flex;
  flex-direction: column;
}

.controlsSection {
  display: flex;
  gap: 10px;
  margin-bottom: 25px;
}

.controlsSection button {
  padding: 8px 16px;
  font-size: 0.8rem;
  font-weight: 700;
  text-transform: uppercase;
  letter-spacing: 0.05em;
  border: 1px solid #e0e0e0;
  background: #fff;
  border-radius: 6px;
  cursor: pointer;
  color: #555;
  transition: all 0.2s;
}

.controlsSection button:hover {
  background: var(--theme-color);
  color: #fff;
  border-color: var(--theme-color);
}

.weekRow {
  display: grid;
  grid-template-columns: repeat(7, 1fr);
  margin-bottom: 15px;
}

.weekDay {
  text-align: center;
  font-size: 0.75rem;
  font-weight: 800;
  color: #333;
  text-transform: uppercase;
  letter-spacing: 0.05em;
}

.weekendText {
  color: var(--theme-color);
}

.grid {
  display: grid;
  grid-template-columns: repeat(7, 1fr);
  row-gap: 15px;
  column-gap: 5px;
}

.day {
  aspect-ratio: 1;
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  font-size: 1.1rem;
  font-weight: 700;
  color: #333;
  background: transparent;
  border: 2px solid transparent; /* reserved for Today */
  border-radius: 50%; /* Make them perfectly round */
  transition: all 0.15s;
  margin: 0 auto;
  width: 100%;
  max-width: 45px;
}

.dayWeekend {
  color: var(--theme-color);
}

.dayMuted {
  opacity: 0.2;
}

.day:hover:not(.dayMuted):not(.dayStart):not(.dayEnd) {
  background: #f0f0f0;
  transform: scale(1.05);
}

.dayToday {
  border-color: var(--theme-color);
  color: var(--theme-color);
}

/* Range Selected Styling */
.dayStart {
  background: var(--theme-color) !important;
  color: #fff !important;
  border-radius: 50% 0 0 50% !important; /* Flat on right */
  max-width: 100%;
}
.dayEnd {
  background: var(--theme-color) !important;
  color: #fff !important;
  border-radius: 0 50% 50% 0 !important; /* Flat on left */
  max-width: 100%;
}
.dayInRange {
  background: var(--theme-color); /* Light opacity applied via color override if we want, or just a muted background */
  opacity: 0.15;
  border-radius: 0 !important;
  max-width: 100%;
  color: transparent; /* A trick or we can just make background semi-transparent */
}

/* We need a specific class for the range highlight to not hide text. Let's fix that */
.dayInRange {
  background: var(--theme-color) !important;
  color: #fff !important;
  opacity: 0.4 !important; /* Semi-transparent blue */
  border-radius: 0 !important;
  max-width: 100%;
}

.rangeNoteContainer {
  margin-top: 30px;
  animation: fadeIn 0.3s ease;
}

@keyframes fadeIn {
  from { opacity: 0; transform: translateY(10px); }
  to { opacity: 1; transform: translateY(0); }
}

/* ================== RESPONSIVE ================== */
@media (max-width: 768px) {
  .shell { padding: 40px 15px 20px; }
  .bottomSection {
    flex-direction: column;
    padding: 25px;
    gap: 30px;
  }
  .notesSection {
    flex: none;
    height: 200px;
    order: 2; /* Notes below calendar on mobile */
  }
  .gridSection {
    order: 1; /* Calendar above notes */
  }
  .heroSection {
    height: 280px;
  }
  
  .bindingContainer {
    padding: 0 5%;
  }

  .monthLabel {
    font-size: 2.5rem;
  }
  .yearText {
    font-size: 1.2rem;
  }

  /* Make the clip path less dramatic on small screens */
  .themeOverlay {
    height: 100px;
    clip-path: polygon(0 40%, 50% 0, 100% 20%, 100% 100%, 0 100%);
    padding: 15px 20px;
  }
}
`

fs.writeFileSync('src/components/wall-calendar.tsx', tsxContent);
fs.writeFileSync('src/components/wall-calendar.module.css', cssContent);

