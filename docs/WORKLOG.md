# Work Log

_History through UX Overhaul archived in `docs/WORKLOG-ARCHIVE.md`_

---

## 2026-04-07 -- Perf: Fix Triple getPrefs() in AppShell (Task 10) -- COMPLETE

### Goal
Eliminate redundant `getPrefs()` calls in AppShell component. The function calls `localStorage.getItem + JSON.parse` each time, and was being called multiple times within a single render cycle.

### What Was Done
[x] Step 1: Removed `const initialPrefs = getPrefs()` variable (line 36)
[x] Step 2: Converted useState init to lazy form: `useState<HouseholdUser>(() => getPrefs().activeUser)` -- init runs once, not on every render
[x] Step 3: Fixed `setActiveUser` function to cache result: `const current = getPrefs()` then reuse instead of calling getPrefs() twice
[x] Step 4: Type check -- 0 errors
[x] Step 5: Committed (b3787d6)

### Details
- **Before**: `initialPrefs` was read at line 36, then `getPrefs()` called again at line 38 (currentWeek), then called up to 3 times in setActiveUser (line 55)
- **After**: Line 38 still calls getPrefs() once for currentWeek (expected per component lifetime), lazy init avoids init call, setActiveUser caches to 1 call
- Net reduction: 2-3 redundant localStorage reads per component lifecycle

### Verification
- TypeScript check: 0 errors
- All changes match task spec exactly
- Commit: b3787d6

### Next: Task 11
Batch localStorage reads in queueExercises useMemo.

---

## 2026-04-07 -- Perf: Batch localStorage reads in queueExercises memo (Task 11) -- COMPLETE

### Goal
Eliminate 8 redundant `localStorage.getItem + JSON.parse` calls in queueExercises useMemo. Currently `getPermanentSub()` is called for each exercise, each doing a full load. Load once via `getAllPermanentSubs()`, then lookup from the resulting map.

### What Was Done
[x] Step 1: Verified getAllPermanentSubs exists in exercise-substitutions.ts (returns Record<string, string>)
[x] Step 2: Added getAllPermanentSubs to import on line 55
[x] Step 3: Added `const allSubs = getAllPermanentSubs(prefs.activeUser)` at top of queueExercises memo (line 338)
[x] Step 4: Replaced `getPermanentSub(prefs.activeUser, programId, prefs.currentDay, exercise.name)` with direct map lookup: `const subKey = \`${programId}:${prefs.currentDay}:${exercise.name}\`; const permanentSub = allSubs[subKey];` (lines 351-352)
[x] Step 5: Checked getPermanentSub usage -- no longer called, removed from import; setPermanentSub and clearPermanentSub still used at lines 919 and 1719
[x] Step 6: Type check -- 0 errors; Vitest -- 195 passed
[x] Step 7: Committed (f450b1b)

### Details
- **Optimization**: Instead of 8 calls to `getPermanentSub()` (each doing localStorage.getItem + JSON.parse), now 1 call to `getAllPermanentSubs()` and 8 direct map lookups
- **Key format**: Matches buildKey format in exercise-substitutions.ts -- `${programId}:${day}:${exerciseName}`
- **Net reduction**: 7 redundant localStorage reads per queueExercises memo execution

### Verification
- TypeScript: 0 errors
- Vitest: 195 tests pass
- Git: Commit f450b1b

### Next: Task 12
Pre-compute lastPerformanceMap in useMemo to avoid repeated sessionHistory lookups.

---

## 2026-04-07 -- Dead Code: Remove workoutRestSeconds State (Task 8) -- COMPLETE

### Goal
Remove the dead state variable `workoutRestSeconds` from `web/src/components/screens/today-screen.tsx`. It's written but never read.

### What Was Done
[x] Step 1: Removed state declaration `const [workoutRestSeconds, setWorkoutRestSeconds] = useState(0);` (line 227)
[x] Step 2: Removed setWorkoutRestSeconds call from finalizeRest (line 414: `setWorkoutRestSeconds((prev) => prev + loggedSeconds);`)
[x] Step 3: Removed setWorkoutRestSeconds call from Cancel Workout handler (line 1799: `setWorkoutRestSeconds(0);`)
[x] Step 4: Type check -- 0 errors
[x] Step 5: Committed (b3a6b28)

### Verification
- TypeScript check: 0 errors
- All 3 call sites removed
- Commit: b3a6b28

### Next: Task 9
Conditional 1-second interval.

---

## 2026-04-07 -- Perf: Map Index for findExercise (Task 7) -- COMPLETE

### Goal
Replace O(N) `.find()` iteration in `findExercise(query)` with O(1) Map lookup for exact-match case. The function is called 6-8 times during active workouts in `queueExercises` useMemo, so this optimization helps latency on set-save operations.

### What Was Done
[x] Step 1: Created test file (`web/src/lib/__tests__/exercise-library.test.ts`) with 6 test cases
[x] Step 2: Ran tests with current implementation -- all 6 PASS (baseline)
[x] Step 3: Added EXERCISE_MAP at module load time, updated findExercise to use Map.get() for exact match
[x] Step 4: Ran tests with new implementation -- all 6 PASS
[x] Step 5: Full test suite (195 tests) + TypeScript check -- all PASS, 0 errors
[x] Step 6: Committed (3be995c)

### Details
- EXERCISE_MAP built at module load from EXERCISE_LIBRARY.map() -- O(N) once, then O(1) per lookup
- Exact match now uses Map.get() instead of .find() iteration
- Prefix match falls back to O(N) .find(), but rarely hit in practice
- ExerciseDefinition type already imported in file, no new imports needed

### Verification
- All 6 new tests pass (exact match, lowercase, prefix, undefined for nonsense, prefer exact over prefix)
- All 195 tests in suite pass
- 0 TypeScript errors
- Commit: 3be995c

### Next: Task 8
Remove dead workoutRestSeconds state.

---

## 2026-04-07 -- Codebase Cleanup: Format Utils Migration (Task 4) -- COMPLETE

### Goal
Replace local formatting functions in 5 files with imports from `web/src/lib/format-utils.ts`, which exports `formatMuscleName`, `formatClock`, `formatDuration`.

### What Was Done
[x] File 1: recovery-rating-prompt.tsx -- removed local `formatMuscleName()`, added import
[x] File 2: settings-screen.tsx -- removed local `muscleName()`, added import, replaced 2 call sites
[x] File 3: volume-content.tsx -- removed local `toTitleCase()`, added import, replaced 2 call sites
[x] File 4: rest-timer-dial.tsx -- removed local `formatClock()`, added import
[x] File 5: today-screen.tsx (1838 lines) -- complex:
  - Removed local `formatElapsed()` (replaced call with `formatClock`)
  - Removed local `formatDuration()`
  - Updated `formatMuscleGroup()` to use `formatMuscleName()` for primary and secondary muscle formatting
  - Added import for all 3 functions

### Verification
- Vitest: 7 files, 189 tests -- all PASS
- TypeScript: `npx tsc --noEmit` -- 0 errors
- All call sites verified working (no orphaned function calls)

### Modified Files
- `web/src/components/recovery-rating-prompt.tsx`
- `web/src/components/screens/settings-screen.tsx`
- `web/src/components/screens/volume-content.tsx`
- `web/src/components/rest-timer-dial.tsx`
- `web/src/components/screens/today-screen.tsx`

### Next: Task 5
Export getRpTemplate, kill duplicates.

---

## 2026-04-07 -- Codebase Cleanup: Storage Utils (Task 1) -- COMPLETE

### Goal
Extract shared `readJson/writeJson` helpers from 3 store files (workout-store.ts, volume-store.ts, rp-store.ts) into single source of truth: `web/src/lib/storage-utils.ts`.

### What Was Done
[x] Step 1: Created test file (`web/src/lib/__tests__/storage-utils.test.ts`)
[x] Step 2: Ran test to verify it fails (module not found -- expected)
[x] Step 3: Created implementation (`web/src/lib/storage-utils.ts`)
[x] Step 4: Ran test to verify it passes (4 tests PASS)
[x] Step 5: Committed (bceb5f6)

### Implementation
- `readJson(key)` -- reads localStorage with SSR guard, parses JSON, returns null on error
- `writeJson(key, value)` -- writes to localStorage with SSR guard, serializes to JSON
- Both handle missing keys, corrupt JSON, and SSR gracefully

### Verification
- 4 tests pass: missing key, JSON parse, corrupt JSON, serialization
- TypeScript: 0 errors (`npx tsc --noEmit` passes)
- Commit: `git log --oneline | head -1` → bceb5f6

### Files Created
- `web/src/lib/storage-utils.ts`
- `web/src/lib/__tests__/storage-utils.test.ts`

### Next: Task 2
Migrate workout-store.ts, volume-store.ts, rp-store.ts to use shared helpers.

---

## 2026-04-07 -- Exercise Library Audit & Expansion -- COMPLETE

### Goal
Audit all templates for missing swap alternatives in the exercise picker. The swap modal only shows exercises with `tier: "S"` or `tier: "A"`, so many existing exercises were invisible (e.g., hamstrings showed only 4 options despite having 10 exercises).

### Root Cause
`web/src/components/exercise-picker-modal.tsx:47` filters to `e.tier === "S" || e.tier === "A"`. 45 of 197 exercises had no tier assigned.

### What Was Done
- Launched 8 parallel audit agents (one per template group + tier audit)
- Added tier assignments to all ~156 previously untiered exercises
- Upgraded Incline Curl (Dumbbell) from A to S tier (THE stretch-position bicep exercise)
- Added 32 new staple exercises across all muscle groups
- Cardio intentionally left untiered (placeholder entry)

### New Exercises Added (32)
- **Back (4):** Chin-Up (Bodyweight), Pendlay Row, Seal Row, Inverted Row (Bodyweight)
- **Chest (2):** Decline Bench Press (Barbell), Decline Dumbbell Press
- **Side Delts (1):** Leaning Lateral Raise (Dumbbell)
- **Rear Delts (2):** Rear Delt Fly (Dumbbell), Band Pull-Apart
- **Front Delts (3):** Front Raise (Dumbbell), Front Raise (Cable), Smith Machine Shoulder Press
- **Traps (1):** Cable Shrug
- **Quads (3):** Goblet Squat, Belt Squat, Split Squat (Dumbbell)
- **Hamstrings (3):** Glute Ham Raise, Standing Leg Curl (Machine), Cable Romanian Deadlift
- **Glutes (4):** Hip Thrust (Machine), Reverse Lunge (Dumbbell), Curtsy Lunge, Reverse Hyperextension
- **Calves (2):** Donkey Calf Raise, Single-Leg Calf Raise
- **Biceps (2):** Concentration Curl, Reverse Curl (Barbell)
- **Triceps (2):** Diamond Push-Up, Rope Pushdown
- **Abs (3):** Captain's Chair Leg Raise, Reverse Crunch, Cable Woodchop

### Impact (visible swap options per muscle group)
| Muscle Group | Before | After |
|---|---|---|
| Hamstrings | 4 | 13 |
| Front Delts | 2 | 10 |
| Abs | 3 | 14 |
| Traps | 3 | 9 |
| Triceps | 8 | 18 |
| Calves | 3 | 7 |
| Rear Delts | 5 | 10 |
| Side Delts | 7 | 13 |

### Verification
- TypeScript: 0 errors (`npx tsc --noEmit`)
- Total exercises: 229 (was 197)
- S-tier: 65, A-tier: 163
- Deployed to Vercel production

### Modified Files
- `web/src/lib/exercise-library.ts` -- tiers + 32 new exercises

---

## 2026-04-05 -- RP Exercise Library -- COMPLETE

### Goal
Create `web/src/lib/rp-exercise-library.ts` mapping all 22 RP Male Physique Training categories to exercise names.

### What Was Done
- Extracted all exercises from `N_F_3.xlsx` flat Links table (rows 329+) using Python/openpyxl
- Manually mapped RP exercise names to canonical names in exercise-library.ts
- Created `RP_CATEGORIES` Record with all 22 categories + 3 composite categories
- Added `getRpExercisesForCategory()` and `getRpCategoryNames()` helpers
- TypeScript: 0 errors

### Mapping Stats
- 22 RP categories, ~100 unique RP exercise names
- ~42 mapped to canonical exercise-library.ts names
- ~58 unmatched (listed in file header comment) -- need to be added to exercise-library.ts

### Unmatched categories summary
- Traps: all 4 exercises (Barbell Shrug, Dumbbell Shrug, etc.)
- Triceps overhead: EZ Bar / Barbell overhead extensions (4 entries)
- Glutes: deadlift variants (Sumo, Deficit, Hex Bar, plain)
- Vertical Back: assisted pullup variants (3)
- Abs: 6 of 7 exercises
- Others scattered across categories

### New File
- `web/src/lib/rp-exercise-library.ts`

---

## 2026-04-01 -- Exercise Library & Swap Feature -- COMPLETE

### Goal
Add browsable S/A-tier exercise library with exercise swap from workout cards and "add to routine" from library screen.

### Spec & Plan
- Spec: `docs/superpowers/specs/2026-03-31-exercise-library-design.md`
- Plan: `docs/superpowers/plans/2026-03-31-exercise-library.md`

### Commits (12 total)
| Commit | Description |
|--------|-------------|
| `2fa08b3` | feat: add tier, exrxUrl to ExerciseDefinition + substitutions to WorkoutSession |
| `76a9710` | feat: add exercise substitution store with permanent CRUD |
| `8740b57` | feat: add exercise additions store for registry program customization |
| `1f330b9` | feat: expand exercise library to 137 exercises with S/A tiers |
| `3dee60f` | feat: add exercise picker modal with search, tier sections |
| `2da4a35` | feat: add swap icon and indicator to exercise queue card |
| `c9e7f2f` | feat: integrate substitution resolution and swap flow in today screen |
| `3ed5099` | feat: add exercise library screen, route, and nav item |
| `d5a326d` | feat: add-to-routine flow on library screen |
| `f215623` | fix: remove unused import and suppress intentional lint warning |
| `d5714a1` | docs: add exercise library & swap design spec |
| `fdef5e0` | docs: add exercise library implementation plan |

### New Files
- `web/src/lib/exercise-substitutions.ts` -- permanent swap CRUD (localStorage `mi_substitutions`)
- `web/src/lib/exercise-additions.ts` -- append exercises to registry programs (`mi_additions`)
- `web/src/components/exercise-picker-modal.tsx` -- reusable picker: search, S/A tiers, equipment pills
- `web/src/components/screens/library-screen.tsx` -- standalone library page
- `web/src/app/library/page.tsx` -- Next.js route

### Modified Files
- `web/src/lib/types.ts` -- added `tier?: "S" | "A"`, `exrxUrl?: string` to ExerciseDefinition
- `web/src/lib/exercise-library.ts` -- expanded from ~80 to 137 exercises with tier assignments
- `web/src/lib/workout-store.ts` -- added `substitutions` to WorkoutSession
- `web/src/components/exercise-queue-card.tsx` -- swap icon, originalName indicator
- `web/src/components/screens/today-screen.tsx` -- substitution resolution, swap flow
- `web/src/components/app-shell.tsx` -- 6th nav item "Library"
- `web/src/app/globals.css` -- picker, library, swap CSS

### What Was Built
- **137 exercises** with S/A tier assignments from Nippard tier lists + Notion guide
- **Library screen** at `/library` -- 14 muscle group sections, collapsible, S then A tier
- **Exercise swap** -- swap icon on queue cards, picker filtered by muscle group, "Just this session" / "All future sessions" prompt
- **Add to Routine** -- from library, pick day, append or replace existing exercise
- **Substitution system** -- session subs on WorkoutSession, permanent subs in localStorage, resolution order: session > permanent > original

### Verification
- TypeScript: 0 errors
- Vitest: 51/51 pass
- Lint: 0 new errors
- Pushed to origin/main, Vercel auto-deploys

---

---

## 2026-04-02 -- Add Missing Exercises for Nippard Minimalist -- COMPLETE

### Task: Add Romanian Deadlift (Dumbbell) and T-Bar Row

Added two exercises to support the Nippard Minimalist 2-day program being built.

**Commit:** `152d5dc` -- feat: add Romanian Deadlift (Dumbbell) and T-Bar Row to exercise library

**Changes:**
- Line ~189: Added T-Bar Row after Chest-Supported Row (BACK section)
  - Compound barbell movement with biceps (0.4) and rear_delts (0.3) secondary muscles
- Line ~833: Added Romanian Deadlift (Dumbbell) after Romanian Deadlift (Barbell) (HAMSTRINGS section)
  - Compound dumbbell movement with glutes (0.5) secondary muscle

**Verification:**
- TypeScript: 0 errors (`npx tsc --noEmit`)
- Build: Clean
- Commit: Successful

---

## 2026-04-02 -- UX/UI Overhaul -- IN PROGRESS

### Plan
- Plan: `docs/superpowers/plans/2026-04-02-ux-ui-overhaul.md`

### Task 1: Install Lucide React + Add Icon Component -- COMPLETE
- [x] Installed `lucide-react` in web/
- [x] Created `web/src/components/icons.tsx` with 18 centralized icon exports
- [x] TypeScript compiles clean (`npx tsc --noEmit` -- 0 errors)
- Not committed yet (per instructions)

### Task 4: Create Confirmation Dialog Component -- COMPLETE
- [x] Created `web/src/components/confirm-dialog.tsx`
- [x] Wraps existing Modal component with confirm/cancel buttons
- [x] Supports: destructive styling, requireText (type-to-confirm), custom confirmLabel
- [x] TypeScript compiles clean (`npx tsc --noEmit` -- 0 errors)
- Not committed (per instructions)

### Task 5: Create Tab Bar Component -- COMPLETE
- [x] Created `web/src/components/tabs.tsx` -- reusable tab bar with role="tablist", aria-selected
- [x] Added tab CSS to `web/src/app/globals.css` (before media queries) -- .tab-bar, .tab-item, .tab-active
- [x] All styles use existing CSS variables (works across all 4 themes)
- [x] TypeScript compiles clean (`npx tsc --noEmit` -- 0 errors)
- Not committed (per instructions)

### Task 2: Add Global CSS Foundation -- COMPLETE
- [x] Added `p { margin: 0; }` reset after body rule
- [x] Added `:focus-visible` outline using `--accent-primary`
- [x] Added `.skip-link` styles (off-screen, slides in on focus)
- [x] Added `.sr-only` screen reader utility class
- [x] Changed `.ghost-btn` from `height: 40px` to `min-height: 44px` (WCAG touch target)
- [x] Updated `.mobile-nav` bottom to use `env(safe-area-inset-bottom)` + added safe area padding
- [x] Added `@media (prefers-reduced-motion: reduce)` query at end of file
- TypeScript: 0 errors
- Not committed (per instructions)

### Task 3: Redesign App Shell Navigation -- COMPLETE
- [x] Updated imports: added Lucide icon imports (Dumbbell, Calendar, TrendingUp, ClipboardList, BookOpen, Settings)
- [x] Replaced 6-item navItems (text abbreviations) with 5-item array using icon components (Volume removed from nav)
- [x] Added skip link as first child inside app-shell div
- [x] Updated desktop side rail nav links: Lucide SVG icons + aria-current attribute
- [x] Replaced settings emoji (⚙) with `<Settings size={20} />` SVG icon
- [x] Updated mobile bottom nav: Lucide SVG icons + aria-current attribute
- [x] Added `id="main-content"` to main element (skip link target)
- [x] Updated `.mobile-link-icon` CSS: removed font-family/font-size/font-weight, added flex centering for SVG
- [x] Removed dead `.nav-icon` CSS class (no longer referenced after icon refactor)
- [x] Mobile nav grid already had `repeat(5, ...)` and safe-area from Task 2
- TypeScript: 0 errors
- Not committed (per instructions)

### Task 6: Merge Volume into Progress Screen -- COMPLETE
- [x] Created `web/src/components/screens/strength-content.tsx` -- extracted ProgressScreen body (isoWeekKey, PR board, heatmap, charts)
- [x] Created `web/src/components/screens/volume-content.tsx` -- extracted VolumeScreen body (all state, effects, MuscleCard, meso header, sparklines)
- [x] Rewrote `web/src/components/screens/progress-screen.tsx` as tab container (Strength / Volume tabs via Tabs component)
- [x] Converted `web/src/app/volume/page.tsx` to redirect to `/progress?tab=volume`
- [x] volume-screen.tsx left in place (Task 13 handles deletion)
- TypeScript: 0 errors
- Not committed (per instructions)

### Task 7: Replace Fire Emoji with SVG -- COMPLETE
- [x] Added `import { Flame } from "@/components/icons"` to today-screen.tsx
- [x] Replaced `<span className="warmup-standalone-icon">🔥</span>` with `<Flame size={18} className="warmup-standalone-icon" aria-hidden="true" />`
- TypeScript: 0 errors
- Not committed (per instructions)

### Task 9: Accessibility -- aria-labels and aria-live -- COMPLETE
- [x] Added `aria-label="Weight"` to weight input in set-entry-row.tsx
- [x] Added `aria-label="Reps"` to reps input in set-entry-row.tsx
- [x] Added `aria-label="RPE"` to RPE select in set-entry-row.tsx
- [x] Wrapped Log Set button in `<div aria-live="polite" aria-atomic="true">` with dynamic text ("Set Logged!" on flash)
- [x] Added `aria-label="Previous day"` / `aria-label="Next day"` to day stepper buttons
- [x] Added `aria-label` to scheme override button
- [x] Added context-aware `aria-label` to Finish Workout button (changes when disabled)
- [x] Added `aria-label="Dismiss mesocycle notification"` to meso notification button
- TypeScript: 0 errors
- Not committed (per instructions)

---

## 2026-04-05 -- rp-store unit tests -- COMPLETE

### Goal
Add Vitest unit tests for `web/src/lib/rp-store.ts` (RP localStorage CRUD).

### What Was Done
- Created `web/src/lib/__tests__/rp-store.test.ts` with 13 test cases
- Shimmed `globalThis.window` and `globalThis.localStorage` in `beforeEach` (no jsdom needed)
- Covered: empty reads, round-trip save/load, addRating append order, addRating no-op, clearRpState, per-user isolation (3 cases), shape validation (4 corrupted-data cases)

### Verification
- `npx vitest run src/lib/__tests__/rp-store.test.ts` -- 13/13 passing

---

## 2026-04-05 -- rp-engine unit tests -- COMPLETE

### Goal
Add comprehensive Vitest unit tests for `web/src/lib/rp-engine.ts` (RP autoregulation engine).

### What Was Done
- Created `web/src/lib/__tests__/rp-engine.test.ts` with 113 test cases
- Pre-computed all expected values via Node.js before writing assertions (no guessing)
- Covered every exported function with describe blocks:
  - `round5`: 0, exact multiples, rounding up/down, negatives
  - `getBaseMultiplier`: all 3 mesos, superset secondary for metabolite, flag no-op for basic/resensitization
  - `getWeekMultiplier`: weeks 1-4, out-of-range fallback
  - `getWeekWeight`: all meso/week combos with 10RM=200, double-rounding behavior (TRM=210 case), superset secondary
  - `getDeloadWeight`: first/second half per meso, second-half rounding, deload ignores superset flag
  - `estimateTenRepMax`: known values (135x7=125, 200x10=200, 100x5=90, 225x12=235), result divisible by 5
  - `getCurrentSets`: all +1 (3->4->5->6), all -1 (3->2->1->0->0), mixed, no ratings, non-autoregulated, null pairedSlotId, meso-specific baseSets, meso isolation
  - `getDeloadSets`: returns 2
  - `getRirTarget`: weeks 1-4, deload
  - `getDeloadReps`: even/odd/zero
  - `validateFirstSetReps`: exact boundaries for all 3 mesos
  - `getMesoWeeks`: all 3 meso types
  - `isDeloadWeek`: deload and non-deload for each meso
  - `getNextMeso`: full chain + chain terminates correctly
  - `getMesoRestSeconds`: metabolite vs basic/resensitization

### Verification
- `npx vitest run src/lib/__tests__/rp-engine.test.ts` -- 113/113 passing

---

## 2026-04-05 -- RP Template Data Files -- COMPLETE

### Goal
Create `web/src/lib/rp-template-nf3.ts` and `rp-template-nf4.ts` with parsed data from RP Male Physique Training Excel spreadsheets.

### What Was Done
- Wrote `extract_rp_templates.py` (at project root) to parse N_F_3.xlsx and N_F_4.xlsx with openpyxl
- Extracted slot structure from Mesocycle 1 (canonical day/exercise layout)
- Mapped pairedSlotId by parsing Week 2 Sets formulas from col O (e.g. `=I11+(M29)` -> row 29 -> slotId)
- baseSets matched across all 3 meso sheets by (day, category, occurrence-within-category-in-day) -- not row number, because meso sheets have different exercise counts per day
- Verified all 24 NF3 pairedSlotIds and all 26 NF4 pairedSlotIds reference valid slot IDs
- TypeScript: 0 errors (tsc --noEmit)

### Files Created
- `web/src/lib/rp-template-nf3.ts` -- 24 slots, 3 days, restDayPattern [1,1,1]
- `web/src/lib/rp-template-nf4.ts` -- 26 slots, 4 days, restDayPattern [0,1,1,1]
- `extract_rp_templates.py` -- extraction script at project root (keep for future updates)

### Key Data Notes
- NF3: Push/Legs/Pull structure. All 24 slots have pairedSlotIds.
- NF4: Upper/Lower/Upper/Lower. Day 1+2 have no rest (0), days 2-4 have 1 rest day between.
- Slots with `resensitization: 0` are exercises the Meso 3 sheet drops entirely (e.g. Chest Isolation, second Quads slot on leg days).
- Non-autoregulated: Quads, Glutes, Hamstrings/Hip Hinge, Calves categories.

---

## 2026-04-05 -- RP Template Data Files NA4 + NC4 -- COMPLETE

### Goal
Create `web/src/lib/rp-template-na4.ts` and `rp-template-nc4.ts` from N_A_4.xlsx (Arms Focus) and N_C_4.xlsx (Chest/Back).

### What Was Done
- Wrote `parse_rp_templates.py` (project root) to parse both files with openpyxl
- Extracted 4-day slot structure from Meso 1 (cols B = category, C = day header, I = sets, O = week-2 formula)
- Parsed `pairedSlotId` from col O formula: `=I11+(M33)` -> row 33 -> slot ID
- Parsed `baseSets.metabolite` from Meso 2 sheet, handling "Super set this exercise" / "with this one" extra rows
- Extra "with this one" rows get slot IDs `d{day}-e{n:02d}` (basic=0, resensitization=0)
- Parsed `baseSets.resensitization` from Meso 3 sheet using CATEGORY-MATCH strategy (not positional) -- Meso 3 drops one slot per day (always the second occurrence of a duplicated category)
- Verified all pairedSlotId and supersetWith references are valid slot IDs
- TypeScript: 0 errors (tsc --noEmit)

### Files Created
- `web/src/lib/rp-template-na4.ts` -- 32 slots (28 main + 4 superset extras), 4 days
- `web/src/lib/rp-template-nc4.ts` -- 30 slots (28 main + 2 superset extras), 4 days
- `parse_rp_templates.py` -- extraction script at project root (keep for future updates)

### Key Data Notes
- NA4: restDayPattern [0, 1, 0, 1] -- no rest between Day 1 and 2, one rest day between Day 2 and 3, etc.
- NA4 has 4 superset pairs (one per day); NC4 has 2 superset pairs (Days 1 and 2 only)
- Slots with `resensitization: 0` are exercises Meso 3 drops (the second occurrence of each duplicated muscle category)
- `supersetWith` field only populated on Meso 2 superset slots -- extra slots also have it pointing back to the "Super set this exercise" slot

---

## 2026-04-06 -- RP Program Integration (Task 1+2) -- COMPLETE

### Goal
Integrate 4 RP programs (NF3, NF4, NA4, NC4) into the app by:
1. Adding prescribedWeight and rirTarget to ProgramExercise type
2. Registering 4 RP programs in PROGRAM_REGISTRY
3. Adding getRpExercisesForDay() function to program-registry.ts

### Files Modified
- `web/src/lib/program-data.ts` -- added prescribedWeight?, rirTarget? to ProgramExercise type
- `web/src/lib/program-registry.ts` -- 4 RP entries, getRpExercisesForDay() export, getRpTemplate() helper, RP handling in getExercisesForDay() and getDayTitle()

### What Was Done
- [x] Added prescribedWeight (weight suggestion) and rirTarget (RIR description) to ProgramExercise type
- [x] Added 4 RP program registry entries: rp-nf3, rp-nf4, rp-na4, rp-nc4 (all "both" profiles, 13-week cycle)
- [x] Added getRpTemplate() helper -- maps program ID to RpTemplate (NF3/NF4/NA4/NC4)
- [x] Added getRpExercisesForDay() pure function (exported):
  - Takes templateId, dayNumber, and rpState (from localStorage)
  - Builds superset group map (supersets active only in metabolite meso)
  - Generates order labels (numeric for normal exercises, A/B suffixes for supersets)
  - Builds ProgramExercise[] with:
    * Prescribed weight from rp-engine functions (respects meso, week, superset secondary status)
    * RIR target from rp-engine (3/fail -> 2/fail -> 1/fail progression)
    * Set count from rp-engine (autoregulated or fixed per leg muscles)
    * Rest seconds from meso type (short for metabolite, long for basic/resensitization)
- [x] Added RP handling to getExercisesForDay() -- returns empty array for RP (caller uses getRpExercisesForDay directly)
- [x] Added RP handling to getDayTitle() -- looks up title from template.dayTitles
- [x] TypeScript: 0 errors (`npx tsc --noEmit`)
- [x] Vitest: 177/177 passing

### Key Design Notes
- RP programs return [] from getExercisesForDay() because they need rpState (from localStorage) passed directly via getRpExercisesForDay()
- Non-RP programs use getExercisesForDay(templateId, dayNumber, weekNumber)
- RP programs use getRpExercisesForDay(templateId, dayNumber, rpState)
- Superset groups only apply in metabolite meso (Meso 2)
- Order numbering resets per day; superset pairs share a number with A/B suffix

---

## 2026-04-06 -- RP Mesocycle Setup Screen -- COMPLETE

### Goal
Create `web/src/components/screens/rp-setup-screen.tsx` component for initial RP program configuration.

### What Was Done
- [x] Created RpSetupScreen component with full props interface
- [x] Implemented mesocycle selection UI (Basic/Metabolite/Resensitization descriptions)
- [x] Implemented exercise picker dropdowns (per slot, from getRpExercisesForCategory)
- [x] Implemented 10RM input with number validation
- [x] Implemented Epley formula estimation calculator (weight + reps -> 10RM)
- [x] Implemented state management (selections, estimator UI, form validation)
- [x] Implemented active slot filtering (only slots with baseSets[meso] > 0)
- [x] Implemented form completion check (all active slots must have exerciseName + tenRepMax > 0)
- [x] Implemented onComplete callback building full RpProgramState
- [x] Styled with existing CSS variables, design tokens, inline styles
- [x] TypeScript: 0 errors (`npx tsc --noEmit`)

### Component Features
- Groups exercises by day with day titles from template
- Shows category label + (fixed sets) indicator for non-autoregulated muscles
- Estimation calculator with collapsible UI (toggle button)
- Submit button disabled until all active slots complete
- Pre-fills selections from carryForward prop (for mesocycle transitions)
- Only includes active slots in final RpProgramState

### New File
- `web/src/components/screens/rp-setup-screen.tsx`

---

## 2026-04-06 -- Add 58 Missing RP Exercises -- COMPLETE

### Goal
Add 58 missing exercises to exercise-library.ts that are required by RP (Renaissance Periodization) program templates. These exercises were already listed in rp-exercise-library.ts as "Unmatched" and needed canonical definitions to be used in the RP engine.

### What Was Done
Added 58 new ExerciseDefinition entries organized by muscle group sections:

**BACK section (7):** Underhand EZ Bar Row, Row to Chest, 2-Arm Dumbbell Row, Row Machine, Assisted Overhand Pullup, Assisted Parallel Pullup, Assisted Underhand Pullup

**CHEST section (9):** Flat Dumbbell Flye, High Cable Flye, Cable Incline Flye, Wide Grip Bench Press, Pushup, Close Grip Pushup, Incline Wide Grip Bench Press, Incline Close Grip Bench Press, Incline Machine Bench Press

**SIDE DELTS section (2):** Dumbbell Upright Row, Thumbs Down Lateral Raise

**REAR DELTS section (2):** Barbell Facepull, Dumbbell Facepull

**FRONT DELTS section (4):** Standing Barbell Shoulder Press, Seated Barbell Shoulder Press, High Incline Dumbbell Press, Standing Dumbbell Shoulder Press

**TRAPS section (4):** Barbell Shrug, Barbell Bent Over Shrug, Dumbbell Shrug, Dumbbell Bent Over Shrug

**QUADS section (2):** Close Stance Feet Forward Squats, Machine Feet Forward Squat

**HAMSTRINGS section (2):** Stiff-Legged Deadlift, Single-Leg Leg Curl

**GLUTES section (7):** Barbell Walking Lunge, Sumo Squat, Deficit Deadlift, 25's Deadlift, Sumo Deadlift, Deadlift, Hex Bar Deadlift

**BICEPS section (5):** Close Grip Barbell Curl, 2-Arm Dumbbell Curl, Dummbell Twist Curl, Alternating Dumbbell Curl, Cable Rope Twist Curl

**TRICEPS section (6):** EZ Bar Overhead Tricep Extension, Barbell Overhead Tricep Extension, Seated EZ Bar Overhead Tricep Extension, Seated Barbell Overhead Tricep Extension, JM Press, Assisted Dips

**CALVES section (2):** Stair Calves, Smith Machine Calves

**ABS section (6):** Machine Crunch, Slant Board Sit-Up, Reaching Sit-Up, V-Up, Modified Candlestick, Hanging Knee Raise

### Changes Made
- `web/src/lib/exercise-library.ts` -- added 58 ExerciseDefinition entries with correct:
  - `id` (kebab-case from name)
  - `name` (exact from RP list, including "Dummbell" typo)
  - `primaryMuscle` (correct muscle group)
  - `type` ("compound" or "isolation")
  - `equipment` (barbell, dumbbell, cable, machine, bodyweight, smith_machine)
  - `secondaryMuscles` (based on exercise mechanics, using RP conventions)

### Verification
- TypeScript: 0 errors (`npx tsc --noEmit src/lib/exercise-library.ts`)
- All 58 exercises verified in file via grep (spot checks on all categories)
- Exercise library now has 197 total exercises (up from 139)

### Files Modified
- `web/src/lib/exercise-library.ts` -- inserted 58 new exercises in correct muscle group sections

---

## 2026-04-06 -- RP Integration into Today Screen -- COMPLETE

### Goal
Integrate RP program support into today-screen.tsx so users can:
1. See RpSetupScreen when RP program selected with no active state
2. View prescribed weights + RIR targets in Live Console
3. Log recovery ratings inline after completing autoregulated exercises
4. Skip exercises (0 sets) marked with "recovery needed" visual
5. Auto-advance weeks and trigger meso transitions after deload completion

### What Was Done
- [x] Added imports: rp-store, program-registry getRpExercisesForDay, RpSetupScreen, rp-engine functions, rp template files, rp-types
- [x] Extended QueueExercise type: added prescribedWeight?, rirTarget?, rpSlotId?
- [x] Added getRpTemplateById() helper to map program ID to template object
- [x] Added RP state management: rpState, rpRatedSlots (Set), rpMesoComplete, rpCarryForward
- [x] Updated exercises memo to call getRpExercisesForDay() for RP programs
- [x] Added rpDaySlots memo to filter template slots by current day
- [x] Propagated RP fields in queueExercises memo: prescribedWeight, rirTarget, rpSlotId (from rpDaySlots)
- [x] Reset rpRatedSlots in applyDaySelection (when user switches days)
- [x] Added RP week/meso progression in finalizeCompletion: week advance on last day, meso transition when week >= mesoWeeks, macrocycle completion message
- [x] Added early return for RpSetupScreen (before main JSX): shown when isRpProgram && (!rpState || rpMesoComplete)
- [x] Added prescribed weight display in Live Console (below scheme, monospace, cyan)
- [x] Added RIR badge in Live Console (orange, shows "RIR: X" from rirTarget)
- [x] Added inline recovery rating UI after logged sets (only for autoregulated slots, not deload weeks, only after all sets logged, shows +1/0/-1 buttons)
- [x] Modified RecoveryRatingPrompt condition: only shown for non-RP programs
- [x] Added greyed-out styling for skipped exercises (targetSets === 0): opacity 0.4, overlay "Skipped -- recovery needed"
- [x] TypeScript: 0 errors (`npx tsc --noEmit`)
- [x] Vitest: 177/177 passing

### Key Implementation Details
- RP setup screen early return prevents workout UI from rendering until meso state exists
- rpRatedSlots tracks slots already rated in current session to prevent duplicate ratings
- Week advancement happens auto on last day of week, meso transition shows prompt to set up new meso
- Prescribed weights calculated by getRpExercisesForDay (respects meso, week, 10RM, autoregulation)
- RIR target shows "3/fail" -> "2/fail" -> "1/fail" or fixed for non-autoregulated muscles
- Recovery rating UI appears only after all target sets logged for autoregulated exercises
- Skipped exercises (0 sets) show visual indicator + reduced opacity to clearly indicate recovery week

### Files Modified
- `web/src/components/screens/today-screen.tsx` -- entire RP integration (1,700+ lines)

### Verification
- TypeScript: 0 errors
- Vitest: 177/177 passing
- No tests broken by changes

---

## 2026-04-06 -- ExerciseQueueCard Layout Rewrite -- COMPLETE

### Goal
Rewrite `web/src/components/exercise-queue-card.tsx` to new data-cluster layout with:
- Header: order + name + actions (URL/swap buttons)
- Muscles row
- Data cluster: SETS / REPS / WEIGHT as three columns
- Footer: progress + RIR badge
- Notes row

### What Was Done
- [x] Replaced component entirely with new layout structure
- [x] Updated props: removed scheme/track/lastPerformance, added muscleGroup/reps/lastWeight/prescribedWeight/rirTarget/isSkipped
- [x] Removed ProgressRing SVG component (no longer used)
- [x] Simplified button layout: orderLabel/name flex, actions group flex
- [x] Data cluster: three equal-width stat blocks (SETS, REPS, WEIGHT labels above values)
- [x] Footer: conditional rendering of progress + RIR badge
- [x] Notes: optional notes row at bottom
- [x] Removed ArrowLeftRight icon import (doesn't exist), using ⇄ symbol instead
- [x] Updated data attributes: data-active, data-complete, data-skipped
- [x] TypeScript: 0 errors (component file clean)

### Files Modified
- `web/src/components/exercise-queue-card.tsx` -- complete rewrite

### Expected Issue (Not Fixed)
- today-screen.tsx still passes old props (scheme, track, lastPerformance) -- will be fixed by another agent
- Component file itself: 0 TypeScript errors
- Full tsc will show today-screen prop mismatch -- expected

### Verification
- `npx tsc --noEmit | grep exercise-queue-card` -- no errors in component file
- Component structure matches spec: header/muscles/data-cluster/footer/notes layout

---

## 2026-04-07 -- Export getRpTemplate, Kill Duplicates -- COMPLETE

### Goal
Remove duplicate switch statements mapping RP template IDs from 3 files:
- Export canonical `getRpTemplate()` from program-registry.ts
- Delete duplicate functions in today-screen.tsx and rp-setup-screen.tsx
- Update imports to use the exported function

### What Was Done
- [x] Step 1: Added `export` keyword to `getRpTemplate()` in program-registry.ts (line 213)
- [x] Step 2: Updated today-screen.tsx:
  - Added `getRpTemplate` to existing import from "@/lib/program-registry" (line 23-29)
  - Deleted 4 RP template imports (RP_TEMPLATE_NF3/NF4/NA4/NC4)
  - Deleted duplicate `getRpTemplateById()` function (was at line 195)
  - Replaced 2 call sites: `getRpTemplateById(` → `getRpTemplate(` (lines 293, 1028)
- [x] Step 3: Updated rp-setup-screen.tsx:
  - Added `getRpTemplate` to import from "@/lib/program-registry" (line 11)
  - Deleted 4 RP template imports (RP_TEMPLATE_NF3/NF4/NA4/NC4)
  - Deleted duplicate `getTemplate()` function (was at line 34)
  - Replaced 1 call site: `getTemplate(` → `getRpTemplate(` (line 40)
- [x] Step 4: Verified:
  - TypeScript: 0 errors (`npx tsc --noEmit`)
  - Next build: succeeded in 1838.1ms, 0 type errors
  - No remaining imports of RP template constants in component files
  - All call sites use exported `getRpTemplate()` from program-registry
- [x] Step 5: Committed: `d5b0d76`

### Files Modified
- `web/src/lib/program-registry.ts` -- added export to getRpTemplate
- `web/src/components/screens/today-screen.tsx` -- removed duplicate imports/function/calls
- `web/src/components/screens/rp-setup-screen.tsx` -- removed duplicate imports/function/calls

### Changes Summary
- Deleted 8 lines of import statements (4 in each screen)
- Deleted 22 lines of duplicate switch statement code
- Net change: -32 lines, +6 lines (import additions) = -26 lines total
- Single source of truth: getRpTemplate is now in program-registry.ts only

---

## 2026-04-06 -- Today Screen to Stitch Design -- IN PROGRESS

### Goal
Modify `web/src/components/screens/today-screen.tsx` to match new Stitch design mockups.

### Changes Made
- [x] Added `formatMuscleGroup()` helper function (line ~137) -- formats exercise muscle groups from exercise-library definitions
- [x] Updated `QueueExercise` type to add: `muscleGroup`, `reps`, `lastWeight?`, `isSkipped?`
- [x] Updated `queueExercises` memo return object to populate new fields using formatMuscleGroup() and exercise data
- [x] Updated `ExerciseQueueCard` JSX props: removed old `scheme`, `lastPerformance`, `track` props; added new `muscleGroup`, `reps`, `lastWeight`, `prescribedWeight`, `rirTarget`, `isSkipped` props
- [x] Removed both `<details>` collapsible-section wrappers around Exercise Queue and Live Console
- [x] Removed redundant section titles (Exercise Queue / Today Pipeline) from Exercise Queue section
- [x] Updated exercise name display in Live Console: replaced `.section-title` with custom inline styles (display font, 1.4rem, uppercase, letter-spacing)
- [x] Added `glass-card` class to Live Console `<article>`
- [x] Added gap styling to `queue-list` div: `display: flex`, `flexDirection: column`, `gap: 12px`
- [x] TypeScript: 0 errors (`npx tsc --noEmit`)

### Files Modified
- `web/src/components/screens/today-screen.tsx` -- all changes above

### Verification
- TypeScript compilation clean (no errors)

---

## 2026-04-06 -- RP UX Overhaul -- IN PROGRESS

### Plan
- Plan: `docs/superpowers/plans/2026-04-06-rp-ux-overhaul.md`
- Spec: `docs/superpowers/specs/2026-04-06-rp-ux-overhaul-design.md`

### Task 1: Create RpMesoCard Component -- COMPLETE
- [x] Step 1: Create the component file -- `web/src/components/rp-meso-card.tsx`
- [x] Step 2: Add meso card CSS to globals.css -- added before @media queries (line 1207)
- [x] Step 3: Verify TypeScript -- 0 errors (`npx tsc --noEmit`)
- [x] Step 4: Commit -- `850794c` feat: create RpMesoCard component with day checkboxes and week advancement

### Task 2: Add Week 1 Preview to Setup Screen -- COMPLETE
- [x] Step 1: Add getRpExercisesForDay import (line 11)
- [x] Step 2: Add preview section before submit button (lines 478-527)
- [x] Step 3: Verify RpProgramState import (confirmed, line 4 from rp-types)
- [x] Step 4: Verify TypeScript -- 0 errors
- [x] Step 5: Commit -- `d09e4cc` feat: add Week 1 preview to RP setup screen

### What Was Done (Task 2)
- Added `getRpExercisesForDay` import from `@/lib/program-registry` at top of rp-setup-screen.tsx
- Inserted Week 1 preview section (61 lines) between day cards loop and submit button
- Preview builds temporary RpProgramState with currentWeek=1 and calls getRpExercisesForDay() for each day
- Shows calculated prescribed weights, set counts, and RIR targets for verification before starting
- Only displays when isComplete (all 10RMs entered)
- Uses existing CSS variables for styling (font-display, accent-primary, accent-power)
- TypeScript: 0 errors (`npx tsc --noEmit`)
- Commit: `d09e4cc`

### Task 3: Wire Meso Card into Today Screen + Remove Auto-Advance -- COMPLETE
- [x] Step 1: Add new imports (RpMesoCard, getMesoRestSeconds, getRirTarget)
- [x] Step 2: Add rpCompletedDays memo with rpAllDaysComplete derivation
- [x] Step 3: Add handleRpSelectDay callback after handleShiftDay
- [x] Step 4: Add handleRpAdvanceWeek callback after handleRpSelectDay
- [x] Step 5: Add handleRpCompleteMeso callback after handleRpAdvanceWeek
- [x] Step 6: Remove auto-advance RP block from finalizeCompletion (deleted lines 819-846)
- [x] Step 7: Replace week/day selectors with conditional (show meso card for RP, toolbar for non-RP)
- [x] Step 8: Add rating visibility hints after RP rating section
- [x] Step 9: Verify TypeScript + tests -- 0 errors, 177/177 passing

### What Was Done (Task 3)
- Added imports: `RpMesoCard` component, `getMesoRestSeconds`, `getRirTarget` from rp-engine
- Created `rpCompletedDays` useMemo tracking which days completed in current week for RP programs
- Created `rpAllDaysComplete` boolean derived from rpCompletedDays
- Created three event handlers:
  1. `handleRpSelectDay` -- calls applyDaySelection, clears rated slots
  2. `handleRpAdvanceWeek` -- increments rpState.currentWeek, advances global prefs.currentWeek, clears ratings
  3. `handleRpCompleteMeso` -- handles meso transition (next meso or macrocycle complete)
- Deleted 28-line RP auto-advance block from finalizeCompletion (was checking isLastDayOfWeek)
- Updated finalizeCompletion dependency array: removed isRpProgram, rpState, prefs.currentDay
- Replaced cycle-toolbar section with conditional:
  - `{isRpProgram && rpState ? <RpMesoCard .../> : <div className="cycle-toolbar">...}</div>`
  - RpMesoCard receives all state + handlers, day titles from getRpTemplateById()
- Added rating hints section after existing inline rating UI:
  - Shows "Ratings unlock in Week 2" in Week 1
  - Shows "Deload week -- no ratings" in deload weeks
  - Uses existing inline IIFE pattern
- TypeScript: 0 errors (`npx tsc --noEmit`)
- Vitest: 177/177 passing
- Commit: ready (not yet committed per instructions)

### Files to Modify/Create
- Create: `web/src/components/rp-meso-card.tsx` -- DONE
- Modify: `web/src/app/globals.css` (add CSS before media queries) -- DONE
- Modify: `web/src/components/screens/rp-setup-screen.tsx` (add preview section) -- DONE
- Modify: `web/src/components/screens/today-screen.tsx` -- DONE

---

## HANDOFF

### Current State
- **Working:** Everything deployed at https://web-blush-phi.vercel.app
- **Working:** Exercise library at 197 exercises
- **Working:** 177/177 tests, 0 TypeScript errors
- **Working:** RP programs (NF3, NF4, NA4, NC4) fully integrated into today-screen.tsx
- **Working:** RpSetupScreen shown on first RP program launch
- **Working:** Prescribed weights, RIR targets, recovery ratings
- **Working:** ExerciseQueueCard rewritten with new data-cluster layout
- **Working:** today-screen.tsx updated to pass new props to ExerciseQueueCard
- **JUST COMPLETED:** Task 1, 2, 3 of RP UX Overhaul:
  - RpMesoCard component created with day checkboxes, week/meso buttons
  - Week 1 preview added to rp-setup-screen.tsx
  - Meso card wired into today-screen, auto-advance removed
  - Rating visibility hints added (Week 1 unlock, Deload week)
  - rpCompletedDays tracking implemented
  - All 3 event handlers added (select day, advance week, complete meso)

### What's Ready to Test
1. RpMesoCard displays for RP programs (replaces week/day dropdowns)
2. Day checkboxes show current week completion status (✓ / ○)
3. "Advance to Week X" button appears when all days complete (non-deload)
4. "Complete Mesocycle" button appears when all days complete (deload)
5. Clicking week advance updates prefs.currentWeek globally + rpState.currentWeek
6. Rating hints show in Week 1 and deload weeks
7. Non-RP programs still show cycle-toolbar (week/day selectors)

### Next Steps
1. Commit Task 3 changes when ready: `git add ... && git commit -m "..."`
2. Implement Task 4: Final verification + deploy
   - Full build check (tsc --noEmit && vitest run && next build)
   - Push to origin/main
   - Vercel deploy

### Architecture Notes
- rpCompletedDays is a Set<number> tracking days 1-daysPerCycle completed in current week
- handleRpSelectDay clears rpRatedSlots on day switch
- handleRpAdvanceWeek increments both rpState.currentWeek AND prefs.currentWeek linearly
- formatMuscleGroup helper uses findExercise to get primary + secondary muscles (≥0.3 factor)

---

## 2026-04-06 -- Three Today-Screen Changes

### Goal
Apply three targeted UX improvements to today-screen.tsx:
1. Add delete button to logged set chips
2. Pre-fill weight when selecting an exercise
3. Inline 10RM editor for RP exercises

### Files to Touch
- `web/src/lib/workout-store.ts` -- create deleteSet() function
- `web/src/components/screens/today-screen.tsx` -- all three changes

### Plan
**Change 1: Delete button on logged sets**
- Create deleteSet(exerciseName, setIndex, user?) function in workout-store.ts
- Removes matching set from active session, returns updated session or null
- Pattern matches logSet() function
- In today-screen.tsx: import deleteSet, add ✕ button to each logged-set-chip div
- Button positioned after timestamp, uses setActiveSession callback

**Change 2: Pre-fill weight**
- In handleSelectExercise callback (line 632), after setTimerTarget call
- Extract prescribedWeight or lastWeight from selected exercise
- Pre-fill draft.weight via setDraft

**Change 3: Inline 10RM editor**
- Add rpTenRmEdit, rpTenRmDraft state vars after rpRatedSlots
- Insert UI block after exercise name h2 (line 1202)
- Toggle edit/view mode for activeExercise.rpSlotId
- Save updates rpState.selections[slotId].tenRepMax via saveRpState
- View shows "Target: {weight} lbs" or "No 10RM set" button

### Starting State
- today-screen.tsx: 1700 lines, imports all necessary stores
- workout-store.ts: has logSet, completeSession, no deleteSet yet
- Tests passing: 177/177, 0 TypeScript errors

### What Was Done

**Step 1: Create deleteSet() in workout-store.ts**
- Added function after logSet (line 310)
- Signature: deleteSet(exerciseName: string, setIndex: number, user?: HouseholdUser)
- Filters out matching set from active session.sets array
- Returns updated session or null
- Follows same pattern as logSet: read, mutate, write, return

**Step 2: Add delete button to logged-set-chip**
- Added deleteSet to imports from @/lib/workout-store (line 31)
- Updated logged-set-chip JSX in renderActiveExercise section (around line 1460)
- Button positioned after timestamp with marginLeft: "auto"
- Click handler: calls deleteSet(exerciseName, setIndex), updates activeSession
- Styling: no background/border, text-2 color, pointer cursor, light gray
- aria-label for accessibility, ✕ character for visual clarity

**Step 3: Add weight pre-fill on exercise select**
- Updated handleSelectExercise callback (line 634)
- After setTimerTarget call, added logic to extract prescribedWeight or lastWeight
- Pre-fills draft.weight using setDraft callback
- Only fills if selected exercise has weight value

**Step 4: Add inline 10RM editor for RP exercises**
- Added rpTenRmEdit, rpTenRmDraft state vars after rpRatedSlots (line 287-288)
- Added UI block after exercise name h2 in Live Console (line 1216)
- Block conditionally renders if: isRpProgram && rpState && activeExercise.rpSlotId
- View mode: button showing "Target: {weight} lbs" or "No 10RM set"
- Edit mode: number input (min 0, step 5) + Save/Cancel buttons
- Save handler: updates rpState.selections[slotId].tenRepMax via saveRpState
- Clear logic: exits edit mode on save or cancel

### Verification
- TypeScript: `npx tsc --noEmit` -- 0 errors
- Tests: `npx vitest run` -- 177/177 passing
- No new dependencies added
- All changes backward compatible (conditional rendering for RP programs)

### Summary
All three changes complete and verified:
1. Delete set chips -- users can now remove individual logged sets with ✕ button
2. Weight pre-fill -- selecting exercise pre-populates weight field for faster data entry
3. 10RM inline editor -- RP users can edit 10RM values directly in Live Console

New deleteSet function follows established patterns in workout-store (read/mutate/write/return).
All UI additions use existing inline styling and state management patterns.
No breaking changes; non-RP programs unaffected by 10RM editor code.

---

## 2026-04-06: Create `program-data-splits.ts` for simple split templates

### Goal
Create a new file that provides double-progression templates derived from RP template data. These are simple, static templates (unlike RP's adaptive ones) that use the same slots and exercise categories.

### Plan
1. Read spec at `docs/superpowers/specs/2026-04-07-simple-split-templates-design.md`
2. Create `web/src/lib/program-data-splits.ts` with exact code from spec
3. Verify TypeScript compilation

### What Was Done

**Step 1: Created program-data-splits.ts**
- File: `web/src/lib/program-data-splits.ts`
- Imports: RpTemplate types, RP templates (NF3, NF4, NA4, NC4), getRpExercisesForCategory, findExercise, getDefaultRestSeconds
- TEMPLATE_MAP: Maps 4 program IDs to their RP sources
  - `split-fb3` -> RP_TEMPLATE_NF3
  - `split-fb4` -> RP_TEMPLATE_NF4
  - `split-arms4` -> RP_TEMPLATE_NA4
  - `split-chest4` -> RP_TEMPLATE_NC4
- getSplitDayTemplate(programId, dayNumber) function:
  - Reads template from TEMPLATE_MAP, returns null if not found
  - Gets day title from template.dayTitles[dayNumber - 1]
  - Filters slots: only includes dayNumber match + baseSets.basic > 0
  - Maps to ProgramExercise[]:
    - Exercise name: first from getRpExercisesForCategory(slot.muscleCategory)
    - Sets: slot.baseSets.basic
    - Reps: "8-12 reps" for compounds, "10-15 reps" for isolations (via findExercise().type check)
    - Rest: getDefaultRestSeconds(name)
  - Returns { title, exercises } or null

**Step 2: Verified TypeScript**
- `npx tsc --noEmit` from web directory
- 0 errors

### Notes
- Registry integration (PROGRAM_REGISTRY additions) not done yet -- next step per spec
- This file is standalone and ready for use
- All imports validated; paths match existing RP integration pattern
- No new dependencies required

### Status
COMPLETE -- File created, syntax verified. Ready for registry integration in next phase.

---

## 2026-04-06 -- Add Split Programs to Registry

### Goal
Add 4 new simple split programs (split-fb3, split-fb4, split-arms4, split-chest4) to program registry.

### What Was Done
1. Added import: `import { getSplitDayTemplate } from "./program-data-splits";`
2. Added 4 entries to PROGRAM_REGISTRY:
   - split-fb3: Full Body 3-Day (Push/Legs/Pull)
   - split-fb4: Full Body 4-Day (Upper/Lower)
   - split-arms4: Arms-Focus 4-Day
   - split-chest4: Chest/Back 4-Day
3. Added split handling in getExercisesForDay() before RP block
4. Added split handling in getDayTitle() before RP block
5. TypeScript: 0 errors (npx tsc --noEmit)

### Files Changed
- `web/src/lib/program-registry.ts`

### Status
Complete. Registry integration ready; awaiting `program-data-splits.ts` from parallel agent.

---

## 2026-04-07 -- Migrate 5 Store Files to storage-utils

### Goal
Replace duplicated readRaw/write functions in 5 store files with shared storage-utils exports.

### Files Modified
1. **workout-store.ts**: Added import; deleted readRaw/write functions; replaced readRaw( → readJson(, write(KEYS.* → writeJson(KEYS.*
2. **volume-store.ts**: Added import; deleted readRaw/write functions; replaced readRaw( → readJson(, write(KEYS.* → writeJson(KEYS.*
3. **rp-store.ts**: Added import; deleted readRaw/write functions; replaced readRaw( → readJson(, write(STORAGE_KEY → writeJson(STORAGE_KEY
4. **exercise-substitutions.ts**: Added import; replaced load() body to use readJson; replaced save() body to use writeJson
5. **exercise-additions.ts**: Added import; replaced load() body to use readJson; replaced save() body to use writeJson

### Verification
- Tests: 181 passed, 6 files, 0 failures (npx vitest run)
- Types: 0 errors (npx tsc --noEmit)
- Commit: `ee04471` -- refactor: migrate 5 store files to shared storage-utils

### Status
COMPLETE. All duplicated storage functions consolidated to storage-utils.ts.

---

## 2026-04-07 -- Task 6: Export resolveUser from household-profiles

### Goal
Consolidate duplicated `resolveUser` functions from workout-store.ts and program-store.ts into household-profiles.ts.

### What Was Done
1. Added `resolveUser(user?: HouseholdUser): HouseholdUser` export to household-profiles.ts
   - Returns concrete user if provided, otherwise defaults to active user from localStorage
2. Updated workout-store.ts:
   - Added `resolveUser` to import from household-profiles
   - Deleted local `resolveUser` function (3 lines)
   - Kept local `getStoredPrefs()` wrapper (used in 4+ other places)
3. Updated program-store.ts:
   - Replaced `getActiveUserFromLocalStorage` import with just `resolveUser`
   - Deleted local `resolveUser` function
   - `getActiveUserFromLocalStorage` no longer imported (wasn't used elsewhere)
4. Verification:
   - Tests: 189 passed (npx vitest run)
   - Types: 0 errors (npx tsc --noEmit)
   - Commit: `b059fa8` -- refactor: consolidate resolveUser into household-profiles

### Files Modified
- `web/src/lib/household-profiles.ts`
- `web/src/lib/workout-store.ts`
- `web/src/lib/program-store.ts`

### Status
COMPLETE. resolveUser consolidated; all tests passing.

---

## 2026-04-07 -- Task 3: Create format-utils.ts

### Goal
Create shared format-utils module centralizing 4 duplicated formatting functions across the codebase.

### Files Created
- `web/src/lib/format-utils.ts` -- formatMuscleName, formatClock, formatDuration functions
- `web/src/lib/__tests__/format-utils.test.ts` -- unit tests (8 tests)

### What Was Done
1. Created test file with 8 assertions (formatMuscleName: 3 tests, formatClock: 3 tests, formatDuration: 2 tests)
2. Ran test to verify it fails (cannot find module)
3. Created implementation file with 3 pure functions:
   - formatMuscleName: snake_case -> Title Case
   - formatClock: seconds -> M:SS (e.g., 90 -> "1:30")
   - formatDuration: seconds -> Mm SSs (e.g., 125 -> "2m 05s")
4. Ran test again: all 8 tests passing
5. Committed: `d382f89` -- feat: add shared format-utils (formatMuscleName, formatClock, formatDuration)

### Status
COMPLETE. Ready for Task 4: Migrate 5 files to use format-utils.

---


## 2026-04-07 -- Task 9: Conditional 1-second interval

### Goal
Stop the 1-second interval that fires `setNowMs(Date.now())` unconditionally, causing wasteful re-renders when no workout is active.

### What Was Done
1. Located the interval useEffect in today-screen.tsx around line 473
2. Replaced unconditional interval with conditional version:
   - When `matchingActiveSession` is null, clear `nowMs` and return early (no interval)
   - When `matchingActiveSession` exists, immediately set `nowMs`, then start the 1-second interval
   - Changed dependency array from `[]` to `[matchingActiveSession]`
3. Verified `workoutElapsedSeconds` useMemo already guards for null (line 517: `if (nowMs == null || !matchingActiveSession`)
4. Verified `nowMs` is typed as `number | null` (line 228)
5. TypeScript check: 0 errors (npx tsc --noEmit)
6. Commit: `cd71a5e` -- perf: only run 1-second interval when workout is active

### Files Modified
- `web/src/components/screens/today-screen.tsx` (useEffect starting at line 473)

### Status
COMPLETE. Interval now conditional on active session.

---

## 2026-04-07 -- Task 12: Pre-compute lastPerformanceMap -- COMPLETE

### Goal
Pre-compute last performance per exercise in a separate memo to avoid O(N*M) lookups on every set save. Currently `getLastPerformanceFromSessions()` iterates all sessions for each exercise (8 exercises * 60 sessions * 20 sets = ~10,000 comparisons per set save).

### What Was Done
[x] Step 1: Added `lastPerformanceMap` memo before `queueExercises` memo (line 335)
[x] Step 2: Replaced `getLastPerformanceFromSessions(sessionHistory, resolvedName)` with `lastPerformanceMap.get(resolvedName)` (line 389)
[x] Step 3: Updated queueExercises dependency array: replaced `sessionHistory` with `lastPerformanceMap` (line 422)
[x] Step 4: Verified sessionHistory not used elsewhere in queueExercises body, safe to remove
[x] Step 5: Deleted unused `getLastPerformanceFromSessions()` function (was at line 162)
[x] Step 6: Type check -- 0 errors (npx tsc --noEmit)
[x] Step 7: Committed (540ee20)

### Details
- **Memo logic**: Walks sessions newest-first, builds a Map where key = exercise name, value = LoggedSet with highest weight
- **Optimization**: O(N*M) work happens once when sessionHistory changes, then O(1) lookups per exercise in queueExercises
- **Dependency**: Map keyed on `sessionHistory`, so it recalculates only when history is loaded or session completes
- **LoggedSet**: Already imported at line 42, no new imports needed

### Files Modified
- `web/src/components/screens/today-screen.tsx` (added memo, replaced call, updated deps, deleted function)

### Status
COMPLETE. lastPerformanceMap now pre-computed, queueExercises has O(1) lookups instead of O(N*M).

---

## 2026-04-09 -- Task 1: Fix Exercise Swap Bugs (pendingSubs state) -- COMPLETE

### Goal
Fix two exercise swap bugs:
1. "Just this session" button was hidden behind `matchingActiveSession` check -- should always be visible
2. Session-only subs for RP programs were keyed by exercise name, causing collisions when two slots have same exercise (e.g. two "Quads" slots both defaulting to "Squat (Barbell)")

### What Was Done
[x] Change 1: Added `pendingSubs` state (line 239)
[x] Change 2: Reordered sub resolution in queueExercises memo (lines 360-366) -- now checks pendingSubs before session.substitutions
[x] Change 3: Updated handleSwapConfirm (lines 939-953) -- "just this session" now stores in pendingSubs with proper key
[x] Change 4: Updated ensureActiveSession (lines 542-562) -- carries pendingSubs into new session when starting workout
[x] Change 5: Removed conditional wrapper from "Just this session" button (line 1713) -- now always visible
[x] Change 6: Added pendingSubs to queueExercises dependency array (line 407)
[x] Type check: 0 errors (npx tsc --noEmit)

### Details
- **pendingSubs structure**: `Record<string, string>` keyed like `programId:day:slotId` or `programId:day:exerciseName`
- **Resolution order**: pendingSubs (user pending) > session.substitutions (already-started) > permanent subs > original
- **RP slot fix**: For RP programs, use `exercise.rpSlotId` in key instead of `exercise.name`, avoiding collisions
- **ensureActiveSession logic**: When starting new session, extract pending subs and convert keys from `programId:day:subId` to `subId` format for session storage
- **Button visibility**: Removed `matchingActiveSession &&` guard, so "Just this session" appears even when no active session yet

### Files Modified
- `web/src/components/screens/today-screen.tsx` (6 changes across lines 239, 360-366, 939-953, 542-562, 1713, 407)

### Status
COMPLETE. All changes applied, type-checked, ready for testing.


---

## 2026-04-09 -- Task 2: Add migrateRpSubKeys Migration Function -- COMPLETE

### Goal
Add `migrateRpSubKeys()` function to exercise-substitutions.ts to handle backward compatibility. Old permanent subs were keyed by exercise name (`programId:day:exerciseName`), but RP programs need slotId-based keys (`programId:day:slotId`) to avoid collisions.

### What Was Done
[x] Added migrateRpSubKeys() export to exercise-substitutions.ts
[x] Function signature: takes user, programId, slots array, and selections map
[x] Logic: walks slots, compares old-format keys with new-format keys, moves values and deletes old keys
[x] Idempotent: skips migration if new key already exists (prevents double-migration)
[x] Only calls save() if changes were made (avoids unnecessary localStorage writes)
[x] Type check: 0 errors (npx tsc --noEmit)
[x] Committed (ee1fd2c)

### Details
- **Old key format**: `programId:day:exerciseName` (caused collisions for duplicate exercises like two Quad slots)
- **New key format**: `programId:day:slotId` (unique per slot, even if same exercise)
- **Idempotency**: Checks `userSubs[newKey] === undefined` before moving, so multiple runs are safe
- **Change tracking**: `changed` flag prevents save() call if no work was done

### Files Modified
- `web/src/lib/exercise-substitutions.ts` (added migrateRpSubKeys export)

### Next Steps (Task 3 & 4)
This function is now ready to be wired into today-screen.tsx in the main workout initialization logic. Will be called during getRpExercisesForDay() or in the useEffect that initializes RP program state.

### Status
COMPLETE. Function implemented, type-checked, and committed.

---

## 2026-04-09 -- Task 3: Wire dedupe + migration into today-screen useEffect -- COMPLETE

### Goal
Wire `dedupeRpSelections()` and `migrateRpSubKeys()` into a mount-only useEffect in today-screen.tsx to fix duplicate exercise bug and migrate old sub keys on program load.

### What Was Done
[x] Added import: `dedupeRpSelections` to rp-store import (line 49)
[x] Added import: `migrateRpSubKeys` to exercise-substitutions import (line 55)
[x] Added import: `getRpExercisesForCategory` from rp-exercise-library (new line 58)
[x] Added useEffect right after rpState useState (lines 253-272)
  - Checks `!isRpProgram || !rpState` early return
  - Fetches template via `getRpTemplate(programId)`
  - Calls `dedupeRpSelections()` with selections, slots, and lookup function
  - If patched, saves to localStorage and updates local state
  - Calls `migrateRpSubKeys()` with old sub format keys, migrates them
  - Dependency array: `[]` (intentional mount-only, eslint-disable-next-line added)
[x] Type check: 0 errors (npx tsc --noEmit)
[x] Tests: 8 test files, 185 tests, all passing
[x] Committed (8e388ad)

### Details
- **Early returns**: Exits immediately if not RP program or rpState not initialized
- **Dedup flow**: Get template, run dedupe, if patched save and update state
- **Migration flow**: Always run after dedupe, migrates old key format to new one
- **Mount-only behavior**: Empty dependency array ensures this runs exactly once per component mount
- **Intentional lint disable**: ESLint exhaustive-deps is deliberately disabled with comment

### Files Modified
- `web/src/components/screens/today-screen.tsx` (3 imports, 20-line useEffect)

### Status
COMPLETE. Deduplication and migration now wired into component lifecycle, running on mount before any render.

---

## 2026-05-13 -- Foundation (MVP) 3-Day Template -- COMPLETE

### Goal
Add a "minimum viable" 3-day program for habit re-formation during low-motivation periods. Synthesized greatest-hits exercises from Mass Impact / RAVAGE / RAMPAGE / Nippard splits, filtered for "minimum dose that still moves aesthetics." 5 lifts per day, ~40 min sessions.

### What Was Done
[x] Verified all 15 canonical exercise names exist in exercise-library.ts (grep confirmed each)
[x] Created `web/src/lib/program-data-foundation.ts` mirroring program-data-nippard-minimalist.ts structure
[x] Added `foundation` import to program-registry.ts
[x] Added Foundation (MVP) metadata to PROGRAM_REGISTRY (3-day, double-progression, no auto-regulation, volume tracking on) -- slotted right after `nippard-minimalist`
[x] Added `foundation` branches to `getExercisesForDay()` and `getDayTitle()`
[x] TypeScript: 0 errors (npx tsc --noEmit)
[x] Vitest: 8 files, 185 tests, all passing
[x] Dev server boots clean (HTTP 200)
[x] Playwright UI verification: Foundation appears in dropdown, Day 1 renders "Upper (Push)" with "Incline Bench Press (Dumbbell)" as exercise 1, all 3 day titles correct, sets/reps/notes populate

### Design Summary
- **Day 1 Upper (Push)**: Incline DB Press, Cable Lateral Raise, Chest-Supported Row, Cable Overhead Tricep Ext, Cable Crunch (optional)
- **Day 2 Lower**: Hack Squat, RDL, Walking Lunge, Standing Calf Raise, Hanging Knee Raise (optional)
- **Day 3 Upper (Pull)**: Neutral-Grip Pull-Up, Single Arm Cable Row, Cable Lateral Raise, Incline DB Curl, Face Pull (optional)
- Side delts hit 2x/week intentionally (highest aesthetic ROI per set)
- Notes on each lift include rep guidance + skip-rules for low-motivation days

### Files Modified
- `web/src/lib/program-data-foundation.ts` (new, 122 lines)
- `web/src/lib/program-registry.ts` (3 small edits: import, metadata entry, two switch branches)

### Status
COMPLETE. Foundation (MVP) is selectable from the program dropdown. Renders + logs identically to other no-RP programs. Not committed yet -- waiting on user.

### Note (housekeeping)
WORKLOG.md is at 1300+ lines, well past the 200-line target. Older completed sections should be archived to WORKLOG-ARCHIVE.md when the user has time.
