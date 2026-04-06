// Maps RP Male Physique Training muscle categories to exercise names.
//
// All names use exercise-library.ts canonical names where a clear match exists.
// RP exercises with no match in exercise-library.ts are kept under their RP name
// (they need to be added to exercise-library.ts before they can be used in the engine).
//
// HOW NAMES WERE RESOLVED
// RP uses "Equipment Exercise" ordering; the app uses "Exercise (Equipment)".
// Example: "Barbell Bent Over Row" -> "Bent Over Row (Barbell)"
// Matches were found via: exact, prefix, and manual inspection.
//
// UNMATCHED RP EXERCISES (58 unique -- need adding to exercise-library.ts to use):
//   Abs:             Machine Crunch, Slant Board Sit-Up, Reaching Sit-Up, V-Up,
//                    Modified Candlestick, Hanging Knee Raise
//   Biceps:          Close Grip Barbell Curl, 2-Arm Dumbbell Curl, Dummbell Twist Curl [sic],
//                    Alternating Dumbbell Curl, Cable Rope Twist Curl
//   Calves:          Stair Calves, Smith Machine Calves
//   Chest Isolation: Flat Dumbbell Flye, High Cable Flye, Cable Incline Flye
//   Front Delts:     Standing Barbell Shoulder Press, Seated Barbell Shoulder Press,
//                    High Incline Dumbbell Press, Standing Dumbbell Shoulder Press
//   Glutes:          Barbell Walking Lunge, Sumo Squat, Deficit Deadlift, 25's Deadlift,
//                    Sumo Deadlift, Deadlift, Hex Bar Deadlift
//   Hamstrings:      Stiff-Legged Deadlift, Single-Leg Leg Curl
//   Horizontal Back: Underhand EZ Bar Row, Row to Chest, 2-Arm Dumbbell Row, Row Machine
//   Horizontal Push: Wide Grip Bench Press, Pushup, Close Grip Pushup
//   Incline Push:    Incline Wide Grip Bench Press, Incline Close Grip Bench Press,
//                    Incline Machine Bench Press
//   Quads:           High Bar Squat (mapped to Squat (Barbell)), Close Stance Feet Forward Squats,
//                    Machine Feet Forward Squat
//   Rear Delts:      Barbell Facepull, Dumbbell Facepull
//   Side Delts:      Dumbbell Upright Row, Thumbs Down Lateral Raise
//   Traps:           Barbell Shrug, Barbell Bent Over Shrug, Dumbbell Shrug, Dumbbell Bent Over Shrug
//   Triceps:         EZ Bar Overhead Tricep Extension, Barbell Overhead Tricep Extension,
//                    Seated EZ Bar Overhead Tricep Extension, Seated Barbell Overhead Tricep Extension,
//                    JM Press, Assisted Dips
//   Vertical Back:   Assisted Overhand Pullup, Assisted Parallel Pullup, Assisted Underhand Pullup
//
// NOTE ON COMPOSITE CATEGORIES
// "Horizontal Pull" is RP's label in the category legend but exercises are stored
// under "Horizonal Back" (RP typo). We normalize the key to "Horizontal Pull" here.
// "Incline Push or Front Delts" and "Chest Isolation or Triceps" and
// "Rear Delts or Side Delts" are planning categories RP uses to let users pick
// from two pools -- they share exercises with their constituent categories.

export const RP_CATEGORIES: Record<string, string[]> = {
  Abs: [
    // Unmatched -- add to exercise-library.ts: Machine Crunch, Slant Board Sit-Up,
    // Reaching Sit-Up, V-Up, Modified Candlestick, Hanging Knee Raise
    "Machine Crunch",
    "Slant Board Sit-Up",
    "Reaching Sit-Up",
    "V-Up",
    "Modified Candlestick",
    "Hanging Knee Raise",
    "Hanging Leg Raise", // "Hanging Strait Leg Raise" in RP (typo)
  ],

  Biceps: [
    "Bicep Curl (Barbell)", // RP: "Barbell Curl"
    "EZ Bar Curl",          // RP: "EZ Curl"
    // Unmatched: Close Grip Barbell Curl
    "Close Grip Barbell Curl",
    // Unmatched: 2-Arm Dumbbell Curl (no plain dumbbell curl in library)
    "2-Arm Dumbbell Curl",
    "Standard Cable Curl",  // RP: "Cable Curl"
    "Incline Curl (Dumbbell)", // RP: "Incline Dumbbell Curl"
    // Unmatched: Dummbell Twist Curl [sic in RP]
    "Dummbell Twist Curl",
    "Hammer Curl",
    "Spider Curl",          // RP: "Dumbbell Spider Curl" (library entry is Machine)
    // Unmatched: Alternating Dumbbell Curl
    "Alternating Dumbbell Curl",
    // Unmatched: Cable Rope Twist Curl
    "Cable Rope Twist Curl",
  ],

  Calves: [
    "Standing Calf Raise",    // RP: "Calves on Calf Machine"
    // Unmatched: Stair Calves
    "Stair Calves",
    "Leg Press Calf Raise",   // RP: "Calves on Leg Press"
    // Unmatched: Smith Machine Calves
    "Smith Machine Calves",
  ],

  "Chest Isolation": [
    // Unmatched: Flat Dumbbell Flye (library has Incline DB Fly but not flat)
    "Flat Dumbbell Flye",
    "Incline DB Fly",         // RP: "Incline Dumbbell Flye"
    "Cable Chest Fly",        // RP: "Cable Flye"
    // Unmatched: High Cable Flye
    "High Cable Flye",
    "Pec Deck (Machine)",     // RP: "Machine Chest Flye" and "Pec Dec Flye"
    // Unmatched: Cable Incline Flye
    "Cable Incline Flye",
  ],

  "Horizontal Pull": [
    "Bent Over Row (Barbell)",    // RP: "Barbell Bent Over Row"
    // Unmatched: Underhand EZ Bar Row
    "Underhand EZ Bar Row",
    // Unmatched: Row to Chest
    "Row to Chest",
    "Single Arm Row (Dumbbell)",  // RP: "1-Arm Dumbbell Row"
    "Chest-Supported Row",        // RP: "Chest Supported Row"
    // Unmatched: Row Machine (distinct from machine row in library which is 1-arm)
    "Row Machine",
    // Unmatched: 2-Arm Dumbbell Row
    "2-Arm Dumbbell Row",
    "Seated Row (Cable)",         // RP: "Cable Row"
  ],

  "Horizontal Push": [
    "Bench Press (Barbell)",    // RP: "Medium Grip Bench Press"
    // Unmatched: Wide Grip Bench Press
    "Wide Grip Bench Press",
    "Flat Dumbbell Press",      // RP: "Flat Dumbbell Bench Press"
    "Close Grip Bench Press",
    "Chest Press (Machine)",    // RP: "Flat Machine Bench Press"
    // Unmatched: Pushup (library has Deficit Push-Up but not plain pushup)
    "Pushup",
    // Unmatched: Close Grip Pushup
    "Close Grip Pushup",
  ],

  "Horizontal Triceps": [
    "Skull Crusher",            // RP: "Skullcrusher" and "Bar Skull"
    // Unmatched: JM Press (library has Smith Machine JM Press only)
    "JM Press",
    "Dip (Weighted)",           // RP: "Dips"
    // Unmatched: Assisted Dips
    "Assisted Dips",
    "Dumbbell Skull Crusher",   // RP: "Dumbbell Skullcrusher"
    "Tricep Pushdown",          // RP: "Cable Tricep Pushdown" and "Cable Rope Pushdown"
  ],

  "Incline Push": [
    "Incline Bench Press (Barbell)",  // RP: "Incline Medium Grip Bench Press"
    // Unmatched: Incline Wide Grip Bench Press
    "Incline Wide Grip Bench Press",
    "Incline Bench Press (Dumbbell)", // RP: "Low Incline Dumbbell Press" and "Incline Dumbbell Press"
    // Unmatched: Incline Close Grip Bench Press
    "Incline Close Grip Bench Press",
    // Unmatched: Incline Machine Bench Press
    "Incline Machine Bench Press",
  ],

  "Front Delts": [
    // Unmatched: Standing Barbell Shoulder Press (no standing barbell OHP in library)
    "Standing Barbell Shoulder Press",
    // Unmatched: Seated Barbell Shoulder Press
    "Seated Barbell Shoulder Press",
    "Seated Shoulder Press (Dumbbell)", // RP: "Seated Dumbbell Shoulder Press"
    // Unmatched: High Incline Dumbbell Press
    "High Incline Dumbbell Press",
    "Machine Shoulder Press",           // RP: "Shoulder Press Machine"
    // Unmatched: Standing Dumbbell Shoulder Press
    "Standing Dumbbell Shoulder Press",
  ],

  "Vertical Pull": [
    "Pull-Up (Bodyweight)",           // RP: "Overhand Pullup", "Underhand Pullup", "Wide Grip Pullup"
    "Pull-Up (Neutral Grip, Bodyweight)", // RP: "Parallel Pullup"
    // Unmatched: Assisted Overhand Pullup, Assisted Parallel Pullup, Assisted Underhand Pullup
    "Assisted Overhand Pullup",
    "Assisted Parallel Pullup",
    "Assisted Underhand Pullup",
    "Lat Pulldown",                   // RP: "Normal Grip Pulldown", "Underhand Pulldown"
    "Narrow Neutral Pulldown",        // RP: "Parallel Pulldown", "Narrow Grip Pulldown"
    "Wide Overhand Pulldown",         // RP: "Wide-Grip Pulldown"
  ],

  "Vertical Triceps": [
    // Unmatched: EZ Bar Overhead Tricep Extension
    "EZ Bar Overhead Tricep Extension",
    // Unmatched: Barbell Overhead Tricep Extension
    "Barbell Overhead Tricep Extension",
    // Unmatched: Seated EZ Bar Overhead Tricep Extension
    "Seated EZ Bar Overhead Tricep Extension",
    // Unmatched: Seated Barbell Overhead Tricep Extension
    "Seated Barbell Overhead Tricep Extension",
    "Overhead Tricep Extension (Cable)", // RP: "Cable Overhead Tricep Extension"
  ],

  Triceps: [
    "Skull Crusher",                   // RP: "Skullcrusher" and "Bar Skull"
    "EZ Bar Overhead Tricep Extension",
    // Unmatched: JM Press
    "JM Press",
    "Barbell Overhead Tricep Extension",
    "Dip (Weighted)",                  // RP: "Dips"
    "Seated EZ Bar Overhead Tricep Extension",
    // Unmatched: Assisted Dips
    "Assisted Dips",
    "Seated Barbell Overhead Tricep Extension",
    "Dumbbell Skull Crusher",          // RP: "Dumbbell Skullcrusher"
    "Overhead Tricep Extension (Cable)", // RP: "Cable Overhead Tricep Extension"
    "Tricep Pushdown",                 // RP: "Cable Tricep Pushdown" and "Cable Rope Pushdown"
  ],

  Quads: [
    "Squat (Barbell)",          // RP: "High Bar Squat"
    // Unmatched: Close Stance Feet Forward Squats
    "Close Stance Feet Forward Squats",
    // Unmatched: Machine Feet Forward Squat
    "Machine Feet Forward Squat",
    "Leg Press",
    "Hack Squat",
    "Front Squat (Barbell)",    // RP: "Front Squat" and "Front Squat (Alernate Grip)" [sic]
  ],

  Glutes: [
    // Unmatched: Barbell Walking Lunge (library has dumbbell version only)
    "Barbell Walking Lunge",
    "Walking Lunge (Dumbbell)",
    // Unmatched: Sumo Squat
    "Sumo Squat",
    // Unmatched: Deficit Deadlift, 25's Deadlift, Sumo Deadlift, Deadlift, Hex Bar Deadlift
    "Deficit Deadlift",
    "25's Deadlift",
    "Sumo Deadlift",
    "Deadlift",
    "Hex Bar Deadlift",
  ],

  "Hamstrings Hip Hinge": [
    // Unmatched: Stiff-Legged Deadlift (library has Romanian Deadlift but not SLDL)
    "Stiff-Legged Deadlift",
    "Good Morning",             // RP: "Low Bar Good Morning" and "High Bar Good Morning"
    "45-Degree Back Extension", // RP: "45 Degree Back Raise"
  ],

  "Hamstrings Isolation": [
    "Lying Leg Curl",
    "Seated Hamstring Curl",    // RP: "Seated Leg Curl"
    // Unmatched: Single-Leg Leg Curl
    "Single-Leg Leg Curl",
  ],

  "Rear Delts": [
    // Unmatched: Barbell Facepull, Dumbbell Facepull
    "Barbell Facepull",
    "Dumbbell Facepull",
    "Face Pull",                          // RP: "Cable Facepull"
    "Chest-Supported Rear Delt Fly",      // RP: "Dumbbell Rear Lateral Raise" (closest match)
  ],

  "Side Delts": [
    "Upright Row (Barbell)",    // RP: "Barbell Upright Row"
    // Unmatched: Dumbbell Upright Row
    "Dumbbell Upright Row",
    "Cable Upright Row",
    "Lateral Raise (Dumbbell)", // RP: "Dumbbell Side Lateral Raise"
    // Unmatched: Thumbs Down Lateral Raise
    "Thumbs Down Lateral Raise",
  ],

  Traps: [
    // All four unmatched -- library has Power Shrug, Overhead Shrug, Upright Row but not plain shrugs
    "Barbell Shrug",
    "Barbell Bent Over Shrug",
    "Dumbbell Shrug",
    "Dumbbell Bent Over Shrug",
  ],

  // Composite categories RP uses for program flexibility (exercises overlap with above)
  "Incline Push or Front Delts": [
    "Incline Bench Press (Barbell)",    // RP: "Incline Medium Grip Bench Press"
    "Incline Wide Grip Bench Press",
    "Incline Bench Press (Dumbbell)",   // RP: "Low Incline Dumbbell Press" and "Incline Dumbbell Press"
    "Incline Close Grip Bench Press",
    "Incline Machine Bench Press",
    "Standing Barbell Shoulder Press",
    "Seated Barbell Shoulder Press",
    "Seated Shoulder Press (Dumbbell)",
    "High Incline Dumbbell Press",
    "Machine Shoulder Press",
    "Standing Dumbbell Shoulder Press",
  ],

  "Chest Isolation or Triceps": [
    "Flat Dumbbell Flye",
    "Incline DB Fly",
    "Cable Chest Fly",
    "High Cable Flye",
    "Pec Deck (Machine)",
    "Cable Incline Flye",
    "Skull Crusher",
    "EZ Bar Overhead Tricep Extension",
    "JM Press",
    "Barbell Overhead Tricep Extension",
    "Dip (Weighted)",
    "Seated EZ Bar Overhead Tricep Extension",
    "Assisted Dips",
    "Seated Barbell Overhead Tricep Extension",
    "Dumbbell Skull Crusher",
    "Overhead Tricep Extension (Cable)",
    "Tricep Pushdown",
  ],

  "Rear Delts or Side Delts": [
    "Barbell Facepull",
    "Upright Row (Barbell)",
    "Dumbbell Facepull",
    "Dumbbell Upright Row",
    "Face Pull",
    "Cable Upright Row",
    "Chest-Supported Rear Delt Fly",
    "Lateral Raise (Dumbbell)",
    "Thumbs Down Lateral Raise",
  ],
};

/**
 * Return the exercise list for a given RP category name.
 * Returns an empty array if the category doesn't exist.
 */
export function getRpExercisesForCategory(category: string): string[] {
  return RP_CATEGORIES[category] ?? [];
}

/**
 * Return all RP category names.
 */
export function getRpCategoryNames(): string[] {
  return Object.keys(RP_CATEGORIES);
}
