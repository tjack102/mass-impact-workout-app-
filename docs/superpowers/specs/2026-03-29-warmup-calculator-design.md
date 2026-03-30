# Warm-Up Calculator — Design Spec

**Date:** 2026-03-29
**Status:** Approved
**Approach:** Overlay Modal, Dual Trigger (Approach C)

## Overview

An RP-style warm-up calculator based on Dr. Mike Israetel's warm-up protocol. A modal popup that takes a working weight and generates warm-up set recommendations. Accessible from the Live Console during active workouts (auto-filled) and as a standalone card on the today-screen when idle (manual entry). Pure display -- warm-up sets are not logged to session history.

## Core Calculation Engine

### File: `web/src/lib/warmup-engine.ts`

Pure function, no side effects, no imports from app state.

### Types

```typescript
export type WarmupSet = {
  weight: number;       // rounded to increment
  reps: number;         // single value (e.g. 10, 5, 3)
  repsDisplay: string;  // display string (e.g. "10", "5", "2-3" for potentiation)
  label: string;        // "Light", "Intermediate 1", "Intermediate 2", "Potentiation"
};

export type WarmupOptions = {
  roundingIncrement?: number;   // default 5
  startPercent?: number;        // default 45
  abbreviated?: boolean;        // true = skip light set, 1 intermediate only
};
```

### Function

```typescript
export function calculateWarmupSets(
  workingWeight: number,
  options?: WarmupOptions
): WarmupSet[];
```

### Protocol

Evaluate edge cases first, then apply the standard protocol:

**Edge cases (evaluated first):**
- Working weight = 0 or empty: return empty array
- Working weight <= 45 lbs: return only the potentiation set
- Working weight 46-65 lbs: light set + potentiation only (no intermediates)

**Standard protocol (working weight > 65 lbs):**

1. **Light set**: `startPercent`% of working weight (default 45%), 10 reps
2. **Intermediate sets**: evenly spaced between light weight and working weight, ~5 reps each. Count determined by working weight:
   - 66-200 lbs: 2 intermediates
   - 201-400 lbs: 3 intermediates
   - 401+ lbs: 4 intermediates
3. **Potentiation set**: working weight, 2-3 reps (display as "2-3")

**Deduplication:** If two adjacent warm-up sets round to the same weight, collapse them into a single set (keep the higher rep count).

### Abbreviated Mode

For subsequent exercises hitting the same muscle group. Skips the light set, uses only 1 intermediate set + potentiation.

### Rounding

All calculated weights round to the nearest `roundingIncrement` (default 5 lbs). If a calculated weight rounds to 45 lbs or below, clamp to 45 (bar weight). All weights are in lbs -- no kg support (consistent with rest of app).

## Overlay Modal Component

### File: `web/src/components/modal.tsx`

Generic, reusable overlay modal. Not warmup-specific.

```typescript
type ModalProps = {
  open: boolean;
  onClose: () => void;
  title: string;
  children: React.ReactNode;
};
```

### Behavior

- React portal rendering into `document.body`
- Semi-transparent backdrop (`rgba(0,0,0,0.6)`), tap to dismiss
- Centered content panel with class `surface`
- Max-width 400px, auto height, `--radius-lg` border-radius
- Escape key dismisses
- `role="dialog"`, `aria-modal="true"`, `aria-labelledby` on title
- Focus management: on open, set `inert` attribute on the `.app-shell` wrapper div to trap focus inside the modal. On close, remove `inert` and restore focus to the trigger element.
- Body scroll lock: `document.body.style.overflow = "hidden"` on open, restore original value on close
- No animation -- instant open/close

## Warmup Calculator Component

### File: `web/src/components/warmup-calculator.tsx`

Renders inside the generic Modal.

### Layout (top to bottom)

1. **Header row**: Title "Warm-Up Calculator" + gear icon (toggles settings row) + X close button
2. **Settings row** (collapsed by default): Rounding increment as 3-option radio group (2.5 / 5 / 10 lbs), start percentage as number input with stepper (default 45%)
3. **Input area**:
   - Exercise name (display-only when auto-filled from workout; text input when standalone -- optional, doesn't affect calculation)
   - Working weight number input (auto-filled from exercise history when triggered from workout)
   - "Abbreviated" toggle -- defaults OFF unless auto-detected
4. **Results table**: Warm-up sets listed with columns: Set label | Weight | Reps
   - Weight numbers in mono font with `--accent-primary` color
   - Visual separator between light/intermediate/potentiation groups
5. **Footer note**: "Warm-up sets are for reference only -- not logged"

### Behavior

- Results update live as working weight changes (no "Calculate" button)
- Empty/zero working weight shows prompt: "Enter your working weight"
- Imports `calculateWarmupSets` from `warmup-engine.ts`

### Settings Persistence

Stored in localStorage under key `mi_warmup_settings`:

```typescript
{ roundingIncrement: number, startPercent: number }
```

Default: `{ roundingIncrement: 5, startPercent: 45 }`

NOT per-profile -- shared across His/Hers (rounding preference is equipment-dependent, not user-dependent).

Read on modal open, written immediately on settings change.

## Dual Entry Points

### Entry Point 1: Active Workout (Live Console)

**Location:** New "Warm Up" button in the Live Console header flex row (alongside the exercise name `h2` and `SyncStateIndicator`), styled as a small `ghost-btn`.

**Visibility:** Only when a workout session is active AND an exercise is selected.

**Auto-fill logic:**
- Exercise name: from the active exercise
- Working weight: pull from `getLastPerformance(exerciseName)` which returns the heaviest set from the most recent session containing that exercise. If no history, leave blank for manual entry.
- Abbreviated toggle: auto-ON if the current exercise shares a primary muscle group with any previously completed exercise in the same session. Uses `findExercise()` from `exercise-library.ts` to look up `primaryMuscle` for both the current and completed exercises.

**Dependencies:** `getLastPerformance()` from `workout-store.ts`, `findExercise()` from `exercise-library.ts`.

### Entry Point 2: Standalone (No Active Workout)

**Location:** "Warm-Up Calculator" card on the today-screen, placed between the WorkoutHeader and the `two-col` div. Visible when `matchingActiveSession === null` (no active session for the currently viewed day).

**Styling:** `surface` card with icon + label, tappable.

**Behavior:** Opens the same modal with all fields blank. Exercise name becomes a text input (optional, for user reference only).

## File Map

### New Files

| File | Purpose |
|------|---------|
| `web/src/lib/warmup-engine.ts` | Pure `calculateWarmupSets()` function + `WarmupSet`/`WarmupOptions` types |
| `web/src/components/modal.tsx` | Generic reusable overlay modal (portal, backdrop, focus trap, scroll lock) |
| `web/src/components/warmup-calculator.tsx` | Calculator UI -- inputs, settings, results table |

### Modified Files

| File | Change |
|------|--------|
| `web/src/components/screens/today-screen.tsx` | Add "Warm Up" button in Live Console + standalone card when idle |
| `web/src/app/globals.css` | Modal backdrop + warmup calculator styles |

## Testing

### File: `web/src/lib/warmup-engine.test.ts`

Unit tests (Vitest) for the pure calculation function:

- Standard case: 225 lbs working weight returns light + 3 intermediates + potentiation
- Light working weight (60 lbs): light + potentiation only
- Very light (45 lbs or below): potentiation only
- Abbreviated mode: 1 intermediate + potentiation
- Rounding: all weights snap to increment (test 5 and 2.5)
- Custom start percent: verify light set weight changes accordingly
- Bar weight clamping: calculated weights below 45 clamp to 45
- Empty/zero input: returns empty array
- Threshold boundaries: 66, 200, 201, 400, 401
- Deduplication: adjacent sets rounding to same weight collapse into one

No component tests (consistent with existing app testing approach).

## Non-Goals

- Warm-up sets are NOT logged to workout sessions
- No warm-up history or tracking
- No per-profile settings (shared `mi_warmup_settings`)
- No new routes or nav items
- No animation on modal open/close
- No plate breakdown calculation (future feature)
