# Simple Double-Progression Split Templates -- Design Spec

**Date:** 2026-04-07
**Status:** Approved
**Scope:** 4 new programs using RP splits with standard double-progression

## Overview

Add 4 split templates that reuse the RP template exercise structure (slots, categories, exercise variety) but use simple double-progression instead of RP's autoregulation system. No mesocycles, no 10RM, no recovery ratings. Works like RAVAGE and RAMPAGE -- log sets, hit the top of the rep range, bump weight next session.

## Programs

| ID | Name | Days | Split | Profile |
|----|------|------|-------|---------|
| `split-fb3` | Full Body 3-Day (Push/Legs/Pull) | 3 | Push / Legs / Pull emphasis | both |
| `split-fb4` | Full Body 4-Day (Upper/Lower) | 4 | Upper / Lower alternating | both |
| `split-arms4` | Arms-Focus 4-Day | 4 | Tri+Front / Bi+Rear alternating | both |
| `split-chest4` | Chest/Back 4-Day | 4 | Chest push / Back pull alternating | both |

All use `periodizationType: "double-progression"`, `cycleLength: 0` (ongoing), `hasAutoRegulation: false`, `hasVolumeTracking: true`.

## Data Derivation

Each program reads the corresponding RP template's slot data and converts to simple ProgramExercise arrays:

- **Exercise name:** First exercise from `RP_CATEGORIES[slot.muscleCategory]` (user can swap via the existing swap feature)
- **Sets:** `slot.baseSets.basic` (the Meso 1 basic hypertrophy value -- mostly 3, some 2 or 4)
- **Reps:** Determined by exercise type from exercise-library.ts:
  - Compound exercises: "8-12 reps"
  - Isolation exercises: "10-15 reps"
- **Excluded:** Slots with `baseSets.basic === 0` (exercises that don't exist in the basic meso)
- **Rest seconds:** `getDefaultRestSeconds(exerciseName)` (existing function)
- **Superset groups:** Not used in simple mode (supersets are a Meso 2 metabolite concept)

### Source template mapping

| Program | Source Template | Source File |
|---------|---------------|-------------|
| `split-fb3` | `RP_TEMPLATE_NF3` | `rp-template-nf3.ts` |
| `split-fb4` | `RP_TEMPLATE_NF4` | `rp-template-nf4.ts` |
| `split-arms4` | `RP_TEMPLATE_NA4` | `rp-template-na4.ts` |
| `split-chest4` | `RP_TEMPLATE_NC4` | `rp-template-nc4.ts` |

## Files

| File | Action | Description |
|------|--------|-------------|
| `web/src/lib/program-data-splits.ts` | **Create** | Exports `getSplitDayTemplate(programId, dayNumber)` -- reads RP template slots, returns exercises as ProgramExercise[] |
| `web/src/lib/program-registry.ts` | **Modify** | Register 4 programs in PROGRAM_REGISTRY, add to `getExercisesForDay()` and `getDayTitle()` |

### No changes to:
- today-screen.tsx (uses standard rendering path like RAVAGE)
- exercise-queue-card.tsx
- exercise-library.ts
- Any RP engine/store/types files
- globals.css

## Implementation Details

### `program-data-splits.ts`

```ts
import type { ProgramExercise } from "./program-data";
import { getDefaultRestSeconds } from "./program-data";
import { RP_TEMPLATE_NF3 } from "./rp-template-nf3";
import { RP_TEMPLATE_NF4 } from "./rp-template-nf4";
import { RP_TEMPLATE_NA4 } from "./rp-template-na4";
import { RP_TEMPLATE_NC4 } from "./rp-template-nc4";
import { getRpExercisesForCategory } from "./rp-exercise-library";
import { findExercise } from "./exercise-library";
import type { RpTemplate } from "./rp-types";

const TEMPLATE_MAP: Record<string, RpTemplate> = {
  "split-fb3": RP_TEMPLATE_NF3,
  "split-fb4": RP_TEMPLATE_NF4,
  "split-arms4": RP_TEMPLATE_NA4,
  "split-chest4": RP_TEMPLATE_NC4,
};

export function getSplitDayTemplate(
  programId: string,
  dayNumber: number,
): { title: string; exercises: ProgramExercise[] } | null {
  const template = TEMPLATE_MAP[programId];
  if (!template) return null;

  const title = template.dayTitles[dayNumber - 1];
  if (!title) return null;

  const daySlots = template.slots.filter(
    s => s.dayNumber === dayNumber && s.baseSets.basic > 0
  );

  const exercises: ProgramExercise[] = daySlots.map((slot, i) => {
    const categoryExercises = getRpExercisesForCategory(slot.muscleCategory);
    const name = categoryExercises[0] ?? slot.muscleCategory;
    const def = findExercise(name);
    const isIsolation = def?.type === "isolation";
    const reps = isIsolation ? "10-15 reps" : "8-12 reps";

    return {
      order: i + 1,
      orderLabel: String(i + 1),
      name,
      setGroups: [{ sets: slot.baseSets.basic, reps }],
      restSeconds: getDefaultRestSeconds(name),
    };
  });

  return { title, exercises };
}
```

### Registry additions

In `program-registry.ts`, add 4 entries to PROGRAM_REGISTRY and handle them in `getExercisesForDay()` and `getDayTitle()` with a `programId.startsWith("split-")` check that delegates to `getSplitDayTemplate()`.

## Double Progression Behavior

These programs use `periodizationType: "double-progression"`, which already triggers the "All sets hit top of range -- bump weight next session" banner in today-screen.tsx (line ~1215). No new code needed for the progression logic.

## Exercise Swap

The existing swap feature (⇄ icon on queue cards) works automatically. It opens the ExercisePickerModal filtered by the exercise's primary muscle group, showing S-tier then A-tier alternatives. Permanent swaps are saved per program/day in localStorage via the existing substitution system.
