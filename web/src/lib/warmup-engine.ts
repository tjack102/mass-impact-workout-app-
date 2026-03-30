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

const BAR_WEIGHT = 45;

function roundTo(value: number, increment: number): number {
  return Math.round(value / increment) * increment;
}

function clampToBar(weight: number): number {
  return Math.max(weight, BAR_WEIGHT);
}

function getIntermediateCount(workingWeight: number): number {
  if (workingWeight <= 200) return 2;
  if (workingWeight <= 400) return 3;
  return 4;
}

function dedup(sets: WarmupSet[]): WarmupSet[] {
  const result: WarmupSet[] = [];
  for (const set of sets) {
    const prev = result[result.length - 1];
    if (prev && prev.weight === set.weight) {
      if (set.reps > prev.reps) {
        result[result.length - 1] = set;
      }
    } else {
      result.push(set);
    }
  }
  return result;
}

export function calculateWarmupSets(
  workingWeight: number,
  options?: WarmupOptions,
): WarmupSet[] {
  if (workingWeight <= 0) return [];

  const increment = options?.roundingIncrement ?? 5;
  const startPercent = (options?.startPercent ?? 45) / 100;
  const abbreviated = options?.abbreviated ?? false;

  const potentiation: WarmupSet = {
    weight: roundTo(workingWeight, increment),
    reps: 3,
    repsDisplay: "2-3",
    label: "Potentiation",
  };

  if (workingWeight <= BAR_WEIGHT) {
    return [potentiation];
  }

  if (workingWeight <= 65) {
    if (abbreviated) return [potentiation];
    const lightWeight = clampToBar(roundTo(workingWeight * startPercent, increment));
    return dedup([
      { weight: lightWeight, reps: 10, repsDisplay: "10", label: "Light" },
      potentiation,
    ]);
  }

  const lightWeight = clampToBar(roundTo(workingWeight * startPercent, increment));

  if (abbreviated) {
    const midWeight = clampToBar(roundTo((lightWeight + workingWeight) / 2, increment));
    return dedup([
      { weight: midWeight, reps: 5, repsDisplay: "5", label: "Intermediate 1" },
      potentiation,
    ]);
  }

  const intermediateCount = getIntermediateCount(workingWeight);
  const gap = workingWeight - lightWeight;
  const step = gap / (intermediateCount + 1);

  const sets: WarmupSet[] = [
    { weight: lightWeight, reps: 10, repsDisplay: "10", label: "Light" },
  ];

  for (let i = 1; i <= intermediateCount; i++) {
    const raw = lightWeight + step * i;
    sets.push({
      weight: clampToBar(roundTo(raw, increment)),
      reps: 5,
      repsDisplay: "5",
      label: `Intermediate ${i}`,
    });
  }

  sets.push(potentiation);
  return dedup(sets);
}
