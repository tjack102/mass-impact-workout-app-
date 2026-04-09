import { describe, it, expect } from "vitest";
import { dedupeRpSelections } from "../rp-store";

describe("dedupeRpSelections", () => {
  const fakeSlots = [
    { slotId: "d1-01", dayNumber: 1, muscleCategory: "Chest" },
    { slotId: "d2-01", dayNumber: 2, muscleCategory: "Quads" },
    { slotId: "d2-02", dayNumber: 2, muscleCategory: "Quads" },
    { slotId: "d2-03", dayNumber: 2, muscleCategory: "Hamstrings" },
  ];

  const fakePool: Record<string, string[]> = {
    Quads: ["Squat (Barbell)", "Leg Press", "Hack Squat"],
    Chest: ["Bench Press"],
    Hamstrings: ["Romanian Deadlift"],
  };

  const getPool = (cat: string) => fakePool[cat] ?? [];

  it("returns null when no duplicates exist", () => {
    const selections = {
      "d1-01": { exerciseName: "Bench Press", tenRepMax: 100 },
      "d2-01": { exerciseName: "Squat (Barbell)", tenRepMax: 80 },
      "d2-02": { exerciseName: "Leg Press", tenRepMax: 120 },
      "d2-03": { exerciseName: "Romanian Deadlift", tenRepMax: 90 },
    };
    expect(dedupeRpSelections(selections, fakeSlots, getPool)).toBeNull();
  });

  it("changes second duplicate to next available exercise", () => {
    const selections = {
      "d1-01": { exerciseName: "Bench Press", tenRepMax: 100 },
      "d2-01": { exerciseName: "Squat (Barbell)", tenRepMax: 80 },
      "d2-02": { exerciseName: "Squat (Barbell)", tenRepMax: 80 },
      "d2-03": { exerciseName: "Romanian Deadlift", tenRepMax: 90 },
    };
    const result = dedupeRpSelections(selections, fakeSlots, getPool);
    expect(result).not.toBeNull();
    expect(result!["d2-01"].exerciseName).toBe("Squat (Barbell)");
    expect(result!["d2-02"].exerciseName).toBe("Leg Press");
    expect(result!["d2-02"].tenRepMax).toBe(80);
  });

  it("does not cross-contaminate between days", () => {
    const selections = {
      "d1-01": { exerciseName: "Bench Press", tenRepMax: 100 },
      "d2-01": { exerciseName: "Squat (Barbell)", tenRepMax: 80 },
      "d2-02": { exerciseName: "Squat (Barbell)", tenRepMax: 80 },
      "d2-03": { exerciseName: "Romanian Deadlift", tenRepMax: 90 },
    };
    const result = dedupeRpSelections(selections, fakeSlots, getPool);
    expect(result!["d1-01"].exerciseName).toBe("Bench Press");
  });
});
