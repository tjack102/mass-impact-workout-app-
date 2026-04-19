// KONG: Savage Size in 12 Weeks by Alex Bromley
// 12-week, 5-day/week program with 3 phases (4 weeks each)
// Phase 1 (Wk 1-4): Hypertrophy base — high reps, low RPE
// Phase 2 (Wk 5-8): Volume ramp — moderate reps, rising RPE
// Phase 3 (Wk 9-12): Strength peak — low reps, top sets
// Exercise names must match exercise-library.ts exactly for volume tracking to work.

import type { ProgramExercise } from "./program-data";
import { getDefaultRestSeconds } from "./program-data";

// [sets, reps, rpe] for each of the 4 weeks within a phase
type P = [sets: number, reps: string, rpe: string];

interface KongExerciseDef {
  name: string;           // Canonical exercise-library.ts name
  weeks: P[];             // 4 entries, one per week in the phase
  notes?: string;
}

interface KongDayDef {
  title: string;
  exercises: KongExerciseDef[];
}

// ════════════════════════════════════════════════════════════════
// Phase 1 — Weeks 1-4: Hypertrophy Base
// ════════════════════════════════════════════════════════════════

const PHASE1: KongDayDef[] = [
  // Day 1: Triceps/Shoulders/Chest
  {
    title: "Triceps/Shoulders/Chest",
    exercises: [
      { name: "JM Press",                         weeks: [[2,"15","7"],[3,"12","5"],[4,"12","5"],[4,"10","5"]] },
      { name: "Skull Crusher",                     weeks: [[2,"15","7"],[3,"12","5"],[3,"12","5"],[3,"10","5"]] },
      { name: "Tricep Pushdown",                   weeks: [[2,"20","7"],[3,"15","5"],[3,"15","5"],[3,"12","5"]] },
      { name: "Front Raise (Dumbbell)",            weeks: [[2,"15","7"],[3,"12","5"],[4,"12","5"],[4,"10","5"]] },
      { name: "Upright Row (Barbell)",             weeks: [[2,"15","7"],[3,"12","5"],[3,"12","5"],[3,"10","5"]] },
      { name: "Incline Bench Press (Barbell)",     weeks: [[2,"15","7"],[3,"12","5"],[3,"12","5"],[3,"10","5"]] },
      { name: "Chest Press (Machine)",             weeks: [[2,"15","7"],[3,"12","5"],[3,"12","5"],[3,"10","5"]] },
      { name: "Cable Crossover",                   weeks: [[2,"20","7"],[3,"15","5"],[3,"15","5"],[3,"12","5"]] },
    ],
  },

  // Day 2: Legs
  {
    title: "Legs",
    exercises: [
      { name: "Seated Hamstring Curl",             weeks: [[2,"20","7"],[3,"15","5"],[3,"15","5"],[3,"12","5"]] },
      { name: "Romanian Deadlift (Barbell)",       weeks: [[2,"15","7"],[3,"12","5"],[4,"12","5"],[4,"10","5"]] },
      { name: "Leg Press",                         weeks: [[2,"15","7"],[3,"12","5"],[3,"12","5"],[3,"10","5"]] },
      { name: "Walking Lunge (Dumbbell)",          weeks: [[2,"12","7"],[3,"12","5"],[3,"12","5"],[3,"10","5"]], notes: "Do target reps each side" },
      { name: "Leg Extension",                     weeks: [[2,"15","7"],[3,"12","5"],[4,"12","5"],[4,"12","5"]] },
    ],
  },

  // Day 3: Shoulders/Back/Biceps
  {
    title: "Shoulders/Back/Biceps",
    exercises: [
      { name: "Standing Barbell Shoulder Press",   weeks: [[2,"15","7"],[3,"12","5"],[4,"12","5"],[4,"12","5"]] },
      { name: "Lateral Raise (Cable)",             weeks: [[2,"15","7"],[3,"12","5"],[3,"12","5"],[3,"12","5"]] },
      { name: "Single Arm Row (Dumbbell)",         weeks: [[2,"20","7"],[3,"15","5"],[3,"15","5"],[3,"15","5"]] },
      { name: "Lat Pulldown",                      weeks: [[2,"15","7"],[3,"12","5"],[4,"12","5"],[4,"12","5"]] },
      { name: "Hammer Curl",                       weeks: [[2,"15","7"],[3,"12","5"],[3,"12","5"],[3,"12","5"]] },
      { name: "EZ Bar Curl",                       weeks: [[2,"21","7"],[3,"21","5"],[3,"21","5"],[3,"21","5"]] },
    ],
  },

  // Day 4: Legs
  {
    title: "Legs",
    exercises: [
      { name: "Leg Extension",                     weeks: [[2,"20","7"],[3,"15","5"],[3,"15","5"],[3,"15","5"]] },
      { name: "Squat (Barbell)",                   weeks: [[2,"15","7"],[3,"12","5"],[4,"12","5"],[4,"12","5"]] },
      { name: "Back Extension (Weighted)",         weeks: [[2,"15","7"],[3,"12","5"],[3,"12","5"],[3,"12","5"]] },
      { name: "Leg Press",                         weeks: [[2,"15","7"],[3,"12","5"],[3,"12","5"],[3,"12","5"]] },
      { name: "Seated Hamstring Curl",             weeks: [[2,"15","7"],[3,"12","5"],[4,"12","5"],[4,"12","5"]] },
    ],
  },

  // Day 5: Biceps/Back/Triceps
  {
    title: "Biceps/Back/Triceps",
    exercises: [
      { name: "Bicep Curl (Barbell)",              weeks: [[2,"15","7"],[3,"12","5"],[4,"12","5"],[4,"12","5"]] },
      { name: "Alternating Dumbbell Curl",         weeks: [[2,"15","7"],[3,"12","5"],[3,"12","5"],[3,"12","5"]] },
      { name: "Concentration Curl",                weeks: [[2,"15","7"],[3,"12","5"],[3,"12","5"],[3,"12","5"]] },
      { name: "Seated Row (Cable)",                weeks: [[2,"15","7"],[3,"12","5"],[3,"12","5"],[3,"12","5"]] },
      { name: "Lat Pulldown",                      weeks: [[2,"15","7"],[3,"12","5"],[3,"12","5"],[3,"12","5"]] },
      { name: "Dip (Weighted)",                    weeks: [[2,"15","7"],[3,"12","5"],[4,"12","5"],[4,"12","5"]] },
      { name: "Rope Pushdown",                     weeks: [[2,"20","7"],[3,"15","5"],[3,"15","5"],[3,"15","5"]] },
    ],
  },
];

// ════════════════════════════════════════════════════════════════
// Phase 2 — Weeks 5-8: Volume Ramp
// ════════════════════════════════════════════════════════════════

const PHASE2: KongDayDef[] = [
  // Day 1: Shoulders/Triceps
  {
    title: "Shoulders/Triceps",
    exercises: [
      { name: "Seated Barbell Shoulder Press",         weeks: [[5,"12","7"],[5,"10","8"],[6,"10","8"],[6,"8","9"]] },
      { name: "Seated Shoulder Press (Dumbbell)",      weeks: [[3,"12","7"],[3,"12","8"],[4,"10","8"],[4,"10","9"]] },
      { name: "Lateral Raise (Dumbbell)",              weeks: [[3,"12","7"],[3,"12","8"],[4,"10","8"],[4,"10","9"]] },
      { name: "Dip (Weighted)",                        weeks: [[3,"12","7"],[3,"12","8"],[4,"10","8"],[4,"10","9"]] },
      { name: "Skull Crusher",                         weeks: [[3,"12","7"],[3,"12","8"],[4,"10","8"],[4,"10","9"]] },
      { name: "Tricep Pushdown",                       weeks: [[3,"12","7"],[3,"12","8"],[4,"10","8"],[4,"10","9"]] },
    ],
  },

  // Day 2: Posterior Chain/Legs
  {
    title: "Posterior Chain/Legs",
    exercises: [
      { name: "Stiff-Legged Deadlift",                weeks: [[5,"12","7"],[5,"10","8"],[6,"10","8"],[6,"8","9"]] },
      { name: "Back Extension (Weighted)",             weeks: [[3,"12","7"],[3,"12","8"],[4,"10","8"],[4,"10","9"]] },
      { name: "Leg Extension",                         weeks: [[3,"12","7"],[3,"12","8"],[4,"10","8"],[4,"10","9"]] },
      { name: "Bulgarian Split Squat",                 weeks: [[3,"12","7"],[3,"12","8"],[4,"10","8"],[4,"10","9"]] },
      { name: "Leg Press",                             weeks: [[3,"12","7"],[3,"12","8"],[4,"10","8"],[4,"10","9"]] },
      { name: "Seated Hamstring Curl",                 weeks: [[3,"12","7"],[3,"12","8"],[4,"10","8"],[4,"10","9"]] },
    ],
  },

  // Day 3: Back/Biceps
  {
    title: "Back/Biceps",
    exercises: [
      { name: "Bent Over Row (Barbell)",               weeks: [[5,"12","7"],[5,"10","8"],[6,"10","8"],[6,"8","9"]] },
      { name: "Seated Wide-Grip Row (Cable)",          weeks: [[3,"12","7"],[3,"12","8"],[4,"10","8"],[4,"10","9"]] },
      { name: "Half Kneeling One-Arm Lat Pulldown",    weeks: [[3,"12","7"],[3,"12","8"],[4,"10","8"],[4,"10","9"]] },
      { name: "Dumbbell Pullover",                     weeks: [[3,"12","7"],[3,"12","8"],[4,"10","8"],[4,"10","9"]] },
      { name: "Preacher Curl (Barbell)",               weeks: [[3,"12","7"],[3,"12","8"],[4,"10","8"],[4,"10","9"]] },
      { name: "Alternating Dumbbell Curl",             weeks: [[3,"12","7"],[3,"12","8"],[4,"10","8"],[4,"10","9"]] },
      { name: "Standard Cable Curl",                   weeks: [[3,"12","7"],[3,"12","8"],[4,"10","8"],[4,"10","9"]] },
    ],
  },

  // Day 4: Chest/Triceps
  {
    title: "Chest/Triceps",
    exercises: [
      { name: "Close Grip Bench Press",                weeks: [[5,"12","7"],[5,"10","8"],[6,"10","8"],[6,"8","9"]] },
      { name: "Incline Bench Press (Barbell)",         weeks: [[3,"12","7"],[3,"12","8"],[4,"10","8"],[4,"10","9"]], notes: "Use Wide Grip" },
      { name: "Chest Press (Machine)",                 weeks: [[3,"12","7"],[3,"12","8"],[4,"10","8"],[4,"10","9"]] },
      { name: "Flat Dumbbell Flye",                    weeks: [[3,"12","7"],[3,"12","8"],[4,"10","8"],[4,"10","9"]] },
      { name: "Dip (Weighted)",                        weeks: [[3,"12","7"],[3,"12","8"],[4,"10","8"],[4,"10","9"]] },
      { name: "Standing Overhead Extension",           weeks: [[3,"12","7"],[3,"12","8"],[4,"10","8"],[4,"10","9"]] },
    ],
  },

  // Day 5: Quads/Legs
  {
    title: "Quads/Legs",
    exercises: [
      { name: "Squat (Barbell)",                       weeks: [[5,"12","7"],[5,"10","8"],[6,"10","8"],[6,"8","9"]], notes: "Close-Stance Squat" },
      { name: "Hack Squat",                            weeks: [[3,"12","7"],[3,"12","8"],[4,"10","8"],[4,"10","9"]] },
      { name: "Step-Up (High Box)",                    weeks: [[3,"12","7"],[3,"12","8"],[4,"10","8"],[4,"10","9"]] },
      { name: "Romanian Deadlift (Dumbbell)",          weeks: [[3,"12","7"],[3,"12","8"],[4,"10","8"],[4,"10","9"]] },
      { name: "Back Extension (Weighted)",             weeks: [[3,"12","7"],[3,"12","8"],[4,"10","8"],[4,"10","9"]] },
    ],
  },
];

// ════════════════════════════════════════════════════════════════
// Phase 3 — Weeks 9-12: Strength Peak
// ════════════════════════════════════════════════════════════════

const PHASE3: KongDayDef[] = [
  // Day 1: Press/Triceps
  {
    title: "Press/Triceps",
    exercises: [
      { name: "Push Press (Barbell)",                  weeks: [[5,"5","7"],[5,"5","8"],[5,"3","8"],[5,"1","9"]], notes: "Work up to a Top Set for the first set" },
      { name: "Seated Barbell Shoulder Press",         weeks: [[4,"5","7"],[4,"5","8"],[4,"5","8"],[4,"5","9"]] },
      { name: "Dip (Weighted)",                        weeks: [[4,"5","7"],[4,"5","8"],[4,"5","8"],[4,"5","9"]] },
      { name: "Skull Crusher",                         weeks: [[3,"8","7"],[3,"8","8"],[3,"8","8"],[3,"8","9"]] },
      { name: "Tricep Pushdown",                       weeks: [[3,"12","7"],[3,"12","8"],[3,"12","8"],[3,"12","9"]] },
    ],
  },

  // Day 2: Hinge/Posterior
  {
    title: "Hinge/Posterior",
    exercises: [
      { name: "Deadlift",                             weeks: [[5,"5","7"],[5,"5","8"],[5,"3","8"],[5,"1","9"]], notes: "Work up to a Top Set for the first set" },
      { name: "Good Morning",                         weeks: [[4,"5","7"],[4,"5","8"],[4,"5","8"],[4,"5","9"]], notes: "Paused -- do a 2-count pause for each rep" },
      { name: "Step-Up (High Box)",                    weeks: [[3,"8","7"],[3,"8","8"],[3,"8","8"],[3,"8","9"]] },
      { name: "Back Extension (Weighted)",             weeks: [[3,"12","7"],[3,"12","8"],[3,"12","8"],[3,"12","9"]] },
    ],
  },

  // Day 3: Pull/Biceps
  {
    title: "Pull/Biceps",
    exercises: [
      { name: "Pendlay Row",                          weeks: [[5,"5","7"],[5,"5","8"],[5,"3","8"],[5,"1","9"]], notes: "Work up to a Top Set for the first set" },
      { name: "T-Bar Row",                            weeks: [[4,"5","7"],[4,"5","8"],[4,"5","8"],[4,"5","9"]] },
      { name: "Lat Pulldown",                         weeks: [[3,"8","7"],[3,"8","8"],[3,"8","8"],[3,"8","9"]] },
      { name: "Bicep Curl (Barbell)",                  weeks: [[4,"5","7"],[4,"5","8"],[4,"5","8"],[4,"5","9"]] },
      { name: "Alternating Dumbbell Curl",             weeks: [[3,"8","7"],[3,"8","8"],[3,"8","8"],[3,"8","9"]] },
    ],
  },

  // Day 4: Bench/Chest/Triceps
  {
    title: "Bench/Chest/Triceps",
    exercises: [
      { name: "Wide Grip Bench Press",                 weeks: [[5,"5","7"],[5,"5","8"],[5,"3","8"],[5,"1","9"]], notes: "Work up to a Top Set for the first set" },
      { name: "Floor Press (Barbell)",                 weeks: [[4,"5","7"],[4,"5","8"],[4,"5","8"],[4,"5","9"]], notes: "Use Close Grip" },
      { name: "Flat Dumbbell Press",                   weeks: [[3,"8","7"],[3,"8","8"],[3,"8","8"],[3,"8","9"]], notes: "Use Neutral Grip" },
      { name: "Dip (Weighted)",                        weeks: [[4,"5","7"],[4,"5","8"],[4,"5","8"],[4,"5","9"]] },
      { name: "Rope Pushdown",                         weeks: [[3,"12","7"],[3,"12","8"],[3,"12","8"],[3,"12","9"]] },
    ],
  },

  // Day 5: Squat/Quads
  {
    title: "Squat/Quads",
    exercises: [
      { name: "Squat (Barbell)",                       weeks: [[5,"5","7"],[5,"5","8"],[5,"3","8"],[5,"1","9"]], notes: "Use wide stance. Work up to a Top Set for the first set" },
      { name: "Front Squat (Barbell)",                 weeks: [[4,"5","7"],[4,"5","8"],[4,"5","8"],[4,"5","9"]] },
      { name: "Leg Press",                             weeks: [[4,"5","7"],[4,"5","8"],[4,"5","8"],[4,"5","9"]] },
      { name: "Leg Extension",                         weeks: [[3,"8","7"],[3,"8","8"],[3,"8","8"],[3,"8","9"]] },
    ],
  },
];

// ════════════════════════════════════════════════════════════════
// Public API
// ════════════════════════════════════════════════════════════════

const PHASES = [PHASE1, PHASE2, PHASE3];

function getPhaseAndWeek(weekNumber: number): { phase: KongDayDef[]; weekInPhase: number } {
  // weekNumber 1-4 → Phase 1, 5-8 → Phase 2, 9-12 → Phase 3
  const phaseIndex = Math.min(Math.floor((weekNumber - 1) / 4), 2);
  const weekInPhase = (weekNumber - 1) % 4;
  return { phase: PHASES[phaseIndex], weekInPhase };
}

export function getKongDayTitle(dayNumber: number, weekNumber: number): string {
  const { phase } = getPhaseAndWeek(weekNumber);
  const dayIndex = dayNumber - 1;
  if (dayIndex < 0 || dayIndex >= phase.length) return `Day ${dayNumber}`;
  return phase[dayIndex].title;
}

export function getKongExercisesForDay(dayNumber: number, weekNumber: number): ProgramExercise[] {
  const { phase, weekInPhase } = getPhaseAndWeek(weekNumber);
  const dayIndex = dayNumber - 1;
  if (dayIndex < 0 || dayIndex >= phase.length) return [];

  const dayDef = phase[dayIndex];
  return dayDef.exercises.map((ex, i): ProgramExercise => {
    const [sets, reps, rpe] = ex.weeks[weekInPhase];
    return {
      order: i + 1,
      orderLabel: String(i + 1),
      name: ex.name,
      setGroups: [{ sets, reps }],
      restSeconds: getDefaultRestSeconds(ex.name),
      rirTarget: rpe,
      ...(ex.notes ? { notes: ex.notes } : {}),
    };
  });
}
