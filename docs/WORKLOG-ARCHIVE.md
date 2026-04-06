# Work Log Archive — Hypertrophy Hub Tasks 1–18

## 2026-03-16 — Hypertrophy Hub Design + Planning
- Explored full codebase, reviewed RAVAGE Boostcamp data
- Wrote design spec: `docs/superpowers/specs/2026-03-16-hypertrophy-hub-design.md`
- Two spec review rounds (7 blocking issues resolved)
- Wrote implementation plan: `docs/superpowers/plans/2026-03-16-hypertrophy-hub.md`
- Four plan review rounds — all approved

## Tasks Completed (commits in order)

| Task | What | Commit |
|------|------|--------|
| 1 | `web/src/lib/types.ts` — MuscleGroup, ProgramMeta, VolumeLandmarks, MesocycleState, TRACKED_MUSCLES | — |
| 2 | `web/src/lib/exercise-library.ts` — 80 exercises, findExercise, getExercisesForMuscle | — |
| 3 | `web/src/lib/program-registry.ts` — PROGRAM_REGISTRY, getProgramMeta, getExercisesForDay adapter | — |
| 4 | workout-store.ts — added selectedProgram to ProfilePrefs, programId to WorkoutSession, migration | — |
| 5 | `web/src/components/program-selector.tsx` + app-shell.tsx integration + Volume nav tab | a06ce9f |
| 6 | Volume route placeholder `/volume` | — |
| 7 | `web/src/lib/program-data-ravage.ts` — 6 day templates; RAVAGE adapter in program-registry.ts | 0dedd9c |
| 8 | today-screen.tsx — program-aware queue, uses program-registry for all non-Mass-Impact programs | 675ad48 |
| 9 | Superset visual grouping — supersetGroup prop through ProgramExercise → QueueExercise → ExerciseQueueCard | — |
| 10 | Double progression tracking (Task 10) | — |
| 11 | planner-screen.tsx — cycle-based grid (replaces hardcoded 7-day Mass Impact only view) | 42ddff5 |
| 12 | Vitest installed and configured | — |
| 13 | `web/src/lib/volume-engine.ts` — 6 pure functions, 22 tests passing | 2b6e54c |
| 14 | `web/src/lib/volume-store.ts` — localStorage CRUD for landmarks, recovery ratings, meso state | b5f62ac |
| 15 | `web/src/components/recovery-rating-prompt.tsx` + two-phase workout completion flow | 03b27f8 |
| 16 | `web/src/components/volume-bar.tsx` + `web/src/components/sparkline.tsx` | 64198dd |
| 17 | Volume dashboard screen — meso header, MuscleCard per muscle, sparklines, recovery dots, recommendations | 70efbf1 |
| 18 | `web/src/lib/program-data-hers.ts` — 3 Hers programs (LULUL, PPLPP, Custom), 15 day templates | e70eeb1 |

## Key Architecture Decisions
- All program exercise data goes through `getExercisesForDay(programId, day, week)` adapter
- Volume data stored per-profile: `Record<HouseholdUser, T>` pattern with `mi_` key prefix
- Recovery rating uses two-phase completion (capture → prompt → finalize) to avoid session lifecycle issues
- Mass Impact uses program-store (supports template edits); all other programs use registry directly
- Auto-reg detection via `programMeta.hasAutoRegulation` — Mass Impact is false, all others true
