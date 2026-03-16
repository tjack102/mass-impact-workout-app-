# Hypertrophy Hub Implementation Plan

> **For agentic workers:** REQUIRED: Use superpowers:subagent-driven-development (if subagents available) or superpowers:executing-plans to implement this plan. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Extend the Mass Impact workout app into a multi-program hypertrophy training hub with RP-style volume auto-regulation.

**Architecture:** Layered extension — new modules alongside existing code. All programs adapted to the existing `ProgramExercise` type at render time via `program-registry.ts`. Volume engine is pure functions with no side effects; all state in localStorage. No backend.

**Tech Stack:** Next.js 16.1.6, React 19.2.3, TypeScript 5, Tailwind CSS 4, localStorage, inline SVG charts. No test framework exists — install vitest for pure function tests (volume engine).

**Spec:** `docs/superpowers/specs/2026-03-16-hypertrophy-hub-design.md`

---

## File Structure

### New Files

```
web/src/lib/
  types.ts                    # Shared types: MuscleGroup, ExerciseType, Equipment, ExerciseDefinition, ProgramMeta, VolumeLandmarks, MesocycleState, RecoveryRating
  exercise-library.ts         # ~80 ExerciseDefinition entries + lookup helpers
  program-data-ravage.ts      # RAVAGE 10-week program data (RavageProgram, day templates)
  program-data-hers.ts        # 3 Hers program templates (LULUL, PPLPP, Custom)
  program-registry.ts         # getExercisesForDay(), getAvailablePrograms(), getDayTitle() — adapter layer
  volume-engine.ts            # Pure functions: calculateWeeklyVolume, getVolumeRecommendation, etc.
  volume-store.ts             # localStorage CRUD for recovery ratings, meso state, volume landmarks

web/src/components/
  program-selector.tsx        # Dropdown for switching programs
  recovery-rating-prompt.tsx  # Post-workout muscle group rating (-2 to +2)
  volume-bar.tsx              # Horizontal gauge with MEV/MAV/MRV markers
  sparkline.tsx               # Inline SVG sparkline for trends

web/src/components/screens/
  volume-screen.tsx           # /volume route — volume dashboard

web/src/app/volume/
  page.tsx                    # Next.js route for volume dashboard
```

### Modified Files

```
web/src/lib/program-data.ts          # Export types, add programId to Program
web/src/lib/workout-store.ts         # Add programId to WorkoutSession, migration logic
web/src/lib/household-profiles.ts    # Add selectedProgram to ProfilePrefs
web/src/components/app-shell.tsx     # Add Volume nav tab, program selector
web/src/components/screens/today-screen.tsx   # Program-aware queue, supersets, recovery prompt, double progression, manual override
web/src/components/screens/planner-screen.tsx # Cycle-based display, deload badges
web/src/components/screens/settings-screen.tsx # Meso length, landmark editor
```

---

## Chunk 1: Foundation

### Task 1: Shared Types

**Files:**
- Create: `web/src/lib/types.ts`

All shared types live in one file. Existing types in `program-data.ts` stay there — new types go here.

- [ ] **Step 1: Create types.ts with all new types**

```typescript
// web/src/lib/types.ts

export type MuscleGroup =
  | "back" | "chest" | "side_delts" | "rear_delts" | "front_delts"
  | "biceps" | "triceps" | "quads" | "hamstrings" | "glutes"
  | "traps" | "calves" | "abs" | "forearms" | "neck";

export type ExerciseType = "stretch" | "compound" | "isolation";

export type Equipment = "barbell" | "dumbbell" | "cable" | "machine" | "bodyweight" | "smith_machine";

export interface ExerciseDefinition {
  id: string;
  name: string;
  primaryMuscle: MuscleGroup;
  secondaryMuscles: { muscle: MuscleGroup; factor: number }[];
  type: ExerciseType;
  equipment: Equipment;
}

export interface ProgramMeta {
  id: string;
  name: string;
  profile: "his" | "hers" | "both";
  daysPerCycle: number;
  cycleLength: number;
  periodizationType: "block" | "double-progression" | "auto-regulated";
  hasAutoRegulation: boolean;
  hasVolumeTracking: boolean;
}

export type VolumeLandmarks = Record<MuscleGroup, {
  mev: number;
  mavLow: number;
  mavHigh: number;
  mrvLow: number;
  mrvHigh: number;
}>;

export interface MesocycleState {
  mesoNumber: number;
  weekInMeso: number;
  mesoLength: number;
  startDate: number;
  weeklyTargets: Partial<Record<MuscleGroup, number>>;
}

export interface RecoveryRating {
  date: number;
  sessionId: string;
  ratings: Partial<Record<MuscleGroup, number>>;
}

// Muscle groups that have volume landmarks (excludes front_delts, neck, forearms)
export const TRACKED_MUSCLES: MuscleGroup[] = [
  "back", "chest", "side_delts", "rear_delts", "biceps", "triceps",
  "quads", "hamstrings", "glutes", "traps", "calves", "abs",
];
```

- [ ] **Step 2: Verify build**

Run: `cd web && npx next build`
Expected: Build succeeds (types.ts is not imported yet, so no impact)

- [ ] **Step 3: Commit**

```bash
git add web/src/lib/types.ts
git commit -m "feat: add shared types for hypertrophy hub extension"
```

---

### Task 2: Exercise Library

**Files:**
- Create: `web/src/lib/exercise-library.ts`

~80 pre-loaded exercises with muscle group tags, exercise type, equipment, and secondary muscle mappings. Includes a lookup function by name.

- [ ] **Step 1: Create exercise-library.ts with all exercise definitions**

The file exports:
- `EXERCISE_LIBRARY: ExerciseDefinition[]` — the full catalog
- `findExercise(name: string): ExerciseDefinition | undefined` — case-insensitive name lookup
- `getExercisesForMuscle(muscle: MuscleGroup): ExerciseDefinition[]` — filter by primary muscle

Each entry must include `secondaryMuscles` with correct factors. Key mappings from the spec:
- Rows/pulldowns → biceps 0.5
- Pressing → triceps 0.5, front_delts 0.5
- Squats/leg press → glutes 0.5
- RDLs → glutes 0.5
- Bulgarian split squat → glutes 0.5
- Hip thrust → hamstrings 0.5

Include ALL exercises referenced in:
- RAVAGE program (Day 1-6): Smith Machine Hack Squat, Back Extension (Weighted), Walking Lunge, Seated Hamstring Curl, Close Grip Larsen Press, Narrow Neutral Pulldown, Smith Reverse Grip Bench, Wide Overhand Pulldown, Cable Crossover, 1 Arm Machine Row, Standing Cable Pullover, Hammer Curl, Tricep Pushdown, Incline Dumbbell Curl, Standing Overhead Extension, Cable Lateral Raise, Upright Row (Barbell), Back Squat, Romanian Deadlift, Hip Thrust, Leg Extension, Bench Press (Barbell), Wide Neutral Pulldown, Chest Press (Machine), Helms Row, Seated Shoulder Press (Dumbbell), Seated Row (Cable), Leaning Overhead Extension, Bicep Curl (Barbell), Lateral Raise (Machine), Lu Lateral Raise, Cable Rear Delt, Neck Flexion, Wrist Flexion/Extension
- Hers programs: Barbell Squat, B-Stance Hip Thrust, Lying Leg Curl, Cable Pull-Through, Standing Calf Raise, Lat Pulldown, Seated Cable Row, Rear Delt Cable Fly, Incline DB Curl, Overhead Cable Tricep Extension, Face Pull, Bulgarian Split Squat, Leg Press, Hip Thrust (Barbell), Seated Leg Curl, Seated Calf Raise, DB Shoulder Press, Single Arm Cable Row, Cable Crunch, Walking Lunge (DB), Cable Kickback, Glute-Focused Back Extension, Step-Up (High Box), Nordic Curl, Incline DB Fly, Lu Lateral Raise, Cable Pullover, Cable Crossover, Tricep Pushdown, Wide Overhand Pulldown
- Mass Impact exercises (read from program-data.ts at implementation time)

Where an exercise appears with slight name variations (e.g., "Hip Thrust" vs "Hip Thrust (Barbell)"), use the most specific name. The `findExercise` lookup should be fuzzy enough to match "Hip Thrust" to "Hip Thrust (Barbell)" by checking if the query is a prefix of the stored name.

- [ ] **Step 2: Verify build**

Run: `cd web && npx next build`
Expected: Build succeeds

- [ ] **Step 3: Commit**

```bash
git add web/src/lib/exercise-library.ts
git commit -m "feat: add exercise library with ~80 tagged exercises"
```

---

### Task 3: Program Registry

**Files:**
- Create: `web/src/lib/program-registry.ts`
- Modify: `web/src/lib/program-data.ts` (export types, no other changes yet)

The registry is the adapter layer. It maps program IDs to their data sources and adapts internal formats to the canonical `ProgramExercise` type.

- [ ] **Step 1: Verify types are already exported from program-data.ts**

Confirm that `ExerciseSet`, `ProgramExercise`, `ProgramDay`, `ProgramWeek`, `Program`, `formatScheme`, `getTotalSets`, `getDefaultRestSeconds`, `getRestSecondsForExercise` are already exported from `web/src/lib/program-data.ts`. They should be — no changes needed. Also export `getDayForWeek` if it isn't already, since the registry needs it to serve Mass Impact exercises.

- [ ] **Step 2: Create program-registry.ts**

Exports:
```typescript
import type { ProgramExercise, ProgramDay } from "./program-data";
import type { ProgramMeta, ExerciseDefinition } from "./types";
import type { HouseholdUser } from "./household-profiles";

// Program metadata for all programs
export const PROGRAM_REGISTRY: ProgramMeta[] = [
  { id: "mass-impact", name: "Mass Impact", profile: "his", daysPerCycle: 5, cycleLength: 12, periodizationType: "block", hasAutoRegulation: false, hasVolumeTracking: true },
  { id: "ravage", name: "RAVAGE", profile: "his", daysPerCycle: 6, cycleLength: 10, periodizationType: "double-progression", hasAutoRegulation: true, hasVolumeTracking: true },
  { id: "hers-lulul", name: "LULUL (Glute Emphasis)", profile: "hers", daysPerCycle: 5, cycleLength: 0, periodizationType: "auto-regulated", hasAutoRegulation: true, hasVolumeTracking: true },
  { id: "hers-pplpp", name: "PPLPP", profile: "hers", daysPerCycle: 5, cycleLength: 0, periodizationType: "auto-regulated", hasAutoRegulation: true, hasVolumeTracking: true },
  { id: "hers-custom", name: "Custom Glute-Emphasis", profile: "hers", daysPerCycle: 5, cycleLength: 0, periodizationType: "auto-regulated", hasAutoRegulation: true, hasVolumeTracking: true },
];

// Get programs available for a profile
export function getAvailablePrograms(profile: HouseholdUser): ProgramMeta[] {
  return PROGRAM_REGISTRY.filter(p => p.profile === profile || p.profile === "both");
}

// Get program metadata by ID
export function getProgramMeta(programId: string): ProgramMeta | undefined {
  return PROGRAM_REGISTRY.find(p => p.id === programId);
}

// Get exercises for a specific program/day/week, adapted to ProgramExercise[]
// ALL programs return ProgramExercise[] — uniform interface for today-screen.tsx
export function getExercisesForDay(programId: string, dayNumber: number, weekNumber: number): ProgramExercise[] {
  if (programId === "mass-impact") {
    // Delegate to existing getDayForWeek() from program-data.ts
    const day = getDayForWeek(weekNumber, dayNumber);
    return day?.exercises ?? [];
  }
  // RAVAGE: adapt from RAVAGE_PROGRAM data (implemented in Task 7)
  // Hers: adapt from Hers template data (implemented in Tasks 14-16)
  return []; // stub — filled in by later tasks
}

// Get day title for display
export function getDayTitle(programId: string, dayNumber: number): string {
  // Returns "Legs A", "Torso A", etc. Stub returns "Day {n}" for now.
}

// Get total days in cycle for a program
export function getDaysInCycle(programId: string): number {
  return getProgramMeta(programId)?.daysPerCycle ?? 5;
}
```

For Mass Impact, `getExercisesForDay` delegates to the existing `getDayForWeek()` function, maintaining the uniform `ProgramExercise[]` return type for all programs. No special-casing needed in callers.

RAVAGE and Hers adapters will be implemented in later tasks. For now, their branches return empty arrays.

- [ ] **Step 3: Verify build**

Run: `cd web && npx next build`
Expected: Build succeeds

- [ ] **Step 4: Commit**

```bash
git add web/src/lib/program-registry.ts web/src/lib/program-data.ts
git commit -m "feat: add program registry with adapter pattern"
```

---

### Task 4: Workout Store Extensions

**Files:**
- Modify: `web/src/lib/workout-store.ts`
- Modify: `web/src/lib/household-profiles.ts`

Add `programId` to `WorkoutSession`, add `selectedProgram` to `ProfilePrefs`, add migration logic.

- [ ] **Step 1: Add selectedProgram to ProfilePrefs**

In `web/src/lib/household-profiles.ts`:
1. Add `selectedProgram?: string` to the `ProfilePrefs` type.
2. Update the default prefs to include `selectedProgram: "mass-impact"` for "his" and `selectedProgram: "hers-lulul"` for "hers".
3. Update `sanitizeProfilePrefs()` to preserve the `selectedProgram` field (currently it constructs a new object with only `currentWeek` and `currentDay`, which would strip `selectedProgram` on load). Add `selectedProgram: raw.selectedProgram || defaultForUser` to the sanitized output.
4. Similarly update `parseStoredPrefs()` if it also strips unknown fields.

- [ ] **Step 2: Add programId to WorkoutSession**

In `web/src/lib/workout-store.ts`, add `programId: string` to the `WorkoutSession` type.

- [ ] **Step 3: Update startSession to accept and store programId**

Modify `startSession` to accept a `programId` parameter (default `"mass-impact"`). New ID format: `{programId}-w{weekNumber}-d{dayNumber}-${Date.now()}`. Store `programId` in the session object. Existing callers in `today-screen.tsx` don't pass `programId` yet — they'll use the default `"mass-impact"`, which is correct for now. Callers will be updated in a later chunk when `today-screen.tsx` becomes program-aware.

- [ ] **Step 4: Add migration logic**

Add a `migrateSessionData()` function. It must be guarded with `if (typeof window === "undefined") return;` at the top (Next.js SSR safety — localStorage is not available on the server). Call it lazily on first client-side access (e.g., inside `getAllSessions()` and `getActiveSession()`) rather than at module load time.

Logic: reads existing sessions from `mi_sessions`, checks each session for `programId` — if missing, backfills with `"mass-impact"`. Writes back to localStorage only if changes were made. Also migrates `mi_active_session` the same way. Use a module-level `let migrated = false` flag to run only once per page load.

- [ ] **Step 5: Verify build**

Run: `cd web && npx next build`
Expected: Build succeeds. Existing functionality unchanged (migration adds programId silently).

- [ ] **Step 6: Commit**

```bash
git add web/src/lib/workout-store.ts web/src/lib/household-profiles.ts
git commit -m "feat: add programId to workout sessions with migration"
```

---

### Task 5: Program Selector Component + App Shell Integration

**Files:**
- Create: `web/src/components/program-selector.tsx`
- Modify: `web/src/components/app-shell.tsx`

- [ ] **Step 1: Create program-selector.tsx**

A dropdown that shows available programs for the active profile. On change, updates `selectedProgram` in profile prefs via `savePrefs()`.

```typescript
// Props:
interface ProgramSelectorProps {
  activeUser: HouseholdUser;
}
```

Reads current `selectedProgram` from profile prefs via `getPrefs()` in `household-profiles.ts`. Calls `getAvailablePrograms(activeUser)` to populate options. On change, updates the profile's `selectedProgram` by reading the full stored prefs from localStorage (`mi_prefs`), updating the `profiles[activeUser].selectedProgram` field, and writing back. Then forces a remount by calling `window.location.reload()` (simplest approach — same pattern as profile toggle).

Note: `savePrefs()` in `workout-store.ts` operates on `UserPrefs` (activeUser, currentWeek, currentDay), NOT on `ProfilePrefs`. The program selector needs to update `ProfilePrefs` directly in the `mi_prefs` localStorage structure. Add a `updateProfilePref(user, key, value)` helper to `household-profiles.ts` for this, or read/write the `mi_prefs` JSON directly.

Style: dropdown with `var(--bg-2)` background, `var(--border)` border, `var(--text-0)` text, `var(--radius-sm)` corners. Font: `var(--font-ui)`. Matches existing settings dropdown style.

- [ ] **Step 2: Add program selector to app-shell.tsx**

Add `<ProgramSelector>` to the sidebar/header area, below the profile toggle. Import `ProgramSelector` and render it with `activeUser` prop.

- [ ] **Step 3: Add Volume nav tab to app-shell.tsx**

Add `{ href: "/volume", label: "Volume", short: "VL" }` to the `navItems` array, inserted between Progress and Templates (index 3).

- [ ] **Step 4: Verify build and test manually**

Run: `cd web && npx next build`
Expected: Build succeeds. The Volume tab appears in nav. Program selector shows available programs for the active profile.

- [ ] **Step 5: Commit**

```bash
git add web/src/components/program-selector.tsx web/src/components/app-shell.tsx
git commit -m "feat: add program selector and Volume nav tab"
```

---

### Task 6: Volume Route Placeholder

**Files:**
- Create: `web/src/app/volume/page.tsx`
- Create: `web/src/components/screens/volume-screen.tsx`

- [ ] **Step 1: Create placeholder volume-screen.tsx**

A minimal "use client" component that renders:
```tsx
<div className="screen-container">
  <h2 style={{ fontFamily: "var(--font-display)", color: "var(--text-0)" }}>
    Volume Dashboard
  </h2>
  <p style={{ color: "var(--text-1)" }}>Coming soon — volume tracking across all programs.</p>
</div>
```

- [ ] **Step 2: Create volume route page.tsx**

```tsx
import VolumeScreen from "@/components/screens/volume-screen";
export default function VolumePage() { return <VolumeScreen />; }
```

- [ ] **Step 3: Verify build and navigation**

Run: `cd web && npx next build`
Expected: Build succeeds. Navigating to /volume shows the placeholder. The Volume nav tab links to it.

- [ ] **Step 4: Commit**

```bash
git add web/src/app/volume/page.tsx web/src/components/screens/volume-screen.tsx
git commit -m "feat: add placeholder volume dashboard route"
```

---

End of Chunk 1.

---

## Chunk 2: RAVAGE Program

### Task 7: RAVAGE Program Data

**Files:**
- Create: `web/src/lib/program-data-ravage.ts`
- Modify: `web/src/lib/program-registry.ts` (wire up RAVAGE adapter)

- [ ] **Step 1: Create program-data-ravage.ts**

Define the RAVAGE program using internal types:

```typescript
export interface RavageExercise {
  orderLabel: string;
  name: string;
  setGroups: { sets: number; reps: string }[];  // matches ProgramExercise shape — supports per-set rep ranges
  rpe?: string;
  supersetGroup?: string;
}

export interface RavageDayTemplate {
  dayNumber: number;
  title: string;
  exercises: RavageExercise[];
}

export interface RavageProgram {
  id: "ravage";
  weeks: { weekNumber: number; isDeload: boolean }[];
  dayTemplates: RavageDayTemplate[];
}
```

Using `setGroups` array (same shape as `ProgramExercise`) instead of flat `sets`/`repRange` so exercises with different rep ranges per set are represented accurately. Example: Smith Machine Hack Squat → `setGroups: [{ sets: 1, reps: "5-10" }, { sets: 1, reps: "10-15" }]`. Most exercises have a single entry like `setGroups: [{ sets: 2, reps: "8-12" }]`.

Populate `RAVAGE_PROGRAM` constant with all 6 day templates from the spec:
- Day 1: Legs A (4 exercises)
- Day 2: Torso A (7 exercises, supersets 1/2/3)
- Day 3: Bro A (6 exercises, supersets 1/2)
- Day 4: Legs B (5 exercises, superset 4)
- Day 5: Torso B (6 exercises, supersets 1/2/3)
- Day 6: Bro B (9 exercises, supersets 1/2/6)

Weeks array: weeks 1-10, with `isDeload: true` for weeks 5 and 10.

Exercise names MUST exactly match the names in `exercise-library.ts` from Task 2.

Export `RAVAGE_PROGRAM` and a helper `getRavageDayTemplate(dayNumber: number): RavageDayTemplate`.

- [ ] **Step 2: Wire RAVAGE adapter in program-registry.ts**

In `getExercisesForDay()`, add the RAVAGE branch:

```typescript
if (programId === "ravage") {
  const template = getRavageDayTemplate(dayNumber);
  if (!template) return [];
  const isDeload = RAVAGE_PROGRAM.weeks.find(w => w.weekNumber === weekNumber)?.isDeload ?? false;
  return template.exercises.map((ex, i) => {
    const setGroups = isDeload
      ? ex.setGroups.map(sg => ({ ...sg, sets: 1 }))  // deload: 1 set each
      : ex.setGroups;
    return {
      order: i + 1,
      orderLabel: ex.orderLabel,
      name: ex.name,
      setGroups,
      restSeconds: getDefaultRestSeconds(ex.name),
      supersetGroup: ex.supersetGroup,
    } satisfies ProgramExercise;
  });
}
```

Since `RavageExercise.setGroups` matches `ProgramExercise.setGroups` in shape, the adapter is a direct mapping. For deload weeks, all set groups get `sets: 1`.

Also implement `getDayTitle()` for RAVAGE by looking up the template title.

- [ ] **Step 3: Verify build**

Run: `cd web && npx next build`
Expected: Build succeeds. Selecting RAVAGE in program selector + navigating to Today should show empty queue (today-screen.tsx not yet program-aware).

- [ ] **Step 4: Commit**

```bash
git add web/src/lib/program-data-ravage.ts web/src/lib/program-registry.ts
git commit -m "feat: add RAVAGE program data and registry adapter"
```

---

### Task 8: Today Screen — Program-Aware Queue

**Files:**
- Modify: `web/src/components/screens/today-screen.tsx`

Make the today screen load exercises from the program registry instead of always using Mass Impact.

- [ ] **Step 1: Read selectedProgram from profile prefs**

At the top of the component, read `selectedProgram` from profile prefs (from `household-profiles.ts`). Import `getExercisesForDay`, `getDayTitle`, `getDaysInCycle`, `getProgramMeta` from `program-registry.ts`.

- [ ] **Step 2: Replace exercise loading with registry call**

Currently the queue builds from `getProgramDay(program, prefs.currentWeek, prefs.currentDay)`. Replace with:

```typescript
const programId = selectedProgram ?? "mass-impact";
const exercises = getExercisesForDay(programId, prefs.currentDay, prefs.currentWeek);
```

Build the `queueExercises` array from this `exercises` result instead of `programDay.exercises`. The mapping to `QueueExercise` stays the same since both paths produce `ProgramExercise[]`.

For Mass Impact, the existing `program-store.ts` custom program path should still be used if the user has edited their template. Add logic: if `programId === "mass-impact"`, use `getProgramDay()` from `program-store.ts` (preserves user template edits). Otherwise use `getExercisesForDay()` from registry.

- [ ] **Step 3: Update startSession call**

Pass `programId` to `startSession(weekNumber, dayNumber, programId)`.

- [ ] **Step 4: Make shiftWeekDay and clampDayPrefs program-aware**

The existing `shiftWeekDay` function (around line 92) hardcodes `day > 5` and `week >= 12`. The existing `clampDayPrefs` (around line 107) hardcodes `Math.min(12, ...)` for weeks and `Math.min(5, ...)` for days. Update both:

```typescript
const daysPerCycle = getDaysInCycle(programId);
const totalWeeks = getProgramMeta(programId)?.cycleLength || 52; // 0 = ongoing, cap at 52
```

- `shiftWeekDay`: use `daysPerCycle` instead of hardcoded 5 for day wrapping, `totalWeeks` instead of 12 for week wrapping.
- `clampDayPrefs`: use `Math.min(totalWeeks, ...)` and `Math.min(daysPerCycle, ...)`.

- [ ] **Step 5: Update week and day dropdowns**

The week dropdown currently iterates `program.weeks` (a Mass Impact `ProgramWeek[]` array). Replace with a generic loop `1..totalWeeks` (from `cycleLength`, or capped at 52 for ongoing programs).

The day dropdown currently iterates `currentWeekData?.days`. Replace with a loop `1..daysPerCycle`, showing `getDayTitle(programId, dayNumber)` as the label for each day.

- [ ] **Step 6: Display day title from registry**

Show `getDayTitle(programId, dayNumber)` in the workout header (e.g., "Legs A" for RAVAGE Day 1 instead of just "Day 1").

- [ ] **Step 7: Verify build and test**

Run: `cd web && npx next build`
Expected: Build succeeds. Switching to RAVAGE shows RAVAGE exercises for the selected day. Week selector shows 1-10. Day selector shows 6 days with titles. Switching back to Mass Impact shows Mass Impact exercises with 1-12 weeks and 5 days. Logging sets works for both.

- [ ] **Step 8: Commit**

```bash
git add web/src/components/screens/today-screen.tsx
git commit -m "feat: make today screen program-aware via registry"
```

---

### Task 9: Superset Visual Grouping

**Files:**
- Modify: `web/src/lib/program-data.ts` (add supersetGroup to ProgramExercise)
- Modify: `web/src/components/screens/today-screen.tsx`
- Modify: `web/src/components/exercise-queue-card.tsx`
- Modify: `web/src/lib/program-registry.ts` (pass superset info through adapter)

- [ ] **Step 1: Add supersetGroup to ProgramExercise type**

In `web/src/lib/program-data.ts`, add `supersetGroup?: string` to the `ProgramExercise` type. This is optional — Mass Impact exercises don't use it.

- [ ] **Step 2: Pass supersetGroup through RAVAGE adapter**

In `program-registry.ts`, when adapting RAVAGE exercises, copy `supersetGroup` from `RavageExercise` to `ProgramExercise`:

```typescript
supersetGroup: ex.supersetGroup,
```

- [ ] **Step 3: Group supersetted exercises in today-screen queue**

In `today-screen.tsx`, when building `queueExercises`, detect consecutive exercises with the same `supersetGroup` value. Mark them with a `supersetPartner` field or group them visually. The simplest approach: add `supersetGroup?: string` to the `QueueExercise` type and pass it through.

- [ ] **Step 4: Visual grouping in exercise-queue-card.tsx**

When an exercise has a `supersetGroup`, render a visual connector to its partner:
- Left border accent line connecting the pair (2px solid `var(--accent-primary)`)
- "A" / "B" labels shown before the exercise name

Keep the grouping simple — a left border color and label is enough.

**Superset rest timer behavior:** When the user logs a set for an "A" exercise in a superset pair, do NOT auto-start the rest timer. Instead, auto-advance the active exercise to the "B" partner. The rest timer auto-starts only after logging the "B" exercise's set. Implementation: in the set-logging handler, after logging a set, check if the current exercise has a `supersetGroup` and its `orderLabel` ends with "A". If so, advance `activeIndex` to the next exercise (the B partner) without starting the rest timer. If the label ends with "B", start the rest timer normally.

- [ ] **Step 5: Verify build and test**

Run: `cd web && npx next build`
Expected: Build succeeds. RAVAGE Torso A day shows supersetted exercises grouped with visual connectors. Non-supersetted exercises render normally.

- [ ] **Step 6: Commit**

```bash
git add web/src/lib/program-data.ts web/src/lib/program-registry.ts web/src/components/screens/today-screen.tsx web/src/components/exercise-queue-card.tsx
git commit -m "feat: add superset visual grouping for exercise queue"
```

---

### Task 10: Double Progression Tracking

**Files:**
- Modify: `web/src/components/screens/today-screen.tsx`

- [ ] **Step 1: Detect when rep ceiling is hit**

Add a function `isRepCeilingHit(exercise: ProgramExercise, loggedSets: LoggedSet[]): boolean`:
- Parse the rep range ceiling from the exercise's `setGroups[0].reps` (e.g., "8-12" → ceiling is 12)
- Check if ALL logged sets for this exercise have `reps >= ceiling`
- Return true if so

This only applies when `getProgramMeta(programId)?.periodizationType === "double-progression"`.

- [ ] **Step 2: Show "Bump weight" banner**

When `isRepCeilingHit` returns true for the active exercise, render a banner below the set console:

```tsx
<div style={{
  background: "var(--accent-power)",
  color: "var(--bg-0)",
  padding: "8px 16px",
  borderRadius: "var(--radius-sm)",
  fontFamily: "var(--font-display)",
  fontSize: "1.1rem",
  textAlign: "center",
  marginTop: "8px",
}}>
  All sets hit top of range — bump weight next session
</div>
```

Only show after at least 1 set is logged. Only show for double-progression programs.

- [ ] **Step 3: Verify build and test**

Run: `cd web && npx next build`
Expected: Build succeeds. In RAVAGE, logging all sets at the top of the rep range shows the banner. Mass Impact does not show the banner.

- [ ] **Step 4: Commit**

```bash
git add web/src/components/screens/today-screen.tsx
git commit -m "feat: add double progression bump-weight banner"
```

---

### Task 11: Planner Screen — Cycle-Based Display

**Files:**
- Modify: `web/src/components/screens/planner-screen.tsx`

- [ ] **Step 1: Read active program and cycle length**

Import `getProgramMeta`, `getDaysInCycle`, `getDayTitle` from `program-registry.ts`. Read `selectedProgram` from profile prefs. Get `daysPerCycle` from program meta.

- [ ] **Step 2: Replace fixed 7-day grid with cycle-length grid**

Currently the planner shows a Mon-Sun grid. Replace with:
- A row of `daysPerCycle` slots (5 for Mass Impact/Hers, 6 for RAVAGE)
- Each slot shows the day title from `getDayTitle(programId, dayNumber)`
- Left/right arrows navigate between weeks (cycles)

- [ ] **Step 3: Update week label**

For fixed-length programs (Mass Impact, RAVAGE): show "Week 3 of 12" or "Week 3 of 10".
For ongoing auto-regulated programs: show "Meso 1 — Week 3 of 5" (reads from meso state if available, falls back to "Week 1 of 5").

- [ ] **Step 4: Add deload badges**

For RAVAGE weeks 5 and 10: render a "DELOAD" badge on the week header.
For auto-regulated programs: render "DELOAD" badge on the last week of each meso (when `weekInMeso === mesoLength`).

Style: small pill with `var(--warn)` background, `var(--bg-0)` text, `var(--radius-sm)` corners.

- [ ] **Step 5: Verify build and test**

Run: `cd web && npx next build`
Expected: Build succeeds. RAVAGE shows 6-day cycle. Mass Impact shows 5-day cycle. Week navigation works. Deload badges appear on correct weeks.

- [ ] **Step 6: Commit**

```bash
git add web/src/components/screens/planner-screen.tsx
git commit -m "feat: convert planner to cycle-based display with deload badges"
```

---

End of Chunk 2.

---

## Chunk 3: Volume System

### Task 12: Install Vitest

**Files:**
- Modify: `web/package.json`

- [ ] **Step 1: Install vitest**

Run: `cd web && npm install -D vitest`

- [ ] **Step 2: Add test script to package.json**

Add `"test": "vitest run"` and `"test:watch": "vitest"` to the `scripts` section.

- [ ] **Step 3: Verify vitest runs**

Run: `cd web && npx vitest run`
Expected: "No test files found" (no tests yet). Confirms vitest is working.

- [ ] **Step 4: Commit**

```bash
git add web/package.json web/package-lock.json
git commit -m "chore: install vitest for unit testing"
```

---

### Task 13: Volume Engine — Pure Functions (TDD)

**Files:**
- Create: `web/src/lib/volume-engine.ts`
- Create: `web/src/lib/__tests__/volume-engine.test.ts`

All functions are pure — no localStorage, no side effects. Perfect for TDD.

- [ ] **Step 1: Write failing test for calculateWeeklyVolume**

```typescript
// web/src/lib/__tests__/volume-engine.test.ts
import { describe, it, expect } from "vitest";
import { calculateWeeklyVolume } from "../volume-engine";
import type { ExerciseDefinition } from "../types";
import type { WorkoutSession } from "../workout-store";

const mockLibrary: ExerciseDefinition[] = [
  {
    id: "bench-press", name: "Bench Press (Barbell)",
    primaryMuscle: "chest", type: "compound", equipment: "barbell",
    secondaryMuscles: [{ muscle: "triceps", factor: 0.5 }, { muscle: "front_delts", factor: 0.5 }],
  },
  {
    id: "incline-db-curl", name: "Incline Dumbbell Curl",
    primaryMuscle: "biceps", type: "stretch", equipment: "dumbbell",
    secondaryMuscles: [],
  },
];

describe("calculateWeeklyVolume", () => {
  it("counts direct sets for primary muscle", () => {
    const now = Date.now();
    const sessions: WorkoutSession[] = [{
      id: "test-1", programId: "test", weekNumber: 1, dayNumber: 1,
      startedAt: now - 3600000, completedAt: now,
      sets: [
        { exerciseName: "Bench Press (Barbell)", setIndex: 0, weight: 135, reps: 10, timestamp: now },
        { exerciseName: "Bench Press (Barbell)", setIndex: 1, weight: 135, reps: 10, timestamp: now },
        { exerciseName: "Bench Press (Barbell)", setIndex: 2, weight: 135, reps: 10, timestamp: now },
      ],
    }];
    const result = calculateWeeklyVolume(sessions, mockLibrary);
    expect(result.chest.direct).toBe(3);
    expect(result.chest.total).toBe(3);
  });

  it("counts indirect sets from secondary muscles", () => {
    const now = Date.now();
    const sessions: WorkoutSession[] = [{
      id: "test-1", programId: "test", weekNumber: 1, dayNumber: 1,
      startedAt: now - 3600000, completedAt: now,
      sets: [
        { exerciseName: "Bench Press (Barbell)", setIndex: 0, weight: 135, reps: 10, timestamp: now },
        { exerciseName: "Bench Press (Barbell)", setIndex: 1, weight: 135, reps: 10, timestamp: now },
      ],
    }];
    const result = calculateWeeklyVolume(sessions, mockLibrary);
    expect(result.triceps.direct).toBe(0);
    expect(result.triceps.total).toBe(1); // 2 sets * 0.5 factor
  });

  it("skips exercises not in library", () => {
    const now = Date.now();
    const sessions: WorkoutSession[] = [{
      id: "test-1", programId: "test", weekNumber: 1, dayNumber: 1,
      startedAt: now - 3600000, completedAt: now,
      sets: [
        { exerciseName: "Unknown Exercise", setIndex: 0, weight: 100, reps: 10, timestamp: now },
      ],
    }];
    const result = calculateWeeklyVolume(sessions, mockLibrary);
    // Should not throw, all muscles should be 0
    expect(result.chest.direct).toBe(0);
  });

  it("only includes sessions within rolling window", () => {
    const now = Date.now();
    const eightDaysAgo = now - 8 * 24 * 60 * 60 * 1000;
    const sessions: WorkoutSession[] = [
      {
        id: "old", programId: "test", weekNumber: 1, dayNumber: 1,
        startedAt: eightDaysAgo, completedAt: eightDaysAgo + 3600000,
        sets: [{ exerciseName: "Incline Dumbbell Curl", setIndex: 0, weight: 25, reps: 10, timestamp: eightDaysAgo }],
      },
      {
        id: "recent", programId: "test", weekNumber: 1, dayNumber: 2,
        startedAt: now - 3600000, completedAt: now,
        sets: [{ exerciseName: "Incline Dumbbell Curl", setIndex: 0, weight: 25, reps: 10, timestamp: now }],
      },
    ];
    const result = calculateWeeklyVolume(sessions, mockLibrary);
    expect(result.biceps.direct).toBe(1); // only the recent session
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `cd web && npx vitest run`
Expected: FAIL — `calculateWeeklyVolume` not found.

- [ ] **Step 3: Implement calculateWeeklyVolume**

```typescript
// web/src/lib/volume-engine.ts
import type { MuscleGroup, ExerciseDefinition, ExerciseType, VolumeLandmarks, MesocycleState, RecoveryRating } from "./types";
import type { WorkoutSession } from "./workout-store";
import type { ProgramExercise } from "./program-data";
import { TRACKED_MUSCLES } from "./types";

type VolumeResult = Record<MuscleGroup, { direct: number; total: number }>;

export function calculateWeeklyVolume(
  sessions: WorkoutSession[],
  exerciseLibrary: ExerciseDefinition[],
  windowDays: number = 7,
): VolumeResult {
  const cutoff = Date.now() - windowDays * 24 * 60 * 60 * 1000;
  const recentSessions = sessions.filter(s => (s.completedAt ?? s.startedAt) >= cutoff);

  // Initialize all muscles to 0
  const result = {} as VolumeResult;
  for (const m of TRACKED_MUSCLES) {
    result[m] = { direct: 0, total: 0 };
  }

  // Build name→definition lookup
  const byName = new Map<string, ExerciseDefinition>();
  for (const ex of exerciseLibrary) {
    byName.set(ex.name.toLowerCase(), ex);
  }

  for (const session of recentSessions) {
    // Count unique sets per exercise (by exerciseName + setIndex)
    const setCounts = new Map<string, number>();
    for (const set of session.sets) {
      const current = setCounts.get(set.exerciseName) ?? 0;
      setCounts.set(set.exerciseName, current + 1);
    }

    for (const [exName, count] of setCounts) {
      const def = byName.get(exName.toLowerCase());
      if (!def) continue; // skip unknown exercises

      // Direct volume
      if (result[def.primaryMuscle]) {
        result[def.primaryMuscle].direct += count;
        result[def.primaryMuscle].total += count;
      }

      // Indirect volume
      for (const sec of def.secondaryMuscles) {
        if (result[sec.muscle]) {
          result[sec.muscle].total += count * sec.factor;
        }
      }
    }
  }

  return result;
}
```

- [ ] **Step 4: Run tests**

Run: `cd web && npx vitest run`
Expected: All 4 tests pass.

- [ ] **Step 5: Write failing tests for calculateRecoveryAverage**

```typescript
describe("calculateRecoveryAverage", () => {
  it("averages ratings for a single muscle", () => {
    const ratings: RecoveryRating[] = [
      { date: Date.now(), sessionId: "s1", ratings: { chest: 1, back: 0 } },
      { date: Date.now(), sessionId: "s2", ratings: { chest: -1, back: 2 } },
    ];
    expect(calculateRecoveryAverage(ratings, "chest")).toBe(0);
    expect(calculateRecoveryAverage(ratings, "back")).toBe(1);
  });

  it("returns 0 when no ratings exist for muscle", () => {
    expect(calculateRecoveryAverage([], "chest")).toBe(0);
  });
});
```

- [ ] **Step 6: Implement calculateRecoveryAverage**

```typescript
export function calculateRecoveryAverage(
  ratings: RecoveryRating[],
  muscle: MuscleGroup,
): number {
  const values = ratings
    .map(r => r.ratings[muscle])
    .filter((v): v is number => v !== undefined);
  if (values.length === 0) return 0;
  return values.reduce((a, b) => a + b, 0) / values.length;
}
```

- [ ] **Step 7: Run tests — all should pass**

Run: `cd web && npx vitest run`

- [ ] **Step 8: Write failing tests for getVolumeRecommendation**

```typescript
describe("getVolumeRecommendation", () => {
  const landmarks = { mev: 4, mavLow: 10, mavHigh: 16, mrvLow: 16, mrvHigh: 20 };

  it("recommends +2 sets for high recovery", () => {
    expect(getVolumeRecommendation(10, 1.8, landmarks, 10)).toBe(12);
  });

  it("recommends +1 set for good recovery", () => {
    expect(getVolumeRecommendation(10, 0.8, landmarks, 10)).toBe(11);
  });

  it("keeps volume same for neutral recovery", () => {
    expect(getVolumeRecommendation(10, 0, landmarks, 10)).toBe(10);
  });

  it("recommends -1 set for poor recovery", () => {
    expect(getVolumeRecommendation(10, -1, landmarks, 10)).toBe(9);
  });

  it("recommends -2 sets for very poor recovery", () => {
    expect(getVolumeRecommendation(10, -1.8, landmarks, 10)).toBe(8);
  });

  it("clamps to MEV floor", () => {
    expect(getVolumeRecommendation(5, -2, landmarks, 5)).toBe(4); // MEV
  });

  it("clamps to MRV ceiling (uses mrvLow as cap)", () => {
    expect(getVolumeRecommendation(15, 2, landmarks, 15)).toBe(16); // mrvLow
  });
});
```

- [ ] **Step 9: Implement getVolumeRecommendation**

```typescript
export function getVolumeRecommendation(
  currentVolume: number,
  recoveryAvg: number,
  landmarks: { mev: number; mavLow: number; mavHigh: number; mrvLow: number; mrvHigh: number },
  currentTarget: number,
): number {
  let delta = 0;
  if (recoveryAvg >= 1.5) delta = 2;
  else if (recoveryAvg >= 0.5) delta = 1;
  else if (recoveryAvg >= -0.5) delta = 0;
  else if (recoveryAvg >= -1.5) delta = -1;
  else delta = -2;

  const newTarget = currentTarget + delta;
  return Math.max(landmarks.mev, Math.min(landmarks.mrvLow, newTarget));
}
```

- [ ] **Step 10: Run tests — all should pass**

Run: `cd web && npx vitest run`

- [ ] **Step 11: Implement suggestSetPlacement and isDeloadDue**

```typescript
export function suggestSetPlacement(
  muscle: MuscleGroup,
  action: "add" | "remove",
  programExercises: ProgramExercise[],
  exerciseLibrary: ExerciseDefinition[],
): string | null {
  const byName = new Map(exerciseLibrary.map(e => [e.name.toLowerCase(), e]));
  const muscleExercises = programExercises
    .filter(ex => byName.get(ex.name.toLowerCase())?.primaryMuscle === muscle)
    .map(ex => ({ name: ex.name, type: byName.get(ex.name.toLowerCase())!.type }));

  const priority: ExerciseType[] = action === "add"
    ? ["stretch", "isolation", "compound"]
    : ["compound", "isolation", "stretch"];

  for (const type of priority) {
    const match = muscleExercises.find(e => e.type === type);
    if (match) return match.name;
  }
  return muscleExercises[0]?.name ?? null;
}

export function isDeloadDue(mesoState: MesocycleState): boolean {
  return mesoState.weekInMeso > mesoState.mesoLength;
}

export function advanceMeso(
  mesoState: MesocycleState,
  recoveryAverages: Partial<Record<MuscleGroup, number>>,
  landmarks: VolumeLandmarks,
): MesocycleState {
  // Per spec: new meso starts at previous meso's starting targets
  // or +1 set on muscles that recovered well (avg >= 0.5)
  const newTargets: Partial<Record<MuscleGroup, number>> = {};
  for (const muscle of TRACKED_MUSCLES) {
    const current = mesoState.weeklyTargets[muscle] ?? landmarks[muscle]?.mev ?? 0;
    const recoveryAvg = recoveryAverages[muscle] ?? 0;
    const bump = recoveryAvg >= 0.5 ? 1 : 0;
    newTargets[muscle] = Math.min(current + bump, landmarks[muscle]?.mrvLow ?? current);
  }
  return {
    mesoNumber: mesoState.mesoNumber + 1,
    weekInMeso: 1,
    mesoLength: mesoState.mesoLength,
    startDate: Date.now(),
    weeklyTargets: newTargets,
  };
}
```

No separate tests for `suggestSetPlacement` and `isDeloadDue` — they're thin wrappers. `advanceMeso` implements the spec's recovery-based adjustment (+1 set on muscles with avg >= 0.5, clamped to MRV).

- [ ] **Step 12: Run all tests and verify build**

Run: `cd web && npx vitest run && npx next build`
Expected: All tests pass. Build succeeds.

- [ ] **Step 13: Commit**

```bash
git add web/src/lib/volume-engine.ts web/src/lib/__tests__/volume-engine.test.ts
git commit -m "feat: add volume engine with TDD-verified pure functions"
```

---

### Task 14: Volume Store

**Files:**
- Create: `web/src/lib/volume-store.ts`

localStorage CRUD for recovery ratings, mesocycle state, and volume landmarks. Per-profile data using the `Record<HouseholdUser, T>` pattern.

- [ ] **Step 1: Create volume-store.ts**

```typescript
import type { HouseholdUser } from "./household-profiles";
import type { MuscleGroup, VolumeLandmarks, MesocycleState, RecoveryRating } from "./types";
import { TRACKED_MUSCLES } from "./types";

const KEYS = {
  VOLUME_STATE: "mi_volume_state",
  RECOVERY_RATINGS: "mi_recovery_ratings",
  VOLUME_LANDMARKS: "mi_volume_landmarks",
} as const;

// --- Default volume landmarks (from spec) ---
// Populate from spec section "Volume Landmarks — Defaults" (lines 167-198)
// His table: back 8/14/18/20/25, chest 8/12/18/20/22, side_delts 6/12/18/20/26, etc.
// Hers table: glutes 6/12/18/20/24, hamstrings 6/10/16/16/20, quads 6/10/16/16/22, etc.
// All 12 TRACKED_MUSCLES must be present. Fields: { mev, mavLow, mavHigh, mrvLow, mrvHigh }
export const DEFAULT_HIS_LANDMARKS: VolumeLandmarks = {
  back: { mev: 8, mavLow: 14, mavHigh: 18, mrvLow: 20, mrvHigh: 25 },
  chest: { mev: 8, mavLow: 12, mavHigh: 18, mrvLow: 20, mrvHigh: 22 },
  side_delts: { mev: 6, mavLow: 12, mavHigh: 18, mrvLow: 20, mrvHigh: 26 },
  rear_delts: { mev: 6, mavLow: 10, mavHigh: 14, mrvLow: 16, mrvHigh: 22 },
  biceps: { mev: 4, mavLow: 10, mavHigh: 16, mrvLow: 16, mrvHigh: 20 },
  triceps: { mev: 4, mavLow: 8, mavHigh: 14, mrvLow: 14, mrvHigh: 18 },
  quads: { mev: 6, mavLow: 12, mavHigh: 18, mrvLow: 18, mrvHigh: 24 },
  hamstrings: { mev: 4, mavLow: 8, mavHigh: 14, mrvLow: 14, mrvHigh: 18 },
  glutes: { mev: 0, mavLow: 4, mavHigh: 10, mrvLow: 12, mrvHigh: 16 },
  traps: { mev: 4, mavLow: 8, mavHigh: 12, mrvLow: 14, mrvHigh: 20 },
  calves: { mev: 4, mavLow: 8, mavHigh: 12, mrvLow: 14, mrvHigh: 16 },
  abs: { mev: 0, mavLow: 6, mavHigh: 12, mrvLow: 14, mrvHigh: 18 },
} as VolumeLandmarks;

export const DEFAULT_HERS_LANDMARKS: VolumeLandmarks = {
  glutes: { mev: 6, mavLow: 12, mavHigh: 18, mrvLow: 20, mrvHigh: 24 },
  hamstrings: { mev: 6, mavLow: 10, mavHigh: 16, mrvLow: 16, mrvHigh: 20 },
  quads: { mev: 6, mavLow: 10, mavHigh: 16, mrvLow: 16, mrvHigh: 22 },
  back: { mev: 6, mavLow: 10, mavHigh: 14, mrvLow: 16, mrvHigh: 20 },
  side_delts: { mev: 6, mavLow: 10, mavHigh: 14, mrvLow: 16, mrvHigh: 20 },
  rear_delts: { mev: 4, mavLow: 8, mavHigh: 12, mrvLow: 14, mrvHigh: 18 },
  biceps: { mev: 2, mavLow: 6, mavHigh: 10, mrvLow: 12, mrvHigh: 16 },
  triceps: { mev: 2, mavLow: 6, mavHigh: 10, mrvLow: 12, mrvHigh: 16 },
  chest: { mev: 2, mavLow: 4, mavHigh: 8, mrvLow: 10, mrvHigh: 14 },
  calves: { mev: 4, mavLow: 6, mavHigh: 10, mrvLow: 12, mrvHigh: 16 },
  traps: { mev: 2, mavLow: 6, mavHigh: 10, mrvLow: 10, mrvHigh: 14 },
  abs: { mev: 2, mavLow: 6, mavHigh: 10, mrvLow: 12, mrvHigh: 16 },
} as VolumeLandmarks;

export function getDefaultLandmarks(profile: HouseholdUser): VolumeLandmarks {
  return profile === "his" ? { ...DEFAULT_HIS_LANDMARKS } : { ...DEFAULT_HERS_LANDMARKS };
}

// --- Volume Landmarks ---
export function getVolumeLandmarks(user: HouseholdUser): VolumeLandmarks { /* read from localStorage, fall back to defaults */ }
export function saveVolumeLandmarks(user: HouseholdUser, landmarks: VolumeLandmarks): void { /* write to localStorage */ }
export function resetVolumeLandmarks(user: HouseholdUser): VolumeLandmarks { /* reset to defaults */ }

// --- Recovery Ratings ---
export function getRecoveryRatings(user: HouseholdUser): RecoveryRating[] { /* read from localStorage */ }
export function saveRecoveryRating(user: HouseholdUser, rating: RecoveryRating): void { /* append to localStorage array */ }

// --- Mesocycle State ---
export function getMesoState(user: HouseholdUser): MesocycleState | null { /* read from localStorage */ }
export function saveMesoState(user: HouseholdUser, state: MesocycleState): void { /* write to localStorage */ }
export function initMesoState(user: HouseholdUser, mesoLength?: number): MesocycleState {
  /* create initial meso state: mesoNumber 1, weekInMeso 1, mesoLength default 5 */
}
```

All functions must guard with `if (typeof window === "undefined") return fallback;` for SSR safety.

Storage pattern: `Record<HouseholdUser, T>` — same as existing stores. Read the full record, update the user's entry, write back.

Populate `DEFAULT_HIS_LANDMARKS` and `DEFAULT_HERS_LANDMARKS` with all values from the spec tables. Only include `TRACKED_MUSCLES` (12 muscles, excluding front_delts/neck/forearms).

- [ ] **Step 2: Verify build**

Run: `cd web && npx next build`
Expected: Build succeeds.

- [ ] **Step 3: Commit**

```bash
git add web/src/lib/volume-store.ts
git commit -m "feat: add volume store for landmarks, recovery ratings, meso state"
```

---

### Task 15: Recovery Rating Prompt Component

**Files:**
- Create: `web/src/components/recovery-rating-prompt.tsx`
- Modify: `web/src/components/screens/today-screen.tsx`

- [ ] **Step 1: Create recovery-rating-prompt.tsx**

Props:
```typescript
interface RecoveryRatingPromptProps {
  musclesTrained: MuscleGroup[];  // muscles to rate (derived from exercises in the session)
  onSubmit: (ratings: Partial<Record<MuscleGroup, number>>) => void;
  onSkip: () => void;
}
```

UI: a card that appears inline at the bottom of the today screen after workout completion. Shows each muscle group as a row with the muscle name and 5 tappable buttons: -2, -1, 0, +1, +2. Default selection is 0. Submit button saves all ratings. Skip button dismisses without saving.

Style:
- Card: `var(--bg-1)` background, `var(--border)` border, `var(--radius-lg)` corners
- Buttons: small pills, `var(--bg-2)` default, `var(--accent-primary)` when selected
- Rating labels: `var(--font-mono)` font
- Muscle names: `var(--font-ui)` font, `var(--text-1)` color
- Display muscle names in title case with underscores replaced by spaces

- [ ] **Step 2: Derive musclesTrained from session exercises**

In `today-screen.tsx`, after workout completion, determine which muscle groups were trained by looking up each exercise in the session via the exercise library:

```typescript
const musclesTrained = useMemo(() => {
  if (!activeSession?.sets.length) return [];
  const muscles = new Set<MuscleGroup>();
  for (const set of activeSession.sets) {
    const def = findExercise(set.exerciseName);
    if (def) muscles.add(def.primaryMuscle);
  }
  return [...muscles].filter(m => TRACKED_MUSCLES.includes(m));
}, [activeSession]);
```

- [ ] **Step 3: Show recovery prompt on workout completion**

In `today-screen.tsx`, show the recovery prompt BEFORE calling `completeSession()`. Flow:

1. When user taps "Complete Workout", capture the current session data (sets, sessionId) into local state: `const [completedSessionData, setCompletedSessionData] = useState(null)`.
2. Set `completedSessionData` with the active session's sets and ID. Show `<RecoveryRatingPrompt>`.
3. On submit or skip, THEN call `completeSession()` which nulls the active session.

This avoids the lifecycle issue where `completeSession()` sets `activeSession = null` and the prompt would have no data to work with.

Import `findExercise` from `exercise-library.ts`, `TRACKED_MUSCLES` from `types.ts`, `saveRecoveryRating` from `volume-store.ts`.

Only show for programs with `hasVolumeTracking: true` (all programs in our case).

- [ ] **Step 4: Verify build and test**

Run: `cd web && npx next build`
Expected: Build succeeds. After completing a workout, the recovery rating prompt appears with the correct muscle groups. Tapping ratings and submitting saves to localStorage.

- [ ] **Step 5: Commit**

```bash
git add web/src/components/recovery-rating-prompt.tsx web/src/components/screens/today-screen.tsx
git commit -m "feat: add post-workout recovery rating prompt"
```

---

### Task 16: Volume Bar and Sparkline Components

**Files:**
- Create: `web/src/components/volume-bar.tsx`
- Create: `web/src/components/sparkline.tsx`

- [ ] **Step 1: Create volume-bar.tsx**

A horizontal bar showing current volume relative to MEV/MAV/MRV landmarks.

Props:
```typescript
interface VolumeBarProps {
  current: number;
  mev: number;
  mavLow: number;
  mavHigh: number;
  mrvLow: number;
  mrvHigh: number;
}
```

Renders a horizontal bar (full width, 12px height) with:
- Gray fill from 0 to MEV
- Green fill from MEV to mavLow midpoint
- Yellow fill from mavLow midpoint to mavHigh
- Red fill from mavHigh to mrvLow
- Marker lines at MEV, mavLow, mavHigh, mrvLow
- A current-value indicator (bright dot or vertical line at the current position)

Color-coding the fill based on where `current` falls:
- `current < mev` → gray bar
- `current >= mev && current <= (mavLow + mavHigh) / 2` → green
- `current > (mavLow + mavHigh) / 2 && current <= mavHigh` → yellow
- `current > mavHigh` → red

Implementation: styled `<div>` elements with percentage-based widths. Scale: 0 to `mrvHigh` maps to 0-100% width.

- [ ] **Step 2: Create sparkline.tsx**

An inline SVG sparkline for trends.

Props:
```typescript
interface SparklineProps {
  data: number[];      // array of values (e.g., weekly volumes)
  width?: number;      // default 120
  height?: number;     // default 32
  color?: string;      // default var(--accent-primary)
}
```

Renders an SVG with a polyline. Auto-scales Y axis to data range. No axis labels — just the line. Add a small dot at the last data point.

```tsx
export function Sparkline({ data, width = 120, height = 32, color = "var(--accent-primary)" }: SparklineProps) {
  if (data.length < 2) return null;
  const min = Math.min(...data);
  const max = Math.max(...data);
  const range = max - min || 1;
  const points = data.map((v, i) => {
    const x = (i / (data.length - 1)) * width;
    const y = height - ((v - min) / range) * (height - 4) - 2;
    return `${x},${y}`;
  }).join(" ");
  const lastX = width;
  const lastY = height - ((data[data.length - 1] - min) / range) * (height - 4) - 2;

  return (
    <svg width={width} height={height} viewBox={`0 0 ${width} ${height}`}>
      <polyline points={points} fill="none" stroke={color} strokeWidth="1.5" />
      <circle cx={lastX} cy={lastY} r="2.5" fill={color} />
    </svg>
  );
}
```

- [ ] **Step 3: Verify build**

Run: `cd web && npx next build`
Expected: Build succeeds.

- [ ] **Step 4: Commit**

```bash
git add web/src/components/volume-bar.tsx web/src/components/sparkline.tsx
git commit -m "feat: add volume bar and sparkline chart components"
```

---

### Task 17: Volume Dashboard Screen

**Files:**
- Modify: `web/src/components/screens/volume-screen.tsx` (replace placeholder)

- [ ] **Step 1: Build the meso overview header**

Read `selectedProgram` from profile prefs. Read `MesocycleState` from `getMesoState()`. Read `ProgramMeta` from `getProgramMeta()`.

Display:
- For auto-regulated programs: "Meso {n} — Week {w} of {mesoLength}" + deload countdown
- For Mass Impact: "Week {currentWeek} of 12"
- For RAVAGE: "Week {currentWeek} of 10" + deload badge if week 5 or 10
- Program name badge

- [ ] **Step 2: Build muscle group cards**

For each muscle in `TRACKED_MUSCLES`:
1. Calculate current weekly volume using `calculateWeeklyVolume()` with sessions from `getAllSessions()`
2. Read landmarks from `getVolumeLandmarks()`
3. Read recovery ratings from `getRecoveryRatings()`

Each card renders:
- Muscle name (title case) + current direct volume (large number)
- `<VolumeBar>` with landmarks
- Direct/Total toggle (local state, switches between `direct` and `total` volume)
- `<Sparkline>` with weekly volume trend data (collect volumes per week from session history)
- Recovery trend: colored dots for recent ratings (green for +1/+2, yellow for 0, red for -1/-2)
- Recommendation badge (auto-reg programs only): compute `getVolumeRecommendation()` and `suggestSetPlacement()`, display as "+1 set → Exercise Name" / "Hold" / "-1 set → Exercise Name"

For Mass Impact: hide the recommendation badge (no auto-regulation).

- [ ] **Step 3: Build meso history section**

Collapsed by default (`<details>`/`<summary>`). Shows previous meso data if available from `getMesoState()` history. For initial implementation, just show a "No previous meso data" message — history tracking will be filled in during Polish (Chunk 4).

- [ ] **Step 4: Verify build and test**

Run: `cd web && npx next build`
Expected: Build succeeds. Navigating to /volume shows the dashboard with muscle group cards, volume bars, and sparklines. Data reflects actual logged sessions.

- [ ] **Step 5: Commit**

```bash
git add web/src/components/screens/volume-screen.tsx
git commit -m "feat: build volume dashboard with muscle cards, bars, and sparklines"
```

---

End of Chunk 3.

---

## Chunk 4: Hers Programs + Polish

### Task 18: Hers Program Data — LULUL

**Files:**
- Create: `web/src/lib/program-data-hers.ts`
- Modify: `web/src/lib/program-registry.ts` (wire up Hers adapter)

- [ ] **Step 1: Create program-data-hers.ts with LULUL template**

Define a shared internal type for Hers exercises:

```typescript
export interface HersExercise {
  orderLabel: string;
  name: string;
  sets: number;
  reps: string;
  type: ExerciseType;
  supersetGroup?: string;
}

export interface HersDayTemplate {
  dayNumber: number;
  title: string;
  exercises: HersExercise[];
}

export interface HersProgram {
  id: string;
  dayTemplates: HersDayTemplate[];
}
```

Populate `HERS_LULUL` with all 5 days from the spec (Day 1: Lower A, Day 2: Upper A, Day 3: Lower B, Day 4: Upper B, Day 5: Lower C). Exercise names must exactly match `exercise-library.ts`.

**Handling "or" alternatives:** Some exercises have alternates (e.g., "Cable Kickback or Glute-Focused Back Extension"). Pick the FIRST option as the default in the template. Both exercises must exist in `exercise-library.ts`. Users can swap exercises via the manual override system (Task 20). No `alternateExercise` field needed — keep it simple.

**Supersets:** Some Hers days have superset pairs (e.g., LULUL Day 2: 5A/5B, Day 4: 5A/5B). Set `supersetGroup` on these exercises.

- [ ] **Step 2: Add PPLPP template**

Populate `HERS_PPLPP` with all 5 days from the spec (Day 1: Pull A, Day 2: Push A, Day 3: Legs, Day 4: Pull B, Day 5: Push B).

- [ ] **Step 3: Add Custom Glute-Emphasis template**

Populate `HERS_CUSTOM` with all 5 days from the spec (Day 1: Glute + Ham, Day 2: Push + Side Delts, Day 3: Glute + Quad, Day 4: Pull + Rear Delts, Day 5: Glute Pump + Arms + Abs).

- [ ] **Step 4: Export all templates and a lookup function**

```typescript
export const HERS_PROGRAMS: Record<string, HersProgram> = {
  "hers-lulul": HERS_LULUL,
  "hers-pplpp": HERS_PPLPP,
  "hers-custom": HERS_CUSTOM,
};

export function getHersDayTemplate(programId: string, dayNumber: number): HersDayTemplate | undefined {
  return HERS_PROGRAMS[programId]?.dayTemplates.find(d => d.dayNumber === dayNumber);
}
```

- [ ] **Step 5: Wire Hers adapter in program-registry.ts**

In `getExercisesForDay()`, add the Hers branch:

```typescript
if (programId.startsWith("hers-")) {
  const template = getHersDayTemplate(programId, dayNumber);
  if (!template) return [];
  return template.exercises.map((ex, i) => ({
    order: i + 1,
    orderLabel: ex.orderLabel,
    name: ex.name,
    setGroups: [{ sets: ex.sets, reps: ex.reps }],
    restSeconds: getDefaultRestSeconds(ex.name),
    supersetGroup: ex.supersetGroup,
  } satisfies ProgramExercise));
}
```

Also implement `getDayTitle()` for Hers programs.

- [ ] **Step 6: Verify build**

Run: `cd web && npx next build`
Expected: Build succeeds. Switching to Hers profile and selecting any of the 3 programs shows correct exercises.

- [ ] **Step 7: Commit**

```bash
git add web/src/lib/program-data-hers.ts web/src/lib/program-registry.ts
git commit -m "feat: add 3 Hers program templates (LULUL, PPLPP, Custom)"
```

---

### Task 19: Settings Screen — Volume Landmarks Editor

**Files:**
- Modify: `web/src/components/screens/settings-screen.tsx`

- [ ] **Step 1: Add meso length setting**

Add a section "Mesocycle Settings" to the settings screen. Show a selector for meso length (4 or 5 weeks, default 5). On change, update `MesocycleState.mesoLength` via `saveMesoState()`. Only show for programs with `hasAutoRegulation: true`.

Style: match existing settings sections (heading + controls).

- [ ] **Step 2: Add volume landmark editor**

Add a section "Volume Landmarks" below meso settings. For each muscle in `TRACKED_MUSCLES`, show a row with:
- Muscle name
- 5 editable number inputs: MEV, MAV Low, MAV High, MRV Low, MRV High
- Current values loaded from `getVolumeLandmarks(activeUser)`

On change, save immediately via `saveVolumeLandmarks()`.

Style: compact table layout. Inputs: `var(--bg-2)` background, `var(--font-mono)` font, narrow width (4ch). Mobile-friendly: horizontal scroll if needed.

- [ ] **Step 3: Add reset to defaults button**

Below the landmark table, add a "Reset to Defaults" button. On click, calls `resetVolumeLandmarks(activeUser)` and refreshes the displayed values.

Style: `var(--danger)` border, `var(--text-0)` text, `var(--radius-sm)` corners.

- [ ] **Step 4: Verify build and test**

Run: `cd web && npx next build`
Expected: Build succeeds. Settings page shows meso length selector and landmark editor. Editing values persists. Reset button works.

- [ ] **Step 5: Commit**

```bash
git add web/src/components/screens/settings-screen.tsx
git commit -m "feat: add meso length and volume landmark settings"
```

---

### Task 20: Manual Set/Rep Override

**Files:**
- Modify: `web/src/components/screens/today-screen.tsx`
- Modify: `web/src/lib/workout-store.ts`

- [ ] **Step 1: Add override fields to WorkoutSession**

In `workout-store.ts`, add an optional `overrides` field to `WorkoutSession`:

```typescript
overrides?: Record<string, { sets?: number; reps?: string }>;  // keyed by exercise name
```

This stores per-exercise overrides for the current session only. Does not affect future sessions or program templates. The override data persists in localStorage as part of the completed session record (accurately recording what was done), but future sessions always start from the program template.

- [ ] **Step 2: Add override UI to today-screen.tsx**

When the user taps the prescribed scheme text (e.g., "3 x 8-12") on the active exercise, toggle an inline editor:
- Show a small form with two inputs: Sets (number, 1-10) and Reps (text, e.g., "8-12")
- Pre-fill with current prescribed values
- "Apply" button saves to session overrides, "Cancel" dismisses
- When an override is active, show the overridden scheme with a small edit icon

Style: inline below the exercise card, same styling as existing template editor but simpler (no exercise picker, just sets and reps).

- [ ] **Step 3: Apply overrides to exercise display**

When building `queueExercises`, check `activeSession.overrides[exercise.name]`. If present, use the override values for `scheme` and `targetSets` display instead of the template values.

- [ ] **Step 4: Verify build and test**

Run: `cd web && npx next build`
Expected: Build succeeds. Tapping the scheme opens the override editor. Applying changes updates the display. Overrides don't persist to the next session.

- [ ] **Step 5: Commit**

```bash
git add web/src/components/screens/today-screen.tsx web/src/lib/workout-store.ts
git commit -m "feat: add session-only manual set/rep override"
```

---

### Task 21: Deload Badges and Meso Advancement

**Files:**
- Modify: `web/src/components/screens/today-screen.tsx`
- Modify: `web/src/components/screens/volume-screen.tsx`

- [ ] **Step 1: Auto-advance mesocycle week**

In `today-screen.tsx`, after `completeSession()` and recovery rating submission, advance the meso week counter:

**When weekInMeso increments:** After completing a session, count the number of completed sessions for the current `weekInMeso` value (sessions with `completedAt` in the current meso week window). If that count >= `daysPerCycle`, increment `weekInMeso` by 1 via `saveMesoState()`. Skipped days are not tracked — the user simply completes fewer sessions that week and meso doesn't advance until the next cycle is done.

**Deload detection:** If `isDeloadDue(mesoState)` (weekInMeso > mesoLength), show a banner: "Deload week — reduce sets to MEV levels". Deload is advisory only — the template exercises stay the same, user logs normally, but the volume dashboard recommendations show MEV targets. No template modification.

**New meso after deload:** After the user completes all `daysPerCycle` sessions during the deload week, call `advanceMeso()` to start a new mesocycle. Show a "New Mesocycle Started" confirmation.

Only for programs with `hasAutoRegulation: true`.

- [ ] **Step 2: Apply volume recommendations after meso week advance**

After advancing `weekInMeso`, recalculate volume recommendations for each muscle using `getVolumeRecommendation()` with the latest recovery averages. Save updated `weeklyTargets` to `MesocycleState`.

- [ ] **Step 3: Show meso info on volume dashboard**

In `volume-screen.tsx`, add a "Next Week Recommendations" section that shows prominently after all workouts for the current week are complete. List each muscle group with its recommendation ("+1 set → Exercise Name", "Hold", "-1 set → Exercise Name").

Only for auto-regulated programs.

- [ ] **Step 4: Verify build and test**

Run: `cd web && npx next build`
Expected: Build succeeds. Completing all workouts for a week advances the meso week. Deload detection works. Recommendations display on the volume dashboard.

- [ ] **Step 5: Commit**

```bash
git add web/src/components/screens/today-screen.tsx web/src/components/screens/volume-screen.tsx
git commit -m "feat: add meso advancement, deload detection, and volume recommendations"
```

---

### Task 22: Final Integration and Verification

**Files:** All modified files

- [ ] **Step 1: Run full test suite**

Run: `cd web && npx vitest run`
Expected: All volume engine tests pass.

- [ ] **Step 2: Run full build**

Run: `cd web && npx next build`
Expected: Build succeeds with no TypeScript errors.

- [ ] **Step 3: Run lint**

Run: `cd web && npx eslint .`
Expected: No lint errors (or only pre-existing ones).

- [ ] **Step 4: Manual smoke test checklist**

Verify in dev server (`npm run dev`):
- [ ] His profile: Mass Impact exercises load, logging works
- [ ] His profile: Switch to RAVAGE, exercises load with correct day titles
- [ ] His profile: RAVAGE supersets display correctly
- [ ] His profile: Double progression banner shows when rep ceiling hit
- [ ] His profile: Recovery rating prompt appears after workout completion
- [ ] His profile: Volume dashboard shows volume bars and sparklines
- [ ] Hers profile: LULUL exercises load
- [ ] Hers profile: Switch to PPLPP, exercises load
- [ ] Hers profile: Switch to Custom, exercises load
- [ ] Hers profile: Volume dashboard shows Hers-specific landmarks
- [ ] Program selector shows correct programs per profile
- [ ] Planner shows correct cycle length per program
- [ ] Settings: Meso length editor works
- [ ] Settings: Volume landmark editor works
- [ ] Manual set/rep override works for current session only
- [ ] Volume nav tab navigates to dashboard
- [ ] RAVAGE weeks 5 and 10 show 1-set exercises (deload)
- [ ] Auto-reg programs: meso week advances after completing a cycle
- [ ] Auto-reg programs: deload banner shows when meso length exceeded
- [ ] Auto-reg programs: new meso starts after deload week completed
- [ ] Volume recommendations update after meso week advance

- [ ] **Step 5: Commit all remaining changes**

```bash
git add -A
git commit -m "feat: complete hypertrophy hub extension — all programs, volume system, dashboard"
```

---

End of Chunk 4.
