# RP Workout Experience -- UX Overhaul Design Spec

**Date:** 2026-04-06
**Status:** Draft
**Scope:** RP setup screen + today-screen RP mode (navigation, progress, ratings, meso transitions)

## Overview

The RP integration has a working engine (177 tests passing) but the user experience is broken. The week/day navigation is decoupled from RP state, the setup screen doesn't show enough info, and there's no clear progress indicator. This spec redesigns the RP workout experience end-to-end.

### Key Decisions (from brainstorming)

- **Locked navigation:** No week dropdown for RP programs. Users train the current week only. A meso context card replaces the week picker.
- **Flexible day order within week:** Train days in any order. Week advances when all days are done (not just when "last day number" completes).
- **Meso context card:** Shows meso name, week X of Y, day checkboxes, RIR, rest, weight info.
- **Week 1 preview on setup:** After entering 10RMs, see calculated Week 1 weights before committing.

---

## 1. Setup Screen (`rp-setup-screen.tsx`)

### Phase 1: Configure

What already exists, refined:

- Meso picker tabs: Basic / Metabolite / Resensitize (already committed)
- Meso info card: weight %, RIR, rest ranges, duration (already committed)
- Exercise slots grouped by day: dropdown + 10RM input + sets shown (already committed)

### Phase 2: Week 1 Preview (NEW)

Appears when `isComplete === true` (all active slots have exerciseName + tenRepMax > 0).

**Structure:** One card per day showing the exact output of `getRpExercisesForDay()`:

```
┌─ WEEK 1 PREVIEW ──────────────────┐
│                                     │
│  Day 1: Push Emphasis               │
│  ┌─────────────────────────────────┐│
│  │ Bench Press (Barbell)           ││
│  │ 170 lbs  ·  3 sets  ·  RIR 3   ││
│  ├─────────────────────────────────┤│
│  │ Flat Dumbbell Flye              ││
│  │ 25 lbs   ·  3 sets  ·  RIR 3   ││
│  ├─────────────────────────────────┤│
│  │ ...                             ││
│  └─────────────────────────────────┘│
│                                     │
│  Day 2: Legs Emphasis               │
│  ...                                │
│                                     │
│  [Start Mesocycle]                  │
└─────────────────────────────────────┘
```

**Implementation:** Call `getRpExercisesForDay()` with a temporary RpProgramState (currentWeek: 1, currentMeso: selected meso, selections from form, ratings: []) for each day. Render the resulting ProgramExercise[] as read-only cards showing name, prescribedWeight, sets (from setGroups[0].sets), and rirTarget.

**Purpose:** Catches 10RM entry errors. If you type 315 instead of 135, you'll see "Week 1: 270 lbs" and know immediately.

### Props Change

The `meso` prop becomes the initial value for internal state. The component already manages its own `meso` state via `useState(initialMeso)`.

No other prop changes needed.

---

## 2. Meso Context Card (NEW component)

### File: `web/src/components/rp-meso-card.tsx`

Replaces the week/day dropdowns for RP programs on the today screen.

### Props

```ts
interface RpMesoCardProps {
  meso: RpMesoType;
  currentWeek: number;
  totalWeeks: number;          // getMesoWeeks(meso)
  daysPerWeek: number;
  dayTitles: string[];
  completedDays: Set<number>;  // which days in current week have completed sessions
  selectedDay: number;         // currently viewed day
  onSelectDay: (day: number) => void;
  rirTarget: string;
  restRange: { min: number; max: number };
  weekMultiplierLabel: string; // e.g., "Base", "+5%", "+7.5%", "+10%", "Deload"
  isDeload: boolean;
  allDaysComplete: boolean;
  onAdvanceWeek: () => void;
  onCompleteMeso: () => void;
}
```

### Render

```
┌─────────────────────────────────────┐
│  MESO 1: BASIC HYPERTROPHY         │
│  Week 2 of 5    RIR: 3/fail        │
│                                     │
│  [✓ Day 1] [● Day 2] [○ Day 3]     │
│                                     │
│  REST: 2:00-5:00    WEIGHT: +5%    │
└─────────────────────────────────────┘
```

- Meso name: `var(--font-display)`, uppercase, cyan
- Week/RIR: mono text, same row
- Day checkboxes: tappable buttons in a row
  - `✓` = completed (muted, still tappable for review)
  - `●` = selected/active (accent border)
  - `○` = not yet done
- REST and WEIGHT info: small mono text row
- When `allDaysComplete && !isDeload`: show "Advance to Week {currentWeek + 1}" button (btn-primary)
- When `allDaysComplete && isDeload`: show "Complete Mesocycle" button (btn-primary)
- Deload weeks: card background shifts slightly (surface-high), "DELOAD" badge next to week number

### Completed Days Calculation

In today-screen, derive `completedDays` from session history:

```ts
const rpCompletedDays = useMemo<Set<number>>(() => {
  if (!isRpProgram || !rpState) return new Set();
  const done = new Set<number>();
  for (let day = 1; day <= daysPerCycle; day++) {
    const dayDone = sessionHistory.some(
      s => s.dayNumber === day &&
           s.weekNumber === prefs.currentWeek &&
           s.programId === programId &&
           Boolean(s.completedAt)
    );
    if (dayDone) done.add(day);
  }
  return done;
}, [isRpProgram, rpState, sessionHistory, prefs.currentWeek, daysPerCycle, programId]);
```

`allDaysComplete` derivation: `rpCompletedDays.size >= daysPerCycle`.

**Important:** Filter by exact `programId`, not just `startsWith("rp-")`. Otherwise switching between RP programs would show stale completions.

**Important:** Do NOT use `getCompletedDays` from workout-store -- it doesn't filter by program.

### Week/Prefs Sync

RP meso weeks (1-5, 1-5, 1-3) don't map 1:1 to global weeks (1-13). The sync approach: `prefs.currentWeek` increments linearly across the full 13-week cycle. When Meso 1 ends at rpWeek 5, prefs is at global week 5. Meso 2 starts at rpWeek 1, prefs continues at global week 6. This ensures session weekNumbers are unique across the macrocycle.

```ts
// In the advance week handler:
const newRpWeek = rpState.currentWeek + 1;
const updated = { ...rpState, currentWeek: newRpWeek };
saveRpState(activeUser, updated);
setRpState(updated);
// Advance global week linearly (never wraps within a macrocycle)
persistPrefs(prefs.currentWeek + 1, 1); // advance week, reset to day 1
```

On meso transitions, `prefs.currentWeek` does NOT reset -- it keeps incrementing. Meso 2 Week 1 = global week 6. Meso 3 Week 1 = global week 11. This avoids session weekNumber collisions.

### Meso Number Derivation

`RpMesoType` doesn't carry a number. Derive from type:
```ts
const MESO_NUMBER: Record<RpMesoType, number> = { basic: 1, metabolite: 2, resensitization: 3 };
```

### Week Multiplier Label

```ts
function getWeekMultiplierLabel(week: number, isDeload: boolean): string {
  if (isDeload) return "Deload";
  const labels: Record<number, string> = { 1: "Base", 2: "+5%", 3: "+7.5%", 4: "+10%" };
  return labels[week] ?? "Base";
}
```

---

## 3. Today Screen Changes (`today-screen.tsx`)

### 3a. Replace Week/Day Selectors for RP

When `isRpProgram && rpState`:
- Hide the week dropdown, day dropdown, and arrow buttons
- Render `<RpMesoCard>` instead
- Day selection driven by `onSelectDay` callback (updates `prefs.currentDay`)

### 3b. Day Selection via Meso Card

When user taps a day checkbox:
1. Call `applyDaySelection(prefs.currentWeek, selectedDay)` (existing function)
2. Exercises reload from `getRpExercisesForDay()` for that day
3. Completed days are reviewable -- session history shows logged sets

### 3c. Week Advancement

**Surgery on `finalizeCompletion()`:** Remove the ENTIRE RP block from `finalizeCompletion()` (the `if (isRpProgram && rpState) { ... }` block, currently lines 768-794). All RP week advancement and meso completion is now driven exclusively by the meso card buttons, not by session completion. The existing non-RP meso advancement block (`if (programMeta?.hasAutoRegulation)`) stays -- it doesn't fire for RP because the RP block was the one doing the work.

**Clear `rpRatedSlots` on day change:** When user taps a different day in the meso card, `rpRatedSlots` is cleared. Slot IDs are unique per day so stale IDs from another day wouldn't cause incorrect behavior, but clearing keeps the set small. Add `setRpRatedSlots(new Set())` to the day selection handler.

**Flexible day order:** Day buttons in the meso card are tappable in any order. There's no sequential lock. Users can do Day 3 before Day 1. Each day is independently tracked as complete or not.

When user taps "Advance to Week X":
1. Increment `rpState.currentWeek`
2. Save to localStorage
3. Sync `prefs.currentWeek` forward
4. Reset `prefs.currentDay` to 1
5. Clear `rpRatedSlots`

When user taps "Complete Mesocycle":
1. Save carry-forward selections
2. Clear RP state
3. Set `rpMesoComplete = true`
4. Show setup screen for next meso (or "Macrocycle Complete" if after Meso 3)

### 3d. Rating Visibility

**Week 1 hint:** When `rpState.currentWeek === 1` and an exercise is autoregulated, show below the exercise in the queue:
```
Ratings unlock in Week 2
```
Small muted text, `var(--font-ui)`, 0.75rem, `color: var(--text-2)`.

**Deload hint:** When `isDeloadWeek(rpState.currentMeso, rpState.currentWeek)`:
```
Deload week -- no ratings
```

### 3e. Prevent Re-logging Completed Days

When a completed day is selected from the meso card, the "Start Workout" button should be disabled or change to "View Completed Workout". The logged sets are visible but the set entry form is inactive.

Actually, simpler: just let it work as-is. If someone wants to add more sets to a day they already "completed", that's their choice. The session system already handles multiple sessions on the same week/day. Don't over-constrain.

---

## 4. Meso Transition Flow

### Between Mesos

When "Complete Mesocycle" is tapped:
1. Show a brief summary inline (not a modal):
   ```
   Meso 1: Basic Hypertrophy -- Complete
   5 weeks · {sessionCount} sessions logged
   ```
2. Below it: "Set Up Meso 2: Metabolite" button
3. Tapping it saves carry-forward and shows setup screen with Meso 2 pre-selected

### After Meso 3

When resensitization deload completes:
1. Summary: "Macrocycle Complete! 13 weeks done"
2. "Start Fresh Cycle" button: calls `clearRpState()`, sets `rpMesoComplete = false` (NOT true), sets `rpState = null`. Since rpState is null and rpMesoComplete is false, the setup screen renders via the `if (isRpProgram && !rpState)` check. The setup screen defaults to Meso 1 with no carry-forward (clean slate).

**State machine clarity:** The setup screen renders when `isRpProgram && (!rpState || rpMesoComplete)`. For inter-meso transitions, `rpMesoComplete = true` and `rpState = null`. For macrocycle end, both are false/null. Both paths show the setup screen via the `!rpState` condition. The `rpMesoComplete` flag only matters for determining whether to pass carry-forward and which meso to pre-select.

### Session Count (deferred)

The summary mentions sessions logged. Counting sessions within a meso requires filtering by date range or week range. This is nice-to-have -- skip for now and just show "Complete" without a count. Add session counting in a follow-up if wanted.

---

## 5. Files Modified

| File | Change |
|------|--------|
| `web/src/components/screens/rp-setup-screen.tsx` | Add Week 1 preview section when isComplete |
| `web/src/components/rp-meso-card.tsx` | **NEW** -- meso context card component |
| `web/src/components/screens/today-screen.tsx` | Replace week/day selectors with meso card for RP, remove auto-advance from finalizeCompletion, add rating hints, wire up day selection and week advancement |

### Files NOT Modified
- `rp-engine.ts` -- no changes
- `rp-store.ts` -- no changes
- `rp-types.ts` -- no changes
- `program-registry.ts` -- no changes
- `exercise-queue-card.tsx` -- no changes
- `globals.css` -- may need minor additions for meso card styling

---

## 6. What This Does NOT Include

- Session history review (browsing past weeks' logged data)
- RP-specific progress charts
- Volume tracking integration for RP programs
- Exercise swap within RP setup (users pick from dropdown, no inline swap)
