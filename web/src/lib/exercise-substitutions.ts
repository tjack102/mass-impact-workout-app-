import type { HouseholdUser } from "./household-profiles";

const STORAGE_KEY = "mi_substitutions";

type SubstitutionMap = Record<string, string>;
type PermanentSubstitutions = Record<HouseholdUser, SubstitutionMap>;

function buildKey(programId: string, day: number, exerciseName: string): string {
  return `${programId}:${day}:${exerciseName}`;
}

function load(): PermanentSubstitutions {
  if (typeof window === "undefined") return { his: {}, hers: {} };
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    return raw ? JSON.parse(raw) : { his: {}, hers: {} };
  } catch {
    return { his: {}, hers: {} };
  }
}

function save(data: PermanentSubstitutions): void {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
}

export function getPermanentSub(
  user: HouseholdUser,
  programId: string,
  day: number,
  exerciseName: string,
): string | undefined {
  return load()[user][buildKey(programId, day, exerciseName)];
}

export function setPermanentSub(
  user: HouseholdUser,
  programId: string,
  day: number,
  exerciseName: string,
  replacement: string,
): void {
  const data = load();
  data[user][buildKey(programId, day, exerciseName)] = replacement;
  save(data);
}

export function clearPermanentSub(
  user: HouseholdUser,
  programId: string,
  day: number,
  exerciseName: string,
): void {
  const data = load();
  delete data[user][buildKey(programId, day, exerciseName)];
  save(data);
}

export function getAllPermanentSubs(user: HouseholdUser): SubstitutionMap {
  return load()[user];
}
