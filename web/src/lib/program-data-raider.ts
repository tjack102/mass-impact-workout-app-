// Raider -- Bald Omni-Man's 4-Day Upper/Lower (12 weeks)
// Compounds progress week-to-week (reps drop, RPE ramps in 3-week waves).
// Accessories stay the same across all 12 weeks.
// Exercise names must match exercise-library.ts exactly for volume tracking.

import type { ProgramExercise } from "./program-data";
import { getDefaultRestSeconds } from "./program-data";

// ─────────────────────────────────────────────
// Compound progression tables: [sets, reps, rpe] per week (1-12)
// ─────────────────────────────────────────────
type P = [sets: number, reps: string, rpe: string];

// Day 1: Bench Press (Barbell)
const BENCH: P[] = [
  [4,"12","7"], [4,"12","8"], [4,"12","9"],  // wk 1-3
  [4,"10","7"], [4,"10","8"], [4,"10","9"],  // wk 4-6
  [4,"8","7"],  [4,"8","8"],  [4,"8","9"],   // wk 7-9
  [4,"5","7"],  [4,"5","8"],  [4,"5","10"],  // wk 10-12
];

// Day 2: Deadlift
const DEADLIFT: P[] = [
  [3,"9","7"], [3,"9","8"], [3,"9","9"],     // wk 1-3
  [3,"7","6"], [3,"7","7"], [3,"7","8"],     // wk 4-6
  [3,"7","9"], [3,"5","6"], [3,"5","7"],     // wk 7-9
  [3,"5","8"], [3,"5","7"], [3,"5","10"],    // wk 10-12
];

// Day 3: Standing Barbell Shoulder Press
const OHP: P[] = [
  [4,"12","7"], [4,"12","8"], [4,"12","9"],  // wk 1-3
  [4,"10","7"], [4,"10","8"], [4,"10","9"],  // wk 4-6
  [4,"8","7"],  [4,"8","8"],  [4,"8","9"],   // wk 7-9
  [4,"5","7"],  [4,"5","8"],  [4,"5","10"],  // wk 10-12
];

// Day 4: Squat (Barbell)
const SQUAT: P[] = [
  [3,"9","7"], [3,"9","8"], [3,"9","7"],     // wk 1-3
  [3,"7","9"], [3,"7","7"], [3,"7","8"],     // wk 4-6
  [3,"7","7"], [3,"5","9"], [3,"5","7"],     // wk 7-9
  [3,"5","8"], [3,"5","7"], [3,"5","10"],    // wk 10-12
];

// ─────────────────────────────────────────────
// Static accessories per day (identical every week)
// ─────────────────────────────────────────────
interface StaticExercise {
  orderLabel: string;
  name: string;
  sets: number;
  reps: string;
  supersetGroup?: string;
}

const DAY1_ACCESSORIES: StaticExercise[] = [
  { orderLabel: "2", name: "Rear Delt Fly (Dumbbell)", sets: 3, reps: "10-15" },
  { orderLabel: "3A", name: "Bicep Curl (Barbell)", sets: 3, reps: "8-12", supersetGroup: "ss-1" },
  { orderLabel: "3B", name: "Tricep Pushdown", sets: 3, reps: "AMRAP", supersetGroup: "ss-1" },
  { orderLabel: "4", name: "Lateral Raise (Dumbbell)", sets: 3, reps: "AMRAP" },
  { orderLabel: "5", name: "Pushup", sets: 2, reps: "15-20" },
];

const DAY2_ACCESSORIES: StaticExercise[] = [
  { orderLabel: "2", name: "Pull-Up (Bodyweight)", sets: 3, reps: "12-15" },
  { orderLabel: "3", name: "Inverted Row (Bodyweight)", sets: 3, reps: "12-15" },
  { orderLabel: "4", name: "Seated Hamstring Curl", sets: 3, reps: "8-12" },
  { orderLabel: "5", name: "Leg Extension", sets: 2, reps: "8-12" },
];

const DAY3_ACCESSORIES: StaticExercise[] = [
  { orderLabel: "2", name: "Reverse Pec Dec", sets: 3, reps: "10-15" },
  { orderLabel: "3A", name: "Hammer Curl", sets: 3, reps: "8-12", supersetGroup: "ss-1" },
  { orderLabel: "3B", name: "Dip (Weighted)", sets: 3, reps: "AMRAP", supersetGroup: "ss-1" },
  { orderLabel: "4", name: "Lateral Raise (Cable)", sets: 3, reps: "AMRAP" },
  { orderLabel: "5", name: "Seated Shoulder Press (Dumbbell)", sets: 2, reps: "15-20" },
];

const DAY4_ACCESSORIES: StaticExercise[] = [
  { orderLabel: "2", name: "Chest-Supported Row", sets: 3, reps: "12-15" },
  { orderLabel: "3", name: "Leg Press", sets: 3, reps: "6-12" },
  { orderLabel: "4", name: "Hip Thrust (Barbell)", sets: 3, reps: "6-10" },
];

// ─────────────────────────────────────────────
// Day definitions: compound name + progression + accessories
// ─────────────────────────────────────────────
const DAYS = [
  { title: "Upper 1", compound: "Bench Press (Barbell)", progression: BENCH, accessories: DAY1_ACCESSORIES },
  { title: "Lower 1", compound: "Deadlift", progression: DEADLIFT, accessories: DAY2_ACCESSORIES },
  { title: "Upper 2", compound: "Standing Barbell Shoulder Press", progression: OHP, accessories: DAY3_ACCESSORIES },
  { title: "Lower 2", compound: "Squat (Barbell)", progression: SQUAT, accessories: DAY4_ACCESSORIES },
] as const;

// ─────────────────────────────────────────────
// Public API
// ─────────────────────────────────────────────
export function getRaiderExercisesForDay(
  dayNumber: number,
  weekNumber: number,
): ProgramExercise[] {
  const day = DAYS[dayNumber - 1];
  if (!day || weekNumber < 1 || weekNumber > 12) return [];

  const [sets, reps, rpe] = day.progression[weekNumber - 1];

  const compound: ProgramExercise = {
    order: 1,
    orderLabel: "1",
    name: day.compound,
    setGroups: [{ sets, reps }],
    restSeconds: getDefaultRestSeconds(day.compound),
  };

  const accessories: ProgramExercise[] = day.accessories.map((a, i) => ({
    order: i + 2,
    orderLabel: a.orderLabel,
    name: a.name,
    setGroups: [{ sets: a.sets, reps: a.reps }],
    restSeconds: getDefaultRestSeconds(a.name),
    supersetGroup: a.supersetGroup,
  }));

  return [compound, ...accessories];
}

export function getRaiderDayTitle(dayNumber: number): string {
  return DAYS[dayNumber - 1]?.title ?? `Day ${dayNumber}`;
}
