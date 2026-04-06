import { describe, it, expect } from "vitest";
import {
  round5,
  getBaseMultiplier,
  getWeekMultiplier,
  getWeekWeight,
  getDeloadWeight,
  estimateTenRepMax,
  getCurrentSets,
  getDeloadSets,
  getRirTarget,
  getDeloadReps,
  validateFirstSetReps,
  getMesoWeeks,
  isDeloadWeek,
  getNextMeso,
  getMesoRestSeconds,
} from "../rp-engine";
import type { RpExerciseSlot, RpRatingEntry } from "../rp-types";

// ---------------------------------------------------------------------------
// Test helpers
// ---------------------------------------------------------------------------

function makeSlot(overrides: Partial<RpExerciseSlot> = {}): RpExerciseSlot {
  return {
    slotId: "d1-01",
    muscleCategory: "Horizontal Push",
    dayNumber: 1,
    order: 1,
    pairedSlotId: "d3-01",
    isAutoregulated: true,
    baseSets: { basic: 3, metabolite: 4, resensitization: 2 },
    ...overrides,
  };
}

/** Build a full set of +1 or -1 ratings for the given pairedSlotId across weeks 1-4. */
function makeRatings(
  slotId: string,
  value: -1 | 0 | 1,
  weeks = [1, 2, 3, 4],
): RpRatingEntry[] {
  return weeks.map((week) => ({ slotId, week, meso: "basic" as const, value }));
}

// ---------------------------------------------------------------------------
// round5
// ---------------------------------------------------------------------------

describe("round5", () => {
  it("returns 0 unchanged", () => {
    expect(round5(0)).toBe(0);
  });

  it("returns exact multiples of 5 unchanged", () => {
    expect(round5(25)).toBe(25);
    expect(round5(100)).toBe(100);
    expect(round5(5)).toBe(5);
  });

  it("rounds up when fractional part >= 2.5", () => {
    expect(round5(27)).toBe(25);   // 27/5=5.4, round to 5, *5=25 -- wait, 27 rounds to 25
    expect(round5(23)).toBe(25);   // 23/5=4.6, round to 5, *5=25
    expect(round5(22.5)).toBe(25); // 22.5/5=4.5, round to 5 (banker's or standard), *5=25
  });

  it("rounds down when fractional part < 2.5", () => {
    expect(round5(12)).toBe(10); // 12/5=2.4 -> rounds to 2 -> 10
    expect(round5(17)).toBe(15); // 17/5=3.4 -> rounds to 3 -> 15
  });

  it("handles negative values", () => {
    // -7/5 = -1.4 -> Math.round(-1.4) = -1 -> -5
    expect(round5(-7)).toBe(-5);
    // -3/5 = -0.6 -> Math.round(-0.6) = -1 -> -5
    expect(round5(-3)).toBe(-5);
  });
});

// ---------------------------------------------------------------------------
// getBaseMultiplier
// ---------------------------------------------------------------------------

describe("getBaseMultiplier", () => {
  it("returns 0.85 for basic", () => {
    expect(getBaseMultiplier("basic")).toBe(0.85);
  });

  it("returns 0.75 for metabolite (non-superset)", () => {
    expect(getBaseMultiplier("metabolite")).toBe(0.75);
    expect(getBaseMultiplier("metabolite", false)).toBe(0.75);
  });

  it("returns 0.60 for metabolite superset secondary", () => {
    expect(getBaseMultiplier("metabolite", true)).toBe(0.60);
  });

  it("returns 1.00 for resensitization", () => {
    expect(getBaseMultiplier("resensitization")).toBe(1.00);
  });

  it("superset secondary flag has no effect on basic", () => {
    // basic doesn't use supersets -- the flag is irrelevant but shouldn't break anything
    expect(getBaseMultiplier("basic", true)).toBe(0.85);
  });

  it("superset secondary flag has no effect on resensitization", () => {
    expect(getBaseMultiplier("resensitization", true)).toBe(1.00);
  });
});

// ---------------------------------------------------------------------------
// getWeekMultiplier
// ---------------------------------------------------------------------------

describe("getWeekMultiplier", () => {
  it("week 1 returns 1.000", () => {
    expect(getWeekMultiplier(1)).toBe(1.000);
  });

  it("week 2 returns 1.050", () => {
    expect(getWeekMultiplier(2)).toBe(1.050);
  });

  it("week 3 returns 1.075", () => {
    expect(getWeekMultiplier(3)).toBe(1.075);
  });

  it("week 4 returns 1.100", () => {
    expect(getWeekMultiplier(4)).toBe(1.100);
  });

  it("out-of-range week defaults to 1.000", () => {
    expect(getWeekMultiplier(0)).toBe(1.000);
    expect(getWeekMultiplier(5)).toBe(1.000);
    expect(getWeekMultiplier(99)).toBe(1.000);
  });
});

// ---------------------------------------------------------------------------
// getWeekWeight
// ---------------------------------------------------------------------------

describe("getWeekWeight", () => {
  const TRM = 200;

  describe("basic meso", () => {
    // week1 = round5(200 * 0.85) = round5(170) = 170
    it("week 1: 170", () => expect(getWeekWeight(TRM, "basic", 1)).toBe(170));
    // week2 = round5(170 * 1.05) = round5(178.5) = 180
    it("week 2: 180", () => expect(getWeekWeight(TRM, "basic", 2)).toBe(180));
    // week3 = round5(170 * 1.075) = round5(182.75) = 185
    it("week 3: 185", () => expect(getWeekWeight(TRM, "basic", 3)).toBe(185));
    // week4 = round5(170 * 1.1) = round5(187) = 185
    it("week 4: 185 (double-rounding caps at 185)", () => expect(getWeekWeight(TRM, "basic", 4)).toBe(185));
  });

  describe("metabolite meso", () => {
    // week1 = round5(200 * 0.75) = round5(150) = 150
    it("week 1: 150", () => expect(getWeekWeight(TRM, "metabolite", 1)).toBe(150));
    // week2 = round5(150 * 1.05) = round5(157.5) = 160
    it("week 2: 160", () => expect(getWeekWeight(TRM, "metabolite", 2)).toBe(160));
    // week3 = round5(150 * 1.075) = round5(161.25) = 160
    it("week 3: 160", () => expect(getWeekWeight(TRM, "metabolite", 3)).toBe(160));
    // week4 = round5(150 * 1.1) = round5(165) = 165
    it("week 4: 165", () => expect(getWeekWeight(TRM, "metabolite", 4)).toBe(165));
  });

  describe("resensitization meso", () => {
    // week1 = round5(200 * 1.0) = 200
    it("week 1: 200", () => expect(getWeekWeight(TRM, "resensitization", 1)).toBe(200));
    // week2 = round5(200 * 1.05) = round5(210) = 210
    it("week 2: 210", () => expect(getWeekWeight(TRM, "resensitization", 2)).toBe(210));
    // week3 = round5(200 * 1.075) = round5(215) = 215
    it("week 3: 215", () => expect(getWeekWeight(TRM, "resensitization", 3)).toBe(215));
    // week4 = round5(200 * 1.1) = round5(220) = 220
    it("week 4: 220", () => expect(getWeekWeight(TRM, "resensitization", 4)).toBe(220));
  });

  describe("double-rounding behavior", () => {
    it("applies round5 to week1 anchor before multiplying (basic w4: 185 not 190)", () => {
      // Raw: 200 * 0.85 * 1.1 = 187 -> would round to 185 either way,
      // but with a tricky TRM where anchoring matters more:
      // TRM=210: week1=round5(210*0.85)=round5(178.5)=180; week4=round5(180*1.1)=round5(198)=200
      // Without double-round: round5(210*0.85*1.1) = round5(196.35) = 195 -- different result
      expect(getWeekWeight(210, "basic", 4)).toBe(200);
    });
  });

  describe("metabolite superset secondary", () => {
    // week1 = round5(200 * 0.60) = round5(120) = 120
    it("week 1 superset secondary: 120", () => {
      expect(getWeekWeight(TRM, "metabolite", 1, true)).toBe(120);
    });
    // week2 = round5(120 * 1.05) = round5(126) = 125
    it("week 2 superset secondary: 125", () => {
      expect(getWeekWeight(TRM, "metabolite", 2, true)).toBe(125);
    });
  });
});

// ---------------------------------------------------------------------------
// getDeloadWeight
// ---------------------------------------------------------------------------

describe("getDeloadWeight", () => {
  const TRM = 200;

  describe("basic meso", () => {
    it("first half: same as week 1 weight (170)", () => {
      expect(getDeloadWeight(TRM, "basic", false)).toBe(170);
    });
    it("second half: 50% of week 1 weight (85)", () => {
      expect(getDeloadWeight(TRM, "basic", true)).toBe(85);
    });
  });

  describe("metabolite meso", () => {
    it("first half: 150", () => {
      expect(getDeloadWeight(TRM, "metabolite", false)).toBe(150);
    });
    it("second half: 75", () => {
      expect(getDeloadWeight(TRM, "metabolite", true)).toBe(75);
    });
  });

  describe("resensitization meso", () => {
    it("first half: 200", () => {
      expect(getDeloadWeight(TRM, "resensitization", false)).toBe(200);
    });
    it("second half: 100", () => {
      expect(getDeloadWeight(TRM, "resensitization", true)).toBe(100);
    });
  });

  it("second half result is also rounded to nearest 5", () => {
    // TRM=105 basic: week1=round5(105*0.85)=round5(89.25)=90; second half=round5(90*0.5)=round5(45)=45
    expect(getDeloadWeight(105, "basic", true)).toBe(45);
  });

  it("deload ignores isSupersetSecondary flag (always uses primary multiplier)", () => {
    // getDeloadWeight signature doesn't accept isSupersetSecondary -- hardcodes false
    // This verifies the function always uses the non-superset base multiplier
    expect(getDeloadWeight(TRM, "metabolite", false)).toBe(150); // 0.75, not 0.60
  });
});

// ---------------------------------------------------------------------------
// estimateTenRepMax
// ---------------------------------------------------------------------------

describe("estimateTenRepMax", () => {
  it("135 lbs x 7 reps -> 125", () => {
    // e1rm = 135 * (1 + 7/30) = 135 * 1.2333 = 166.5
    // tenRM = 166.5 / (1 + 10/30) = 166.5 / 1.333 = 124.875 -> round5 = 125
    expect(estimateTenRepMax(135, 7)).toBe(125);
  });

  it("200 x 10 reps returns 200 (exact 10RM input)", () => {
    // Epley formula is self-consistent: estimating 10RM from a known 10RM set returns the same weight
    expect(estimateTenRepMax(200, 10)).toBe(200);
  });

  it("100 lbs x 5 reps -> 90", () => {
    // e1rm = 100 * (1 + 5/30) = 116.67; tenRM = 116.67 / 1.333 = 87.5 -> 90
    expect(estimateTenRepMax(100, 5)).toBe(90);
  });

  it("225 lbs x 12 reps -> 235", () => {
    // e1rm = 225 * (1 + 12/30) = 225 * 1.4 = 315; tenRM = 315 / 1.333 = 236.25 -> 235
    expect(estimateTenRepMax(225, 12)).toBe(235);
  });

  it("result is always rounded to nearest 5", () => {
    const result = estimateTenRepMax(135, 7);
    expect(result % 5).toBe(0);
  });
});

// ---------------------------------------------------------------------------
// getCurrentSets
// ---------------------------------------------------------------------------

describe("getCurrentSets", () => {
  const slot = makeSlot();
  const pairedId = "d3-01";

  describe("all +1 ratings over 4 weeks (basic, base=3)", () => {
    const ratings = makeRatings(pairedId, 1);

    it("week 1: 3 (no prior ratings to accumulate)", () => {
      expect(getCurrentSets(slot, "basic", 1, ratings)).toBe(3);
    });
    it("week 2: 4 (w1 +1)", () => {
      expect(getCurrentSets(slot, "basic", 2, ratings)).toBe(4);
    });
    it("week 3: 5 (w1+1, w2+1)", () => {
      expect(getCurrentSets(slot, "basic", 3, ratings)).toBe(5);
    });
    it("week 4: 6 (w1+1, w2+1, w3+1)", () => {
      expect(getCurrentSets(slot, "basic", 4, ratings)).toBe(6);
    });
  });

  describe("all -1 ratings over 4 weeks -- floors at 0", () => {
    const ratings = makeRatings(pairedId, -1);

    it("week 1: 3", () => expect(getCurrentSets(slot, "basic", 1, ratings)).toBe(3));
    it("week 2: 2", () => expect(getCurrentSets(slot, "basic", 2, ratings)).toBe(2));
    it("week 3: 1", () => expect(getCurrentSets(slot, "basic", 3, ratings)).toBe(1));
    it("week 4: 0 (floored)", () => expect(getCurrentSets(slot, "basic", 4, ratings)).toBe(0));
    it("week 5: 0 (floor holds -- never negative)", () => {
      expect(getCurrentSets(slot, "basic", 5, ratings)).toBe(0);
    });
  });

  describe("mixed ratings", () => {
    const ratings: RpRatingEntry[] = [
      { slotId: pairedId, week: 1, meso: "basic", value: 1 },  // +1
      { slotId: pairedId, week: 2, meso: "basic", value: -1 }, // -1
      { slotId: pairedId, week: 3, meso: "basic", value: 1 },  // +1
    ];

    it("week 1: 3", () => expect(getCurrentSets(slot, "basic", 1, ratings)).toBe(3));
    it("week 2: 4 (w1+1)", () => expect(getCurrentSets(slot, "basic", 2, ratings)).toBe(4));
    it("week 3: 3 (w1+1, w2-1)", () => expect(getCurrentSets(slot, "basic", 3, ratings)).toBe(3));
    it("week 4: 4 (w1+1, w2-1, w3+1)", () => expect(getCurrentSets(slot, "basic", 4, ratings)).toBe(4));
  });

  describe("no ratings entered -- stays at base each week", () => {
    it("week 1: 3", () => expect(getCurrentSets(slot, "basic", 1, [])).toBe(3));
    it("week 2: 3", () => expect(getCurrentSets(slot, "basic", 2, [])).toBe(3));
    it("week 3: 3", () => expect(getCurrentSets(slot, "basic", 3, [])).toBe(3));
    it("week 4: 3", () => expect(getCurrentSets(slot, "basic", 4, [])).toBe(3));
  });

  describe("non-autoregulated slot -- always returns baseSets regardless of ratings", () => {
    const fixedSlot = makeSlot({ isAutoregulated: false });
    const ratings = makeRatings(pairedId, 1);

    it("week 1: 3", () => expect(getCurrentSets(fixedSlot, "basic", 1, ratings)).toBe(3));
    it("week 2: 3", () => expect(getCurrentSets(fixedSlot, "basic", 2, ratings)).toBe(3));
    it("week 4: 3", () => expect(getCurrentSets(fixedSlot, "basic", 4, ratings)).toBe(3));
  });

  describe("null pairedSlotId -- always returns baseSets regardless of ratings", () => {
    const nullPairedSlot = makeSlot({ pairedSlotId: null });
    const ratings = makeRatings(pairedId, 1);

    it("week 1: 3", () => expect(getCurrentSets(nullPairedSlot, "basic", 1, ratings)).toBe(3));
    it("week 2: 3", () => expect(getCurrentSets(nullPairedSlot, "basic", 2, ratings)).toBe(3));
    it("week 4: 3", () => expect(getCurrentSets(nullPairedSlot, "basic", 4, ratings)).toBe(3));
  });

  describe("respects meso-specific baseSets", () => {
    // slot has baseSets: { basic: 3, metabolite: 4, resensitization: 2 }
    it("metabolite base is 4 with no ratings", () => {
      expect(getCurrentSets(slot, "metabolite", 1, [])).toBe(4);
    });
    it("resensitization base is 2 with no ratings", () => {
      expect(getCurrentSets(slot, "resensitization", 1, [])).toBe(2);
    });
  });

  describe("only accumulates ratings matching the active meso", () => {
    const ratings: RpRatingEntry[] = [
      { slotId: pairedId, week: 1, meso: "metabolite", value: 1 },
      { slotId: pairedId, week: 1, meso: "basic", value: -1 },
    ];
    it("metabolite week 2 uses metabolite ratings only: 5", () => {
      expect(getCurrentSets(slot, "metabolite", 2, ratings)).toBe(5); // 4 + 1
    });
    it("basic week 2 uses basic ratings only: 2", () => {
      expect(getCurrentSets(slot, "basic", 2, ratings)).toBe(2); // 3 - 1
    });
  });
});

// ---------------------------------------------------------------------------
// getDeloadSets
// ---------------------------------------------------------------------------

describe("getDeloadSets", () => {
  it("always returns 2", () => {
    expect(getDeloadSets()).toBe(2);
  });
});

// ---------------------------------------------------------------------------
// getRirTarget
// ---------------------------------------------------------------------------

describe("getRirTarget", () => {
  it("week 1: 3/fail", () => {
    expect(getRirTarget(1, false)).toBe("3/fail");
  });

  it("week 2: 3/fail", () => {
    expect(getRirTarget(2, false)).toBe("3/fail");
  });

  it("week 3: 2/fail", () => {
    expect(getRirTarget(3, false)).toBe("2/fail");
  });

  it("week 4: 1/fail", () => {
    expect(getRirTarget(4, false)).toBe("1/fail");
  });

  it("deload week returns half-rep description regardless of week number", () => {
    expect(getRirTarget(5, true)).toBe("1/2 reps of Week 1");
    expect(getRirTarget(3, true)).toBe("1/2 reps of Week 1");
  });
});

// ---------------------------------------------------------------------------
// getDeloadReps
// ---------------------------------------------------------------------------

describe("getDeloadReps", () => {
  it("even number: halves exactly", () => {
    expect(getDeloadReps(10)).toBe(5);
    expect(getDeloadReps(8)).toBe(4);
  });

  it("odd number: floors (no half-reps)", () => {
    expect(getDeloadReps(11)).toBe(5);
    expect(getDeloadReps(7)).toBe(3);
  });

  it("0 reps stays 0", () => {
    expect(getDeloadReps(0)).toBe(0);
  });
});

// ---------------------------------------------------------------------------
// validateFirstSetReps
// ---------------------------------------------------------------------------

describe("validateFirstSetReps", () => {
  describe("basic (valid range: 7-19)", () => {
    it("6 is too-low", () => expect(validateFirstSetReps(6, "basic")).toBe("too-low"));
    it("7 is ok (lower boundary)", () => expect(validateFirstSetReps(7, "basic")).toBe("ok"));
    it("12 is ok (mid-range)", () => expect(validateFirstSetReps(12, "basic")).toBe("ok"));
    it("19 is ok (upper boundary)", () => expect(validateFirstSetReps(19, "basic")).toBe("ok"));
    it("20 is too-high", () => expect(validateFirstSetReps(20, "basic")).toBe("too-high"));
  });

  describe("metabolite (valid range: 11-29)", () => {
    it("10 is too-low", () => expect(validateFirstSetReps(10, "metabolite")).toBe("too-low"));
    it("11 is ok (lower boundary)", () => expect(validateFirstSetReps(11, "metabolite")).toBe("ok"));
    it("20 is ok (mid-range)", () => expect(validateFirstSetReps(20, "metabolite")).toBe("ok"));
    it("29 is ok (upper boundary)", () => expect(validateFirstSetReps(29, "metabolite")).toBe("ok"));
    it("30 is too-high", () => expect(validateFirstSetReps(30, "metabolite")).toBe("too-high"));
  });

  describe("resensitization (valid range: 4-11)", () => {
    it("3 is too-low", () => expect(validateFirstSetReps(3, "resensitization")).toBe("too-low"));
    it("4 is ok (lower boundary)", () => expect(validateFirstSetReps(4, "resensitization")).toBe("ok"));
    it("8 is ok (mid-range)", () => expect(validateFirstSetReps(8, "resensitization")).toBe("ok"));
    it("11 is ok (upper boundary)", () => expect(validateFirstSetReps(11, "resensitization")).toBe("ok"));
    it("12 is too-high", () => expect(validateFirstSetReps(12, "resensitization")).toBe("too-high"));
  });
});

// ---------------------------------------------------------------------------
// getMesoWeeks
// ---------------------------------------------------------------------------

describe("getMesoWeeks", () => {
  it("basic: 5 weeks (4 hard + 1 deload)", () => {
    expect(getMesoWeeks("basic")).toBe(5);
  });

  it("metabolite: 5 weeks (4 hard + 1 deload)", () => {
    expect(getMesoWeeks("metabolite")).toBe(5);
  });

  it("resensitization: 3 weeks (2 hard + 1 deload)", () => {
    expect(getMesoWeeks("resensitization")).toBe(3);
  });
});

// ---------------------------------------------------------------------------
// isDeloadWeek
// ---------------------------------------------------------------------------

describe("isDeloadWeek", () => {
  describe("basic meso (deload = week 5)", () => {
    it("week 5 is deload", () => expect(isDeloadWeek("basic", 5)).toBe(true));
    it("week 4 is not deload", () => expect(isDeloadWeek("basic", 4)).toBe(false));
    it("week 1 is not deload", () => expect(isDeloadWeek("basic", 1)).toBe(false));
  });

  describe("metabolite meso (deload = week 5)", () => {
    it("week 5 is deload", () => expect(isDeloadWeek("metabolite", 5)).toBe(true));
    it("week 4 is not deload", () => expect(isDeloadWeek("metabolite", 4)).toBe(false));
  });

  describe("resensitization meso (deload = week 3)", () => {
    it("week 3 is deload", () => expect(isDeloadWeek("resensitization", 3)).toBe(true));
    it("week 2 is not deload", () => expect(isDeloadWeek("resensitization", 2)).toBe(false));
    it("week 1 is not deload", () => expect(isDeloadWeek("resensitization", 1)).toBe(false));
  });
});

// ---------------------------------------------------------------------------
// getNextMeso
// ---------------------------------------------------------------------------

describe("getNextMeso", () => {
  it("basic -> metabolite", () => {
    expect(getNextMeso("basic")).toBe("metabolite");
  });

  it("metabolite -> resensitization", () => {
    expect(getNextMeso("metabolite")).toBe("resensitization");
  });

  it("resensitization -> null (end of block)", () => {
    expect(getNextMeso("resensitization")).toBeNull();
  });

  it("full chain traversal terminates at null", () => {
    let meso: ReturnType<typeof getNextMeso> = "basic";
    const chain: string[] = [];
    while (meso !== null) {
      chain.push(meso);
      meso = getNextMeso(meso);
    }
    expect(chain).toEqual(["basic", "metabolite", "resensitization"]);
  });
});

// ---------------------------------------------------------------------------
// getMesoRestSeconds
// ---------------------------------------------------------------------------

describe("getMesoRestSeconds", () => {
  it("metabolite: short rests (30-90s) for pump response", () => {
    expect(getMesoRestSeconds("metabolite")).toEqual({ min: 30, max: 90 });
  });

  it("basic: long rests (120-300s) for strength expression", () => {
    expect(getMesoRestSeconds("basic")).toEqual({ min: 120, max: 300 });
  });

  it("resensitization: long rests (120-300s) for strength expression", () => {
    expect(getMesoRestSeconds("resensitization")).toEqual({ min: 120, max: 300 });
  });
});
