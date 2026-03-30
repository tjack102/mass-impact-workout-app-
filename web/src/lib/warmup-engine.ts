export type WarmupSet = {
  weight: number;
  reps: number;
  repsDisplay: string;
  label: string;
};

export type WarmupOptions = {
  roundingIncrement?: number;
  startPercent?: number;
  abbreviated?: boolean;
};

export function calculateWarmupSets(
  workingWeight: number,
  options?: WarmupOptions,
): WarmupSet[] {
  return [];
}
