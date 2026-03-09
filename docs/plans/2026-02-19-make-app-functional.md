# Make Mass Impact App Actually Functional

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Replace all hardcoded mock data with the real Mass Impact program, add localStorage persistence, and make every screen interactive so the app is actually usable for daily workouts.

**Architecture:** A shared `program-data.ts` module holds the complete 12-week Mass Impact program (all 5 days x 12 weeks with correct exercises/sets/reps from the Boostcamp screenshots). A `workout-store.ts` module wraps localStorage to persist session state, logged sets, and user preferences. Each screen component switches from hardcoded data to reading from the store/program data. No backend needed yet - pure client-side.

**Tech Stack:** Next.js App Router, React useState/useEffect, localStorage, TypeScript

---

## Phase 1: Program Data & Persistence Layer

### Task 1: Create the complete Mass Impact program data module

**Files:**
- Create: `web/src/lib/program-data.ts`

**Context:** The Boostcamp screenshots show the real program structure. It's a 12-week PPLPP split (Pull/Push/Legs-Density/Pull/Push) with exercises that vary by phase. The program has 3 phases with progression:
- Weeks 1-4: Base phase (consistent sets/reps each week)
- Weeks 5-8: Transition phase (set structure changes for some exercises)
- Weeks 9-12: Intensity phase (more set breakdown variations, rep range changes)

**Step 1: Create the program data types and full dataset**

```typescript
// web/src/lib/program-data.ts

export type ExerciseSet = {
  sets: number;
  reps: string; // "8-12 reps", "15-20 reps", "1+ reps", "15-20 mins"
};

export type ProgramExercise = {
  order: number; // 1, 2, 3, 4... or use "5A", "5B" for supersets
  orderLabel: string; // "1", "2", "3A", "3B", etc
  name: string;
  setGroups: ExerciseSet[]; // most exercises have 1 group, but some split across rep ranges
};

export type ProgramDay = {
  dayNumber: number; // 1-5
  title: string; // "Pull", "Push", "Legs / Density"
  exercises: ProgramExercise[];
};

export type ProgramWeek = {
  weekNumber: number; // 1-12
  days: ProgramDay[];
};

export type Program = {
  name: string;
  description: string;
  duration: string;
  daysPerWeek: number;
  timePerWorkout: string;
  weeks: ProgramWeek[];
};

// Helper to get current day's exercises
export function getDayForWeek(weekNumber: number, dayNumber: number): ProgramDay | undefined {
  const week = MASS_IMPACT_PROGRAM.weeks.find(w => w.weekNumber === weekNumber);
  return week?.days.find(d => d.dayNumber === dayNumber);
}

// Helper to get default rest seconds by exercise type
export function getDefaultRestSeconds(exerciseName: string): number {
  const name = exerciseName.toLowerCase();
  if (name.includes("cardio")) return 0;
  if (name.includes("squat") || name.includes("deadlift") || name.includes("row (barbell)")) return 120;
  if (name.includes("press") || name.includes("pull-up") || name.includes("dip")) return 90;
  if (name.includes("curl") || name.includes("raise") || name.includes("fly") || name.includes("crunch")) return 60;
  return 75;
}

// Total sets for an exercise (sum of all set groups)
export function getTotalSets(exercise: ProgramExercise): number {
  return exercise.setGroups.reduce((sum, g) => sum + g.sets, 0);
}

// Format set scheme for display: "3 x 8-12 reps" or "1 x 6-8, 1 x 10-15" for multi-group
export function formatScheme(exercise: ProgramExercise): string {
  if (exercise.setGroups.length === 1) {
    const g = exercise.setGroups[0];
    return `${g.sets} x ${g.reps}`;
  }
  return exercise.setGroups.map(g => `${g.sets} x ${g.reps}`).join(", ");
}

export const MASS_IMPACT_PROGRAM: Program = {
  name: "Mass Impact",
  description: "Geoff Verity Schofield's PPLPP Program to Get MASSIVE FAST",
  duration: "12 weeks",
  daysPerWeek: 5,
  timePerWorkout: "60 minutes",
  weeks: buildAllWeeks(),
};

function buildAllWeeks(): ProgramWeek[] {
  const weeks: ProgramWeek[] = [];
  for (let w = 1; w <= 12; w++) {
    weeks.push({ weekNumber: w, days: buildWeekDays(w) });
  }
  return weeks;
}

function buildWeekDays(week: number): ProgramDay[] {
  return [
    buildDay1Pull(week),
    buildDay2Push(week),
    buildDay3LegsDensity(week),
    buildDay4Pull(week),
    buildDay5Push(week),
  ];
}

// ------- DAY 1: PULL -------
function buildDay1Pull(week: number): ProgramDay {
  // Weeks 1-4: base sets/reps
  // Weeks 5-8: transition (single arm row gets split sets)
  // Weeks 9-12: intensity (further rep range changes)

  let exercises: ProgramExercise[];

  if (week <= 4) {
    exercises = [
      { order: 1, orderLabel: "1", name: "Single Arm Row (Cable)", setGroups: [{ sets: 3, reps: "15-20 reps" }] },
      { order: 2, orderLabel: "2", name: "Pull-Up (Bodyweight)", setGroups: [{ sets: 2, reps: "8-12 reps" }] },
      { order: 3, orderLabel: "3", name: "Power Shrug", setGroups: [{ sets: 3, reps: "8-12 reps" }] },
      { order: 4, orderLabel: "4", name: "Standing Pullover (Cable)", setGroups: [{ sets: 3, reps: "12-15 reps" }] },
      { order: 5, orderLabel: "5A", name: "Rear Delt Fly (Cable)", setGroups: [{ sets: 2, reps: "10-15 reps" }] },
      { order: 6, orderLabel: "5B", name: "Incline Curl (Dumbbell)", setGroups: [{ sets: 2, reps: "8-10 reps" }] },
      { order: 7, orderLabel: "6", name: "Cardio", setGroups: [{ sets: 1, reps: "15-20 mins" }] },
    ];
  } else if (week <= 8) {
    exercises = [
      { order: 1, orderLabel: "1", name: "Single Arm Row (Cable)", setGroups: [
        { sets: 1, reps: "15-20 reps" },
        { sets: 1, reps: "10-15 reps" },
        { sets: 1, reps: "8-10 reps" },
        { sets: 1, reps: "6-8 reps" },
      ]},
      { order: 2, orderLabel: "2", name: "Pull-Up (Bodyweight)", setGroups: [{ sets: 3, reps: "6-8 reps" }, { sets: 1, reps: "8-12 reps" }] },
      { order: 3, orderLabel: "3", name: "Power Shrug", setGroups: [{ sets: 3, reps: "8-12 reps" }] },
      { order: 4, orderLabel: "4", name: "Standing Pullover (Cable)", setGroups: [{ sets: 3, reps: "10-12 reps" }] },
      { order: 5, orderLabel: "5A", name: "Rear Delt Fly (Cable)", setGroups: [{ sets: 2, reps: "10-15 reps" }] },
      { order: 6, orderLabel: "5B", name: "Incline Curl (Dumbbell)", setGroups: [{ sets: 2, reps: "8-10 reps" }] },
      { order: 7, orderLabel: "6", name: "Cardio", setGroups: [{ sets: 1, reps: "15-20 mins" }] },
    ];
  } else {
    // Weeks 9-12
    exercises = [
      { order: 1, orderLabel: "1", name: "Single Arm Row (Cable)", setGroups: [{ sets: 4, reps: "6-10 reps" }] },
      { order: 2, orderLabel: "2", name: "Pull-Up (Bodyweight)", setGroups: [{ sets: 3, reps: "4-6 reps" }, { sets: 1, reps: "8-12 reps" }] },
      { order: 3, orderLabel: "3", name: "Power Shrug", setGroups: [{ sets: 3, reps: "8-12 reps" }] },
      { order: 4, orderLabel: "4", name: "Standing Pullover (Cable)", setGroups: [{ sets: 3, reps: "8-10 reps" }] },
      { order: 5, orderLabel: "5A", name: "Rear Delt Fly (Cable)", setGroups: [{ sets: 2, reps: "10-15 reps" }] },
      { order: 6, orderLabel: "5B", name: "Incline Curl (Dumbbell)", setGroups: [{ sets: 2, reps: "8-10 reps" }] },
      { order: 7, orderLabel: "6", name: "Cardio", setGroups: [{ sets: 1, reps: "15-20 mins" }] },
    ];
  }

  return { dayNumber: 1, title: "Pull", exercises };
}

// ------- DAY 2: PUSH -------
function buildDay2Push(week: number): ProgramDay {
  let exercises: ProgramExercise[];

  if (week <= 4) {
    exercises = [
      { order: 1, orderLabel: "1", name: "Face Pull", setGroups: [{ sets: 3, reps: "10-15 reps" }] },
      { order: 2, orderLabel: "2", name: "Dip (Weighted)", setGroups: [{ sets: 2, reps: "8-12 reps" }] },
      { order: 3, orderLabel: "3", name: "AD Press", setGroups: [{ sets: 3, reps: "8-12 reps" }] },
      { order: 4, orderLabel: "4A", name: "Lu Raise", setGroups: [{ sets: 2, reps: "10-15 reps" }] },
      { order: 5, orderLabel: "4B", name: "Cable Crossover", setGroups: [{ sets: 2, reps: "10-15 reps" }] },
      { order: 6, orderLabel: "4C", name: "Overhead Tricep Extension (Cable)", setGroups: [{ sets: 2, reps: "10-15 reps" }] },
    ];
  } else if (week <= 8) {
    exercises = [
      { order: 1, orderLabel: "1", name: "Face Pull", setGroups: [{ sets: 3, reps: "10-15 reps" }] },
      { order: 2, orderLabel: "2", name: "Dip (Weighted)", setGroups: [{ sets: 2, reps: "8-12 reps" }] },
      { order: 3, orderLabel: "3", name: "AD Press", setGroups: [{ sets: 1, reps: "6-8 reps" }, { sets: 2, reps: "8-12 reps" }] },
      { order: 4, orderLabel: "4A", name: "Lu Raise", setGroups: [{ sets: 2, reps: "10-15 reps" }] },
      { order: 5, orderLabel: "4B", name: "Cable Crossover", setGroups: [{ sets: 2, reps: "10-15 reps" }] },
      { order: 6, orderLabel: "4C", name: "Overhead Tricep Extension (Cable)", setGroups: [{ sets: 2, reps: "10-15 reps" }] },
    ];
  } else {
    exercises = [
      { order: 1, orderLabel: "1", name: "Face Pull", setGroups: [{ sets: 3, reps: "10-15 reps" }] },
      { order: 2, orderLabel: "2", name: "Dip (Weighted)", setGroups: [{ sets: 2, reps: "8-12 reps" }] },
      { order: 3, orderLabel: "3", name: "AD Press", setGroups: [{ sets: 1, reps: "4-6 reps" }, { sets: 2, reps: "8-12 reps" }] },
      { order: 4, orderLabel: "4A", name: "Lu Raise", setGroups: [{ sets: 2, reps: "10-15 reps" }] },
      { order: 5, orderLabel: "4B", name: "Cable Crossover", setGroups: [{ sets: 2, reps: "10-15 reps" }] },
      { order: 6, orderLabel: "4C", name: "Overhead Tricep Extension (Cable)", setGroups: [{ sets: 2, reps: "10-15 reps" }] },
    ];
  }

  return { dayNumber: 2, title: "Push", exercises };
}

// ------- DAY 3: LEGS / DENSITY -------
function buildDay3LegsDensity(week: number): ProgramDay {
  let exercises: ProgramExercise[];

  if (week <= 4) {
    exercises = [
      { order: 1, orderLabel: "1", name: "Squat (Barbell)", setGroups: [{ sets: 3, reps: "6-8 reps" }] },
      { order: 2, orderLabel: "2", name: "Romanian Deadlift (Barbell)", setGroups: [{ sets: 1, reps: "6-8 reps" }, { sets: 1, reps: "10-15 reps" }] },
      { order: 3, orderLabel: "3", name: "Walking Lunge (Dumbbell)", setGroups: [{ sets: 2, reps: "20 reps" }] },
      { order: 4, orderLabel: "4", name: "Single Arm Row (Dumbbell)", setGroups: [{ sets: 1, reps: "8-10 reps" }, { sets: 1, reps: "10-15 reps" }] },
      { order: 5, orderLabel: "5", name: "Cable Crunch", setGroups: [{ sets: 1, reps: "1+ reps" }] },
      { order: 6, orderLabel: "6", name: "Neck Curl", setGroups: [{ sets: 1, reps: "1+ reps" }] },
    ];
  } else {
    // Weeks 5-12 same structure
    exercises = [
      { order: 1, orderLabel: "1", name: "Squat (Barbell)", setGroups: [{ sets: 3, reps: "6-8 reps" }] },
      { order: 2, orderLabel: "2", name: "Romanian Deadlift (Barbell)", setGroups: [{ sets: 1, reps: "6-8 reps" }, { sets: 1, reps: "10-15 reps" }] },
      { order: 3, orderLabel: "3", name: "Walking Lunge (Dumbbell)", setGroups: [{ sets: 2, reps: "20 reps" }] },
      { order: 4, orderLabel: "4", name: "Single Arm Row (Dumbbell)", setGroups: [{ sets: 1, reps: "8-10 reps" }, { sets: 1, reps: "10-15 reps" }] },
      { order: 5, orderLabel: "5", name: "Cable Crunch", setGroups: [{ sets: 1, reps: "1+ reps" }] },
      { order: 6, orderLabel: "6", name: "Neck Curl", setGroups: [{ sets: 1, reps: "1+ reps" }] },
    ];
  }

  return { dayNumber: 3, title: "Legs / Density", exercises };
}

// ------- DAY 4: PULL -------
function buildDay4Pull(week: number): ProgramDay {
  let exercises: ProgramExercise[];

  if (week <= 4) {
    exercises = [
      { order: 1, orderLabel: "1", name: "Pull-Up (Neutral Grip, Bodyweight)", setGroups: [{ sets: 3, reps: "8-12 reps" }] },
      { order: 2, orderLabel: "2", name: "Bent Over Row (Barbell)", setGroups: [{ sets: 3, reps: "8-12 reps" }] },
      { order: 3, orderLabel: "3A", name: "Partial Lateral Raise (Cable)", setGroups: [{ sets: 3, reps: "8-15 reps" }] },
      { order: 4, orderLabel: "3B", name: "Hammer Curl (Cable)", setGroups: [{ sets: 3, reps: "8-12 reps" }] },
      { order: 5, orderLabel: "4", name: "Farmer's Walk (Weighted)", setGroups: [{ sets: 2, reps: "1+ reps" }] },
      { order: 6, orderLabel: "5", name: "Cardio", setGroups: [{ sets: 1, reps: "10-15 mins" }] },
    ];
  } else if (week <= 8) {
    exercises = [
      { order: 1, orderLabel: "1", name: "Pull-Up (Neutral Grip, Bodyweight)", setGroups: [{ sets: 3, reps: "6-8 reps" }] },
      { order: 2, orderLabel: "2", name: "Bent Over Row (Barbell)", setGroups: [{ sets: 3, reps: "8-12 reps" }] },
      { order: 3, orderLabel: "3A", name: "Partial Lateral Raise (Cable)", setGroups: [{ sets: 3, reps: "8-15 reps" }] },
      { order: 4, orderLabel: "3B", name: "Hammer Curl (Cable)", setGroups: [{ sets: 3, reps: "8-12 reps" }] },
      { order: 5, orderLabel: "4", name: "Farmer's Walk (Weighted)", setGroups: [{ sets: 2, reps: "1+ reps" }] },
      { order: 6, orderLabel: "5", name: "Cardio", setGroups: [{ sets: 1, reps: "10-15 mins" }] },
    ];
  } else {
    exercises = [
      { order: 1, orderLabel: "1", name: "Pull-Up (Neutral Grip, Bodyweight)", setGroups: [{ sets: 3, reps: "4-6 reps" }] },
      { order: 2, orderLabel: "2", name: "Bent Over Row (Barbell)", setGroups: [{ sets: 3, reps: "8-12 reps" }] },
      { order: 3, orderLabel: "3A", name: "Partial Lateral Raise (Cable)", setGroups: [{ sets: 3, reps: "8-15 reps" }] },
      { order: 4, orderLabel: "3B", name: "Hammer Curl (Cable)", setGroups: [{ sets: 3, reps: "8-12 reps" }] },
      { order: 5, orderLabel: "4", name: "Farmer's Walk (Weighted)", setGroups: [{ sets: 2, reps: "1+ reps" }] },
      { order: 6, orderLabel: "5", name: "Cardio", setGroups: [{ sets: 1, reps: "10-15 mins" }] },
    ];
  }

  return { dayNumber: 4, title: "Pull", exercises };
}

// ------- DAY 5: PUSH -------
function buildDay5Push(week: number): ProgramDay {
  let exercises: ProgramExercise[];

  if (week <= 4) {
    exercises = [
      { order: 1, orderLabel: "1", name: "Face Pull", setGroups: [{ sets: 3, reps: "10-15 reps" }] },
      { order: 2, orderLabel: "2", name: "Incline Bench Press (Dumbbell)", setGroups: [{ sets: 1, reps: "6-8 reps" }, { sets: 2, reps: "8-10 reps" }] },
      { order: 3, orderLabel: "3", name: "Seated Shoulder Press (Dumbbell)", setGroups: [{ sets: 1, reps: "6-8 reps" }, { sets: 2, reps: "8-10 reps" }] },
      { order: 4, orderLabel: "4", name: "Overhead Tricep Extension (Cable)", setGroups: [{ sets: 1, reps: "8-10 reps" }, { sets: 1, reps: "12-15 reps" }] },
      { order: 5, orderLabel: "5", name: "Lateral Raise (Cable)", setGroups: [{ sets: 3, reps: "8-12 reps" }] },
      { order: 6, orderLabel: "6", name: "Neck Curl", setGroups: [{ sets: 1, reps: "1+ reps" }] },
    ];
  } else if (week <= 8) {
    exercises = [
      { order: 1, orderLabel: "1", name: "Face Pull", setGroups: [{ sets: 3, reps: "10-15 reps" }] },
      { order: 2, orderLabel: "2", name: "Incline Bench Press (Dumbbell)", setGroups: [{ sets: 1, reps: "6-8 reps" }, { sets: 2, reps: "8-10 reps" }] },
      { order: 3, orderLabel: "3", name: "Seated Shoulder Press (Dumbbell)", setGroups: [{ sets: 1, reps: "6-8 reps" }, { sets: 2, reps: "8-10 reps" }] },
      { order: 4, orderLabel: "4", name: "Overhead Tricep Extension (Cable)", setGroups: [{ sets: 1, reps: "8-10 reps" }, { sets: 1, reps: "12-15 reps" }] },
      { order: 5, orderLabel: "5", name: "Lateral Raise (Cable)", setGroups: [{ sets: 3, reps: "8-12 reps" }] },
      { order: 6, orderLabel: "6", name: "Neck Curl", setGroups: [{ sets: 1, reps: "1+ reps" }] },
    ];
  } else {
    exercises = [
      { order: 1, orderLabel: "1", name: "Face Pull", setGroups: [{ sets: 3, reps: "10-15 reps" }] },
      { order: 2, orderLabel: "2", name: "Incline Bench Press (Dumbbell)", setGroups: [{ sets: 1, reps: "4-6 reps" }, { sets: 1, reps: "6-8 reps" }, { sets: 1, reps: "8-10 reps" }] },
      { order: 3, orderLabel: "3", name: "Seated Shoulder Press (Dumbbell)", setGroups: [{ sets: 1, reps: "4-6 reps" }, { sets: 1, reps: "6-8 reps" }, { sets: 1, reps: "8-10 reps" }] },
      { order: 4, orderLabel: "4", name: "Overhead Tricep Extension (Cable)", setGroups: [{ sets: 1, reps: "8-10 reps" }, { sets: 1, reps: "12-15 reps" }] },
      { order: 5, orderLabel: "5", name: "Lateral Raise (Cable)", setGroups: [{ sets: 3, reps: "8-12 reps" }] },
      { order: 6, orderLabel: "6", name: "Neck Curl", setGroups: [{ sets: 1, reps: "1+ reps" }] },
    ];
  }

  return { dayNumber: 5, title: "Push", exercises };
}
```

**Step 2: Verify it compiles**

Run: `cd /c/projects/"workout app"/web && npx tsc --noEmit --pretty 2>&1 | head -20`
Expected: No errors related to program-data.ts

**Step 3: Commit**

```bash
git add web/src/lib/program-data.ts
git commit -m "feat: add complete 12-week Mass Impact program data"
```

---

### Task 2: Create localStorage workout store

**Files:**
- Create: `web/src/lib/workout-store.ts`

**Context:** This module persists all workout state to localStorage so nothing is lost on reload. It stores: current week/day selection, logged sets per exercise, workout session timestamps, and user preferences (which user is active).

**Step 1: Create the workout store**

```typescript
// web/src/lib/workout-store.ts

export type LoggedSet = {
  exerciseName: string;
  setIndex: number;
  weight: number;
  reps: number;
  rpe?: number;
  timestamp: number;
};

export type WorkoutSession = {
  id: string; // "w7-d3-1708300000000"
  weekNumber: number;
  dayNumber: number;
  startedAt: number;
  completedAt?: number;
  sets: LoggedSet[];
};

export type UserPrefs = {
  currentWeek: number;
  currentDay: number;
  activeUser: "his" | "hers";
};

const KEYS = {
  PREFS: "mi_prefs",
  SESSIONS: "mi_sessions",
  ACTIVE_SESSION: "mi_active_session",
} as const;

function read<T>(key: string, fallback: T): T {
  if (typeof window === "undefined") return fallback;
  try {
    const raw = localStorage.getItem(key);
    return raw ? JSON.parse(raw) : fallback;
  } catch {
    return fallback;
  }
}

function write(key: string, value: unknown): void {
  if (typeof window === "undefined") return;
  localStorage.setItem(key, JSON.stringify(value));
}

// --- User Preferences ---

export function getPrefs(): UserPrefs {
  return read<UserPrefs>(KEYS.PREFS, { currentWeek: 1, currentDay: 1, activeUser: "his" });
}

export function savePrefs(prefs: Partial<UserPrefs>): UserPrefs {
  const current = getPrefs();
  const updated = { ...current, ...prefs };
  write(KEYS.PREFS, updated);
  return updated;
}

// --- Active Session ---

export function getActiveSession(): WorkoutSession | null {
  return read<WorkoutSession | null>(KEYS.ACTIVE_SESSION, null);
}

export function startSession(weekNumber: number, dayNumber: number): WorkoutSession {
  const session: WorkoutSession = {
    id: `w${weekNumber}-d${dayNumber}-${Date.now()}`,
    weekNumber,
    dayNumber,
    startedAt: Date.now(),
    sets: [],
  };
  write(KEYS.ACTIVE_SESSION, session);
  return session;
}

export function logSet(set: LoggedSet): WorkoutSession | null {
  const session = getActiveSession();
  if (!session) return null;
  session.sets.push(set);
  write(KEYS.ACTIVE_SESSION, session);
  return session;
}

export function completeSession(): WorkoutSession | null {
  const session = getActiveSession();
  if (!session) return null;
  session.completedAt = Date.now();

  // Move to completed sessions list
  const sessions = getAllSessions();
  sessions.push(session);
  write(KEYS.SESSIONS, sessions);

  // Clear active
  localStorage.removeItem(KEYS.ACTIVE_SESSION);
  return session;
}

export function clearActiveSession(): void {
  localStorage.removeItem(KEYS.ACTIVE_SESSION);
}

// --- Session History ---

export function getAllSessions(): WorkoutSession[] {
  return read<WorkoutSession[]>(KEYS.SESSIONS, []);
}

export function getSessionsForWeekDay(weekNumber: number, dayNumber: number): WorkoutSession[] {
  return getAllSessions().filter(s => s.weekNumber === weekNumber && s.dayNumber === dayNumber);
}

// --- Exercise History ---

export function getLastPerformance(exerciseName: string): LoggedSet | undefined {
  const sessions = getAllSessions();
  // Search from most recent session backward
  for (let i = sessions.length - 1; i >= 0; i--) {
    const sets = sessions[i].sets.filter(s => s.exerciseName === exerciseName);
    if (sets.length > 0) {
      // Return the heaviest set
      return sets.reduce((best, s) => (s.weight > best.weight ? s : best), sets[0]);
    }
  }
  return undefined;
}

// Get all logged sets for an exercise across all sessions (for progress tracking)
export function getExerciseHistory(exerciseName: string): { date: number; bestSet: LoggedSet }[] {
  const sessions = getAllSessions();
  const history: { date: number; bestSet: LoggedSet }[] = [];

  for (const session of sessions) {
    const sets = session.sets.filter(s => s.exerciseName === exerciseName);
    if (sets.length > 0) {
      const best = sets.reduce((b, s) => (s.weight * s.reps > b.weight * b.reps ? s : b), sets[0]);
      history.push({ date: session.startedAt, bestSet: best });
    }
  }

  return history;
}

// Get total volume (sets completed) per week for progress charts
export function getWeeklyVolume(): { week: number; totalSets: number }[] {
  const sessions = getAllSessions();
  const weekMap = new Map<number, number>();

  for (const session of sessions) {
    const current = weekMap.get(session.weekNumber) || 0;
    weekMap.set(session.weekNumber, current + session.sets.length);
  }

  return Array.from(weekMap.entries())
    .map(([week, totalSets]) => ({ week, totalSets }))
    .sort((a, b) => a.week - b.week);
}

// Get completed day numbers for a given week
export function getCompletedDays(weekNumber: number): number[] {
  return getAllSessions()
    .filter(s => s.weekNumber === weekNumber && s.completedAt)
    .map(s => s.dayNumber);
}
```

**Step 2: Verify it compiles**

Run: `cd /c/projects/"workout app"/web && npx tsc --noEmit --pretty 2>&1 | head -20`
Expected: No errors

**Step 3: Commit**

```bash
git add web/src/lib/workout-store.ts
git commit -m "feat: add localStorage workout store for persistence"
```

---

## Phase 2: Today Screen - Full Rewrite

### Task 3: Rewrite TodayScreen to use real program data + persistence

**Files:**
- Modify: `web/src/components/screens/today-screen.tsx`
- Modify: `web/src/components/exercise-queue-card.tsx` (add orderLabel prop)

**Context:** The Today screen currently uses 3 hardcoded fake exercises. Rewrite it to:
1. Read current week/day from the store
2. Load the correct exercises for that day from program-data
3. Show the real exercise names, sets, reps from the program
4. Persist logged sets to localStorage via workout-store
5. Show last performance from history
6. Allow week/day navigation (prev/next buttons)
7. Restore in-progress session on page reload

**Step 1: Update ExerciseQueueCard to show order label**

Add an `orderLabel` prop to `ExerciseQueueCard` so it can display "1", "3A", "3B" etc. next to exercise names. This matches the Boostcamp program layout which uses superset numbering.

In `exercise-queue-card.tsx`, add `orderLabel: string` to props and render it as a small monospace badge before the exercise name.

**Step 2: Rewrite TodayScreen**

Replace the entire component. Key changes:
- Import `getDayForWeek`, `formatScheme`, `getTotalSets`, `getDefaultRestSeconds` from program-data
- Import store functions: `getPrefs`, `savePrefs`, `getActiveSession`, `startSession`, `logSet`, `completeSession`, `getLastPerformance`
- `useState` for `weekNumber` and `dayNumber` initialized from `getPrefs()`
- `useMemo` to derive current day's exercises from program data
- Build the exercise list from `ProgramDay.exercises` mapped to the existing `ExerciseItem` type
- On "Save Set", call `logSet()` to persist
- On "Start Workout", call `startSession()`
- On workout complete, call `completeSession()`
- On mount, check `getActiveSession()` to restore in-progress workout
- Add week/day selector: two small `<` `>` buttons next to the day label to navigate
- Show real "Last: X x Y" from `getLastPerformance(exerciseName)`

**Step 3: Add week/day navigation UI**

Add a small navigation row above the exercise queue:
```
< Week 7 - Day 3 | Pull >
```
Left/right arrows cycle through days 1-5, and wrap to next/prev week. The selected week/day is saved to prefs via `savePrefs()`.

**Step 4: Verify the app runs**

Run: `cd /c/projects/"workout app"/web && npm run dev`
Navigate to localhost:3000 and verify:
- Real exercises show for the selected day
- Can navigate between days/weeks
- Can start workout, log sets, see them persist
- Timer still works
- Page reload restores session

**Step 5: Commit**

```bash
git add web/src/components/screens/today-screen.tsx web/src/components/exercise-queue-card.tsx
git commit -m "feat: rewrite Today screen with real program data and persistence"
```

---

### Task 4: Make the rest timer dial clickable to start/pause

**Files:**
- Modify: `web/src/components/rest-timer-dial.tsx`
- Modify: `web/src/components/screens/today-screen.tsx`

**Context:** User wants to be able to click the timer dial itself to start/stop it, not just rely on the small buttons below. The big circle should be a tap target.

**Step 1: Make the dial clickable**

Add an `onToggle` callback prop to `RestTimerDial`. When the dial circle is clicked:
- If idle → start timer with default rest target
- If running → pause/stop timer
- If target reached → reset to idle

Style the dial with `cursor: pointer` and a subtle hover effect.

**Step 2: Wire it up in TodayScreen**

Pass an `onToggle` handler that calls `startTimer` or `stopTimer` based on current state.

**Step 3: Verify**

Click the timer circle - it should start counting down. Click again to stop. Visual feedback on hover.

**Step 4: Commit**

```bash
git add web/src/components/rest-timer-dial.tsx web/src/components/screens/today-screen.tsx
git commit -m "feat: make rest timer dial clickable to start/stop"
```

---

## Phase 3: Templates Screen - Browse Real Program

### Task 5: Rewrite Templates screen to browse real program data

**Files:**
- Modify: `web/src/components/screens/templates-screen.tsx`
- Modify: `web/src/components/template-exercise-editor.tsx`

**Context:** Templates screen currently shows 8 hardcoded week names and 4 fake exercises. Rewrite to:
1. Show all 12 weeks from `MASS_IMPACT_PROGRAM`
2. Click a week to see its 5 days
3. Click a day to see its exercises with real sets/reps
4. Click an exercise to see its details in the editor panel
5. Keep the coach mode lock/unlock (it works already)

**Step 1: Rewrite TemplatesScreen with interactive tree navigation**

Add state:
- `selectedWeek: number | null`
- `selectedDay: number | null`
- `selectedExerciseIndex: number | null`

When a week is clicked, show its days. When a day is clicked, show its exercises. When an exercise is clicked, populate the editor.

The week list shows all 12 weeks. Clicking one highlights it and shows the 5 days below. Clicking a day shows the exercise list. Clicking an exercise fills the editor panel with that exercise's data (name, sets, reps, rest target, notes).

**Step 2: Update TemplateExerciseEditor to accept dynamic data**

Currently hardcoded to "Incline Dumbbell Press". Change it to accept props:
- `exerciseName: string`
- `setGroups: ExerciseSet[]`
- `restSeconds: number`
- `canEdit: boolean`

Display the actual exercise data. For now, editing is display-only (fields disabled unless `canEdit`), but the data shown is real.

**Step 3: Verify**

Navigate to Templates. Click Week 1 → Day 1 - Pull → Single Arm Row → see its data in editor. Switch weeks and see exercises change.

**Step 4: Commit**

```bash
git add web/src/components/screens/templates-screen.tsx web/src/components/template-exercise-editor.tsx
git commit -m "feat: rewrite Templates to browse real program with interactive tree"
```

---

## Phase 4: Planner Screen - Show Real Schedule

### Task 6: Rewrite Planner screen with real week data and clickable days

**Files:**
- Modify: `web/src/components/screens/planner-screen.tsx`

**Context:** Planner currently shows a hardcoded 7-day week with fake statuses. Rewrite to:
1. Show the current week (from prefs) with 5 workout days + 2 rest days
2. Each day tile shows the real workout title from program data (Pull, Push, Legs/Density, Pull, Push)
3. Status comes from workout-store: "done" if there's a completed session, "planned" if not yet, "rest" for off-days
4. Clicking a day navigates to Today screen for that day (updates prefs and routes)
5. Week navigation arrows to browse different weeks
6. Rest days (Sat/Sun by default) shown as rest tiles

**Step 1: Rewrite PlannerScreen**

Add state for `currentWeek` from prefs. Map Mon-Fri to days 1-5 of the program, Sat-Sun as rest days.

Use `getCompletedDays(weekNumber)` to mark days as done vs planned.

Clicking a workout day calls `savePrefs({ currentWeek, currentDay: dayNumber })` and uses Next.js `router.push("/today")` to navigate.

Add `<` `>` arrows to cycle through weeks 1-12.

**Step 2: Verify**

Navigate to Planner. See 7 day tiles with real workout names. Completed days show green "Done". Click a planned day → goes to Today with correct exercises loaded.

**Step 3: Commit**

```bash
git add web/src/components/screens/planner-screen.tsx
git commit -m "feat: rewrite Planner with real schedule and clickable day navigation"
```

---

## Phase 5: Progress Screen - Show Real Data

### Task 7: Rewrite Progress screen with data from workout history

**Files:**
- Modify: `web/src/components/screens/progress-screen.tsx`

**Context:** Progress screen shows hardcoded trend data. Replace with real data from `workout-store` history. When there's no history yet, show empty states with helpful messages instead of fake numbers.

**Step 1: Rewrite ProgressScreen**

- Use `getWeeklyVolume()` for the volume trend chart
- Use `getExerciseHistory("Squat (Barbell)")` and similar for strength trend charts
- Use `getCompletedDays()` across all weeks to build the consistency heatmap
- PR board: scan all sessions for top sets per exercise, show the best ones
- If no data exists yet, show "Complete some workouts to see your progress here" empty states

The trend charts should still use `TrendChartCard` - just feed real data arrays instead of hardcoded ones. If arrays are empty, show a placeholder.

**Step 2: Verify**

With no workout history: see empty state messages. Log a few sets on Today, complete workout. Come back to Progress - see real data in charts.

**Step 3: Commit**

```bash
git add web/src/components/screens/progress-screen.tsx
git commit -m "feat: rewrite Progress to use real workout history data"
```

---

## Phase 6: Settings & Polish

### Task 8: Wire up Settings screen basics

**Files:**
- Modify: `web/src/components/screens/settings-screen.tsx`

**Context:** Settings has 3 non-functional buttons and hardcoded sync data. Make them functional:

**Step 1: Implement functional settings**

1. **"Check Install" button**: Use the `beforeinstallprompt` event to trigger PWA install, or show "Already installed" / "Not supported" status.

2. **"Export Snapshot" button**: Call `getAllSessions()` and `getPrefs()`, serialize to JSON, trigger a file download as `mass-impact-backup-YYYY-MM-DD.json`.

3. **"Enable Alerts" button**: Request notification permission via `Notification.requestPermission()`. Show current permission status.

4. **Sync monitor**: Show real stats from localStorage - count of sets in active session, last completed session timestamp.

5. **Add "Clear All Data" danger button**: With confirmation dialog, clears all localStorage keys. For recovery from bad state.

6. **Add "Import Backup" button**: Accept a JSON file and restore sessions/prefs from it.

**Step 2: Verify**

- Export button downloads a JSON file with real data
- Clear data wipes localStorage and resets app
- Alert button requests notification permission

**Step 3: Commit**

```bash
git add web/src/components/screens/settings-screen.tsx
git commit -m "feat: wire up Settings with export, install, alerts, and data management"
```

---

### Task 9: Update app shell sidebar with real cycle info

**Files:**
- Modify: `web/src/components/app-shell.tsx`

**Context:** Sidebar shows hardcoded "Terence + Cheril", "Shared cycle: Week 7 active". Make it dynamic.

**Step 1: Read from prefs and show real week**

Use `getPrefs()` to show "Week X active" with the real current week number. Keep the user names as-is (those are correct for this household).

**Step 2: Commit**

```bash
git add web/src/components/app-shell.tsx
git commit -m "feat: show real current week in sidebar from prefs"
```

---

### Task 10: Final build verification and cleanup

**Files:**
- All modified files

**Step 1: Run full build**

Run: `cd /c/projects/"workout app"/web && npm run build`
Expected: Build succeeds with no errors

**Step 2: Run the app and smoke test all screens**

Run: `npm run dev`

Verify each screen:
- Today: Real exercises load, can navigate weeks/days, set logging works and persists, timer is clickable, session restores on reload
- Planner: Shows real workout schedule, completed days marked, clicking a day goes to Today
- Progress: Shows real data from logged workouts (or empty states)
- Templates: Can browse all 12 weeks, 5 days, see real exercises and details
- Settings: Export works, alert permission works, clear data works

**Step 3: Commit any fixes**

```bash
git add -A
git commit -m "fix: address build errors and polish from smoke testing"
```

---

Plan complete and saved to `docs/plans/2026-02-19-make-app-functional.md`. Two execution options:

**1. Subagent-Driven (this session)** - I dispatch fresh subagent per task, review between tasks, fast iteration

**2. Parallel Session (separate)** - Open new session with executing-plans, batch execution with checkpoints

Which approach?
