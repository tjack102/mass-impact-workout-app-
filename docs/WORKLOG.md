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

## HANDOFF

### Current State
- Tasks 1–4 complete and committed
- Build passing
- Ready for Task 5

### Next Steps
1. Task 5: Program Selector + App Shell Integration
2. Task 6: Volume Route Placeholder

### Key Files
- Spec: `docs/superpowers/specs/2026-03-16-hypertrophy-hub-design.md`
- Plan: `docs/superpowers/plans/2026-03-16-hypertrophy-hub.md`
- Types: `web/src/lib/types.ts`
- Exercise library: `web/src/lib/exercise-library.ts`
- Program registry: `web/src/lib/program-registry.ts`
- Household profiles: `web/src/lib/household-profiles.ts` (now has selectedProgram)
- Workout store: `web/src/lib/workout-store.ts` (now has programId + migration)
- RAVAGE raw data: `ravage.md` at project root
