// 4-Day Upper/Lower program data — 12 weeks (deload week 7: sets cut in half)
// Based on Damian Zepeda's 4-Day Hypertrophy Program (modified with rear delt work + deload)
// Exercise names must match exercise-library.ts exactly for volume tracking to work.

export interface UpperLowerExercise {
  orderLabel: string;
  name: string;
  setGroups: { sets: number; reps: string }[];
  rpe?: string;
}

export interface UpperLowerDayTemplate {
  dayNumber: number;
  title: string;
  exercises: UpperLowerExercise[];
}

export interface UpperLowerProgram {
  id: "upper-lower";
  weeks: { weekNumber: number; isDeload: boolean }[];
  dayTemplates: UpperLowerDayTemplate[];
}

export const UPPER_LOWER_PROGRAM: UpperLowerProgram = {
  id: "upper-lower",
  weeks: [
    { weekNumber: 1, isDeload: false },
    { weekNumber: 2, isDeload: false },
    { weekNumber: 3, isDeload: false },
    { weekNumber: 4, isDeload: false },
    { weekNumber: 5, isDeload: false },
    { weekNumber: 6, isDeload: false },
    { weekNumber: 7, isDeload: true },
    { weekNumber: 8, isDeload: false },
    { weekNumber: 9, isDeload: false },
    { weekNumber: 10, isDeload: false },
    { weekNumber: 11, isDeload: false },
    { weekNumber: 12, isDeload: false },
  ],
  dayTemplates: [
    // ─────────────────────────────────────────────
    // Day 1: Upper A (Press-dominant)
    // ─────────────────────────────────────────────
    {
      dayNumber: 1,
      title: "Upper A",
      exercises: [
        {
          orderLabel: "1",
          name: "Incline Bench Press (Barbell)",
          setGroups: [{ sets: 4, reps: "5-8" }],
          rpe: "8-10",
        },
        {
          orderLabel: "2",
          name: "Lat Pulldown",
          setGroups: [{ sets: 4, reps: "5-8" }],
          rpe: "8-10",
        },
        {
          orderLabel: "3",
          name: "Seated Shoulder Press (Dumbbell)",
          setGroups: [{ sets: 3, reps: "6-10" }],
          rpe: "8-10",
        },
        {
          orderLabel: "4",
          name: "Seated Wide-Grip Row (Cable)",
          setGroups: [{ sets: 3, reps: "5-8" }],
          rpe: "8-10",
        },
        {
          orderLabel: "5",
          name: "Tricep Pushdown",
          setGroups: [{ sets: 3, reps: "8-15" }],
          rpe: "8-10",
        },
        {
          orderLabel: "6",
          name: "Preacher Curl (Barbell)",
          setGroups: [{ sets: 3, reps: "8-15" }],
          rpe: "8-10",
        },
        {
          orderLabel: "7",
          name: "Lateral Raise (Cable)",
          setGroups: [{ sets: 3, reps: "10-15" }],
          rpe: "8-10",
        },
        {
          orderLabel: "8",
          name: "Face Pull",
          setGroups: [{ sets: 3, reps: "12-15" }],
          rpe: "8-9",
        },
      ],
    },

    // ─────────────────────────────────────────────
    // Day 2: Lower A (Quad-dominant)
    // ─────────────────────────────────────────────
    {
      dayNumber: 2,
      title: "Lower A",
      exercises: [
        {
          orderLabel: "1",
          name: "Hack Squat",
          setGroups: [{ sets: 3, reps: "5-8" }],
          rpe: "8-10",
        },
        {
          orderLabel: "2",
          name: "Seated Hamstring Curl",
          setGroups: [{ sets: 3, reps: "8-15" }],
          rpe: "8-10",
        },
        {
          orderLabel: "3",
          name: "Bulgarian Split Squat",
          setGroups: [{ sets: 2, reps: "6-10" }],
          rpe: "8-10",
        },
        {
          orderLabel: "4",
          name: "Standing Calf Raise",
          setGroups: [{ sets: 3, reps: "5-8" }],
          rpe: "8-10",
        },
        {
          orderLabel: "5",
          name: "Cable Crunch",
          setGroups: [{ sets: 2, reps: "10-20" }],
          rpe: "8-10",
        },
      ],
    },

    // ─────────────────────────────────────────────
    // Day 3: Upper B (Pull-dominant)
    // ─────────────────────────────────────────────
    {
      dayNumber: 3,
      title: "Upper B",
      exercises: [
        {
          orderLabel: "1",
          name: "Wide Overhand Pulldown",
          setGroups: [{ sets: 4, reps: "5-8" }],
          rpe: "8-10",
        },
        {
          orderLabel: "2",
          name: "Incline Bench Press (Dumbbell)",
          setGroups: [{ sets: 4, reps: "5-8" }],
          rpe: "8-10",
        },
        {
          orderLabel: "3",
          name: "Seated Row (Cable)",
          setGroups: [{ sets: 3, reps: "5-8" }],
          rpe: "8-10",
        },
        {
          orderLabel: "4",
          name: "Cable Chest Fly",
          setGroups: [{ sets: 3, reps: "8-15" }],
          rpe: "8-10",
        },
        {
          orderLabel: "5",
          name: "Skull Crusher",
          setGroups: [{ sets: 3, reps: "8-15" }],
          rpe: "8-10",
        },
        {
          orderLabel: "6",
          name: "Hammer Curl",
          setGroups: [{ sets: 3, reps: "8-15" }],
          rpe: "8-10",
        },
        {
          orderLabel: "7",
          name: "Lateral Raise (Dumbbell)",
          setGroups: [{ sets: 3, reps: "10-15" }],
          rpe: "8-10",
        },
        {
          orderLabel: "8",
          name: "Rear Delt Fly (Cable)",
          setGroups: [{ sets: 2, reps: "12-15" }],
          rpe: "8-10",
        },
      ],
    },

    // ─────────────────────────────────────────────
    // Day 4: Lower B (Posterior-dominant)
    // ─────────────────────────────────────────────
    {
      dayNumber: 4,
      title: "Lower B",
      exercises: [
        {
          orderLabel: "1",
          name: "Romanian Deadlift (Barbell)",
          setGroups: [{ sets: 3, reps: "5-8" }],
          rpe: "8-10",
        },
        {
          orderLabel: "2",
          name: "Leg Press",
          setGroups: [{ sets: 3, reps: "5-8" }],
          rpe: "8-10",
        },
        {
          orderLabel: "3",
          name: "Lying Leg Curl",
          setGroups: [{ sets: 2, reps: "8-15" }],
          rpe: "8-10",
        },
        {
          orderLabel: "4",
          name: "Leg Extension",
          setGroups: [{ sets: 2, reps: "8-15" }],
          rpe: "8-10",
        },
        {
          orderLabel: "5",
          name: "Seated Calf Raise",
          setGroups: [{ sets: 3, reps: "12-20" }],
          rpe: "8-10",
        },
        {
          orderLabel: "6",
          name: "Hanging Leg Raise",
          setGroups: [{ sets: 2, reps: "10-20" }],
          rpe: "8-10",
        },
      ],
    },
  ],
};

export function getUpperLowerDayTemplate(dayNumber: number): UpperLowerDayTemplate | undefined {
  return UPPER_LOWER_PROGRAM.dayTemplates.find((d) => d.dayNumber === dayNumber);
}
