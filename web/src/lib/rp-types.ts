export type RpMesoType = "basic" | "metabolite" | "resensitization";

export interface RpExerciseSlot {
  slotId: string;              // e.g. "d1-01"
  muscleCategory: string;      // e.g. "Horizontal Push", "Biceps", "Quads"
  dayNumber: number;
  order: number;
  // which slot's recovery rating drives set counts for THIS slot
  pairedSlotId: string | null;
  supersetWith?: string;       // slotId of partner exercise (Meso 2 only)
  // false for legs (quads, glutes, hamstrings, calves) -- fixed sets regardless of rating
  isAutoregulated: boolean;
  baseSets: Record<RpMesoType, number>;
}

export interface RpTemplate {
  id: string;
  name: string;
  daysPerWeek: number;
  dayTitles: string[];
  restDayPattern: number[];    // rest days between training days
  slots: RpExerciseSlot[];
  exerciseCategories: Record<string, string[]>; // category -> exercise names
}

export interface RpProgramState {
  templateId: string;
  currentMeso: RpMesoType;
  currentWeek: number;
  selections: Record<string, {  // keyed by slotId
    exerciseName: string;
    tenRepMax: number;
  }>;
  ratings: RpRatingEntry[];
}

export interface RpRatingEntry {
  slotId: string;
  week: number;
  meso: RpMesoType;
  value: -1 | 0 | 1;
}
