import { describe, it, expect } from "vitest";
import {
  calculateWeeklyVolume,
  calculateRecoveryAverage,
  getVolumeRecommendation,
  suggestSetPlacement,
  isDeloadDue,
  advanceMeso,
} from "../volume-engine";
import type { ExerciseDefinition, RecoveryRating, MesocycleState, VolumeLandmarks } from "../types";
import type { WorkoutSession } from "../workout-store";
import type { ProgramExercise } from "../program-data";

// ---------------------------------------------------------------------------
// Shared test fixtures
// ---------------------------------------------------------------------------

const NOW = Date.now();
const FIVE_DAYS_AGO = NOW - 5 * 24 * 60 * 60 * 1000;
const TEN_DAYS_AGO = NOW - 10 * 24 * 60 * 60 * 1000;

/** Minimal ExerciseDefinition factories */
function makeExercise(
  name: string,
  primaryMuscle: ExerciseDefinition["primaryMuscle"],
  secondaryMuscles: ExerciseDefinition["secondaryMuscles"] = [],
  type: ExerciseDefinition["type"] = "compound",
): ExerciseDefinition {
  return {
    id: name.toLowerCase().replace(/\s+/g, "-"),
    name,
    primaryMuscle,
    secondaryMuscles,
    type,
    equipment: "barbell",
  };
}

/** Minimal WorkoutSession factory — requires programId (added Task 4) */
function makeSession(
  sets: { exerciseName: string }[],
  startedAt: number = FIVE_DAYS_AGO,
  completedAt?: number,
): WorkoutSession {
  return {
    id: "test-session",
    programId: "mass-impact",
    weekNumber: 1,
    dayNumber: 1,
    startedAt,
    completedAt,
    sets: sets.map((s, i) => ({
      exerciseName: s.exerciseName,
      setIndex: i,
      weight: 100,
      reps: 8,
      timestamp: startedAt + i * 1000,
    })),
  };
}

const BENCH = makeExercise("Bench Press", "chest", [
  { muscle: "triceps", factor: 0.5 },
  { muscle: "front_delts", factor: 0.5 },
]);

const ROW = makeExercise("Barbell Row", "back", [
  { muscle: "biceps", factor: 0.5 },
]);

const CURL = makeExercise("Barbell Curl", "biceps", [], "isolation");
const SQUAT = makeExercise("Squat", "quads", [{ muscle: "glutes", factor: 0.5 }]);

const LIBRARY: ExerciseDefinition[] = [BENCH, ROW, CURL, SQUAT];

// ---------------------------------------------------------------------------
// calculateWeeklyVolume
// ---------------------------------------------------------------------------

describe("calculateWeeklyVolume", () => {
  it("counts direct sets for primary muscle", () => {
    const session = makeSession([
      { exerciseName: "Bench Press" },
      { exerciseName: "Bench Press" },
      { exerciseName: "Bench Press" },
    ]);
    const result = calculateWeeklyVolume([session], LIBRARY);
    expect(result["chest"].direct).toBe(3);
    expect(result["chest"].total).toBe(3);
  });

  it("counts indirect sets from secondary muscles (factor 0.5)", () => {
    // 4 sets of Bench Press → triceps gets 4 * 0.5 = 2 indirect sets
    const session = makeSession([
      { exerciseName: "Bench Press" },
      { exerciseName: "Bench Press" },
      { exerciseName: "Bench Press" },
      { exerciseName: "Bench Press" },
    ]);
    const result = calculateWeeklyVolume([session], LIBRARY);
    expect(result["triceps"].direct).toBe(0);
    expect(result["triceps"].total).toBe(2);
  });

  it("skips exercises not in library without crashing", () => {
    const session = makeSession([
      { exerciseName: "Unknown Machine Curl" },
      { exerciseName: "Bench Press" },
    ]);
    // Should not throw. Bench Press still counted, unknown exercise ignored.
    const result = calculateWeeklyVolume([session], LIBRARY);
    expect(result["chest"].direct).toBe(1);
  });

  it("only includes sessions within the rolling window", () => {
    const recentSession = makeSession(
      [{ exerciseName: "Bench Press" }, { exerciseName: "Bench Press" }],
      FIVE_DAYS_AGO,
    );
    const oldSession = makeSession(
      [{ exerciseName: "Bench Press" }],
      TEN_DAYS_AGO,
    );
    // Default 7-day window — old session (10 days ago) should be excluded
    const result = calculateWeeklyVolume([recentSession, oldSession], LIBRARY);
    expect(result["chest"].direct).toBe(2);
  });
});

// ---------------------------------------------------------------------------
// calculateRecoveryAverage
// ---------------------------------------------------------------------------

describe("calculateRecoveryAverage", () => {
  it("averages ratings for a single muscle", () => {
    const ratings: RecoveryRating[] = [
      { date: NOW - 1000, sessionId: "s1", ratings: { chest: 2, back: 1 } },
      { date: NOW - 2000, sessionId: "s2", ratings: { chest: 0, back: -1 } },
      { date: NOW - 3000, sessionId: "s3", ratings: { chest: 1 } },
    ];
    // chest: (2 + 0 + 1) / 3 = 1
    const avg = calculateRecoveryAverage(ratings, "chest");
    expect(avg).toBeCloseTo(1);
  });

  it("returns 0 when no ratings exist for the muscle", () => {
    const ratings: RecoveryRating[] = [
      { date: NOW, sessionId: "s1", ratings: { back: 1 } },
    ];
    const avg = calculateRecoveryAverage(ratings, "chest");
    expect(avg).toBe(0);
  });
});

// ---------------------------------------------------------------------------
// getVolumeRecommendation
// ---------------------------------------------------------------------------

const LANDMARKS = { mev: 4, mavLow: 8, mavHigh: 14, mrvLow: 18, mrvHigh: 22 };

describe("getVolumeRecommendation", () => {
  it("recommends +2 for high recovery (>= 1.5)", () => {
    const result = getVolumeRecommendation(10, 2.0, LANDMARKS, 10);
    expect(result).toBe(12);
  });

  it("recommends +1 for good recovery (>= 0.5)", () => {
    const result = getVolumeRecommendation(10, 1.0, LANDMARKS, 10);
    expect(result).toBe(11);
  });

  it("keeps same volume for neutral recovery (>= -0.5)", () => {
    const result = getVolumeRecommendation(10, 0.0, LANDMARKS, 10);
    expect(result).toBe(10);
  });

  it("recommends -1 for poor recovery (>= -1.5)", () => {
    const result = getVolumeRecommendation(10, -1.0, LANDMARKS, 10);
    expect(result).toBe(9);
  });

  it("recommends -2 for very poor recovery (< -1.5)", () => {
    const result = getVolumeRecommendation(10, -2.0, LANDMARKS, 10);
    expect(result).toBe(8);
  });

  it("clamps to MEV floor", () => {
    // currentTarget = 5, delta = -2 → 3, but mev = 4
    const result = getVolumeRecommendation(5, -2.0, LANDMARKS, 5);
    expect(result).toBe(LANDMARKS.mev);
  });

  it("clamps to MRV ceiling (mrvLow)", () => {
    // currentTarget = 17, delta = +2 → 19, but mrvLow = 18
    const result = getVolumeRecommendation(17, 2.0, LANDMARKS, 17);
    expect(result).toBe(LANDMARKS.mrvLow);
  });
});

// ---------------------------------------------------------------------------
// suggestSetPlacement
// ---------------------------------------------------------------------------

describe("suggestSetPlacement", () => {
  const chestExercises: ProgramExercise[] = [
    {
      order: 1,
      orderLabel: "1",
      name: "Bench Press",
      setGroups: [{ sets: 3, reps: "8-10" }],
    },
    {
      order: 2,
      orderLabel: "2",
      name: "Barbell Curl",
      setGroups: [{ sets: 3, reps: "10-12" }],
    },
  ];

  it("prefers stretch/isolation exercises when adding sets", () => {
    // Bench Press is compound, Barbell Curl is isolation targeting biceps, not chest
    // For chest, only Bench Press is in library as chest primary.
    // The function should return Bench Press (only chest exercise in list)
    const result = suggestSetPlacement("chest", "add", chestExercises, LIBRARY);
    expect(result).toBe("Bench Press");
  });

  it("prefers compound exercises when removing sets", () => {
    const result = suggestSetPlacement("chest", "remove", chestExercises, LIBRARY);
    expect(result).toBe("Bench Press");
  });

  it("returns null when no matching exercises exist in library", () => {
    const result = suggestSetPlacement("abs", "add", chestExercises, LIBRARY);
    expect(result).toBeNull();
  });
});

// ---------------------------------------------------------------------------
// isDeloadDue
// ---------------------------------------------------------------------------

describe("isDeloadDue", () => {
  it("returns true when weekInMeso exceeds mesoLength", () => {
    const state: MesocycleState = {
      mesoNumber: 1,
      weekInMeso: 5,
      mesoLength: 4,
      startDate: NOW,
      weeklyTargets: {},
    };
    expect(isDeloadDue(state)).toBe(true);
  });

  it("returns false when weekInMeso is within mesoLength", () => {
    const state: MesocycleState = {
      mesoNumber: 1,
      weekInMeso: 3,
      mesoLength: 4,
      startDate: NOW,
      weeklyTargets: {},
    };
    expect(isDeloadDue(state)).toBe(false);
  });
});

// ---------------------------------------------------------------------------
// advanceMeso
// ---------------------------------------------------------------------------

describe("advanceMeso", () => {
  const landmarks: VolumeLandmarks = {
    back: { mev: 8, mavLow: 12, mavHigh: 18, mrvLow: 20, mrvHigh: 24 },
    chest: { mev: 4, mavLow: 8, mavHigh: 14, mrvLow: 18, mrvHigh: 22 },
    side_delts: { mev: 6, mavLow: 12, mavHigh: 20, mrvLow: 26, mrvHigh: 30 },
    rear_delts: { mev: 4, mavLow: 8, mavHigh: 14, mrvLow: 18, mrvHigh: 22 },
    front_delts: { mev: 0, mavLow: 0, mavHigh: 4, mrvLow: 8, mrvHigh: 12 },
    biceps: { mev: 4, mavLow: 8, mavHigh: 14, mrvLow: 18, mrvHigh: 22 },
    triceps: { mev: 4, mavLow: 8, mavHigh: 14, mrvLow: 18, mrvHigh: 22 },
    quads: { mev: 6, mavLow: 10, mavHigh: 16, mrvLow: 20, mrvHigh: 24 },
    hamstrings: { mev: 4, mavLow: 8, mavHigh: 14, mrvLow: 18, mrvHigh: 20 },
    glutes: { mev: 4, mavLow: 8, mavHigh: 16, mrvLow: 20, mrvHigh: 24 },
    traps: { mev: 2, mavLow: 4, mavHigh: 8, mrvLow: 12, mrvHigh: 16 },
    calves: { mev: 4, mavLow: 8, mavHigh: 16, mrvLow: 20, mrvHigh: 26 },
    abs: { mev: 4, mavLow: 8, mavHigh: 14, mrvLow: 18, mrvHigh: 22 },
    forearms: { mev: 0, mavLow: 4, mavHigh: 8, mrvLow: 12, mrvHigh: 16 },
    neck: { mev: 0, mavLow: 0, mavHigh: 4, mrvLow: 8, mrvHigh: 12 },
  };

  it("increments mesoNumber and resets weekInMeso to 1", () => {
    const state: MesocycleState = {
      mesoNumber: 1,
      weekInMeso: 5,
      mesoLength: 4,
      startDate: NOW - 1000000,
      weeklyTargets: { chest: 10, back: 12 },
    };
    const next = advanceMeso(state, { chest: 1.0, back: 1.5 }, landmarks);
    expect(next.mesoNumber).toBe(2);
    expect(next.weekInMeso).toBe(1);
  });

  it("bumps targets by 1 for muscles with recoveryAvg >= 0.5", () => {
    const state: MesocycleState = {
      mesoNumber: 1,
      weekInMeso: 5,
      mesoLength: 4,
      startDate: NOW,
      weeklyTargets: { chest: 10 },
    };
    const next = advanceMeso(state, { chest: 1.0 }, landmarks);
    // chest: 10 + 1 = 11, capped at mrvLow=18 → 11
    expect(next.weeklyTargets["chest"]).toBe(11);
  });

  it("does not bump targets for muscles with recoveryAvg < 0.5", () => {
    const state: MesocycleState = {
      mesoNumber: 1,
      weekInMeso: 5,
      mesoLength: 4,
      startDate: NOW,
      weeklyTargets: { chest: 10 },
    };
    const next = advanceMeso(state, { chest: 0.0 }, landmarks);
    expect(next.weeklyTargets["chest"]).toBe(10);
  });

  it("clamps bumped targets to mrvLow", () => {
    const state: MesocycleState = {
      mesoNumber: 1,
      weekInMeso: 5,
      mesoLength: 4,
      startDate: NOW,
      // chest target already at mrvLow (18)
      weeklyTargets: { chest: 18 },
    };
    const next = advanceMeso(state, { chest: 2.0 }, landmarks);
    // 18 + 1 = 19, capped at mrvLow=18 → 18
    expect(next.weeklyTargets["chest"]).toBe(18);
  });
});
