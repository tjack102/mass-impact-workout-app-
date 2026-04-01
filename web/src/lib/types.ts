export type MuscleGroup =
  | "back" | "chest" | "side_delts" | "rear_delts" | "front_delts"
  | "biceps" | "triceps" | "quads" | "hamstrings" | "glutes"
  | "traps" | "calves" | "abs" | "forearms" | "neck";

export type ExerciseType = "stretch" | "compound" | "isolation";

export type Equipment = "barbell" | "dumbbell" | "cable" | "machine" | "bodyweight" | "smith_machine";

export interface ExerciseDefinition {
  id: string;
  name: string;
  primaryMuscle: MuscleGroup;
  secondaryMuscles: { muscle: MuscleGroup; factor: number }[];
  type: ExerciseType;
  equipment: Equipment;
  tier?: "S" | "A";
  exrxUrl?: string;
}

export interface ProgramMeta {
  id: string;
  name: string;
  profile: "his" | "hers" | "both";
  daysPerCycle: number;
  cycleLength: number;
  periodizationType: "block" | "double-progression" | "auto-regulated";
  hasAutoRegulation: boolean;
  hasVolumeTracking: boolean;
}

export type VolumeLandmarks = Record<MuscleGroup, {
  mev: number;
  mavLow: number;
  mavHigh: number;
  mrvLow: number;
  mrvHigh: number;
}>;

export interface MesocycleState {
  mesoNumber: number;
  weekInMeso: number;
  mesoLength: number;
  startDate: number;
  weeklyTargets: Partial<Record<MuscleGroup, number>>;
}

export interface RecoveryRating {
  date: number;
  sessionId: string;
  ratings: Partial<Record<MuscleGroup, number>>;
}

// Muscle groups that have volume landmarks (excludes front_delts, neck, forearms)
export const TRACKED_MUSCLES: MuscleGroup[] = [
  "back", "chest", "side_delts", "rear_delts", "biceps", "triceps",
  "quads", "hamstrings", "glutes", "traps", "calves", "abs",
];
