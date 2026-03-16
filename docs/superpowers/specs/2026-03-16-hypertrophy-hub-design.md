# Hypertrophy Hub — Design Spec

Extends the Mass Impact workout app into a multi-program hypertrophy training hub with RP-style volume auto-regulation for both His and Hers profiles.

---

## Decisions Log

1. **Single design doc, phased implementation** — all features designed together, built incrementally
2. **Mass Impact: volume tracking only (Option B)** — no auto-regulation, but volume landmarks shown on dashboard. Manual set/rep overrides allowed.
3. **RAVAGE data: extracted from Boostcamp** — 10 weeks, 6 days/cycle, deloads at weeks 5 & 10, double progression
4. **Rolling 7-day window** for weekly volume calculation
5. **Hers gets 5-day cycles** (matching His) with 3 selectable program templates: LULUL, PPLPP, Custom Glute-Emphasis
6. **Volume auto-regulation** applies to RAVAGE + all three Hers programs
7. **Architecture: Layered Extension (Approach A)** — new modules alongside existing code, don't rewrite Mass Impact internals
8. **Inline SVG for all charts** — no charting library dependency

---

## Architecture Overview

Layered extension of existing codebase. New modules added alongside, existing code minimally modified.

### New Files

```
lib/
  exercise-library.ts       # Shared tagged exercise catalog (~80 exercises)
  program-data-ravage.ts    # RAVAGE 10-week program data
  program-data-hers.ts      # 3 Hers program templates (LULUL, PPLPP, Custom)
  program-registry.ts       # Maps profiles → available programs, handles selection
  volume-engine.ts          # Pure functions: volume calc, auto-regulation logic
  volume-store.ts           # Recovery ratings, meso state, volume targets (localStorage)

components/
  recovery-rating-prompt.tsx # Post-workout muscle group rating UI
  volume-bar.tsx             # Horizontal gauge with MEV/MAV/MRV markers
  sparkline.tsx              # Inline SVG sparkline for trends
  program-selector.tsx       # Dropdown for switching programs

screens/
  volume-screen.tsx          # New /volume route — volume dashboard
```

### Modified Files

```
lib/program-data.ts          # Add programId metadata to Program type
lib/workout-store.ts         # Add programId to WorkoutSession, tag sessions
lib/household-profiles.ts    # Add selectedProgram per profile to ProfilePrefs
components/app-shell.tsx     # Add Volume nav tab, program selector in header
components/screens/today-screen.tsx  # Program-aware queue, superset grouping,
                                      recovery prompt, double progression banner,
                                      manual set/rep override
components/screens/planner-screen.tsx # Variable cycle lengths (5/6 day), deload badges
components/screens/settings-screen.tsx # Meso length setting, volume landmark editor
app/volume/page.tsx          # New route
```

---

## Data Model

### Exercise Library

```typescript
type MuscleGroup =
  | "back" | "chest" | "side_delts" | "rear_delts" | "front_delts"
  | "biceps" | "triceps" | "quads" | "hamstrings" | "glutes"
  | "traps" | "calves" | "abs" | "forearms" | "neck"

type ExerciseType = "stretch" | "compound" | "isolation"
type Equipment = "barbell" | "dumbbell" | "cable" | "machine" | "bodyweight" | "smith_machine"

interface ExerciseDefinition {
  id: string                   // slugified: "incline-db-curl"
  name: string                 // "Incline DB Curl"
  primaryMuscle: MuscleGroup
  secondaryMuscles: { muscle: MuscleGroup; factor: number }[]
  type: ExerciseType
  equipment: Equipment
}
```

Ships with ~80 pre-loaded exercises. Stored in localStorage, shared across profiles. Custom exercise creation is deferred — the data model supports it (exercises stored in localStorage, not hardcoded), but no UI for adding custom exercises is included in this spec. Will be a follow-up feature.

### Program Registry

```typescript
interface ProgramMeta {
  id: string                    // "mass-impact" | "ravage" | "hers-lulul" | etc.
  name: string
  profile: "his" | "hers" | "both"
  daysPerCycle: number
  cycleLength: number           // total weeks or 0 for ongoing
  periodizationType: "block" | "double-progression" | "auto-regulated"
  hasAutoRegulation: boolean
  hasVolumeTracking: boolean    // true for all programs
}
```

**His programs:** Mass Impact (5-day, 12-week, block periodization) | RAVAGE (6-day, 10-week, double progression)
**Hers programs:** LULUL | PPLPP | Custom Glute-Emphasis (all 5-day, ongoing, auto-regulated)

### Workout Store Extensions

```typescript
// Existing WorkoutSession gets new field:
interface WorkoutSession {
  id: string                    // format: {programId}-w{weekNumber}-d{dayNumber}-{timestamp}
  programId: string             // NEW — which program generated this session
  weekNumber: number
  dayNumber: number
  startedAt: number
  completedAt?: number
  sets: LoggedSet[]
}
```

**Migration:** On first load after update, existing sessions (which lack `programId`) get backfilled with `programId: "mass-impact"`. Existing IDs (format `w{week}-d{day}-{timestamp}`) are left as-is — only new sessions use the new format. The volume engine and dashboard query by `programId` field, not by ID parsing.

### Program Data Adapter

All programs produce exercises through a shared `ProgramExercise` shape at render time. The existing `ProgramExercise` type (from `program-data.ts`) is the canonical format. RAVAGE and Hers programs store data in their own formats internally (e.g., `RavageExercise`) but are adapted to `ProgramExercise` via a `getExercisesForDay(programId, dayNumber, weekNumber)` function in `program-registry.ts`.

```typescript
// program-registry.ts exports:
function getExercisesForDay(programId: string, dayNumber: number, weekNumber: number): ProgramExercise[]
function getAvailablePrograms(profile: HouseholdUser): ProgramMeta[]
function getDayTitle(programId: string, dayNumber: number): string
```

This means `today-screen.tsx` always works with `ProgramExercise[]` regardless of which program is active. The adapter handles RAVAGE's deload weeks (1 set per exercise) and superset grouping internally.

### Program Selection Flow

Lookup chain: `household-profiles.ts` stores `selectedProgram: string` per profile in `ProfilePrefs`. When the app loads or the profile toggles, `app-shell.tsx` reads the selected program ID from prefs, passes it to child screens. `today-screen.tsx` calls `getExercisesForDay(selectedProgram, day, week)` to get the exercise queue. `program-store.ts` continues to handle Mass Impact's existing custom program CRUD — it's not modified. For RAVAGE and Hers programs, the data comes from their static data files, not from `program-store.ts`.

### Volume Store (new)

```typescript
type VolumeLandmarks = Record<MuscleGroup, { mev: number; mavLow: number; mavHigh: number; mrvLow: number; mrvHigh: number }>

interface MesocycleState {
  mesoNumber: number
  weekInMeso: number
  mesoLength: number            // 4 or 5, user-configurable, default 5
  startDate: number
  weeklyTargets: Record<MuscleGroup, number>
}

interface RecoveryRating {
  date: number
  sessionId: string
  ratings: Partial<Record<MuscleGroup, number>>  // -2 to +2, only muscles trained that session
}
```

Storage keys (per profile): `mi_volume_state`, `mi_recovery_ratings`, `mi_volume_landmarks`

---

## Volume Landmarks — Defaults

### His Profile

| Muscle Group | MEV | MAV Low | MAV High | MRV Low | MRV High |
|---|---|---|---|---|---|
| Back | 8 | 14 | 18 | 20 | 25 |
| Chest | 8 | 12 | 18 | 20 | 22 |
| Side Delts | 6 | 12 | 18 | 20 | 26 |
| Rear Delts | 6 | 10 | 14 | 16 | 22 |
| Biceps | 4 | 10 | 16 | 16 | 20 |
| Triceps | 4 | 8 | 14 | 14 | 18 |
| Quads | 6 | 12 | 18 | 18 | 24 |
| Hamstrings | 4 | 8 | 14 | 14 | 18 |
| Glutes | 0 | 4 | 10 | 12 | 16 |
| Traps | 4 | 8 | 12 | 14 | 20 |
| Calves | 4 | 8 | 12 | 14 | 16 |
| Abs | 0 | 6 | 12 | 14 | 18 |

### Hers Profile

| Muscle Group | MEV | MAV Low | MAV High | MRV Low | MRV High |
|---|---|---|---|---|---|
| Glutes | 6 | 12 | 18 | 20 | 24 |
| Hamstrings | 6 | 10 | 16 | 16 | 20 |
| Quads | 6 | 10 | 16 | 16 | 22 |
| Back | 6 | 10 | 14 | 16 | 20 |
| Side Delts | 6 | 10 | 14 | 16 | 20 |
| Rear Delts | 4 | 8 | 12 | 14 | 18 |
| Biceps | 2 | 6 | 10 | 12 | 16 |
| Triceps | 2 | 6 | 10 | 12 | 16 |
| Chest | 2 | 4 | 8 | 10 | 14 |
| Calves | 4 | 6 | 10 | 12 | 16 |
| Traps | 2 | 6 | 10 | 10 | 14 |
| Abs | 2 | 6 | 10 | 12 | 16 |

User-editable. These are starting points.

**Excluded from landmark tables:** `front_delts`, `neck`, `forearms`. Front delts get sufficient indirect stimulus from pressing and don't need dedicated volume tracking. Neck and forearms are optional accessories (RAVAGE Day 6 only) — their volume is logged but not auto-regulated or shown on the dashboard. The `MuscleGroup` type includes them for exercise tagging, but the volume dashboard only renders muscle groups that have landmark entries.

---

## Volume Engine — Auto-Regulation Logic

### Core Functions (pure, no side effects)

**`calculateWeeklyVolume(sessions, exerciseLibrary, windowDays=7)`**
Rolls through last 7 calendar days of sessions. Maps each logged set to exercise definition by name. Counts direct sets (1.0) and indirect sets (via `secondaryMuscles` with their `factor`) per muscle group. Returns `Record<MuscleGroup, { direct: number; total: number }>`. If a logged exercise name doesn't match any `ExerciseDefinition`, those sets are silently skipped (not counted toward volume). This handles renamed exercises or one-off logged movements without crashing.

**`calculateRecoveryAverage(ratings, muscle, window)`**
Averages recovery ratings for a muscle group over the current week. Returns -2 to +2.

**`getVolumeRecommendation(currentVolume, recoveryAvg, landmarks, currentTargets)`**
Auto-regulation thresholds:
- Avg +1.5 to +2 → add 2 sets
- Avg +0.5 to +1.4 → add 1 set
- Avg -0.5 to +0.4 → keep same
- Avg -1.5 to -0.6 → remove 1 set
- Avg -2 to -1.6 → remove 2 sets

Clamped to MEV floor and MRV ceiling.

**`suggestSetPlacement(muscle, action, programExercises, exerciseLibrary)`**
Adding sets priority: `"stretch"` first → `"isolation"` → `"compound"` (matches `ExerciseType` enum).
Removing sets priority: `"compound"` first → `"isolation"` → `"stretch"`.

**`isDeloadDue(mesoState)`** / **`advanceMeso(mesoState, recommendations)`**
Manages mesocycle progression. Deload behavior (applies to RAVAGE and all Hers programs):
- When `weekInMeso > mesoLength`, deload is due
- Deload week: all muscle groups drop to MEV volume targets. The program template exercises stay the same, but the system recommends reducing sets to MEV levels. User still logs normally.
- RAVAGE has built-in deload weeks (5 and 10) where all exercises drop to 1 set — these override the meso deload system.
- After deload: new meso starts. `weeklyTargets` reset to previous meso's starting targets or slightly above (+1 set on muscles that recovered well).

### Indirect Volume Mappings

Indirect volume is derived from `ExerciseDefinition.secondaryMuscles` — each entry has a `muscle` and `factor` (typically 0.5). No separate hardcoded mapping table. Example secondary mappings baked into the exercise library data:

- Rows/pull-ups → `{ muscle: "biceps", factor: 0.5 }`
- Pressing (bench, OHP, dips) → `{ muscle: "triceps", factor: 0.5 }`, `{ muscle: "front_delts", factor: 0.5 }`
- Squats/leg press → `{ muscle: "glutes", factor: 0.5 }`
- RDLs → `{ muscle: "glutes", factor: 0.5 }`
- Bulgarian split squat → `{ muscle: "glutes", factor: 0.5 }`
- Hip thrust → `{ muscle: "hamstrings", factor: 0.5 }`

The volume engine reads these from the exercise library, not from a separate list.

### Mass Impact Behavior

Recovery ratings still collected. Volume dashboard shows landmarks (read-only). No auto-regulation recommendations generated. Manual set/rep overrides allowed.

---

## RAVAGE Program Data

10 weeks, 6 days/cycle. Same exercises every week (double progression). Weeks 5 and 10 are deloads (all exercises drop to 1 set).

### Day 1 — Legs A

| # | Exercise | Sets | Reps | RPE |
|---|---|---|---|---|
| 1 | Smith Machine Hack Squat | 2 (set 1: 5-10, set 2: 10-15) | 5-15 | RPE 7-8 |
| 2 | Back Extension (Weighted) | 2 | 8-15 | RPE 8-9 |
| 3 | Walking Lunge | 2 | 20-30 | — |
| 4 | Seated Hamstring Curl | 2 | 8-12 | — |

### Day 2 — Torso A (supersets)

| # | Exercise | Sets | Reps | RPE |
|---|---|---|---|---|
| 1A | Close Grip Larsen Press | 3 | 6-8 | RPE 9-10 |
| 1B | Narrow Neutral Pulldown | 3 | 8-12 | RPE 10 |
| 2A | Smith Reverse Grip Bench | 2 | 8-12 | RPE 8-9 |
| 2B | Wide Overhand Pulldown | 2 | 10-15 | RPE 10 |
| 3A | Cable Crossover | 2 | 10-15 | RPE 10 |
| 3B | 1 Arm Machine Row | 2 | 10-15 | RPE 10 |
| 4 | Standing Cable Pullover | 1 | 15-20 | — |

### Day 3 — Bro A (supersets)

| # | Exercise | Sets | Reps | RPE |
|---|---|---|---|---|
| 1A | Hammer Curl | 2 | 15-20 | RPE 10 |
| 1B | Tricep Pushdown | 2 | 8-15 | RPE 10 |
| 2A | Incline Dumbbell Curl | 2 | 6-10 | RPE 9-10 |
| 2B | Standing Overhead Extension | 2 | 8-15 | RPE 10 |
| 3 | Cable Lateral Raise | 2 | 10-15 | — |
| 4 | Upright Row (Barbell) | 2 | 15-20 | RPE 10 |

### Day 4 — Legs B

| # | Exercise | Sets | Reps | RPE |
|---|---|---|---|---|
| 1 | Back Squat | 2 | 8-12 | RPE 8-9 |
| 2 | Romanian Deadlift | 2 | 8-10 | RPE 7-9 |
| 3 | Hip Thrust | 2 | 12-20 | — |
| 4A | Seated Hamstring Curl | 2 | 8-15 | RPE 10 |
| 4B | Leg Extension | 2 | 15-20 | RPE 10 |

### Day 5 — Torso B (supersets)

| # | Exercise | Sets | Reps | RPE |
|---|---|---|---|---|
| 1A | Bench Press (Barbell) | 2 | 8-12 | RPE 8-9 |
| 1B | Wide Neutral Pulldown | 2 | 10-15 | RPE 10 |
| 2A | Chest Press (Machine) | 2 | 6-12 | RPE 9-10 |
| 2B | Helms Row | 2 | 10-20 | — |
| 3A | Seated Shoulder Press (Dumbbell) | 2 | 6-12 | RPE 10 |
| 3B | Seated Row (Cable) | 2 | 8-15 | — |

### Day 6 — Bro B (supersets)

| # | Exercise | Sets | Reps | RPE |
|---|---|---|---|---|
| 1A | Hammer Curl | 2 | 15-20 | — |
| 1B | Leaning Overhead Extension | 2 | 10-15 | RPE 10 |
| 2A | Bicep Curl (Barbell) | 2 | 8-12 | RPE 9-10 |
| 2B | Tricep Pushdown | 2 | 8-15 | RPE 10 |
| 3 | Lateral Raise (Machine) | 2 | 12-20 | — |
| 4 | Lu Lateral Raise | 2 | 10-15 | RPE 10 |
| 5 | Cable Rear Delt | 2 | 15-20 | — |
| 6A | Neck Flexion | 1 | 15-20 | RPE 8-9 |
| 6B | Wrist Flexion/Extension | 1 | 15-20 | — |

### RAVAGE Data Structure

```typescript
// Internal storage format — adapted to ProgramExercise[] at render time
// via getExercisesForDay() in program-registry.ts (see Program Data Adapter section)
interface RavageProgram {
  id: "ravage"
  weeks: { weekNumber: number; isDeload: boolean }[]
  dayTemplates: RavageDayTemplate[]
}

interface RavageDayTemplate {
  dayNumber: number
  title: string
  exercises: RavageExercise[]
}

interface RavageExercise {
  orderLabel: string           // "1", "1A", "1B", "2A", etc.
  name: string                 // must match an ExerciseDefinition.name in the exercise library
  sets: number
  repRange: string             // "8-12", "15-20", etc.
  rpe?: string                 // "RPE 8-9", "RPE 10", etc.
  supersetGroup?: string       // "1", "2", etc. — exercises with same group are supersetted
}
```

The same internal-format-with-adapter pattern applies to Hers programs. Each Hers template stores exercises as a list with `name`, `setsxreps`, and `type`, adapted to `ProgramExercise[]` by the same `getExercisesForDay()` function.

### Double Progression Tracking

UI-only calculation. When all logged sets for an exercise hit the ceiling of the rep range, show "Bump weight next time" banner. No automatic weight changes.

---

## Hers Program Templates

All three are 5-day cycles, ongoing (mesocycle-based, no fixed end), auto-regulated.

### LULUL (Glute Emphasis) — 3 Lower / 2 Upper

**Day 1: Lower A — Glute + Hamstring**
1. Barbell Squat (below parallel) — 3x6-10 — compound
2. Romanian Deadlift — 3x8-12 — stretch
3. B-Stance Hip Thrust — 3x10-15 — compound
4. Lying Leg Curl — 3x10-15 — stretch
5. Cable Pull-Through — 2x12-15 — stretch
6. Standing Calf Raise — 3x10-15 — stretch

**Day 2: Upper A — Back + Shoulders**
1. Lat Pulldown — 3x8-12 — compound
2. Seated Cable Row — 3x10-12 — compound
3. Cable Lateral Raise — 3x12-15 — stretch
4. Rear Delt Cable Fly — 3x12-15 — stretch
5A. Incline DB Curl — 2x10-12 — stretch (superset)
5B. Overhead Cable Tricep Extension — 2x10-12 — stretch (superset)
6. Face Pull — 2x12-15 — compound

**Day 3: Lower B — Glute + Quad**
1. Bulgarian Split Squat — 3x8-12 each — stretch
2. Leg Press (feet high and wide) — 3x10-15 — compound
3. Hip Thrust (Barbell) — 3x8-12 — compound
4. Leg Extension — 3x10-15 — stretch
5. Seated Leg Curl — 3x10-15 — stretch
6. Seated Calf Raise — 3x12-15 — stretch

**Day 4: Upper B — Shoulders + Arms**
1. DB Shoulder Press — 3x8-12 — compound
2. Single Arm Cable Row — 3x10-12 — compound
3. Cable Lateral Raise — 2x12-15 — stretch
4. Rear Delt Cable Fly — 2x12-15 — stretch
5A. Hammer Curl — 2x10-12 — isolation (superset)
5B. Tricep Pushdown — 2x10-12 — isolation (superset)
6. Cable Crunch — 2x12-15 — compound

**Day 5: Lower C — Glute Pump + Accessories**
1. Walking Lunge (DB) — 3x12-15 each — compound
2. Cable Kickback or Glute-Focused Back Extension — 3x12-15 — stretch
3. Step-Up (High Box) — 2x10-12 each — compound
4. Lying Leg Curl or Nordic Curl — 2x10-15 — stretch
5. Standing Calf Raise — 3x10-15 — stretch

### PPLPP (Matching His Structure) — 2 Pull / 2 Push / 1 Legs

Same Pull/Push/Legs/Pull/Push day structure as Mass Impact but exercise selection prioritizes glutes (via indirect from compounds + accessories), stretch-position movements, and Hers aesthetics (shoulders for taper, back for V-taper, glute accessories on leg day).

**Day 1: Pull A — Back + Rear Delts + Biceps**
1. Lat Pulldown (wide grip) — 3x8-12 — compound
2. Seated Cable Row — 3x10-12 — compound
3. Rear Delt Cable Fly — 3x12-15 — stretch
4. Face Pull — 2x12-15 — compound
5. Incline DB Curl — 2x10-12 — stretch

**Day 2: Push A — Shoulders + Chest + Triceps**
1. DB Shoulder Press — 3x8-12 — compound
2. Cable Lateral Raise — 3x12-15 — stretch
3. Incline DB Fly — 2x10-15 — stretch
4. Lu Lateral Raise — 2x10-15 — stretch
5. Overhead Cable Tricep Extension — 2x10-12 — stretch

**Day 3: Legs — Glute + Quad + Hamstring**
1. Barbell Squat (below parallel) — 3x6-10 — compound
2. Romanian Deadlift — 3x8-12 — stretch
3. Bulgarian Split Squat — 3x8-12 each — stretch
4. Leg Extension — 3x10-15 — stretch
5. Lying Leg Curl — 3x10-15 — stretch
6. Standing Calf Raise — 3x10-15 — stretch

**Day 4: Pull B — Back + Rear Delts + Biceps**
1. Single Arm Cable Row — 3x10-12 — compound
2. Wide Overhand Pulldown — 3x10-15 — compound
3. Rear Delt Cable Fly — 2x12-15 — stretch
4. Cable Pullover — 2x12-15 — stretch
5A. Hammer Curl — 2x10-12 — isolation (superset)
5B. Cable Crunch — 2x12-15 — compound (superset)

**Day 5: Push B — Shoulders + Chest + Triceps**
1. Cable Lateral Raise — 3x12-15 — stretch
2. DB Shoulder Press — 2x8-12 — compound
3. Cable Crossover — 2x10-15 — stretch
4. Rear Delt Cable Fly — 2x12-15 — stretch
5A. Tricep Pushdown — 2x10-12 — isolation (superset)
5B. Face Pull — 2x12-15 — compound (superset)

### Custom Glute-Emphasis 5-Day

**Day 1: Glute + Ham**
1. Barbell Squat (below parallel) — 3x6-10 — compound
2. Romanian Deadlift — 3x8-12 — stretch
3. B-Stance Hip Thrust — 3x10-15 — compound
4. Lying Leg Curl — 3x10-15 — stretch
5. Cable Pull-Through — 2x12-15 — stretch

**Day 2: Push + Side Delts**
1. DB Shoulder Press — 3x8-12 — compound
2. Cable Lateral Raise — 3x12-15 — stretch
3. Incline DB Fly — 2x10-15 — stretch
4. Lu Lateral Raise — 2x10-15 — stretch
5. Overhead Cable Tricep Extension — 2x10-12 — stretch

**Day 3: Glute + Quad**
1. Bulgarian Split Squat — 3x8-12 each — stretch
2. Leg Press — 3x10-15 — compound
3. Hip Thrust (Barbell) — 3x8-12 — compound
4. Leg Extension — 3x10-15 — stretch
5. Seated Calf Raise — 3x12-15 — stretch

**Day 4: Pull + Rear Delts**
1. Lat Pulldown — 3x8-12 — compound
2. Seated Cable Row — 3x10-12 — compound
3. Rear Delt Cable Fly — 3x12-15 — stretch
4. Face Pull — 2x12-15 — compound
5. Incline DB Curl — 2x10-12 — stretch

**Day 5: Glute Pump + Arms + Abs**
1. Walking Lunge (DB) — 2x12-15 each — compound
2. Cable Kickback or Glute Back Extension — 2x12-15 — stretch
3A. Hammer Curl — 2x10-12 — isolation (superset)
3B. Tricep Pushdown — 2x10-12 — isolation (superset)
4. Cable Crunch — 2x12-15 — compound
5. Standing Calf Raise — 2x10-15 — stretch

### Exercise Selection Priorities (Hers)

Glutes: stretch-position / deep hip flexion movements lead. Bulgarian split squat, RDL, deep squat, walking lunge, B-stance hip thrust, cable pull-through, glute back extension, high box step-up. Hip thrusts supplement (shortened position), they don't lead.

---

## Volume Dashboard (`/volume`)

New screen, 6th tab in bottom nav (between Progress and Templates).

### Layout (single scrollable screen)

**Top: Meso Overview**
- Meso number + week in meso ("Meso 2 — Week 3 of 5")
- Deload countdown
- Program name badge
- Mass Impact shows "Week 7 of 12" instead

**Main: Muscle Group Cards (vertically stacked)**
Per card:
- Muscle name + current weekly volume (large number)
- Horizontal volume bar with MEV / MAV range / MRV markers, color-coded fill:
  - Gray: below MEV
  - Green: MEV to mid-MAV
  - Yellow: upper MAV
  - Red: at/near MRV
- Direct vs Total toggle (switches between direct-only and direct+indirect)
- Trend sparkline (volume across current meso weeks)
- Recovery trend dots (colored green/yellow/red)
- Recommendation badge (auto-reg programs only): "+1 set → Incline DB Curl" / "Hold" / "-1 set → Bench Press"

**Bottom: Meso History (collapsed by default)**
- Previous mesocycles: volume at start vs end
- Total sets over time line chart

### Charting

All inline SVG. No charting library. Volume bars are styled divs. Sparklines are SVG polylines.

---

## UI Changes Summary

### New Components
- `program-selector.tsx` — dropdown in app shell header
- `recovery-rating-prompt.tsx` — post-workout muscle group rating
- `volume-bar.tsx` — horizontal gauge with landmark markers
- `sparkline.tsx` — inline SVG trend line
- `volume-screen.tsx` — full dashboard screen

### Today Screen Additions
- Program-aware exercise queue (calls `getExercisesForDay()` with active program)
- Superset visual grouping (A/B pairs shown as linked cards with shared rest timer)
- Double progression "Bump weight" banner (RAVAGE — shown when all logged sets hit rep ceiling)
- Recovery rating prompt on workout completion (inline at bottom, not a separate screen)
- Manual set/rep override: tap the prescribed scheme (e.g., "3x8-12") to edit sets and rep range for this session only. Override is stored in the `WorkoutSession` record, not in the program template. Doesn't affect future sessions. This is distinct from the existing template editor in Mass Impact, which permanently changes the program template. Both can coexist — template editor for permanent changes, inline override for session-specific adjustments.

### Planner Screen Changes
- **Cycle-based display:** Replace the fixed Mon-Sun 7-day grid with a cycle-length grid (5 slots for Mass Impact/Hers, 6 for RAVAGE). Each slot shows the day title ("Legs A", "Pull A", etc.). The cycle repeats — user navigates between cycles via left/right arrows.
- **Week label:** Shows "Week 3 of 12" for fixed-length programs or "Meso 2 — Week 3 of 5" for auto-regulated programs.
- **Deload badges:** Deload weeks get a "DELOAD" badge on the week header. For RAVAGE, weeks 5 and 10. For auto-regulated programs, the last week of each meso.
- **Calendar mapping is not shown:** The planner shows the logical cycle (Day 1, Day 2, etc.), not which calendar day they fall on. Users train every-other-day and don't need a Mon-Sun view.

### Settings Screen Additions
- Meso length setting (4 or 5 weeks, default 5)
- Volume landmark editor (per muscle group, per profile)
- Reset landmarks to defaults button

### Navigation
- 6th tab: Volume (between Progress and Templates)

---

## Data Persistence

All localStorage. Per-profile where noted.

**Per profile:**
- Selected program ID
- Current position (week, day, meso)
- Volume targets per muscle group per week
- Volume landmark settings (MEV/MAV/MRV, user-editable)
- Workout log (date, exercises, sets, reps, weight, RPE)
- Recovery ratings per muscle group per workout
- Mesocycle history

**Shared across profiles:**
- Exercise library (built-in + custom)
- App settings

---

## What NOT to Build

- No social features
- No meal tracking or nutrition
- No cardio tracking
- No 1RM calculators or strength-focused metrics
- No exercise demonstration videos or images
- No AI-generated workout suggestions — programs are fixed, auto-regulation only adjusts set counts

---

## Implementation Phases (suggested)

**Phase 1: Foundation**
- Exercise library with tags
- Program registry + program selector
- Workout store extensions (programId on sessions)

**Phase 2: RAVAGE**
- RAVAGE program data
- Double progression tracking + "bump weight" banner
- Superset grouping in today screen
- 6-day cycle support in planner

**Phase 3: Volume System**
- Volume engine (pure functions)
- Volume store (recovery ratings, meso state)
- Recovery rating prompt post-workout
- Volume dashboard screen + nav tab

**Phase 4: Hers Programs**
- Three Hers program templates (LULUL, PPLPP, Custom)
- Profile-specific volume landmark defaults
- Settings: landmark editor, meso length

**Phase 5: Polish**
- Manual set/rep overrides
- Deload indicators
- Meso history
- Settings refinements
