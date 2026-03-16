# Workout App PWA Plan

## 1. Project Intent

Build a significantly better shared workout web app (installable PWA) for two people in one household.

Primary goals:
- Replace the current single-file local tracker with a robust multi-user app.
- Keep workout logging extremely fast in-session.
- Support shared program management with distinct user permissions.
- Preserve and improve progress tracking, planning, and coaching/template controls.

Current source reference:
- Existing local tracker: `massimpact.html`
- Program screenshots and structure: `screenshots/`

## 2. Confirmed Product Decisions

- Scope target: all of the following in launch scope:
  - Tracker-first runtime logging
  - Planning/scheduling/reminders
  - Coach/template editing capabilities
- Delivery style: big-bang release (single full launch, not staged public rollout).
- Stack: Next.js + Supabase + Vercel.
- Household model:
  - Two user accounts in one shared household.
  - One active program cycle at a time.
  - Template library supported (create/add templates).
- Permissions:
  - User A (owner): can edit both templates/tracks.
  - User B (partner): can edit only her own template/track.
- Rest timer behavior:
  - Per-exercise default rest target.
  - Auto-start timer immediately after each saved set.
  - Not strict/enforced; user can override.
  - Intuitive behavior: in-app timer + optional background alert/vibration where supported.

## 3. Product Scope (Launch)

### 3.1 Authentication and Household
- Auth (email/password or magic link).
- Household invite/join flow.
- Household-scoped data isolation.

### 3.2 Program and Template Management
- Template library (create, duplicate, archive).
- Template structure:
  - Weeks
  - Days
  - Exercises
  - Exercise defaults (rest target, rep targets, notes/prompts)
- Two tracks within template/cycle (`his`, `hers`) with permission rules.
- One active cycle assignment at a time per household.

### 3.3 Workout Runtime
- Start workout session.
- Start/finish exercise session.
- Set logging per exercise (weight/reps + optional RPE/notes).
- Auto-start rest timer on set save.
- Exercise summary metrics:
  - Total exercise elapsed time
  - Total rest time
  - Active lifting time (derived)

### 3.4 Planning and Reminders
- Weekly schedule view.
- Planned day assignment and completion indicators.
- Reminder preferences by user.
- Optional missed-workout carry behavior.

### 3.5 Progress and History
- Session history.
- Last performance shown inline.
- PR indicators.
- Volume/progression trends.

### 3.6 PWA and Offline Support
- Installable PWA.
- Offline capture queue for runtime writes.
- Ordered sync replay on reconnect.
- Sync status visibility (`Synced`, `Pending`, `Retrying`).

## 4. Technical Architecture

### 4.1 Frontend
- Next.js (App Router, TypeScript).
- Mobile-first workout runtime UI.
- PWA support (manifest + service worker caching strategy).

### 4.2 Backend
- Supabase:
  - Postgres for data
  - Auth for identity
  - Realtime for shared updates
  - Row Level Security for household-safe access

### 4.3 Deployment
- Vercel for web app hosting.
- Supabase hosted project for DB/auth/realtime.

## 5. Data Model (Relational Core)

### 5.1 Identity and Household
- `profiles`:
  - `id` (auth user id PK)
  - `display_name`
  - metadata fields
- `households`:
  - `id`
  - `name`
  - timestamps
- `household_members`:
  - `id`
  - `household_id`
  - `user_id`
  - role/permission flags

### 5.2 Template and Cycle
- `program_templates`:
  - `id`
  - `household_id`
  - `name`
  - `created_by`
  - `is_archived`
- `template_tracks`:
  - `id`
  - `template_id`
  - `track_type` (`his`/`hers`)
  - edit rules metadata
- `template_weeks`:
  - `id`
  - `template_track_id`
  - `week_number`
- `template_days`:
  - `id`
  - `template_week_id`
  - `day_number`
  - `title` (e.g., Pull/Push/Legs)
- `template_exercises`:
  - `id`
  - `template_day_id`
  - `order_index`
  - `name`
  - `target_sets`
  - `target_reps`
  - `notes`
- `template_exercise_defaults`:
  - `template_exercise_id`
  - `rest_target_seconds`
  - optional runtime defaults
- `template_change_log`:
  - audit entries for structural edits

### 5.3 Active Program Assignment
- `program_cycles`:
  - `id`
  - `household_id`
  - `template_id`
  - `status` (`active`/`archived`)
  - `started_at`
  - `ended_at`
- `cycle_assignments`:
  - `id`
  - `cycle_id`
  - `user_id`
  - `track_type`

Constraint:
- Exactly one active cycle per household.

### 5.4 Workout Runtime Logs
- `workout_sessions`:
  - `id`
  - `household_id`
  - `user_id`
  - `cycle_id`
  - `week_number`
  - `day_number`
  - `started_at`
  - `completed_at`
  - `status`
- `exercise_sessions`:
  - `id`
  - `workout_session_id`
  - `template_exercise_id` (or resolved exercise reference)
  - `started_at`
  - `ended_at`
- `set_logs`:
  - `id`
  - `exercise_session_id`
  - `set_index`
  - `weight`
  - `reps`
  - `rpe` (optional)
  - `notes` (optional)
  - `logged_at`
  - idempotency key
- `rest_intervals`:
  - `id`
  - `exercise_session_id`
  - `set_log_id`
  - `started_at`
  - `target_seconds`
  - `ended_at` (optional until stopped/next set)

## 6. Authorization and RLS Rules

- All household-scoped rows must enforce household membership checks.
- Users may read household templates/cycle data as permitted.
- Runtime writes:
  - User can write only their own workout/exercise/set/rest rows.
- Template edits:
  - Owner user can edit both `his` and `hers` tracks.
  - Partner can edit `hers` track only.
- Active cycle switch:
  - controlled action (transaction) to preserve one-active-cycle invariant.

## 7. Core User Flows

### 7.1 Daily Workout Flow
1. Open app -> `Today`.
2. Start workout session.
3. Start exercise.
4. Log set.
5. Save set -> rest timer auto-starts.
6. Repeat sets (timer resets each save).
7. Finish exercise -> summary metrics shown.
8. Finish workout -> session complete.

### 7.2 Timer Flow
- Timer starts automatically on set save.
- Uses exercise-level default rest target.
- User can skip, extend, or ignore.
- Alert at target (if notifications enabled/supported).

### 7.3 Template/Coach Flow
- Open template studio.
- Edit week/day/exercises, set defaults, reorder/add/remove.
- Save changes with version tracking.
- Resolve stale-version conflicts when needed.

### 7.4 Planning Flow
- Weekly planner marks scheduled and completed sessions.
- Reminder config per user.
- Optional carry-over for missed workouts.

## 8. Offline, Sync, and Conflict Handling

- Runtime writes are queued locally with timestamp + idempotency key.
- Queue replay occurs in-order when back online.
- UI shows sync status clearly.

Conflict strategy:
- Runtime logs: append-only, low-conflict, idempotent writes.
- Template edits: optimistic version checks; prompt merge on collision.
- Cycle activation: transactional guard to prevent duplicate active cycles.

Timer resilience:
- Timer operates locally without network dependency.
- Session/rest calculations reconstruct from persisted timestamps after reload.

## 9. UX Direction

Design goals:
- Fast, focused workout UI with minimal friction.
- Strong visual upgrade over current basic single page.
- Distinct but consistent tracks for each person.
- Clear active state indicators (in progress, rest ticking, synced/pending).

Key UI surfaces:
- `Today` runtime screen
- Exercise logging sheet/panel
- Planner calendar/week view
- Progress dashboard
- Template studio/editor
- Settings/notifications/household management

## 10. Testing Strategy

### 10.1 Unit Tests
- Timer math and elapsed/rest/active calculations.
- Permission helpers.
- Planner carry logic.

### 10.2 Integration Tests
- RLS policy behavior by role.
- Template edit permissions (`owner`, `partner`).
- Single active cycle transaction safety.

### 10.3 E2E Tests (Playwright)
- Auth + household invite/join.
- Start workout -> log sets -> auto rest timer -> finish workout.
- Role-limited template editing.
- Offline logging + online replay.

### 10.4 Device Validation
- iOS Safari PWA install and runtime checks.
- Android Chrome PWA install and runtime checks.
- Background alert behavior verification with fallback UX.

## 11. Delivery Plan (Big-Bang)

Build tracks to complete before launch:
- Foundation: app shell, auth, household, permissions, RLS baseline.
- Data and template studio: full template/cycle authoring.
- Runtime engine: session/set/rest logging and timer behavior.
- Planning/reminders: scheduling + user preferences.
- Progress analytics: history, PRs, trend charts.
- Reliability: offline queue, sync indicators, conflict handling, audit log.
- Hardening: full test matrix, performance checks, backup/restore drills.

Release gate:
- No known critical defects in core workout flow.
- Permissions verified in production-like env.
- Offline replay validated end-to-end.
- Monitoring + rollback process ready.

## 12. Risks and Mitigations

- Background timer/notification limitations vary by device/browser.
  - Mitigation: graceful fallback + explicit UX indicators.
- Permission complexity around dual editable tracks.
  - Mitigation: explicit policy tests and integration coverage.
- Big-bang scope size risk.
  - Mitigation: strict must-have checklist and freeze criteria before launch.
- Data integrity under flaky connectivity.
  - Mitigation: idempotent writes + queue ordering + sync telemetry.

## 13. Launch Readiness Checklist

- Schema migrations finalized.
- RLS policies audited and tested.
- Template seed data ready.
- Critical E2E flows passing.
- Manual mobile PWA checks completed.
- Backup and restore procedure tested.
- Production monitoring and alerting enabled.

## 14. UI/UX Overhaul Plan (March 2026)

### Status: PLANNED — not yet implemented

### Context
App is live at https://web-blush-phi.vercel.app. Lock screen was removed. The UI works but needs polish — exercise cards, rest timer, and set logger all blend together, mobile layout is too long (~4 screens of scroll), and there's no visual feedback for logging sets. The dark tactical "Iron Ledger" aesthetic should be preserved and enhanced.

### Phase 1: Quick Wins (CSS-heavy, ship as one batch)

**1.1 — Animated Progress Rings on Exercise Cards**
- Files: `exercise-queue-card.tsx`, `globals.css`
- Replace "Logged 2 of 4 sets" text with a 28px SVG progress ring in the card header
- Uses `stroke-dashoffset` transition (400ms) driven by completedSets/targetSets
- Turns green (`--ok`) when complete. Keep completion dots as smaller secondary indicator

**1.2 — Better Visual Hierarchy in Live Console**
- Files: `globals.css`
- Colored left-border accents: orange on set-entry row, cyan on logged-sets panel
- Bottom border + padding below rest timer to separate it from the form
- Subtle background differentiation for the live console column

**1.3 — Better Mobile Bottom Nav**
- Files: `globals.css`, `app-shell.tsx`
- Bigger touch targets (increase padding + font size)
- Active indicator bar (4px colored bar above active link)
- Glass effect (`backdrop-filter: blur(12px)` + semi-transparent bg)
- Add `item.short` code as small label above each nav text

**1.4 — Smoother Animations & Staggered Entrances**
- Files: `globals.css`
- `reveal-y`: increase travel 8px→12px, duration 320ms→380ms
- Staggered delays on `.queue-list` children (40ms increments, up to 8)
- Exercise card transitions at 280ms covering all properties

**1.5 — Mobile Collapsible Sections**
- Files: `today-screen.tsx`, `globals.css`
- Wrap Exercise Queue and Live Console in `<details>` with `<summary>` headers
- Open by default, collapsible on mobile only (<1024px)
- Summary hidden on desktop. Chevron rotates on open/close

### Phase 2: Level Up the Feel (ship individually)

**2.1 — Glassmorphism on Cards**
- Files: `globals.css`
- `backdrop-filter: blur(6px)` on `.card` with semi-transparent rgba bg
- Faint white edge border for frosted-glass effect
- `.card-elevated` variant (stronger blur) for runtime tray and live console

**2.2 — Workout In-Progress Color State**
- Files: `today-screen.tsx`, `globals.css`
- `.screen--active` class: subtle cyan gradient wash at top when session is live
- Status chip gets 3s breathing pulse with glow
- Runtime tray gets accent border. Visual "battle mode" vs idle browsing

**2.3 — Enhanced Rest Timer Dial (SVG Arc)**
- Files: `rest-timer-dial.tsx`, `globals.css`
- Replace `conic-gradient` with SVG circle + `stroke-dashoffset` for smooth animation
- Color phases: idle (muted) → >50% remaining (cyan) → <50% (yellow) → complete (orange)
- Completion pulse glow. All driven through CSS custom properties

**2.4 — Toast Notifications**
- Files: new `toast.tsx`, `globals.css`, `today-screen.tsx`, `app-shell.tsx`
- `ToastProvider` + `useToast()` hook
- Events: "Set logged" (green), "Exercise complete" (orange), "NEW PR!" (pink)
- Auto-dismiss 2.5s, max 3 visible, positioned above mobile nav
- PR detection: compare logged set volume vs all previous sessions

**2.5 — Swipe Gestures on Mobile Exercise Cards**
- Files: `exercise-queue-card.tsx`, `globals.css`, `today-screen.tsx`
- Touch handlers for horizontal swipe (>80px threshold)
- Swipe right → mark complete, swipe left → skip to next
- Background labels revealed during swipe ("DONE" / "SKIP")
- Vertical dead zone to avoid scroll conflicts

### Phase 3: Bigger Redesign (ship sequentially)

**3.1 — Mobile Single-Card Focus Mode**
- Files: `today-screen.tsx`, `globals.css`, new `exercise-focus-card.tsx`
- On mobile (<1024px): single-exercise view replacing scrollable two-col layout
- Combines exercise name + progress ring, smaller timer, set entry, collapsible logged sets
- Left/right arrows + dot indicator carousel for queue navigation
- Desktop keeps two-column layout (CSS-hidden toggle between views)
- **Biggest single UX improvement** — one exercise at a time matches gym workflow

**3.2 — Dashboard Stats Strip**
- Files: `today-screen.tsx`, `globals.css`
- 4-stat grid above workout area: Progress (ring), Sets Logged, Total Volume (lbs), Elapsed Time
- Large Teko display numbers. 2x2 mobile, 4-col desktop
- 64px progress ring showing completed/total exercises
- "Scoreboard" feel on app open

### Implementation Order
- Phase 1: all items as one batch → commit + deploy
- Phase 2: each item individually → commit + deploy after each
- Phase 3: 3.1 first, then 3.2

### Risk Notes
- `backdrop-filter: blur()` can lag on old Android — keep values at 6-12px, fallback to solid rgba
- SVG progress rings lightweight but use `will-change` only on active card
- Swipe gestures must not conflict with browser back-swipe (vertical dead zone + 10px threshold)

### Key Files Summary
| File | Phases |
|------|--------|
| `web/src/app/globals.css` | All phases |
| `web/src/components/screens/today-screen.tsx` | 1.5, 2.2, 2.4, 3.1, 3.2 |
| `web/src/components/exercise-queue-card.tsx` | 1.1, 2.5 |
| `web/src/components/rest-timer-dial.tsx` | 2.3 |
| `web/src/components/app-shell.tsx` | 1.3, 2.4 |

### Verification After Each Phase
1. `npm run build` in `web/` — must compile clean
2. Desktop screenshot check (1280x800)
3. Mobile screenshot check (390x844)
4. Deploy: `npx vercel --prod --public --yes` from `web/`
5. Verify live at https://web-blush-phi.vercel.app

---

## 15. Not Implementing Yet

This document is planning only. No code implementation is performed yet.

When ready to build, next step is to convert this plan into an execution task list with milestones, issue breakdown, and migration order.
