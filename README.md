# 🗓️ Premium Interactive Bento Calendar

A professional, high-end "Bento Style" wall calendar built with **Next.js 15 & React 19**. This project was designed as a modern take on the classic physical wall calendar, combining artistic monthly visuals with a powerful, dashboard-like interactive planning workspace.

## ✨ Mandatory Assignment Requirements (Fulfilled)

### 1. Wall-Calendar Style UI
- **Hero Visual Section**: Each month features a unique, high-resolution media panel (supporting images and videos).
- **Classy Bento Grid**: A modular layout inspired by high-end dashboards, organizing dates, visuals, and notes into distinct, aesthetically pleasing "boxes".
- **Typographic Identity**: Unified, bold sans-serif typography for a premium, consistent look across all 12 months.

### 2. Date Range Selection
- **Interactive Highlighting**: Intelligent range selection logic that handles:
  - **Start Date**: Distinct solid black highlight.
  - **End Date**: Matching solid black highlight for the terminal date.
  - **In-Range**: Subtle soft-neutral highlight for all intermediate days.
- **Dynamic Selection**: Click a start date, then an end date, and the range automatically fills the selection.

### 3. Functional Notes Workspace
- **Month Goals**: A dedicated workspace to store overarching objectives for the current month.
- **Range Blueprint**: A context-aware note field that attaches notes specifically to the **selected date range**.
- **Persistence**: Both types of notes are saved instantly to the browser's `localStorage` and persist even after page refreshes or month swaps.

### 4. Fully Responsive (True One-Frame Design)
- **Desktop**: A sophisticated 4x2 Bento grid that fits perfectly in "one frame" (no scrolling), providing a dashboard feel.
- **Mobile**: A clean, vertically stacked flow that maintains all touch-targets and readability on small screens.
- **Classy Buttons**: Minimalist `BACK`, `NEXT`, and `CLEAR` buttons with sharp borders and instant transitions.

### 5. Tech Stack & State Management
- **Next.js 15 / React 19**: Utilizing the latest React features and App Router optimization.
- **Frontend Only**: No backend required. All logic is handled via custom React hooks and state management (`useState`, `useMemo`, `useEffect`).
- **Client-Side Storage**: Fully implemented with `localStorage` for notes and selection persistence.

## 🚀 Running Locally

1. **Install Dependencies**:
   ```bash
   npm install
   ```
2. **Launch Dev Server**:
   ```bash
   npm run dev
   ```
3. **Open Browser**:
   Visit [http://localhost:3000](http://localhost:3000).

## 📹 Suggested Demo Walkthrough

1. **Month Navigation**: Click **NEXT** to see the 12 unique monthly visuals and instant transitions.
2. **Range Selection**: Select a start and end date on the calendar grid.
3. **Goal Tracking**: Type into the "GOALS" box for a specific month, refresh the page, and see it persist.
4. **Range Blueprint**: Select a 3-day range, add a "PLAN", then select a different range to see the note field update contextually.
5. **Responsive Check**: Resize your browser to mobile width to see the clean Bento stacking.

---
*Created for the Software Development Assessment Project.*
