// ---------------------------------------------------------------------------
// RP Autoregulation Engine
// Pure functions -- no DOM, no localStorage, no side effects.
// All weight/set/rep calculations for RP novice mesocycle templates.
// ---------------------------------------------------------------------------

import type { RpMesoType, RpExerciseSlot, RpRatingEntry } from "./rp-types";

// ---------------------------------------------------------------------------
// Weight Functions
// ---------------------------------------------------------------------------

/** Round to nearest 5, matching Excel's MROUND(value, 5). */
export function round5(value: number): number {
  return Math.round(value / 5) * 5;
}

/**
 * Base percentage of the 10RM to use for Week 1 of a given meso.
 * Metabolite work is lighter because the goal is pump/lactate, not load.
 * Superset secondaries get an additional 15% reduction -- they're already
 * fatigued from the primary movement.
 */
export function getBaseMultiplier(
  meso: RpMesoType,
  isSupersetSecondary: boolean = false,
): number {
  if (meso === "basic") return 0.85;
  if (meso === "metabolite") return isSupersetSecondary ? 0.60 : 0.75;
  // resensitization -- back off to full 10RM equivalent to rebuild sensitivity
  return 1.00;
}

/**
 * Progressive load multiplier per week within a meso.
 * Applied to the Week 1 weight (not the raw 10RM) to keep progression linear.
 * Week 4 (last hard week before deload) peaks at 10% over Week 1.
 */
export function getWeekMultiplier(week: number): number {
  const multipliers: Record<number, number> = {
    1: 1.000,
    2: 1.050,
    3: 1.075,
    4: 1.100,
  };
  return multipliers[week] ?? 1.000;
}

/**
 * Working weight for a given week.
 * Double-rounded: first to get a clean Week 1 anchor weight, then again
 * after applying the weekly progression so the final weight is also a
 * plate-friendly multiple of 5.
 */
export function getWeekWeight(
  tenRepMax: number,
  meso: RpMesoType,
  week: number,
  isSupersetSecondary: boolean = false,
): number {
  const week1Weight = round5(tenRepMax * getBaseMultiplier(meso, isSupersetSecondary));
  return round5(week1Weight * getWeekMultiplier(week));
}

/**
 * Deload week weight.
 * First half of the deload session: same as Week 1 weight (reduced intensity from prior week).
 * Second half: 50% of Week 1 weight -- flush movement pattern with minimal fatigue.
 */
export function getDeloadWeight(
  tenRepMax: number,
  meso: RpMesoType,
  isSecondHalf: boolean,
): number {
  const week1Weight = round5(tenRepMax * getBaseMultiplier(meso, false));
  if (!isSecondHalf) return week1Weight;
  return round5(week1Weight * 0.50);
}

/**
 * Estimate 10RM from a known weight/reps performance using Epley formula.
 * Epley: estimated 1RM = weight * (1 + reps/30)
 * Then convert to 10RM: 1RM / (1 + 10/30) = 1RM / 1.333...
 */
export function estimateTenRepMax(weight: number, reps: number): number {
  const e1rm = weight * (1 + reps / 30);
  const tenRM = e1rm / (1 + 10 / 30);
  return round5(tenRM);
}

// ---------------------------------------------------------------------------
// Set Functions
// ---------------------------------------------------------------------------

/**
 * How many sets to do this week for the given slot.
 *
 * Autoregulation works through the pairedSlotId: the RATING for the paired
 * slot drives the set count of THIS slot. Rate the muscle group on one day,
 * and it adjusts the set count for that same muscle group on the partner day.
 *
 * +1 = recovered/easy -> add a set, -1 = struggling/sore -> drop a set.
 *
 * If the slot isn't autoregulated, or has no pairedSlotId, we always return baseSets.
 * If a week has no rating entry, we treat it as 0 (no change) for that week.
 * Set count floors at 0 -- never negative.
 */
export function getCurrentSets(
  slot: RpExerciseSlot,
  meso: RpMesoType,
  week: number,
  ratings: RpRatingEntry[],
): number {
  if (!slot.isAutoregulated || slot.pairedSlotId === null) {
    return slot.baseSets[meso];
  }

  let sets = slot.baseSets[meso];

  // Accumulate rating adjustments from all previous weeks.
  // Week 1 has no prior ratings, so it always returns baseSets.
  for (let w = 1; w < week; w++) {
    const entry = ratings.find(
      r => r.slotId === slot.pairedSlotId && r.week === w && r.meso === meso,
    );
    sets += entry ? entry.value : 0;
  }

  return Math.max(0, sets);
}

/** Deload week always uses exactly 2 sets regardless of autoregulation state. */
export function getDeloadSets(): number {
  return 2;
}

// ---------------------------------------------------------------------------
// Rep / RIR Functions
// ---------------------------------------------------------------------------

/**
 * Target RIR (reps in reserve) description for the given week.
 * Deload doesn't prescribe RIR -- just cut volume in half.
 * Progressive RIR drop (3 -> 2 -> 1) across hard weeks is standard RP protocol.
 */
export function getRirTarget(week: number, isDeload: boolean): string {
  if (isDeload) return "1/2 reps of Week 1";
  if (week <= 2) return "3/fail";
  if (week === 3) return "2/fail";
  return "1/fail"; // week 4
}

/**
 * How many reps to do during the deload.
 * Floors with Math.floor so odd rep counts don't produce half-reps.
 */
export function getDeloadReps(week1Reps: number): number {
  return Math.floor(week1Reps / 2);
}

// ---------------------------------------------------------------------------
// Validation
// ---------------------------------------------------------------------------

/**
 * Check whether the user's first-set rep count is in an appropriate range.
 * Rep ranges differ per meso because the training stimulus is different:
 * - Basic: moderate reps, strength-focused
 * - Metabolite: high reps, pump-focused
 * - Resensitization: low reps, strength/SFR-focused
 */
export function validateFirstSetReps(
  reps: number,
  meso: RpMesoType,
): "too-low" | "too-high" | "ok" {
  if (meso === "basic") {
    if (reps <= 6) return "too-low";
    if (reps >= 20) return "too-high";
    return "ok";
  }
  if (meso === "metabolite") {
    if (reps <= 10) return "too-low";
    if (reps >= 30) return "too-high";
    return "ok";
  }
  // resensitization
  if (reps <= 3) return "too-low";
  if (reps >= 12) return "too-high";
  return "ok";
}

// ---------------------------------------------------------------------------
// Mesocycle Helpers
// ---------------------------------------------------------------------------

/**
 * Total weeks in each meso type, including the deload week.
 * basic/metabolite: 4 hard weeks + 1 deload = 5
 * resensitization: 2 hard weeks + 1 deload = 3
 */
export function getMesoWeeks(meso: RpMesoType): number {
  if (meso === "resensitization") return 3;
  return 5;
}

/** True if the given week is the final (deload) week of the meso. */
export function isDeloadWeek(meso: RpMesoType, week: number): boolean {
  return week === getMesoWeeks(meso);
}

/**
 * Progression order: basic -> metabolite -> resensitization -> done.
 * Returns null after resensitization -- that's the end of the training block.
 */
export function getNextMeso(current: RpMesoType): RpMesoType | null {
  if (current === "basic") return "metabolite";
  if (current === "metabolite") return "resensitization";
  return null;
}

/**
 * Recommended rest intervals per meso type.
 * Metabolite work uses short rests to maximize lactate/pump response.
 * Basic and resensitization use longer rests to allow full strength expression.
 * Values are in seconds.
 */
export function getMesoRestSeconds(meso: RpMesoType): { min: number; max: number } {
  if (meso === "metabolite") return { min: 30, max: 90 };
  return { min: 120, max: 300 };
}
