# Exercise Library & Swap -- Design Spec

**Date:** 2026-03-31
**Status:** Draft

---

## Overview

Add a browsable exercise library to the app (S and A tier exercises, categorized by muscle group) with two key capabilities:
1. **Standalone library screen** -- browse, search, and add exercises to your routine
2. **Exercise swap from workout page** -- replace an exercise with another from the same muscle group, session-only or permanently

---

## 1. Exercise Library Data Expansion

### Type Changes

Add `tier` and `exrxUrl` fields to the existing `ExerciseDefinition` interface in `types.ts`:

```typescript
// Existing interface -- add two optional fields
export interface ExerciseDefinition {
  id: string;
  name: string;
  primaryMuscle: MuscleGroup;
  secondaryMuscles: { muscle: MuscleGroup; factor: number }[];
  type: ExerciseType;
  equipment: Equipment;
  tier?: "S" | "A";       // S or A tier; undefined for legacy program-only exercises
  exrxUrl?: string;        // Link to ExRx.net exercise page
}
```

The `Equipment` type is currently `"barbell" | "dumbbell" | "cable" | "machine" | "bodyweight" | "smith_machine"`. New tier list exercises like Pendulum Squat and Sissy Squat map to `"machine"` and `"bodyweight"` respectively -- no new equipment values needed. If an edge case arises during data entry, expand the union then.

### Data Expansion

- Source: `docs/nippard-tier-list.md` (S and A tier exercises from Nippard + Notion guide)
- Existing exercises that appear on the tier list get their `tier` assigned
- New exercises from the tier list are added with full definitions (id, name, primaryMuscle, secondaryMuscles, type, equipment, tier)
- Existing exercises NOT on the tier list keep `tier: undefined` -- they remain for program compatibility but won't appear in the browsable library
- `exrxUrl` populated for as many exercises as possible; left undefined where no matching ExRx page exists
- Estimated final count: ~120-130 exercises
- `findExercise()` and `getExercisesForMuscle()` unchanged

### Muscle Group Mapping

The tier list has some groups that need mapping to existing `MuscleGroup` values:

| Tier List Group | MuscleGroup Value | Notes |
|-----------------|-------------------|-------|
| Back -- Lats (Width) | `back` | Pulldowns, pull-ups, pullovers |
| Back -- Upper Back (Thickness) | `back` | Rows |
| Shoulders -- Side Delts | `side_delts` | |
| Shoulders -- Rear Delts | `rear_delts` | |
| Shoulders -- Front Delts | `front_delts` | |
| Abs / Core | `abs` | |
| Forearms / Grip | `forearms` | |

All other groups map 1:1 (quads, hamstrings, glutes, chest, traps, biceps, triceps, calves).

`neck` exists in the MuscleGroup type and has two exercises in the library (Neck Curl, Neck Flexion) but neither source has neck exercises tiered. These stay as-is with `tier: undefined` -- they won't appear in the browsable library but remain for program compatibility.

---

## 2. Exercise Substitution Store

New file: `web/src/lib/exercise-substitutions.ts`

### Session Substitutions

Stored on the `WorkoutSession` object. New optional field:

```typescript
// In WorkoutSession (workout-store.ts)
substitutions?: Record<string, string>;  // originalExerciseName -> replacementExerciseName
```

Lifecycle:
- Created when user swaps an exercise and chooses "Just this session"
- Read by `queueExercises` memo to render replacement
- Logged sets use the replacement exercise name (history reflects what was actually performed)
- On session completion: the `substitutions` field persists on the archived session object in `mi_sessions` (for audit/history), but is not read by future sessions

### Permanent Substitutions

Stored in localStorage under key `mi_substitutions`, scoped per profile:

```typescript
type PermanentSubstitutions = Record<HouseholdUser, SubstitutionMap>;
type SubstitutionMap = Record<string, string>;  // compositeKey -> replacementExerciseName
// compositeKey format: "programId:dayNumber:originalExerciseName"
// Example: "mass-impact:3:Bench Press (Barbell)" -> "Dip (Weighted)"
// Known limitation: if a program reorganizes which exercises appear on which day,
// permanent subs keyed to the old day number won't match. Acceptable for v1.
```

CRUD functions:
- `getPermanentSub(user, programId, day, exerciseName): string | undefined`
- `setPermanentSub(user, programId, day, exerciseName, replacement): void`
- `clearPermanentSub(user, programId, day, exerciseName): void`
- `getAllPermanentSubs(user): SubstitutionMap`

### Resolution Order in queueExercises

Substitution resolution happens at the top of the `queueExercises` memo in `today-screen.tsx`, **before** the override lookup. For each `ProgramExercise` in the `exercises` array:

1. Read `exercise.name` (the original template name)
2. Check `session.substitutions[exercise.name]` for a session-level swap
3. If not found, check `getPermanentSub(user, programId, day, exercise.name)` for a permanent swap
4. If not found, use `exercise.name` as-is
5. The resolved name becomes `resolvedName` -- used for all downstream lookups

**Key naming rules:**
- `session.substitutions` is keyed by the **original** exercise name (the template name)
- `session.overrides` is keyed by the **resolved** exercise name (after substitution). This means if you swap "Bench Press" to "Dips" and then override sets/reps, the override keys on "Dips".
- `logSet()` uses the **resolved** name -- history shows what you actually did
- `getLastPerformance()` uses the **resolved** name -- shows your history with the exercise you're actually performing
- `QueueExercise.name` is set to the **resolved** name

When a substitution is active:
- The queue card renders the replacement exercise name
- A visual indicator shows it's swapped (small swap icon or accent-colored dot)
- The original exercise name is carried as `QueueExercise.originalName?: string` for revert UI and "Replaces: X" display
- The override system (sets/reps) works on the resolved name

### Reverting

- **Session subs:** Die with the session, no revert needed
- **Permanent subs:** The swap icon on the exercise card shows a "Revert to [original]" option when a permanent sub is active. Calls `clearPermanentSub()`.

---

## 3. Exercise Picker Modal

Reusable component: `web/src/components/exercise-picker-modal.tsx`

Uses the existing `Modal` component as its shell.

### Props

```typescript
type ExercisePickerModalProps = {
  muscleGroup?: MuscleGroup;   // Pre-filter (set when swapping from workout)
  onSelect: (exercise: ExerciseDefinition) => void;
  onClose: () => void;
  title?: string;              // Override modal title (default: "{MuscleGroup} Exercises" or "All Exercises")
};
```

### Layout

- **Search bar** at top -- filters by exercise name (case-insensitive substring match)
- **S Tier section** -- header "S TIER", then exercises alphabetically
- **A Tier section** -- header "A TIER", then exercises alphabetically, visually distinct (subtler styling or separator)
- **Each exercise row:** name, equipment tag (pill: "barbell", "cable", "machine", etc.), type tag (pill: "compound", "isolation"), ExRx link icon (if exrxUrl exists, opens in new tab)
- **Tapping a row** calls `onSelect(exercise)` -- the modal doesn't handle post-selection logic

### Filtering

- If `muscleGroup` is provided: only show exercises matching that primary muscle
- If not provided: show all tiered exercises, grouped by muscle group
- Search bar further filters within whatever is shown

### Styling

- Consistent with existing modal styling (`.modal-panel`, `.modal-header`, etc.)
- Exercise rows: similar density to queue cards but simpler (no progress rings, no set counts)
- Equipment/type pills: small, muted, inline after the exercise name
- ExRx icon: small external-link icon, right-aligned, opens link without closing modal

---

## 4. Library Screen

New file: `web/src/components/screens/library-screen.tsx`
New route: `web/src/app/library/page.tsx`

### Layout

- **Page title:** "EXERCISE LIBRARY" (Teko font, matching other screen titles)
- **Muscle group sections** as collapsible headers, all expanded by default
- Section order: Chest, Back, Quads, Hamstrings, Glutes, Side Delts, Rear Delts, Front Delts, Biceps, Triceps, Traps, Calves, Abs, Forearms
- Within each section: S Tier block (with header), then A Tier block (with header)
- Clear visual separation between tiers (divider or background shade difference)

### Exercise Row

Each exercise displays:
- Exercise name
- Equipment tag (pill)
- Type tag (pill)
- ExRx link icon (if URL exists)
- **"Add to Routine" button** (small, ghost/outline style)

### "Add to Routine" Flow

Tapping "Add to Routine" triggers a two-step flow:

1. **Day picker:** "Which day?" -- lists the active program's days (e.g., "Day 1 - Pull", "Day 2 - Push", etc.)
2. **Action picker:** "Add to end" or "Replace an exercise"
   - "Add to end": Appends the exercise to that day's template. For Mass Impact, writes directly to program store. For registry-based programs, stores in localStorage under `mi_additions` scoped per profile:
     ```typescript
     type ProgramAdditions = Record<HouseholdUser, AdditionsMap>;
     type AdditionsMap = Record<string, ProgramExercise[]>;  // compositeKey -> appended exercises
     // compositeKey format: "programId:dayNumber"
     // Example: "ravage:3" -> [{ order: 99, orderLabel: "7", name: "Spider Curl", ... }]
     ```
     CRUD: `getAdditions(user, programId, day): ProgramExercise[]`, `addExerciseToDay(user, programId, day, exercise): void`, `removeAddition(user, programId, day, exerciseName): void`. The `getExercisesForDay()` call in `today-screen.tsx` appends these after the template exercises.
   - "Replace an exercise": Shows that day's current exercises, user taps one to replace. Uses the permanent substitution system from Section 2.

### No Profile Isolation

The library data is the same for His and Hers. The "Add to Routine" action writes to the active profile's program data.

---

## 5. Workout Page -- Exercise Swap

### Trigger

New swap icon on each `ExerciseQueueCard`. Not a long-press (too hidden) -- a visible icon.

- Small swap/arrows icon positioned on the exercise card (right side, near the progress ring area or as a secondary action)
- Only visible when no active workout session, OR when the exercise is not currently being logged (avoid mid-set confusion)

Actually -- the swap should be available at all times on the queue cards. Users should be able to swap before or during a workout.

### Flow

1. User taps swap icon on exercise card (e.g., "Single Arm Row (Cable)")
2. `ExercisePickerModal` opens, pre-filtered to that exercise's primary muscle group (e.g., `back`)
3. User selects replacement exercise
4. Prompt appears: **"Just this session?"** / **"All future sessions?"**
   - "Just this session": Writes to `session.substitutions` (only if a session is active; if no session, this option is hidden and it defaults to permanent)
   - "All future sessions": Writes to permanent substitution store
5. Queue card updates to show replacement exercise name with swap indicator
6. If the exercise had logged sets under the old name, those sets remain attributed to the old exercise (no retroactive rename)

### Visual Indicator

When an exercise has been swapped:
- Small swap icon or accent dot next to the exercise name
- Tooltip or subtitle showing "Replaces: [original name]" (optional, could be a tap-to-reveal)

### Revert

When tapping the swap icon on an already-swapped exercise:
- Show "Revert to [original exercise name]" option at the top of the picker
- Tapping revert clears the substitution (permanent or session, whichever is active)
- Then shows the normal picker below in case they want to swap to something else

---

## 6. Navigation Update

### navItems Array (app-shell.tsx)

Both desktop side rail and mobile bottom nav render from the same `navItems` array. Add a 6th entry:

```typescript
{ href: "/library", label: "Library", short: "LB" }
```

Placed after Templates in the array.

### Mobile Nav at 6 Items

Five items is already snug at 320px. With 6 items, reduce `.mobile-link-label` font-size from current value to `0.6rem` and reduce `.mobile-link` min-width to allow even distribution. Test at 320px to confirm nothing wraps.

### Active State

Same as other nav items: `--accent-primary` border/highlight when on `/library` route.

---

## 7. Files Changed / Created

### New Files
- `web/src/lib/exercise-substitutions.ts` -- substitution store (session + permanent CRUD)
- `web/src/components/exercise-picker-modal.tsx` -- reusable picker modal
- `web/src/components/screens/library-screen.tsx` -- standalone library page
- `web/src/app/library/page.tsx` -- Next.js route

### Modified Files
- `web/src/lib/types.ts` -- add `tier` and `exrxUrl` to ExerciseDefinition
- `web/src/lib/exercise-library.ts` -- expand with S/A tier exercises, assign tiers, add exrxUrls
- `web/src/lib/workout-store.ts` -- add `substitutions` field to WorkoutSession type
- `web/src/components/screens/today-screen.tsx` -- integrate substitution resolution in queueExercises, add swap icon to exercise cards
- `web/src/components/exercise-queue-card.tsx` -- add swap icon, swap indicator
- `web/src/components/app-shell.tsx` -- add Library nav item
- `web/src/app/globals.css` -- styles for library screen, picker modal, exercise rows, tier headers

---

## 8. Out of Scope

- Exercise search on the library screen (the picker has search; the library screen uses collapsible sections instead)
- Custom user-created exercises (all exercises come from the curated library)
- Exercise notes or personal bests on the library screen (that's history/progress territory)
- Reordering exercises within a day (existing feature gap, separate effort)
- Bulk swap (swap one exercise at a time)
