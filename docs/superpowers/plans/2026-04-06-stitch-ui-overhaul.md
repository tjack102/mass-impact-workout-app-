# Stitch UI Overhaul Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Make the Today screen and navigation match the Stitch mockups by overhauling global CSS (fonts, surfaces, glass, spacing) and rebuilding the exercise queue card component.

**Architecture:** CSS-first approach. New surface tokens aliased to existing `--bg-*` vars so all screens keep working. Exercise queue card gets a full rebuild to data-cluster layout. App shell nav gets glass treatment + labels. Today screen drops collapsibles and redundant titles.

**Tech Stack:** Next.js 16, React 19, CSS custom properties, `next/font/google`

**Spec:** `docs/superpowers/specs/2026-04-06-stitch-ui-overhaul-design.md`

---

## File Map

| File | Action | Responsibility |
|------|--------|----------------|
| `web/src/app/layout.tsx` | Modify | Swap Teko font for Space Grotesk |
| `web/src/app/globals.css` | Modify | Surface tokens, glass utilities, border removal, spacing, button gradient, queue card styles, nav label styles, remove old `.exercise-card` selectors |
| `web/src/components/exercise-queue-card.tsx` | Rewrite | Data-cluster layout with new props |
| `web/src/components/app-shell.tsx` | Modify | Glass nav, icon+label nav items, "COMMAND CENTER" header |
| `web/src/components/screens/today-screen.tsx` | Modify | Remove collapsibles, remove redundant titles, pass new props to queue card, restyle console inline styles |

---

### Task 1: Font Swap (Teko -> Space Grotesk)

**Files:**
- Modify: `web/src/app/layout.tsx`
- Modify: `web/src/app/globals.css:44` (the `--font-display` declaration)

- [ ] **Step 1: Add Space Grotesk import in layout.tsx**

In `web/src/app/layout.tsx`, add to the import block (line 3-15):
```ts
  Space_Grotesk,
```

After line 31 (the `dmSans` declaration), add:
```ts
const spaceGrotesk = Space_Grotesk({ variable: "--font-space-grotesk", subsets: ["latin"] });
```

- [ ] **Step 2: Add Space Grotesk variable to body className**

In `layout.tsx` line 70, add `${spaceGrotesk.variable}` to the className template string.

- [ ] **Step 3: Remove Teko import and variable**

Remove `Teko,` from the import block (line 14). Remove line 19 (`const teko = ...`). Remove `${teko.variable}` from the body className (line 70).

- [ ] **Step 4: Update --font-display in globals.css**

In `web/src/app/globals.css` line 44, change:
```css
--font-display: var(--font-teko);
```
to:
```css
--font-display: var(--font-space-grotesk);
```

- [ ] **Step 5: Verify**

Run: `cd C:/Users/tjack/.projects/workout-app/web && npx tsc --noEmit`
Expected: 0 errors

- [ ] **Step 6: Commit**

```bash
git add web/src/app/layout.tsx web/src/app/globals.css
git commit -m "refactor: swap Teko font for Space Grotesk in display role"
```

---

### Task 2: Surface Tokens + Border Elimination

**Files:**
- Modify: `web/src/app/globals.css`

- [ ] **Step 1: Add surface tokens and alias existing --bg-* vars**

In `web/src/app/globals.css`, replace the `:root` block's background/border tokens (lines 4-6, 15-16, 24-25, 32-36) with the new surface system. The full `:root` block should have these values:

```css
  /* Surface hierarchy (Stitch "Kinetic Precision") */
  --surface-base: #111317;
  --surface-low: #1a1c1f;
  --surface-mid: #1e2023;
  --surface-high: #282a2d;
  --surface-highest: #333538;

  /* Alias existing tokens to surface system */
  --bg-0: var(--surface-base);
  --bg-1: var(--surface-low);
  --bg-2: var(--surface-mid);
  --card-bg: var(--surface-mid);
  --bg-input: var(--surface-high);
  --bg-index: var(--surface-low);
  --bg-stat: var(--surface-low);
  --bg-heat: var(--surface-low);
  --nav-bg: rgba(30, 32, 35, 0.7);

  /* Focus ring (replaces borders on inputs) */
  --accent-primary-30: rgba(85, 246, 237, 0.3);
```

Keep all other `:root` tokens unchanged (text, accents, radius, ease, shadows, dial, glow, etc.).

- [ ] **Step 2: Add glass utility classes**

After the `:root` block (before the theme blocks), add:

```css
/* Glass-morphism utilities */
.glass {
  background: rgba(30, 32, 35, 0.7);
  backdrop-filter: blur(20px);
  -webkit-backdrop-filter: blur(20px);
}

.glass-card {
  background: rgba(30, 32, 35, 0.85);
  backdrop-filter: blur(12px);
  -webkit-backdrop-filter: blur(12px);
}

@supports not (backdrop-filter: blur(1px)) {
  .glass { background: rgba(30, 32, 35, 0.95); }
  .glass-card { background: rgba(30, 32, 35, 0.97); }
}
```

- [ ] **Step 3: Remove borders from cards, panels, surfaces**

Find all instances of `border: var(--border-width) solid var(--border)` or `border: 1px solid var(--border)` on `.card`, `.panel`, `.surface`, `.logged-set-chip`, and input/select elements. Remove the border declarations. Do NOT remove borders from theme-specific overrides (warzone, neon-overload, concrete blocks).

Key locations in globals.css:
- `.card` rule (around line 290)
- `.surface` rule (around line 310)
- Input/select styling (around line 340)
- `.logged-set-chip` (around line 880)

Replace input borders with focus ring:
```css
input, select, textarea {
  border: none;
  background: var(--surface-high);
}
input:focus-visible, select:focus-visible, textarea:focus-visible {
  box-shadow: 0 0 0 1px var(--accent-primary-30);
  outline: none;
}
```

- [ ] **Step 4: Update spacing scale**

Update `.card` padding from current value to `padding: 20px`. Update `.queue-list` (or equivalent exercise list container) gap to `12px`.

- [ ] **Step 5: Add primary gradient button class**

Add after the glass utilities:
```css
.btn-primary {
  background: linear-gradient(135deg, var(--accent-primary), color-mix(in srgb, var(--accent-primary), black 15%));
  color: var(--bg-0);
  border: none;
  border-radius: 8px;
  font-family: var(--font-display);
  font-weight: 700;
  font-size: 1.1rem;
  padding: 0.65rem 1.5rem;
  cursor: pointer;
  letter-spacing: 0.02em;
  transition: filter 0.15s;
}
.btn-primary:hover {
  filter: brightness(1.1);
}
.btn-primary:disabled {
  opacity: 0.4;
  cursor: not-allowed;
  filter: none;
}
```

- [ ] **Step 6: Verify build**

Run: `cd C:/Users/tjack/.projects/workout-app/web && npx next build`
Expected: Build succeeds (CSS-only changes, no TS impact)

- [ ] **Step 7: Commit**

```bash
git add web/src/app/globals.css
git commit -m "refactor: add surface tokens, glass utilities, remove card borders, gradient button"
```

---

### Task 3: Exercise Queue Card Rebuild

**Files:**
- Rewrite: `web/src/components/exercise-queue-card.tsx`
- Modify: `web/src/app/globals.css` (remove old `.exercise-card` selectors, add `.queue-card` selectors)

- [ ] **Step 1: Remove old exercise-card CSS from globals.css**

Remove these CSS rule blocks from `globals.css`:
- `.exercise-card` (line ~717)
- `.exercise-card.active` (line ~728)
- `.exercise-card.done` (line ~733)
- `.exercise-card.superset-grouped` (line ~737)
- `.exercise-card .exercise-name` (line ~1221)
- `.exercise-card .mono` (line ~1225)
- `.exercise-card.pr-pulse` (line ~1557)
- `.completion-dots` (line ~774)
- `.completion-dot` (line ~779)
- `.completion-dot.complete` (line ~786)
- `.progress-ring` (line ~790)
- `.progress-ring__bg` (line ~794)
- `.progress-ring__fill` (line ~798)
- `.progress-ring__fill--done` (line ~803)

Also remove any theme-specific `.exercise-card` or `.progress-ring` overrides in the warzone/neon/concrete blocks.

- [ ] **Step 2: Add queue-card CSS to globals.css**

Add the full `.queue-card` CSS block from the spec (Section 3 "Queue Card CSS"). This includes:
- `.queue-card` (base, hover, data-active, data-complete, data-skipped)
- `.queue-card-header` (flex row, space-between)
- `.queue-card-order` (cyan mono label)
- `.queue-card-name` (uppercase display font)
- `.queue-card-muscles` (muted small text)
- `.queue-card-data` (flex row with 24px gap)
- `.queue-card-label` (tiny uppercase)
- `.queue-card-value` (mono large)
- `.queue-card-footer` (flex row)
- `.queue-card-progress` (cyan mono)
- `.queue-card-rir` (orange mono, margin-left auto)
- `.queue-card-swap` (ghost button, small)
- `.queue-card-notes` (muted italic, small)
- `.queue-card-url` (small icon button)

- [ ] **Step 3: Rewrite exercise-queue-card.tsx**

Replace the entire file with the new data-cluster layout component:

```tsx
import { ArrowLeftRight } from "@/components/icons";

export type ExerciseQueueCardProps = {
  orderLabel: string;
  name: string;
  muscleGroup: string;
  reps: string;
  targetSets: number;
  completedSets: number;
  lastWeight?: number;
  prescribedWeight?: number;
  rirTarget?: string;
  isActive: boolean;
  isSkipped?: boolean;
  onSelect: () => void;
  onSwap?: () => void;
  supersetGroup?: string;
  prFlash?: boolean;
  originalName?: string;
  notes?: string;
  exrxUrl?: string;
  onEditUrl?: () => void;
};

export function ExerciseQueueCard({
  orderLabel,
  name,
  muscleGroup,
  reps,
  targetSets,
  completedSets,
  lastWeight,
  prescribedWeight,
  rirTarget,
  isActive,
  isSkipped,
  onSelect,
  onSwap,
  supersetGroup,
  prFlash,
  originalName,
  notes,
  exrxUrl,
  onEditUrl,
}: ExerciseQueueCardProps) {
  const isDone = completedSets >= targetSets && targetSets > 0;
  const weightDisplay = prescribedWeight
    ? `${prescribedWeight} LBS`
    : lastWeight
      ? `${lastWeight} LBS`
      : "---";

  return (
    <button
      type="button"
      className={`queue-card${prFlash ? " pr-pulse" : ""}`}
      data-active={isActive}
      data-complete={isDone}
      data-skipped={isSkipped || false}
      onClick={onSelect}
    >
      {/* Row 1: Order + Name + Actions */}
      <div className="queue-card-header">
        <div style={{ display: "flex", alignItems: "center", gap: "0.5rem" }}>
          <span className="queue-card-order">{orderLabel}</span>
          <span className="queue-card-name">{name}</span>
        </div>
        <div style={{ display: "flex", alignItems: "center", gap: "0.4rem" }}>
          {exrxUrl ? (
            <span
              role="link"
              className="queue-card-url"
              onClick={(e) => { e.stopPropagation(); window.open(exrxUrl, "_blank", "noopener"); }}
              aria-label={`How to: ${name}`}
            >?</span>
          ) : onEditUrl ? (
            <span
              role="button"
              className="queue-card-url"
              onClick={(e) => { e.stopPropagation(); onEditUrl(); }}
              aria-label={`Add demo link for ${name}`}
            >+</span>
          ) : null}
          {onSwap && (
            <button
              type="button"
              className="queue-card-swap"
              onClick={(e) => { e.stopPropagation(); onSwap(); }}
              aria-label={`Swap ${name}`}
            >
              <ArrowLeftRight size={14} />
            </button>
          )}
        </div>
      </div>

      {/* Row 2: Muscle group + original name */}
      {muscleGroup && <span className="queue-card-muscles">{muscleGroup}</span>}
      {originalName && <span className="queue-card-muscles">Replaces: {originalName}</span>}

      {/* Row 3: Data cluster */}
      <div className="queue-card-data">
        <div className="queue-card-stat">
          <span className="queue-card-label">SETS</span>
          <span className="queue-card-value">{targetSets}</span>
        </div>
        <div className="queue-card-stat">
          <span className="queue-card-label">REPS</span>
          <span className="queue-card-value">{reps}</span>
        </div>
        <div className="queue-card-stat">
          <span className="queue-card-label">WEIGHT</span>
          <span className="queue-card-value">{weightDisplay}</span>
        </div>
      </div>

      {/* Row 4: Footer */}
      {(completedSets > 0 || rirTarget || notes) && (
        <div className="queue-card-footer">
          {completedSets > 0 && (
            <span className="queue-card-progress">{completedSets}/{targetSets} done</span>
          )}
          {rirTarget && <span className="queue-card-rir">RIR {rirTarget}</span>}
        </div>
      )}
      {notes && <div className="queue-card-notes">{notes}</div>}
    </button>
  );
}
```

- [ ] **Step 4: Update today-screen.tsx to pass new props**

In `web/src/components/screens/today-screen.tsx`, update the `queueExercises` memo and the `ExerciseQueueCard` rendering:

**a)** Add import at the top:
```ts
import { findExercise } from "@/lib/exercise-library";
```
(This import already exists -- verify it's present.)

**b)** Add muscle group formatter function before the TodayScreen component:
```ts
function formatMuscleGroup(exerciseName: string): string {
  const def = findExercise(exerciseName);
  if (!def) return "";
  const primary = def.primaryMuscle.replace(/_/g, " ");
  const title = primary.charAt(0).toUpperCase() + primary.slice(1);
  const secondaries = def.secondaryMuscles
    .filter(s => s.factor >= 0.3)
    .map(s => {
      const n = s.muscle.replace(/_/g, " ");
      return n.charAt(0).toUpperCase() + n.slice(1);
    });
  return secondaries.length > 0 ? `${title} & ${secondaries[0]}` : title;
}
```

**c)** In the `queueExercises` memo return object (around line 305-320), add new fields:
```ts
        muscleGroup: formatMuscleGroup(resolvedName),
        reps: exercise.setGroups[0]?.reps ?? "---",
        lastWeight: lastPerformance?.weight,
        prescribedWeight: exercise.prescribedWeight,
        rirTarget: exercise.rirTarget,
        isSkipped: effectiveSets === 0,
```

**d)** Update the `ExerciseQueueCard` usage in JSX (around line 983-1006) to pass the new props:
```tsx
<ExerciseQueueCard
  key={qe.id}
  orderLabel={qe.orderLabel}
  name={qe.name}
  muscleGroup={qe.muscleGroup}
  reps={qe.reps}
  targetSets={qe.targetSets}
  completedSets={qe.completedSets}
  lastWeight={qe.lastWeight}
  prescribedWeight={qe.prescribedWeight}
  rirTarget={qe.rirTarget}
  isActive={index === safeActiveIndex}
  isSkipped={qe.isSkipped}
  onSelect={() => handleSelectExercise(index)}
  onSwap={() => handleOpenSwap(index)}
  supersetGroup={qe.supersetGroup}
  prFlash={index === safeActiveIndex ? prFlash : false}
  originalName={qe.originalName}
  notes={qe.notes}
  exrxUrl={qe.exrxUrl}
  onEditUrl={() => {
    setUrlEditName(qe.name);
    setUrlDraft(getExerciseUrl(qe.name) ?? "");
  }}
/>
```

Remove the old props that no longer exist: `scheme`, `lastPerformance`, `track`.

**e)** Update `QueueExercise` type (around line 77) to include the new fields:
```ts
type QueueExercise = {
  id: string;
  orderLabel: string;
  name: string;
  originalName?: string;
  muscleGroup: string;
  reps: string;
  scheme: string;            // kept for Live Console display
  lastPerformance: string;   // kept for Live Console display
  lastWeight?: number;
  prescribedWeight?: number;
  rirTarget?: string;
  targetSets: number;
  completedSets: number;
  restTargetSeconds: number;
  track: "his" | "hers";
  supersetGroup?: string;
  notes?: string;
  exrxUrl?: string;
  rpSlotId?: string;
  isSkipped?: boolean;
};
```

- [ ] **Step 5: Verify**

Run: `cd C:/Users/tjack/.projects/workout-app/web && npx tsc --noEmit && npx vitest run`
Expected: 0 TS errors, 177/177 tests pass

- [ ] **Step 6: Commit**

```bash
git add web/src/components/exercise-queue-card.tsx web/src/app/globals.css web/src/components/screens/today-screen.tsx
git commit -m "feat: rebuild exercise queue card to Stitch data-cluster layout"
```

---

### Task 4: Navigation Restyle (Bottom Nav + Side Rail)

**Files:**
- Modify: `web/src/components/app-shell.tsx`
- Modify: `web/src/app/globals.css`

- [ ] **Step 1: Update mobile nav CSS in globals.css**

Replace the `.mobile-nav` block (line ~1290) and related selectors with:

```css
.mobile-nav {
  position: fixed;
  bottom: 0;
  left: 0;
  right: 0;
  z-index: 50;
  display: grid;
  grid-template-columns: repeat(5, 1fr);
  padding: 8px 0 calc(8px + env(safe-area-inset-bottom, 0px));
  background: rgba(30, 32, 35, 0.7);
  backdrop-filter: blur(20px);
  -webkit-backdrop-filter: blur(20px);
}

@supports not (backdrop-filter: blur(1px)) {
  .mobile-nav { background: rgba(30, 32, 35, 0.95); }
}

.mobile-link {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 4px;
  padding: 6px 0;
  color: #8b92a0;
  text-decoration: none;
  transition: color 0.15s;
}

.mobile-link-icon {
  display: flex;
  align-items: center;
  justify-content: center;
}

.mobile-link-label {
  font-family: var(--font-display);
  font-weight: 500;
  font-size: 0.65rem;
  text-transform: uppercase;
  letter-spacing: 0.05em;
}

.mobile-link.active,
.mobile-link.active .mobile-link-icon,
.mobile-link.active .mobile-link-label {
  color: var(--accent-primary);
}

/* Remove old mobile-link::before active indicator */
```

- [ ] **Step 2: Update side rail CSS in globals.css**

Update the `.side-rail` rule (line ~380) to use glass treatment:

```css
.side-rail {
  background: rgba(30, 32, 35, 0.7);
  backdrop-filter: blur(20px);
  -webkit-backdrop-filter: blur(20px);
  border: none;
}
```

- [ ] **Step 3: Update profile-banner in app-shell.tsx**

In `web/src/components/app-shell.tsx`, change "Active Profile" (line 108) to "COMMAND CENTER":

```tsx
<p className="subtle-label" style={{
  fontFamily: "var(--font-display)",
  fontSize: "0.7rem",
  textTransform: "uppercase",
  letterSpacing: "0.08em",
  color: "#8b92a0",
}}>
  Command Center
</p>
```

Remove lines 110-111 (the "Switch workouts..." description text).

- [ ] **Step 4: Update z-index for workout status bar**

In globals.css, find the `.workout-status-bar` rule and ensure its `z-index` is 60 (above nav at 50, below modals at 1000).

- [ ] **Step 5: Verify**

Run: `cd C:/Users/tjack/.projects/workout-app/web && npx tsc --noEmit && npx next build`
Expected: Clean compile and build

- [ ] **Step 6: Commit**

```bash
git add web/src/components/app-shell.tsx web/src/app/globals.css
git commit -m "refactor: restyle navigation with glass treatment and labels"
```

---

### Task 5: Today Screen Header + Console Restyle

**Files:**
- Modify: `web/src/components/screens/today-screen.tsx`
- Modify: `web/src/app/globals.css`

- [ ] **Step 1: Remove `<details>` collapsibles from today-screen.tsx**

In `today-screen.tsx`, find the `<details className="collapsible-section">` wrappers around the Exercise Queue and Live Console sections (around lines 887-1009 and 1011-1283). Remove the `<details>`, `<summary>`, and their closing tags, keeping only the inner `<article>` content. The queue and console sections should always be visible.

- [ ] **Step 2: Remove redundant section titles**

Remove the "Exercise Queue" subtitle label and the "Today Pipeline" heading from the queue section. The queue list speaks for itself. Keep the week/day selectors.

- [ ] **Step 3: Restyle the Live Console**

In the Live Console `<article>` (around line 1016), add `className="glass-card"` (or add it to the existing class list).

Update the exercise name display to use larger display font:
```tsx
<h2 style={{
  fontFamily: "var(--font-display)",
  fontWeight: 700,
  fontSize: "1.4rem",
  textTransform: "uppercase",
  margin: 0,
}}>
  {activeExercise?.name ?? "No exercise selected"}
</h2>
```

- [ ] **Step 4: Restyle the "Log Set" button**

Find the existing "Log Set" button and change its class to `btn-primary` with full width:
```tsx
<button
  type="button"
  className="btn-primary"
  style={{ width: "100%" }}
  onClick={handleSaveSet}
  disabled={!activeExercise}
>
  Log Set
</button>
```

- [ ] **Step 5: Restyle the "Start Workout" button**

In the `WorkoutHeader` usage or the start workout button, apply the `btn-primary` class:
```tsx
<button className="btn-primary" onClick={() => ensureActiveSession()}>
  Start Workout
</button>
```

- [ ] **Step 6: Remove old collapsible CSS**

In globals.css, find and remove the `.collapsible-section`, `.collapsible-summary`, `.collapsible-title`, `.collapsible-chevron` CSS rules (if they exist and are only used by today-screen).

- [ ] **Step 7: Verify everything**

```bash
cd C:/Users/tjack/.projects/workout-app/web && npx tsc --noEmit && npx vitest run && npx next build
```
Expected: 0 TS errors, 177/177 tests, build clean

- [ ] **Step 8: Commit**

```bash
git add web/src/components/screens/today-screen.tsx web/src/app/globals.css
git commit -m "refactor: restyle today screen header and console to match Stitch"
```

---

### Task 6: Final Verification + Deploy

- [ ] **Step 1: Full verification**

```bash
cd C:/Users/tjack/.projects/workout-app/web && npx tsc --noEmit && npx vitest run && npx next build
```
Expected: 0 errors, 177 tests pass, clean build

- [ ] **Step 2: Push and deploy**

```bash
cd C:/Users/tjack/.projects/workout-app && git push origin main
cd web && npx vercel --prod
```

- [ ] **Step 3: Update worklog**

Update `docs/WORKLOG.md` with what was done and next steps (remaining screens to restyle).
