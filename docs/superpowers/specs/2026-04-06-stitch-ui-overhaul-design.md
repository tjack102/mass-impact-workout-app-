# Stitch UI Overhaul -- Design Spec

**Date:** 2026-04-06
**Status:** Draft
**Scope:** Today screen + bottom navigation -- match Stitch mockups

## Overview

The app's UI diverged from its Stitch mockups during feature development. This overhaul brings the Today screen and navigation into visual alignment with the "Kinetic Precision" design system defined in Stitch. No new features, routes, or data model changes -- pure visual.

### Screens In Scope

- Today screen (workout view, live console, exercise queue)
- Bottom navigation bar (mobile)
- Desktop side rail navigation
- Exercise queue card component (used on today screen)

### Screens Deferred (follow-up pass)

- Settings, Planner, Progress, Templates, Library, RP Setup Screen

---

## 1. Global CSS Foundation

### 1a. Font Swap

Replace Teko with Space Grotesk for `--font-display`.

| Variable | Current | New |
|----------|---------|-----|
| `--font-display` | Teko | Space Grotesk |
| `--font-ui` | Source Sans 3 | Source Sans 3 (unchanged) |
| `--font-mono` | JetBrains Mono | JetBrains Mono (unchanged) |

Load Space Grotesk via Google Fonts in `layout.tsx` (weights 400, 500, 700). Remove Teko import.

### 1b. Border Elimination ("No-Line Rule")

The Stitch design system prohibits 1px solid borders for sectioning content. Boundaries are defined through background color shifts.

**Surface hierarchy (dark theme):**

| Token | Hex | Usage |
|-------|-----|-------|
| `--surface-base` | `#111317` | Page background |
| `--surface-low` | `#1a1c1f` | Large section backgrounds |
| `--surface-mid` | `#1e2023` | Card backgrounds |
| `--surface-high` | `#282a2d` | Interactive card backgrounds, inputs |
| `--surface-highest` | `#333538` | Elevated elements, hover states |

**Changes:**
- Remove `border: 1px solid var(--border)` from `.card`, `.panel`, `.surface`, input fields, and logged-set chips
- Replace with appropriate `background` from surface hierarchy
- Inputs use `--surface-high` background with no border; on focus, a `box-shadow: 0 0 0 1px rgba(85, 246, 237, 0.3)` outline (not a border)
- The only place a visible border is allowed: active exercise card left accent (3px solid cyan)

### 1c. Glass-Morphism

Add utility classes:

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
```

Applied to: bottom nav, desktop side rail, modals, floating status bar.

### 1d. Spacing Scale

Increase base spacing on cards and between list items:

| Element | Current | New |
|---------|---------|-----|
| Card padding | 12-16px | 20px |
| Queue card gap | 0 (borders between) | 12px |
| Section gap | 8-12px | 16px |
| Page horizontal padding | 12px | 16px mobile, 24px desktop |

### 1e. Button Styles

**Primary CTA (e.g., "Start Workout", "Log Set"):**
- Background: `linear-gradient(135deg, #55f6ed, #26d9d1)`
- Color: `#111317` (dark text on bright gradient)
- Border-radius: 8px
- Font: Space Grotesk 700, 1.1rem
- No shadow

**Ghost buttons:** Keep current pattern but remove border, use `--surface-highest` background on hover.

---

## 2. Bottom Navigation (Mobile)

### Current
Solid dark bar, 5 icon-only items, no labels.

### Target (Stitch)
- Glass background: `rgba(30, 32, 35, 0.7)` + `backdrop-filter: blur(20px)`
- 5 items: Today, Planner, Progress, Templates, Library
- Each item: Lucide icon (20px) stacked above label
- Label: Space Grotesk 500, `0.65rem`, uppercase, `letter-spacing: 0.05em`
- Active: `#55f6ed` icon + label
- Inactive: `#8b92a0` icon + label
- Bottom padding: `env(safe-area-inset-bottom)` (already present)
- Fixed position, `z-index: 100`

### Settings nav item
Settings moves out of the bottom nav (currently 6th item). It remains accessible at `/settings` via the settings route. The 5 nav items match the Stitch mockup exactly.

### Desktop Side Rail
Same glass treatment. Each item: icon + label in a row (not stacked). Active item gets cyan accent.

---

## 3. Exercise Queue Card Component

### Current
Simple text card: order label, name, scheme string, "Last: none yet", progress dots.

### Target (Stitch data-cluster layout)

```
+-------------------------------------------+
|  BARBELL BENCH PRESS                  [swap] |
|  Chest & Triceps                           |
|                                            |
|  SETS       REPS        WEIGHT             |
|   3        8-10        185 LBS             |
|                                   2/3 done |
+-------------------------------------------+
```

### File: `web/src/components/exercise-queue-card.tsx`

**Structure:**

```tsx
<div className="queue-card" data-active={isActive} data-complete={isComplete} data-skipped={isSkipped}>
  {/* Row 1: Name + swap icon */}
  <div className="queue-card-header">
    <span className="queue-card-name">{name}</span>
    <button className="queue-card-swap" onClick={onSwap}>
      <ArrowLeftRight size={16} />
    </button>
  </div>

  {/* Row 2: Muscle groups */}
  <span className="queue-card-muscles">{muscleGroupText}</span>

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
      <span className="queue-card-value">{weight} LBS</span>
    </div>
  </div>

  {/* Row 4: Progress */}
  <div className="queue-card-footer">
    {completedSets > 0 && (
      <span className="queue-card-progress">{completedSets}/{targetSets} done</span>
    )}
    {rirTarget && <span className="queue-card-rir">RIR {rirTarget}</span>}
  </div>
</div>
```

**New props needed:**
- `muscleGroup: string` -- primary muscle, derived from `findExercise()` in today-screen before passing
- `reps: string` -- extracted from scheme (already available)
- `lastWeight?: number` -- from last performance, shown in WEIGHT column
- `prescribedWeight?: number` -- for RP programs, shown instead of lastWeight
- `rirTarget?: string` -- for RP programs
- `isSkipped?: boolean` -- for RP exercises with 0 sets

**Styling:**

```css
.queue-card {
  background: var(--surface-mid);
  border-radius: 8px;
  padding: 16px 20px;
  cursor: pointer;
  transition: background 0.15s;
}

.queue-card:hover {
  background: var(--surface-high);
}

.queue-card[data-active="true"] {
  border-left: 3px solid var(--accent-primary);
  padding-left: 17px; /* compensate for border */
  background: var(--surface-high);
}

.queue-card[data-complete="true"] {
  opacity: 0.5;
}

.queue-card[data-skipped="true"] {
  opacity: 0.3;
}

.queue-card-name {
  font-family: var(--font-display);
  font-weight: 700;
  font-size: 1rem;
  text-transform: uppercase;
  color: var(--text-0);
  letter-spacing: 0.02em;
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
```

---

## 4. Today Screen Header

### Current
"ACTIVE PROFILE" description, His/Hers toggle, "TODAY" title, "Week 1 - Day 1 | Pull" subtitle, redundant "Exercise Queue" + "Today Pipeline" labels, verbose week/day selectors.

### Target

```
COMMAND CENTER                    [His] [Hers]

TODAY
WEEK 1 - DAY 1 | PULL
                                [START WORKOUT]

[Week ▾] [Day ▾]  < >
```

**Changes:**
- Replace "ACTIVE PROFILE" description text with small "COMMAND CENTER" label (Space Grotesk, 0.7rem, uppercase, muted)
- Keep His/Hers toggle, move to top-right
- "TODAY" in display font, 2rem+
- Subtitle: "WEEK 1 - DAY 1 | PULL" in muted text
- "START WORKOUT" button: primary gradient style
- Remove "Exercise Queue" and "Today Pipeline" redundant section titles
- Week/Day selectors: compact, same row, glass-card styled dropdowns
- Remove the `<details>` collapsible wrappers -- queue and console are always visible

---

## 5. Live Set Console

### Current
Bordered panel with modest typography, scheme text as a tappable button, inputs with borders.

### Target
- Glass-card background
- Exercise name: Space Grotesk 700, 1.4rem, uppercase
- Scheme/RIR info directly below name in muted text
- Prescribed weight (RP): shown as "TARGET: 185 LBS" in cyan mono
- Rest timer: already close to Stitch, just needs glass-card bg
- Input fields: `--surface-high` background, no border, 8px radius
- "LOG SET" button: primary gradient (full width)
- Logged sets: chips with `--surface-high` background, no border, 8px radius

---

## 6. Files Modified

| File | Change |
|------|--------|
| `web/src/app/layout.tsx` | Swap Teko -> Space Grotesk font import |
| `web/src/app/globals.css` | Add surface tokens, glass utilities, remove borders, update spacing, new card styles, gradient buttons, nav styles |
| `web/src/components/exercise-queue-card.tsx` | Rebuild to data-cluster layout |
| `web/src/components/app-shell.tsx` | Restyle bottom nav (glass, labels, 5 items), restyle desktop rail |
| `web/src/components/screens/today-screen.tsx` | Remove collapsibles, restructure header, add muscle group derivation for queue cards, restyle console section |

### Files NOT Modified
- No new files created
- No data model changes
- No route changes
- No new dependencies (Space Grotesk loaded via Google Fonts CDN, same as current font loading)

---

## 7. Migration Notes

- Existing CSS classes (`.card`, `.panel`, `.surface`, `.ghost-btn`) are restyled in-place -- no renaming needed
- The `exercise-queue-card.tsx` component gets new props but old prop names remain compatible
- Other screens (settings, progress, library, etc.) will inherit the global CSS changes (font, spacing, border removal) automatically, improving them even without dedicated work
- The RP setup screen created earlier will also benefit from the global changes

---

## 8. What This Does NOT Include

- Other screen redesigns (deferred to follow-up)
- Exercise image thumbnails (Stitch shows small images -- no image source available yet)
- Performance gauge component (Stitch's circular progress ring -- complex, deferred)
- Session insights sidebar at desktop (Stitch shows this -- deferred)
- Theme picker changes (existing 4 themes will need surface token updates -- deferred)
