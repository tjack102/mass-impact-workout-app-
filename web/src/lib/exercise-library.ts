import type { ExerciseDefinition, MuscleGroup } from "./types";

// Full exercise catalog covering Mass Impact, RAVAGE, and Hers programs.
// Secondary muscle factors follow RP conventions:
//   - Rows/pulldowns → biceps 0.5
//   - Any pressing movement → triceps 0.5, front_delts 0.5
//   - Squat / leg press / lunge patterns → glutes 0.5
//   - RDL / back extension patterns → glutes 0.5
//   - Hip thrust → hamstrings 0.5
//   - Farmer's walk → forearms 0.5
export const EXERCISE_LIBRARY: ExerciseDefinition[] = [
  // ─────────────────────────────────────────────
  // BACK
  // ─────────────────────────────────────────────
  {
    id: "single-arm-row-cable",
    name: "Single Arm Row (Cable)",
    primaryMuscle: "back",
    type: "compound",
    equipment: "cable",
    secondaryMuscles: [{ muscle: "biceps", factor: 0.5 }],
  },
  {
    id: "pull-up-bodyweight",
    name: "Pull-Up (Bodyweight)",
    primaryMuscle: "back",
    type: "compound",
    equipment: "bodyweight",
    secondaryMuscles: [{ muscle: "biceps", factor: 0.5 }],
  },
  {
    id: "pull-up-neutral-grip-bodyweight",
    name: "Pull-Up (Neutral Grip, Bodyweight)",
    primaryMuscle: "back",
    type: "compound",
    equipment: "bodyweight",
    secondaryMuscles: [{ muscle: "biceps", factor: 0.5 }],
  },
  {
    id: "standing-pullover-cable",
    name: "Standing Pullover (Cable)",
    primaryMuscle: "back",
    type: "stretch",
    equipment: "cable",
    secondaryMuscles: [],
  },
  {
    id: "bent-over-row-barbell",
    name: "Bent Over Row (Barbell)",
    primaryMuscle: "back",
    type: "compound",
    equipment: "barbell",
    secondaryMuscles: [{ muscle: "biceps", factor: 0.5 }],
  },
  {
    id: "single-arm-row-dumbbell",
    name: "Single Arm Row (Dumbbell)",
    primaryMuscle: "back",
    type: "compound",
    equipment: "dumbbell",
    secondaryMuscles: [{ muscle: "biceps", factor: 0.5 }],
  },
  {
    id: "narrow-neutral-pulldown",
    name: "Narrow Neutral Pulldown",
    primaryMuscle: "back",
    type: "compound",
    equipment: "cable",
    secondaryMuscles: [{ muscle: "biceps", factor: 0.5 }],
  },
  {
    id: "wide-overhand-pulldown",
    name: "Wide Overhand Pulldown",
    primaryMuscle: "back",
    type: "compound",
    equipment: "cable",
    secondaryMuscles: [{ muscle: "biceps", factor: 0.5 }],
  },
  {
    id: "1-arm-machine-row",
    name: "1 Arm Machine Row",
    primaryMuscle: "back",
    type: "compound",
    equipment: "machine",
    secondaryMuscles: [{ muscle: "biceps", factor: 0.5 }],
  },
  {
    id: "lat-pulldown",
    name: "Lat Pulldown",
    primaryMuscle: "back",
    type: "compound",
    equipment: "cable",
    secondaryMuscles: [{ muscle: "biceps", factor: 0.5 }],
  },
  {
    id: "seated-row-cable",
    name: "Seated Row (Cable)",
    primaryMuscle: "back",
    type: "compound",
    equipment: "cable",
    secondaryMuscles: [{ muscle: "biceps", factor: 0.5 }],
  },
  {
    id: "helms-row",
    name: "Helms Row",
    primaryMuscle: "back",
    type: "compound",
    equipment: "dumbbell",
    secondaryMuscles: [{ muscle: "biceps", factor: 0.5 }],
  },
  {
    id: "wide-neutral-pulldown",
    name: "Wide Neutral Pulldown",
    primaryMuscle: "back",
    type: "compound",
    equipment: "cable",
    secondaryMuscles: [{ muscle: "biceps", factor: 0.5 }],
  },
  {
    id: "single-arm-cable-row",
    name: "Single Arm Cable Row",
    primaryMuscle: "back",
    type: "compound",
    equipment: "cable",
    secondaryMuscles: [{ muscle: "biceps", factor: 0.5 }],
  },
  // Cable pullover is the same movement as Standing Pullover (Cable) under a different name —
  // kept as a separate entry so program data using either name resolves correctly.
  {
    id: "cable-pullover",
    name: "Cable Pullover",
    primaryMuscle: "back",
    type: "stretch",
    equipment: "cable",
    secondaryMuscles: [],
  },

  // ─────────────────────────────────────────────
  // CHEST
  // ─────────────────────────────────────────────
  {
    id: "dip-weighted",
    name: "Dip (Weighted)",
    primaryMuscle: "chest",
    type: "compound",
    equipment: "bodyweight",
    secondaryMuscles: [
      { muscle: "triceps", factor: 0.5 },
      { muscle: "front_delts", factor: 0.5 },
    ],
  },
  {
    id: "ad-press",
    name: "AD Press",
    primaryMuscle: "chest",
    type: "compound",
    equipment: "machine",
    secondaryMuscles: [
      { muscle: "triceps", factor: 0.5 },
      { muscle: "front_delts", factor: 0.5 },
    ],
  },
  {
    id: "cable-crossover",
    name: "Cable Crossover",
    primaryMuscle: "chest",
    type: "isolation",
    equipment: "cable",
    secondaryMuscles: [],
  },
  {
    id: "incline-bench-press-dumbbell",
    name: "Incline Bench Press (Dumbbell)",
    primaryMuscle: "chest",
    type: "compound",
    equipment: "dumbbell",
    secondaryMuscles: [
      { muscle: "triceps", factor: 0.5 },
      { muscle: "front_delts", factor: 0.5 },
    ],
  },
  {
    id: "close-grip-larsen-press",
    name: "Close Grip Larsen Press",
    primaryMuscle: "chest",
    type: "compound",
    equipment: "barbell",
    secondaryMuscles: [
      { muscle: "triceps", factor: 0.5 },
      { muscle: "front_delts", factor: 0.5 },
    ],
  },
  {
    id: "smith-reverse-grip-bench",
    name: "Smith Reverse Grip Bench",
    primaryMuscle: "chest",
    type: "compound",
    equipment: "smith_machine",
    secondaryMuscles: [{ muscle: "triceps", factor: 0.5 }],
  },
  {
    id: "bench-press-barbell",
    name: "Bench Press (Barbell)",
    primaryMuscle: "chest",
    type: "compound",
    equipment: "barbell",
    secondaryMuscles: [
      { muscle: "triceps", factor: 0.5 },
      { muscle: "front_delts", factor: 0.5 },
    ],
  },
  {
    id: "chest-press-machine",
    name: "Chest Press (Machine)",
    primaryMuscle: "chest",
    type: "compound",
    equipment: "machine",
    secondaryMuscles: [
      { muscle: "triceps", factor: 0.5 },
      { muscle: "front_delts", factor: 0.5 },
    ],
  },
  {
    id: "incline-db-fly",
    name: "Incline DB Fly",
    primaryMuscle: "chest",
    type: "isolation",
    equipment: "dumbbell",
    secondaryMuscles: [],
  },

  // ─────────────────────────────────────────────
  // SIDE DELTS
  // ─────────────────────────────────────────────
  {
    id: "lu-raise",
    name: "Lu Raise",
    primaryMuscle: "side_delts",
    type: "isolation",
    equipment: "dumbbell",
    secondaryMuscles: [],
  },
  {
    id: "partial-lateral-raise-cable",
    name: "Partial Lateral Raise (Cable)",
    primaryMuscle: "side_delts",
    type: "isolation",
    equipment: "cable",
    secondaryMuscles: [],
  },
  {
    id: "lateral-raise-cable",
    name: "Lateral Raise (Cable)",
    primaryMuscle: "side_delts",
    type: "isolation",
    equipment: "cable",
    secondaryMuscles: [],
  },
  {
    id: "seated-shoulder-press-dumbbell",
    name: "Seated Shoulder Press (Dumbbell)",
    primaryMuscle: "side_delts",
    type: "compound",
    equipment: "dumbbell",
    secondaryMuscles: [
      { muscle: "triceps", factor: 0.5 },
      { muscle: "front_delts", factor: 0.5 },
    ],
  },
  {
    id: "lateral-raise-machine",
    name: "Lateral Raise (Machine)",
    primaryMuscle: "side_delts",
    type: "isolation",
    equipment: "machine",
    secondaryMuscles: [],
  },

  // ─────────────────────────────────────────────
  // REAR DELTS
  // ─────────────────────────────────────────────
  {
    id: "rear-delt-fly-cable",
    name: "Rear Delt Fly (Cable)",
    primaryMuscle: "rear_delts",
    type: "isolation",
    equipment: "cable",
    secondaryMuscles: [],
  },
  {
    id: "face-pull",
    name: "Face Pull",
    primaryMuscle: "rear_delts",
    type: "isolation",
    equipment: "cable",
    // Traps assist on the retraction portion
    secondaryMuscles: [{ muscle: "traps", factor: 0.5 }],
  },

  // ─────────────────────────────────────────────
  // BICEPS
  // ─────────────────────────────────────────────
  {
    id: "incline-curl-dumbbell",
    name: "Incline Curl (Dumbbell)",
    primaryMuscle: "biceps",
    type: "stretch",
    equipment: "dumbbell",
    secondaryMuscles: [],
  },
  {
    id: "hammer-curl-cable",
    name: "Hammer Curl (Cable)",
    primaryMuscle: "biceps",
    type: "isolation",
    equipment: "cable",
    secondaryMuscles: [],
  },
  {
    id: "hammer-curl",
    name: "Hammer Curl",
    primaryMuscle: "biceps",
    type: "isolation",
    equipment: "dumbbell",
    secondaryMuscles: [],
  },
  {
    id: "bicep-curl-barbell",
    name: "Bicep Curl (Barbell)",
    primaryMuscle: "biceps",
    type: "compound",
    equipment: "barbell",
    secondaryMuscles: [],
  },

  // ─────────────────────────────────────────────
  // TRICEPS
  // ─────────────────────────────────────────────
  {
    id: "overhead-tricep-extension-cable",
    name: "Overhead Tricep Extension (Cable)",
    primaryMuscle: "triceps",
    type: "stretch",
    equipment: "cable",
    secondaryMuscles: [],
  },
  {
    id: "tricep-pushdown",
    name: "Tricep Pushdown",
    primaryMuscle: "triceps",
    type: "isolation",
    equipment: "cable",
    secondaryMuscles: [],
  },
  {
    id: "standing-overhead-extension",
    name: "Standing Overhead Extension",
    primaryMuscle: "triceps",
    type: "stretch",
    equipment: "dumbbell",
    secondaryMuscles: [],
  },
  {
    id: "leaning-overhead-extension",
    name: "Leaning Overhead Extension",
    primaryMuscle: "triceps",
    type: "stretch",
    equipment: "cable",
    secondaryMuscles: [],
  },

  // ─────────────────────────────────────────────
  // TRAPS
  // ─────────────────────────────────────────────
  {
    id: "power-shrug",
    name: "Power Shrug",
    primaryMuscle: "traps",
    type: "compound",
    equipment: "barbell",
    secondaryMuscles: [],
  },
  {
    id: "farmers-walk-weighted",
    name: "Farmer's Walk (Weighted)",
    primaryMuscle: "traps",
    type: "compound",
    equipment: "dumbbell",
    // Forearms under high isometric load during carry
    secondaryMuscles: [{ muscle: "forearms", factor: 0.5 }],
  },
  {
    id: "upright-row-barbell",
    name: "Upright Row (Barbell)",
    primaryMuscle: "traps",
    type: "compound",
    equipment: "barbell",
    // Upper trap / side delt overlap
    secondaryMuscles: [{ muscle: "side_delts", factor: 0.5 }],
  },

  // ─────────────────────────────────────────────
  // QUADS
  // ─────────────────────────────────────────────
  {
    id: "squat-barbell",
    name: "Squat (Barbell)",
    primaryMuscle: "quads",
    type: "compound",
    equipment: "barbell",
    secondaryMuscles: [{ muscle: "glutes", factor: 0.5 }],
  },
  {
    id: "walking-lunge-dumbbell",
    name: "Walking Lunge (Dumbbell)",
    primaryMuscle: "quads",
    type: "compound",
    equipment: "dumbbell",
    secondaryMuscles: [{ muscle: "glutes", factor: 0.5 }],
  },
  {
    id: "smith-machine-hack-squat",
    name: "Smith Machine Hack Squat",
    primaryMuscle: "quads",
    type: "compound",
    equipment: "smith_machine",
    secondaryMuscles: [{ muscle: "glutes", factor: 0.5 }],
  },
  {
    id: "walking-lunge",
    name: "Walking Lunge",
    primaryMuscle: "quads",
    type: "compound",
    equipment: "bodyweight",
    secondaryMuscles: [{ muscle: "glutes", factor: 0.5 }],
  },
  {
    id: "leg-extension",
    name: "Leg Extension",
    primaryMuscle: "quads",
    type: "isolation",
    equipment: "machine",
    secondaryMuscles: [],
  },
  {
    id: "leg-press",
    name: "Leg Press",
    primaryMuscle: "quads",
    type: "compound",
    equipment: "machine",
    secondaryMuscles: [{ muscle: "glutes", factor: 0.5 }],
  },
  {
    id: "bulgarian-split-squat",
    name: "Bulgarian Split Squat",
    primaryMuscle: "quads",
    type: "compound",
    equipment: "dumbbell",
    secondaryMuscles: [{ muscle: "glutes", factor: 0.5 }],
  },
  {
    id: "step-up-high-box",
    name: "Step-Up (High Box)",
    primaryMuscle: "quads",
    type: "compound",
    equipment: "dumbbell",
    secondaryMuscles: [{ muscle: "glutes", factor: 0.5 }],
  },

  // ─────────────────────────────────────────────
  // HAMSTRINGS
  // ─────────────────────────────────────────────
  {
    id: "romanian-deadlift-barbell",
    name: "Romanian Deadlift (Barbell)",
    primaryMuscle: "hamstrings",
    type: "compound",
    equipment: "barbell",
    secondaryMuscles: [{ muscle: "glutes", factor: 0.5 }],
  },
  {
    id: "back-extension-weighted",
    name: "Back Extension (Weighted)",
    primaryMuscle: "hamstrings",
    type: "compound",
    equipment: "bodyweight",
    secondaryMuscles: [{ muscle: "glutes", factor: 0.5 }],
  },
  {
    id: "seated-hamstring-curl",
    name: "Seated Hamstring Curl",
    primaryMuscle: "hamstrings",
    type: "isolation",
    equipment: "machine",
    secondaryMuscles: [],
  },
  {
    id: "lying-leg-curl",
    name: "Lying Leg Curl",
    primaryMuscle: "hamstrings",
    type: "isolation",
    equipment: "machine",
    secondaryMuscles: [],
  },
  {
    id: "nordic-curl",
    name: "Nordic Curl",
    primaryMuscle: "hamstrings",
    type: "compound",
    equipment: "bodyweight",
    secondaryMuscles: [],
  },

  // ─────────────────────────────────────────────
  // GLUTES
  // ─────────────────────────────────────────────
  {
    id: "hip-thrust-barbell",
    name: "Hip Thrust (Barbell)",
    primaryMuscle: "glutes",
    type: "compound",
    equipment: "barbell",
    secondaryMuscles: [{ muscle: "hamstrings", factor: 0.5 }],
  },
  {
    id: "b-stance-hip-thrust",
    name: "B-Stance Hip Thrust",
    primaryMuscle: "glutes",
    type: "compound",
    equipment: "barbell",
    secondaryMuscles: [{ muscle: "hamstrings", factor: 0.5 }],
  },
  {
    id: "cable-pull-through",
    name: "Cable Pull-Through",
    primaryMuscle: "glutes",
    type: "compound",
    equipment: "cable",
    secondaryMuscles: [{ muscle: "hamstrings", factor: 0.5 }],
  },
  {
    id: "cable-kickback",
    name: "Cable Kickback",
    primaryMuscle: "glutes",
    type: "isolation",
    equipment: "cable",
    secondaryMuscles: [],
  },
  {
    id: "glute-focused-back-extension",
    name: "Glute-Focused Back Extension",
    primaryMuscle: "glutes",
    type: "compound",
    equipment: "bodyweight",
    secondaryMuscles: [{ muscle: "hamstrings", factor: 0.5 }],
  },

  // ─────────────────────────────────────────────
  // CALVES
  // ─────────────────────────────────────────────
  {
    id: "standing-calf-raise",
    name: "Standing Calf Raise",
    primaryMuscle: "calves",
    type: "isolation",
    equipment: "machine",
    secondaryMuscles: [],
  },
  {
    id: "seated-calf-raise",
    name: "Seated Calf Raise",
    primaryMuscle: "calves",
    type: "isolation",
    equipment: "machine",
    secondaryMuscles: [],
  },

  // ─────────────────────────────────────────────
  // ABS
  // ─────────────────────────────────────────────
  {
    id: "cable-crunch",
    name: "Cable Crunch",
    primaryMuscle: "abs",
    type: "isolation",
    equipment: "cable",
    secondaryMuscles: [],
  },
  {
    id: "cardio",
    name: "Cardio",
    primaryMuscle: "abs",
    type: "isolation",
    equipment: "bodyweight",
    secondaryMuscles: [],
  },

  // ─────────────────────────────────────────────
  // NECK
  // ─────────────────────────────────────────────
  {
    id: "neck-curl",
    name: "Neck Curl",
    primaryMuscle: "neck",
    type: "isolation",
    equipment: "bodyweight",
    secondaryMuscles: [],
  },
  {
    id: "neck-flexion",
    name: "Neck Flexion",
    primaryMuscle: "neck",
    type: "isolation",
    equipment: "bodyweight",
    secondaryMuscles: [],
  },

  // ─────────────────────────────────────────────
  // FOREARMS
  // ─────────────────────────────────────────────
  {
    id: "wrist-flexion-extension",
    name: "Wrist Flexion/Extension",
    primaryMuscle: "forearms",
    type: "isolation",
    equipment: "dumbbell",
    secondaryMuscles: [],
  },
];

// ─────────────────────────────────────────────────────────────────────────────
// Lookup helpers
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Find an exercise by name.
 * 1. Exact match (case-insensitive)
 * 2. Prefix match — query is a prefix of the stored name (e.g. "Hip Thrust"
 *    matches "Hip Thrust (Barbell)")
 * Returns the first match found; undefined if nothing matches.
 */
export function findExercise(query: string): ExerciseDefinition | undefined {
  const q = query.toLowerCase().trim();

  // Pass 1: exact match
  const exact = EXERCISE_LIBRARY.find((e) => e.name.toLowerCase() === q);
  if (exact) return exact;

  // Pass 2: prefix match (query is a prefix of the stored name)
  const prefix = EXERCISE_LIBRARY.find((e) =>
    e.name.toLowerCase().startsWith(q)
  );
  return prefix;
}

/**
 * Return all exercises whose primary muscle matches the given group.
 */
export function getExercisesForMuscle(
  muscle: MuscleGroup
): ExerciseDefinition[] {
  return EXERCISE_LIBRARY.filter((e) => e.primaryMuscle === muscle);
}
