// Hers program data — 3 programs, 5-day templates each, auto-regulated (no fixed week count)
// Exercise names must EXACTLY match exercise-library.ts canonical names for volume tracking.

import type { ExerciseType } from "./types";

export interface HersExercise {
  orderLabel: string;
  name: string;
  sets: number;
  reps: string;
  type: ExerciseType;
  supersetGroup?: string;
}

export interface HersDayTemplate {
  dayNumber: number;
  title: string;
  exercises: HersExercise[];
}

export interface HersProgram {
  id: string;
  dayTemplates: HersDayTemplate[];
}

// ─────────────────────────────────────────────────────────────────────────────
// LULUL — Lower / Upper / Lower / Upper / Lower (Glute Emphasis)
// ─────────────────────────────────────────────────────────────────────────────
const HERS_LULUL: HersProgram = {
  id: "hers-lulul",
  dayTemplates: [
    // ─────────────────────────────────────────────
    // Day 1: Lower A — Glute + Hamstring
    // ─────────────────────────────────────────────
    {
      dayNumber: 1,
      title: "Lower A — Glute + Hamstring",
      exercises: [
        {
          orderLabel: "1",
          name: "Squat (Barbell)",
          sets: 3,
          reps: "6-10",
          type: "compound",
        },
        {
          orderLabel: "2",
          // "Romanian Deadlift" in spec; library canonical: "Romanian Deadlift (Barbell)"
          name: "Romanian Deadlift (Barbell)",
          sets: 3,
          reps: "8-12",
          type: "stretch",
        },
        {
          orderLabel: "3",
          name: "B-Stance Hip Thrust",
          sets: 3,
          reps: "10-15",
          type: "compound",
        },
        {
          orderLabel: "4",
          name: "Lying Leg Curl",
          sets: 3,
          reps: "10-15",
          type: "stretch",
        },
        {
          orderLabel: "5",
          name: "Cable Pull-Through",
          sets: 2,
          reps: "12-15",
          type: "stretch",
        },
        {
          orderLabel: "6",
          name: "Standing Calf Raise",
          sets: 3,
          reps: "10-15",
          type: "stretch",
        },
      ],
    },

    // ─────────────────────────────────────────────
    // Day 2: Upper A — Back + Shoulders
    // ─────────────────────────────────────────────
    {
      dayNumber: 2,
      title: "Upper A — Back + Shoulders",
      exercises: [
        {
          orderLabel: "1",
          name: "Lat Pulldown",
          sets: 3,
          reps: "8-12",
          type: "compound",
        },
        {
          orderLabel: "2",
          // "Seated Cable Row" in spec; library canonical: "Seated Row (Cable)"
          name: "Seated Row (Cable)",
          sets: 3,
          reps: "10-12",
          type: "compound",
        },
        {
          orderLabel: "3",
          // "Cable Lateral Raise" in spec; library canonical: "Lateral Raise (Cable)"
          name: "Lateral Raise (Cable)",
          sets: 3,
          reps: "12-15",
          type: "stretch",
        },
        {
          orderLabel: "4",
          // "Rear Delt Cable Fly" in spec; library canonical: "Rear Delt Fly (Cable)"
          name: "Rear Delt Fly (Cable)",
          sets: 3,
          reps: "12-15",
          type: "stretch",
        },
        {
          orderLabel: "5A",
          // "Incline DB Curl" in spec; library canonical: "Incline Curl (Dumbbell)"
          name: "Incline Curl (Dumbbell)",
          sets: 2,
          reps: "10-12",
          type: "stretch",
          supersetGroup: "1",
        },
        {
          orderLabel: "5B",
          // "Overhead Cable Tricep Extension" in spec; library canonical: "Overhead Tricep Extension (Cable)"
          name: "Overhead Tricep Extension (Cable)",
          sets: 2,
          reps: "10-12",
          type: "stretch",
          supersetGroup: "1",
        },
        {
          orderLabel: "6",
          name: "Face Pull",
          sets: 2,
          reps: "12-15",
          type: "compound",
        },
      ],
    },

    // ─────────────────────────────────────────────
    // Day 3: Lower B — Glute + Quad
    // ─────────────────────────────────────────────
    {
      dayNumber: 3,
      title: "Lower B — Glute + Quad",
      exercises: [
        {
          orderLabel: "1",
          name: "Bulgarian Split Squat",
          sets: 3,
          reps: "8-12",
          type: "stretch",
        },
        {
          orderLabel: "2",
          name: "Leg Press",
          sets: 3,
          reps: "10-15",
          type: "compound",
        },
        {
          orderLabel: "3",
          name: "Hip Thrust (Barbell)",
          sets: 3,
          reps: "8-12",
          type: "compound",
        },
        {
          orderLabel: "4",
          name: "Leg Extension",
          sets: 3,
          reps: "10-15",
          type: "stretch",
        },
        {
          orderLabel: "5",
          // "Seated Leg Curl" in spec; library canonical: "Seated Hamstring Curl"
          name: "Seated Hamstring Curl",
          sets: 3,
          reps: "10-15",
          type: "stretch",
        },
        {
          orderLabel: "6",
          name: "Seated Calf Raise",
          sets: 3,
          reps: "12-15",
          type: "stretch",
        },
      ],
    },

    // ─────────────────────────────────────────────
    // Day 4: Upper B — Shoulders + Arms
    // ─────────────────────────────────────────────
    {
      dayNumber: 4,
      title: "Upper B — Shoulders + Arms",
      exercises: [
        {
          orderLabel: "1",
          // "DB Shoulder Press" in spec; library canonical: "Seated Shoulder Press (Dumbbell)"
          name: "Seated Shoulder Press (Dumbbell)",
          sets: 3,
          reps: "8-12",
          type: "compound",
        },
        {
          orderLabel: "2",
          name: "Single Arm Cable Row",
          sets: 3,
          reps: "10-12",
          type: "compound",
        },
        {
          orderLabel: "3",
          name: "Lateral Raise (Cable)",
          sets: 2,
          reps: "12-15",
          type: "stretch",
        },
        {
          orderLabel: "4",
          name: "Rear Delt Fly (Cable)",
          sets: 2,
          reps: "12-15",
          type: "stretch",
        },
        {
          orderLabel: "5A",
          name: "Hammer Curl",
          sets: 2,
          reps: "10-12",
          type: "isolation",
          supersetGroup: "1",
        },
        {
          orderLabel: "5B",
          name: "Tricep Pushdown",
          sets: 2,
          reps: "10-12",
          type: "isolation",
          supersetGroup: "1",
        },
        {
          orderLabel: "6",
          name: "Cable Crunch",
          sets: 2,
          reps: "12-15",
          type: "compound",
        },
      ],
    },

    // ─────────────────────────────────────────────
    // Day 5: Lower C — Glute Pump + Accessories
    // ─────────────────────────────────────────────
    {
      dayNumber: 5,
      title: "Lower C — Glute Pump + Accessories",
      exercises: [
        {
          orderLabel: "1",
          // "Walking Lunge (DB)" in spec; library canonical: "Walking Lunge (Dumbbell)"
          name: "Walking Lunge (Dumbbell)",
          sets: 3,
          reps: "12-15",
          type: "compound",
        },
        {
          orderLabel: "2",
          // "Cable Kickback or Glute-Focused Back Extension" in spec; using "Cable Kickback"
          name: "Cable Kickback",
          sets: 3,
          reps: "12-15",
          type: "stretch",
        },
        {
          orderLabel: "3",
          name: "Step-Up (High Box)",
          sets: 2,
          reps: "10-12",
          type: "compound",
        },
        {
          orderLabel: "4",
          name: "Lying Leg Curl",
          sets: 2,
          reps: "10-15",
          type: "stretch",
        },
        {
          orderLabel: "5",
          name: "Standing Calf Raise",
          sets: 3,
          reps: "10-15",
          type: "stretch",
        },
      ],
    },
  ],
};

// ─────────────────────────────────────────────────────────────────────────────
// PPLPP — Pull / Push / Legs / Pull / Push
// ─────────────────────────────────────────────────────────────────────────────
const HERS_PPLPP: HersProgram = {
  id: "hers-pplpp",
  dayTemplates: [
    // ─────────────────────────────────────────────
    // Day 1: Pull A — Back + Rear Delts + Biceps
    // ─────────────────────────────────────────────
    {
      dayNumber: 1,
      title: "Pull A — Back + Rear Delts + Biceps",
      exercises: [
        {
          orderLabel: "1",
          name: "Lat Pulldown",
          sets: 3,
          reps: "8-12",
          type: "compound",
        },
        {
          orderLabel: "2",
          name: "Seated Row (Cable)",
          sets: 3,
          reps: "10-12",
          type: "compound",
        },
        {
          orderLabel: "3",
          name: "Rear Delt Fly (Cable)",
          sets: 3,
          reps: "12-15",
          type: "stretch",
        },
        {
          orderLabel: "4",
          name: "Face Pull",
          sets: 2,
          reps: "12-15",
          type: "compound",
        },
        {
          orderLabel: "5",
          name: "Incline Curl (Dumbbell)",
          sets: 2,
          reps: "10-12",
          type: "stretch",
        },
      ],
    },

    // ─────────────────────────────────────────────
    // Day 2: Push A — Shoulders + Chest + Triceps
    // ─────────────────────────────────────────────
    {
      dayNumber: 2,
      title: "Push A — Shoulders + Chest + Triceps",
      exercises: [
        {
          orderLabel: "1",
          name: "Seated Shoulder Press (Dumbbell)",
          sets: 3,
          reps: "8-12",
          type: "compound",
        },
        {
          orderLabel: "2",
          name: "Lateral Raise (Cable)",
          sets: 3,
          reps: "12-15",
          type: "stretch",
        },
        {
          orderLabel: "3",
          name: "Incline DB Fly",
          sets: 2,
          reps: "10-15",
          type: "stretch",
        },
        {
          orderLabel: "4",
          // "Lu Lateral Raise" in spec; library canonical: "Lu Raise"
          name: "Lu Raise",
          sets: 2,
          reps: "10-15",
          type: "stretch",
        },
        {
          orderLabel: "5",
          name: "Overhead Tricep Extension (Cable)",
          sets: 2,
          reps: "10-12",
          type: "stretch",
        },
      ],
    },

    // ─────────────────────────────────────────────
    // Day 3: Legs — Glute + Quad + Hamstring
    // ─────────────────────────────────────────────
    {
      dayNumber: 3,
      title: "Legs — Glute + Quad + Hamstring",
      exercises: [
        {
          orderLabel: "1",
          name: "Squat (Barbell)",
          sets: 3,
          reps: "6-10",
          type: "compound",
        },
        {
          orderLabel: "2",
          name: "Romanian Deadlift (Barbell)",
          sets: 3,
          reps: "8-12",
          type: "stretch",
        },
        {
          orderLabel: "3",
          name: "Bulgarian Split Squat",
          sets: 3,
          reps: "8-12",
          type: "stretch",
        },
        {
          orderLabel: "4",
          name: "Leg Extension",
          sets: 3,
          reps: "10-15",
          type: "stretch",
        },
        {
          orderLabel: "5",
          name: "Lying Leg Curl",
          sets: 3,
          reps: "10-15",
          type: "stretch",
        },
        {
          orderLabel: "6",
          name: "Standing Calf Raise",
          sets: 3,
          reps: "10-15",
          type: "stretch",
        },
      ],
    },

    // ─────────────────────────────────────────────
    // Day 4: Pull B — Back + Rear Delts + Biceps
    // ─────────────────────────────────────────────
    {
      dayNumber: 4,
      title: "Pull B — Back + Rear Delts + Biceps",
      exercises: [
        {
          orderLabel: "1",
          name: "Single Arm Cable Row",
          sets: 3,
          reps: "10-12",
          type: "compound",
        },
        {
          orderLabel: "2",
          // "Wide Overhand Pulldown" in spec; matches library exactly
          name: "Wide Overhand Pulldown",
          sets: 3,
          reps: "10-15",
          type: "compound",
        },
        {
          orderLabel: "3",
          name: "Rear Delt Fly (Cable)",
          sets: 2,
          reps: "12-15",
          type: "stretch",
        },
        {
          orderLabel: "4",
          name: "Cable Pullover",
          sets: 2,
          reps: "12-15",
          type: "stretch",
        },
        {
          orderLabel: "5A",
          name: "Hammer Curl",
          sets: 2,
          reps: "10-12",
          type: "isolation",
          supersetGroup: "1",
        },
        {
          orderLabel: "5B",
          name: "Cable Crunch",
          sets: 2,
          reps: "12-15",
          type: "compound",
          supersetGroup: "1",
        },
      ],
    },

    // ─────────────────────────────────────────────
    // Day 5: Push B — Shoulders + Chest + Triceps
    // ─────────────────────────────────────────────
    {
      dayNumber: 5,
      title: "Push B — Shoulders + Chest + Triceps",
      exercises: [
        {
          orderLabel: "1",
          name: "Lateral Raise (Cable)",
          sets: 3,
          reps: "12-15",
          type: "stretch",
        },
        {
          orderLabel: "2",
          name: "Seated Shoulder Press (Dumbbell)",
          sets: 2,
          reps: "8-12",
          type: "compound",
        },
        {
          orderLabel: "3",
          name: "Cable Crossover",
          sets: 2,
          reps: "10-15",
          type: "stretch",
        },
        {
          orderLabel: "4",
          name: "Rear Delt Fly (Cable)",
          sets: 2,
          reps: "12-15",
          type: "stretch",
        },
        {
          orderLabel: "5A",
          name: "Tricep Pushdown",
          sets: 2,
          reps: "10-12",
          type: "isolation",
          supersetGroup: "1",
        },
        {
          orderLabel: "5B",
          name: "Face Pull",
          sets: 2,
          reps: "12-15",
          type: "compound",
          supersetGroup: "1",
        },
      ],
    },
  ],
};

// ─────────────────────────────────────────────────────────────────────────────
// Custom Glute-Emphasis — Glute-focused 5-day split
// ─────────────────────────────────────────────────────────────────────────────
const HERS_CUSTOM: HersProgram = {
  id: "hers-custom",
  dayTemplates: [
    // ─────────────────────────────────────────────
    // Day 1: Glute + Ham
    // ─────────────────────────────────────────────
    {
      dayNumber: 1,
      title: "Glute + Ham",
      exercises: [
        {
          orderLabel: "1",
          name: "Squat (Barbell)",
          sets: 3,
          reps: "6-10",
          type: "compound",
        },
        {
          orderLabel: "2",
          name: "Romanian Deadlift (Barbell)",
          sets: 3,
          reps: "8-12",
          type: "stretch",
        },
        {
          orderLabel: "3",
          name: "B-Stance Hip Thrust",
          sets: 3,
          reps: "10-15",
          type: "compound",
        },
        {
          orderLabel: "4",
          name: "Lying Leg Curl",
          sets: 3,
          reps: "10-15",
          type: "stretch",
        },
        {
          orderLabel: "5",
          name: "Cable Pull-Through",
          sets: 2,
          reps: "12-15",
          type: "stretch",
        },
      ],
    },

    // ─────────────────────────────────────────────
    // Day 2: Push + Side Delts
    // ─────────────────────────────────────────────
    {
      dayNumber: 2,
      title: "Push + Side Delts",
      exercises: [
        {
          orderLabel: "1",
          name: "Seated Shoulder Press (Dumbbell)",
          sets: 3,
          reps: "8-12",
          type: "compound",
        },
        {
          orderLabel: "2",
          name: "Lateral Raise (Cable)",
          sets: 3,
          reps: "12-15",
          type: "stretch",
        },
        {
          orderLabel: "3",
          name: "Incline DB Fly",
          sets: 2,
          reps: "10-15",
          type: "stretch",
        },
        {
          orderLabel: "4",
          name: "Lu Raise",
          sets: 2,
          reps: "10-15",
          type: "stretch",
        },
        {
          orderLabel: "5",
          name: "Overhead Tricep Extension (Cable)",
          sets: 2,
          reps: "10-12",
          type: "stretch",
        },
      ],
    },

    // ─────────────────────────────────────────────
    // Day 3: Glute + Quad
    // ─────────────────────────────────────────────
    {
      dayNumber: 3,
      title: "Glute + Quad",
      exercises: [
        {
          orderLabel: "1",
          name: "Bulgarian Split Squat",
          sets: 3,
          reps: "8-12",
          type: "stretch",
        },
        {
          orderLabel: "2",
          name: "Leg Press",
          sets: 3,
          reps: "10-15",
          type: "compound",
        },
        {
          orderLabel: "3",
          name: "Hip Thrust (Barbell)",
          sets: 3,
          reps: "8-12",
          type: "compound",
        },
        {
          orderLabel: "4",
          name: "Leg Extension",
          sets: 3,
          reps: "10-15",
          type: "stretch",
        },
        {
          orderLabel: "5",
          name: "Seated Calf Raise",
          sets: 3,
          reps: "12-15",
          type: "stretch",
        },
      ],
    },

    // ─────────────────────────────────────────────
    // Day 4: Pull + Rear Delts
    // ─────────────────────────────────────────────
    {
      dayNumber: 4,
      title: "Pull + Rear Delts",
      exercises: [
        {
          orderLabel: "1",
          name: "Lat Pulldown",
          sets: 3,
          reps: "8-12",
          type: "compound",
        },
        {
          orderLabel: "2",
          name: "Seated Row (Cable)",
          sets: 3,
          reps: "10-12",
          type: "compound",
        },
        {
          orderLabel: "3",
          name: "Rear Delt Fly (Cable)",
          sets: 3,
          reps: "12-15",
          type: "stretch",
        },
        {
          orderLabel: "4",
          name: "Face Pull",
          sets: 2,
          reps: "12-15",
          type: "compound",
        },
        {
          orderLabel: "5",
          name: "Incline Curl (Dumbbell)",
          sets: 2,
          reps: "10-12",
          type: "stretch",
        },
      ],
    },

    // ─────────────────────────────────────────────
    // Day 5: Glute Pump + Arms + Abs
    // ─────────────────────────────────────────────
    {
      dayNumber: 5,
      title: "Glute Pump + Arms + Abs",
      exercises: [
        {
          orderLabel: "1",
          name: "Walking Lunge (Dumbbell)",
          sets: 2,
          reps: "12-15",
          type: "compound",
        },
        {
          orderLabel: "2",
          name: "Cable Kickback",
          sets: 2,
          reps: "12-15",
          type: "stretch",
        },
        {
          orderLabel: "3A",
          name: "Hammer Curl",
          sets: 2,
          reps: "10-12",
          type: "isolation",
          supersetGroup: "1",
        },
        {
          orderLabel: "3B",
          name: "Tricep Pushdown",
          sets: 2,
          reps: "10-12",
          type: "isolation",
          supersetGroup: "1",
        },
        {
          orderLabel: "4",
          name: "Cable Crunch",
          sets: 2,
          reps: "12-15",
          type: "compound",
        },
        {
          orderLabel: "5",
          name: "Standing Calf Raise",
          sets: 2,
          reps: "10-15",
          type: "stretch",
        },
      ],
    },
  ],
};

// ─────────────────────────────────────────────────────────────────────────────
// Exports
// ─────────────────────────────────────────────────────────────────────────────
export const HERS_PROGRAMS: Record<string, HersProgram> = {
  "hers-lulul": HERS_LULUL,
  "hers-pplpp": HERS_PPLPP,
  "hers-custom": HERS_CUSTOM,
};

export function getHersDayTemplate(
  programId: string,
  dayNumber: number
): HersDayTemplate | undefined {
  return HERS_PROGRAMS[programId]?.dayTemplates.find(
    (d) => d.dayNumber === dayNumber
  );
}
