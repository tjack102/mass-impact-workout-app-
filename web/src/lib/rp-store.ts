import type { HouseholdUser } from "@/lib/household-profiles";
import type { RpProgramState, RpRatingEntry } from "./rp-types";
import { readJson, writeJson } from "./storage-utils";

// ---------------------------------------------------------------------------
// Dedupe: fix duplicate exercise names on the same day
// ---------------------------------------------------------------------------

type RpSelection = { exerciseName: string; tenRepMax: number };
type SlotInfo = { slotId: string; dayNumber: number; muscleCategory: string };

/**
 * Pure function: detect duplicate exercise names on the same day and fix them.
 * Returns patched selections object if changes were made, null otherwise.
 */
export function dedupeRpSelections(
  selections: Record<string, RpSelection>,
  slots: SlotInfo[],
  getPool: (category: string) => string[],
): Record<string, RpSelection> | null {
  const byDay = new Map<number, SlotInfo[]>();
  for (const slot of slots) {
    const arr = byDay.get(slot.dayNumber) ?? [];
    arr.push(slot);
    byDay.set(slot.dayNumber, arr);
  }

  let changed = false;
  const patched = { ...selections };

  for (const daySlots of byDay.values()) {
    const usedNames = new Set<string>();
    for (const slot of daySlots) {
      const sel = patched[slot.slotId];
      if (!sel) continue;
      if (!usedNames.has(sel.exerciseName)) {
        usedNames.add(sel.exerciseName);
        continue;
      }
      const pool = getPool(slot.muscleCategory);
      const alt = pool.find((e) => !usedNames.has(e));
      if (alt) {
        patched[slot.slotId] = { ...sel, exerciseName: alt };
        usedNames.add(alt);
        changed = true;
      }
    }
  }

  return changed ? patched : null;
}

// ---------------------------------------------------------------------------
// Storage key
// ---------------------------------------------------------------------------

const STORAGE_KEY = "mi_rp_state";

// ---------------------------------------------------------------------------
// Private helpers (same pattern as volume-store.ts)
// ---------------------------------------------------------------------------

// ---------------------------------------------------------------------------
// Public API
// ---------------------------------------------------------------------------

/**
 * Read the RP program state for a user.
 * Returns null if no state has been saved (e.g. fresh program selection).
 */
export function getRpState(user: HouseholdUser): RpProgramState | null {
  const raw = readJson(STORAGE_KEY);
  if (!raw || typeof raw !== "object") {
    return null;
  }

  const byUser = raw as Partial<Record<HouseholdUser, unknown>>;
  const userState = byUser[user];

  if (!userState || typeof userState !== "object") {
    return null;
  }

  // Minimal shape validation -- we trust our own writes, but guard against
  // corrupted or partially-migrated data.
  const state = userState as Partial<RpProgramState>;
  if (
    typeof state.templateId === "string" &&
    typeof state.currentMeso === "string" &&
    typeof state.currentWeek === "number" &&
    state.selections !== null &&
    typeof state.selections === "object" &&
    Array.isArray(state.ratings)
  ) {
    return state as RpProgramState;
  }

  return null;
}

/**
 * Persist the full RP program state for a user.
 * Reads the current record first so the other user's data is preserved.
 */
export function saveRpState(user: HouseholdUser, state: RpProgramState): void {
  const raw = readJson(STORAGE_KEY);
  const byUser = (raw && typeof raw === "object" ? raw : {}) as Record<HouseholdUser, RpProgramState | null>;

  byUser[user] = state;
  writeJson(STORAGE_KEY, byUser);
}

/**
 * Append a rating entry to the user's RP state.
 * No-op if the user has no active RP state (defensive -- callers should check).
 */
export function addRating(user: HouseholdUser, entry: RpRatingEntry): void {
  const state = getRpState(user);
  if (!state) {
    return;
  }

  const updated: RpProgramState = {
    ...state,
    ratings: [...state.ratings, entry],
  };

  saveRpState(user, updated);
}

/**
 * Wipe the RP state for a user.
 * Called when the user switches away from an RP program (spec: mid-meso switch edge case).
 */
export function clearRpState(user: HouseholdUser): void {
  const raw = readJson(STORAGE_KEY);
  const byUser = (raw && typeof raw === "object" ? raw : {}) as Record<HouseholdUser, RpProgramState | null>;

  byUser[user] = null;
  writeJson(STORAGE_KEY, byUser);
}
