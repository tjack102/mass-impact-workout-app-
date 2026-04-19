// PPLU (Pull/Push/Legs/Upper) 4-Day program — 12 weeks (deload week 7: sets cut in half)
// Exercise names must match exercise-library.ts exactly for volume tracking to work.

export interface PpluExercise {
  orderLabel: string;
  name: string;
  setGroups: { sets: number; reps: string }[];
  rpe?: string;
}

export interface PpluDayTemplate {
  dayNumber: number;
  title: string;
  exercises: PpluExercise[];
}

export interface PpluProgram {
  id: "pplu";
  weeks: { weekNumber: number; isDeload: boolean }[];
  dayTemplates: PpluDayTemplate[];
}

export const PPLU_PROGRAM: PpluProgram = {
  id: "pplu",
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
    // Day 1: Pull (thickness-focused, power shrugs)
    // ─────────────────────────────────────────────
    {
      dayNumber: 1,
      title: "Pull",
      exercises: [
        {
          orderLabel: "1",
          name: "Pull-Up (Bodyweight)",
          setGroups: [{ sets: 3, reps: "6-10" }],
          rpe: "8-10",
        },
        {
          orderLabel: "2",
          name: "Bent Over Row (Barbell)",
          setGroups: [{ sets: 3, reps: "6-8" }],
          rpe: "8-10",
        },
        {
          orderLabel: "3",
          name: "Power Shrug",
          setGroups: [{ sets: 4, reps: "6-8" }],
          rpe: "8-10",
        },
        {
          orderLabel: "4",
          name: "Single Arm Row (Dumbbell)",
          setGroups: [{ sets: 3, reps: "10-12" }],
          rpe: "8-10",
        },
        {
          orderLabel: "5",
          name: "Standing Pullover (Cable)",
          setGroups: [{ sets: 3, reps: "12-15" }],
          rpe: "8-10",
        },
        {
          orderLabel: "6",
          name: "Rear Delt Fly (Cable)",
          setGroups: [{ sets: 3, reps: "12-15" }],
          rpe: "8-10",
        },
        {
          orderLabel: "7",
          name: "Incline Curl (Dumbbell)",
          setGroups: [{ sets: 3, reps: "8-10" }],
          rpe: "8-10",
        },
      ],
    },

    // ─────────────────────────────────────────────
    // Day 2: Push (upper chest, delts, triceps)
    // ─────────────────────────────────────────────
    {
      dayNumber: 2,
      title: "Push",
      exercises: [
        {
          orderLabel: "1",
          name: "Face Pull",
          setGroups: [{ sets: 3, reps: "12-15" }],
          rpe: "8-10",
        },
        {
          orderLabel: "2",
          name: "Incline Bench Press (Dumbbell)",
          setGroups: [{ sets: 4, reps: "8-10" }],
          rpe: "8-10",
        },
        {
          orderLabel: "3",
          name: "Seated Shoulder Press (Dumbbell)",
          setGroups: [{ sets: 3, reps: "8-10" }],
          rpe: "8-10",
        },
        {
          orderLabel: "4",
          name: "Dip (Weighted)",
          setGroups: [{ sets: 3, reps: "8-12" }],
          rpe: "8-10",
        },
        {
          orderLabel: "5",
          name: "Lateral Raise (Cable)",
          setGroups: [{ sets: 4, reps: "10-15" }],
          rpe: "8-10",
        },
        {
          orderLabel: "6",
          name: "Cable Crossover",
          setGroups: [{ sets: 3, reps: "12-15" }],
          rpe: "8-10",
        },
        {
          orderLabel: "7",
          name: "Overhead Tricep Extension (Cable)",
          setGroups: [{ sets: 3, reps: "10-15" }],
          rpe: "8-10",
        },
      ],
    },

    // ─────────────────────────────────────────────
    // Day 3: Legs (one leg day, make it count)
    // ─────────────────────────────────────────────
    {
      dayNumber: 3,
      title: "Legs",
      exercises: [
        {
          orderLabel: "1",
          name: "Hack Squat",
          setGroups: [{ sets: 3, reps: "6-10" }],
          rpe: "8-10",
        },
        {
          orderLabel: "2",
          name: "Romanian Deadlift (Barbell)",
          setGroups: [
            { sets: 1, reps: "6-8" },
            { sets: 1, reps: "10-15" },
          ],
          rpe: "8-10",
        },
        {
          orderLabel: "3",
          name: "Walking Lunge (Dumbbell)",
          setGroups: [{ sets: 2, reps: "20" }],
          rpe: "8-10",
        },
        {
          orderLabel: "4",
          name: "Seated Hamstring Curl",
          setGroups: [{ sets: 3, reps: "10-12" }],
          rpe: "8-10",
        },
        {
          orderLabel: "5",
          name: "Leg Extension",
          setGroups: [{ sets: 3, reps: "12-15" }],
          rpe: "8-10",
        },
        {
          orderLabel: "6",
          name: "Standing Calf Raise",
          setGroups: [{ sets: 3, reps: "10-12" }],
          rpe: "8-10",
        },
        {
          orderLabel: "7",
          name: "Seated Calf Raise",
          setGroups: [{ sets: 3, reps: "12-15" }],
          rpe: "8-10",
        },
      ],
    },

    // ─────────────────────────────────────────────
    // Day 4: Upper (greatest hits — width back, second chest/delts/arms)
    // ─────────────────────────────────────────────
    {
      dayNumber: 4,
      title: "Upper",
      exercises: [
        {
          orderLabel: "1",
          name: "Wide Overhand Pulldown",
          setGroups: [{ sets: 4, reps: "10-12" }],
          rpe: "8-10",
        },
        {
          orderLabel: "2",
          name: "Incline Bench Press (Dumbbell)",
          setGroups: [{ sets: 4, reps: "8-10" }],
          rpe: "8-10",
        },
        {
          orderLabel: "3",
          name: "Chest-Supported Row",
          setGroups: [{ sets: 3, reps: "10-12" }],
          rpe: "8-10",
        },
        {
          orderLabel: "4",
          name: "Lateral Raise (Cable)",
          setGroups: [{ sets: 4, reps: "12-15" }],
          rpe: "8-10",
        },
        {
          orderLabel: "5",
          name: "Cable Crossover",
          setGroups: [{ sets: 3, reps: "12-15" }],
          rpe: "8-10",
        },
        {
          orderLabel: "6",
          name: "Hammer Curl",
          setGroups: [{ sets: 3, reps: "10-12" }],
          rpe: "8-10",
        },
        {
          orderLabel: "7",
          name: "Overhead Tricep Extension (Cable)",
          setGroups: [{ sets: 3, reps: "10-15" }],
          rpe: "8-10",
        },
      ],
    },
  ],
};

export function getPpluDayTemplate(dayNumber: number): PpluDayTemplate | undefined {
  return PPLU_PROGRAM.dayTemplates.find((d) => d.dayNumber === dayNumber);
}
