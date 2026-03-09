# Mass Impact PWA Frontend Design

Date: 2026-02-16
Scope: Full frontend design direction and UX system for the shared workout PWA

## 1. Inputs Reviewed

- `massimpact.html`: existing single-file tracker with week/phase tabs, his/hers mode, local storage logs, custom exercises, progress chart, warmup calculator, export/import.
- `screenshots/`: full 12-week program layout from Boostcamp, including exercise progression tables and program metadata sections.
- `plan.md`: approved product plan, permissions, runtime logging flow, timer behavior, and platform decisions (Next.js + Supabase + Vercel).

## 2. Product UX Goals

- Make in-gym logging faster than using a notes app plus separate timer app.
- Keep shared household visibility while preserving role-based edit control.
- Turn the static 12-week grid into an actionable daily workflow.
- Make the app feel premium, athletic, and unmistakably purposeful.
- Preserve the strengths of the current tracker: clarity, customization, and progression visibility.

## 3. Design Approach Options

### Option A (Recommended): Tactical Training Console

A high-contrast, performance-focused interface with bold typography, dense workout cards, strong state colors, and a large circular rest timer that dominates the runtime view.

Pros:
- Best fit for fast logging under fatigue.
- Highly legible in gym lighting conditions.
- Distinct personality without visual clutter.

Tradeoffs:
- Less "lifestyle app" softness.
- Requires careful spacing discipline to avoid feeling harsh.

### Option B: Editorial Performance Journal

A calmer, magazine-like look using roomy cards, serif display headers, and rich historical views.

Pros:
- Great for long-form progress review and planning.
- Premium "crafted" feeling.

Tradeoffs:
- Slower for in-session interaction.
- Harder to prioritize rapid set-entry.

### Option C: Gamified Progress Arena

Card-stack UI with medals, streak flames, rank-style progression, and more playful motion.

Pros:
- High motivational energy.
- Strong emotional hooks for consistency.

Tradeoffs:
- Risks novelty fatigue.
- Can distract from core logging efficiency.

Decision: Use Option A as the core UX with selective "journal" depth in Progress screens.

## 4. Visual Direction (Final)

Theme name: **Iron Ledger**

Tone:
- Industrial, precise, competitive.
- "Performance dashboard" rather than generic wellness app.

Remember-me moment:
- A full-width "Live Set Console" with a giant auto-rest dial that starts instantly after each set save.

Visual language:
- Sharp geometry with selective rounded corners.
- Layered dark surfaces with copper and cyan accent rails.
- Dense but readable data rhythm.

## 5. Typography and Color System

### 5.1 Font Pairing

- Display and section labels: `Teko` (tight, athletic, high-impact)
- UI body text: `Source Sans 3` (high readability at small sizes)
- Data values and timer: `JetBrains Mono` (measurement precision)

### 5.2 Color Tokens

- `--bg-0`: `#0B0D10` (app background)
- `--bg-1`: `#12161B` (cards)
- `--bg-2`: `#1A2028` (raised surfaces)
- `--text-0`: `#F4F7FA` (primary text)
- `--text-1`: `#A9B5C3` (secondary text)
- `--accent-primary`: `#26D9D1` (active actions, runtime focus)
- `--accent-power`: `#F08A24` (effort/intensity, timer halo)
- `--accent-hers`: `#FF5A8B` (partner track accents)
- `--ok`: `#34D399`
- `--warn`: `#FBBF24`
- `--danger`: `#F87171`
- `--border`: `#2A3340`

Usage rules:
- One dominant accent per screen state; avoid rainbow noise.
- Timer states map to color transitions: idle `text-1`, running `accent-primary`, target reached `accent-power`.
- Keep partner distinction subtle and contextual, not global theme flipping.

## 6. Layout and Information Architecture

Primary app areas:
- `Today`
- `Planner`
- `Progress`
- `Templates`
- `Settings`

Bottom nav on mobile, side rail on desktop.

Desktop layout:
- Left rail: navigation and household identity.
- Main pane: active screen.
- Optional right utility pane on workout runtime for notes/history.

Mobile layout:
- Single-column priority with sticky action bar.
- Timer and set-entry pinned near thumb zone.

## 7. Core Screen Designs

### 7.1 Today (Runtime Home)

Purpose:
- Zero-friction start and continuation of today's workout.

Top block:
- Day label (`Week 7 - Day 3`)
- Session state chip (`Not Started`, `In Progress`, `Completed`)
- Primary CTA (`Start Workout` or `Resume`)

Exercise queue:
- Compact exercise cards with:
  - Name
  - Target set/rep scheme
  - Last performance
  - Completion dots

Sticky runtime tray:
- Active exercise name
- Quick-add set button
- Running total workout time

### 7.2 Exercise Live Set Console

This is the signature interaction surface.

Elements:
- Large circular rest timer dial in top half.
- Set logger row:
  - `Set #`
  - Weight input
  - Reps input
  - Optional RPE chip
  - `Save Set` action
- Inline previous-set ghost values for speed.
- Secondary actions: `Skip Rest`, `+15s`, `Finish Exercise`.

Behavior:
- Save set triggers immediate timer start animation.
- Timer ring pulses once when target reached.
- Notification/vibration triggers if enabled.
- Exercise summary panel appears on finish:
  - Total exercise duration
  - Rest time
  - Active time

### 7.3 Planner

Week timeline:
- Horizontal day strip (Mon-Sun) with workout tags.
- Status indicators (`planned`, `done`, `missed`, `moved`).

Cards:
- Scheduled workout details and track owner.
- Quick reschedule and carry-over actions.

Reminders:
- Per-user reminder settings panel with clean toggles and quiet defaults.

### 7.4 Progress

Three tabs:
- `Strength`
- `Volume`
- `Consistency`

Widgets:
- PR board (latest achievements)
- Lift trend charts
- Weekly completion heatmap
- Rest-time discipline trend

Chart style:
- Dark canvas with thin bright lines and restrained glow.
- Numeric callouts use mono typography for trust.

### 7.5 Templates (Coach Mode)

Structure editor:
- Left: week/day tree.
- Center: ordered exercise list with drag handles.
- Right: exercise properties (sets/reps/rest/notes/substitutions).

Permission cues:
- Editable fields always visible.
- Locked fields for partner show clear "view-only" tags, not disabled ambiguity.

Safety:
- Version badge and change notes.
- "Publish to active cycle" confirmation sheet with summary diff.

## 8. Component System

Core components:
- `AppShell`
- `WorkoutHeader`
- `ExerciseQueueCard`
- `SetEntryRow`
- `RestTimerDial`
- `SessionStatPill`
- `TrendChartCard`
- `TemplateExerciseEditor`
- `PermissionBadge`
- `SyncStateIndicator`

States every component must support:
- default
- loading/skeleton
- empty
- error
- offline pending
- success feedback

## 9. Motion and Interaction Spec

Animation principles:
- Strong entry moments, minimal decorative motion elsewhere.
- Motion communicates state changes, never just decoration.

Key animations:
- Page load stagger: nav, header, primary card (120ms stagger).
- Timer start: fast ring sweep to establish countdown.
- Set save: compact confirmation flash + subtle haptic cue.
- Completed exercise: card collapses with metric reveal.

Durations:
- micro: 120ms
- standard: 220ms
- emphasis: 320ms

Easing:
- primary: `cubic-bezier(0.22, 1, 0.36, 1)`
- exit: `cubic-bezier(0.4, 0, 1, 1)`

## 10. Responsive and Device Behavior

Mobile first breakpoints:
- `0-639`: single column, sticky bottom controls.
- `640-1023`: wider cards, two-column planner blocks.
- `1024+`: side rail + multi-pane workspace.

Touch ergonomics:
- minimum tappable target 44px.
- set save and timer controls anchored in lower half.
- avoid hidden hover-only actions.

PWA specifics:
- install prompt after repeated visits.
- offline banner with non-blocking messaging.
- queue status always visible during workout logging.

## 11. Accessibility Standards

- WCAG AA contrast baseline.
- Keyboard and switch navigation for all critical controls.
- Proper landmarks and headings per screen.
- Timer announcements for screen readers.
- Reduced-motion mode disables pulse and heavy transitions.

## 12. Mapping Old UI to New UI

Keep and elevate:
- Week/day program structure.
- Custom exercise capability.
- Progress charting.
- Warmup utility (move to tools drawer).
- Backup/export (move to settings and cloud sync fallback).

Replace:
- Phase tabs as primary navigation.
- Dense accordion-only browsing model.
- full-page mode switching for his/hers.

New runtime emphasis:
- Session-first navigation.
- Active exercise console.
- Auto-rest as default behavior.

## 13. Frontend Technical Implementation Notes

Framework:
- Next.js App Router + TypeScript.

UI stack:
- Tailwind CSS + CSS variables for tokens.
- Component primitives via headless patterns (avoid heavy visual framework lock-in).
- Charts via lightweight, accessible charting library.

State:
- React Query for server state.
- Local optimistic queue for offline runtime writes.
- URL-state for planner/template deep links.

Performance:
- Route-level code splitting.
- Defer non-runtime charts until requested.
- Keep Today and Live Set Console bundle lean.

## 14. Design Acceptance Criteria

- User can start workout and log first set in under 8 seconds on mobile.
- Rest timer always starts immediately after set save.
- User can finish an exercise and see elapsed/rest/active breakdown without leaving runtime.
- Partner permissions are visually obvious and enforced in UI flows.
- Design feels intentionally premium and non-generic across all primary screens.

## 15. Deliverables From This Design Spec

- Visual direction and token system.
- Screen architecture and component inventory.
- Motion behavior standards.
- Accessibility and responsive requirements.
- Implementation constraints aligned with `plan.md`.

This file is design-only and intended to guide UI implementation.
