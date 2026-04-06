# RP Novice Templates -- Design Spec

**Date:** 2026-04-05
**Status:** Draft
**Approach:** B -- RP module with shared rendering

## Overview

Add four Renaissance Periodization novice training templates to the app with RP's signature volume autoregulation system. The autoregulation engine adjusts sets per exercise each week based on a simple recovery rating (-1/0/+1), converging on the user's Maximum Adaptive Volume (MAV).

### Templates

| ID | Name | Days/Week | Split |
|----|------|-----------|-------|
| rp-nf3 | RP Full Body 3-Day | 3 | Push/Legs/Pull emphasis |
| rp-nf4 | RP Full Body 4-Day | 4 | Upper/Lower alternating |
| rp-na4 | RP Arms-Focus 4-Day | 4 | Triceps+Front Delts / Biceps+Rear Delts |
| rp-nc4 | RP Chest/Back 4-Day | 4 | Chest push / Back pull |

All templates available to both His and Hers profiles.

### Mesocycle Structure (13 weeks total)

| Mesocycle | Weeks | Start Weight | Character |
|-----------|-------|-------------|-----------|
| 1: Basic Hypertrophy | 4 train + 1 deload | 85% of 10RM | Straight sets, standard rest (2-5 min) |
| 2: Metabolite Focus | 4 train + 1 deload | 75% of 10RM | Supersets, short rest (30-90s), higher starting volume |
| 3: Resensitization | 2 train + 1 deload | 100% of 10RM | Low volume, heavy, reset sensitivity |

---

## Data Model

### New Types (`rp-types.ts`)

```ts
type RpMesoType = "basic" | "metabolite" | "resensitization";

interface RpExerciseSlot {
  slotId: string;              // e.g. "d1-01"
  muscleCategory: string;      // e.g. "Horizontal Push", "Biceps", "Quads"
  dayNumber: number;
  order: number;
  pairedSlotId: string | null; // which slot's rating controls THIS slot's sets
  supersetWith?: string;       // slotId of partner (Meso 2 only)
  isAutoregulated: boolean;    // false for legs (quads, glutes, hamstrings, calves)
  baseSets: Record<RpMesoType, number>;
}

interface RpTemplate {
  id: string;
  name: string;
  daysPerWeek: number;
  dayTitles: string[];
  restDayPattern: number[];    // rest days between training days, drives schedule display
  slots: RpExerciseSlot[];
  exerciseCategories: Record<string, string[]>; // category -> exercise names
}

interface RpProgramState {
  templateId: string;
  currentMeso: RpMesoType;
  currentWeek: number;
  selections: Record<string, {  // keyed by slotId
    exerciseName: string;
    tenRepMax: number;
  }>;
  ratings: RpRatingEntry[];
}

interface RpRatingEntry {
  slotId: string;
  week: number;
  meso: RpMesoType;
  value: -1 | 0 | 1;
}
```

### Existing Type Changes

`ProgramExercise` (in `program-data.ts`) gets two new optional fields:
- `prescribedWeight?: number` -- calculated from 10RM for RP programs
- `rirTarget?: string` -- e.g. "3/fail", "2/fail", "1/fail"

`QueueExercise` (in `today-screen.tsx`) gets matching optional fields so the rendering layer can access them:
- `prescribedWeight?: number`
- `rirTarget?: string`
- `rpSlotId?: string` -- needed to associate the rating input with the correct slot

The `QueueExercise` mapping (around line 277 in today-screen.tsx) must propagate these fields from `ProgramExercise` when present.

`ProgramMeta` (in `types.ts`): RP programs use `periodizationType: "auto-regulated"` (existing value). RP-specific branching uses `programId.startsWith("rp-")` checks, not a new periodization type. This avoids breaking any existing `switch`/`if` chains on `periodizationType`.

---

## RP Engine Module (`rp-engine.ts`)

Pure functions, zero state, fully testable with Vitest.

### Weight Calculation

All weights derive from user's 10RM, rounded to nearest 5 via `MROUND(value, 5)`.

**Base multipliers by mesocycle:**
- Meso 1 (Basic): 10RM x 0.85
- Meso 2 (Metabolite): 10RM x 0.75 (superset secondary: x 0.60)
- Meso 3 (Resensitization): 10RM x 1.00

**Week-over-week progression (from Week 1 base, not previous week):**
- Week 1: base
- Week 2: Week1 x 1.05
- Week 3: Week1 x 1.075
- Week 4: Week1 x 1.10

**Deload weights:**
- Days 1-3 (or first half): Week 1 weight unchanged
- Days 4+ (or second half): Week1 x 0.50

### Functions

```
getBaseMultiplier(meso, isSupersetSecondary) -> number
getWeekMultiplier(week) -> number
getWeekWeight(tenRepMax, meso, week, isSupersetSecondary) -> number
getDeloadWeight(tenRepMax, meso, isSecondHalf) -> number
estimateTenRepMax(weight, reps) -> number  // Epley formula
```

### Set Calculation (Autoregulation Core)

```
getCurrentSets(slot, meso, week, ratings) -> number
```

Algorithm:
1. Start with `slot.baseSets[meso]`
2. For each subsequent week, find the rating given to `slot.pairedSlotId` for the previous week
3. Accumulate: Week 2 = Week 1 + rating, Week 3 = Week 2 + rating, etc.
4. Floor at 0 (exercise skipped if sets <= 0)

**Non-autoregulated slots** (legs): always return `baseSets[meso]`, ignore ratings.

**Superset secondaries**: inherit primary's set count.

**`pairedSlotId` is null**: slot has no autoregulation; sets stay at `baseSets[meso]` every week (same as non-autoregulated).

### Worked Example: Cross-Day Pairing

In N_A_4 (Arms-focus 4-day), Days 1 and 3 are paired, Days 2 and 4 are paired. Same muscle groups appear on both paired days:

```
Slot d1-01: Horizontal Triceps, Day 1, pairedSlotId = "d3-03" (Day 3 Triceps)
Slot d3-03: Triceps,            Day 3, pairedSlotId = "d1-01" (Day 1 Horizontal Triceps)
```

**Week 1:** User trains Day 1, does Horizontal Triceps (3 sets). Trains Day 3, does Triceps (3 sets). Rates Day 3 Triceps (slot d3-03) as +1 ("easy, not sore").

**Week 2:** `getCurrentSets(d1-01, "basic", 2, ratings)`:
1. Base sets = 3
2. Look up rating for pairedSlotId "d3-03" in Week 1 → found: +1
3. Week 2 sets = 3 + 1 = **4 sets**

Meanwhile, user trains Day 1 Week 2 (4 sets of Horizontal Triceps) and rates it as 0 ("manageable").

`getCurrentSets(d3-03, "basic", 2, ratings)`:
1. Base sets = 3
2. Look up rating for pairedSlotId "d1-01" in Week 1 → need Day 1 Week 1 rating. But Day 1 is the first training day of the meso, so no rating was collected. Missing rating = 0.
3. Week 2 sets = 3 + 0 = **3 sets** (unchanged)

**Week 3:** d1-01 looks at d3-03's Week 2 rating. d3-03 looks at d1-01's Week 2 rating (0). And so on.

**Key rule:** Each slot's rating controls its paired slot's set count in the next occurrence. The rating you give after training a muscle group adjusts how many sets you do for that same muscle group on its other training day.

### RIR Progression

| Week | RIR Target |
|------|-----------|
| 1 | 3/fail |
| 2 | 3/fail |
| 3 | 2/fail |
| 4 | 1/fail |
| Deload | half reps of Week 1 |

### Validation

```
validateFirstSetReps(reps, meso) -> "too-low" | "too-high" | "ok"
```

| Meso | Too Few | Too Many |
|------|---------|----------|
| Basic | <= 6 | >= 20 |
| Metabolite | <= 10 | >= 30 |
| Resensitization | <= 3 | >= 12 |

### Deload

```
getDeloadSets() -> 2  // always
getDeloadReps(week1Reps) -> Math.floor(reps / 2)  // per set
```

"week1Reps" = the user's actual logged reps from Week 1 of the current mesocycle for that exercise. Retrieved from `WorkoutSession.sets` in `workout-store.ts` by matching `programId`, `weekNumber: 1`, and `exerciseName`. If no Week 1 data exists (user started mid-meso or cleared history), fall back to the rep goal text (e.g. "3/fail" implies ~10 reps, so deload = 5).

### Mesocycle Helpers

```
getMesoWeeks(meso) -> 5 | 5 | 3
isDeloadWeek(meso, week) -> boolean
getNextMeso(current) -> RpMesoType | null
getMesoRestSeconds(meso) -> { min: number, max: number }
```

---

## RP Store (`rp-store.ts`)

localStorage CRUD, follows existing patterns (SSR guard, per-user keying).

**Storage key:** `mi_rp_state`

**Functions:**
- `getRpState(user)` / `saveRpState(user, state)` -- read/write RpProgramState
- `addRating(user, entry)` -- append to RpProgramState.ratings
- `clearRpState(user)` -- wipe on program switch

---

## RP Exercise Library (`rp-exercise-library.ts`)

Maps RP's 22 muscle categories to exercise names using canonical names from `exercise-library.ts`.

**Categories:** Abs, Biceps, Calves, Chest Isolation, Chest Isolation or Triceps, Front Delts, Glutes, Hamstrings Hip Hinge, Hamstrings Isolation, Horizontal Pull, Horizontal Push, Horizontal Triceps, Incline Push, Incline Push or Front Delts, Quads, Rear Delts, Rear or Side Delts, Side Delts, Traps, Triceps, Vertical Pull, Vertical Triceps

Exercises not in the current 67-exercise library (~100 new) get added to `exercise-library.ts` with proper primaryMuscle/secondaryMuscles mappings for volume tracking.

**All exercise names in `RP_CATEGORIES` must exactly match canonical names in `exercise-library.ts`.** This is critical for volume tracking. During implementation, each RP exercise must be cross-referenced against the existing library, using `findExercise()` for fuzzy matching where needed. Any new exercise added to `exercise-library.ts` becomes the canonical name used in `RP_CATEGORIES`.

---

## Template Data Files

One file per template:
- `rp-template-nf3.ts`
- `rp-template-nf4.ts`
- `rp-template-na4.ts`
- `rp-template-nc4.ts`

Each exports an `RpTemplate` with all slots, pairing relationships, and base sets extracted from the spreadsheet formulas. Pure data, no logic.

---

## Program Registry Integration

Four new entries in `PROGRAM_REGISTRY`:

```ts
{ id: "rp-nf3", name: "RP Full Body 3-Day", profile: "both", daysPerCycle: 3, cycleLength: 13, periodizationType: "auto-regulated", hasAutoRegulation: true, hasVolumeTracking: true }
{ id: "rp-nf4", name: "RP Full Body 4-Day", profile: "both", daysPerCycle: 4, cycleLength: 13, ... }
{ id: "rp-na4", name: "RP Arms-Focus 4-Day", profile: "both", daysPerCycle: 4, cycleLength: 13, ... }
{ id: "rp-nc4", name: "RP Chest/Back 4-Day", profile: "both", daysPerCycle: 4, cycleLength: 13, ... }
```

### `getExercisesForDay()` -- Keeping It Pure

The existing `getExercisesForDay(programId, dayNumber, weekNumber)` is a pure function. To avoid introducing a localStorage side-effect, RP programs use a **separate function**:

```ts
getRpExercisesForDay(templateId: string, dayNumber: number, rpState: RpProgramState): ProgramExercise[]
```

The caller (today-screen) reads `RpProgramState` from `rp-store` and passes it in. This keeps the engine testable without mocking localStorage.

The existing `getExercisesForDay()` returns an empty array for RP program IDs and is NOT modified to call localStorage. Today-screen detects RP programs via `programId.startsWith("rp-")` and calls `getRpExercisesForDay()` instead.

### Week Number Mapping

RP programs track week state in `RpProgramState.currentWeek` (meso-relative: 1-5 or 1-3), NOT in the global `StoredPrefs.currentWeek`. The global `currentWeek` is still incremented for display/history purposes but the RP engine ignores it. `getRpExercisesForDay()` reads `rpState.currentMeso` and `rpState.currentWeek` directly.

---

## New Screens

### Mesocycle Setup Screen (`rp-setup-screen.tsx`)

Appears when user first selects an RP program and at each mesocycle transition.

**Flow:**
1. Header: mesocycle name and description ("Mesocycle 1: Basic Hypertrophy")
2. Exercise slots grouped by day
3. Each slot: muscle category label, exercise dropdown (filtered by category), 10RM input
4. "Don't know your 10RM?" link opens estimation calculator (enter weight + reps, Epley formula)
5. On meso transitions: pre-fills from previous meso's selections
6. "Start Mesocycle" button saves state, enters today-screen

**Design in Stitch before building.**

**Routing:** Conditionally rendered inside the today-screen route. When `programId.startsWith("rp-")` and `getRpState()` returns null (no active meso), today-screen renders `<RpSetupScreen>` instead of the workout pipeline. After setup completes and saves state, today-screen re-renders with the normal workout view. No new route needed.

On mesocycle transitions: after completing the deload's last day and tapping "Set Up Next Mesocycle", the app calls `clearRpState()` for the current meso and renders `<RpSetupScreen>` with carry-forward data passed as props.

### Rating Input (inline on Today Screen)

After logging all sets for an autoregulated RP exercise:
- Three buttons: **Recovered** (+1), **Neutral** (0), **Struggling** (-1)
- One-line descriptions: "Not sore, reps easy" / "Sore, reps manageable" / "Very sore, reps hard"
- Only on autoregulated exercises (not legs)
- Only on days that accept ratings (not first day of meso, not deload)
- Saves immediately on tap

**Design in Stitch before building.**

---

## Today Screen Modifications (RP Programs)

- **Prescribed weight** displayed above weight input as a suggestion (not locked)
- **RIR target** badge next to rep goal (e.g. "3 RIR")
- **10RM warning** if first-set reps outside valid range -- tappable to adjust 10RM inline
- **Skipped exercise** state: greyed out card with "Skipped -- recovery needed" when sets <= 0
- **Mesocycle transition prompt** after completing deload's last day:
  - "Mesocycle N complete! Ready for [next phase]?"
  - "Set Up Next Mesocycle" button -> setup screen with carry-forward
  - After Meso 3: "Macrocycle complete!" -> fresh Meso 1 setup

---

## Stitch Design Reconciliation

Existing screens that diverged from their Stitch mockups will be brought in line as part of this work:

**Today Screen:** Match Stitch's stat cards (volume, timer, intensity), exercise card styling with image thumbnails, session insights sidebar at desktop, recovery protocol section.

**Process for all screens:**
1. Review existing Stitch designs if available
2. New RP screens designed in Stitch first
3. Build to match mockup faithfully
4. If a mockup element can't be implemented, flag it explicitly rather than silently dropping

---

## Edge Cases

**Sets drop to zero/negative:** Exercise shown greyed out with "Skipped -- recovery needed." Not hidden.

**10RM out of range:** Inline warning after first set with tap-to-adjust. User can update 10RM mid-workout.

**Missed workout:** No special handling. Missing ratings treated as 0 (no change). User picks up where they left off.

**Mid-mesocycle program switch:** `clearRpState()` wipes RP state cleanly. Called from the templates/program selection screen when the user switches away from an RP program. Add to the existing program-switch handler in `templates-screen.tsx` (or wherever program selection occurs): `if (oldProgramId.startsWith("rp-")) clearRpState(user)`.

**Bodyweight exercises:** 10RM input gets "Bodyweight exercise?" toggle. Field label changes to "10RM (bodyweight + added weight)." Prescribed weight displays "Add X lbs." Bodyweight stored in user prefs.

**Superset secondaries (Meso 2):** Inherit primary's set count and rating. Use 60% weight multiplier. `getRpExercisesForDay()` maps `RpExerciseSlot.supersetWith` to matching `supersetGroup` string values on the output `ProgramExercise` objects (e.g., both slots in a pair get `supersetGroup: "ss-1"`). Existing today-screen superset rendering handles the rest.

**Existing RecoveryRatingPrompt:** Disabled for RP programs. The existing post-session `RecoveryRatingPrompt` (per-muscle-group recovery ratings) does NOT appear when `programId.startsWith("rp-")`. RP's inline per-exercise rating system replaces it. The existing volume engine is not consulted for RP programs.

---

## Testing Strategy

### `rp-engine.test.ts` (Vitest, TDD)

- `getWeekWeight()` -- all meso/week combos against known 10RM
- `getCurrentSets()` -- all +1 (3->6), all -1 (3->0), mixed, no ratings, non-autoregulated slots
- `estimateTenRepMax()` -- Epley formula verification
- `validateFirstSetReps()` -- boundary cases per meso
- `getDeloadReps()` -- floor(reps/2) including odd numbers
- `isDeloadWeek()` -- correct identification per meso

### `rp-store.test.ts`

- Round-trip save/load of RpProgramState
- Rating accumulation
- Per-user isolation
- Clear state on program switch

### No E2E for this phase

New UI screens will iterate. Unit-test the engine, manually verify UI, add E2E once UX stabilizes.

### Existing tests must keep passing

`ProgramExercise` changes are additive (optional fields). No existing program affected.

---

## Files Created/Modified

### New files:
- `web/src/lib/rp-types.ts`
- `web/src/lib/rp-engine.ts`
- `web/src/lib/rp-store.ts`
- `web/src/lib/rp-exercise-library.ts`
- `web/src/lib/rp-template-nf3.ts`
- `web/src/lib/rp-template-nf4.ts`
- `web/src/lib/rp-template-na4.ts`
- `web/src/lib/rp-template-nc4.ts`
- `web/src/components/screens/rp-setup-screen.tsx`
- `web/src/lib/__tests__/rp-engine.test.ts`
- `web/src/lib/__tests__/rp-store.test.ts`

### Modified files:
- `web/src/lib/program-data.ts` -- add optional `prescribedWeight`, `rirTarget` to ProgramExercise
- `web/src/lib/program-registry.ts` -- register 4 RP templates in PROGRAM_REGISTRY, add `getRpExercisesForDay()` export
- `web/src/lib/exercise-library.ts` -- add ~100 new exercises for RP categories
- `web/src/components/screens/today-screen.tsx` -- RP detection branch (`programId.startsWith("rp-")`), QueueExercise type extension, prescribed weight display, RIR badge, inline rating input, skip state, meso transition prompt, setup screen conditional render, disable RecoveryRatingPrompt for RP
- `web/src/components/screens/today-screen.tsx` -- Stitch design reconciliation (stat cards, card styling, sidebar)
- `web/src/components/screens/templates-screen.tsx` (or equivalent) -- call `clearRpState()` when switching away from RP program
