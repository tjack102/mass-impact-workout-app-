// Nippard Minimalist 2-Day Full Body program
// Source: jeffnippard.com/blogs/news/the-best-science-based-minimalist-workout-plan-under-45-mins
// Exercise names must match exercise-library.ts exactly for volume tracking to work.

export interface MinimalistExercise {
  orderLabel: string;
  name: string;
  setGroups: { sets: number; reps: string }[];
  rpe?: string;
  supersetGroup?: string;
  notes?: string; // Technique cues: drop sets, myo-reps, grip variations
}

export interface MinimalistDayTemplate {
  dayNumber: number;
  title: string;
  exercises: MinimalistExercise[];
}

export interface MinimalistProgram {
  id: "nippard-minimalist";
  dayTemplates: MinimalistDayTemplate[];
}

export const MINIMALIST_PROGRAM: MinimalistProgram = {
  id: "nippard-minimalist",
  dayTemplates: [
    // ─────────────────────────────────────────────
    // Day 1: Full Body A
    // ─────────────────────────────────────────────
    {
      dayNumber: 1,
      title: "Full Body A",
      exercises: [
        {
          orderLabel: "1",
          name: "Flat Dumbbell Press",
          setGroups: [
            { sets: 1, reps: "4-6" },
            { sets: 1, reps: "8-10" },
          ],
          rpe: "10, 8",
          notes: "Heavy set + lighter back-off set",
        },
        {
          orderLabel: "2",
          name: "Romanian Deadlift (Dumbbell)",
          setGroups: [{ sets: 2, reps: "8-10" }],
          rpe: "8",
          notes: "Use straps if grip limits hamstring tension",
        },
        {
          orderLabel: "3",
          name: "Lat Pulldown",
          setGroups: [{ sets: 2, reps: "10-12" }],
          rpe: "8",
          notes: "Set 1: overhand mid-grip. Set 2: underhand close grip + overhead curls after",
        },
        {
          orderLabel: "4",
          name: "Step-Up (High Box)",
          setGroups: [{ sets: 1, reps: "8-10 per leg" }],
          rpe: "10",
          notes: "Front leg carries all load; go heavier than you think",
        },
        {
          orderLabel: "5",
          name: "Overhead Tricep Extension (Cable)",
          setGroups: [{ sets: 1, reps: "12-15" }],
          rpe: "10",
          notes: "Drop set: -30-40% to failure",
        },
        {
          orderLabel: "6",
          name: "Lateral Raise (Machine)",
          setGroups: [{ sets: 1, reps: "12-15" }],
          rpe: "10",
          notes: "Drop set: -30-40% to failure",
        },
        {
          orderLabel: "7",
          name: "Leg Press Calf Raise",
          setGroups: [{ sets: 1, reps: "12-15" }],
          rpe: "10",
          notes: "Drop set: -30-40% to failure. 1s pause at bottom, full squeeze at top",
        },
      ],
    },

    // ─────────────────────────────────────────────
    // Day 2: Full Body B
    // ─────────────────────────────────────────────
    {
      dayNumber: 2,
      title: "Full Body B",
      exercises: [
        {
          orderLabel: "1",
          name: "Hack Squat",
          setGroups: [
            { sets: 1, reps: "4-6" },
            { sets: 1, reps: "8-10" },
          ],
          rpe: "9, 8",
          notes: "Heavy set + back-off set. Full depth, knees past toes OK",
        },
        {
          orderLabel: "2A",
          name: "Incline Smith Machine Press",
          setGroups: [{ sets: 2, reps: "10-12" }],
          rpe: "8",
          supersetGroup: "2",
          notes: "45-60 deg incline, close grip for upper pec emphasis",
        },
        {
          orderLabel: "2B",
          name: "T-Bar Row",
          setGroups: [{ sets: 2, reps: "10-12" }],
          rpe: "8",
          supersetGroup: "2",
          notes: "Alternate wide/close grip per set. Sub: chest-supported DB row",
        },
        {
          orderLabel: "3",
          name: "Seated Hamstring Curl",
          setGroups: [{ sets: 1, reps: "10-12" }],
          rpe: "10",
          notes: "Lean forward for extra stretch. Drop set: -30-40% to failure",
        },
        {
          orderLabel: "4",
          name: "EZ Bar Curl",
          setGroups: [{ sets: 1, reps: "12-15" }],
          rpe: "10",
          notes: "Myo-reps: rest 3-4s, do 4 reps, repeat until can't get 4",
        },
        {
          orderLabel: "5",
          name: "Cable Crunch",
          setGroups: [{ sets: 1, reps: "12-15" }],
          rpe: "10",
          notes: "Double drop set: -30% to failure, -30% again to failure",
        },
      ],
    },
  ],
};

export function getMinimalistDayTemplate(dayNumber: number): MinimalistDayTemplate | undefined {
  return MINIMALIST_PROGRAM.dayTemplates.find((d) => d.dayNumber === dayNumber);
}
