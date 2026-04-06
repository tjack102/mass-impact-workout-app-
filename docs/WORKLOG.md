# Work Log

_History through UX Overhaul archived in `docs/WORKLOG-ARCHIVE.md`_

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

## HANDOFF

### Current State
- **Working:** Everything deployed at https://web-blush-phi.vercel.app
- **Working:** Exercise library at 139 exercises
- **Working:** 51/51 tests, 0 TypeScript errors
- **Working:** lucide-react installed, icons.tsx created (Task 1 of UX/UI overhaul)
- **Working:** confirm-dialog.tsx created (Task 4 of UX/UI overhaul)
- **Working:** tabs.tsx created + tab CSS added (Task 5 of UX/UI overhaul)
- **Working:** Global CSS foundation added (Task 2 of UX/UI overhaul)
- **Working:** App shell redesigned with 5-item nav + SVG icons (Task 3)
- **Working:** Volume merged into Progress as tabbed screen (Task 6)
- **Broken:** Nothing known

### Next Steps
1. Continue UX/UI overhaul -- remaining tasks per `docs/superpowers/plans/2026-04-02-ux-ui-overhaul.md`
2. Commit completed tasks when ready

### Context
- UX/UI overhaul plan: `docs/superpowers/plans/2026-04-02-ux-ui-overhaul.md`
- Nippard Minimalist plan is at `docs/superpowers/plans/2026-04-02-nippard-minimalist.md`
