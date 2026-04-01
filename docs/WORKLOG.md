# Work Log

_History through UX Overhaul archived in `docs/WORKLOG-ARCHIVE.md`_

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

## HANDOFF

### Current State
- **Working:** Everything deployed at https://web-blush-phi.vercel.app
- **Working:** Exercise library screen with 137 S/A tier exercises
- **Working:** Exercise swap from workout queue cards
- **Working:** Add-to-routine from library screen
- **Working:** 51/51 tests, 0 TypeScript errors
- **Broken:** Nothing known

### Next Steps
1. ExRx URLs -- currently undefined on all exercises; need to populate with actual ExRx.net links
2. Visual testing -- verify library screen and swap flow on mobile/desktop
3. Consider: exercise search on the library screen itself (not just the picker)

### Context
- The `clearPermanentSub` function exists in exercise-substitutions.ts but isn't wired into the UI yet (the revert flow from the spec). The swap icon always opens the picker -- there's no "revert to original" option yet.
- ExRx URLs were skipped during data expansion to save time. The `exrxUrl` field is on the type and exercises, just unpopulated.
- The nippard tier list master document is at `docs/nippard-tier-list.md` for reference.
