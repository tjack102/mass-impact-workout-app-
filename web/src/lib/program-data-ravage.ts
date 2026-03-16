// RAVAGE program data — 6-day PPL-style double progression, 10 weeks (deload weeks 5 & 10)
// Exercise names must match exercise-library.ts exactly for volume tracking to work.

export interface RavageExercise {
  orderLabel: string;
  name: string;
  setGroups: { sets: number; reps: string }[];
  rpe?: string;
  supersetGroup?: string;
}

export interface RavageDayTemplate {
  dayNumber: number;
  title: string;
  exercises: RavageExercise[];
}

export interface RavageProgram {
  id: "ravage";
  weeks: { weekNumber: number; isDeload: boolean }[];
  dayTemplates: RavageDayTemplate[];
}

export const RAVAGE_PROGRAM: RavageProgram = {
  id: "ravage",
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
    // Day 1: Legs A
    // ─────────────────────────────────────────────
    {
      dayNumber: 1,
      title: "Legs A",
      exercises: [
        {
          orderLabel: "1",
          name: "Smith Machine Hack Squat",
          // Different rep targets across set groups: 1 heavy + 2 moderate
          setGroups: [{ sets: 1, reps: "5-10" }, { sets: 2, reps: "10-15" }],
          rpe: "7-8",
        },
        {
          orderLabel: "2",
          name: "Back Extension (Weighted)",
          setGroups: [{ sets: 2, reps: "8-15" }],
          rpe: "8-9",
        },
        {
          orderLabel: "3",
          name: "Walking Lunge",
          setGroups: [{ sets: 2, reps: "20-30" }],
        },
        {
          orderLabel: "4",
          name: "Seated Hamstring Curl",
          setGroups: [{ sets: 2, reps: "8-12" }],
        },
      ],
    },

    // ─────────────────────────────────────────────
    // Day 2: Torso A
    // ─────────────────────────────────────────────
    {
      dayNumber: 2,
      title: "Torso A",
      exercises: [
        {
          orderLabel: "1A",
          name: "Close Grip Larsen Press",
          setGroups: [{ sets: 3, reps: "6-8" }],
          rpe: "9-10",
          supersetGroup: "1",
        },
        {
          orderLabel: "1B",
          name: "Narrow Neutral Pulldown",
          setGroups: [{ sets: 3, reps: "8-12" }],
          rpe: "10",
          supersetGroup: "1",
        },
        {
          orderLabel: "2A",
          name: "Smith Reverse Grip Bench",
          setGroups: [{ sets: 2, reps: "8-12" }],
          rpe: "8-9",
          supersetGroup: "2",
        },
        {
          orderLabel: "2B",
          name: "Wide Overhand Pulldown",
          setGroups: [{ sets: 2, reps: "10-15" }],
          rpe: "10",
          supersetGroup: "2",
        },
        {
          orderLabel: "3A",
          name: "Cable Crossover",
          setGroups: [{ sets: 2, reps: "10-15" }],
          rpe: "10",
          supersetGroup: "3",
        },
        {
          orderLabel: "3B",
          name: "1 Arm Machine Row",
          setGroups: [{ sets: 2, reps: "10-15" }],
          rpe: "10",
          supersetGroup: "3",
        },
        {
          orderLabel: "4",
          name: "Standing Pullover (Cable)",
          setGroups: [{ sets: 1, reps: "15-20" }],
        },
      ],
    },

    // ─────────────────────────────────────────────
    // Day 3: Bro A
    // ─────────────────────────────────────────────
    {
      dayNumber: 3,
      title: "Bro A",
      exercises: [
        {
          orderLabel: "1A",
          name: "Hammer Curl",
          setGroups: [{ sets: 2, reps: "15-20" }],
          rpe: "10",
          supersetGroup: "1",
        },
        {
          orderLabel: "1B",
          name: "Tricep Pushdown",
          setGroups: [{ sets: 2, reps: "8-15" }],
          rpe: "10",
          supersetGroup: "1",
        },
        {
          orderLabel: "2A",
          // "Incline Dumbbell Curl" in raw program; library name is "Incline Curl (Dumbbell)"
          name: "Incline Curl (Dumbbell)",
          setGroups: [{ sets: 2, reps: "6-10" }],
          rpe: "9-10",
          supersetGroup: "2",
        },
        {
          orderLabel: "2B",
          name: "Standing Overhead Extension",
          setGroups: [{ sets: 2, reps: "8-15" }],
          rpe: "10",
          supersetGroup: "2",
        },
        {
          orderLabel: "3",
          // "Cable Lateral Raise" in raw program; library canonical name is "Lateral Raise (Cable)"
          name: "Lateral Raise (Cable)",
          setGroups: [{ sets: 2, reps: "10-15" }],
        },
        {
          orderLabel: "4",
          name: "Upright Row (Barbell)",
          setGroups: [{ sets: 2, reps: "15-20" }],
          rpe: "10",
        },
      ],
    },

    // ─────────────────────────────────────────────
    // Day 4: Legs B
    // ─────────────────────────────────────────────
    {
      dayNumber: 4,
      title: "Legs B",
      exercises: [
        {
          orderLabel: "1",
          // "Back Squat" in raw program; library canonical name is "Squat (Barbell)"
          name: "Squat (Barbell)",
          setGroups: [{ sets: 2, reps: "8-12" }],
          rpe: "8-9",
        },
        {
          orderLabel: "2",
          // "Romanian Deadlift" in raw program; library canonical name is "Romanian Deadlift (Barbell)"
          name: "Romanian Deadlift (Barbell)",
          setGroups: [{ sets: 2, reps: "8-10" }],
          rpe: "7-9",
        },
        {
          orderLabel: "3",
          // "Hip Thrust" in raw program; library canonical name is "Hip Thrust (Barbell)"
          name: "Hip Thrust (Barbell)",
          setGroups: [{ sets: 2, reps: "12-20" }],
        },
        {
          orderLabel: "4A",
          name: "Seated Hamstring Curl",
          setGroups: [{ sets: 2, reps: "8-15" }],
          rpe: "10",
          supersetGroup: "4",
        },
        {
          orderLabel: "4B",
          name: "Leg Extension",
          setGroups: [{ sets: 2, reps: "15-20" }],
          rpe: "10",
          supersetGroup: "4",
        },
      ],
    },

    // ─────────────────────────────────────────────
    // Day 5: Torso B
    // ─────────────────────────────────────────────
    {
      dayNumber: 5,
      title: "Torso B",
      exercises: [
        {
          orderLabel: "1A",
          name: "Bench Press (Barbell)",
          setGroups: [{ sets: 2, reps: "8-12" }],
          rpe: "8-9",
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
          orderLabel: "2A",
          name: "Chest Press (Machine)",
          setGroups: [{ sets: 2, reps: "6-12" }],
          rpe: "9-10",
          supersetGroup: "2",
        },
        {
          orderLabel: "2B",
          name: "Helms Row",
          setGroups: [{ sets: 2, reps: "10-20" }],
          supersetGroup: "2",
        },
        {
          orderLabel: "3A",
          name: "Seated Shoulder Press (Dumbbell)",
          setGroups: [{ sets: 2, reps: "6-12" }],
          rpe: "10",
          supersetGroup: "3",
        },
        {
          orderLabel: "3B",
          name: "Seated Row (Cable)",
          setGroups: [{ sets: 2, reps: "8-15" }],
          supersetGroup: "3",
        },
      ],
    },

    // ─────────────────────────────────────────────
    // Day 6: Bro B
    // ─────────────────────────────────────────────
    {
      dayNumber: 6,
      title: "Bro B",
      exercises: [
        {
          orderLabel: "1A",
          name: "Hammer Curl",
          setGroups: [{ sets: 2, reps: "15-20" }],
          supersetGroup: "1",
        },
        {
          orderLabel: "1B",
          name: "Leaning Overhead Extension",
          setGroups: [{ sets: 2, reps: "10-15" }],
          rpe: "10",
          supersetGroup: "1",
        },
        {
          orderLabel: "2A",
          name: "Bicep Curl (Barbell)",
          setGroups: [{ sets: 2, reps: "8-12" }],
          rpe: "9-10",
          supersetGroup: "2",
        },
        {
          orderLabel: "2B",
          name: "Tricep Pushdown",
          setGroups: [{ sets: 2, reps: "8-15" }],
          rpe: "10",
          supersetGroup: "2",
        },
        {
          orderLabel: "3",
          name: "Lateral Raise (Machine)",
          setGroups: [{ sets: 2, reps: "12-20" }],
        },
        {
          orderLabel: "4",
          // "Lu Lateral Raise" in raw program; library canonical name is "Lu Raise"
          name: "Lu Raise",
          setGroups: [{ sets: 2, reps: "10-15" }],
          rpe: "10",
        },
        {
          orderLabel: "5",
          // "Cable Rear Delt" in raw program; library canonical name is "Rear Delt Fly (Cable)"
          name: "Rear Delt Fly (Cable)",
          setGroups: [{ sets: 2, reps: "15-20" }],
        },
        {
          orderLabel: "6A",
          name: "Neck Flexion",
          setGroups: [{ sets: 1, reps: "15-20" }],
          rpe: "8-9",
          supersetGroup: "6",
        },
        {
          orderLabel: "6B",
          name: "Wrist Flexion/Extension",
          setGroups: [{ sets: 1, reps: "15-20" }],
          supersetGroup: "6",
        },
      ],
    },
  ],
};

export function getRavageDayTemplate(dayNumber: number): RavageDayTemplate | undefined {
  return RAVAGE_PROGRAM.dayTemplates.find((d) => d.dayNumber === dayNumber);
}
