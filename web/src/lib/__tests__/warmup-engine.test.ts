import { describe, it, expect } from "vitest";
import { calculateWarmupSets } from "../warmup-engine";
import type { WarmupSet } from "../warmup-engine";

describe("calculateWarmupSets", () => {
  // --- Edge cases (evaluated first) ---

  it("returns empty array for 0 weight", () => {
    expect(calculateWarmupSets(0)).toEqual([]);
  });

  it("returns empty array for negative weight", () => {
    expect(calculateWarmupSets(-10)).toEqual([]);
  });

  it("returns only potentiation set for weight <= 45", () => {
    const result = calculateWarmupSets(45);
    expect(result).toHaveLength(1);
    expect(result[0].label).toBe("Potentiation");
    expect(result[0].weight).toBe(45);
    expect(result[0].repsDisplay).toBe("2-3");
  });

  it("returns light + potentiation only for weight 46-65 (no intermediates)", () => {
    const result = calculateWarmupSets(60);
    expect(result).toHaveLength(2);
    expect(result[0].label).toBe("Light");
    expect(result[0].reps).toBe(10);
    expect(result[1].label).toBe("Potentiation");
  });

  // --- Standard protocol (> 65 lbs) ---

  it("returns light + 2 intermediates + potentiation for 66-200 lbs", () => {
    const result = calculateWarmupSets(135);
    expect(result).toHaveLength(4);
    expect(result[0].label).toBe("Light");
    expect(result[1].label).toBe("Intermediate 1");
    expect(result[2].label).toBe("Intermediate 2");
    expect(result[3].label).toBe("Potentiation");
    expect(result[1].reps).toBe(5);
    expect(result[2].reps).toBe(5);
  });

  it("returns light + 3 intermediates + potentiation for 201-400 lbs", () => {
    const result = calculateWarmupSets(225);
    expect(result).toHaveLength(5);
    expect(result[0].label).toBe("Light");
    expect(result[1].label).toBe("Intermediate 1");
    expect(result[2].label).toBe("Intermediate 2");
    expect(result[3].label).toBe("Intermediate 3");
    expect(result[4].label).toBe("Potentiation");
  });

  it("returns light + 4 intermediates + potentiation for 401+ lbs", () => {
    const result = calculateWarmupSets(500);
    expect(result).toHaveLength(6);
    expect(result[0].label).toBe("Light");
    expect(result[4].label).toBe("Intermediate 4");
    expect(result[5].label).toBe("Potentiation");
  });

  // --- Threshold boundaries ---

  it("66 lbs uses 2 intermediates", () => {
    const result = calculateWarmupSets(66);
    const intermediates = result.filter((s) => s.label.startsWith("Intermediate"));
    expect(intermediates).toHaveLength(2);
  });

  it("200 lbs uses 2 intermediates", () => {
    const result = calculateWarmupSets(200);
    const intermediates = result.filter((s) => s.label.startsWith("Intermediate"));
    expect(intermediates).toHaveLength(2);
  });

  it("201 lbs uses 3 intermediates", () => {
    const result = calculateWarmupSets(201);
    const intermediates = result.filter((s) => s.label.startsWith("Intermediate"));
    expect(intermediates).toHaveLength(3);
  });

  it("400 lbs uses 3 intermediates", () => {
    const result = calculateWarmupSets(400);
    const intermediates = result.filter((s) => s.label.startsWith("Intermediate"));
    expect(intermediates).toHaveLength(3);
  });

  it("401 lbs uses 4 intermediates", () => {
    const result = calculateWarmupSets(401);
    const intermediates = result.filter((s) => s.label.startsWith("Intermediate"));
    expect(intermediates).toHaveLength(4);
  });

  // --- Rounding ---

  it("rounds weights to nearest 5 lbs by default", () => {
    const result = calculateWarmupSets(135);
    for (const set of result) {
      expect(set.weight % 5).toBe(0);
    }
  });

  it("rounds to nearest 2.5 when configured", () => {
    const result = calculateWarmupSets(135, { roundingIncrement: 2.5 });
    for (const set of result) {
      expect(set.weight % 2.5).toBe(0);
    }
  });

  it("rounds to nearest 10 when configured", () => {
    const result = calculateWarmupSets(225, { roundingIncrement: 10 });
    for (const set of result) {
      expect(set.weight % 10).toBe(0);
    }
  });

  // --- Bar weight clamping ---

  it("clamps calculated weights to 45 lbs minimum", () => {
    const result = calculateWarmupSets(50);
    for (const set of result) {
      expect(set.weight).toBeGreaterThanOrEqual(45);
    }
  });

  // --- Custom start percent ---

  it("uses custom start percent for light set", () => {
    const result = calculateWarmupSets(200, { startPercent: 30 });
    expect(result[0].label).toBe("Light");
    expect(result[0].weight).toBe(60); // 200 * 0.30 = 60
  });

  // --- Potentiation set ---

  it("potentiation set uses working weight exactly", () => {
    const result = calculateWarmupSets(225);
    const pot = result.find((s) => s.label === "Potentiation");
    expect(pot).toBeDefined();
    expect(pot!.weight).toBe(225);
    expect(pot!.repsDisplay).toBe("2-3");
    expect(pot!.reps).toBe(3);
  });

  // --- Abbreviated mode ---

  it("abbreviated mode returns 1 intermediate + potentiation only", () => {
    const result = calculateWarmupSets(225, { abbreviated: true });
    expect(result).toHaveLength(2);
    expect(result[0].label).toBe("Intermediate 1");
    expect(result[0].reps).toBe(5);
    expect(result[1].label).toBe("Potentiation");
  });

  it("abbreviated mode with light weight (46-65) returns potentiation only", () => {
    const result = calculateWarmupSets(60, { abbreviated: true });
    expect(result).toHaveLength(1);
    expect(result[0].label).toBe("Potentiation");
  });

  // --- Deduplication ---

  it("no adjacent warm-up sets share the same weight", () => {
    const result = calculateWarmupSets(135, { roundingIncrement: 10 });
    for (let i = 1; i < result.length; i++) {
      expect(result[i].weight).not.toBe(result[i - 1].weight);
    }
  });

  it("dedup retains the set with more reps when collapsing", () => {
    const result = calculateWarmupSets(66, { roundingIncrement: 25 });
    const intermediates = result.filter((s) => s.label.startsWith("Intermediate"));
    expect(intermediates).toHaveLength(1);
    expect(intermediates[0].reps).toBe(5);
  });
});
