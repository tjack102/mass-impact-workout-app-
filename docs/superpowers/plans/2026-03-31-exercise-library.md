# Exercise Library & Swap Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add a browsable S/A-tier exercise library with exercise swap from workout cards and "add to routine" from a standalone library screen.

**Architecture:** Expand the data layer (types + exercise-library.ts), add a substitution store for session/permanent swaps, build a reusable picker modal, create a library screen + route, and integrate swap into the existing exercise queue cards on the today screen.

**Tech Stack:** Next.js 16 + React 19 + TypeScript 5 + Tailwind CSS 4, localStorage persistence, no new dependencies.

**Spec:** `docs/superpowers/specs/2026-03-31-exercise-library-design.md`

---

## File Map

### New Files
| File | Responsibility |
|------|---------------|
| `web/src/lib/exercise-substitutions.ts` | Permanent + session substitution CRUD (localStorage `mi_substitutions`) |
| `web/src/lib/exercise-additions.ts` | "Add to end" CRUD for registry programs (localStorage `mi_additions`) |
| `web/src/components/exercise-picker-modal.tsx` | Reusable modal: search, S/A tiers, equipment pills, ExRx links |
| `web/src/components/screens/library-screen.tsx` | Standalone library page: muscle group sections, add-to-routine |
| `web/src/app/library/page.tsx` | Next.js route for `/library` |

### Modified Files
| File | Changes |
|------|---------|
| `web/src/lib/types.ts` | Add `tier?: "S" \| "A"` and `exrxUrl?: string` to `ExerciseDefinition` |
| `web/src/lib/exercise-library.ts` | Expand from ~80 to ~120+ exercises, assign tiers, add exrxUrls |
| `web/src/lib/workout-store.ts` | Add `substitutions?: Record<string, string>` to `WorkoutSession` |
| `web/src/components/exercise-queue-card.tsx` | Add swap icon, `originalName` prop, swap indicator |
| `web/src/components/screens/today-screen.tsx` | Substitution resolution in `queueExercises`, swap flow, `originalName` on `QueueExercise` |
| `web/src/components/app-shell.tsx` | Add Library to `navItems` |
| `web/src/app/globals.css` | Styles for library screen, picker modal, exercise rows, tier headers, swap icon |

---

## Task 1: Type Changes

**Files:**
- Modify: `web/src/lib/types.ts:10-17`

- [ ] **Step 1: Add tier and exrxUrl to ExerciseDefinition**

In `web/src/lib/types.ts`, add two optional fields to the existing interface:

```typescript
export interface ExerciseDefinition {
  id: string;
  name: string;
  primaryMuscle: MuscleGroup;
  secondaryMuscles: { muscle: MuscleGroup; factor: number }[];
  type: ExerciseType;
  equipment: Equipment;
  tier?: "S" | "A";
  exrxUrl?: string;
}
```

- [ ] **Step 2: Add substitutions to WorkoutSession**

In `web/src/lib/workout-store.ts`, add to the `WorkoutSession` type (after the `overrides` field at line 37):

```typescript
export type WorkoutSession = {
  id: string;
  programId: string;
  weekNumber: number;
  dayNumber: number;
  startedAt: number;
  completedAt?: number;
  sets: LoggedSet[];
  overrides?: Record<string, { sets?: number; reps?: string }>;
  substitutions?: Record<string, string>;  // originalExerciseName -> replacementExerciseName
};
```

- [ ] **Step 3: Verify TypeScript compiles**

Run: `cd web && npx tsc --noEmit`
Expected: 0 errors (new fields are optional, no consumers break)

- [ ] **Step 4: Commit**

```bash
git add web/src/lib/types.ts web/src/lib/workout-store.ts
git commit -m "feat: add tier, exrxUrl to ExerciseDefinition and substitutions to WorkoutSession"
```

---

## Task 2: Exercise Library Data Expansion

**Files:**
- Modify: `web/src/lib/exercise-library.ts`
- Reference: `docs/nippard-tier-list.md`

This is the largest single task -- expanding from ~80 to ~120+ exercises. Work through the tier list muscle group by muscle group.

- [ ] **Step 1: Assign tiers to existing exercises**

Go through the current `EXERCISE_LIBRARY` array and add `tier: "S"` or `tier: "A"` to every exercise that appears in `docs/nippard-tier-list.md`. Cross-reference carefully -- names won't always match exactly (e.g., "Squat (Barbell)" in the library = "Barbell Back Squat (High Bar)" in the tier list). Exercises not on the tier list get no `tier` field.

- [ ] **Step 2: Add new S-tier exercises**

Add all S-tier exercises from `docs/nippard-tier-list.md` that don't already exist in the library. For each new exercise, create a full `ExerciseDefinition` with:
- `id`: kebab-case slug (e.g., `"pendulum-squat"`)
- `name`: descriptive name matching tier list (e.g., `"Pendulum Squat"`)
- `primaryMuscle`: mapped per spec Section 1 muscle group table
- `secondaryMuscles`: follow existing RP conventions in the file header comment (rows -> biceps 0.5, presses -> triceps 0.5 + front_delts 0.5, etc.)
- `type`: `"compound"`, `"isolation"`, or `"stretch"`
- `equipment`: one of `"barbell" | "dumbbell" | "cable" | "machine" | "bodyweight" | "smith_machine"`
- `tier: "S"`

- [ ] **Step 3: Add new A-tier exercises**

Same as Step 2 but for all A-tier exercises. Set `tier: "A"`.

- [ ] **Step 4: Add exrxUrl where available**

For each exercise (new and existing), look up the matching ExRx.net page. ExRx URLs follow the pattern `https://exrx.net/WeightExercises/{MuscleGroup}/{ExerciseName}`. Add `exrxUrl` where a page exists. Leave undefined where no match. Don't guess -- only add URLs for pages you can confirm exist.

- [ ] **Step 5: Verify TypeScript compiles and count exercises**

Run: `cd web && npx tsc --noEmit`
Expected: 0 errors

Verify exercise count with a quick grep:
Run: `grep -c "id:" web/src/lib/exercise-library.ts`
Expected: ~120-130

- [ ] **Step 6: Verify existing tests still pass**

Run: `cd web && npx vitest run`
Expected: All tests pass (existing exercise lookups shouldn't break)

- [ ] **Step 7: Commit**

```bash
git add web/src/lib/exercise-library.ts
git commit -m "feat: expand exercise library to ~120+ exercises with S/A tiers and ExRx links"
```

---

## Task 3: Exercise Substitution Store

**Files:**
- Create: `web/src/lib/exercise-substitutions.ts`

- [ ] **Step 1: Create the substitution store**

Create `web/src/lib/exercise-substitutions.ts` with permanent substitution CRUD:

```typescript
import type { HouseholdUser } from "./household-profiles";

const STORAGE_KEY = "mi_substitutions";

type SubstitutionMap = Record<string, string>;
type PermanentSubstitutions = Record<HouseholdUser, SubstitutionMap>;

function buildKey(programId: string, day: number, exerciseName: string): string {
  return `${programId}:${day}:${exerciseName}`;
}

function load(): PermanentSubstitutions {
  if (typeof window === "undefined") return { his: {}, hers: {} };
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    return raw ? JSON.parse(raw) : { his: {}, hers: {} };
  } catch {
    return { his: {}, hers: {} };
  }
}

function save(data: PermanentSubstitutions): void {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
}

export function getPermanentSub(
  user: HouseholdUser,
  programId: string,
  day: number,
  exerciseName: string,
): string | undefined {
  return load()[user][buildKey(programId, day, exerciseName)];
}

export function setPermanentSub(
  user: HouseholdUser,
  programId: string,
  day: number,
  exerciseName: string,
  replacement: string,
): void {
  const data = load();
  data[user][buildKey(programId, day, exerciseName)] = replacement;
  save(data);
}

export function clearPermanentSub(
  user: HouseholdUser,
  programId: string,
  day: number,
  exerciseName: string,
): void {
  const data = load();
  delete data[user][buildKey(programId, day, exerciseName)];
  save(data);
}

export function getAllPermanentSubs(user: HouseholdUser): SubstitutionMap {
  return load()[user];
}
```

- [ ] **Step 2: Verify TypeScript compiles**

Run: `cd web && npx tsc --noEmit`
Expected: 0 errors

- [ ] **Step 3: Commit**

```bash
git add web/src/lib/exercise-substitutions.ts
git commit -m "feat: add exercise substitution store with permanent CRUD"
```

---

## Task 4: Exercise Additions Store

**Files:**
- Create: `web/src/lib/exercise-additions.ts`

- [ ] **Step 1: Create the additions store**

Create `web/src/lib/exercise-additions.ts` for the "Add to end" feature on registry-based programs:

```typescript
import type { HouseholdUser } from "./household-profiles";
import type { ProgramExercise } from "./program-data";

const STORAGE_KEY = "mi_additions";

type AdditionsMap = Record<string, ProgramExercise[]>;
type ProgramAdditions = Record<HouseholdUser, AdditionsMap>;

function buildKey(programId: string, day: number): string {
  return `${programId}:${day}`;
}

function load(): ProgramAdditions {
  if (typeof window === "undefined") return { his: {}, hers: {} };
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    return raw ? JSON.parse(raw) : { his: {}, hers: {} };
  } catch {
    return { his: {}, hers: {} };
  }
}

function save(data: ProgramAdditions): void {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
}

export function getAdditions(
  user: HouseholdUser,
  programId: string,
  day: number,
): ProgramExercise[] {
  return load()[user][buildKey(programId, day)] ?? [];
}

export function addExerciseToDay(
  user: HouseholdUser,
  programId: string,
  day: number,
  exercise: ProgramExercise,
): void {
  const data = load();
  const key = buildKey(programId, day);
  const existing = data[user][key] ?? [];
  data[user][key] = [...existing, exercise];
  save(data);
}

export function removeAddition(
  user: HouseholdUser,
  programId: string,
  day: number,
  exerciseName: string,
): void {
  const data = load();
  const key = buildKey(programId, day);
  const existing = data[user][key] ?? [];
  data[user][key] = existing.filter((e) => e.name !== exerciseName);
  if (data[user][key].length === 0) delete data[user][key];
  save(data);
}
```

- [ ] **Step 2: Verify TypeScript compiles**

Run: `cd web && npx tsc --noEmit`
Expected: 0 errors

- [ ] **Step 3: Commit**

```bash
git add web/src/lib/exercise-additions.ts
git commit -m "feat: add exercise additions store for registry program customization"
```

---

## Task 5: Exercise Picker Modal

**Files:**
- Create: `web/src/components/exercise-picker-modal.tsx`
- Modify: `web/src/app/globals.css`

- [ ] **Step 1: Create the picker modal component**

Create `web/src/components/exercise-picker-modal.tsx`:

```typescript
"use client";

import { useMemo, useState } from "react";
import { Modal } from "./modal";
import { EXERCISE_LIBRARY } from "@/lib/exercise-library";
import type { ExerciseDefinition, MuscleGroup } from "@/lib/types";

type ExercisePickerModalProps = {
  open: boolean;
  muscleGroup?: MuscleGroup;
  onSelect: (exercise: ExerciseDefinition) => void;
  onClose: () => void;
  title?: string;
};

const MUSCLE_LABELS: Record<MuscleGroup, string> = {
  chest: "Chest",
  back: "Back",
  quads: "Quads",
  hamstrings: "Hamstrings",
  glutes: "Glutes",
  side_delts: "Side Delts",
  rear_delts: "Rear Delts",
  front_delts: "Front Delts",
  biceps: "Biceps",
  triceps: "Triceps",
  traps: "Traps",
  calves: "Calves",
  abs: "Abs",
  forearms: "Forearms",
  neck: "Neck",
};

export function ExercisePickerModal({
  open,
  muscleGroup,
  onSelect,
  onClose,
  title,
}: ExercisePickerModalProps) {
  const [search, setSearch] = useState("");

  const modalTitle = title ?? (muscleGroup ? `${MUSCLE_LABELS[muscleGroup]} Exercises` : "All Exercises");

  const filtered = useMemo(() => {
    let exercises = EXERCISE_LIBRARY.filter((e) => e.tier === "S" || e.tier === "A");
    if (muscleGroup) {
      exercises = exercises.filter((e) => e.primaryMuscle === muscleGroup);
    }
    if (search.trim()) {
      const q = search.toLowerCase().trim();
      exercises = exercises.filter((e) => e.name.toLowerCase().includes(q));
    }
    return exercises;
  }, [muscleGroup, search]);

  const sTier = filtered.filter((e) => e.tier === "S").sort((a, b) => a.name.localeCompare(b.name));
  const aTier = filtered.filter((e) => e.tier === "A").sort((a, b) => a.name.localeCompare(b.name));

  function renderRow(exercise: ExerciseDefinition) {
    return (
      <button
        key={exercise.id}
        type="button"
        className="picker-row"
        onClick={() => { onSelect(exercise); }}
      >
        <span className="picker-row-name">{exercise.name}</span>
        <span className="picker-row-tags">
          <span className="picker-pill">{exercise.equipment.replace("_", " ")}</span>
          <span className="picker-pill">{exercise.type}</span>
          {exercise.exrxUrl && (
            <a
              href={exercise.exrxUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="picker-exrx"
              onClick={(e) => e.stopPropagation()}
              aria-label={`ExRx page for ${exercise.name}`}
            >
              ↗
            </a>
          )}
        </span>
      </button>
    );
  }

  return (
    <Modal open={open} onClose={onClose} title={modalTitle}>
      <div className="picker-search-wrap">
        <input
          type="text"
          className="picker-search"
          placeholder="Search exercises..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />
      </div>
      <div className="picker-body">
        {sTier.length > 0 && (
          <>
            <h3 className="picker-tier-header picker-tier-s">S TIER</h3>
            {sTier.map(renderRow)}
          </>
        )}
        {aTier.length > 0 && (
          <>
            <h3 className="picker-tier-header picker-tier-a">A TIER</h3>
            {aTier.map(renderRow)}
          </>
        )}
        {sTier.length === 0 && aTier.length === 0 && (
          <p className="picker-empty">No exercises found.</p>
        )}
      </div>
    </Modal>
  );
}
```

- [ ] **Step 2: Add picker CSS to globals.css**

Append to `web/src/app/globals.css`:

```css
/* ── Exercise Picker Modal ── */
.picker-search-wrap {
  padding: 0.75rem 1rem 0;
}
.picker-search {
  width: 100%;
  padding: 0.5rem 0.75rem;
  border: 1px solid var(--border);
  border-radius: 6px;
  background: var(--bg-1);
  color: var(--text-primary);
  font-family: var(--font-body);
  font-size: 0.9rem;
}
.picker-search::placeholder {
  color: var(--text-muted);
}
.picker-body {
  padding: 0.5rem 0;
  max-height: 60vh;
  overflow-y: auto;
}
.picker-tier-header {
  padding: 0.4rem 1rem;
  font-family: var(--font-display);
  font-size: 0.85rem;
  letter-spacing: 0.08em;
  text-transform: uppercase;
  color: var(--text-muted);
  border-bottom: 1px solid var(--border);
}
.picker-tier-s {
  color: var(--accent-primary);
}
.picker-row {
  display: flex;
  align-items: center;
  justify-content: space-between;
  width: 100%;
  padding: 0.6rem 1rem;
  background: none;
  border: none;
  border-bottom: 1px solid var(--border);
  color: var(--text-primary);
  cursor: pointer;
  text-align: left;
  font-family: var(--font-body);
  font-size: 0.9rem;
  gap: 0.5rem;
}
.picker-row:hover {
  background: var(--bg-1);
}
.picker-row-name {
  flex: 1;
  min-width: 0;
}
.picker-row-tags {
  display: flex;
  gap: 0.3rem;
  align-items: center;
  flex-shrink: 0;
}
.picker-pill {
  font-size: 0.7rem;
  padding: 0.1rem 0.4rem;
  border-radius: 4px;
  background: var(--bg-2, rgba(255,255,255,0.06));
  color: var(--text-muted);
  text-transform: capitalize;
  white-space: nowrap;
}
.picker-exrx {
  font-size: 0.8rem;
  color: var(--accent-primary);
  text-decoration: none;
  padding: 0.1rem 0.2rem;
}
.picker-empty {
  padding: 2rem 1rem;
  text-align: center;
  color: var(--text-muted);
}
```

- [ ] **Step 3: Verify TypeScript compiles**

Run: `cd web && npx tsc --noEmit`
Expected: 0 errors

- [ ] **Step 4: Commit**

```bash
git add web/src/components/exercise-picker-modal.tsx web/src/app/globals.css
git commit -m "feat: add exercise picker modal with search, tier sections, and ExRx links"
```

---

## Task 6: Exercise Queue Card -- Swap Icon

**Files:**
- Modify: `web/src/components/exercise-queue-card.tsx`
- Modify: `web/src/app/globals.css`

- [ ] **Step 1: Add swap props and icon to ExerciseQueueCard**

Update `web/src/components/exercise-queue-card.tsx`:

Add to `ExerciseQueueCardProps`:
```typescript
originalName?: string;  // set when exercise has been swapped
onSwap?: () => void;    // callback to open exercise picker
```

Add the swap icon button inside the card, in the top-right area next to the ProgressRing. The icon is a small arrows/swap symbol. When `originalName` is set, show a visual indicator (accent dot):

```typescript
// Inside the first .exercise-line div, add after the ProgressRing/track-chip area:
{onSwap && (
  <button
    type="button"
    className="swap-btn"
    onClick={(e) => { e.stopPropagation(); onSwap(); }}
    aria-label={`Swap ${name}`}
  >
    ⇄
  </button>
)}
```

When `originalName` is set, add a subtitle line below the exercise name:
```typescript
{originalName && (
  <span className="swap-indicator">Replaces: {originalName}</span>
)}
```

- [ ] **Step 2: Add swap icon CSS**

Append to `web/src/app/globals.css`:

```css
/* ── Swap Icon ── */
.swap-btn {
  background: none;
  border: 1px solid var(--border);
  border-radius: 4px;
  color: var(--text-muted);
  font-size: 0.85rem;
  padding: 0.15rem 0.35rem;
  cursor: pointer;
  line-height: 1;
}
.swap-btn:hover {
  color: var(--accent-primary);
  border-color: var(--accent-primary);
}
.swap-indicator {
  font-size: 0.7rem;
  color: var(--accent-primary);
  font-style: italic;
}
```

- [ ] **Step 3: Verify TypeScript compiles**

Run: `cd web && npx tsc --noEmit`
Expected: 0 errors (new props are optional, callers don't break)

- [ ] **Step 4: Commit**

```bash
git add web/src/components/exercise-queue-card.tsx web/src/app/globals.css
git commit -m "feat: add swap icon and indicator to exercise queue card"
```

---

## Task 7: Today Screen -- Substitution Resolution + Swap Flow

**Files:**
- Modify: `web/src/components/screens/today-screen.tsx`

This is the most complex integration task. It touches the `queueExercises` memo, adds swap state, and wires up the picker modal.

- [ ] **Step 1: Add imports**

Add to the imports at top of `today-screen.tsx`:

```typescript
import { getPermanentSub, setPermanentSub, clearPermanentSub } from "@/lib/exercise-substitutions";
import { getAdditions } from "@/lib/exercise-additions";
import { ExercisePickerModal } from "@/components/exercise-picker-modal";
```

- [ ] **Step 2: Add originalName to QueueExercise type**

At line 72-83 in `today-screen.tsx`, add `originalName?: string` to the `QueueExercise` type:

```typescript
type QueueExercise = {
  id: string;
  orderLabel: string;
  name: string;
  originalName?: string;  // set when exercise has been substituted
  scheme: string;
  lastPerformance: string;
  targetSets: number;
  completedSets: number;
  restTargetSeconds: number;
  track: "his" | "hers";
  supersetGroup?: string;
};
```

- [ ] **Step 3: Add substitution resolution to queueExercises memo**

Modify the `queueExercises` memo (around line 255-282). Before the existing `exercises.map(...)`, resolve substitutions. Also append additions from the additions store for registry-based programs.

Inside the memo, before the `return exercises.map(...)`:

```typescript
// Resolve additions for registry programs
const additions = programId !== "mass-impact"
  ? getAdditions(prefs.activeUser, programId, prefs.currentDay)
  : [];
const allExercises = additions.length > 0
  ? [...exercises, ...additions]
  : exercises;
```

Then in the `.map()` callback, resolve substitutions before other lookups:

```typescript
return allExercises.map((exercise, index) => {
  // Resolve substitution: session > permanent > original
  const sessionSub = matchingActiveSession?.substitutions?.[exercise.name];
  const permanentSub = getPermanentSub(prefs.activeUser, programId, prefs.currentDay, exercise.name);
  const resolvedName = sessionSub ?? permanentSub ?? exercise.name;
  const originalName = resolvedName !== exercise.name ? exercise.name : undefined;

  const completedSets = matchingActiveSession
    ? matchingActiveSession.sets.filter((set) => set.exerciseName === resolvedName).length
    : 0;
  const lastPerformance = getLastPerformanceFromSessions(sessionHistory, resolvedName);

  // Apply session-only override keyed on RESOLVED name
  const override = matchingActiveSession?.overrides?.[resolvedName];
  // ... rest of existing override logic stays the same ...

  return {
    id: `${prefs.currentWeek}-${prefs.currentDay}-${exercise.orderLabel}-${index}`,
    orderLabel: exercise.orderLabel,
    name: resolvedName,
    originalName,
    scheme: effectiveScheme,
    lastPerformance: formatLastSet(lastPerformance),
    targetSets: effectiveSets,
    completedSets,
    restTargetSeconds: getRestSecondsForExercise(exercise),
    track: prefs.activeUser,
    supersetGroup: exercise.supersetGroup,
  };
});
```

Update the memo's dependency array to include `programId`.

- [ ] **Step 4: Add swap state and handlers**

Add state for the swap flow near the other state declarations:

```typescript
const [swapTarget, setSwapTarget] = useState<{ index: number; muscleGroup: MuscleGroup; originalTemplateName: string } | null>(null);
const [swapConfirm, setSwapConfirm] = useState<{ exercise: ExerciseDefinition; originalTemplateName: string } | null>(null);
// Counter to force queueExercises re-eval when permanent subs change (not in memo deps otherwise)
const [subVersion, setSubVersion] = useState(0);
```

Add `subVersion` to the `queueExercises` memo's dependency array (at line 282) so it re-computes when permanent subs are written or cleared.

Add handler to open the swap picker:

```typescript
function handleOpenSwap(index: number) {
  const qe = queueExercises[index];
  if (!qe) return;
  // Look up the primary muscle from the exercise library
  const templateName = qe.originalName ?? qe.name;
  const def = findExercise(qe.name);
  const muscle = def?.primaryMuscle ?? "back";
  setSwapTarget({ index, muscleGroup: muscle, originalTemplateName: templateName });
}
```

Add handler for when an exercise is selected in the picker:

```typescript
function handleSwapSelect(exercise: ExerciseDefinition) {
  if (!swapTarget) return;
  setSwapConfirm({ exercise, originalTemplateName: swapTarget.originalTemplateName });
  setSwapTarget(null);
}
```

Add handler for the "Just this session" / "All future sessions" confirmation:

```typescript
function handleSwapConfirm(permanent: boolean) {
  if (!swapConfirm) return;
  const { exercise, originalTemplateName } = swapConfirm;

  if (permanent) {
    setPermanentSub(prefs.activeUser, programId, prefs.currentDay, originalTemplateName, exercise.name);
    setSubVersion((v) => v + 1);  // trigger queueExercises re-eval
  } else if (matchingActiveSession) {
    const updated: WorkoutSession = {
      ...matchingActiveSession,
      substitutions: {
        ...matchingActiveSession.substitutions,
        [originalTemplateName]: exercise.name,
      },
    };
    saveActiveSession(updated);
  }
  setSwapConfirm(null);
}

function handleSwapRevert(qe: QueueExercise) {
  if (!qe.originalName) return;
  // Clear session sub if present; otherwise clear permanent sub
  if (matchingActiveSession?.substitutions?.[qe.originalName]) {
    const { [qe.originalName]: _, ...rest } = matchingActiveSession.substitutions;
    const updated: WorkoutSession = {
      ...matchingActiveSession,
      substitutions: Object.keys(rest).length > 0 ? rest : undefined,
    };
    saveActiveSession(updated);
  } else {
    clearPermanentSub(prefs.activeUser, programId, prefs.currentDay, qe.originalName);
    setSubVersion((v) => v + 1);  // trigger re-render for permanent sub changes
  }
}
```

- [ ] **Step 5: Pass swap props to ExerciseQueueCard**

In the JSX where `ExerciseQueueCard` is rendered, add the new props:

```typescript
<ExerciseQueueCard
  key={qe.id}
  // ... existing props ...
  originalName={qe.originalName}
  onSwap={() => handleOpenSwap(index)}
/>
```

- [ ] **Step 6: Add picker modal and confirm dialog JSX**

Add the `ExercisePickerModal` and swap confirmation dialog at the end of the component's JSX return (after existing modals):

```typescript
{/* Exercise Swap Picker */}
<ExercisePickerModal
  open={swapTarget !== null}
  muscleGroup={swapTarget?.muscleGroup}
  onSelect={handleSwapSelect}
  onClose={() => setSwapTarget(null)}
/>

{/* Swap Confirmation */}
{swapConfirm && (
  <Modal open onClose={() => setSwapConfirm(null)} title="Swap Exercise">
    <div style={{ padding: "1rem" }}>
      <p>Replace with <strong>{swapConfirm.exercise.name}</strong>?</p>
      <div style={{ display: "flex", gap: "0.5rem", marginTop: "1rem" }}>
        {matchingActiveSession && (
          <button
            type="button"
            className="ghost-btn"
            onClick={() => handleSwapConfirm(false)}
          >
            Just this session
          </button>
        )}
        <button
          type="button"
          className="ghost-btn"
          onClick={() => handleSwapConfirm(true)}
        >
          All future sessions
        </button>
      </div>
    </div>
  </Modal>
)}
```

- [ ] **Step 7: Verify TypeScript compiles**

Run: `cd web && npx tsc --noEmit`
Expected: 0 errors

- [ ] **Step 8: Verify existing tests pass**

Run: `cd web && npx vitest run`
Expected: All tests pass

- [ ] **Step 9: Commit**

```bash
git add web/src/components/screens/today-screen.tsx
git commit -m "feat: integrate exercise substitution resolution and swap flow in today screen"
```

---

## Task 8: Library Screen + Route + Navigation

**Files:**
- Create: `web/src/components/screens/library-screen.tsx`
- Create: `web/src/app/library/page.tsx`
- Modify: `web/src/components/app-shell.tsx:13-19`
- Modify: `web/src/app/globals.css`

- [ ] **Step 1: Create the library screen component**

Create `web/src/components/screens/library-screen.tsx`:

```typescript
"use client";

import { useState } from "react";
import { EXERCISE_LIBRARY } from "@/lib/exercise-library";
import type { ExerciseDefinition, MuscleGroup } from "@/lib/types";

const MUSCLE_SECTIONS: { muscle: MuscleGroup; label: string }[] = [
  { muscle: "chest", label: "Chest" },
  { muscle: "back", label: "Back" },
  { muscle: "quads", label: "Quads" },
  { muscle: "hamstrings", label: "Hamstrings" },
  { muscle: "glutes", label: "Glutes" },
  { muscle: "side_delts", label: "Side Delts" },
  { muscle: "rear_delts", label: "Rear Delts" },
  { muscle: "front_delts", label: "Front Delts" },
  { muscle: "biceps", label: "Biceps" },
  { muscle: "triceps", label: "Triceps" },
  { muscle: "traps", label: "Traps" },
  { muscle: "calves", label: "Calves" },
  { muscle: "abs", label: "Abs" },
  { muscle: "forearms", label: "Forearms" },
];

function ExerciseRow({ exercise, onAdd }: { exercise: ExerciseDefinition; onAdd: () => void }) {
  return (
    <div className="library-row">
      <div className="library-row-info">
        <span className="library-row-name">{exercise.name}</span>
        <span className="picker-row-tags">
          <span className="picker-pill">{exercise.equipment.replace("_", " ")}</span>
          <span className="picker-pill">{exercise.type}</span>
          {exercise.exrxUrl && (
            <a
              href={exercise.exrxUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="picker-exrx"
              onClick={(e) => e.stopPropagation()}
              aria-label={`ExRx page for ${exercise.name}`}
            >
              ↗
            </a>
          )}
        </span>
      </div>
      <button type="button" className="ghost-btn library-add-btn" onClick={onAdd}>
        + Add
      </button>
    </div>
  );
}

function MuscleSection({
  label,
  muscle,
  onAdd,
}: {
  label: string;
  muscle: MuscleGroup;
  onAdd: (exercise: ExerciseDefinition) => void;
}) {
  const [collapsed, setCollapsed] = useState(false);
  const exercises = EXERCISE_LIBRARY.filter((e) => e.primaryMuscle === muscle && (e.tier === "S" || e.tier === "A"));
  const sTier = exercises.filter((e) => e.tier === "S").sort((a, b) => a.name.localeCompare(b.name));
  const aTier = exercises.filter((e) => e.tier === "A").sort((a, b) => a.name.localeCompare(b.name));

  if (exercises.length === 0) return null;

  return (
    <section className="library-section">
      <button
        type="button"
        className="library-section-header"
        onClick={() => setCollapsed(!collapsed)}
      >
        <h2>{label}</h2>
        <span className="library-chevron">{collapsed ? "▸" : "▾"}</span>
      </button>
      {!collapsed && (
        <div className="library-section-body">
          {sTier.length > 0 && (
            <>
              <h3 className="picker-tier-header picker-tier-s">S TIER</h3>
              {sTier.map((e) => (
                <ExerciseRow key={e.id} exercise={e} onAdd={() => onAdd(e)} />
              ))}
            </>
          )}
          {aTier.length > 0 && (
            <>
              <h3 className="picker-tier-header picker-tier-a">A TIER</h3>
              {aTier.map((e) => (
                <ExerciseRow key={e.id} exercise={e} onAdd={() => onAdd(e)} />
              ))}
            </>
          )}
        </div>
      )}
    </section>
  );
}

export function LibraryScreen() {
  // Add-to-routine state will be wired in Task 9
  const [, setAddTarget] = useState<ExerciseDefinition | null>(null);

  return (
    <div className="screen-container">
      <h1 className="page-title">Exercise Library</h1>
      {MUSCLE_SECTIONS.map(({ muscle, label }) => (
        <MuscleSection
          key={muscle}
          label={label}
          muscle={muscle}
          onAdd={(exercise) => setAddTarget(exercise)}
        />
      ))}
    </div>
  );
}
```

- [ ] **Step 2: Create the route page**

Create `web/src/app/library/page.tsx`:

```typescript
import { Suspense } from "react";
import { LibraryScreen } from "@/components/screens/library-screen";

export default function LibraryPage() {
  return (
    <Suspense>
      <LibraryScreen />
    </Suspense>
  );
}
```

- [ ] **Step 3: Add Library to navItems**

In `web/src/components/app-shell.tsx`, add to the `navItems` array after the Templates entry (line 18):

```typescript
const navItems = [
  { href: "/", label: "Today", short: "TD" },
  { href: "/planner", label: "Planner", short: "PL" },
  { href: "/progress", label: "Progress", short: "PR" },
  { href: "/volume", label: "Volume", short: "VL" },
  { href: "/templates", label: "Templates", short: "TP" },
  { href: "/library", label: "Library", short: "LB" },
];
```

- [ ] **Step 4: Add library screen CSS**

Append to `web/src/app/globals.css`:

```css
/* ── Library Screen ── */
.library-section {
  margin-bottom: 0.5rem;
}
.library-section-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  width: 100%;
  padding: 0.75rem 0.5rem;
  background: none;
  border: none;
  border-bottom: 1px solid var(--border);
  color: var(--text-primary);
  cursor: pointer;
  font-family: var(--font-display);
}
.library-section-header h2 {
  font-size: 1.2rem;
  margin: 0;
}
.library-chevron {
  font-size: 1rem;
  color: var(--text-muted);
}
.library-section-body {
  padding-left: 0.25rem;
}
.library-row {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 0.5rem 0.5rem 0.5rem 1rem;
  border-bottom: 1px solid var(--border);
  gap: 0.5rem;
}
.library-row-info {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  flex: 1;
  min-width: 0;
}
.library-row-name {
  font-family: var(--font-body);
  font-size: 0.9rem;
}
.library-add-btn {
  font-size: 0.75rem;
  padding: 0.2rem 0.5rem;
  white-space: nowrap;
  flex-shrink: 0;
}
```

- [ ] **Step 5: Adjust mobile nav for 6 items**

In `web/src/app/globals.css`, find the existing `.mobile-link-label` rule and reduce font-size. Find `.mobile-link` and ensure min-width allows 6 items at 320px. Each item needs to fit in ~53px. Adjust as needed so labels don't wrap.

- [ ] **Step 6: Verify TypeScript compiles**

Run: `cd web && npx tsc --noEmit`
Expected: 0 errors

- [ ] **Step 7: Commit**

```bash
git add web/src/components/screens/library-screen.tsx web/src/app/library/page.tsx web/src/components/app-shell.tsx web/src/app/globals.css
git commit -m "feat: add exercise library screen, route, and nav item"
```

---

## Task 9: Library Screen -- Add to Routine Flow

**Files:**
- Modify: `web/src/components/screens/library-screen.tsx`
- Modify: `web/src/app/globals.css`

This wires up the "Add to Routine" button with the day picker and action picker flow.

- [ ] **Step 1: Add imports and state for add-to-routine**

In `library-screen.tsx`, add imports:

```typescript
import { useAccess } from "@/components/access-context";
import { getStoredPrefsFromLocalStorage } from "@/lib/household-profiles";
import { getDaysInCycle, getDayTitle, getProgramMeta, getExercisesForDay } from "@/lib/program-registry";
import { getProgram, getProgramDay, saveProgram } from "@/lib/program-store";
import { addExerciseToDay } from "@/lib/exercise-additions";
import { setPermanentSub } from "@/lib/exercise-substitutions";
import { Modal } from "@/components/modal";
import type { ProgramExercise } from "@/lib/program-data";
```

Add state to `LibraryScreen`:

```typescript
const { activeUser } = useAccess();
const storedPrefs = getStoredPrefsFromLocalStorage();
const programId = storedPrefs.profiles[activeUser]?.selectedProgram ?? "mass-impact";
const daysInCycle = getDaysInCycle(programId);

const [addTarget, setAddTarget] = useState<ExerciseDefinition | null>(null);
const [selectedDay, setSelectedDay] = useState<number | null>(null);
const [addAction, setAddAction] = useState<"append" | "replace" | null>(null);
```

- [ ] **Step 2: Add day picker modal**

When `addTarget` is set, show a day picker modal:

```typescript
{addTarget && !selectedDay && (
  <Modal open onClose={() => setAddTarget(null)} title={`Add ${addTarget.name}`}>
    <div style={{ padding: "1rem" }}>
      <p className="page-note" style={{ marginBottom: "0.75rem" }}>Which day?</p>
      {Array.from({ length: daysInCycle }, (_, i) => i + 1).map((day) => (
        <button
          key={day}
          type="button"
          className="picker-row"
          onClick={() => setSelectedDay(day)}
        >
          {getDayTitle(programId, day)}
        </button>
      ))}
    </div>
  </Modal>
)}
```

- [ ] **Step 3: Add action picker (append vs replace)**

When `selectedDay` is set, show the action picker:

```typescript
{addTarget && selectedDay && !addAction && (
  <Modal open onClose={() => { setSelectedDay(null); setAddTarget(null); }} title="How to add?">
    <div style={{ padding: "1rem", display: "flex", flexDirection: "column", gap: "0.5rem" }}>
      <button type="button" className="ghost-btn" onClick={() => handleAppend()}>
        Add to end
      </button>
      <button type="button" className="ghost-btn" onClick={() => setAddAction("replace")}>
        Replace an exercise
      </button>
    </div>
  </Modal>
)}
```

- [ ] **Step 4: Add replace exercise picker**

When `addAction === "replace"`, show that day's exercises for the user to pick which one to replace:

```typescript
{addTarget && selectedDay && addAction === "replace" && (
  <Modal open onClose={() => { setAddAction(null); setSelectedDay(null); setAddTarget(null); }} title="Replace which exercise?">
    <div style={{ padding: "1rem" }}>
      {getExercisesForDay(programId, selectedDay, storedPrefs.profiles[activeUser]?.currentWeek ?? 1).map((ex) => (
        <button
          key={ex.name}
          type="button"
          className="picker-row"
          onClick={() => handleReplace(ex.name)}
        >
          {ex.name}
        </button>
      ))}
    </div>
  </Modal>
)}
```

- [ ] **Step 5: Add handler functions**

```typescript
const isMassImpact = programId === "mass-impact";

function handleAppend() {
  if (!addTarget || selectedDay === null) return;
  if (isMassImpact) {
    // Mass Impact uses editable program store -- add directly to program template
    const program = getProgram();
    if (program) {
      const day = getProgramDay(program, storedPrefs.profiles[activeUser]?.currentWeek ?? 1, selectedDay);
      if (day) {
        const nextOrder = day.exercises.length + 1;
        day.exercises.push({
          order: nextOrder,
          orderLabel: String(nextOrder),
          name: addTarget.name,
          setGroups: [{ sets: 3, reps: "8-12 reps" }],
        });
        saveProgram(program);
      }
    }
  } else {
    // Registry programs use the additions store
    const dayExercises = getExercisesForDay(programId, selectedDay, storedPrefs.profiles[activeUser]?.currentWeek ?? 1);
    const nextOrder = dayExercises.length + 1;
    const newExercise: ProgramExercise = {
      order: nextOrder,
      orderLabel: String(nextOrder),
      name: addTarget.name,
      setGroups: [{ sets: 3, reps: "8-12 reps" }],
    };
    addExerciseToDay(activeUser, programId, selectedDay, newExercise);
  }
  setAddTarget(null);
  setSelectedDay(null);
}

function handleReplace(originalName: string) {
  if (!addTarget || selectedDay === null) return;
  setPermanentSub(activeUser, programId, selectedDay, originalName, addTarget.name);
  setAddTarget(null);
  setSelectedDay(null);
  setAddAction(null);
}
```

- [ ] **Step 6: Verify TypeScript compiles**

Run: `cd web && npx tsc --noEmit`
Expected: 0 errors

- [ ] **Step 7: Commit**

```bash
git add web/src/components/screens/library-screen.tsx
git commit -m "feat: add-to-routine flow on library screen (day picker, append, replace)"
```

---

## Task 10: Final Integration + Verification

**Files:** None new -- verification only.

- [ ] **Step 1: Run TypeScript check**

Run: `cd web && npx tsc --noEmit`
Expected: 0 errors

- [ ] **Step 2: Run all tests**

Run: `cd web && npx vitest run`
Expected: All tests pass

- [ ] **Step 3: Run linter**

Run: `cd web && npx next lint`
Expected: 0 errors (warnings OK)

- [ ] **Step 4: Run dev server and verify**

Run: `cd web && npx next dev`

Manual checks:
1. Navigate to `/library` -- see all muscle groups with S/A tier exercises
2. Collapse/expand a muscle group section
3. Click "Add" on an exercise -- day picker appears, then action picker
4. Navigate to Today -- see swap icons on exercise cards
5. Tap swap icon -- picker opens filtered to correct muscle group
6. Select an exercise -- confirmation prompt appears
7. Confirm "All future sessions" -- card updates with new exercise name and "Replaces: X" indicator
8. Confirm "Just this session" (during active workout) -- card updates, reverts after session completes

- [ ] **Step 5: Fix any issues found**

Address any TypeScript, lint, or visual issues discovered during manual testing.

- [ ] **Step 6: Commit any fixes**

```bash
git add -A
git commit -m "fix: resolve integration issues from exercise library feature"
```
