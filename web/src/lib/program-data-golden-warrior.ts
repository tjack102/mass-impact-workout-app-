// Golden Warrior -- Bald Omni-Man's Adaptive Hypertrophy (12 weeks, 5-day Plan A)
// 3 phases of 4 weeks. Compound rep targets change per phase (12→8→5).
// Accessories keep their rep ranges throughout.
// Exercise names must match exercise-library.ts exactly for volume tracking.

import type { ProgramExercise } from "./program-data";
import { getDefaultRestSeconds } from "./program-data";

// ─────────────────────────────────────────────
// Phase helpers
// ─────────────────────────────────────────────

/** Returns 0-based phase index and 0-based week within phase */
function getPhase(weekNumber: number): number {
  if (weekNumber <= 4) return 0;
  if (weekNumber <= 8) return 1;
  return 2;
}

// ─────────────────────────────────────────────
// Exercise definition types
// ─────────────────────────────────────────────

// [sets, reps] per phase
type PhaseReps = [sets: number, reps: string];

interface GWExercise {
  orderLabel: string;
  name: string;
  /** [Phase 1, Phase 2, Phase 3] -- sets and reps per phase */
  phases: [PhaseReps, PhaseReps, PhaseReps];
  supersetGroup?: string;
  notes?: string;
}

interface GWDay {
  title: string;
  exercises: GWExercise[];
}

// ─────────────────────────────────────────────
// Day definitions
// ─────────────────────────────────────────────

const DAYS: GWDay[] = [
  // DAY 1: Upper Body 1
  {
    title: "Upper 1",
    exercises: [
      {
        orderLabel: "1",
        name: "Close Grip Bench Press",
        phases: [[3, "12"], [3, "8"], [3, "5"]],
        notes: "1 top set + 2 back-off sets at 12-20% less load",
      },
      {
        orderLabel: "2",
        name: "Lateral Raise (Dumbbell)",
        phases: [[3, "12-15"], [3, "12-15"], [3, "12-15"]],
        notes: "1 top set then 2 drop sets, no rest between drops",
      },
      {
        orderLabel: "3",
        name: "Bicep Curl (Barbell)",
        phases: [[3, "12"], [3, "8"], [3, "5"]],
        notes: "1 top set + 2 back-off sets at 12-20% less",
      },
      {
        orderLabel: "4",
        name: "Hammer Curl",
        phases: [[2, "8-12"], [2, "8-12"], [2, "8-12"]],
        notes: "Optional brachialis work",
      },
      {
        orderLabel: "5",
        name: "Tricep Pushdown",
        phases: [[3, "15"], [3, "12"], [3, "10"]],
        notes: "1 top set + 2 back-off sets at 12-20% less",
      },
      {
        orderLabel: "6",
        name: "Pull-Up (Bodyweight)",
        phases: [[3, "10-15"], [3, "10-15"], [3, "10-15"]],
      },
      {
        orderLabel: "7",
        name: "Hanging Leg Raise",
        phases: [[3, "12-20"], [3, "12-20"], [3, "12-20"]],
      },
    ],
  },

  // DAY 2: Back + Legs
  {
    title: "Back + Legs",
    exercises: [
      {
        orderLabel: "1",
        name: "Platz Squat",
        phases: [[3, "5-12"], [3, "5-12"], [3, "5-12"]],
        notes: "Pyramid: top set 5-8, then -10-15lbs for 8-10, -10-15lbs more for 10-12",
      },
      {
        orderLabel: "2",
        name: "Sissy Squat",
        phases: [[2, "10-15"], [2, "10-15"], [2, "10-15"]],
        notes: "Optional. Cable-assisted recommended",
      },
      {
        orderLabel: "3A",
        name: "Seated Row (Cable)",
        phases: [[2, "8-12"], [2, "8-12"], [2, "8-12"]],
        supersetGroup: "ss-1",
      },
      {
        orderLabel: "3B",
        name: "Kelso Shrug",
        phases: [[2, "8-12"], [2, "8-12"], [2, "8-12"]],
        supersetGroup: "ss-1",
      },
      {
        orderLabel: "4",
        name: "Lat Prayer (Cable)",
        phases: [[2, "8-12"], [2, "8-12"], [2, "8-12"]],
        notes: "Optional extra back volume",
      },
      {
        orderLabel: "5",
        name: "Lying Leg Curl",
        phases: [[2, "10-15"], [2, "10-15"], [2, "10-15"]],
        notes: "Go single leg if maxing out the stack",
      },
      {
        orderLabel: "6",
        name: "Standing Calf Raise",
        phases: [[1, "AMRAP"], [1, "AMRAP"], [1, "AMRAP"]],
        notes: "3-4 sec pause at bottom, come up only halfway. Single set to failure",
      },
    ],
  },

  // DAY 3: Upper Body 2
  {
    title: "Upper 2",
    exercises: [
      {
        orderLabel: "1",
        name: "Flat Dumbbell Press",
        phases: [[3, "12"], [3, "8"], [3, "5"]],
        notes: "Full ROM, 3/4 reps (stop shy of lockout). ~80% of Day 1 load",
      },
      {
        orderLabel: "2",
        name: "Pull-Up (Neutral Grip, Bodyweight)",
        phases: [[3, "8-12"], [3, "8-12"], [3, "8-12"]],
        notes: "Add weight when hitting top of range",
      },
      {
        orderLabel: "3",
        name: "Spider Curl",
        phases: [[3, "10-15"], [3, "10-15"], [3, "10-15"]],
        notes: "Squeeze-biased curl (shortened ROM focus)",
      },
      {
        orderLabel: "4",
        name: "Preacher Curl (Dumbbell)",
        phases: [[2, "10-15"], [2, "10-15"], [2, "10-15"]],
        notes: "Optional stretch-biased curl",
      },
      {
        orderLabel: "5",
        name: "Incline Tricep Pressdown (Cable)",
        phases: [[3, "8-12"], [3, "8-12"], [3, "8-12"]],
        notes: "Bench at 60-70 degrees for stability",
      },
      {
        orderLabel: "6",
        name: "Hanging Oblique Knee Raise",
        phases: [[3, "10-15"], [3, "10-15"], [3, "10-15"]],
        notes: "3/4 ROM only",
      },
    ],
  },

  // DAY 4: Lower Body
  {
    title: "Lower",
    exercises: [
      {
        orderLabel: "1",
        name: "Platz Squat",
        phases: [[3, "5-12"], [3, "5-12"], [3, "5-12"]],
        notes: "Paused variant. 80-85% of Day 2 load. Same pyramid scheme",
      },
      {
        orderLabel: "2",
        name: "Machine Hip Adduction",
        phases: [[3, "10-12"], [3, "10-12"], [3, "10-12"]],
        notes: "Pause at stretched position. Stop when can't close legs 3/4 of the way",
      },
      {
        orderLabel: "3",
        name: "Sissy Squat",
        phases: [[2, "10-15"], [2, "10-15"], [2, "10-15"]],
        notes: "Optional. Beat the books from Day 2",
      },
      {
        orderLabel: "4",
        name: "Lateral Raise (Dumbbell)",
        phases: [[3, "12-15"], [3, "12-15"], [3, "12-15"]],
        notes: "Optional. Repeat Day 1 side delt work with drop sets",
      },
      {
        orderLabel: "5",
        name: "Seated Hamstring Curl",
        phases: [[2, "8-12"], [2, "8-12"], [2, "8-12"]],
        notes: "Lean forward to pre-stretch. 1-count pause at lengthened position",
      },
      {
        orderLabel: "6",
        name: "Standing Calf Raise",
        phases: [[1, "AMRAP"], [1, "AMRAP"], [1, "AMRAP"]],
        notes: "Same protocol as Day 2. Beat the reps",
      },
    ],
  },

  // DAY 5: Upper Body 3
  {
    title: "Upper 3",
    exercises: [
      {
        orderLabel: "1A",
        name: "Dip (Weighted)",
        phases: [[3, "AMRAP"], [3, "AMRAP"], [3, "AMRAP"]],
        supersetGroup: "ss-1",
        notes: "Forward lean, full depth. Add weight at 20 reps",
      },
      {
        orderLabel: "1B",
        name: "Chin-Up (Bodyweight)",
        phases: [[3, "AMRAP"], [3, "AMRAP"], [3, "AMRAP"]],
        supersetGroup: "ss-1",
        notes: "Pull to sternum. Add weight at 20 reps",
      },
      {
        orderLabel: "2A",
        name: "Incline Curl (Dumbbell)",
        phases: [[2, "10-15"], [2, "10-15"], [2, "10-15"]],
        supersetGroup: "ss-2",
        notes: "Keep it light, own the rep speed",
      },
      {
        orderLabel: "2B",
        name: "Dumbbell Skull Crusher",
        phases: [[2, "10-15"], [2, "10-15"], [2, "10-15"]],
        supersetGroup: "ss-2",
        notes: "Incline bench, light weight, full ROM",
      },
      {
        orderLabel: "3",
        name: "Rear Delt Fly (Dumbbell)",
        phases: [[2, "10-15"], [2, "10-15"], [2, "10-15"]],
        notes: "Optional. For those who need rear delt work despite pulls/rows",
      },
      {
        orderLabel: "4",
        name: "Cable Crunch",
        phases: [[3, "AMRAP"], [3, "AMRAP"], [3, "AMRAP"]],
        notes: "Add weight at 20 reps. Can giant set with calisthenics",
      },
    ],
  },
];

// ─────────────────────────────────────────────
// Public API (called from program-registry.ts)
// ─────────────────────────────────────────────

export function getGoldenWarriorExercisesForDay(
  dayNumber: number,
  weekNumber: number,
): ProgramExercise[] {
  const day = DAYS[dayNumber - 1];
  if (!day) return [];

  const phase = getPhase(weekNumber);

  return day.exercises.map((ex, i) => {
    const [sets, reps] = ex.phases[phase];
    return {
      order: i + 1,
      orderLabel: ex.orderLabel,
      name: ex.name,
      setGroups: [{ sets, reps }],
      restSeconds: getDefaultRestSeconds(ex.name),
      supersetGroup: ex.supersetGroup,
      notes: ex.notes,
    } satisfies ProgramExercise;
  });
}

export function getGoldenWarriorDayTitle(dayNumber: number): string {
  return DAYS[dayNumber - 1]?.title ?? `Day ${dayNumber}`;
}
