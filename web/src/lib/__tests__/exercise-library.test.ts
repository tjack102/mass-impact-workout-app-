import { describe, it, expect } from "vitest";
import { findExercise, EXERCISE_LIBRARY } from "../exercise-library";

describe("findExercise", () => {
  it("finds by exact name (case-insensitive)", () => {
    const result = findExercise("Yates Row");
    expect(result).toBeDefined();
    expect(result!.name).toBe("Yates Row");
  });

  it("finds by lowercase", () => {
    const result = findExercise("yates row");
    expect(result).toBeDefined();
    expect(result!.name).toBe("Yates Row");
  });

  it("finds by prefix", () => {
    const result = findExercise("Yates");
    expect(result).toBeDefined();
    expect(result!.name).toBe("Yates Row");
  });

  it("returns undefined for nonsense", () => {
    expect(findExercise("xyzzy123")).toBeUndefined();
  });

  it("prefers exact match over prefix match", () => {
    const result = findExercise("Squat (Barbell)");
    expect(result).toBeDefined();
    expect(result!.name).toBe("Squat (Barbell)");
  });
});

describe("EXERCISE_LIBRARY", () => {
  it("has no duplicate names", () => {
    const names = EXERCISE_LIBRARY.map((e) => e.name.toLowerCase());
    const unique = new Set(names);
    expect(unique.size).toBe(names.length);
  });
});
