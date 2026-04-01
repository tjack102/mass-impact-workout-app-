import type { HouseholdUser } from "./household-profiles";
import type { ProgramExercise } from "./program-data";

const STORAGE_KEY = "mi_additions";

type AdditionsMap = Record<string, ProgramExercise[]>;
type ProgramAdditions = Record<HouseholdUser, AdditionsMap>;

function buildKey(programId: string, day: number): string {
  return `${programId}:${day}`;
}

function load(): ProgramAdditions {
  if (typeof window === "undefined") return { his: {}, hers: {} };
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    return raw ? JSON.parse(raw) : { his: {}, hers: {} };
  } catch {
    return { his: {}, hers: {} };
  }
}

function save(data: ProgramAdditions): void {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
}

export function getAdditions(
  user: HouseholdUser,
  programId: string,
  day: number,
): ProgramExercise[] {
  return load()[user][buildKey(programId, day)] ?? [];
}

export function addExerciseToDay(
  user: HouseholdUser,
  programId: string,
  day: number,
  exercise: ProgramExercise,
): void {
  const data = load();
  const key = buildKey(programId, day);
  const existing = data[user][key] ?? [];
  data[user][key] = [...existing, exercise];
  save(data);
}

export function removeAddition(
  user: HouseholdUser,
  programId: string,
  day: number,
  exerciseName: string,
): void {
  const data = load();
  const key = buildKey(programId, day);
  const existing = data[user][key] ?? [];
  data[user][key] = existing.filter((e) => e.name !== exerciseName);
  if (data[user][key].length === 0) delete data[user][key];
  save(data);
}
