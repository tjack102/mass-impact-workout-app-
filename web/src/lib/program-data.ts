export type ExerciseSet = {
  sets: number;
  reps: string;
};

export type ProgramExercise = {
  order: number;
  orderLabel: string;
  name: string;
  setGroups: ExerciseSet[];
  restSeconds?: number;
  // Used by programs with paired exercises (e.g. "1A"/"1B"). Mass Impact doesn't use this.
  supersetGroup?: string;
  notes?: string;
  prescribedWeight?: number;  // calculated weight suggestion for RP programs
  rirTarget?: string;         // e.g. "3/fail", "2/fail", "1/fail"
};

export type ProgramDay = {
  dayNumber: number;
  title: string;
  exercises: ProgramExercise[];
};

export type ProgramWeek = {
  weekNumber: number;
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

export function cloneProgram(program: Program): Program {
  return {
    ...program,
    weeks: program.weeks.map((week) => ({
      ...week,
      days: week.days.map((day) => ({
        ...day,
        exercises: day.exercises.map((exercise) => ({
          ...exercise,
          setGroups: exercise.setGroups.map((group) => ({ ...group })),
        })),
      })),
    })),
  };
}

export function getDayForWeek(weekNumber: number, dayNumber: number): ProgramDay | undefined {
  const week = MASS_IMPACT_PROGRAM.weeks.find((item) => item.weekNumber === weekNumber);
  return week?.days.find((day) => day.dayNumber === dayNumber);
}

export function getDefaultRestSeconds(exerciseName: string): number {
  const name = exerciseName.toLowerCase();
  if (name.includes("cardio")) {
    return 0;
  }
  if (name.includes("squat") || name.includes("deadlift") || name.includes("row (barbell)")) {
    return 120;
  }
  if (name.includes("press") || name.includes("pull-up") || name.includes("dip")) {
    return 90;
  }
  if (name.includes("curl") || name.includes("raise") || name.includes("fly") || name.includes("crunch")) {
    return 60;
  }
  return 75;
}

export function getRestSecondsForExercise(exercise: Pick<ProgramExercise, "name" | "restSeconds">): number {
  return exercise.restSeconds ?? getDefaultRestSeconds(exercise.name);
}

export function getTotalSets(exercise: ProgramExercise): number {
  return exercise.setGroups.reduce((sum, group) => sum + group.sets, 0);
}

export function formatScheme(exercise: ProgramExercise): string {
  if (exercise.setGroups.length === 1) {
    const group = exercise.setGroups[0];
    return `${group.sets} x ${group.reps}`;
  }
  return exercise.setGroups.map((group) => `${group.sets} x ${group.reps}`).join(", ");
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
  for (let week = 1; week <= 12; week += 1) {
    weeks.push({ weekNumber: week, days: buildWeekDays(week) });
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

function buildDay1Pull(week: number): ProgramDay {
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
      {
        order: 2,
        orderLabel: "2",
        name: "Pull-Up (Bodyweight)",
        setGroups: [{ sets: 3, reps: "6-8 reps" }, { sets: 1, reps: "8-12 reps" }],
      },
      { order: 3, orderLabel: "3", name: "Power Shrug", setGroups: [{ sets: 3, reps: "8-12 reps" }] },
      { order: 4, orderLabel: "4", name: "Standing Pullover (Cable)", setGroups: [{ sets: 3, reps: "10-12 reps" }] },
      { order: 5, orderLabel: "5A", name: "Rear Delt Fly (Cable)", setGroups: [{ sets: 2, reps: "10-15 reps" }] },
      { order: 6, orderLabel: "5B", name: "Incline Curl (Dumbbell)", setGroups: [{ sets: 2, reps: "8-10 reps" }] },
      { order: 7, orderLabel: "6", name: "Cardio", setGroups: [{ sets: 1, reps: "15-20 mins" }] },
    ];
  } else {
    exercises = [
      { order: 1, orderLabel: "1", name: "Single Arm Row (Cable)", setGroups: [{ sets: 4, reps: "6-10 reps" }] },
      {
        order: 2,
        orderLabel: "2",
        name: "Pull-Up (Bodyweight)",
        setGroups: [{ sets: 3, reps: "4-6 reps" }, { sets: 1, reps: "8-12 reps" }],
      },
      { order: 3, orderLabel: "3", name: "Power Shrug", setGroups: [{ sets: 3, reps: "8-12 reps" }] },
      { order: 4, orderLabel: "4", name: "Standing Pullover (Cable)", setGroups: [{ sets: 3, reps: "8-10 reps" }] },
      { order: 5, orderLabel: "5A", name: "Rear Delt Fly (Cable)", setGroups: [{ sets: 2, reps: "10-15 reps" }] },
      { order: 6, orderLabel: "5B", name: "Incline Curl (Dumbbell)", setGroups: [{ sets: 2, reps: "8-10 reps" }] },
      { order: 7, orderLabel: "6", name: "Cardio", setGroups: [{ sets: 1, reps: "15-20 mins" }] },
    ];
  }

  return { dayNumber: 1, title: "Pull", exercises };
}

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
      {
        order: 3,
        orderLabel: "3",
        name: "AD Press",
        setGroups: [{ sets: 1, reps: "6-8 reps" }, { sets: 2, reps: "8-12 reps" }],
      },
      { order: 4, orderLabel: "4A", name: "Lu Raise", setGroups: [{ sets: 2, reps: "10-15 reps" }] },
      { order: 5, orderLabel: "4B", name: "Cable Crossover", setGroups: [{ sets: 2, reps: "10-15 reps" }] },
      { order: 6, orderLabel: "4C", name: "Overhead Tricep Extension (Cable)", setGroups: [{ sets: 2, reps: "10-15 reps" }] },
    ];
  } else {
    exercises = [
      { order: 1, orderLabel: "1", name: "Face Pull", setGroups: [{ sets: 3, reps: "10-15 reps" }] },
      { order: 2, orderLabel: "2", name: "Dip (Weighted)", setGroups: [{ sets: 2, reps: "8-12 reps" }] },
      {
        order: 3,
        orderLabel: "3",
        name: "AD Press",
        setGroups: [{ sets: 1, reps: "4-6 reps" }, { sets: 2, reps: "8-12 reps" }],
      },
      { order: 4, orderLabel: "4A", name: "Lu Raise", setGroups: [{ sets: 2, reps: "10-15 reps" }] },
      { order: 5, orderLabel: "4B", name: "Cable Crossover", setGroups: [{ sets: 2, reps: "10-15 reps" }] },
      { order: 6, orderLabel: "4C", name: "Overhead Tricep Extension (Cable)", setGroups: [{ sets: 2, reps: "10-15 reps" }] },
    ];
  }

  return { dayNumber: 2, title: "Push", exercises };
}

function buildDay3LegsDensity(week: number): ProgramDay {
  let exercises: ProgramExercise[];

  if (week <= 4) {
    exercises = [
      { order: 1, orderLabel: "1", name: "Squat (Barbell)", setGroups: [{ sets: 3, reps: "6-8 reps" }] },
      {
        order: 2,
        orderLabel: "2",
        name: "Romanian Deadlift (Barbell)",
        setGroups: [{ sets: 1, reps: "6-8 reps" }, { sets: 1, reps: "10-15 reps" }],
      },
      { order: 3, orderLabel: "3", name: "Walking Lunge (Dumbbell)", setGroups: [{ sets: 2, reps: "20 reps" }] },
      {
        order: 4,
        orderLabel: "4",
        name: "Single Arm Row (Dumbbell)",
        setGroups: [{ sets: 1, reps: "8-10 reps" }, { sets: 1, reps: "10-15 reps" }],
      },
      { order: 5, orderLabel: "5", name: "Cable Crunch", setGroups: [{ sets: 1, reps: "1+ reps" }] },
      { order: 6, orderLabel: "6", name: "Neck Curl", setGroups: [{ sets: 1, reps: "1+ reps" }] },
    ];
  } else {
    exercises = [
      { order: 1, orderLabel: "1", name: "Squat (Barbell)", setGroups: [{ sets: 3, reps: "6-8 reps" }] },
      {
        order: 2,
        orderLabel: "2",
        name: "Romanian Deadlift (Barbell)",
        setGroups: [{ sets: 1, reps: "6-8 reps" }, { sets: 1, reps: "10-15 reps" }],
      },
      { order: 3, orderLabel: "3", name: "Walking Lunge (Dumbbell)", setGroups: [{ sets: 2, reps: "20 reps" }] },
      {
        order: 4,
        orderLabel: "4",
        name: "Single Arm Row (Dumbbell)",
        setGroups: [{ sets: 1, reps: "8-10 reps" }, { sets: 1, reps: "10-15 reps" }],
      },
      { order: 5, orderLabel: "5", name: "Cable Crunch", setGroups: [{ sets: 1, reps: "1+ reps" }] },
      { order: 6, orderLabel: "6", name: "Neck Curl", setGroups: [{ sets: 1, reps: "1+ reps" }] },
    ];
  }

  return { dayNumber: 3, title: "Legs / Density", exercises };
}

function buildDay4Pull(week: number): ProgramDay {
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
      { order: 4, orderLabel: "3B", name: "Hammer Curl (Cable)", setGroups: [{ sets: 3, reps: "8-12 reps" }] },
      { order: 5, orderLabel: "4", name: "Farmer's Walk (Weighted)", setGroups: [{ sets: 2, reps: "1+ reps" }] },
      { order: 6, orderLabel: "5", name: "Cardio", setGroups: [{ sets: 1, reps: "10-15 mins" }] },
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
      { order: 4, orderLabel: "3B", name: "Hammer Curl (Cable)", setGroups: [{ sets: 3, reps: "8-12 reps" }] },
      { order: 5, orderLabel: "4", name: "Farmer's Walk (Weighted)", setGroups: [{ sets: 2, reps: "1+ reps" }] },
      { order: 6, orderLabel: "5", name: "Cardio", setGroups: [{ sets: 1, reps: "10-15 mins" }] },
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
      { order: 4, orderLabel: "3B", name: "Hammer Curl (Cable)", setGroups: [{ sets: 3, reps: "8-12 reps" }] },
      { order: 5, orderLabel: "4", name: "Farmer's Walk (Weighted)", setGroups: [{ sets: 2, reps: "1+ reps" }] },
      { order: 6, orderLabel: "5", name: "Cardio", setGroups: [{ sets: 1, reps: "10-15 mins" }] },
    ];
  }

  return { dayNumber: 4, title: "Pull", exercises };
}

function buildDay5Push(week: number): ProgramDay {
  let exercises: ProgramExercise[];

  if (week <= 4) {
    exercises = [
      { order: 1, orderLabel: "1", name: "Face Pull", setGroups: [{ sets: 3, reps: "10-15 reps" }] },
      {
        order: 2,
        orderLabel: "2",
        name: "Incline Bench Press (Dumbbell)",
        setGroups: [{ sets: 3, reps: "8-10 reps" }],
      },
      {
        order: 3,
        orderLabel: "3",
        name: "Seated Shoulder Press (Dumbbell)",
        setGroups: [{ sets: 3, reps: "8-10 reps" }],
      },
      {
        order: 4,
        orderLabel: "4",
        name: "Overhead Tricep Extension (Cable)",
        setGroups: [{ sets: 1, reps: "8-10 reps" }, { sets: 1, reps: "12-15 reps" }],
      },
      { order: 5, orderLabel: "5", name: "Lateral Raise (Cable)", setGroups: [{ sets: 3, reps: "8-12 reps" }] },
      { order: 6, orderLabel: "6", name: "Neck Curl", setGroups: [{ sets: 1, reps: "1+ reps" }] },
    ];
  } else if (week <= 8) {
    exercises = [
      { order: 1, orderLabel: "1", name: "Face Pull", setGroups: [{ sets: 3, reps: "10-15 reps" }] },
      {
        order: 2,
        orderLabel: "2",
        name: "Incline Bench Press (Dumbbell)",
        setGroups: [{ sets: 1, reps: "6-8 reps" }, { sets: 2, reps: "8-10 reps" }],
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
        setGroups: [{ sets: 1, reps: "8-10 reps" }, { sets: 1, reps: "12-15 reps" }],
      },
      { order: 5, orderLabel: "5", name: "Lateral Raise (Cable)", setGroups: [{ sets: 3, reps: "8-12 reps" }] },
      { order: 6, orderLabel: "6", name: "Neck Curl", setGroups: [{ sets: 1, reps: "1+ reps" }] },
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
          { sets: 1, reps: "8-10 reps" },
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
        setGroups: [{ sets: 1, reps: "8-10 reps" }, { sets: 1, reps: "12-15 reps" }],
      },
      { order: 5, orderLabel: "5", name: "Lateral Raise (Cable)", setGroups: [{ sets: 3, reps: "8-12 reps" }] },
      { order: 6, orderLabel: "6", name: "Neck Curl", setGroups: [{ sets: 1, reps: "1+ reps" }] },
    ];
  }

  return { dayNumber: 5, title: "Push", exercises };
}
