# Stitch UI Overhaul -- Design Spec

**Date:** 2026-04-06
**Status:** Draft
**Scope:** Today screen + bottom navigation -- match Stitch mockups

## Overview

The app's UI diverged from its Stitch mockups during feature development. This overhaul brings the Today screen and navigation into visual alignment with the "Kinetic Precision" design system defined in Stitch. No new features, routes, or data model changes -- pure visual plus one deliberate behavioral change (removing collapsibles).

### Screens In Scope

- Today screen (workout view, live console, exercise queue)
- Bottom navigation bar (mobile)
- Desktop side rail navigation
- Exercise queue card component (used on today screen)

### Screens Deferred (follow-up pass)

- Settings, Planner, Progress, Templates, Library, RP Setup Screen

### Global Impact

The CSS foundation changes (font swap, border removal, spacing, surface tokens) are global and will affect all screens. This is intentional -- the out-of-scope screens benefit from cleaner baselines even without dedicated work. The 3 non-default themes (warzone, neon-overload, concrete) will need surface token overrides in a follow-up.

---

## 1. Global CSS Foundation

### 1a. Font Swap

Replace Teko with Space Grotesk for `--font-display`.

| Variable | Current | New |
|----------|---------|-----|
| `--font-display` | Teko | Space Grotesk |
| `--font-ui` | Source Sans 3 | Source Sans 3 (unchanged) |
| `--font-mono` | JetBrains Mono | JetBrains Mono (unchanged) |

Load Space Grotesk via `next/font/google` in `layout.tsx` using `Space_Grotesk` import (weights 400, 500, 700), assign `variable: "--font-space-grotesk"`. Remove Teko import. No other theme uses Teko so this is safe.

### 1b. Surface Token System

The Stitch design uses 5 surface depth levels for tonal layering instead of borders. These replace the existing `--bg-*` tokens.

**Aliasing strategy:** The existing `--bg-0`, `--bg-1`, `--bg-2` tokens are used across the entire app (including out-of-scope screens). Rather than find-and-replace all references, alias the existing tokens to the new surface values in `:root`:

```css
:root {
  /* New surface tokens (source of truth) */
  --surface-base: #111317;
  --surface-low: #1a1c1f;
  --surface-mid: #1e2023;
  --surface-high: #282a2d;
  --surface-highest: #333538;

  /* Alias existing tokens so all screens keep working */
  --bg-0: var(--surface-base);
  --bg-1: var(--surface-low);
  --bg-2: var(--surface-mid);
  --card-bg: var(--surface-mid);
  --bg-input: var(--surface-high);
}
```

The 3 non-default themes (warzone, neon-overload, concrete) continue to override `--bg-0`, `--bg-1`, `--bg-2` directly -- they don't need surface tokens until their dedicated overhaul. For now, the surface tokens only need correct values in the iron-ledger (default) theme.

### 1c. Border Elimination ("No-Line Rule")

Strip `border: 1px solid var(--border)` from `.card`, `.panel`, `.surface`, input fields, and logged-set chips. Replace with background color shifts using the surface hierarchy.

- Inputs: `--surface-high` background, no border. On focus: `box-shadow: 0 0 0 1px var(--accent-primary-30)` where `--accent-primary-30` is `rgba(85, 246, 237, 0.3)`.
- The only visible border allowed: active exercise card left accent (3px solid `var(--accent-primary)`)

**Theme impact:** The warzone theme uses `--border-width: 2px` as a deliberate design choice. For this phase, the no-line rule applies to the iron-ledger theme. Other themes' borders are preserved via their own overrides. The global `.card` border removal is guarded: if a theme sets `--border-width` > 0, the card restores its border.

### 1d. Glass-Morphism

Add utility classes with `@supports` fallback:

```css
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

/* Fallback for browsers without backdrop-filter */
@supports not (backdrop-filter: blur(1px)) {
  .glass {
    background: rgba(30, 32, 35, 0.95);
  }
  .glass-card {
    background: rgba(30, 32, 35, 0.97);
  }
}
```

Applied to: bottom nav, desktop side rail, modals, floating workout status bar.

### 1e. Spacing Scale

| Element | Current | New |
|---------|---------|-----|
| Card padding | 12-16px | 20px |
| Queue card gap | 0 (borders between) | 12px |
| Section gap | 8-12px | 16px |
| Page horizontal padding | 12px | 16px mobile, 24px desktop |

### 1f. Button Styles

**Primary CTA (e.g., "Start Workout", "Log Set"):**
- Background: `linear-gradient(135deg, var(--accent-primary), var(--accent-primary-dim, #26d9d1))`
- Color: `var(--bg-0)` (dark text on bright gradient)
- Border-radius: 8px
- Font: `var(--font-display)` 700, 1.1rem
- No shadow, no border

Uses theme tokens so other themes' accent colors are respected.

**Ghost buttons:** Keep current pattern but remove border, use `var(--surface-highest)` background on hover.

---

## 2. Bottom Navigation (Mobile)

### Current
Solid dark bar, 5 icon-only items (Settings was removed from nav in the UX overhaul).

### Target (Stitch)
- Glass background (`.glass` class)
- 5 items: Today, Planner, Progress, Templates, Library
- Each item: Lucide icon (20px) stacked above label
- Label: `var(--font-display)` weight 500, `0.65rem`, uppercase, `letter-spacing: 0.05em`
- Active: `var(--accent-primary)` icon + label
- Inactive: `#8b92a0` icon + label
- Bottom padding: `env(safe-area-inset-bottom)` (already present)
- Fixed position

### Z-Index Stack

| Element | z-index |
|---------|---------|
| Bottom nav | 50 |
| Workout status bar | 60 |
| Modal backdrop | 1000 |
| Modal content | 1001 |

### Desktop Side Rail
Glass treatment (`.glass` class). Keep existing content: brand block, household info, program selector, profile toggle, nav links. Nav links: icon + label in a row. Active item: cyan accent. The side rail is a larger change but the treatment is the same glass + label pattern.

---

## 3. Exercise Queue Card Component

### Current
Simple text card with ProgressRing SVG, order label chip, name, scheme string, "Last: none yet", completion dots.

### Target (Stitch data-cluster layout)

```
+-------------------------------------------+
| 1A  BARBELL BENCH PRESS             [swap] |
|     Chest & Triceps                    [?] |
|                                            |
|     SETS       REPS        WEIGHT          |
|      3        8-10        185 LBS          |
|                                  2/3 done  |
+-------------------------------------------+
```

### File: `web/src/components/exercise-queue-card.tsx`

### Elements Retained, Relocated, or Removed

| Current Element | Disposition |
|----------------|-------------|
| ProgressRing SVG | **Removed.** Replaced by "2/3 done" text in footer. |
| Completion dots | **Removed.** Same -- text progress replaces dots. |
| Order label ("1A") | **Retained.** Shown at top-left before exercise name. Critical for superset pairing visibility. |
| Track chip (His/Hers) | **Removed.** Profile is already indicated by the active toggle in the header. Redundant per-card. |
| ExRx/demo URL link ("?") | **Retained.** Shown as a small icon-button on Row 2 (right of muscle group text). |
| Notes line | **Retained.** Shown below muscle group text when present, in muted italic. |
| Swap icon | **Retained.** Uses `ArrowLeftRight` from `@/components/icons` (already re-exported there). |

### Component Semantics

The card remains a `<button>` element for keyboard accessibility (selecting an exercise). The swap icon and URL link are nested `<button>` elements inside, with `e.stopPropagation()` to prevent card selection on those clicks (existing pattern).

### CSS Class Migration

The component renames from `.exercise-card` to `.queue-card`. All CSS selectors referencing the old class names must be removed from `globals.css`:

- `.exercise-card`, `.exercise-card.active`, `.exercise-card.done`
- `.exercise-card.superset-grouped`, `.exercise-card .exercise-name`
- `.exercise-card .mono`, `.exercise-card.pr-pulse`
- `.exercise-card .completion-dots`, `.exercise-card .exercise-line`

Replaced by the new `.queue-card*` selectors.

### State Attributes

Use `data-*` attributes instead of className toggling for card states. This is a deliberate shift from the existing pattern -- data attributes are more semantic and avoid class string manipulation. All new components in this overhaul use this pattern.

- `data-active="true"` -- currently selected exercise
- `data-complete="true"` -- all sets logged
- `data-skipped="true"` -- RP exercise with 0 sets

### New Props

| Prop | Type | Source |
|------|------|--------|
| `muscleGroup` | `string` | Formatted in today-screen from `findExercise()` |
| `reps` | `string` | First setGroup's reps string |
| `lastWeight` | `number \| undefined` | Parsed from last performance |
| `prescribedWeight` | `number \| undefined` | From RP engine |
| `rirTarget` | `string \| undefined` | From RP engine |
| `isSkipped` | `boolean` | `targetSets === 0` |

**WEIGHT column precedence:** `prescribedWeight` > `lastWeight` > "---"

### Muscle Group Text Helper

Add to `exercise-queue-card.tsx` or a shared util:

```ts
function formatMuscleGroup(def: ExerciseDefinition | undefined): string {
  if (!def) return "";
  const primary = def.primaryMuscle.replace(/_/g, " ");
  const title = primary.charAt(0).toUpperCase() + primary.slice(1);
  const secondaries = def.secondaryMuscles
    .filter(s => s.factor >= 0.3)
    .map(s => {
      const name = s.muscle.replace(/_/g, " ");
      return name.charAt(0).toUpperCase() + name.slice(1);
    });
  return secondaries.length > 0 ? `${title} & ${secondaries[0]}` : title;
}
```

Only shows the strongest secondary muscle (factor >= 0.3) to keep the text compact. Returns e.g., "Chest & Triceps", "Back & Biceps", "Quads".

### Queue Card CSS

```css
.queue-card {
  background: var(--surface-mid);
  border-radius: 8px;
  padding: 16px 20px;
  cursor: pointer;
  transition: background 0.15s;
  border: none;
  text-align: left;
  width: 100%;
  color: inherit;
  font: inherit;
}

.queue-card:hover {
  background: var(--surface-high);
}

.queue-card[data-active="true"] {
  border-left: 3px solid var(--accent-primary);
  padding-left: 17px;
  background: var(--surface-high);
}

.queue-card[data-complete="true"] { opacity: 0.5; }
.queue-card[data-skipped="true"] { opacity: 0.3; }

.queue-card-name {
  font-family: var(--font-display);
  font-weight: 700;
  font-size: 1rem;
  text-transform: uppercase;
  color: var(--text-0);
  letter-spacing: 0.02em;
}

.queue-card-order {
  font-family: var(--font-mono);
  font-size: 0.78rem;
  color: var(--accent-primary);
  margin-right: 8px;
}

.queue-card-muscles {
  font-family: var(--font-ui);
  font-size: 0.78rem;
  color: #8b92a0;
  margin-top: 2px;
}

.queue-card-data {
  display: flex;
  gap: 24px;
  margin-top: 12px;
}

.queue-card-label {
  font-family: var(--font-display);
  font-size: 0.65rem;
  text-transform: uppercase;
  letter-spacing: 0.05em;
  color: #8b92a0;
  display: block;
}

.queue-card-value {
  font-family: var(--font-mono);
  font-size: 1.1rem;
  color: var(--text-0);
  display: block;
  margin-top: 2px;
}

.queue-card-progress {
  font-family: var(--font-mono);
  font-size: 0.75rem;
  color: var(--accent-primary);
}

.queue-card-rir {
  font-family: var(--font-mono);
  font-size: 0.75rem;
  color: var(--accent-power);
  margin-left: auto;
}

.queue-card-footer {
  display: flex;
  align-items: center;
  margin-top: 8px;
  gap: 8px;
}
```

---

## 4. Today Screen Header

### Current
"ACTIVE PROFILE" description, His/Hers toggle, "TODAY" title, "Week 1 - Day 1 | Pull" subtitle, `<details>` collapsible wrappers around queue and console.

### Target

```
COMMAND CENTER                    [His] [Hers]

TODAY
WEEK 1 - DAY 1 | PULL
                                [START WORKOUT]

[Week v] [Day v]  < >
```

**Changes:**
- "COMMAND CENTER" label: rendered in `app-shell.tsx` (where the "ACTIVE PROFILE" text lives, not in today-screen.tsx). `var(--font-display)`, 0.7rem, uppercase, `color: #8b92a0`, `letter-spacing: 0.08em`.
- His/Hers toggle: keep current position (top-right of header in app-shell.tsx)
- "TODAY" in display font, 2rem+
- Subtitle: "WEEK 1 - DAY 1 | PULL" in muted text
- "START WORKOUT" button: primary gradient style
- Remove "Exercise Queue" and "Today Pipeline" redundant section labels
- Week/Day selectors: compact, same row, glass-card styled dropdowns
- Modify `WorkoutHeader` component to accept the new layout

### Collapsible Removal (Behavioral Change)

Remove the `<details>` collapsible wrappers around the Exercise Queue and Live Console sections. Both are always visible.

**Rationale:** The Stitch mockup shows a continuous scrolling layout. The collapsibles were added for mobile scroll management but they hide the queue (the primary navigation element) behind a tap. On mobile with 8+ exercises, the page will be long -- this is acceptable because the bottom nav and workout status bar remain fixed, and the user scrolls naturally.

---

## 5. Live Set Console

### Current
Bordered panel with modest typography, scheme text as a tappable button, inputs with borders.

### Target
- Glass-card background (`.glass-card` class)
- Exercise name: `var(--font-display)` 700, 1.4rem, uppercase
- Scheme/RIR info directly below name in muted text
- Prescribed weight (RP): shown as "TARGET: 185 LBS" in cyan mono
- Rest timer: already close to Stitch, just needs glass-card background
- Input fields: `var(--surface-high)` background, no border, 8px radius. On focus: `box-shadow: 0 0 0 1px var(--accent-primary-30)`
- "LOG SET" button: primary gradient, full width
- Logged sets: chips with `var(--surface-high)` background, no border, 8px radius

---

## 6. Files Modified

| File | Change |
|------|--------|
| `web/src/app/layout.tsx` | Swap Teko -> Space Grotesk via `next/font/google` `Space_Grotesk` import |
| `web/src/app/globals.css` | Add surface tokens (aliased to existing --bg-*), glass utilities with @supports fallback, remove borders from cards/panels/inputs, update spacing scale, new queue-card styles, gradient button class, nav label styles. Remove old `.exercise-card` selectors. |
| `web/src/components/exercise-queue-card.tsx` | Rebuild to data-cluster layout with new props. Remove ProgressRing, completion dots, track chip. Keep order label, swap icon, URL link, notes. Change from className to data-attribute state. |
| `web/src/components/app-shell.tsx` | Restyle bottom nav (glass, icon + label, 5 items), restyle desktop rail (glass), change "ACTIVE PROFILE" to "COMMAND CENTER" |
| `web/src/components/screens/today-screen.tsx` | Remove `<details>` collapsibles, remove redundant section titles, add `formatMuscleGroup()` derivation for queue cards, pass new props to ExerciseQueueCard, restyle console section inline styles |

### Files NOT Modified
- No new files created
- No data model changes
- No route changes
- No new dependencies

---

## 7. Migration Notes

- Existing CSS classes (`.card`, `.panel`, `.surface`, `.ghost-btn`) are restyled in-place for the default theme
- New `--surface-*` tokens are aliased to `--bg-*` so all existing references keep working
- Old `.exercise-card` CSS selectors are removed and replaced by `.queue-card*`
- Other screens inherit the global CSS changes (font, spacing, border removal) automatically
- Non-default themes (warzone, neon-overload, concrete) are unaffected in this phase -- they override `--bg-*` which still works. Surface tokens and glass effects will need theme-specific values in a follow-up.

---

## 8. What This Does NOT Include

- Other screen redesigns (deferred to follow-up)
- Exercise image thumbnails (Stitch shows small images -- no image source available yet)
- Performance gauge component (Stitch's circular progress ring -- complex, deferred)
- Session insights sidebar at desktop (Stitch shows this -- deferred)
- Theme picker changes (other themes need surface token overrides -- deferred)
- PR badge pulse animation (keeping existing behavior, just restyling the chip)
