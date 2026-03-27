# UX Overhaul Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Implement 4 UX improvements -- nav polish, active workout mode, PR detection, and progress chart rework -- in order from lowest to highest risk.

**Architecture:** Nav polish and active workout mode both touch `app-shell.tsx` and `globals.css`, so they share a commit boundary. PR detection is a pure lib function + UI wiring, fully isolated. Progress chart rework replaces the volume trend chart and adds SVG strength charts, contained entirely to `progress-screen.tsx` and `trend-chart-card.tsx`.

**Tech Stack:** Next.js 16 + React 19 + TypeScript 5, Vitest for unit tests, no new dependencies. All state in localStorage. Custom DOM events for cross-component session state sync.

---

## File Map

| File | Change | Task |
|------|--------|------|
| `web/src/components/app-shell.tsx` | Remove Settings nav item, add gear icon, add `hasSession` state + event listener | T1, T2 |
| `web/src/app/globals.css` | Nav height 56px, label styles, status bar, touch targets, PR badge, pulse animation | T1, T2, T3 |
| `web/src/lib/workout-store.ts` | Dispatch `workout-session-change` event in `startSession`, `completeSession`, `clearActiveSession` | T2 |
| `web/src/components/screens/today-screen.tsx` | Workout status bar component, PR detection wiring in `handleSaveSet` | T2, T3 |
| `web/src/lib/pr-engine.ts` | **NEW** -- `estimateE1RM`, `detectPR` pure functions | T3 |
| `web/src/lib/__tests__/pr-engine.test.ts` | **NEW** -- Vitest unit tests for PR detection | T3 |
| `web/src/components/trend-chart-card.tsx` | Accept `{ label: string; value: number }[]`, add SVG trend line | T4 |
| `web/src/components/strength-chart-card.tsx` | **NEW** -- SVG chart: non-zero y-axis, rep labels, e1RM trend line, moving average | T4 |
| `web/src/components/screens/progress-screen.tsx` | ISO week aggregation, replace TrendChartCards with StrengthChartCard for strength | T4 |

---

## Task 1: Navigation Polish

**Files:**
- Modify: `web/src/components/app-shell.tsx`
- Modify: `web/src/app/globals.css`

Context:
- `navItems` array in `app-shell.tsx` currently has 6 items; Settings is last
- `.mobile-nav` in CSS already has `grid-template-columns: repeat(5, minmax(0, 1fr))` but 6 items are rendered -- removing Settings fixes the mismatch
- `.mobile-link-label` class already exists but is styled at `0.62rem` -- needs color update for active state
- `.app-shell` has `padding: 1rem 1rem 5.6rem` -- bottom padding accounts for nav height; increasing nav to 56px means increasing bottom padding slightly
- Desktop side rail is untouched

- [ ] **Step 1: Remove Settings from navItems, add gear icon to profile banner**

  In `web/src/components/app-shell.tsx`:

  ```diff
  - const navItems = [
  -   { href: "/", label: "Today", short: "TD" },
  -   { href: "/planner", label: "Planner", short: "PL" },
  -   { href: "/progress", label: "Progress", short: "PR" },
  -   { href: "/volume", label: "Volume", short: "VL" },
  -   { href: "/templates", label: "Templates", short: "TP" },
  -   { href: "/settings", label: "Settings", short: "ST" },
  - ];
  + const navItems = [
  +   { href: "/", label: "Today", short: "TD" },
  +   { href: "/planner", label: "Planner", short: "PL" },
  +   { href: "/progress", label: "Progress", short: "PR" },
  +   { href: "/volume", label: "Volume", short: "VL" },
  +   { href: "/templates", label: "Templates", short: "TP" },
  + ];
  ```

  In the profile banner section (the `<section className="profile-banner card panel reveal">` block), add a settings link to the right of the `ProfileToggle`:

  ```tsx
  <section className="profile-banner card panel reveal">
    <div style={{ flex: 1 }}>
      <p className="subtle-label" style={{ margin: 0 }}>
        Active Profile
      </p>
      <p className="page-note" style={{ marginTop: "0.2rem" }}>
        Switch workouts, templates, and progress with one toggle.
      </p>
      <div style={{ marginTop: "0.5rem" }}>
        <ProgramSelector activeUser={activeUser} />
      </div>
    </div>
    <div style={{ display: "flex", flexDirection: "column", alignItems: "flex-end", gap: "0.5rem" }}>
      <Link href="/settings" className="settings-gear-btn" aria-label="Settings">
        ⚙
      </Link>
      <ProfileToggle activeUser={activeUser} onChange={setActiveUser} />
    </div>
  </section>
  ```

- [ ] **Step 2: Update mobile nav CSS**

  In `web/src/app/globals.css`, find the `.mobile-nav` block (around line 1151) and update the height. Also update `.mobile-link` touch area and the active label color.

  Changes:

  ```css
  /* Increase minimum height to 56px */
  .mobile-nav {
    /* existing properties stay -- only add min-height */
    min-height: 56px;
  }

  /* Update mobile-link to fill height and increase touch area */
  .mobile-link {
    /* existing -- only change min-height */
    min-height: 56px;
  }

  /* Active label should use accent color, not just text-0 */
  .mobile-link.active .mobile-link-icon,
  .mobile-link.active .mobile-link-label {
    color: var(--accent-primary);
  }

  /* Override the generic .mobile-link.active color */
  .mobile-link.active {
    color: var(--text-0); /* keep this for non-icon/label children */
  }
  ```

  Also add the gear button style (search for `.profile-banner` area to place it nearby):

  ```css
  .settings-gear-btn {
    display: flex;
    align-items: center;
    justify-content: center;
    width: 36px;
    height: 36px;
    border-radius: var(--radius-sm);
    border: var(--border-width) solid var(--border);
    background: var(--bg-2);
    color: var(--text-1);
    font-size: 1.1rem;
    transition: color 220ms var(--ease-standard), border-color 220ms var(--ease-standard);
  }

  .settings-gear-btn:hover {
    color: var(--text-0);
    border-color: var(--accent-primary);
  }
  ```

  Also update `.app-shell` bottom padding to account for 56px nav (was 5.6rem ≈ 89.6px, new nav is ~70px with margin):

  ```css
  /* Keep at 5.6rem -- the nav floats with 0.74rem margin so total clearance is fine */
  /* No change needed here unless visual testing shows overlap */
  ```

  > Note: After implementing, do a visual check on mobile viewport. If content is clipped behind the nav, increase `.app-shell` bottom padding. The current 5.6rem should still provide enough clearance.

- [ ] **Step 3: Type check**

  ```bash
  cd web && npx tsc --noEmit
  ```

  Expected: 0 errors.

- [ ] **Step 4: Visual verify**

  Run dev server (`npm run dev` in `web/`) and open in browser at mobile viewport (≤1023px). Confirm:
  - Bottom nav shows 5 items: Today · Planner · Progress · Volume · Templates
  - Each item has icon + label stacked
  - Active item: both icon and label are `--accent-primary` colored
  - Settings gear icon visible in profile banner
  - Tapping gear icon navigates to `/settings`

- [ ] **Step 5: Commit**

  ```bash
  cd web && git add src/components/app-shell.tsx src/app/globals.css
  git commit -m "feat: nav polish -- 5-item mobile nav, labels, settings gear in banner"
  ```

---

## Task 2: Active Workout Mode

**Files:**
- Modify: `web/src/lib/workout-store.ts`
- Modify: `web/src/components/app-shell.tsx`
- Modify: `web/src/app/globals.css`
- Modify: `web/src/components/screens/today-screen.tsx`

Context:
- `startSession` is at line 259, `completeSession` at line 301, `clearActiveSession` at line 319 in `workout-store.ts`
- `app-shell.tsx` is a client component -- can use `useEffect` and `useState`
- `getActiveSession` is already exported from `workout-store.ts`
- The workout status bar displays: elapsed time (live), sets logged, current exercise name, "End Workout" button
- `today-screen.tsx` already has `matchingActiveSession` state and `workoutElapsedSeconds` computed value (line 383) -- the status bar can read these from the same source

> **Important constraint:** The status bar must live inside `today-screen.tsx` and be conditionally portaled or positioned, because only `today-screen.tsx` has access to `workoutElapsedSeconds` and the active exercise name. The status bar **is not** rendered by `app-shell.tsx`. `app-shell.tsx` only hides/shows the nav.

### 2a: Dispatch custom event from workout-store.ts

- [ ] **Step 1: Add event dispatch to workout-store.ts**

  After each state-changing write in `startSession`, `completeSession`, and `clearActiveSession`, dispatch the custom event. Add this helper at the top of the file, after the `KEYS` constant:

  ```typescript
  function dispatchSessionChange(): void {
    if (typeof window !== "undefined") {
      window.dispatchEvent(new CustomEvent("workout-session-change"));
    }
  }
  ```

  Then call it at the end of each function:

  In `startSession` (line 259), add before `return session;`:
  ```typescript
  dispatchSessionChange();
  ```

  In `completeSession` (line 301), add before `return session;`:
  ```typescript
  dispatchSessionChange();
  ```

  In `clearActiveSession` (line 319), add at the end of both branches (before each `return`):
  ```typescript
  dispatchSessionChange();
  ```

- [ ] **Step 2: Type check**

  ```bash
  cd web && npx tsc --noEmit
  ```

  Expected: 0 errors.

### 2b: Add hasSession state to app-shell.tsx

- [ ] **Step 3: Add hasSession state + event listener**

  In `web/src/components/app-shell.tsx`, add `getActiveSession` to the import from `workout-store`:

  ```typescript
  import { getActiveSession, getPrefs, savePrefs } from "@/lib/workout-store";
  ```

  Then inside the `AppShell` component, after the existing `useState` calls:

  ```typescript
  const [hasSession, setHasSession] = useState(false);

  useEffect(() => {
    const sync = () => setHasSession(getActiveSession() !== null);
    sync(); // initial read after hydration
    window.addEventListener("workout-session-change", sync);
    return () => window.removeEventListener("workout-session-change", sync);
  }, [activeUser]); // re-sync on profile switch
  ```

- [ ] **Step 4: Conditionally hide mobile nav**

  In the JSX, wrap the `<nav className="mobile-nav">` with a conditional:

  ```tsx
  {!hasSession && (
    <nav className="mobile-nav" aria-label="Bottom navigation">
      {navItems.map((item) => { /* existing code */ })}
    </nav>
  )}
  ```

  Also add a CSS class to `.app-shell` when session is active to remove the bottom padding offset:

  ```tsx
  <div className={`app-shell${hasSession ? " workout-active" : ""}`}>
  ```

- [ ] **Step 5: Add workout-active CSS**

  In `globals.css`, after the `.app-shell` block:

  ```css
  .app-shell.workout-active {
    padding-bottom: 1rem;
  }
  ```

### 2c: Workout status bar in today-screen.tsx

- [ ] **Step 6: Add WorkoutStatusBar component inside today-screen.tsx**

  The status bar needs: elapsed time, sets logged count, current exercise name, "End Workout" button. All of this is already available in `today-screen.tsx` state: `workoutElapsedSeconds`, `matchingActiveSession.sets.length`, `activeExercise?.name`, and `handleFinishWorkout`.

  Create an inline helper component at the top of the file (before the `TodayScreen` component function):

  ```typescript
  function formatElapsed(seconds: number): string {
    const m = Math.floor(seconds / 60);
    const s = seconds % 60;
    return `${m}:${String(s).padStart(2, "0")}`;
  }
  ```

  Then in the JSX of `TodayScreen`, after the closing `</section>` of the main screen content (but still inside the outer `return`), add the status bar. It should only render when `matchingActiveSession` is non-null:

  ```tsx
  {matchingActiveSession ? (
    <div className="workout-status-bar">
      <span className="workout-status-time">{formatElapsed(workoutElapsedSeconds)}</span>
      <span className="workout-status-sets">{matchingActiveSession.sets.length} sets</span>
      <span className="workout-status-exercise">
        {activeExercise?.name
          ? activeExercise.name.length > 20
            ? activeExercise.name.slice(0, 18) + "…"
            : activeExercise.name
          : "—"}
      </span>
      <button
        type="button"
        className="workout-status-end-btn"
        onClick={handleFinishWorkout}
      >
        End Workout
      </button>
    </div>
  ) : null}
  ```

  > **Confirmation note:** `handleFinishWorkout` calls `setPendingCompletion(...)`, which renders the `<RecoveryRatingPrompt>` modal (line 1123 of today-screen.tsx). The user must tap "Submit" or "Skip" in that prompt before the session is finalized -- this IS the "requires confirm tap" step from the spec. No additional `window.confirm()` is needed.

- [ ] **Step 7: Add status bar CSS**

  In `globals.css`:

  ```css
  .workout-status-bar {
    position: fixed;
    left: 0.6rem;
    right: 0.6rem;
    bottom: 0.74rem;
    z-index: 12;
    display: flex;
    align-items: center;
    gap: 0.75rem;
    padding: 0.55rem 0.85rem;
    border-radius: var(--radius-xl);
    border: var(--border-width) solid color-mix(in srgb, var(--accent-primary), transparent 60%);
    background: var(--nav-bg);
    backdrop-filter: blur(12px);
    -webkit-backdrop-filter: blur(12px);
    box-shadow: var(--shadow-card);
  }

  .workout-status-time {
    font-family: var(--font-mono), monospace;
    font-size: 1rem;
    color: var(--accent-primary);
    min-width: 3.5rem;
  }

  .workout-status-sets {
    font-family: var(--font-ui), sans-serif;
    font-size: 0.8rem;
    color: var(--text-1);
    white-space: nowrap;
  }

  .workout-status-exercise {
    font-family: var(--font-ui), sans-serif;
    font-size: 0.85rem;
    color: var(--text-0);
    flex: 1;
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
  }

  .workout-status-end-btn {
    padding: 0.35rem 0.75rem;
    border-radius: var(--radius-sm);
    border: var(--border-width) solid var(--danger);
    background: transparent;
    color: var(--danger);
    font-family: var(--font-display), sans-serif;
    font-size: 0.9rem;
    text-transform: uppercase;
    letter-spacing: 0.06em;
    cursor: pointer;
    white-space: nowrap;
    transition: background 180ms var(--ease-standard);
  }

  .workout-status-end-btn:hover {
    background: color-mix(in srgb, var(--danger), transparent 80%);
  }
  ```

### 2d: Touch target updates (Today screen only)

- [ ] **Step 8: Increase touch targets in CSS**

  Add targeted overrides in `globals.css`. Search for `.set-save-btn` to find the save button styles, then add:

  ```css
  /* Active workout touch targets (Today screen) */
  .set-row input[type="number"],
  .set-row select {
    min-height: 52px;
  }

  .set-save-btn {
    min-height: 56px;
  }

  .rest-dial-wrap .ghost-btn {
    min-height: 48px;
  }
  ```

- [ ] **Step 9: Increase exercise queue card font sizes**

  These changes go in `globals.css`. Search for `.exercise-queue-card` or `.queue-card` to find existing styles and bump them:

  ```css
  /* Exercise name in queue card: 0.95rem → 1.05rem */
  /* Scheme text: 0.8rem → 0.9rem */
  /* These override existing values -- add after existing queue-card blocks */
  .queue-card-name {
    font-size: 1.05rem;
  }

  .queue-card-scheme {
    font-size: 0.9rem;
  }
  ```

  > If these class names don't match exactly -- grep for the current class names used in `exercise-queue-card.tsx` before adding.

- [ ] **Step 10: Type check**

  ```bash
  cd web && npx tsc --noEmit
  ```

  Expected: 0 errors.

- [ ] **Step 11: Visual verify**

  Open the app, start a workout (log any set). Confirm:
  - Bottom nav disappears
  - Status bar appears at the same bottom slot: shows elapsed time, sets count, exercise name, "End Workout" button
  - "End Workout" triggers the finish workout flow (recovery prompt, then session complete)
  - After session ends: nav reappears, status bar gone, padding restores
  - Try on mobile viewport (≤1023px) -- nav hides correctly

- [ ] **Step 12: Commit**

  ```bash
  cd web && git add src/lib/workout-store.ts src/components/app-shell.tsx src/app/globals.css src/components/screens/today-screen.tsx
  git commit -m "feat: active workout mode -- hide nav, show status bar during live session"
  ```

---

## Task 3: PR Detection + Feedback

**Files:**
- Create: `web/src/lib/pr-engine.ts`
- Create: `web/src/lib/__tests__/pr-engine.test.ts`
- Modify: `web/src/components/screens/today-screen.tsx`
- Modify: `web/src/app/globals.css`

Context:
- `handleSaveSet` in `today-screen.tsx` (line 463) is where a set gets confirmed -- this is the integration point
- After `logSet()` succeeds, check if the logged weight+reps beats historical e1RM for that exercise
- `sessionHistory` is already in `today-screen.tsx` state (updated via `getAllSessions()`)
- The PR badge appears in the set log row: `today-screen.tsx` already renders logged sets somewhere in its JSX

### 3a: Pure PR detection logic

- [ ] **Step 1: Write the failing test**

  Create `web/src/lib/__tests__/pr-engine.test.ts`:

  ```typescript
  import { describe, it, expect } from "vitest";
  import { estimateE1RM, detectPR } from "../pr-engine";
  import type { WorkoutSession } from "../workout-store";

  const NOW = Date.now();

  function makeSession(exerciseName: string, weight: number, reps: number): WorkoutSession {
    return {
      id: "s1",
      programId: "mass-impact",
      weekNumber: 1,
      dayNumber: 1,
      startedAt: NOW - 86400000,
      completedAt: NOW - 86400000 + 3600000,
      sets: [{ exerciseName, setIndex: 1, weight, reps, timestamp: NOW - 86400000 }],
    };
  }

  describe("estimateE1RM", () => {
    it("returns weight for 1 rep", () => {
      expect(estimateE1RM(100, 1)).toBeCloseTo(100 * (1 + 1 / 30));
    });

    it("returns higher e1RM for more reps at same weight", () => {
      expect(estimateE1RM(100, 8)).toBeGreaterThan(estimateE1RM(100, 5));
    });
  });

  describe("detectPR", () => {
    it("returns isPR true when no history exists", () => {
      const result = detectPR("Squat (Barbell)", 100, 5, []);
      expect(result.isPR).toBe(true);
      expect(result.previousBestE1RM).toBeNull();
    });

    it("returns isPR true when current e1RM beats historical best", () => {
      const history = [makeSession("Squat (Barbell)", 80, 5)];
      const result = detectPR("Squat (Barbell)", 100, 5, history);
      expect(result.isPR).toBe(true);
      expect(result.previousBestE1RM).toBeCloseTo(estimateE1RM(80, 5));
    });

    it("returns isPR false when current e1RM does not beat historical best", () => {
      const history = [makeSession("Squat (Barbell)", 120, 5)];
      const result = detectPR("Squat (Barbell)", 100, 5, history);
      expect(result.isPR).toBe(false);
    });

    it("ignores sets for other exercises", () => {
      const history = [makeSession("Bench Press (Barbell)", 200, 5)];
      const result = detectPR("Squat (Barbell)", 50, 5, history);
      expect(result.isPR).toBe(true); // no squat history, so it's a PR
    });

    it("ignores sets with zero weight or zero reps", () => {
      const sessionWithZero: WorkoutSession = {
        id: "s2",
        programId: "mass-impact",
        weekNumber: 1,
        dayNumber: 1,
        startedAt: NOW,
        sets: [{ exerciseName: "Squat (Barbell)", setIndex: 1, weight: 0, reps: 5, timestamp: NOW }],
      };
      const result = detectPR("Squat (Barbell)", 50, 5, [sessionWithZero]);
      expect(result.isPR).toBe(true);
    });
  });
  ```

- [ ] **Step 2: Run test to verify it fails**

  ```bash
  cd web && npx vitest run src/lib/__tests__/pr-engine.test.ts
  ```

  Expected: FAIL -- `pr-engine` module not found.

- [ ] **Step 3: Create pr-engine.ts**

  Create `web/src/lib/pr-engine.ts`:

  ```typescript
  import type { WorkoutSession } from "@/lib/workout-store";

  export interface PRResult {
    isPR: boolean;
    previousBestE1RM: number | null;
    currentE1RM: number;
  }

  /** Epley formula: weight * (1 + reps / 30) */
  export function estimateE1RM(weight: number, reps: number): number {
    return weight * (1 + reps / 30);
  }

  /**
   * Check whether the given weight+reps beats the historical best e1RM
   * for this exercise across all provided sessions.
   *
   * Pure function -- no side effects, no localStorage reads.
   * Caller passes getAllSessions(activeUser) from workout-store.
   */
  export function detectPR(
    exerciseName: string,
    weight: number,
    reps: number,
    sessionHistory: WorkoutSession[],
  ): PRResult {
    const currentE1RM = estimateE1RM(weight, reps);

    const bestHistoricalE1RM = sessionHistory
      .flatMap((s) => s.sets)
      .filter((s) => s.exerciseName === exerciseName && s.weight > 0 && s.reps > 0)
      .reduce((best, s) => Math.max(best, estimateE1RM(s.weight, s.reps)), 0);

    return {
      isPR: currentE1RM > bestHistoricalE1RM,
      previousBestE1RM: bestHistoricalE1RM > 0 ? bestHistoricalE1RM : null,
      currentE1RM,
    };
  }
  ```

- [ ] **Step 4: Run tests to verify they pass**

  ```bash
  cd web && npx vitest run src/lib/__tests__/pr-engine.test.ts
  ```

  Expected: All 5 tests PASS.

- [ ] **Step 5: Run full test suite**

  ```bash
  cd web && npm test
  ```

  Expected: All tests pass (no regressions in volume-engine tests).

### 3b: Wire into today-screen.tsx

- [ ] **Step 6: Add PR state and detection to handleSaveSet**

  In `today-screen.tsx`, add import:

  ```typescript
  import { detectPR } from "@/lib/pr-engine";
  ```

  Add PR state near the other state declarations:

  ```typescript
  // Track PR exercises by name for badge display during this session
  const [prExercises, setPrExercises] = useState<Set<string>>(new Set());
  ```

  In `handleSaveSet`, after the `if (updated) { setActiveSession(updated); }` block (line ~493), add:

  ```typescript
  // PR detection -- runs against completed session history (not the active session)
  const prResult = detectPR(activeExercise.name, weight, reps, sessionHistory);
  if (prResult.isPR) {
    setPrExercises((prev) => new Set([...prev, activeExercise.name]));
    // Haptic feedback -- double pulse; silently no-ops on iOS and desktop
    if (typeof navigator.vibrate === "function") {
      navigator.vibrate([80, 40, 80]);
    }
  }
  ```

- [ ] **Step 7: Render PR badge on logged sets**

  In `today-screen.tsx`, the logged sets for the current exercise are displayed in a `.logged-set-list` around line 1074. Each row is a `.logged-set-chip` div containing set index, weight x reps, and timestamp. The PR badge goes inline after the weight/reps line.

  Find this block (around line 1078):
  ```tsx
  <p style={{ margin: "0.18rem 0 0" }}>
    {set.weight} lb x {set.reps}
    {set.rpe ? ` @ ${set.rpe}` : ""}
  </p>
  ```

  Replace with:
  ```tsx
  <p style={{ margin: "0.18rem 0 0", display: "flex", alignItems: "center", gap: "0.4rem" }}>
    {set.weight} lb x {set.reps}
    {set.rpe ? ` @ ${set.rpe}` : ""}
    {prExercises.has(set.exerciseName) && <span className="pr-badge">PR</span>}
  </p>
  ```

  This renders the PR badge inline next to the weight/reps for every logged set of a PR exercise, persisting for the rest of the session (since `prExercises` is session-scoped state).

- [ ] **Step 8: Add green pulse to exercise queue card**

  The exercise queue card already has an orange flash on log-set (look for `flash` or `saveFlash` in `exercise-queue-card.tsx`). Add a PR pulse by adding a `prFlash` prop pattern:

  In `today-screen.tsx`, when a PR is detected, set a brief flag for the active exercise. You can reuse a similar pattern to `saveFlash`:

  ```typescript
  const [prFlash, setPrFlash] = useState(false);
  ```

  In `handleSaveSet` after setting `prExercises`:

  ```typescript
  if (prResult.isPR) {
    setPrFlash(true);
    window.setTimeout(() => setPrFlash(false), 400);
    // ...existing haptic code
  }
  ```

  Pass `prFlash` to `ExerciseQueueCard` and apply a CSS class:

  ```tsx
  <ExerciseQueueCard
    // ...existing props
    prFlash={prFlash}
  />
  ```

  In `exercise-queue-card.tsx`:
  - Add `prFlash?: boolean` to the `ExerciseQueueCardProps` type (around line 1)
  - The card root element is a `<button>` at line 63 with class `surface exercise-card ...`. Add the pr-pulse class there:
  ```tsx
  <button
    type="button"
    className={`surface exercise-card${isActive ? " active" : ""}${isDone ? " done" : ""}${supersetGroup ? " superset-grouped" : ""}${prFlash ? " pr-pulse" : ""}`}
    onClick={onSelect}
  >
  ```

- [ ] **Step 9: Add CSS for PR badge and green pulse**

  In `globals.css`:

  ```css
  .pr-badge {
    display: inline-flex;
    align-items: center;
    padding: 0.1rem 0.45rem;
    border-radius: 999px;
    background: color-mix(in srgb, var(--ok), transparent 75%);
    border: 1px solid var(--ok);
    color: var(--ok);
    font-family: var(--font-display), sans-serif;
    font-size: 0.7rem;
    letter-spacing: 0.08em;
    text-transform: uppercase;
    animation: pr-pop 150ms var(--ease-standard);
  }

  @keyframes pr-pop {
    from { transform: scale(0.6); opacity: 0; }
    to   { transform: scale(1);   opacity: 1; }
  }

  /* Target the actual element class -- ExerciseQueueCard renders as <button class="surface exercise-card ..."> */
  .exercise-card.pr-pulse {
    animation: pr-pulse 400ms var(--ease-standard);
  }

  @keyframes pr-pulse {
    0%   { border-color: var(--ok); box-shadow: 0 0 0 2px color-mix(in srgb, var(--ok), transparent 60%); }
    60%  { border-color: var(--ok); box-shadow: 0 0 0 4px color-mix(in srgb, var(--ok), transparent 80%); }
    100% { border-color: var(--border); box-shadow: none; }
  }
  ```

- [ ] **Step 10: Type check**

  ```bash
  cd web && npx tsc --noEmit
  ```

  Expected: 0 errors.

- [ ] **Step 11: Visual verify**

  Load the app, navigate to Today. Start a workout. Log a set with any weight/reps. If there is no prior history for that exercise, the PR badge should appear and the queue card should flash green briefly.

- [ ] **Step 12: Commit**

  ```bash
  cd web && git add src/lib/pr-engine.ts src/lib/__tests__/pr-engine.test.ts src/components/screens/today-screen.tsx src/components/exercise-queue-card.tsx src/app/globals.css
  git commit -m "feat: PR detection -- Epley e1RM comparison, green badge, haptic feedback"
  ```

---

## Task 4: Progress & Data Viz Rework

**Files:**
- Modify: `web/src/components/trend-chart-card.tsx`
- Create: `web/src/components/strength-chart-card.tsx`
- Modify: `web/src/components/screens/progress-screen.tsx`
- Modify: `web/src/app/globals.css`

Context:
- `TrendChartCard` currently accepts `{ title, subtitle, points: number[] }` -- CSS bars, no SVG
- `progress-screen.tsx` calls `getWeeklyVolume()` which groups by program week number, not calendar week
- The 3 TrendChartCards render: Weekly Volume, Squat Strength, Upper Progress (incline+pullup combined)
- After this task, Volume gets weekly ISO aggregation + SVG trend line; Squat/Incline/Pullup become separate SVG charts

### 4a: Update TrendChartCard and its callers atomically

> **Order matters:** TrendChartCard's prop type changes from `number[]` to `WeekPoint[]`. Update `progress-screen.tsx` in the same step so TypeScript never goes broken between commits.

- [ ] **Step 1: Update TrendChartCard to accept labeled data + trend line**

  Replace the contents of `web/src/components/trend-chart-card.tsx`:

  ```typescript
  type WeekPoint = {
    label: string;
    value: number;
  };

  type TrendChartCardProps = {
    title: string;
    subtitle: string;
    points: WeekPoint[];
  };

  export function TrendChartCard({ title, subtitle, points }: TrendChartCardProps) {
    const values = points.map((p) => p.value);
    const max = Math.max(...values, 1);
    const last = points.at(-1);

    // SVG trend line: connect midpoint-top of each bar
    // viewBox width = 100 * points.length (so each bar = 100 units wide)
    const svgWidth = Math.max(points.length * 100, 100);
    const trendPoints = values
      .map((v, i) => {
        const x = i * 100 + 50; // midpoint of each bar slot
        const y = 100 - Math.round((v / max) * 100); // 0=top, 100=bottom
        return `${x},${y}`;
      })
      .join(" ");

    return (
      <article className="card trend-card reveal">
        <div>
          <p className="subtle-label" style={{ margin: 0 }}>
            {subtitle}
          </p>
          <h3 className="section-title" style={{ marginTop: "0.2rem" }}>
            {title}
          </h3>
        </div>
        <div className="trend-bars" aria-hidden="true" style={{ position: "relative" }}>
          {points.map((point, idx) => (
            <div
              key={`${title}-${idx}`}
              className="trend-bar"
              style={{ height: `${Math.max(8, Math.round((point.value / max) * 100))}%` }}
            />
          ))}
          {points.length > 1 && (
            <svg
              viewBox={`0 0 ${svgWidth} 100`}
              preserveAspectRatio="none"
              style={{
                position: "absolute",
                inset: 0,
                width: "100%",
                height: "100%",
                pointerEvents: "none",
              }}
            >
              <polyline
                points={trendPoints}
                fill="none"
                stroke="var(--accent-primary)"
                strokeOpacity="0.6"
                strokeWidth="1.5"
                strokeLinejoin="round"
              />
            </svg>
          )}
        </div>
        <p className="page-note" style={{ margin: 0 }}>
          Last: <span className="mono">{last ? `${last.value} (${last.label})` : "—"}</span>
        </p>
      </article>
    );
  }
  ```

  **Immediately after** updating `trend-chart-card.tsx`, update the caller in `progress-screen.tsx` in the same editing session -- do NOT type check between these two changes, as it will fail until both are done.

### 4b: Update progress-screen.tsx (same session as Step 1)

- [ ] **Step 2: Add isoWeekKey helper and weekly aggregation**

  In `web/src/components/screens/progress-screen.tsx`, add the helper function before `ProgressScreen`:

  > **Note:** `sessions` (from `getAllSessions()`) is already declared at line 21 of `progress-screen.tsx`. The aggregation loop below uses it directly -- do not re-declare it.

  ```typescript
  /**
   * Returns ISO 8601 year-week key like "2026-W12" for any timestamp.
   *
   * Limitation: uses local date for day extraction, then passes to UTC Date.UTC().
   * Sessions logged near midnight in timezones behind UTC may be binned to the
   * prior ISO week. This is an acceptable tradeoff -- no date-fns dependency,
   * and the error is at most 1 week and only affects timezone edge cases.
   */
  function isoWeekKey(ts: number): string {
    const d = new Date(ts);
    const thu = new Date(Date.UTC(d.getFullYear(), d.getMonth(), d.getDate()));
    thu.setUTCDate(thu.getUTCDate() + 4 - (thu.getUTCDay() || 7));
    const yearStart = new Date(Date.UTC(thu.getUTCFullYear(), 0, 1));
    const week = Math.ceil(((thu.getTime() - yearStart.getTime()) / 86400000 + 1) / 7);
    return `${thu.getUTCFullYear()}-W${String(week).padStart(2, "0")}`;
  }
  ```

  Inside `ProgressScreen`, replace the `getWeeklyVolume()` call with ISO-week aggregation:

  ```typescript
  // Aggregate sessions by ISO calendar week instead of program week number
  const weeklyVolumeMap = new Map<string, number>();
  for (const session of sessions) {
    const key = isoWeekKey(session.startedAt);
    weeklyVolumeMap.set(key, (weeklyVolumeMap.get(key) ?? 0) + session.sets.length);
  }
  // Sort by key (ISO keys sort correctly as strings), take last 12 weeks
  const sortedWeekKeys = Array.from(weeklyVolumeMap.keys()).sort();
  const last12 = sortedWeekKeys.slice(-12);
  const weeklyVolumePoints = last12.map((key) => ({
    label: key.split("-W")[1] ? `W${key.split("-W")[1]}` : key,
    value: weeklyVolumeMap.get(key) ?? 0,
  }));
  ```

  Remove the old `const weeklyVolume = getWeeklyVolume();` line and remove `getWeeklyVolume` from the import.

- [ ] **Step 3: Update the Weekly Volume TrendChartCard call**

  In `progress-screen.tsx`, replace the Weekly Volume TrendChartCard call:
  ```tsx
  <TrendChartCard
    title="Weekly Volume"
    subtitle="Total logged sets per week"
    points={toPoints(weeklyVolume.map((item) => item.totalSets))}
  />
  ```

  With:
  ```tsx
  <TrendChartCard
    title="Weekly Volume"
    subtitle="Total logged sets per week"
    points={weeklyVolumePoints.length > 0 ? weeklyVolumePoints : [{ label: "—", value: 0 }]}
  />
  ```

  The two remaining TrendChartCards (Squat Strength, Upper Progress) will be replaced by `StrengthChartCard` in Step 6 below. Leave them temporarily -- the compiler will show errors until then. Remove `toPoints` and `getWeeklyVolume` only after all 3 calls are migrated.

- [ ] **Step 4: Type check (expect 2 remaining errors from strength TrendChartCards)**

  ```bash
  cd web && npx tsc --noEmit
  ```

  Expected: Exactly 2 errors about `points` type mismatch on the Squat Strength and Upper Progress TrendChartCard calls. These will be fixed in Step 6.

### 4c: Create StrengthChartCard

- [ ] **Step 5: Create web/src/components/strength-chart-card.tsx**

  ```typescript
  type StrengthPoint = {
    date: number;       // session.startedAt timestamp
    weight: number;     // best set weight
    reps: number;       // best set reps
  };

  type StrengthChartCardProps = {
    title: string;
    subtitle: string;
    points: StrengthPoint[];
  };

  /** Epley e1RM estimate -- same formula as pr-engine, duplicated to avoid circular imports. */
  function e1rm(weight: number, reps: number): number {
    return weight * (1 + reps / 30);
  }

  /** 3-session centered moving average */
  function movingAvg(values: number[]): number[] {
    return values.map((_, i) => {
      const slice = values.slice(Math.max(0, i - 1), i + 2);
      return slice.reduce((a, b) => a + b, 0) / slice.length;
    });
  }

  export function StrengthChartCard({ title, subtitle, points }: StrengthChartCardProps) {
    if (points.length === 0) {
      return (
        <article className="card trend-card reveal">
          <p className="subtle-label" style={{ margin: 0 }}>{subtitle}</p>
          <h3 className="section-title" style={{ marginTop: "0.2rem" }}>{title}</h3>
          <p className="page-note" style={{ margin: 0 }}>No data yet.</p>
        </article>
      );
    }

    const weights = points.map((p) => p.weight);
    const e1rms = points.map((p) => e1rm(p.weight, p.reps));
    const mavg = movingAvg(weights);

    const allValues = [...weights, ...e1rms, ...mavg];
    const rawMin = Math.min(...allValues);
    const rawMax = Math.max(...allValues);
    const yMin = rawMin * 0.92;
    const yMax = rawMax * 1.05;
    const yRange = yMax - yMin || 1;

    const W = 600;
    const H = 160;
    const PADDING = { top: 12, right: 16, bottom: 28, left: 36 };
    const chartW = W - PADDING.left - PADDING.right;
    const chartH = H - PADDING.top - PADDING.bottom;

    const xStep = points.length > 1 ? chartW / (points.length - 1) : chartW / 2;

    const toX = (i: number) =>
      PADDING.left + (points.length === 1 ? chartW / 2 : i * xStep);
    const toY = (v: number) =>
      PADDING.top + chartH - ((v - yMin) / yRange) * chartH;

    const dotPoints = points.map((p, i) => ({ x: toX(i), y: toY(p.weight) }));
    const e1rmPath = e1rms.map((v, i) => `${i === 0 ? "M" : "L"}${toX(i)},${toY(v)}`).join(" ");
    const mavgPath = mavg.map((v, i) => `${i === 0 ? "M" : "L"}${toX(i)},${toY(v)}`).join(" ");

    // Y-axis labels: 3 evenly spaced
    const yLabels = [yMin, yMin + yRange / 2, yMax].map((v) => ({
      value: Math.round(v),
      y: toY(v),
    }));

    const last = points.at(-1)!;

    return (
      <article className="card trend-card reveal">
        <div>
          <p className="subtle-label" style={{ margin: 0 }}>{subtitle}</p>
          <h3 className="section-title" style={{ marginTop: "0.2rem" }}>{title}</h3>
        </div>
        <svg
          viewBox={`0 0 ${W} ${H}`}
          preserveAspectRatio="xMidYMid meet"
          style={{ width: "100%", height: "auto", overflow: "visible" }}
          aria-hidden="true"
        >
          {/* Y-axis labels */}
          {yLabels.map((lbl) => (
            <text
              key={lbl.value}
              x={PADDING.left - 4}
              y={lbl.y + 4}
              textAnchor="end"
              fontSize="10"
              fill="var(--text-2)"
              fontFamily="var(--font-mono)"
            >
              {lbl.value}
            </text>
          ))}

          {/* Moving average line -- behind everything */}
          {points.length > 1 && (
            <path d={mavgPath} fill="none" stroke="var(--text-2)" strokeWidth="1" opacity="0.5" />
          )}

          {/* e1RM trend line -- dashed */}
          {points.length > 1 && (
            <path
              d={e1rmPath}
              fill="none"
              stroke="var(--accent-primary)"
              strokeWidth="1.5"
              strokeDasharray="4 3"
              opacity="0.4"
            />
          )}

          {/* Data point dots + rep labels */}
          {dotPoints.map((dot, i) => (
            <g key={`dot-${i}`}>
              <circle cx={dot.x} cy={dot.y} r="4" fill="var(--accent-primary)" />
              <text
                x={dot.x}
                y={dot.y + 14}
                textAnchor="middle"
                fontSize="9"
                fill="var(--text-2)"
                fontFamily="var(--font-mono)"
              >
                ×{points[i].reps}
              </text>
            </g>
          ))}
        </svg>
        <p className="page-note" style={{ margin: 0 }}>
          Last: <span className="mono">{last.weight} lb × {last.reps}</span>
          {" "}
          <span className="mono" style={{ color: "var(--text-2)", fontSize: "0.75em" }}>
            (e1RM ~{Math.round(e1rm(last.weight, last.reps))} lb)
          </span>
        </p>
      </article>
    );
  }
  ```

### 4d: Wire StrengthChartCard into progress-screen.tsx

- [ ] **Step 6: Import StrengthChartCard and convert strength chart data**

  In `progress-screen.tsx`, add import:

  ```typescript
  import { StrengthChartCard } from "@/components/strength-chart-card";
  ```

  Convert exercise history to `StrengthPoint[]`:

  ```typescript
  const squatPoints = squatHistory.map((item) => ({
    date: item.date,
    weight: item.bestSet.weight,
    reps: item.bestSet.reps,
  }));

  const inclinePoints = inclineHistory.map((item) => ({
    date: item.date,
    weight: item.bestSet.weight,
    reps: item.bestSet.reps,
  }));

  const pullupPoints = pullupHistory.map((item) => ({
    date: item.date,
    weight: item.bestSet.weight,
    reps: item.bestSet.reps,
  }));
  ```

- [ ] **Step 7: Replace Squat Strength and Upper Progress TrendChartCards**

  Replace the `<section className="grid-3">` block. The current 3 TrendChartCards become 4 cards (Volume + Squat + Incline + Pullup):

  ```tsx
  <section className="grid-3">
    <TrendChartCard
      title="Weekly Volume"
      subtitle="Total logged sets per week"
      points={weeklyVolumePoints.length > 0 ? weeklyVolumePoints : [{ label: "—", value: 0 }]}
    />
    <StrengthChartCard
      title="Squat Strength"
      subtitle="Best set weight (lb)"
      points={squatPoints}
    />
    <StrengthChartCard
      title="Incline Progress"
      subtitle="Best set weight (lb)"
      points={inclinePoints}
    />
    <StrengthChartCard
      title="Pull-Up Progress"
      subtitle="Best set weight (lb)"
      points={pullupPoints}
    />
  </section>
  ```

  Remove `toPoints` helper and remaining old imports (`getWeeklyVolume` if not already removed).

- [ ] **Step 8: Type check**

  ```bash
  cd web && npx tsc --noEmit
  ```

  Expected: 0 errors. (If `toPoints` is still referenced, remove it and `getWeeklyVolume` from the import now.)

- [ ] **Step 9: Run full test suite**

  ```bash
  cd web && npm test
  ```

  Expected: All tests pass.

- [ ] **Step 10: Visual verify progress screen**

  Open `/progress`. Confirm:
  - Weekly Volume chart shows bars with a trend polyline overlaid
  - "Last:" footer shows week label like "W12"
  - 3 strength charts appear (Squat, Incline, Pull-Up) with SVG rendering
  - Each strength chart has: data dots, dashed e1RM line, thin solid moving average line, rep labels below dots
  - Y-axis starts near data minimum (not zero)

- [ ] **Step 11: Commit**

  ```bash
  cd web && git add src/components/trend-chart-card.tsx src/components/strength-chart-card.tsx src/components/screens/progress-screen.tsx src/app/globals.css
  git commit -m "feat: progress chart rework -- weekly ISO aggregation, SVG strength charts, e1RM trend"
  ```

---

## Final Verification

- [ ] **Run full type check**

  ```bash
  cd web && npx tsc --noEmit
  ```

  Expected: 0 errors.

- [ ] **Run full test suite**

  ```bash
  cd web && npm test
  ```

  Expected: All tests pass.

- [ ] **Manual success criteria check**

  - [ ] Active session hides bottom nav and shows status bar on mobile
  - [ ] Bottom nav shows 5 items with full-word labels, min 56px height
  - [ ] Settings accessible via gear icon in profile banner
  - [ ] Logging a set with no prior history triggers PR badge + haptic (use DevTools to simulate)
  - [ ] Progress volume chart shows weekly bars + trend line
  - [ ] Strength charts have SVG rendering, non-zero y-axis, rep count labels, dashed e1RM trend line
