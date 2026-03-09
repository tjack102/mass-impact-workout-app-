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

## 14. Not Implementing Yet

This document is planning only. No code implementation is performed yet.

When ready to build, next step is to convert this plan into an execution task list with milestones, issue breakdown, and migration order.
