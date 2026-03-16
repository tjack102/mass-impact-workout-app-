import type {
  MuscleGroup,
  ExerciseDefinition,
  ExerciseType,
  VolumeLandmarks,
  MesocycleState,
  RecoveryRating,
} from "./types";
import type { WorkoutSession } from "./workout-store";
import type { ProgramExercise } from "./program-data";
import { TRACKED_MUSCLES } from "./types";

// Direct = sets where this muscle is the primary target
// Total = direct + indirect (secondary contribution weighted by factor)
type VolumeResult = Record<string, { direct: number; total: number }>;

export function calculateWeeklyVolume(
  sessions: WorkoutSession[],
  exerciseLibrary: ExerciseDefinition[],
  windowDays: number = 7,
): VolumeResult {
  const cutoff = Date.now() - windowDays * 24 * 60 * 60 * 1000;
  // Use completedAt if available, fall back to startedAt
  const recentSessions = sessions.filter(s => (s.completedAt ?? s.startedAt) >= cutoff);

  const result: VolumeResult = {};
  for (const m of TRACKED_MUSCLES) {
    result[m] = { direct: 0, total: 0 };
  }

  // Build a lookup map by lowercase name for O(1) access
  const byName = new Map<string, ExerciseDefinition>();
  for (const ex of exerciseLibrary) {
    byName.set(ex.name.toLowerCase(), ex);
  }

  for (const session of recentSessions) {
    // Count how many sets were logged per exercise name in this session
    const setCounts = new Map<string, number>();
    for (const set of session.sets) {
      const current = setCounts.get(set.exerciseName) ?? 0;
      setCounts.set(set.exerciseName, current + 1);
    }

    for (const [exName, count] of setCounts) {
      const def = byName.get(exName.toLowerCase());
      // Silently skip exercises that aren't in the library
      if (!def) continue;

      if (result[def.primaryMuscle]) {
        result[def.primaryMuscle].direct += count;
        result[def.primaryMuscle].total += count;
      }

      for (const sec of def.secondaryMuscles) {
        if (result[sec.muscle]) {
          result[sec.muscle].total += count * sec.factor;
        }
      }
    }
  }

  return result;
}

export function calculateRecoveryAverage(
  ratings: RecoveryRating[],
  muscle: MuscleGroup,
): number {
  const values = ratings
    .map(r => r.ratings[muscle])
    .filter((v): v is number => v !== undefined);
  if (values.length === 0) return 0;
  return values.reduce((a, b) => a + b, 0) / values.length;
}

export function getVolumeRecommendation(
  currentVolume: number,
  recoveryAvg: number,
  landmarks: { mev: number; mavLow: number; mavHigh: number; mrvLow: number; mrvHigh: number },
  currentTarget: number,
): number {
  // Map recovery rating bands to set deltas (RP-style)
  let delta = 0;
  if (recoveryAvg >= 1.5) delta = 2;
  else if (recoveryAvg >= 0.5) delta = 1;
  else if (recoveryAvg >= -0.5) delta = 0;
  else if (recoveryAvg >= -1.5) delta = -1;
  else delta = -2;

  const newTarget = currentTarget + delta;
  // Never go below MEV or above MRV low (conservative ceiling)
  return Math.max(landmarks.mev, Math.min(landmarks.mrvLow, newTarget));
}

export function suggestSetPlacement(
  muscle: MuscleGroup,
  action: "add" | "remove",
  programExercises: ProgramExercise[],
  exerciseLibrary: ExerciseDefinition[],
): string | null {
  const byName = new Map(exerciseLibrary.map(e => [e.name.toLowerCase(), e]));

  // Filter program exercises to only those targeting the given muscle as primary
  const muscleExercises = programExercises
    .filter(ex => byName.get(ex.name.toLowerCase())?.primaryMuscle === muscle)
    .map(ex => ({ name: ex.name, type: byName.get(ex.name.toLowerCase())!.type }));

  // When adding: prefer stretch > isolation > compound (more stimulus per set)
  // When removing: prefer compound > isolation > stretch (preserve high-value sets)
  const priority: ExerciseType[] = action === "add"
    ? ["stretch", "isolation", "compound"]
    : ["compound", "isolation", "stretch"];

  for (const type of priority) {
    const match = muscleExercises.find(e => e.type === type);
    if (match) return match.name;
  }
  return muscleExercises[0]?.name ?? null;
}

export function isDeloadDue(mesoState: MesocycleState): boolean {
  // weekInMeso > mesoLength means we've gone past the planned meso length
  return mesoState.weekInMeso > mesoState.mesoLength;
}

export function advanceMeso(
  mesoState: MesocycleState,
  recoveryAverages: Partial<Record<MuscleGroup, number>>,
  landmarks: VolumeLandmarks,
): MesocycleState {
  const newTargets: Partial<Record<MuscleGroup, number>> = {};

  for (const muscle of TRACKED_MUSCLES) {
    const current = mesoState.weeklyTargets[muscle] ?? landmarks[muscle]?.mev ?? 0;
    const recoveryAvg = recoveryAverages[muscle] ?? 0;
    // Only bump if recovery was good enough — conservative: require >= 0.5
    const bump = recoveryAvg >= 0.5 ? 1 : 0;
    newTargets[muscle] = Math.min(current + bump, landmarks[muscle]?.mrvLow ?? current);
  }

  return {
    mesoNumber: mesoState.mesoNumber + 1,
    weekInMeso: 1,
    mesoLength: mesoState.mesoLength,
    startDate: Date.now(),
    weeklyTargets: newTargets,
  };
}
