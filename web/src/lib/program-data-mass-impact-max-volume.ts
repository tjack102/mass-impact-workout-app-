import type { ProgramDay, ProgramExercise } from "./program-data";
export type { ProgramDay, ProgramExercise };

// Re-export the full Program type shape inline so this file is self-contained
// for callers that only import from here.
import type { Program, ProgramWeek } from "./program-data";

export const MASS_IMPACT_MAX_VOLUME_PROGRAM: Program = {
  name: "Mass Impact (Max Volume)",
  description: "Geoff Verity Schofield's PPLPP Program -- Max Volume variant with extra sets and accessory work",
  duration: "12 weeks",
  daysPerWeek: 5,
  timePerWorkout: "75 minutes",
  weeks: buildAllWeeksMV(),
};

export function getDayForWeekMaxVolume(weekNumber: number, dayNumber: number): ProgramDay | undefined {
  const week = MASS_IMPACT_MAX_VOLUME_PROGRAM.weeks.find((w) => w.weekNumber === weekNumber);
  return week?.days.find((d) => d.dayNumber === dayNumber);
}

function buildAllWeeksMV(): ProgramWeek[] {
  const weeks: ProgramWeek[] = [];
  for (let week = 1; week <= 12; week += 1) {
    weeks.push({ weekNumber: week, days: buildWeekDaysMV(week) });
  }
  return weeks;
}

function buildWeekDaysMV(week: number): ProgramDay[] {
  return [
    buildDay1PullMV(week),
    buildDay2PushMV(week),
    buildDay3LegsDensityMV(week),
    buildDay4PullMV(week),
    buildDay5PushMV(week),
  ];
}

function buildDay1PullMV(week: number): ProgramDay {
  let exercises: ProgramExercise[];

  if (week <= 4) {
    exercises = [
      { order: 1, orderLabel: "1", name: "Single Arm Row (Cable)", setGroups: [{ sets: 3, reps: "15-20 reps" }] },
      // +1 set vs vanilla's 2
      { order: 2, orderLabel: "2", name: "Pull-Up (Bodyweight)", setGroups: [{ sets: 3, reps: "8-12 reps" }] },
      { order: 3, orderLabel: "3", name: "Power Shrug", setGroups: [{ sets: 3, reps: "8-12 reps" }] },
      // +1 set vs vanilla's 3
      { order: 4, orderLabel: "4", name: "Standing Pullover (Cable)", setGroups: [{ sets: 4, reps: "12-15 reps" }] },
      // +1 set vs vanilla's 2
      { order: 5, orderLabel: "5A", name: "Rear Delt Fly (Cable)", setGroups: [{ sets: 3, reps: "10-15 reps" }] },
      // +1 set vs vanilla's 2
      { order: 6, orderLabel: "5B", name: "Incline Curl (Dumbbell)", setGroups: [{ sets: 3, reps: "8-10 reps" }] },
      // NEW exercise
      { order: 7, orderLabel: "6", name: "Lateral Raise (Cable)", setGroups: [{ sets: 2, reps: "12-15 reps" }] },
      { order: 8, orderLabel: "7", name: "Cardio", setGroups: [{ sets: 1, reps: "15-20 mins" }] },
    ];
  } else if (week <= 8) {
    exercises = [
      {
        order: 1,
        orderLabel: "1",
        name: "Single Arm Row (Cable)",
        setGroups: [
          { sets: 1, reps: "15-20 reps" },
          { sets: 1, reps: "10-15 reps" },
          { sets: 1, reps: "8-10 reps" },
          { sets: 1, reps: "6-8 reps" },
        ],
      },
      // +1 set vs vanilla's 3+1 (4 working + 1 back-off)
      {
        order: 2,
        orderLabel: "2",
        name: "Pull-Up (Bodyweight)",
        setGroups: [{ sets: 4, reps: "6-8 reps" }, { sets: 1, reps: "8-12 reps" }],
      },
      { order: 3, orderLabel: "3", name: "Power Shrug", setGroups: [{ sets: 3, reps: "8-12 reps" }] },
      { order: 4, orderLabel: "4", name: "Standing Pullover (Cable)", setGroups: [{ sets: 4, reps: "10-12 reps" }] },
      { order: 5, orderLabel: "5A", name: "Rear Delt Fly (Cable)", setGroups: [{ sets: 3, reps: "10-15 reps" }] },
      { order: 6, orderLabel: "5B", name: "Incline Curl (Dumbbell)", setGroups: [{ sets: 3, reps: "8-10 reps" }] },
      { order: 7, orderLabel: "6", name: "Lateral Raise (Cable)", setGroups: [{ sets: 2, reps: "12-15 reps" }] },
      { order: 8, orderLabel: "7", name: "Cardio", setGroups: [{ sets: 1, reps: "15-20 mins" }] },
    ];
  } else {
    exercises = [
      { order: 1, orderLabel: "1", name: "Single Arm Row (Cable)", setGroups: [{ sets: 4, reps: "6-10 reps" }] },
      {
        order: 2,
        orderLabel: "2",
        name: "Pull-Up (Bodyweight)",
        setGroups: [{ sets: 4, reps: "4-6 reps" }, { sets: 1, reps: "8-12 reps" }],
      },
      { order: 3, orderLabel: "3", name: "Power Shrug", setGroups: [{ sets: 3, reps: "8-12 reps" }] },
      { order: 4, orderLabel: "4", name: "Standing Pullover (Cable)", setGroups: [{ sets: 4, reps: "8-10 reps" }] },
      { order: 5, orderLabel: "5A", name: "Rear Delt Fly (Cable)", setGroups: [{ sets: 3, reps: "10-15 reps" }] },
      { order: 6, orderLabel: "5B", name: "Incline Curl (Dumbbell)", setGroups: [{ sets: 3, reps: "8-10 reps" }] },
      { order: 7, orderLabel: "6", name: "Lateral Raise (Cable)", setGroups: [{ sets: 2, reps: "12-15 reps" }] },
      { order: 8, orderLabel: "7", name: "Cardio", setGroups: [{ sets: 1, reps: "15-20 mins" }] },
    ];
  }

  return { dayNumber: 1, title: "Pull", exercises };
}

function buildDay2PushMV(week: number): ProgramDay {
  let exercises: ProgramExercise[];

  if (week <= 4) {
    exercises = [
      { order: 1, orderLabel: "1", name: "Face Pull", setGroups: [{ sets: 3, reps: "10-15 reps" }] },
      // +1 set vs vanilla's 2
      { order: 2, orderLabel: "2", name: "Dip (Weighted)", setGroups: [{ sets: 3, reps: "8-12 reps" }] },
      { order: 3, orderLabel: "3", name: "AD Press", setGroups: [{ sets: 3, reps: "8-12 reps" }] },
      // +1 set vs vanilla's 2
      { order: 4, orderLabel: "4A", name: "Lu Raise", setGroups: [{ sets: 3, reps: "10-15 reps" }] },
      // +1 set vs vanilla's 2
      { order: 5, orderLabel: "4B", name: "Cable Crossover", setGroups: [{ sets: 3, reps: "10-15 reps" }] },
      // +1 set vs vanilla's 2
      { order: 6, orderLabel: "4C", name: "Overhead Tricep Extension (Cable)", setGroups: [{ sets: 3, reps: "10-15 reps" }] },
    ];
  } else if (week <= 8) {
    exercises = [
      { order: 1, orderLabel: "1", name: "Face Pull", setGroups: [{ sets: 3, reps: "10-15 reps" }] },
      { order: 2, orderLabel: "2", name: "Dip (Weighted)", setGroups: [{ sets: 3, reps: "8-12 reps" }] },
      {
        order: 3,
        orderLabel: "3",
        name: "AD Press",
        setGroups: [{ sets: 1, reps: "6-8 reps" }, { sets: 2, reps: "8-12 reps" }],
      },
      { order: 4, orderLabel: "4A", name: "Lu Raise", setGroups: [{ sets: 3, reps: "10-15 reps" }] },
      { order: 5, orderLabel: "4B", name: "Cable Crossover", setGroups: [{ sets: 3, reps: "10-15 reps" }] },
      { order: 6, orderLabel: "4C", name: "Overhead Tricep Extension (Cable)", setGroups: [{ sets: 3, reps: "10-15 reps" }] },
    ];
  } else {
    exercises = [
      { order: 1, orderLabel: "1", name: "Face Pull", setGroups: [{ sets: 3, reps: "10-15 reps" }] },
      { order: 2, orderLabel: "2", name: "Dip (Weighted)", setGroups: [{ sets: 3, reps: "8-12 reps" }] },
      {
        order: 3,
        orderLabel: "3",
        name: "AD Press",
        setGroups: [{ sets: 1, reps: "4-6 reps" }, { sets: 2, reps: "8-12 reps" }],
      },
      { order: 4, orderLabel: "4A", name: "Lu Raise", setGroups: [{ sets: 3, reps: "10-15 reps" }] },
      { order: 5, orderLabel: "4B", name: "Cable Crossover", setGroups: [{ sets: 3, reps: "10-15 reps" }] },
      { order: 6, orderLabel: "4C", name: "Overhead Tricep Extension (Cable)", setGroups: [{ sets: 3, reps: "10-15 reps" }] },
    ];
  }

  return { dayNumber: 2, title: "Push", exercises };
}

function buildDay3LegsDensityMV(_week: number): ProgramDay {
  // Same across all weeks — no phase progression on legs day in this variant
  const exercises: ProgramExercise[] = [
    { order: 1, orderLabel: "1", name: "Squat (Barbell)", setGroups: [{ sets: 3, reps: "6-8 reps" }] },
    {
      order: 2,
      orderLabel: "2",
      name: "Romanian Deadlift (Barbell)",
      setGroups: [{ sets: 1, reps: "6-8 reps" }, { sets: 1, reps: "10-15 reps" }],
    },
    { order: 3, orderLabel: "3", name: "Walking Lunge (Dumbbell)", setGroups: [{ sets: 2, reps: "20 reps" }] },
    // NEW
    { order: 4, orderLabel: "4", name: "Leg Extension", setGroups: [{ sets: 2, reps: "12-15 reps" }] },
    // NEW
    { order: 5, orderLabel: "5", name: "Lying Leg Curl", setGroups: [{ sets: 2, reps: "10-12 reps" }] },
    {
      order: 6,
      orderLabel: "6",
      name: "Single Arm Row (Dumbbell)",
      setGroups: [{ sets: 1, reps: "8-10 reps" }, { sets: 1, reps: "10-15 reps" }],
    },
    // NEW
    { order: 7, orderLabel: "7", name: "Lateral Raise (Cable)", setGroups: [{ sets: 2, reps: "12-15 reps" }] },
    { order: 8, orderLabel: "8", name: "Cable Crunch", setGroups: [{ sets: 1, reps: "1+ reps" }] },
    { order: 9, orderLabel: "9", name: "Neck Curl", setGroups: [{ sets: 1, reps: "1+ reps" }] },
  ];

  return { dayNumber: 3, title: "Legs / Density", exercises };
}

function buildDay4PullMV(week: number): ProgramDay {
  let exercises: ProgramExercise[];

  if (week <= 4) {
    exercises = [
      {
        order: 1,
        orderLabel: "1",
        name: "Pull-Up (Neutral Grip, Bodyweight)",
        setGroups: [{ sets: 3, reps: "8-12 reps" }],
      },
      { order: 2, orderLabel: "2", name: "Bent Over Row (Barbell)", setGroups: [{ sets: 3, reps: "8-12 reps" }] },
      {
        order: 3,
        orderLabel: "3A",
        name: "Partial Lateral Raise (Cable)",
        setGroups: [{ sets: 3, reps: "8-15 reps" }],
      },
      // +1 set vs vanilla's 3
      { order: 4, orderLabel: "3B", name: "Hammer Curl (Cable)", setGroups: [{ sets: 4, reps: "8-12 reps" }] },
      // NEW
      { order: 5, orderLabel: "4", name: "Reverse Pec Dec", setGroups: [{ sets: 2, reps: "12-15 reps" }] },
      { order: 6, orderLabel: "5", name: "Farmer's Walk (Weighted)", setGroups: [{ sets: 2, reps: "1+ reps" }] },
      { order: 7, orderLabel: "6", name: "Cardio", setGroups: [{ sets: 1, reps: "10-15 mins" }] },
    ];
  } else if (week <= 8) {
    exercises = [
      {
        order: 1,
        orderLabel: "1",
        name: "Pull-Up (Neutral Grip, Bodyweight)",
        setGroups: [{ sets: 3, reps: "6-8 reps" }],
      },
      { order: 2, orderLabel: "2", name: "Bent Over Row (Barbell)", setGroups: [{ sets: 3, reps: "8-12 reps" }] },
      {
        order: 3,
        orderLabel: "3A",
        name: "Partial Lateral Raise (Cable)",
        setGroups: [{ sets: 3, reps: "8-15 reps" }],
      },
      { order: 4, orderLabel: "3B", name: "Hammer Curl (Cable)", setGroups: [{ sets: 4, reps: "8-12 reps" }] },
      { order: 5, orderLabel: "4", name: "Reverse Pec Dec", setGroups: [{ sets: 2, reps: "12-15 reps" }] },
      { order: 6, orderLabel: "5", name: "Farmer's Walk (Weighted)", setGroups: [{ sets: 2, reps: "1+ reps" }] },
      { order: 7, orderLabel: "6", name: "Cardio", setGroups: [{ sets: 1, reps: "10-15 mins" }] },
    ];
  } else {
    exercises = [
      {
        order: 1,
        orderLabel: "1",
        name: "Pull-Up (Neutral Grip, Bodyweight)",
        setGroups: [{ sets: 3, reps: "4-6 reps" }],
      },
      { order: 2, orderLabel: "2", name: "Bent Over Row (Barbell)", setGroups: [{ sets: 3, reps: "8-12 reps" }] },
      {
        order: 3,
        orderLabel: "3A",
        name: "Partial Lateral Raise (Cable)",
        setGroups: [{ sets: 3, reps: "8-15 reps" }],
      },
      { order: 4, orderLabel: "3B", name: "Hammer Curl (Cable)", setGroups: [{ sets: 4, reps: "8-12 reps" }] },
      { order: 5, orderLabel: "4", name: "Reverse Pec Dec", setGroups: [{ sets: 2, reps: "12-15 reps" }] },
      { order: 6, orderLabel: "5", name: "Farmer's Walk (Weighted)", setGroups: [{ sets: 2, reps: "1+ reps" }] },
      { order: 7, orderLabel: "6", name: "Cardio", setGroups: [{ sets: 1, reps: "10-15 mins" }] },
    ];
  }

  return { dayNumber: 4, title: "Pull", exercises };
}

function buildDay5PushMV(week: number): ProgramDay {
  let exercises: ProgramExercise[];

  if (week <= 4) {
    exercises = [
      { order: 1, orderLabel: "1", name: "Face Pull", setGroups: [{ sets: 3, reps: "10-15 reps" }] },
      // +1 set vs vanilla's 3x8-10
      {
        order: 2,
        orderLabel: "2",
        name: "Incline Bench Press (Dumbbell)",
        setGroups: [{ sets: 4, reps: "8-10 reps" }],
      },
      {
        order: 3,
        orderLabel: "3",
        name: "Seated Shoulder Press (Dumbbell)",
        setGroups: [{ sets: 3, reps: "8-10 reps" }],
      },
      // +1 back-off set vs vanilla's 1+1
      {
        order: 4,
        orderLabel: "4",
        name: "Overhead Tricep Extension (Cable)",
        setGroups: [{ sets: 1, reps: "8-10 reps" }, { sets: 2, reps: "12-15 reps" }],
      },
      { order: 5, orderLabel: "5", name: "Lateral Raise (Cable)", setGroups: [{ sets: 3, reps: "8-12 reps" }] },
      // NEW
      { order: 6, orderLabel: "6", name: "Spider Curl", setGroups: [{ sets: 2, reps: "10-12 reps" }] },
      { order: 7, orderLabel: "7", name: "Neck Curl", setGroups: [{ sets: 1, reps: "1+ reps" }] },
    ];
  } else if (week <= 8) {
    exercises = [
      { order: 1, orderLabel: "1", name: "Face Pull", setGroups: [{ sets: 3, reps: "10-15 reps" }] },
      {
        order: 2,
        orderLabel: "2",
        name: "Incline Bench Press (Dumbbell)",
        setGroups: [{ sets: 1, reps: "6-8 reps" }, { sets: 3, reps: "8-10 reps" }],
      },
      {
        order: 3,
        orderLabel: "3",
        name: "Seated Shoulder Press (Dumbbell)",
        setGroups: [{ sets: 1, reps: "6-8 reps" }, { sets: 2, reps: "8-10 reps" }],
      },
      {
        order: 4,
        orderLabel: "4",
        name: "Overhead Tricep Extension (Cable)",
        setGroups: [{ sets: 1, reps: "8-10 reps" }, { sets: 2, reps: "12-15 reps" }],
      },
      { order: 5, orderLabel: "5", name: "Lateral Raise (Cable)", setGroups: [{ sets: 3, reps: "8-12 reps" }] },
      { order: 6, orderLabel: "6", name: "Spider Curl", setGroups: [{ sets: 2, reps: "10-12 reps" }] },
      { order: 7, orderLabel: "7", name: "Neck Curl", setGroups: [{ sets: 1, reps: "1+ reps" }] },
    ];
  } else {
    exercises = [
      { order: 1, orderLabel: "1", name: "Face Pull", setGroups: [{ sets: 3, reps: "10-15 reps" }] },
      {
        order: 2,
        orderLabel: "2",
        name: "Incline Bench Press (Dumbbell)",
        setGroups: [
          { sets: 1, reps: "4-6 reps" },
          { sets: 1, reps: "6-8 reps" },
          { sets: 2, reps: "8-10 reps" },
        ],
      },
      {
        order: 3,
        orderLabel: "3",
        name: "Seated Shoulder Press (Dumbbell)",
        setGroups: [
          { sets: 1, reps: "4-6 reps" },
          { sets: 1, reps: "6-8 reps" },
          { sets: 1, reps: "8-10 reps" },
        ],
      },
      {
        order: 4,
        orderLabel: "4",
        name: "Overhead Tricep Extension (Cable)",
        setGroups: [{ sets: 1, reps: "8-10 reps" }, { sets: 2, reps: "12-15 reps" }],
      },
      { order: 5, orderLabel: "5", name: "Lateral Raise (Cable)", setGroups: [{ sets: 3, reps: "8-12 reps" }] },
      { order: 6, orderLabel: "6", name: "Spider Curl", setGroups: [{ sets: 2, reps: "10-12 reps" }] },
      { order: 7, orderLabel: "7", name: "Neck Curl", setGroups: [{ sets: 1, reps: "1+ reps" }] },
    ];
  }

  return { dayNumber: 5, title: "Push", exercises };
}
