# UX Overhaul Design Spec

**Date:** 2026-03-27
**Status:** Approved

---

## Problem Statement

Research from PMC (2025 scoping review), NN/G, Apple HIG, and fitness app case studies identifies four high-impact UX gaps in the current app:

1. The active workout screen competes with global navigation -- a serious problem for one-handed gym use
2. The bottom nav uses abbreviated codes (TD/PL/PR...) instead of legible labels, and has 6 items crowding the touch bar
3. No PR detection or feedback exists -- a missed behavioral reinforcement loop
4. Progress charts show per-session noise instead of weekly trends; strength charts use a zero-based y-axis that makes progress invisible

**Research basis:**
- 70% fitness app abandonment within 100 days; poor UX is the #1 documented cause (PMC/JMIR 2025)
- 75% of users interact one-handed; primary actions must be in the lower third (Smashing Magazine / Steven Hoober)
- Visible bottom nav with labels achieves 1.5x engagement vs. icon-only (NN/G via Smashing)
- Apple HIG minimum touch target: 44x44pt; 56pt recommended for gym-context (MIT Touch Lab)
- Active workout screens should strip nav and reduce info density; cognitive performance measurably degrades during exercise (arXiv 2024)
- Immediate PR visual + haptic feedback is a documented behavioral reinforcement mechanism (Setgraph, Strong case study)
- Weekly volume aggregation + trend lines reveal signal that per-session bars obscure (Ben McAllister, UW News 2014)

---

## Scope

Four discrete, sequentially buildable features:

1. **Active Workout Mode** -- full-screen takeover during a live session
2. **Navigation Polish** -- labels, touch targets, Settings relocation
3. **PR Detection + Feedback** -- detection logic, visual badge, haptic
4. **Progress & Data Viz Rework** -- weekly volume, non-zero y-axis, rep encoding, trend lines

---

## Feature 1: Active Workout Mode

### Trigger
Session is live when `getActiveSession()` (from `workout-store.ts`) returns a non-null `WorkoutSession` for the current user. The `mi_active_session` key stores an `ActiveSessionsByUser` object (`Record<HouseholdUser, WorkoutSession | null>`), so checking key existence is incorrect -- always check the resolved value.

### Reactive detection
`app-shell.tsx` cannot rely on the `storage` event because that event does not fire in the same tab that wrote to localStorage. Instead:

- `workout-store.ts` dispatches a custom DOM event after each session state change:
  ```typescript
  if (typeof window !== "undefined") {
    window.dispatchEvent(new CustomEvent("workout-session-change"));
  }
  ```
  Called inside `startSession`, `completeSession`, and `clearActiveSession`.

- `app-shell.tsx` uses a `useEffect` to read initial state and subscribe:
  ```typescript
  const [hasSession, setHasSession] = useState(false);
  useEffect(() => {
    const sync = () => setHasSession(getActiveSession() !== null);
    sync(); // initial read after hydration
    window.addEventListener("workout-session-change", sync);
    return () => window.removeEventListener("workout-session-change", sync);
  }, [activeUser]); // re-sync when profile switches
  ```

### Behavior
- When a session is active: bottom nav is hidden entirely. No transition, no animation -- just gone from the DOM.
- The main content area loses the bottom nav padding offset (`padding-bottom` shrinks from `5.6rem` to `1rem`).
- A **workout status bar** renders at the bottom of the viewport (fixed position, same slot the nav occupied). Contains:
  - Session elapsed time (live, ticking)
  - Sets logged this session (e.g., "14 sets")
  - Current exercise name (truncated at ~20 chars)
  - "End Workout" button (right-aligned, danger style, requires confirm tap)
- When session ends: nav reappears, status bar disappears, padding restores.

### Touch target changes (Today screen only)
- Set entry inputs (weight, reps, RPE): minimum height 52px (up from 40--42px)
- Log-set button: minimum height 56px, width 100% of its grid cell (up from ~42px)
- Rest timer controls: minimum 48px tap targets
- Exercise queue card tap zones: minimum 56px height on action areas

### Information density
- Exercise name in queue card: font size bumped one step (0.95rem → 1.05rem)
- Scheme text (e.g., "3 x 8-12"): bumped from 0.8rem to 0.9rem
- Progress ring: stays 28px but stroke weight increases 1px for legibility
- Session stat pills in workout header: de-emphasized (reduce opacity to 0.7) during active sets -- they matter between sets, not during

### Files affected
- `web/src/lib/workout-store.ts` -- add `workout-session-change` event dispatch to `startSession`, `completeSession`, `clearActiveSession`
- `web/src/components/app-shell.tsx` -- `hasSession` state + event listener, conditional nav rendering
- `web/src/app/globals.css` -- workout-mode padding, status bar styles, touch target overrides
- `web/src/components/screens/today-screen.tsx` -- status bar component, font/size adjustments

---

## Feature 2: Navigation Polish

### Bottom nav restructure
Remove Settings from the bottom nav. Relocate the settings gear icon to the profile banner area (top-right of the banner, or alongside the profile toggle).

**Before (6 items):** Today · Planner · Progress · Volume · Templates · Settings

**After (5 items):** Today · Planner · Progress · Volume · Templates

Each tab gets more horizontal space, which improves touch accuracy.

### Labels
Replace abbreviated codes with full short words:

| Current | New |
|---------|-----|
| TD | Today |
| PL | Plan |
| PR | Progress |
| VL | Volume |
| TP | Templates |

Labels render below the icon in a second line. Font: `--font-ui`, 0.65rem, `--text-2` color. Active state: `--accent-primary` color on both icon and label.

### Touch targets
The bottom nav outer container height increases to 56px minimum (currently ~50px). Each nav item's touch area fills the full height. The visual icon+label stack is vertically centered within that space.

Desktop side rail: no changes. This is mobile-specific.

### Settings access
A `⚙` icon button appears in the profile banner -- right side, same row as the profile toggle or below it. Tapping navigates to `/settings`. On desktop, settings remains in the side rail as-is (no change needed there).

### Files affected
- `web/src/components/app-shell.tsx` -- remove Settings from nav array, add gear icon to banner
- `web/src/app/globals.css` -- nav height, label styles, touch target sizing

---

## Feature 3: PR Detection + Feedback

### Detection logic
New pure function in `web/src/lib/volume-engine.ts` (or a new `pr-engine.ts` if volume-engine is already large):

```typescript
import type { WorkoutSession } from "@/lib/workout-store";

export interface PRResult {
  isPR: boolean;
  previousBestE1RM: number | null;
  currentE1RM: number;
}

// Epley formula: weight * (1 + reps / 30)
export function estimateE1RM(weight: number, reps: number): number {
  return weight * (1 + reps / 30);
}

export function detectPR(
  exerciseName: string,
  weight: number,
  reps: number,
  sessionHistory: WorkoutSession[] // WorkoutSession from workout-store.ts; sets are LoggedSet[]
): PRResult {
  const currentE1RM = estimateE1RM(weight, reps);
  const historicalSets = sessionHistory
    .flatMap((s) => s.sets) // s.sets: LoggedSet[] -- each has .exerciseName, .weight, .reps
    .filter((s) => s.exerciseName === exerciseName && s.weight > 0 && s.reps > 0);
  const bestHistoricalE1RM = historicalSets.reduce((best, s) => {
    return Math.max(best, estimateE1RM(s.weight, s.reps));
  }, 0);
  return {
    isPR: currentE1RM > bestHistoricalE1RM,
    previousBestE1RM: bestHistoricalE1RM > 0 ? bestHistoricalE1RM : null,
    currentE1RM,
  };
}
```

This is a pure function -- no side effects, fully testable. The caller passes `getAllSessions(activeUser)` from `workout-store.ts`.

### Integration point
Called in `set-entry-row.tsx` (or `today-screen.tsx` at the point where a set is confirmed). Pass the full session history from `workout-store.ts`. If `isPR: true`:

1. Set a `prExercise` state flag on the queue card for this exercise.
2. Render the PR badge.
3. Fire the haptic.

### Visual feedback
- A small green pill badge `PR` appears next to the set's weight/reps in the set log row.
- Badge animates in with a 150ms scale-from-center transition (no jank).
- The exercise queue card gets a brief (400ms) green border pulse -- same mechanism as the existing orange flash on log-set, just different color.
- Badge persists for the rest of the session in the set log.

### Haptic feedback
```javascript
if (typeof navigator.vibrate === 'function') {
  navigator.vibrate([80, 40, 80]); // double pulse
}
```
Called at the same tick as the visual update. Silently no-ops on iOS (no Vibration API support) and in desktop browsers. No try/catch needed -- the `typeof` guard is sufficient.

### Files affected
- `web/src/lib/volume-engine.ts` (or new `web/src/lib/pr-engine.ts`) -- `estimateE1RM`, `detectPR`
- `web/src/components/set-entry-row.tsx` or `today-screen.tsx` -- integration + haptic call
- `web/src/app/globals.css` -- PR badge styles, green pulse animation

---

## Feature 4: Progress & Data Viz Rework

### Volume trend chart (`trend-chart-card.tsx`)

**Current:** Per-session volume bars, x-axis = session date.

**New:** Weekly aggregated bars. Aggregation logic:
- Group sessions by ISO year+week key using an inline helper (no new dependencies):
  ```typescript
  function isoWeekKey(ts: number): string {
    const d = new Date(ts);
    const thu = new Date(Date.UTC(d.getFullYear(), d.getMonth(), d.getDate()));
    thu.setUTCDate(thu.getUTCDate() + 4 - (thu.getUTCDay() || 7)); // nearest Thursday
    const yearStart = new Date(Date.UTC(thu.getUTCFullYear(), 0, 1));
    const week = Math.ceil(((thu.getTime() - yearStart.getTime()) / 86400000 + 1) / 7);
    return `${thu.getUTCFullYear()}-W${String(week).padStart(2, "0")}`;
  }
  ```
  Key each session by `isoWeekKey(session.startedAt)`. This lives in `progress-screen.tsx` as a local utility.
- Sum total sets per week
- X-axis labels: the `W##` portion of the key (e.g., "W12", "W13")
- Show last 8--12 weeks by default

**Trend line:** A `<polyline>` SVG element connecting the midpoint-top of each bar. Stroke: `--accent-primary` at 60% opacity, stroke-width 1.5px, no fill. Rendered on top of the bars.

The existing bar rendering logic in `trend-chart-card.tsx` gets refactored to accept pre-aggregated data -- replacing the current per-session `sessions[]` prop with `{ label: string; value: number }[]`. The aggregation happens in `progress-screen.tsx` as a derived value. All existing call sites of `TrendChartCard` are in `progress-screen.tsx`, so the prop interface change is contained to that file.

### Strength charts (squat, incline, pullup)

Three changes, applied to the existing SVG chart rendering in `progress-screen.tsx`:

**1. Non-zero y-axis:**
```
yMin = Math.min(...dataPoints) * 0.92
yMax = Math.max(...dataPoints) * 1.05
```
Y-axis labels regenerated from this range. Axis labeled with unit (lbs or kg depending on user pref).

**2. Rep encoding:**
Each data point dot gets a small label below it showing rep count (e.g., "×5"). Font: `--font-mono`, 0.6rem, `--text-2` color. Positioned 8px below the dot center. On mobile, only show rep labels for PRs to avoid overlap.

**3. Estimated 1RM trend line:**
Using the Epley formula (shared with Feature 3), compute e1RM for each data point. Plot as a secondary `<polyline>` using a dashed stroke in `--accent-primary` at 40% opacity. This smooths the visual noise from rep variation on the weight chart.

**4. 3-session moving average:**
```
movingAvg[i] = mean(data[i-1], data[i], data[i+1])
```
Plotted as a third `<polyline>` -- solid, thin (1px), `--text-2` color. Optional, behind the e1RM line.

### Files affected
- `web/src/components/trend-chart-card.tsx` -- weekly aggregation input, trend line
- `web/src/components/screens/progress-screen.tsx` -- aggregation logic, strength chart updates
- `web/src/app/globals.css` -- PR badge from Feature 3 may have shared styles; moving average line styles

---

## Execution Order

Build in this order -- each feature is independently shippable:

1. **Navigation Polish** (lowest risk, touches shell only, verifiable immediately)
2. **Active Workout Mode** (builds on stable nav, highest user impact)
3. **PR Detection + Feedback** (pure logic + UI layer, no structural dependencies)
4. **Progress & Data Viz** (most complex, isolated to progress screen)

---

## What This Does NOT Include

- No new dependencies (no chart library, no haptic library, no date utility library -- ISO week calculation is inline)
- No changes to localStorage schema or data model
- No changes to the Hers profile experience
- No changes to desktop layout (side rail untouched)
- No accessibility audit (WCAG contrast for Neon theme is a known issue but a separate task)
- No today-screen.tsx refactor/split (identified as needed but separate from this scope)

---

## Success Criteria

- Active session hides bottom nav and shows status bar on all mobile breakpoints
- Bottom nav shows 5 items with full-word labels at min 56px height
- Settings accessible via gear icon in profile banner
- Logging a set that beats historical e1RM triggers PR badge + double-pulse haptic
- Progress volume chart shows weekly bars + trend line
- Strength charts start y-axis near data minimum, show rep count labels, show e1RM trend line
- TypeScript compiles clean, no regressions on existing Vitest tests
