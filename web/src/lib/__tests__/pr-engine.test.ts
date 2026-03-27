import { describe, it, expect } from "vitest";
import { estimateE1RM, detectPR } from "../pr-engine";
import type { WorkoutSession } from "../workout-store";

const NOW = Date.now();

function makeSession(exerciseName: string, weight: number, reps: number): WorkoutSession {
  return {
    id: "s1",
    programId: "mass-impact",
    weekNumber: 1,
    dayNumber: 1,
    startedAt: NOW - 86400000,
    completedAt: NOW - 86400000 + 3600000,
    sets: [{ exerciseName, setIndex: 1, weight, reps, timestamp: NOW - 86400000 }],
  };
}

describe("estimateE1RM", () => {
  it("returns weight for 1 rep", () => {
    expect(estimateE1RM(100, 1)).toBeCloseTo(100 * (1 + 1 / 30));
  });

  it("returns higher e1RM for more reps at same weight", () => {
    expect(estimateE1RM(100, 8)).toBeGreaterThan(estimateE1RM(100, 5));
  });
});

describe("detectPR", () => {
  it("returns isPR true when no history exists", () => {
    const result = detectPR("Squat (Barbell)", 100, 5, []);
    expect(result.isPR).toBe(true);
    expect(result.previousBestE1RM).toBeNull();
  });

  it("returns isPR true when current e1RM beats historical best", () => {
    const history = [makeSession("Squat (Barbell)", 80, 5)];
    const result = detectPR("Squat (Barbell)", 100, 5, history);
    expect(result.isPR).toBe(true);
    expect(result.previousBestE1RM).toBeCloseTo(estimateE1RM(80, 5));
  });

  it("returns isPR false when current e1RM does not beat historical best", () => {
    const history = [makeSession("Squat (Barbell)", 120, 5)];
    const result = detectPR("Squat (Barbell)", 100, 5, history);
    expect(result.isPR).toBe(false);
  });

  it("ignores sets for other exercises", () => {
    const history = [makeSession("Bench Press (Barbell)", 200, 5)];
    const result = detectPR("Squat (Barbell)", 50, 5, history);
    expect(result.isPR).toBe(true); // no squat history, so it's a PR
  });

  it("ignores sets with zero weight or zero reps", () => {
    const sessionWithZero: WorkoutSession = {
      id: "s2",
      programId: "mass-impact",
      weekNumber: 1,
      dayNumber: 1,
      startedAt: NOW,
      sets: [{ exerciseName: "Squat (Barbell)", setIndex: 1, weight: 0, reps: 5, timestamp: NOW }],
    };
    const result = detectPR("Squat (Barbell)", 50, 5, [sessionWithZero]);
    expect(result.isPR).toBe(true);
  });
});
