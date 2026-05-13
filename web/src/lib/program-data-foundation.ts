// Foundation: 3-day MVP template — greatest hits from Mass Impact / RAVAGE / RAMPAGE / Nippard splits,
// filtered for "minimum dose that still moves aesthetics." 5 lifts per day, ~40 min sessions.
// Exercise names must match exercise-library.ts exactly for volume tracking to work.

export interface FoundationExercise {
  orderLabel: string;
  name: string;
  setGroups: { sets: number; reps: string }[];
  notes?: string;
}

export interface FoundationDayTemplate {
  dayNumber: number;
  title: string;
  exercises: FoundationExercise[];
}

export interface FoundationProgram {
  id: "foundation";
  dayTemplates: FoundationDayTemplate[];
}

export const FOUNDATION_PROGRAM: FoundationProgram = {
  id: "foundation",
  dayTemplates: [
    {
      dayNumber: 1,
      title: "Upper (Push)",
      exercises: [
        {
          orderLabel: "1",
          name: "Incline Bench Press (Dumbbell)",
          setGroups: [{ sets: 3, reps: "6-10" }],
          notes: "Top set heavy, leave 1-2 reps in tank. Upper chest = aesthetic gap most natty guys miss.",
        },
        {
          orderLabel: "2",
          name: "Lateral Raise (Cable)",
          setGroups: [{ sets: 3, reps: "10-15" }],
          notes: "Side delts = visual shoulder width. Highest aesthetic ROI per set.",
        },
        {
          orderLabel: "3",
          name: "Chest-Supported Row",
          setGroups: [{ sets: 3, reps: "8-12" }],
          notes: "Back thickness without lower-back tax.",
        },
        {
          orderLabel: "4",
          name: "Overhead Tricep Extension (Cable)",
          setGroups: [{ sets: 2, reps: "10-15" }],
          notes: "Long head = horseshoe. Lengthened bias.",
        },
        {
          orderLabel: "5",
          name: "Cable Crunch",
          setGroups: [{ sets: 2, reps: "10-15" }],
          notes: "Optional. Skip if short on time -- lifts 1-3 are the non-negotiables.",
        },
      ],
    },
    {
      dayNumber: 2,
      title: "Lower",
      exercises: [
        {
          orderLabel: "1",
          name: "Hack Squat",
          setGroups: [{ sets: 3, reps: "8-12" }],
          notes: "Quads without the barbell-squat motivation tax. Sub Leg Press if no hack squat.",
        },
        {
          orderLabel: "2",
          name: "Romanian Deadlift (Barbell)",
          setGroups: [{ sets: 3, reps: "8-12" }],
          notes: "Hams + glutes. Mandatory -- don't skip even if Day B feels long.",
        },
        {
          orderLabel: "3",
          name: "Walking Lunge",
          setGroups: [{ sets: 2, reps: "20" }],
          notes: "20 total steps. Sub Leg Extension if knees/space are an issue.",
        },
        {
          orderLabel: "4",
          name: "Standing Calf Raise",
          setGroups: [{ sets: 3, reps: "10-15" }],
          notes: "Slow eccentric, full stretch at bottom, 1s squeeze at top.",
        },
        {
          orderLabel: "5",
          name: "Hanging Knee Raise",
          setGroups: [{ sets: 2, reps: "10-15" }],
          notes: "Optional. Lower abs.",
        },
      ],
    },
    {
      dayNumber: 3,
      title: "Upper (Pull)",
      exercises: [
        {
          orderLabel: "1",
          name: "Pull-Up (Neutral Grip, Bodyweight)",
          setGroups: [{ sets: 3, reps: "6-10" }],
          notes: "Back width king. Use assistance if needed -- don't drop the lift.",
        },
        {
          orderLabel: "2",
          name: "Single Arm Row (Cable)",
          setGroups: [{ sets: 3, reps: "10-12" }],
          notes: "Full stretch at the bottom, hard contraction at top. Per side.",
        },
        {
          orderLabel: "3",
          name: "Lateral Raise (Cable)",
          setGroups: [{ sets: 3, reps: "10-15" }],
          notes: "Yes, again. Side delts respond to frequency -- 2x/week is the sweet spot.",
        },
        {
          orderLabel: "4",
          name: "Incline Curl (Dumbbell)",
          setGroups: [{ sets: 3, reps: "8-12" }],
          notes: "Biceps long head, stretched position.",
        },
        {
          orderLabel: "5",
          name: "Face Pull",
          setGroups: [{ sets: 2, reps: "12-15" }],
          notes: "Optional. Rear delts + shoulder health insurance.",
        },
      ],
    },
  ],
};

export function getFoundationDayTemplate(dayNumber: number): FoundationDayTemplate | undefined {
  return FOUNDATION_PROGRAM.dayTemplates.find((d) => d.dayNumber === dayNumber);
}
