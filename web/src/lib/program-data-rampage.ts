// RAMPAGE program data — 3x/week full body, 10 weeks (deload weeks 5 & 10)
// By Geoffrey Verity Schofield (Resurrecting Your Gains ebook)
// Exercise names must match exercise-library.ts exactly for volume tracking to work.

export interface RampageExercise {
  orderLabel: string;
  name: string;
  setGroups: { sets: number; reps: string }[];
  rpe?: string;
  supersetGroup?: string;
}

export interface RampageDayTemplate {
  dayNumber: number;
  title: string;
  exercises: RampageExercise[];
}

export interface RampageProgram {
  id: "rampage";
  weeks: { weekNumber: number; isDeload: boolean }[];
  dayTemplates: RampageDayTemplate[];
}

export const RAMPAGE_PROGRAM: RampageProgram = {
  id: "rampage",
  weeks: [
    { weekNumber: 1, isDeload: false },
    { weekNumber: 2, isDeload: false },
    { weekNumber: 3, isDeload: false },
    { weekNumber: 4, isDeload: false },
    { weekNumber: 5, isDeload: true },
    { weekNumber: 6, isDeload: false },
    { weekNumber: 7, isDeload: false },
    { weekNumber: 8, isDeload: false },
    { weekNumber: 9, isDeload: false },
    { weekNumber: 10, isDeload: true },
  ],
  dayTemplates: [
    // ─────────────────────────────────────────────
    // Day 1: Full Body 1
    // ─────────────────────────────────────────────
    {
      dayNumber: 1,
      title: "Full Body 1",
      exercises: [
        {
          orderLabel: "1A",
          name: "Incline Bench Press (Dumbbell)",
          setGroups: [{ sets: 2, reps: "6-8" }],
          rpe: "10",
          supersetGroup: "1",
        },
        {
          orderLabel: "1B",
          name: "Wide Neutral Pulldown",
          setGroups: [{ sets: 2, reps: "10-15" }],
          rpe: "10",
          supersetGroup: "1",
        },
        {
          orderLabel: "2",
          name: "Leg Press",
          setGroups: [{ sets: 3, reps: "10-15" }],
          rpe: "8-9",
        },
        {
          orderLabel: "3A",
          name: "Helms Row",
          setGroups: [{ sets: 2, reps: "10-20" }],
          supersetGroup: "3",
        },
        {
          orderLabel: "3B",
          name: "Arnold Press",
          setGroups: [{ sets: 2, reps: "8-12" }],
          rpe: "8-9",
          supersetGroup: "3",
        },
        {
          orderLabel: "4",
          name: "Romanian Deadlift (Barbell)",
          setGroups: [{ sets: 2, reps: "8-10" }],
          rpe: "8",
        },
        {
          orderLabel: "5A",
          name: "Standing Pullover (Cable)",
          setGroups: [{ sets: 2, reps: "15-20" }],
          supersetGroup: "5",
        },
        {
          orderLabel: "5B",
          name: "Upright Row (Barbell)",
          setGroups: [{ sets: 2, reps: "12-15" }],
          rpe: "10",
          supersetGroup: "5",
        },
        {
          orderLabel: "6A",
          name: "Pec Deck (Machine)",
          setGroups: [{ sets: 1, reps: "10-15" }],
          rpe: "10",
          supersetGroup: "6",
        },
        {
          orderLabel: "6B",
          name: "Skiers",
          setGroups: [{ sets: 1, reps: "10-15" }],
          supersetGroup: "6",
        },
        {
          orderLabel: "7",
          name: "Hanging Leg Raise",
          setGroups: [{ sets: 2, reps: "10-20" }],
        },
      ],
    },

    // ─────────────────────────────────────────────
    // Day 2: Full Body 2
    // ─────────────────────────────────────────────
    {
      dayNumber: 2,
      title: "Full Body 2",
      exercises: [
        {
          orderLabel: "1A",
          name: "Bench Press (Barbell)",
          setGroups: [{ sets: 2, reps: "8-10" }],
          rpe: "8-9",
          supersetGroup: "1",
        },
        {
          orderLabel: "1B",
          name: "Pull-Up (Neutral Grip, Bodyweight)",
          setGroups: [{ sets: 2, reps: "8-10" }],
          rpe: "10",
          supersetGroup: "1",
        },
        {
          orderLabel: "2",
          name: "Front Squat (Barbell)",
          setGroups: [{ sets: 2, reps: "6-8" }],
          rpe: "8-9",
        },
        {
          orderLabel: "3A",
          name: "1 Arm Machine Row",
          setGroups: [{ sets: 2, reps: "10-15" }],
          supersetGroup: "3",
        },
        {
          orderLabel: "3B",
          name: "Seated Shoulder Press (Dumbbell)",
          setGroups: [{ sets: 2, reps: "6-10" }],
          rpe: "8-9",
          supersetGroup: "3",
        },
        {
          orderLabel: "4",
          name: "Back Extension (Weighted)",
          setGroups: [{ sets: 2, reps: "10-12" }],
          rpe: "8-9",
        },
        {
          orderLabel: "5A",
          name: "Tricep Pushdown",
          setGroups: [{ sets: 2, reps: "12-15" }],
          rpe: "10",
          supersetGroup: "5",
        },
        {
          orderLabel: "5B",
          name: "Lateral Raise (Cable)",
          setGroups: [{ sets: 2, reps: "12" }],
          supersetGroup: "5",
        },
        {
          orderLabel: "6",
          name: "Spider Curl",
          setGroups: [{ sets: 2, reps: "12" }],
        },
        {
          orderLabel: "7",
          name: "Cable Crunch",
          setGroups: [{ sets: 2, reps: "10-20" }],
        },
      ],
    },

    // ─────────────────────────────────────────────
    // Day 3: Full Body 3
    // ─────────────────────────────────────────────
    {
      dayNumber: 3,
      title: "Full Body 3",
      exercises: [
        {
          orderLabel: "1A",
          name: "Smith Reverse Grip Bench",
          setGroups: [{ sets: 2, reps: "8-12" }],
          rpe: "8-9",
          supersetGroup: "1",
        },
        {
          orderLabel: "1B",
          name: "Wide Overhand Pulldown",
          setGroups: [{ sets: 2, reps: "10-12" }],
          rpe: "10",
          supersetGroup: "1",
        },
        {
          orderLabel: "2",
          name: "Platz Squat",
          setGroups: [{ sets: 3, reps: "8-12" }],
          rpe: "8-9",
        },
        {
          orderLabel: "3A",
          name: "Yates Row",
          setGroups: [{ sets: 2, reps: "12-15" }],
          rpe: "8-9",
          supersetGroup: "3",
        },
        {
          orderLabel: "3B",
          name: "Klokov Press",
          setGroups: [{ sets: 2, reps: "8-12" }],
          rpe: "8-9",
          supersetGroup: "3",
        },
        {
          orderLabel: "4",
          name: "Good Morning",
          setGroups: [{ sets: 2, reps: "12-15" }],
          rpe: "8-9",
        },
        {
          orderLabel: "5A",
          name: "Overhead Tricep Extension (Cable)",
          setGroups: [{ sets: 2, reps: "12-15" }],
          rpe: "10",
          supersetGroup: "5",
        },
        {
          orderLabel: "5B",
          name: "Incline Curl (Dumbbell)",
          setGroups: [{ sets: 2, reps: "8-12" }],
          rpe: "10",
          supersetGroup: "5",
        },
        {
          orderLabel: "6",
          name: "Lateral Raise (Dumbbell)",
          setGroups: [{ sets: 2, reps: "12-15" }],
        },
        {
          orderLabel: "7",
          name: "Pallof Press",
          setGroups: [{ sets: 2, reps: "10-20" }],
        },
      ],
    },
  ],
};

export function getRampageDayTemplate(dayNumber: number): RampageDayTemplate | undefined {
  return RAMPAGE_PROGRAM.dayTemplates.find((d) => d.dayNumber === dayNumber);
}
