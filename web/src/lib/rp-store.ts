import type { HouseholdUser } from "@/lib/household-profiles";
import type { RpProgramState, RpRatingEntry } from "./rp-types";
import { readJson, writeJson } from "./storage-utils";
import { getRpTemplate } from "./program-registry";
import { getRpExercisesForCategory } from "./rp-exercise-library";

// ---------------------------------------------------------------------------
// Storage key
// ---------------------------------------------------------------------------

const STORAGE_KEY = "mi_rp_state";

// ---------------------------------------------------------------------------
// Private helpers (same pattern as volume-store.ts)
// ---------------------------------------------------------------------------

// ---------------------------------------------------------------------------
// Migration: fix duplicate exercises on the same day
// ---------------------------------------------------------------------------

function dedupeSelections(state: RpProgramState, user: HouseholdUser): void {
  const template = getRpTemplate(state.templateId);
  if (!template) return;

  // Group slots by day
  const slotsByDay = new Map<number, typeof template.slots>();
  for (const slot of template.slots) {
    const arr = slotsByDay.get(slot.dayNumber) ?? [];
    arr.push(slot);
    slotsByDay.set(slot.dayNumber, arr);
  }

  let changed = false;
  for (const daySlots of slotsByDay.values()) {
    const usedNames = new Set<string>();
    for (const slot of daySlots) {
      const sel = state.selections[slot.slotId];
      if (!sel) continue;
      if (!usedNames.has(sel.exerciseName)) {
        usedNames.add(sel.exerciseName);
        continue;
      }
      // Duplicate -- pick next unused exercise from this slot's category
      const pool = getRpExercisesForCategory(slot.muscleCategory);
      const alt = pool.find((e) => !usedNames.has(e));
      if (alt) {
        sel.exerciseName = alt;
        usedNames.add(alt);
        changed = true;
      }
    }
  }

  if (changed) {
    saveRpState(user, state);
  }
}

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
    const validated = state as RpProgramState;
    dedupeSelections(validated, user);
    return validated;
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
