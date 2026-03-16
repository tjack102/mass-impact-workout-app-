# Work Log

## 2026-03-16 — Hypertrophy Hub Design + Planning

### Goal
Extend the Mass Impact workout app into a multi-program hypertrophy training hub with RP-style volume auto-regulation.

### What was done
- [x] Explored full codebase
- [x] Reviewed RAVAGE program data from Boostcamp
- [x] Brainstormed and resolved all design questions
- [x] Wrote design spec: `docs/superpowers/specs/2026-03-16-hypertrophy-hub-design.md`
- [x] Spec review loop (2 rounds — 7 blocking issues found and fixed)
- [x] User approved spec
- [x] Wrote implementation plan: `docs/superpowers/plans/2026-03-16-hypertrophy-hub.md`
- [x] Plan review loop (4 chunks, all reviewed and fixed)

---

---

## 2026-03-16 — Task 1: Shared Types Implementation

### Goal
Create foundational types file for hypertrophy hub extension.

### What was done
- [x] Created `web/src/lib/types.ts` with all required types
  - MuscleGroup union (15 muscle groups)
  - ExerciseType and Equipment types
  - ExerciseDefinition interface
  - ProgramMeta interface
  - VolumeLandmarks, MesocycleState, RecoveryRating interfaces
  - TRACKED_MUSCLES constant (12 muscles excluding front_delts, neck, forearms)
- [x] Verified Next.js build passes
- [x] Committed with message: "feat: add shared types for hypertrophy hub extension"

### Notes
- File created at: `web/src/lib/types.ts`
- Build: successful (Compiled successfully, all routes prerendered)
- No imports yet — file ready for Task 2 (Exercise Library)

---

---

## 2026-03-16 — Task 2: Exercise Library

### Goal
Create `web/src/lib/exercise-library.ts` with ~80 tagged exercises covering Mass Impact, RAVAGE, and Hers programs.

### What was done
- [x] Created `web/src/lib/exercise-library.ts`
  - 80 ExerciseDefinition entries covering all three programs
  - Duplicate/alias handling: RAVAGE alternates (Cable Lateral Raise → Lateral Raise (Cable), Back Squat → Squat (Barbell), etc.) collapsed to canonical Mass Impact names; Cable Pullover kept as separate entry since program data may use that exact name
  - Secondary muscles mapped per RP conventions (rows → biceps 0.5, pressing → triceps 0.5 + front_delts 0.5, squat patterns → glutes 0.5, RDL patterns → glutes 0.5, hip thrust → hamstrings 0.5)
  - `findExercise`: exact match then prefix match (case-insensitive)
  - `getExercisesForMuscle`: filter by primaryMuscle
- [x] Build verified (Next.js)
- [x] Committed

---

---

## 2026-03-16 — Task 3: Program Registry

### Goal
Create the adapter layer (program-registry.ts) that maps program IDs to their data sources and produces canonical `ProgramExercise[]` for all programs.

### What was done
- [x] Verified exports from program-data.ts
  - All required exports already present: ExerciseSet, ProgramExercise, ProgramDay, ProgramWeek, Program, formatScheme, getTotalSets, getDefaultRestSeconds, getRestSecondsForExercise
  - getDayForWeek already exported — needed for Mass Impact adapter
- [x] Created `web/src/lib/program-registry.ts` (100 lines)
  - PROGRAM_REGISTRY: metadata for 5 programs (Mass Impact, RAVAGE, LULUL, PPLPP, Custom)
  - getAvailablePrograms(profile): filter registry by profile
  - getProgramMeta(id): lookup metadata
  - getExercisesForDay(programId, dayNumber, weekNumber): adapter that returns ProgramExercise[]
    - Mass Impact: delegates to getDayForWeek()
    - RAVAGE, Hers: stubs for Tasks 7 and 18
  - getDayTitle(programId, dayNumber): display title
  - getDaysInCycle(programId): cycle length
- [x] Build verified (Next.js compiled successfully)
- [x] Committed with message: "feat: add program registry with adapter pattern"

### Notes
- File: `web/src/lib/program-registry.ts`
- Imports from: program-data.ts, types.ts, household-profiles.ts
- All programs have uniform ProgramExercise[] return type
- Mass Impact fully functional, others stubbed

---

---

## 2026-03-16 — Task 4: Workout Store Extensions

### Goal
Add `programId` to `WorkoutSession`, `selectedProgram` to `ProfilePrefs`, and migration logic for existing localStorage data.

### What was done
- [x] Added `selectedProgram?: string` to `ProfilePrefs` type
- [x] Updated `getDefaultProfilePrefs()` to include `selectedProgram: "mass-impact"`
- [x] Updated `getDefaultStoredPrefs()` to set per-user defaults: "mass-impact" for his, "hers-lulul" for hers
- [x] Fixed `sanitizeProfilePrefs()` to preserve `selectedProgram` from stored data (was stripping it)
- [x] Fixed legacy path in `parseStoredPrefs()` to include `selectedProgram` from fallback defaults
- [x] Added `programId: string` to `WorkoutSession` type
- [x] Updated `startSession()` to accept `programId` param (4th arg, default "mass-impact"); new ID format: `{programId}-w{week}-d{day}-{timestamp}`
- [x] Fixed `savePrefs()` in workout-store.ts to preserve `selectedProgram` when updating week/day (was silently stripping it)
- [x] Added `migrateSessionData()` with SSR guard, once-per-load flag, backfills `programId: "mass-impact"` on old sessions
- [x] Wired migration into `getAllSessions()` and `getActiveSession()` (lazy, not at module load)
- [x] Build verified (Next.js compiled successfully, all routes prerendered)
- [x] Committed

---

---

## 2026-03-16 — Task 5: Program Selector + App Shell Integration

### Goal
Create `program-selector.tsx` dropdown component and wire it into `app-shell.tsx`. Add Volume nav tab.

### Checklist
- [x] Create `web/src/components/program-selector.tsx`
- [x] Add `<ProgramSelector>` to sidebar in `app-shell.tsx`
- [x] Add `<ProgramSelector>` to mobile profile-banner in `app-shell.tsx`
- [x] Add Volume nav tab (between Progress and Templates)
- [x] Verify build (✓ Compiled successfully)
- [x] Committed: a06ce9f

## 2026-03-16 — Task 7: RAVAGE Program Data

### Goal
Create `web/src/lib/program-data-ravage.ts` with all 6 day templates, then wire the RAVAGE adapter into `program-registry.ts`.

### Checklist
- [x] Create program-data-ravage.ts with types, RAVAGE_PROGRAM, getRavageDayTemplate
- [x] Verify all exercise names match exercise-library.ts exactly
- [x] Wire getExercisesForDay("ravage") adapter in program-registry.ts
- [x] Implement getDayTitle("ravage") in program-registry.ts
- [x] Verify build passes (✓ Compiled successfully)
- [x] Committed: 0dedd9c

### Exercise name corrections applied (task spec vs library canonical)
- "Incline Dumbbell Curl" → "Incline Curl (Dumbbell)"
- "Cable Lateral Raise" → "Lateral Raise (Cable)"
- "Back Squat" → "Squat (Barbell)"
- "Romanian Deadlift" → "Romanian Deadlift (Barbell)"
- "Hip Thrust" → "Hip Thrust (Barbell)"
- "Lu Lateral Raise" → "Lu Raise"
- "Cable Rear Delt" → "Rear Delt Fly (Cable)"

---

---

## 2026-03-16 — Task 8: Today Screen — Program-Aware Queue

### Goal
Modify `today-screen.tsx` to load exercises from the program registry instead of always using Mass Impact.

### Checklist
- [x] Read selectedProgram from profile prefs via getStoredPrefsFromLocalStorage
- [x] Import getExercisesForDay, getDayTitle, getDaysInCycle, getProgramMeta from program-registry
- [x] Add exercises useMemo: Mass Impact → program-store (preserves edits), others → registry
- [x] Update shiftWeekDay / clampDayPrefs to accept daysPerCycle + totalWeeks params
- [x] Update ensureActiveSession to pass programId to startSession
- [x] Update applyDaySelection to branch on programId for first-exercise lookup
- [x] Update handleSelectExercise to use exercises[] instead of programDay?.exercises[]
- [x] Update queueExercises useMemo to use exercises[] instead of programDay.exercises
- [x] Update WorkoutHeader dayLabel to use getDayTitle()
- [x] Replace week dropdown (program.weeks.map) with Array.from({length: totalWeeks})
- [x] Replace day dropdown (currentWeekData?.days) with Array.from({length: daysPerCycle})
- [x] Hide template editor buttons for non-Mass Impact programs
- [x] Build verified (✓ Compiled successfully)
- [x] Committed: 675ad48

### Notes
- canEditTemplate now includes `&& programId === "mass-impact"` — no template editing for other programs
- handleSaveTemplateEdit still intact for Mass Impact; unreachable for other programs since buttons are hidden
- ongoing programs (cycleLength = 0) get totalWeeks = 52 as cap
- programDay variable kept but only computed when programId === "mass-impact" (returns null otherwise)

---

---

## 2026-03-16 — Task 9: Superset Visual Grouping

### Goal
Wire `supersetGroup` from RAVAGE exercise data through to visual grouping and superset auto-advance behavior in the queue.

### Checklist
- [x] Add `supersetGroup?: string` to `ProgramExercise` in `program-data.ts`
- [x] Pass `supersetGroup` through RAVAGE adapter in `program-registry.ts`
- [x] Add `supersetGroup?: string` to `QueueExercise` in `today-screen.tsx`
- [x] Map `supersetGroup` in `queueExercises` useMemo
- [x] Add `supersetGroup` prop to `ExerciseQueueCardProps`; apply `superset-grouped` CSS class
- [x] Pass `supersetGroup` prop in queue render in `today-screen.tsx`
- [x] Add `.exercise-card.superset-grouped` CSS to `globals.css`
- [x] Superset auto-advance in `handleSaveSet`: A partner → select B, skip rest timer
- [x] Build verified (✓ Compiled successfully)
- [x] Committed

### Notes
- Mass Impact already had "A/B" orderLabels (e.g. "5A"/"5B") but no `supersetGroup` — those exercises don't get the visual treatment, which is correct per the design
- The superset check uses `orderLabel.toUpperCase().endsWith("A")` — works for both single-letter suffix ("1A") and any future multi-pair setups
- `handleSelectExercise` calls `stopTimer()` internally, so returning early from `handleSaveSet` after calling it correctly skips `startTimer`
