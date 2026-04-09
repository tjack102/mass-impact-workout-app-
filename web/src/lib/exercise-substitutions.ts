import type { HouseholdUser } from "./household-profiles";
import { readJson, writeJson } from "./storage-utils";

const STORAGE_KEY = "mi_substitutions";

type SubstitutionMap = Record<string, string>;
type PermanentSubstitutions = Record<HouseholdUser, SubstitutionMap>;

function buildKey(programId: string, day: number, exerciseName: string, slotId?: string): string {
  // slotId disambiguates when the same exercise appears in multiple slots (e.g. RP Quads)
  return slotId ? `${programId}:${day}:${slotId}` : `${programId}:${day}:${exerciseName}`;
}

function load(): PermanentSubstitutions {
  return (readJson(STORAGE_KEY) as PermanentSubstitutions) ?? { his: {}, hers: {} };
}

function save(data: PermanentSubstitutions): void {
  writeJson(STORAGE_KEY, data);
}

export function getPermanentSub(
  user: HouseholdUser,
  programId: string,
  day: number,
  exerciseName: string,
  slotId?: string,
): string | undefined {
  return load()[user][buildKey(programId, day, exerciseName, slotId)];
}

export function setPermanentSub(
  user: HouseholdUser,
  programId: string,
  day: number,
  exerciseName: string,
  replacement: string,
  slotId?: string,
): void {
  const data = load();
  data[user][buildKey(programId, day, exerciseName, slotId)] = replacement;
  save(data);
}

export function clearPermanentSub(
  user: HouseholdUser,
  programId: string,
  day: number,
  exerciseName: string,
  slotId?: string,
): void {
  const data = load();
  delete data[user][buildKey(programId, day, exerciseName, slotId)];
  save(data);
}

export function getAllPermanentSubs(user: HouseholdUser): SubstitutionMap {
  return load()[user];
}

/**
 * Rewrite old exercise-name-keyed permanent subs to slotId-keyed subs for RP programs.
 * Idempotent -- already-migrated keys are skipped.
 */
export function migrateRpSubKeys(
  user: HouseholdUser,
  programId: string,
  slots: { slotId: string; dayNumber: number }[],
  selections: Record<string, { exerciseName: string }>,
): void {
  const data = load();
  const userSubs = data[user];
  let changed = false;

  for (const slot of slots) {
    const sel = selections[slot.slotId];
    if (!sel) continue;
    const oldKey = `${programId}:${slot.dayNumber}:${sel.exerciseName}`;
    const newKey = `${programId}:${slot.dayNumber}:${slot.slotId}`;
    if (userSubs[oldKey] !== undefined && userSubs[newKey] === undefined) {
      userSubs[newKey] = userSubs[oldKey];
      delete userSubs[oldKey];
      changed = true;
    }
  }

  if (changed) {
    save(data);
  }
}
