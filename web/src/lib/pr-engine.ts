import type { WorkoutSession } from "@/lib/workout-store";

export interface PRResult {
  isPR: boolean;
  previousBestE1RM: number | null;
  currentE1RM: number;
}

/** Epley formula: weight * (1 + reps / 30) */
export function estimateE1RM(weight: number, reps: number): number {
  return weight * (1 + reps / 30);
}

/**
 * Check whether the given weight+reps beats the historical best e1RM
 * for this exercise across all provided sessions.
 *
 * Pure function -- no side effects, no localStorage reads.
 * Caller passes getAllSessions(activeUser) from workout-store.
 */
export function detectPR(
  exerciseName: string,
  weight: number,
  reps: number,
  sessionHistory: WorkoutSession[],
): PRResult {
  const currentE1RM = estimateE1RM(weight, reps);

  const bestHistoricalE1RM = sessionHistory
    .flatMap((s) => s.sets)
    .filter((s) => s.exerciseName === exerciseName && s.weight > 0 && s.reps > 0)
    .reduce((best, s) => Math.max(best, estimateE1RM(s.weight, s.reps)), 0);

  return {
    isPR: currentE1RM > bestHistoricalE1RM,
    previousBestE1RM: bestHistoricalE1RM > 0 ? bestHistoricalE1RM : null,
    currentE1RM,
  };
}
