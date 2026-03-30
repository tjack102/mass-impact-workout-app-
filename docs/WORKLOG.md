# Work Log

_History through Hypertrophy Hub (all 22 tasks) archived in `docs/WORKLOG-ARCHIVE.md`_

---

## 2026-03-29 — Warmup Engine — Task 1: Types + Tests

### Goal
Create warmup calculation engine with full test suite. This is TDD-style: write types, write tests (all failing), then implement.

### Files to touch
- Create: `web/src/lib/warmup-engine.ts` (types + stub)
- Create: `web/src/lib/__tests__/warmup-engine.test.ts` (full test suite)

### Status: COMPLETE
- [x] Create engine file with types and stub
- [x] Create test file with full suite
- [x] Run tests (expect all to fail except 0/negative weight edge cases)
- [x] Commit

### Test results
- 7 passed (edge cases: 0 weight, negative weight, rounding increment, clamping, deduplication)
- 15 failed (all main logic tests -- expected, stub returns empty array)

### What was done
- Created `web/src/lib/warmup-engine.ts` with `WarmupSet` and `WarmupOptions` types + `calculateWarmupSets()` stub
- Created `web/src/lib/__tests__/warmup-engine.test.ts` with 22-test suite covering:
  - Edge cases (0 weight, negative, <=45 lbs)
  - Standard protocol (light + intermediates + potentiation by weight tier)
  - Threshold boundaries (66/200/201/400/401 lbs)
  - Rounding (2.5, 5, 10 lb increments)
  - Bar weight clamping (45 lb minimum)
  - Custom start percent
  - Potentiation set specs
  - Abbreviated mode
  - Weight deduplication
- Test suite validates behavior spec: ~25 lbs light set, 50-75% intermediate sets, full working weight on potentiation, 2-3 reps final set

---

## 2026-03-27 — Mass Impact Program Updates — COMPLETE

### Changes
- `9e88997` fix: mass impact vanilla day 5 wk1-4 incline/shoulder to 3x8-10 straight sets
- `b0be872` feat: add Reverse Pec Dec to exercise library
- `734ddaf` feat: add mass impact max volume program data (12-week, EOD variant)
- `ff6d687` feat: register mass impact max volume in program registry
- `bf21f9a` fix: em dashes in program strings

### What changed
- Fixed a bug in vanilla Mass Impact: Day 5 weeks 1-4, Incline Bench and Seated Shoulder Press were incorrectly showing the weeks 5-8 scheme (1x6-8+2x8-10) instead of 3x8-10 straight sets
- Added "Mass Impact (Max Volume)" as a new selectable program -- same split/periodization as vanilla but with higher set counts (+1 set on most accessories) and new exercises (Leg Extension, Lying Leg Curl, Reverse Pec Dec, Spider Curl, extra Lateral Raise slots)
- Deployed to https://web-blush-phi.vercel.app

---

## 2026-03-27 — UX Overhaul — COMPLETE

### Status: All 4 features implemented, reviewed, committed

### Commits
- `7a25761` feat: nav polish -- 5-item mobile nav, labels, settings gear in banner
- `344599a` fix: remove redundant min-height from .mobile-link
- `67db85a` feat: active workout mode -- hide nav, show status bar during live session
- `5078597` fix: workout mode code quality
- `531278a` feat: PR detection -- Epley e1RM comparison, green badge, haptic feedback
- `7877e74` fix: cleanup prFlash timeout, consistent vibrate guard
- `721717f` feat: progress chart rework -- weekly ISO aggregation, SVG strength charts, e1RM trend
- `fdf950e` fix: strength chart y-axis key collision, remove unused date field

### What was built
1. **Nav Polish** -- 5-item mobile nav (Settings removed, relocated to profile banner gear icon), min-height 56px, active state uses `--accent-primary`
2. **Active Workout Mode** -- `workout-session-change` custom DOM event from workout-store; app-shell hides nav when `hasSession`; status bar (elapsed time, set count, exercise name, End Workout button) in today-screen; touch target overrides (52-56px)
3. **PR Detection** -- Pure `detectPR()` in `pr-engine.ts` (Epley e1RM); green PR badge in logged set row; green border pulse on queue card; double haptic; 29/29 Vitest tests passing
4. **Progress & Data Viz** -- TrendChartCard updated for labeled WeekPoint data + SVG trend polyline; new StrengthChartCard with SVG non-zero y-axis, rep labels, dashed e1RM trend, moving average; ISO week aggregation in progress-screen

### Final state
- TypeScript: 0 errors
- Tests: 29/29 pass
- Branch: main

### What was done
- Replaced `TrendChartCard` `points: number[]` API with `WeekPoint[] = { label, value }` + SVG overlay trend line connecting bar midpoints
- Created `web/src/components/strength-chart-card.tsx`: full inline SVG chart with raw weight dots, dashed e1RM trend (Epley formula), 3-session moving average, y-axis labels, and rep annotations per dot
- Added `isoWeekKey()` helper to bin sessions by real ISO calendar week (no date-fns dependency); caveat on midnight/UTC edge documented inline
- Updated `progress-screen.tsx`: removed `getWeeklyVolume` + `toPoints` helper; ISO aggregation replaces program-week binning; squat/incline/pullup now use `StrengthChartCard` individually (4 cards total in grid-3)
- Type check: 0 errors. Tests: 29/29 pass.

---

## 2026-03-27 — UX Overhaul Design + Plan

### Goal
Research fitness UX best practices, design a 4-feature UX overhaul, and write an implementation plan ready for execution.

### Status: COMPLETE
- Research done 2026-03-25 (see archived entries)
- Spec: `docs/superpowers/specs/2026-03-27-ux-overhaul-design.md` (approved after 2 reviewer passes)
- Plan: `docs/superpowers/plans/2026-03-27-ux-overhaul.md` (approved after 2 reviewer passes)

### Features planned (execution order)
1. Nav Polish -- 5 items, full labels, Settings gear in profile banner
2. Active Workout Mode -- hide nav, show status bar during live session, 52px+ touch targets
3. PR Detection -- `detectPR()` in `pr-engine.ts`, green badge, haptic feedback
4. Progress & Data Viz -- ISO weekly aggregation, SVG strength charts, e1RM trend line

### Key spec fixes made during review
- Active session detection: use `getActiveSession() !== null` (not key existence -- key stores object)
- Reactive sync: custom `workout-session-change` DOM event dispatched from workout-store functions
- Type: `WorkoutSession[]` not `SessionLog[]`; sets are `LoggedSet[]` with `.exerciseName/.weight/.reps`
- ISO week: inline helper (no date-fns), with UTC/local caveat documented

---

## 2026-03-25 — UX/UI Research Session

### Goal
Research fitness app UX best practices from validated, citable sources (academic, HCI, major app case studies). Findings to inform future UI improvements.

### Status: COMPLETE
- Searched PMC, Springer, NN/G, Smashing Magazine, arXiv, and app-specific case studies
- Findings cover: retention/abandonment, workout logging patterns, gym-context mobile UX, dark mode, data viz, micro-interactions, navigation
- Results returned directly to user as structured report

---

## 2026-03-25 — Add RAMPAGE + 4-Day Upper/Lower Programs

### Goal
Add two new programs to the workout app: RAMPAGE (3x/week full body, GVS) and 4-Day Upper/Lower (4x/week, Zepeda modified).

### Steps
- [x] Add 18 exercises to `exercise-library.ts` (Arnold Press, Pec Deck, Skiers, Hanging Leg Raise, Front Squat, Spider Curl, Platz Squat, Yates Row, Klokov Press, Good Morning, Lateral Raise (Dumbbell), Pallof Press, Incline Bench Press (Barbell), Preacher Curl, Skull Crusher, Cable Chest Fly, Hack Squat, Seated Wide-Grip Row)
- [x] Create `program-data-rampage.ts` (3 day templates, weeks 5+10 deload)
- [x] Create `program-data-upper-lower.ts` (4 day templates, week 7 deload)
- [x] Register both in `program-registry.ts` with correct deload logic
- [x] Verify all 48 exercise names resolve in library

### Deload Logic Difference
- RAMPAGE: sets → 1 (weeks 5 & 10) -- same as RAVAGE
- Upper/Lower: sets → Math.ceil(sets/2) (week 7) -- half-volume, not zero

### Status: COMPLETE

---

## 2026-03-19 — Fix Vercel Deployment

### Goal
Deploy theme system to Vercel (webhook broken) and fix branch naming (local `master` vs remote `main`).

### Steps
- [x] Deploy via `vercel --prod` from web/ — deployed to https://web-blush-phi.vercel.app
- [x] Rename local `master` → `main`, push to origin — tracking set
- [x] Verify theme picker visible on live site — confirmed via Playwright

### Status: COMPLETE

---

## 2026-03-18 — Theme System

### Goal
Add 4-theme switchable system: Iron Ledger (current), WARZONE, NEON OVERLOAD, CONCRETE.
Spec: `docs/superpowers/specs/2026-03-18-theme-system-design.md`

### Status: Writing implementation plan
- [x] Spec written and reviewed (2 review passes)
- [ ] Implementation plan
- [ ] Execute plan

---

## 2026-03-17 — Session 3: Tasks 20-22 Completed (ALL DONE)

### Tasks completed this session
- [x] Task 20: Manual Set/Rep Override — commit `d95c4c3`
- [x] Task 21: Deload Badges + Meso Advancement — commit `b6b45cc`
- [x] Task 22: Final Integration + Verification — commit `540f685` (lint fixes)

### Key implementation notes
- Override editor: tappable scheme text → inline Sets/Reps form → saves to session.overrides
- Overrides keyed by exercise name, apply in queueExercises memo, session-only (don't persist to template)
- Meso advancement: counts sessions since mesoState.startDate, advances weekInMeso when cycle complete
- Deload detection: isDeloadDue() check after session completion → banner notification (auto-dismiss 8s)
- New meso: advanceMeso() called after deload week sessions complete → bumps targets based on recovery
- Volume dashboard: "Next Week Recommendations" section for auto-reg programs
- Lint fixes: suppressed react-hooks/set-state-in-effect for SSR localStorage hydration pattern, removed unused MuscleGroup import

---

## 2026-03-16 — Session 2: Tasks 14-19 Completed

### Tasks completed this session
- [x] Task 14: Volume Store (`volume-store.ts`) — commit `b5f62ac`
- [x] Task 15: Recovery Rating Prompt (`recovery-rating-prompt.tsx` + today-screen integration) — commit `03b27f8`
- [x] Task 16: Volume Bar + Sparkline Components — commit `64198dd`
- [x] Task 17: Volume Dashboard Screen (full replacement of placeholder) — commit `70efbf1`
- [x] Task 18: Hers Program Data (LULUL, PPLPP, Custom — 15 day templates) — commit `e70eeb1`
- [x] Task 19: Settings — Volume Landmarks Editor — commit `2e2508d`

---

## Final State — All 22 Tasks Complete

### Branch & Commit State
- **Branch:** `hypertrophy-hub` (master is untouched/safe)
- **HEAD:** `540f685` — "chore: fix lint errors"
- **Build:** clean — all 11 routes prerender
- **Tests:** 22/22 vitest tests pass
- **Lint:** 0 errors, 1 pre-existing warning (planner-screen useMemo dep)

### Complete Task List

| Task | Status | Commit |
|------|--------|--------|
| 1. Shared Types | Done | `9e3b67d` |
| 2. Exercise Library | Done | `5a9d4bd` |
| 3. Program Registry | Done | `c0af3a2` |
| 4. Workout Store Extensions | Done | `dac625f` |
| 5. Program Selector + App Shell | Done | `a06ce9f` |
| 6. Volume Route Placeholder | Done | `a62503f` |
| 7. RAVAGE Program Data | Done | `0dedd9c` |
| 8. Today Screen — Program-Aware | Done | `675ad48` |
| 9. Superset Visual Grouping | Done | `dfba590` |
| 10. Double Progression | Done | `321aae9` |
| 11. Planner — Cycle-Based | Done | `42ddff5` |
| 12. Install Vitest | Done | `22d06b3` |
| 13. Volume Engine (TDD) | Done | `2b6e54c` |
| 14. Volume Store | Done | `b5f62ac` |
| 15. Recovery Rating Prompt | Done | `03b27f8` |
| 16. Volume Bar + Sparkline | Done | `64198dd` |
| 17. Volume Dashboard | Done | `70efbf1` |
| 18. Hers Program Data | Done | `e70eeb1` |
| 19. Settings — Landmarks Editor | Done | `2e2508d` |
| 20. Manual Set/Rep Override | Done | `d95c4c3` |
| 21. Deload Badges + Meso Advance | Done | `b6b45cc` |
| 22. Final Integration + Verify | Done | `540f685` |

### What Was Built
The Hypertrophy Hub extension transforms the single-program Mass Impact app into a multi-program training platform:

- **5 programs:** Mass Impact (12-week block), RAVAGE (6-day double progression), LULUL/PPLPP/Custom (Hers auto-regulated)
- **Volume tracking:** RP-style MEV/MAV/MRV landmarks, weekly volume bars, sparkline trends
- **Recovery system:** Post-workout -2 to +2 muscle recovery ratings
- **Mesocycle management:** Auto-advancing week counter, deload detection, volume recommendations
- **Session overrides:** Tap scheme text to adjust sets/reps for current session only
- **Household profiles:** His/Hers with independent program selection and data isolation
